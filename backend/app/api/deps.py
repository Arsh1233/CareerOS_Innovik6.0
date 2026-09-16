"""Shared FastAPI dependencies.

Authorisation lives here: routes declare the roles they accept and identity is
always derived from a verified token.
"""

from __future__ import annotations

from typing import Any, Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.core.security import decode_access_token, role_from_claims
from app.integrations.supabase import SupabaseAuthClient
from app.repositories.profiles import ProfilesRepository
from app.services.auth_service import AuthService

bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Supabase access token issued by POST /auth/login.",
)


class CurrentUser(BaseModel):
    """Verified caller identity. Never constructed from client input."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    email: str | None = None
    role: str | None = None
    claims: dict[str, Any]
    access_token: str


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "") or ""


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise ApiError(401, "not_authenticated", "Authentication required.")

    claims = decode_access_token(credentials.credentials, settings)
    return CurrentUser(
        id=str(claims["sub"]),
        email=claims.get("email"),
        role=role_from_claims(claims),
        claims=claims,
        access_token=credentials.credentials,
    )


def require_roles(*allowed: str) -> Callable[..., Any]:
    """Dependency factory that restricts a route to specific platform roles."""

    async def _dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role is None:
            raise ApiError(
                403,
                "role_not_assigned",
                "This account has no CareerOS role assigned. Please contact support.",
            )
        if user.role not in allowed:
            raise ApiError(
                403,
                "forbidden",
                "Your role is not permitted to perform this action.",
                {"required_roles": list(allowed)},
            )
        return user

    return _dependency


# ── service providers (overridable in tests) ──────────────────────────────


def get_supabase_auth_client(settings: Settings = Depends(get_settings)) -> SupabaseAuthClient:
    return SupabaseAuthClient(settings)


def get_profiles_repository() -> ProfilesRepository:
    return ProfilesRepository()


def get_auth_service(
    auth_client: SupabaseAuthClient = Depends(get_supabase_auth_client),
    profiles: ProfilesRepository = Depends(get_profiles_repository),
) -> AuthService:
    return AuthService(auth_client=auth_client, profiles=profiles)


def get_postgrest_client(settings: Settings = Depends(get_settings)):
    from app.integrations.postgrest import PostgRESTClient
    return PostgRESTClient(settings)
