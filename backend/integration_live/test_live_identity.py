"""Live verification: signup -> Supabase Auth -> profile trigger -> login -> /users/me
-> profile save -> readback.

Every assertion here runs against the real Supabase project configured in the
backend environment.  Nothing is mocked.  See `conftest.py` for the gating.

DATA ACCESS ARCHITECTURE:
    Profile read/write -> Supabase PostgREST (HTTPS) -> PostgreSQL RLS
    Admin checks (optional) -> Direct PostgreSQL (when DATABASE_URL is reachable)
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from integration_live.conftest import LiveAccount, PostgRESTHelper, require_session, signup_account

pytestmark = pytest.mark.live

API = "/api/v1"


# ── PostgREST-based profile verification ───────────────────────────────────


def test_health_reflects_configured_capabilities(client: TestClient) -> None:
    response = client.get(f"{API}/health")
    assert response.status_code == 200

    body = response.json()
    capabilities = body["capabilities"]
    print(f"\n[live] health status={body['status']} capabilities={capabilities}")

    # The contract: auth verification must be reported as configured.
    # PostgREST is the primary database access path (supabase_url + supabase_anon_key).
    assert capabilities["supabase_auth"] is True, "Supabase auth is not configured"
    assert body["status"] == "ok"


# ── signup + profile trigger ──────────────────────────────────────────────


def test_signup_creates_auth_user_and_profile_via_postgrest(
    client: TestClient, postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    """Verify the signup created a profile row via PostgREST (RLS)."""
    token = require_session(student_a)

    # Query own profile through PostgREST with the user's JWT.
    # RLS must allow the user to read their own profile.
    rows = postgrest.select(
        "profiles",
        token,
        columns="user_id,display_name,email,target_role_name,target_salary_inr,timeframe_years,discoverability,onboarding_state",
        filters={"user_id": f"eq.{student_a.user_id}"},
        limit=1,
    )

    print(f"\n[live] signup profile rows via PostgREST = {len(rows)}")
    assert len(rows) == 1, "handle_new_user trigger must create exactly one profile row"
    assert rows[0]["display_name"] == "Live Studenta", (
        "profile display_name should come from the signup full_name"
    )


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
    client: TestClient, postgrest: PostgRESTHelper, created_accounts: Any, role: str
) -> None:
    account = signup_account(client, label=role, role=role, track=created_accounts)
    token = require_session(account)

    # Verify via PostgREST that the profile was created.
    rows = postgrest.select(
        "profiles",
        token,
        columns="user_id,display_name",
        filters={"user_id": f"eq.{account.user_id}"},
        limit=1,
    )
    assert len(rows) == 1


# ── login + identity read ─────────────────────────────────────────────────


def test_login_returns_a_session_and_me_returns_the_persisted_profile(
    client: TestClient, postgrest: PostgRESTHelper, student_a: LiveAccount
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

    # Verify via PostgREST that the profile matches.
    rows = postgrest.select(
        "profiles",
        session["access_token"],
        columns="user_id,display_name",
        filters={"user_id": f"eq.{student_a.user_id}"},
        limit=1,
    )
    assert len(rows) == 1
    assert identity["profile"]["display_name"] == rows[0]["display_name"]


# ── profile write + readback (the critical Phase 03 test) ─────────────────


def test_profile_update_persists_via_postgrest_and_reads_back(
    client: TestClient, postgrest: PostgRESTHelper, student_a: LiveAccount
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

    # 1. Update through the API (which uses PostgREST internally).
    response = client.put(f"{API}/users/profile", headers=headers, json=payload)
    assert response.status_code == 200, response.text[:400]
    saved = response.json()
    assert saved["display_name"] == payload["display_name"]
    assert saved["target_salary_inr"] == 2_800_000
    assert saved["discoverability"] is True

    # 2. Readback through the API (what a page refresh does).
    again = client.get(f"{API}/users/me", headers=headers)
    assert again.status_code == 200
    profile = again.json()["profile"]
    for field, expected in payload.items():
        assert profile[field] == expected, f"{field} not persisted ({profile[field]!r})"

    # 3. Readback directly through PostgREST with the user's JWT (RLS).
    rows = postgrest.select(
        "profiles",
        token,
        columns="display_name,target_role_name,target_salary_inr,timeframe_years,discoverability",
        filters={"user_id": f"eq.{student_a.user_id}"},
        limit=1,
    )
    assert len(rows) == 1
    assert rows[0]["display_name"] == payload["display_name"]
    assert rows[0]["target_role_name"] == "AI Engineer"
    assert rows[0]["target_salary_inr"] == 2_800_000
    assert rows[0]["timeframe_years"] == 5
    assert rows[0]["discoverability"] is True


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


# ── RLS verification via PostgREST ────────────────────────────────────────


def test_cross_user_profile_read_is_blocked_via_postgrest(
    client: TestClient, postgrest: PostgRESTHelper, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    """Student A must not see Student B's profile through PostgREST."""
    token_a = require_session(student_a)

    # Attempt to read B's profile using A's JWT.
    rows = postgrest.select(
        "profiles",
        token_a,
        columns="user_id,display_name",
        filters={"user_id": f"eq.{student_b.user_id}"},
        limit=10,
    )
    print(f"\n[live] A reading B's profile via PostgREST -> {len(rows)} rows")
    assert rows == [], "RLS must hide another user's profile row from PostgREST"

    # Also verify: A should only see their own profile.
    all_rows = postgrest.select(
        "profiles",
        token_a,
        columns="user_id",
        limit=100,
    )
    visible_ids = {row["user_id"] for row in all_rows}
    assert student_b.user_id not in visible_ids
    assert visible_ids == {student_a.user_id}, (
        f"a user must see only their own profile; saw {len(visible_ids)} rows"
    )


