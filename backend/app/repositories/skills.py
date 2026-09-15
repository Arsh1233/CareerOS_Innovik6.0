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

    async def list_skill_vocabulary(self, claims: dict[str, Any]) -> list[dict[str, Any]]:
        """Distinct skills across every role requirement — the matching set used
        to detect skills in resume text."""
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                select distinct skill_key, skill_name
                from public.role_required_skills
                order by skill_name asc
                """
            )
            return list(await cursor.fetchall())

    async def upsert_skill(
        self,
        claims: dict[str, Any],
        user_id: str,
        *,
        skill_key: str,
        skill_name: str,
        evidence_summary: str | None = None,
    ) -> str:
        """Record that a skill has been observed for this user.

        Proficiency is intentionally left untouched — a resume mention is not a
        proficiency assessment.
        """
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                """
                insert into public.skills (user_id, skill_key, skill_name, evidence_summary)
                values (%s, %s, %s, %s)
                on conflict (user_id, skill_key) do update
                  set skill_name = excluded.skill_name,
                      evidence_summary = coalesce(excluded.evidence_summary, public.skills.evidence_summary),
                      updated_at = now()
                returning id
                """,
                (user_id, skill_key, skill_name, evidence_summary),
            )
            row = await cursor.fetchone()
            return str(row["id"]) if row else ""

    async def add_evidence(
        self,
        claims: dict[str, Any],
        user_id: str,
        *,
        skill_id: str | None,
        skill_key: str,
        skill_name: str,
        source_type: str,
        source_ref: str | None,
        detail: str | None = None,
    ) -> None:
        """Add provenance, idempotently: re-analysing the same source is safe.

        `source_ref` identifies the concrete source (for example the resume id),
        so the same skill from the same resume is not recorded twice.
        """
        async with user_scoped_connection(claims) as conn:
            await conn.execute(
                """
                insert into public.skill_evidence
                  (user_id, skill_id, skill_key, skill_name, source_type, source_ref, detail)
                select %s, %s, %s, %s, %s, %s, %s
                where not exists (
                  select 1 from public.skill_evidence
                  where user_id = %s and skill_key = %s
                    and source_type = %s and source_ref is not distinct from %s
                )
                """,
                (
                    user_id,
                    skill_id or None,
                    skill_key,
                    skill_name,
                    source_type,
                    source_ref,
                    detail,
                    user_id,
                    skill_key,
                    source_type,
                    source_ref,
                ),
            )
