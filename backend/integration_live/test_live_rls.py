"""Live verification: row level security via Supabase PostgREST.

The unit suite proves the API's behaviour with the repository stubbed out — it
cannot prove that the database refuses a cross-user read or write.  These tests
exercise PostgREST over HTTPS with real JWTs, exactly like a real request would.

    FastAPI -> Supabase PostgREST (HTTPS) -> PostgreSQL RLS

A denial observed here is enforced by PostgreSQL RLS, not by frontend hiding
or API filtering.
"""

from __future__ import annotations

from typing import Any

import pytest

from integration_live.conftest import LiveAccount, PostgRESTHelper, require_session

pytestmark = pytest.mark.live


# ── own data ──────────────────────────────────────────────────────────────


def test_user_can_read_own_profile_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    token = require_session(student_a)
    rows = postgrest.select(
        "profiles",
        token,
        columns="user_id,display_name",
        filters={"user_id": f"eq.{student_a.user_id}"},
        limit=1,
    )
    assert len(rows) == 1
    assert rows[0]["user_id"] == student_a.user_id


def test_user_can_update_own_profile_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    token = require_session(student_a)
    marker = f"rls-own-postgrest"

    updated = postgrest.update(
        "profiles",
        token,
        filters={"user_id": f"eq.{student_a.user_id}"},
        payload={"display_name": marker},
    )
    assert len(updated) == 1
    assert updated[0]["display_name"] == marker

    # Read it back.
    rows = postgrest.select(
        "profiles",
        token,
        columns="display_name",
        filters={"user_id": f"eq.{student_a.user_id}"},
        limit=1,
    )
    assert rows[0]["display_name"] == marker


# ── cross-user denial ─────────────────────────────────────────────────────


def test_user_cannot_read_another_users_profile_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    token_a = require_session(student_a)

    # A attempting to read B's profile via PostgREST.
    rows = postgrest.select(
        "profiles",
        token_a,
        columns="user_id,display_name",
        filters={"user_id": f"eq.{student_b.user_id}"},
        limit=10,
    )
    print(f"\n[live] A reading B's profile via PostgREST rows = {len(rows)}")
    assert rows == [], "RLS must hide another user's profile row"

    # Also: A should only see their own profile.
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


def test_user_cannot_update_another_users_profile_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    token_a = require_session(student_a)
    token_b = require_session(student_b)

    # Read B's current display_name.
    b_before = postgrest.select(
        "profiles",
        token_b,
        columns="display_name",
        filters={"user_id": f"eq.{student_b.user_id}"},
        limit=1,
    )
    before_name = b_before[0]["display_name"] if b_before else None

    # Attempt to update B's profile using A's JWT.
    try:
        updated = postgrest.update(
            "profiles",
            token_a,
            filters={"user_id": f"eq.{student_b.user_id}"},
            payload={"display_name": "hacked-by-student-a"},
        )
        print(f"\n[live] A updating B's profile -> {len(updated)} rows")
        assert len(updated) == 0, "RLS must prevent updating another user's profile"
    except RuntimeError as exc:
        print(f"\n[live] A updating B's profile -> denied ({exc})")

    # Verify B's data is unchanged.
    b_after = postgrest.select(
        "profiles",
        token_b,
        columns="display_name",
        filters={"user_id": f"eq.{student_b.user_id}"},
        limit=1,
    )
    after_name = b_after[0]["display_name"] if b_after else None
    assert after_name == before_name, "B's profile must be unchanged"


def test_user_cannot_insert_a_profile_for_another_user_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    token_a = require_session(student_a)

    # A attempting to insert a profile row for B.
    try:
        result = postgrest.insert(
            "profiles",
            token_a,
            payload={
                "user_id": student_b.user_id,
                "email": "forged@example.com",
            },
        )
        print(f"\n[live] A inserting a profile for B -> returned {result}")
        assert result is None, "inserting a profile row for another user must be refused"
    except RuntimeError as exc:
        print(f"\n[live] A inserting a profile for B -> denied ({exc})")


# ── membership security ──────────────────────────────────────────────────


def test_user_cannot_self_grant_organization_membership_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    token_a = require_session(student_a)

    # A attempting to insert an organization membership for self.
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
        print(f"\n[live] A self-granting org membership -> returned {result}")
        assert result is None, "users must not be able to grant themselves a membership"
    except RuntimeError as exc:
        print(f"\n[live] A self-granting org membership -> denied ({exc})")


def test_user_cannot_self_enroll_in_college_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    token_a = require_session(student_a)

    # A attempting to insert a student_college_membership for self.
    try:
        result = postgrest.insert(
            "student_college_memberships",
            token_a,
            payload={
                "student_id": student_a.user_id,
                "college_id": "00000000-0000-0000-0000-000000000000",
                "department": "CSE",
                "batch": "2026",
            },
        )
        print(f"\n[live] A self-enrolling -> returned {result}")
        assert result is None, "users must not be able to self-enroll into a college"
    except RuntimeError as exc:
        print(f"\n[live] A self-enrolling -> denied ({exc})")


# ── reference data visibility ────────────────────────────────────────────


def test_authenticated_users_can_still_read_reference_data_via_postgrest(
    postgrest: PostgRESTHelper, student_a: LiveAccount
) -> None:
    """Positive control: RLS must not lock users out of shared reference data."""
    token_a = require_session(student_a)

    colleges = postgrest.select(
        "colleges",
        token_a,
        columns="id",
        filters={"verified_status": "eq.verified"},
        limit=10,
    )
    requirements = postgrest.select(
        "role_requirements",
        token_a,
        columns="id",
        limit=10,
    )
    print(
        f"\n[live] reference data visible to A: colleges={len(colleges)} "
        f"role_requirements={len(requirements)}"
    )
