"""Supabase JWT verification.

The frontend authenticates against Supabase Auth and sends the resulting access
token as `Authorization: Bearer <token>`. This module is the only place that
turns that token into an identity, and it always verifies the signature:

* Asymmetric signing keys (ES256/RS256, current Supabase projects) are verified
  against the project JWKS endpoint.
* Legacy projects that sign with a shared HS256 secret are verified with
  `SUPABASE_JWT_SECRET`.

Identity is taken strictly from verified claims. `app_metadata` is used for the
platform role because only the service role can write it — `user_metadata` is
user-editable and is therefore never trusted for authorisation.
"""

from __future__ import annotations

import logging
from typing import Any

import jwt
from jwt import PyJWKClient

from app.core.config import Settings
from app.core.errors import ApiError
from app.core.roles import is_valid_role

logger = logging.getLogger("careeros.security")

SUPABASE_AUDIENCE = "authenticated"
_ASYMMETRIC_ALGORITHMS = ("ES256", "RS256", "EdDSA")
_jwks_clients: dict[str, PyJWKClient] = {}


def _jwks_client(settings: Settings) -> PyJWKClient:
    cached = _jwks_clients.get(settings.jwks_url)
    if cached is None:
        cached = PyJWKClient(settings.jwks_url, cache_keys=True, lifespan=600)
        _jwks_clients[settings.jwks_url] = cached
    return cached


def _signing_key(token: str, algorithm: str, settings: Settings) -> Any:
    if algorithm.startswith("HS"):
        if not settings.supabase_jwt_secret:
            raise ApiError(
                503,
                "auth_not_configured",
                "Server cannot verify HS256 tokens: SUPABASE_JWT_SECRET is not configured.",
            )
        return settings.supabase_jwt_secret

    if not settings.supabase_url:
        raise ApiError(
            503,
            "auth_not_configured",
            "Server cannot verify signed tokens: SUPABASE_URL is not configured.",
        )
    try:
        return _jwks_client(settings).get_signing_key_from_jwt(token).key
    except Exception as exc:  # network/JWKS failures must not look like a valid token
        logger.warning("jwks_lookup_failed error=%s", type(exc).__name__)
        raise ApiError(
            503,
            "auth_verification_unavailable",
            "Unable to verify the access token right now. Please retry.",
        ) from exc


def decode_access_token(token: str, settings: Settings) -> dict[str, Any]:
    """Verify a Supabase access token and return its claims."""
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        raise ApiError(401, "invalid_token", "Access token is malformed.") from exc

    algorithm = str(header.get("alg", ""))
    if algorithm not in _ASYMMETRIC_ALGORITHMS and not algorithm.startswith("HS"):
        raise ApiError(401, "invalid_token", "Access token uses an unsupported signing algorithm.")

    try:
        claims = jwt.decode(
            token,
            _signing_key(token, algorithm, settings),
            algorithms=[algorithm],
            audience=SUPABASE_AUDIENCE,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise ApiError(401, "token_expired", "Session expired. Please sign in again.") from exc
    except jwt.InvalidAudienceError as exc:
        raise ApiError(401, "invalid_token", "Access token audience is not accepted.") from exc
    except jwt.PyJWTError as exc:
        raise ApiError(401, "invalid_token", "Access token is invalid.") from exc

    if not claims.get("sub"):
        raise ApiError(401, "invalid_token", "Access token does not identify a user.")
    return claims


def role_from_claims(claims: dict[str, Any]) -> str | None:
    """Read the platform role from server-controlled claims only."""
    app_metadata = claims.get("app_metadata") or {}
    if not isinstance(app_metadata, dict):
        return None
    role = app_metadata.get("role")
    if isinstance(role, str) and is_valid_role(role):
        return role
    return None


def email_from_claims(claims: dict[str, Any]) -> str | None:
    email = claims.get("email")
    return email if isinstance(email, str) and email else None


def full_name_from_claims(claims: dict[str, Any]) -> str | None:
    metadata = claims.get("user_metadata") or {}
    if isinstance(metadata, dict):
        for key in ("full_name", "name", "display_name"):
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None
