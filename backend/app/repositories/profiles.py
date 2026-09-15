"""Profile and organisation-membership persistence."""

from __future__ import annotations

from typing import Any

from app.repositories.base import user_scoped_connection

# Columns returned to the API. Kept explicit so `select *` can never leak a
# column that was added later for internal use.
PROFILE_COLUMNS: tuple[str, ...] = (
    "user_id",
    "display_name",
    "email",
    "phone",
    "location",
    "linkedin_url",
    "github_url",
    "education",
    "experience",
    "interests",
    "target_role_id",
    "target_role_name",
    "target_salary_inr",
    "timeframe_years",
    "onboarding_state",
    "discoverability",
    "created_at",
    "updated_at",
)

# API field name -> database column. Doubles as the write whitelist, so a
# payload key can never be interpolated into SQL.
UPDATABLE_COLUMNS: dict[str, str] = {
    "display_name": "display_name",
    "phone": "phone",
    "location": "location",
    "linkedin_url": "linkedin_url",
    "github_url": "github_url",
    "education": "education",
    "experience": "experience",
    "interests": "interests",
    "target_role_name": "target_role_name",
    "target_salary_inr": "target_salary_inr",
    "timeframe_years": "timeframe_years",
    "onboarding_state": "onboarding_state",
    "discoverability": "discoverability",
}

_SELECT_LIST = ", ".join(PROFILE_COLUMNS)


class ProfilesRepository:
    """Reads/writes executed under the caller's RLS context."""

    async def get_by_user_id(self, claims: dict[str, Any], user_id: str) -> dict[str, Any] | None:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                f"select {_SELECT_LIST} from public.profiles where user_id = %s",
                (user_id,),
            )
            return await cursor.fetchone()

    async def update_fields(
        self,
        claims: dict[str, Any],
        user_id: str,
        fields: dict[str, Any],
    ) -> dict[str, Any] | None:
        assignments: list[str] = []
        values: list[Any] = []

        for api_field, value in fields.items():
            column = UPDATABLE_COLUMNS.get(api_field)
            if column is None:
                continue
            assignments.append(f"{column} = %s")
            values.append(value)

        # Changing the target role invalidates the Twin's inputs. The Twin is
        # flagged for refresh, never regenerated here.
        if "target_role_name" in fields:
            assignments.append("career_twin_stale = true")

        if not assignments:
            return await self.get_by_user_id(claims, user_id)

        values.append(user_id)
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                f"update public.profiles set {', '.join(assignments)}, updated_at = now() "
                f"where user_id = %s returning {_SELECT_LIST}",
                tuple(values),
            )
            return await cursor.fetchone()

    async def list_memberships(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select m.id,
                       m.membership_role,
                       m.status,
                       m.college_id,
                       m.recruiter_organization_id,
                       coalesce(c.name, r.name) as organization_name
                from public.organization_memberships m
                left join public.colleges c on c.id = m.college_id
                left join public.recruiter_organizations r on r.id = m.recruiter_organization_id
                where m.user_id = %s
                order by m.created_at asc
                """,
                (user_id,),
            )
            return list(await cursor.fetchall())
