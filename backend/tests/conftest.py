"""Test configuration.

Environment is set before the application is imported so `Settings` resolves
without a live Supabase project.  Tests never talk to a real provider: the
Supabase integration and the repository are replaced through dependency
overrides.
"""

from __future__ import annotations

import os
import time
import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-please-change-me")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost:8443")
os.environ["DATABASE_URL"] = ""

import jwt  # noqa: E402  (import after env setup)

from app.api.deps import get_profiles_repository, get_supabase_auth_client  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from app.repositories.profiles import PROFILE_COLUMNS  # noqa: E402

JWT_SECRET = "test-jwt-secret-please-change-me"
API_PREFIX = "/api/v1"


@pytest.fixture(autouse=True)
def _reset_settings_cache() -> Any:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client() -> Any:
    with TestClient(app) as test_client:
        yield test_client


def make_token(
    role: str | None = "student",
    *,
    sub: str | None = None,
    email: str = "student@example.com",
    secret: str = JWT_SECRET,
    expires_in_seconds: int = 3600,
    audience: str = "authenticated",
) -> str:
    now = int(time.time())
    claims: dict[str, Any] = {
        "sub": sub or str(uuid.uuid4()),
        "email": email,
        "aud": audience,
        "iat": now,
        "exp": now + expires_in_seconds,
        "user_metadata": {"full_name": "Test Student"},
    }
    if role is not None:
        claims["app_metadata"] = {"role": role}
    return jwt.encode(claims, secret, algorithm="HS256")


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def profile_row(user_id: str, **overrides: Any) -> dict[str, Any]:
    """A row shaped like `select PROFILE_COLUMNS from public.profiles`."""
    row: dict[str, Any] = {column: None for column in PROFILE_COLUMNS}
    row.update(
        {
            "user_id": user_id,
            "display_name": "Test Student",
            "email": "student@example.com",
            "education": [],
            "experience": [],
            "interests": [],
            "onboarding_state": "not_started",
            "discoverability": False,
        }
    )
    row.update(overrides)
    return row


class FakeProfilesRepository:
    """In-memory stand-in for `ProfilesRepository`."""

    def __init__(
        self,
        row: dict[str, Any] | None = None,
        memberships: list[dict[str, Any]] | None = None,
    ) -> None:
        self.row = row
        self.memberships = memberships or []
        self.last_update: dict[str, Any] | None = None
        self.last_claims: dict[str, Any] | None = None

    async def get_by_user_id(self, claims: dict[str, Any], user_id: str) -> dict[str, Any] | None:
        self.last_claims = claims
        return self.row

    async def update_fields(
        self, claims: dict[str, Any], user_id: str, fields: dict[str, Any]
    ) -> dict[str, Any] | None:
        self.last_claims = claims
        self.last_update = fields
        if self.row is None:
            return None
        self.row.update(fields)
        return self.row

    async def list_memberships(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        self.last_claims = claims
        return self.memberships


class FakeSupabaseAuthClient:
    """Stand-in for `SupabaseAuthClient` covering success and failure paths."""

    def __init__(
        self,
        *,
        grant: dict[str, Any] | None = None,
        grant_error: Exception | None = None,
        created: dict[str, Any] | None = None,
        create_error: Exception | None = None,
    ) -> None:
        self._grant = grant
        self._grant_error = grant_error
        self._created = created
        self._create_error = create_error
        self.create_payload: dict[str, Any] | None = None
        self.revoked_token: str | None = None
        self.reset_requested_for: str | None = None

    async def password_grant(self, email: str, password: str) -> dict[str, Any]:
        if self._grant_error is not None:
            raise self._grant_error
        assert self._grant is not None
        return self._grant

    async def admin_create_user(self, **kwargs: Any) -> dict[str, Any]:
        self.create_payload = kwargs
        if self._create_error is not None:
            raise self._create_error
        assert self._created is not None
        return self._created

    async def admin_update_user_role(self, user_id: str, role: str) -> None:
        return None

    async def request_password_reset(self, email: str) -> None:
        self.reset_requested_for = email

    async def revoke_session(self, access_token: str) -> None:
        self.revoked_token = access_token


def grant_payload(
    user_id: str,
    *,
    role: str | None = "student",
    full_name: str = "Test Student",
    email: str = "student@example.com",
) -> dict[str, Any]:
    """A GoTrue password-grant response, as Supabase returns it."""
    user: dict[str, Any] = {
        "id": user_id,
        "email": email,
        "user_metadata": {"full_name": full_name},
    }
    if role is not None:
        user["app_metadata"] = {"role": role}
    return {
        "access_token": "access-token-value",
        "refresh_token": "refresh-token-value",
        "expires_in": 3600,
        "expires_at": int(time.time()) + 3600,
        "user": user,
    }


def override_dependencies(
    auth_client: FakeSupabaseAuthClient,
    repository: FakeProfilesRepository,
) -> None:
    app.dependency_overrides[get_supabase_auth_client] = lambda: auth_client
    app.dependency_overrides[get_profiles_repository] = lambda: repository


@pytest.fixture(autouse=True)
def _clear_dependency_overrides() -> Any:
    yield
    app.dependency_overrides.clear()


__all__ = [
    "API_PREFIX",
    "JWT_SECRET",
    "FakeProfilesRepository",
    "FakeSupabaseAuthClient",
    "auth_header",
    "grant_payload",
    "make_token",
    "override_dependencies",
    "profile_row",
]
