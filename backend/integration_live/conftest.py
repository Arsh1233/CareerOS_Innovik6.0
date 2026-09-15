"""Fixtures for the live Supabase verification suite.

These tests talk to a REAL Supabase project: real GoTrue, real PostgreSQL, real
RLS policies. Nothing is mocked and no dependency is overridden.

They are opt-in and separated from the unit suite on purpose:

    pytest                      # unit suite — no network, no database
    pytest integration_live     # this suite — requires live configuration

Gating (both must hold, otherwise every test skips with the reason shown):

1. `CAREEROS_LIVE_SUPABASE=1` must be set.
2. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and
   `DATABASE_URL` must be configured in the backend environment.

The suite never fabricates a pass. If the live project cannot complete a step,
the test fails or skips and prints what actually happened.
"""

from __future__ import annotations

import asyncio
import os
import secrets
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.integrations.supabase import SupabaseAuthClient  # noqa: E402
from app.main import app  # noqa: E402
from app.repositories.base import claims_session_statements  # noqa: E402

LIVE_FLAG = "CAREEROS_LIVE_SUPABASE"

REQUIRED_VALUES = (
    "supabase_url",
    "supabase_anon_key",
    "supabase_service_role_key",
    "database_url",
)


def _missing_configuration() -> list[str]:
    settings = get_settings()
    return [
        name.upper()
        for name in REQUIRED_VALUES
        if not (getattr(settings, name) or "").strip()
    ]


def _skip_reason() -> str | None:
    if os.environ.get(LIVE_FLAG) != "1":
        return (
            f"live verification is opt-in: set {LIVE_FLAG}=1 and configure "
            "SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL"
        )
    missing = _missing_configuration()
    if missing:
        return "live configuration missing: " + ", ".join(missing)
    return None


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    reason = _skip_reason()
    if not reason:
        return
    marker = pytest.mark.skip(reason=reason)
    for item in items:
        item.add_marker(marker)


# ── HTTP client ───────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def client() -> Any:
    # A guard against accidentally running this suite against a mocked app.
    assert app.dependency_overrides == {}, (
        "live verification must run against the real app: dependency overrides are active"
    )
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def settings() -> Any:
    get_settings.cache_clear()
    return get_settings()


# ── database helpers ──────────────────────────────────────────────────────


