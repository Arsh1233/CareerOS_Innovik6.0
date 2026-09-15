"""Roadmap and milestone persistence via Supabase PostgREST.

Every user-scoped request carries the authenticated user's JWT.
RLS policies enforce ownership at the database level.

    FastAPI → Supabase PostgREST → RLS → PostgreSQL
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.roadmaps_repo")

ROADMAP_COLUMNS: tuple[str, ...] = (
    "id",
    "user_id",
    "target_role",
    "version",
    "pace_hours_per_week",
    "plan",
    "status",
    "model_provider",
    "model_name",
    "prompt_version",
    "created_at",
    "updated_at",
)

MILESTONE_COLUMNS: tuple[str, ...] = (
    "id",
    "roadmap_id",
    "user_id",
    "week_number",
    "title",
    "description",
    "status",
    "completed_at",
    "created_at",
    "updated_at",
)


class RoadmapsRepository:
    """Reads/writes roadmap records via Supabase PostgREST."""

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    async def create(
        self,
        claims: dict[str, Any],
        *,
        user_id: str,
        target_role: str,
        pace_hours_per_week: int,
        plan: dict[str, Any],
        model_provider: str = "groq",
        model_name: str = "",
        prompt_version: str = "v1",
    ) -> dict[str, Any] | None:
        """Insert a new roadmap and return the persisted row."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        # Archive any previous active roadmap first
        await client.update(
            "roadmaps",
            access_token,
            filters={
                "user_id": f"eq.{user_id}",
                "status": "eq.active",
            },
            payload={"status": "archived"},
        )

        return await client.insert(
            "roadmaps",
            access_token,
            payload={
                "user_id": user_id,
                "target_role": target_role,
                "pace_hours_per_week": pace_hours_per_week,
                "plan": plan,
                "status": "active",
                "model_provider": model_provider,
                "model_name": model_name,
                "prompt_version": prompt_version,
            },
        )

    async def get_latest(
        self,
        claims: dict[str, Any],
        user_id: str,
    ) -> dict[str, Any] | None:
        """Get the most recent active roadmap for the user."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(ROADMAP_COLUMNS)
        rows = await client.select(
            "roadmaps",
            access_token,
            columns=select_list,
            filters={
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
            },
            limit=1,
        )
        return rows[0] if rows else None

    async def mark_stale(
        self,
        claims: dict[str, Any],
        roadmap_id: str,
    ) -> dict[str, Any] | None:
        """Mark a roadmap as stale (Career Twin staleness propagation)."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        return await client.update(
            "roadmaps",
            access_token,
            filters={"id": f"eq.{roadmap_id}"},
            payload={"status": "stale"},
        )

    # ── Milestones ────────────────────────────────────────────────────────

    async def create_milestones(
        self,
        claims: dict[str, Any],
        milestones: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Bulk-insert milestones. Returns what was inserted (best-effort list)."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        results = []
        for m in milestones:
            try:
                row = await client.insert("roadmap_milestones", access_token, payload=m)
                if row:
                    results.append(row)
            except Exception as exc:
                logger.warning("milestone_insert_failed title=%s error=%s", m.get("title"), exc)
        return results

    async def list_milestones(
        self,
        claims: dict[str, Any],
        roadmap_id: str,
    ) -> list[dict[str, Any]]:
        """Return all milestones for a roadmap, ordered by week then insertion."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(MILESTONE_COLUMNS)
        return await client.select(
            "roadmap_milestones",
            access_token,
            columns=select_list,
            filters={
                "roadmap_id": f"eq.{roadmap_id}",
                "order": "week_number.asc,created_at.asc",
            },
            limit=500,
        )

    async def get_milestone(
        self,
        claims: dict[str, Any],
        milestone_id: str,
    ) -> dict[str, Any] | None:
        """Fetch a single milestone by ID."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(MILESTONE_COLUMNS)
        rows = await client.select(
            "roadmap_milestones",
            access_token,
            columns=select_list,
            filters={"id": f"eq.{milestone_id}"},
            limit=1,
        )
        return rows[0] if rows else None

    async def update_milestone_status(
        self,
        claims: dict[str, Any],
        milestone_id: str,
        status: str,
    ) -> dict[str, Any] | None:
        """Patch milestone status. Sets completed_at when marking completed."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        payload: dict[str, Any] = {"status": status}
        if status == "completed":
            payload["completed_at"] = datetime.now(timezone.utc).isoformat()
        elif status in ("pending", "in_progress"):
            payload["completed_at"] = None

        return await client.update(
            "roadmap_milestones",
            access_token,
            filters={"id": f"eq.{milestone_id}"},
            payload=payload,
        )
