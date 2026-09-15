from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.interview_repo")


class InterviewRepository:
    """Reads/writes interview_sessions via Supabase PostgREST using the
    caller's JWT. RLS enforces that a student can only access their own records.
    """

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    async def create_session(
        self,
        access_token: str,
        user_id: str,
        interview_type: str,
        difficulty: str,
        target_role: str | None,
    ) -> dict[str, Any] | None:
        """Create a new interview session row with status='active'."""
        client = await self._client()
        return await client.insert(
            table="interview_sessions",
            access_token=access_token,
            payload={
                "user_id": user_id,
                "interview_type": interview_type,
                "difficulty": difficulty,
                "target_role": target_role,
                "status": "active",
            },
        )

    async def get_session(
        self,
        access_token: str,
        session_id: str,
    ) -> dict[str, Any] | None:
        """Fetch a specific interview session (RLS enforces ownership)."""
        client = await self._client()
        rows = await client.select(
            table="interview_sessions",
            access_token=access_token,
            filters={"id": f"eq.{session_id}"},
            limit=1,
        )
        return rows[0] if rows else None

    async def update_session(
        self,
        access_token: str,
        session_id: str,
        **fields: Any,
    ) -> dict[str, Any] | None:
        """Partial update — pass only the fields to change."""
        client = await self._client()
        return await client.update(
            table="interview_sessions",
            access_token=access_token,
            filters={"id": f"eq.{session_id}"},
            payload=fields,
        )

    async def list_sessions(
        self,
        access_token: str,
        user_id: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """List the most recent sessions for a user, newest first."""
        client = await self._client()
        return await client.select(
            table="interview_sessions",
            access_token=access_token,
            filters={
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
            },
            limit=limit,
        )
