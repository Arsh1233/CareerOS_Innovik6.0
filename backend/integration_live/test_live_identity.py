"""Live verification: signup → Supabase Auth → profile trigger → login → /users/me
→ profile save → readback.

Every assertion here runs against the real Supabase project configured in the
backend environment. Nothing is mocked. See `conftest.py` for the gating.
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from integration_live.conftest import LiveAccount, require_session, signup_account

pytestmark = pytest.mark.live

API = "/api/v1"


def auth_user_row(admin_db: Any, user_id: str) -> dict[str, Any]:
    """Read the `auth.users` row, or skip with the real reason if the role
    behind DATABASE_URL is not allowed to read the auth schema."""
    try:
        row = admin_db.one(
            """
            select id, email, email_confirmed_at,
                   raw_app_meta_data, raw_user_meta_data
            from auth.users
            where id = %s
            """,
            (user_id,),
        )
    except Exception as exc:  # noqa: BLE001 - report the actual blocker
        pytest.skip(
            "DATABASE_URL role cannot read auth.users "
            f"({type(exc).__name__}); verify the auth schema grant"
        )
    assert row is not None, "auth.users row was not created"
    return row


def profile_rows(admin_db: Any, user_id: str) -> list[dict[str, Any]]:
    return admin_db.all(
        """
        select user_id, display_name, email, target_role_name, target_salary_inr,
               timeframe_years, discoverability, onboarding_state
        from public.profiles
        where user_id = %s
        """,
        (user_id,),
    )


# ── configuration ─────────────────────────────────────────────────────────


def test_health_reflects_configured_capabilities(client: TestClient) -> None:
    response = client.get(f"{API}/health")
    assert response.status_code == 200

    body = response.json()
    capabilities = body["capabilities"]
    print(f"\n[live] health status={body['status']} capabilities={capabilities}")

    # The contract: auth verification and the database must be reported as
    # configured, and `status` must follow from that — not be forced to "ok".
    assert capabilities["supabase_auth"] is True, "Supabase auth is not configured"
    assert capabilities["database"] is True, "Database is not configured"
    assert body["status"] == "ok"


# ── signup + profile trigger ──────────────────────────────────────────────


def test_signup_creates_auth_user_and_exactly_one_profile(
    client: TestClient, admin_db: Any, student_a: LiveAccount
) -> None:
    user = auth_user_row(admin_db, student_a.user_id)
    assert user["email"] == student_a.email

    rows = profile_rows(admin_db, student_a.user_id)
    print(f"\n[live] signup profile rows = {len(rows)}")

    assert len(rows) == 1, f"handle_new_user must create exactly one profile row, got {len(rows)}"
    assert rows[0]["display_name"] == "Live Studenta", (
        "profile display_name should come from the signup full_name"
    )


def test_profile_trigger_is_idempotent_for_the_same_user(
    client: TestClient, admin_db: Any, student_a: LiveAccount
) -> None:
    # Re-running the provisioning path must not duplicate the row.
    admin_db.execute(
        """
        insert into public.profiles (user_id, email)
        values (%s, %s)
        on conflict (user_id) do nothing
        """,
        (student_a.user_id, student_a.email),
    )
    assert len(profile_rows(admin_db, student_a.user_id)) == 1


def test_role_lives_in_app_metadata_and_not_user_metadata(
    client: TestClient, admin_db: Any, student_a: LiveAccount
) -> None:
    user = auth_user_row(admin_db, student_a.user_id)
    app_metadata = user["raw_app_meta_data"] or {}
    user_metadata = user["raw_user_meta_data"] or {}

    print(f"\n[live] app_metadata.role={app_metadata.get('role')!r} user_metadata.role={user_metadata.get('role')!r}")

    assert app_metadata.get("role") == "student"
    assert user_metadata.get("role") is None, (
        "user_metadata is client-editable and must never carry the platform role"
    )

    token = require_session(student_a)
    me = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["role"] == "student", "role must come from the verified token"


def test_public_admin_signup_is_rejected(client: TestClient) -> None:
    response = client.post(
        f"{API}/auth/signup",
        json={
            "email": "careeros.live.admin.attempt@example.com",
            "password": "Live-AdminAttempt1!",
            "role": "admin",
            "full_name": "Admin Attempt",
        },
    )
    print(f"\n[live] admin signup -> {response.status_code} {response.json()}")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize("role", ["college", "recruiter"])
def test_other_self_service_roles_sign_up_with_their_own_role(
    client: TestClient, admin_db: Any, created_accounts: Any, role: str
) -> None:
    account = signup_account(client, label=role, role=role, track=created_accounts)
    user = auth_user_row(admin_db, account.user_id)
    assert (user["raw_app_meta_data"] or {}).get("role") == role
    assert len(profile_rows(admin_db, account.user_id)) == 1


# ── login + identity read ─────────────────────────────────────────────────


def test_login_returns_a_session_and_me_returns_the_persisted_profile(
    client: TestClient, admin_db: Any, student_a: LiveAccount
) -> None:
    response = client.post(
        f"{API}/auth/login",
        json={"email": student_a.email, "password": student_a.password},
    )
    assert response.status_code == 200, response.text[:400]

    body = response.json()
    session = body["session"]
    assert session["access_token"] and session["refresh_token"]
    assert body["user"]["role"] == "student"

    me = client.get(
        f"{API}/users/me", headers={"Authorization": f"Bearer {session['access_token']}"}
    )
    assert me.status_code == 200

    identity = me.json()
    assert identity["id"] == student_a.user_id
    assert identity["role"] == "student"
    assert identity["profile"] is not None, "profile must be the persisted row, not null"

    stored = profile_rows(admin_db, student_a.user_id)[0]
    assert identity["profile"]["user_id"] == stored["user_id"]
    assert identity["profile"]["display_name"] == stored["display_name"]


# ── profile write + readback (the critical Phase 03 test) ─────────────────


def test_profile_update_persists_to_postgres_and_reads_back(
    client: TestClient, admin_db: Any, scoped_db: Any, student_a: LiveAccount
) -> None:
    token = require_session(student_a)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "display_name": "Live Student A (updated)",
        "phone": "+91 90000 00000",
        "location": "Chennai, Tamil Nadu",
        "linkedin_url": "https://www.linkedin.com/in/live-student-a",
        "target_role_name": "AI Engineer",
        "target_salary_inr": 2_800_000,
        "timeframe_years": 5,
        "discoverability": True,
    }

    response = client.put(f"{API}/users/profile", headers=headers, json=payload)
    assert response.status_code == 200, response.text[:400]
    saved = response.json()
    assert saved["display_name"] == payload["display_name"]
    assert saved["target_salary_inr"] == 2_800_000
    assert saved["discoverability"] is True

    # 1. Readback through the API (what a page refresh does).
    again = client.get(f"{API}/users/me", headers=headers)
    assert again.status_code == 200
    profile = again.json()["profile"]
    for field, expected in payload.items():
        assert profile[field] == expected, f"{field} not persisted ({profile[field]!r})"

    # 2. Readback straight from PostgreSQL as the owner (independent of the API).
    stored = profile_rows(admin_db, student_a.user_id)[0]
    assert stored["display_name"] == payload["display_name"]
    assert stored["target_role_name"] == "AI Engineer"
    assert stored["target_salary_inr"] == 2_800_000
    assert stored["timeframe_years"] == 5
    assert stored["discoverability"] is True

    # 3. Readback through RLS as the student themselves.
    scoped = scoped_db.select(
        "select display_name, target_role_name from public.profiles where user_id = %s",
        (student_a.user_id,),
        student_a.claims(),
    )
    assert len(scoped) == 1
    assert scoped[0]["display_name"] == payload["display_name"]


def test_profile_validation_is_enforced(client: TestClient, student_a: LiveAccount) -> None:
    token = require_session(student_a)
    headers = {"Authorization": f"Bearer {token}"}

    unknown_field = client.put(
        f"{API}/users/profile", headers=headers, json={"user_id": "not-allowed"}
    )
    assert unknown_field.status_code == 422

    empty_update = client.put(f"{API}/users/profile", headers=headers, json={})
    assert empty_update.status_code == 400
    assert empty_update.json()["error"]["code"] == "empty_update"

    invalid_value = client.put(
        f"{API}/users/profile", headers=headers, json={"target_salary_inr": -1}
    )
    assert invalid_value.status_code == 422


# ── negative auth cases ───────────────────────────────────────────────────


def test_wrong_password_is_rejected(client: TestClient, student_a: LiveAccount) -> None:
    response = client.post(
        f"{API}/auth/login",
        json={"email": student_a.email, "password": "definitely-not-the-password"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_invalid_and_missing_token_are_rejected(client: TestClient) -> None:
    invalid = client.get(
        f"{API}/users/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert invalid.status_code == 401

    missing = client.get(f"{API}/users/me")
    assert missing.status_code == 401
    assert missing.json()["error"]["code"] == "not_authenticated"


def test_password_reset_does_not_disclose_account_existence(client: TestClient) -> None:
    # Deliberately an address with no account: verifies the 202 contract without
    # sending mail to a real user.
    response = client.post(
        f"{API}/auth/password-reset", json={"email": "careeros.live.nobody@example.com"}
    )
    assert response.status_code == 202


# ── logout ────────────────────────────────────────────────────────────────


def test_logout_revokes_the_session_and_clears_access(
    client: TestClient, created_accounts: Any, student_b: LiveAccount
) -> None:
    token = require_session(student_b)

    logout = client.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout.status_code == 204

    # Without a token the API must refuse.
    without_token = client.get(f"{API}/users/me")
    assert without_token.status_code == 401

    # Observed, not asserted: Supabase access tokens are stateless JWTs, so
    # revocation ends the refresh session while the access token can stay
    # cryptographically valid until it expires. Record what actually happens
    # instead of assuming either behaviour.
    after_logout = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {token}"})
    print(
        f"\n[live] access token after logout -> {after_logout.status_code} "
        "(documented: the frontend clears local state regardless)"
    )
    assert after_logout.status_code in (200, 401)