def test_cross_user_profile_update_is_blocked_via_postgrest(
    client: TestClient, postgrest: PostgRESTHelper, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    """Student A must not be able to update Student B's profile."""
    token_a = require_session(student_a)

    # Read B's current profile before the attempt.
    b_rows_before = postgrest.select(
        "profiles",
        require_session(student_b),
        columns="display_name",
        filters={"user_id": f"eq.{student_b.user_id}"},
        limit=1,
    )
    assert len(b_rows_before) == 1
    before_name = b_rows_before[0]["display_name"]

    # Attempt to update B's profile using A's JWT.
    try:
        updated = postgrest.update(
            "profiles",
            token_a,
            filters={"user_id": f"eq.{student_b.user_id}"},
            payload={"display_name": "hacked-by-student-a"},
        )
        # If PostgREST returned rows, it means RLS didn't block it.
        print(f"\n[live] A updating B's profile -> returned {len(updated)} rows")
        assert len(updated) == 0, "RLS must prevent updating another user's profile"
    except RuntimeError as exc:
        # PostgREST returns 403 or empty result — both are acceptable denials.
        print(f"\n[live] A updating B's profile -> denied ({exc})")

    # Verify B's profile is unchanged.
    b_rows_after = postgrest.select(
        "profiles",
        require_session(student_b),
        columns="display_name",
        filters={"user_id": f"eq.{student_b.user_id}"},
        limit=1,
    )
    assert len(b_rows_after) == 1
    assert b_rows_after[0]["display_name"] == before_name, "B's profile must be unchanged"


def test_membership_self_grant_is_blocked_via_postgrest(
    client: TestClient, postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    """Users must not be able to grant themselves organization memberships."""
    token_a = require_session(student_a)

    # Attempt to insert a membership row for self.
    try:
        result = postgrest.insert(
            "organization_memberships",
            token_a,
            payload={
                "user_id": student_a.user_id,
                "college_id": "00000000-0000-0000-0000-000000000000",
                "membership_role": "owner",
                "status": "active",
            },
        )
        # If it returned a row, that means RLS didn't block it.
        print(f"\n[live] A self-granting membership -> returned {result}")
        assert result is None, "users must not be able to grant themselves a membership"
    except RuntimeError as exc:
        print(f"\n[live] A self-granting membership -> denied ({exc})")


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
        f"{API}/auth/password-reset",
        json={"email": "careeros.live.nobody@example.com"},
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
    # cryptographically valid until it expires.  Record what actually happens
    # instead of assuming either behaviour.
    after_logout = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {token}"})
    print(
        f"\n[live] access token after logout -> {after_logout.status_code} "
        "(documented: the frontend clears local state regardless)"
    )
    assert after_logout.status_code in (200, 401)
