"""Skill-gap reads.

Every query runs on the caller's RLS-scoped connection, so a student can only
ever read their own `skills`/`skill_evidence` rows. `role_requirements` and
`role_required_skills` are shared reference data readable by any authenticated
user.
"""

from __future__ import annotations

from typing import Any

from app.repositories.base import user_scoped_connection


class SkillsRepository:
    async def get_profile_context(
        self, claims: dict[str, Any], user_id: str
    ) -> dict[str, Any] | None:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select target_role_name, career_twin_stale
                from public.profiles
                where user_id = %s
                """,
                (user_id,),
            )
            return await cursor.fetchone()

    async def get_latest_role_requirement(
        self, claims: dict[str, Any], role_name: str
    ) -> dict[str, Any] | None:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select id, role_name, seniority, requirements_version
                from public.role_requirements
                where lower(role_name) = lower(%s)
                order by requirements_version desc
                limit 1
                """,
                (role_name,),
            )
            return await cursor.fetchone()

    async def list_required_skills(
        self, claims: dict[str, Any], role_requirement_id: str
    ) -> list[dict[str, Any]]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select skill_key, skill_name, importance, minimum_level
                from public.role_required_skills
                where role_requirement_id = %s
                order by skill_name asc
                """,
                (role_requirement_id,),
            )
            return list(await cursor.fetchall())

    async def list_user_skills(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select skill_key, skill_name, proficiency, evidence_summary
                from public.skills
                where user_id = %s
                order by skill_name asc
                """,
                (user_id,),
            )
            return list(await cursor.fetchall())

    async def list_evidence(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select skill_key, source_type, detail, observed_level
                from public.skill_evidence
                where user_id = %s
                order by created_at asc
                """,
                (user_id,),
            )
            return list(await cursor.fetchall())
