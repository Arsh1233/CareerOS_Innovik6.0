"""Live verification: row level security on a real database.

The unit suite proves the API's behaviour with the repository stubbed out — it
cannot prove that the database refuses a cross-user read or write. These tests
run SQL as PostgreSQL role `authenticated` with real claims, exactly like a
request would, and record what the database actually does.

A denial observed here is enforced by PostgreSQL, not by frontend hiding or API
filtering.
"""

from __future__ import annotations

import secrets
from typing import Any

import pytest

from integration_live.conftest import LiveAccount, claims_for

pytestmark = pytest.mark.live


@pytest.fixture(scope="session")
def seeded_tenancy(
    admin_db: Any, student_a: LiveAccount, student_b: LiveAccount
) -> dict[str, Any]:
    """Give Student B a college membership that Student A must not touch.

    Seeded with the owner connection on purpose: the fixture needs rows to
    exist so that an empty result for Student A means "denied", not "absent".
    """
    college = admin_db.one(
        """
        insert into public.colleges (name, verified_status)
        values (%s, 'verified')
        returning id
        """,
        (f"Live RLS Test College {secrets.token_hex(3)}",),
    )
    assert college is not None
    college_id = college["id"]

    admin_db.execute(
        """
        insert into public.organization_memberships
            (user_id, college_id, membership_role, status)
        values (%s, %s, 'owner', 'active')
        """,
        (student_b.user_id, college_id),
    )
    admin_db.execute(
        """
        insert into public.student_college_memberships
            (student_id, college_id, department, batch)
        values (%s, %s, 'CSE', '2026')
        """,
        (student_b.user_id, college_id),
    )

    yield {"college_id": college_id}

    # Cascades remove both membership rows.
    admin_db.execute("delete from public.colleges where id = %s", (college_id,))


# ── own data ──────────────────────────────────────────────────────────────


def test_user_can_read_own_profile(scoped_db: Any, student_a: LiveAccount) -> None:
    rows = scoped_db.select(
        "select user_id, display_name from public.profiles where user_id = %s",
        (student_a.user_id,),
        student_a.claims(),
    )
    assert len(rows) == 1
    assert rows[0]["user_id"] == student_a.user_id


def test_user_can_update_own_profile(scoped_db: Any, admin_db: Any, student_a: LiveAccount) -> None:
    marker = f"rls-own-{secrets.token_hex(4)}"

    updated = scoped_db.execute(
        "update public.profiles set display_name = %s where user_id = %s",
        (marker, student_a.user_id),
        student_a.claims(),
    )
    assert updated == 1

    stored = admin_db.one(
        "select display_name from public.profiles where user_id = %s", (student_a.user_id,)
    )
    assert stored is not None and stored["display_name"] == marker


# ── cross-user denial ─────────────────────────────────────────────────────


