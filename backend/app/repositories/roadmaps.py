"""Roadmap and milestone persistence.

All statements run under the caller's RLS context: `roadmaps` and
`roadmap_milestones` are only readable/writable for rows whose `user_id` matches
the verified token subject. Creating a roadmap archives the previous active one
so `latest` is unambiguous.
"""

from __future__ import annotations

import json
from typing import Any

from app.repositories.base import user_scoped_connection

_ROADMAP_COLUMNS = (
    "id, user_id, target_role_name, requirements_version, version, "
    "pace_hours_per_week, plan, status, generated_by, created_at"
)

_MILESTONE_COLUMNS = "id, week_number, title, status, completed_at, created_at"


class RoadmapsRepository:
    async def create_roadmap(
        self,
        claims: dict[str, Any],
        user_id: str,
        *,
        target_role_name: str,
        requirements_version: int | None,
        pace_hours_per_week: int | None,
        plan: dict[str, Any],
        generated_by: str | None,
        milestones: list[dict[str, Any]],
    ) -> dict[str, Any]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                "select coalesce(max(version), 0) + 1 as next_version "
                "from public.roadmaps where user_id = %s",
                (user_id,),
            )
            row = await cursor.fetchone()
            next_version = int((row or {}).get("next_version") or 1)

            # Supersede the previous active roadmap so `latest` stays unique.
            await conn.execute(
                "update public.roadmaps set status = 'archived', updated_at = now() "
                "where user_id = %s and status = 'active'",
                (user_id,),
            )

            cursor = await conn.execute(
                f"""
                insert into public.roadmaps
                  (user_id, target_role_name, requirements_version, version,
                   pace_hours_per_week, plan, generated_by)
                values (%s, %s, %s, %s, %s, %s::jsonb, %s)
                returning {_ROADMAP_COLUMNS}
                """,
                (
                    user_id,
                    target_role_name,
                    requirements_version,
                    next_version,
                    pace_hours_per_week,
                    json.dumps(plan),
                    generated_by,
                ),
            )
            created = await cursor.fetchone()
            if created is None:
                return {}

            if milestones:
                await conn.executemany(
                    """
                    insert into public.roadmap_milestones
                      (roadmap_id, user_id, week_number, title)
                    values (%s, %s, %s, %s)
                    on conflict (roadmap_id, week_number) do nothing
                    """,
                    [
                        (created["id"], user_id, int(m["week_number"]), str(m["title"]))
                        for m in milestones
                    ],
                )
            return created

    async def get_latest(self, claims: dict[str, Any], user_id: str) -> dict[str, Any] | None:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                f"""
                select r.id, r.user_id, r.target_role_name, r.requirements_version,
                       r.version, r.pace_hours_per_week, r.plan, r.status,
                       r.generated_by, r.created_at,
                       coalesce(p.career_twin_stale, false) as career_twin_stale
                from public.roadmaps r
                left join public.profiles p on p.user_id = r.user_id
                where r.user_id = %s and r.status = 'active'
                order by r.created_at desc
                limit 1
                """,
                (user_id,),
            )
            roadmap = await cursor.fetchone()
            if roadmap is None:
                return None

            cursor = await conn.execute(
                f"""
                select {_MILESTONE_COLUMNS}
                from public.roadmap_milestones
                where roadmap_id = %s
                order by week_number asc
                """,
                (roadmap["id"],),
            )
            roadmap["milestones"] = list(await cursor.fetchall())
            return roadmap

    async def update_milestone(
        self,
        claims: dict[str, Any],
        user_id: str,
        milestone_id: str,
        status: str,
    ) -> dict[str, Any] | None:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                f"""
                update public.roadmap_milestones
                set status = %s,
                    completed_at = case when %s = 'complete' then now() else null end,
                    updated_at = now()
                where id = %s and user_id = %s
                returning {_MILESTONE_COLUMNS}
                """,
                (status, status, milestone_id, user_id),
            )
            milestone = await cursor.fetchone()
            if milestone is None:
                return None

            # Learning progress changed: the Twin is now stale but is NOT
            # regenerated here. Completion is never treated as skill mastery.
            if status == "complete":
                await conn.execute(
                    "update public.profiles set career_twin_stale = true, updated_at = now() "
                    "where user_id = %s",
                    (user_id,),
                )
            return milestone
