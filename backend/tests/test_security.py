"""Token verification and configuration guards."""

from __future__ import annotations

import time
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core.config import Settings
from app.core.errors import ApiError
from app.core.security import decode_access_token, role_from_claims
from app.repositories.profiles import PROFILE_COLUMNS, UPDATABLE_COLUMNS
from tests.conftest import JWT_SECRET, make_token


def test_valid_token_exposes_verified_identity() -> None:
    user_id = str(uuid.uuid4())
    settings = Settings(supabase_jwt_secret=JWT_SECRET)

    claims = decode_access_token(make_token(sub=user_id), settings)

    assert claims["sub"] == user_id
    assert role_from_claims(claims) == "student"


def test_token_signed_with_another_key_is_rejected() -> None:
    settings = Settings(supabase_jwt_secret=JWT_SECRET)

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(make_token(secret="some-other-secret-padded-32byt"), settings)

    assert excinfo.value.status_code == 401
    assert excinfo.value.code == "invalid_token"


def test_expired_token_is_rejected() -> None:
    settings = Settings(supabase_jwt_secret=JWT_SECRET)

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(make_token(expires_in_seconds=-1), settings)

    assert excinfo.value.code == "token_expired"


def test_token_for_another_audience_is_rejected() -> None:
    settings = Settings(supabase_jwt_secret=JWT_SECRET)

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(make_token(audience="some-other-service"), settings)

    assert excinfo.value.code == "invalid_token"


def test_malformed_token_is_rejected() -> None:
    settings = Settings(supabase_jwt_secret=JWT_SECRET)

    with pytest.raises(ApiError) as excinfo:
        decode_access_token("not-a-jwt", settings)

    assert excinfo.value.status_code == 401


def test_unsigned_alg_none_token_is_rejected() -> None:
    settings = Settings(supabase_jwt_secret=JWT_SECRET)
    now = int(time.time())
    forged = jwt.encode(
        {"sub": str(uuid.uuid4()), "aud": "authenticated", "exp": now + 600},
        key="",
        algorithm="none",
    )

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(forged, settings)

    assert excinfo.value.status_code == 401
    assert excinfo.value.code == "invalid_token"


def test_token_without_subject_is_rejected() -> None:
    settings = Settings(supabase_jwt_secret=JWT_SECRET)
    now = int(time.time())
    token = jwt.encode(
        {"aud": "authenticated", "exp": now + 600, "email": "ghost@example.com"},
        JWT_SECRET,
        algorithm="HS256",
    )

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(token, settings)

    assert excinfo.value.status_code == 401


def test_hs256_without_secret_configuration_fails_loudly() -> None:
    settings = Settings(supabase_jwt_secret="")

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(make_token(), settings)

    assert excinfo.value.status_code == 503
    assert excinfo.value.code == "auth_not_configured"


def test_asymmetric_token_without_supabase_url_fails_loudly() -> None:
    settings = Settings(supabase_url="", supabase_jwt_secret="")
    now = int(time.time())
    private_key = ec.generate_private_key(ec.SECP256R1())
    token = jwt.encode(
        {"sub": str(uuid.uuid4()), "aud": "authenticated", "exp": now + 600},
        private_key,
        algorithm="ES256",
    )

    with pytest.raises(ApiError) as excinfo:
        decode_access_token(token, settings)

    assert excinfo.value.status_code == 503
    assert excinfo.value.code == "auth_not_configured"


def test_role_is_read_from_server_controlled_metadata_only() -> None:
    # A user can edit `user_metadata`; it must never grant a role.
    assert role_from_claims({"app_metadata": {}, "user_metadata": {"role": "admin"}}) is None
    assert role_from_claims({"app_metadata": {"role": "not-a-role"}}) is None
    assert role_from_claims({"app_metadata": {"role": "admin"}}) == "admin"
    assert role_from_claims({}) is None


def test_profile_write_whitelist_excludes_owner_and_system_columns() -> None:
    assert "user_id" not in UPDATABLE_COLUMNS
    assert "email" not in UPDATABLE_COLUMNS
    assert set(UPDATABLE_COLUMNS.values()).issubset(set(PROFILE_COLUMNS))
    assert set(UPDATABLE_COLUMNS) == set(UPDATABLE_COLUMNS.values())


def test_capability_report_never_leaks_secret_values() -> None:
    settings = Settings()

    capabilities = settings.capability_report()

    assert set(capabilities) == {
        "supabase_auth",
        "supabase_admin",
        "database",
        "groq",
        "qdrant",
        "elevenlabs",
        "n8n",
    }
    assert all(isinstance(value, bool) for value in capabilities.values())


def test_cors_origins_are_parsed_from_csv() -> None:
    settings = Settings(cors_allowed_origins="http://localhost:8443, https://app.careeros.dev ")

    assert settings.cors_origins == ["http://localhost:8443", "https://app.careeros.dev"]


def test_trailing_slashes_are_normalised() -> None:
    settings = Settings(supabase_url="https://project.supabase.co/")

    assert settings.supabase_url == "https://project.supabase.co"
    assert settings.jwks_url == "https://project.supabase.co/auth/v1/.well-known/jwks.json"