def test_user_cannot_read_another_users_profile(
    scoped_db: Any, admin_db: Any, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    # Pre-condition: B's row exists (proves the empty result below is denial).
    assert admin_db.one(
        "select 1 as present from public.profiles where user_id = %s", (student_b.user_id,)
    )

    rows = scoped_db.select(
        "select user_id, display_name, email from public.profiles where user_id = %s",
        (student_b.user_id,),
        student_a.claims(),
    )
    print(f"\n[live] A reading B's profile rows = {len(rows)}")
    assert rows == [], "RLS must hide another user's profile row"

    # Nor by asking for everything and filtering client-side.
    everything = scoped_db.select(
        "select user_id from public.profiles", (), student_a.claims()
    )
    visible_ids = {row["user_id"] for row in everything}
    assert student_b.user_id not in visible_ids
    assert visible_ids == {student_a.user_id}, (
        f"a user must see only their own profile; saw {len(visible_ids)} rows"
    )


def test_user_cannot_update_another_users_profile(
    scoped_db: Any, admin_db: Any, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    before = admin_db.one(
        "select display_name from public.profiles where user_id = %s", (student_b.user_id,)
    )

    rowcount = scoped_db.execute(
        "update public.profiles set display_name = %s where user_id = %s",
        ("hacked-by-student-a", student_b.user_id),
        student_a.claims(),
    )
    print(f"\n[live] A updating B's profile -> rowcount {rowcount}")
    assert rowcount == 0, "RLS must prevent updating another user's profile"

    after = admin_db.one(
        "select display_name from public.profiles where user_id = %s", (student_b.user_id,)
    )
    assert after == before, "B's profile must be unchanged"


def test_user_cannot_delete_another_users_profile(
    scoped_db: Any, admin_db: Any, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    rowcount = scoped_db.execute(
        "delete from public.profiles where user_id = %s",
        (student_b.user_id,),
        student_a.claims(),
    )
    assert rowcount == 0
    assert admin_db.one(
        "select 1 as present from public.profiles where user_id = %s", (student_b.user_id,)
    ), "B's profile must still exist"


def test_user_cannot_insert_a_profile_for_another_user(
    scoped_db: Any, student_a: LiveAccount, student_b: LiveAccount
) -> None:
    # A second row for A, or any row for B, must be refused by the WITH CHECK
    # clause (or the primary key for A's own duplicate).
    denial = scoped_db.execute_expecting_denial(
        "insert into public.profiles (user_id, email) values (%s, %s)",
        (student_b.user_id, "forged@example.com"),
        student_a.claims(),
    )
    print(f"\n[live] A inserting a profile for B -> {denial}")
    assert denial is not None, "inserting a profile row for another user must be refused"


# ── tenancy ───────────────────────────────────────────────────────────────


def test_user_cannot_read_or_grant_tenancy_memberships(
    scoped_db: Any, admin_db: Any, student_a: LiveAccount, student_b: LiveAccount, seeded_tenancy: Any
) -> None:
    college_id = seeded_tenancy["college_id"]

    # B's membership rows exist (owner connection sees them)…
    assert admin_db.all(
        "select id from public.organization_memberships where user_id = %s", (student_b.user_id,)
    )
    assert admin_db.all(
        "select id from public.student_college_memberships where student_id = %s",
        (student_b.user_id,),
    )

    # …but A cannot see or create any.
    visible_orgs = scoped_db.select(
        "select user_id, college_id from public.organization_memberships",
        (),
        student_a.claims(),
    )
    visible_students = scoped_db.select(
        "select student_id from public.student_college_memberships",
        (),
        student_a.claims(),
    )
    print(
        f"\n[live] A sees organization_memberships={len(visible_orgs)} "
        f"student_college_memberships={len(visible_students)}"
    )
    assert all(row["user_id"] == student_a.user_id for row in visible_orgs)
    assert all(row["student_id"] == student_a.user_id for row in visible_students)

    org_insert = scoped_db.execute_expecting_denial(
        """
        insert into public.organization_memberships
            (user_id, college_id, membership_role, status)
        values (%s, %s, 'owner', 'active')
        """,
        (student_a.user_id, college_id),
        student_a.claims(),
    )
    print(f"[live] A self-granting an organization membership -> {org_insert}")
    assert org_insert is not None, "users must not be able to grant themselves a membership"

    student_insert = scoped_db.execute_expecting_denial(
        """
        insert into public.student_college_memberships
            (student_id, college_id, department, batch)
        values (%s, %s, 'CSE', '2026')
        """,
        (student_a.user_id, college_id),
        student_a.claims(),
    )
    print(f"[live] A self-enrolling into a college -> {student_insert}")
    assert student_insert is not None, "users must not be able to self-enroll into a college"


def test_college_role_cannot_escalate_its_own_membership(
    scoped_db: Any, admin_db: Any, student_b: LiveAccount, seeded_tenancy: Any
) -> None:
    """A college-role token must not be able to write membership rows either.

    The seeded row is (`owner`, `active`). If RLS were missing, this token whose
    subject owns the row would be able to downgrade or remove it.
    """
    college_claims = claims_for(student_b.user_id, "college")

    rowcount = scoped_db.execute(
        """
        update public.organization_memberships
        set membership_role = 'viewer', status = 'removed'
        where user_id = %s
        """,
        (student_b.user_id,),
        college_claims,
    )
    print(f"\n[live] college-role membership write -> rowcount {rowcount}")
    assert rowcount == 0, "membership rows are provisioned by operators, not by the user"

    stored = admin_db.one(
        "select membership_role, status from public.organization_memberships where user_id = %s",
        (student_b.user_id,),
    )
    assert stored is not None, "the seeded membership row disappeared"
    assert stored["membership_role"] == "owner" and stored["status"] == "active", (
        "a college-role token must not be able to alter its own membership row"
    )

    # Reading scope must still be limited to their own rows.
    rows = scoped_db.select(
        "select user_id from public.organization_memberships", (), college_claims
    )
    assert all(row["user_id"] == student_b.user_id for row in rows)


def test_authenticated_users_can_still_read_reference_data(scoped_db: Any, student_a: LiveAccount) -> None:
    """Positive control: RLS must not lock users out of shared reference data."""
    colleges = scoped_db.select(
        "select id from public.colleges where verified_status = 'verified'", (), student_a.claims()
    )
    requirements = scoped_db.select("select id from public.role_requirements", (), student_a.claims())
    print(
        f"\n[live] reference data visible to A: colleges={len(colleges)} "
        f"role_requirements={len(requirements)}"
    )