class AdminDb:
    """Owner-level (service) connection — used to inspect and seed fixtures.

    This bypasses RLS on purpose: it is how we *prove* what is really stored,
    independently of what the API or RLS lets a user see.
    """

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    def _run(self, sql: str, params: tuple[Any, ...] = (), *, fetch: bool) -> Any:
        import psycopg
        from psycopg.rows import dict_row

        with psycopg.connect(self._dsn, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                if fetch:
                    return cur.fetchall()
                return cur.rowcount

    def all(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        return list(self._run(sql, params, fetch=True))

    def one(self, sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        rows = self.all(sql, params)
        return rows[0] if rows else None

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> int:
        return int(self._run(sql, params, fetch=False))


class ScopedDb:
    """Runs SQL as PostgreSQL role `authenticated` with given JWT claims.

    Uses the exact same session statements as
    `app.repositories.base.user_scoped_connection`, so a denial here is the
    denial a real request would receive.
    """

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn

    async def _run(
        self, sql: str, params: tuple[Any, ...], claims: dict[str, Any]
    ) -> tuple[list[dict[str, Any]], int]:
        import psycopg
        from psycopg.rows import dict_row

        conn = await psycopg.AsyncConnection.connect(self._dsn, row_factory=dict_row)
        try:
            async with conn.transaction():
                for statement, statement_params in claims_session_statements(claims):
                    await conn.execute(statement, statement_params)
                cursor = await conn.execute(sql, params)
                rows = list(await cursor.fetchall()) if cursor.description else []
                return rows, cursor.rowcount
        finally:
            await conn.close()

    def select(self, sql: str, params: tuple[Any, ...], claims: dict[str, Any]) -> list[dict[str, Any]]:
        rows, _ = asyncio.run(self._run(sql, params, claims))
        return rows

    def execute(self, sql: str, params: tuple[Any, ...], claims: dict[str, Any]) -> int:
        _, rowcount = asyncio.run(self._run(sql, params, claims))
        return rowcount

    def execute_expecting_denial(
        self, sql: str, params: tuple[Any, ...], claims: dict[str, Any]
    ) -> str | None:
        """Run a statement that must be refused.

        Returns the error class name when PostgreSQL refused it, or None when the
        statement unexpectedly succeeded (which the caller asserts against).
        """
        try:
            self.execute(sql, params, claims)
        except Exception as exc:  # noqa: BLE001 - the error class is the evidence
            return type(exc).__name__
        return None


def claims_for(user_id: str, role: str = "student") -> dict[str, Any]:
    """Claims shaped like a verified Supabase access token for `user_id`."""
    return {
        "sub": user_id,
        "aud": "authenticated",
        "role": "authenticated",
        "email": "live-test@example.com",
        "app_metadata": {"role": role},
        "user_metadata": {},
    }


@pytest.fixture(scope="session")
def admin_db(settings: Any) -> AdminDb:
    return AdminDb(settings.database_url)


@pytest.fixture(scope="session")
def scoped_db(settings: Any) -> ScopedDb:
    return ScopedDb(settings.database_url)


# ── live accounts ─────────────────────────────────────────────────────────


@dataclass
class LiveAccount:
    user_id: str
    email: str
    password: str
    role: str
    session: dict[str, Any] | None = None
    profile: dict[str, Any] | None = None
    created: list[dict[str, str]] = field(default_factory=list)

    @property
    def access_token(self) -> str | None:
        return (self.session or {}).get("access_token")

    def claims(self) -> dict[str, Any]:
        return claims_for(self.user_id, self.role)


def _new_password() -> str:
    return f"Live-{secrets.token_hex(8)}!9"


def _new_email(label: str) -> str:
    return f"careeros.live.{label}.{secrets.token_hex(4)}@example.com"


@pytest.fixture(scope="session")
def created_accounts(client: TestClient, settings: Any) -> Any:
    """Tracks accounts created by this run and deletes them afterwards."""
    accounts: list[str] = []

    def track(user_id: str) -> None:
        accounts.append(user_id)

    yield track

    if not accounts:
        return

    auth_client = SupabaseAuthClient(settings)

    async def cleanup() -> list[tuple[str, bool]]:
        results = []
        for user_id in accounts:
            results.append((user_id, await auth_client.admin_delete_user(user_id)))
        return results

    outcome = asyncio.run(cleanup())
    removed = sum(1 for _, deleted in outcome if deleted)
    print(f"\n[live] cleanup: deleted {removed}/{len(accounts)} test accounts")


def signup_account(
    client: TestClient,
    *,
    label: str,
    role: str,
    track: Any,
    full_name: str | None = None,
) -> LiveAccount:
    """Create an account through the real signup endpoint."""
    email = _new_email(label)
    password = _new_password()
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": password,
            "role": role,
            "full_name": full_name or f"Live {label.title()}",
        },
    )
    assert response.status_code == 201, (
        f"signup failed: {response.status_code} {response.text[:400]}"
    )
    body = response.json()
    account = LiveAccount(
        user_id=body["user"]["id"],
        email=email,
        password=password,
        role=role,
        session=body.get("session"),
    )
    track(account.user_id)
    return account


def login_account(client: TestClient, account: LiveAccount) -> LiveAccount:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": account.email, "password": account.password},
    )
    assert response.status_code == 200, (
        f"login failed: {response.status_code} {response.text[:400]}"
    )
    account.session = response.json()["session"]
    return account


def require_session(account: LiveAccount) -> str:
    token = account.access_token
    if not token:
        pytest.skip(
            "no session issued at signup — the project appears to require email "
            "confirmation, which this suite will not fake. Confirm the account or "
            "disable email confirmation for the development project, then re-run."
        )
    return token


@pytest.fixture(scope="session")
def student_a(client: TestClient, created_accounts: Any) -> LiveAccount:
    account = signup_account(
        client, label="studenta", role="student", track=created_accounts
    )
    return login_account(client, account) if account.session is None else account


@pytest.fixture(scope="session")
def student_b(client: TestClient, created_accounts: Any) -> LiveAccount:
    account = signup_account(
        client, label="studentb", role="student", track=created_accounts
    )
    return login_account(client, account) if account.session is None else account
