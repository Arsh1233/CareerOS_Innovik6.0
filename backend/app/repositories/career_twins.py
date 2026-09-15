"""Career Twin persistence via Supabase PostgREST.

Every user-scoped request carries the authenticated user's JWT.  RLS
policies enforce ownership at the database level.

    FastAPI → Supabase PostgREST → RLS → PostgreSQL
"""

from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.career_twins_repo")

# Columns returned to the API.  Kept explicit to avoid leaking future
# internal columns.
TWIN_COLUMNS: tuple[str, ...] = (
    "id",
    "user_id",
    "target_role",
    "input_version",
    "model_provider",
    "model_name",
    "prompt_version",
    "evidence_snapshot",
    "result",
    "status",
    "created_at",
    "updated_at",
)


class CareerTwinsRepository:
    """Reads/writes career twin records via Supabase PostgREST using the
    caller's JWT.  RLS enforces that a student can only access their own
    records.
    """

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
        target_role: str | None,
        input_version: int,
        model_provider: str,
        model_name: str,
        prompt_version: str,
        evidence_snapshot: dict[str, Any],
        result: dict[str, Any],
        status: str = "generated",
    ) -> dict[str, Any] | None:
        """Insert a new career twin record."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        payload = {
            "user_id": user_id,
            "target_role": target_role,
            "input_version": input_version,
            "model_provider": model_provider,
            "model_name": model_name,
            "prompt_version": prompt_version,
            "evidence_snapshot": evidence_snapshot,
            "result": result,
            "status": status,
        }

        row = await client.insert(
            "career_twins",
            access_token,
            payload=payload,
        )
        return row

    async def get_latest(
        self,
        claims: dict[str, Any],
        user_id: str,
    ) -> dict[str, Any] | None:
        """Get the most recent career twin for the user."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        select_list = ",".join(TWIN_COLUMNS)
        rows = await client.select(
            "career_twins",
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
        twin_id: str,
    ) -> dict[str, Any] | None:
        """Mark a career twin as stale."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        row = await client.update(
            "career_twins",
            access_token,
            filters={"id": f"eq.{twin_id}"},
            payload={"status": "stale"},
        )
        return row
