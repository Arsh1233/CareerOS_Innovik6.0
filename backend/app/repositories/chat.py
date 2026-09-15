from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.chat_repo")

class ChatRepository:
    """Reads/writes chat sessions and history via Supabase PostgREST using the
    caller's JWT. RLS enforces that a student can only access their own records.
    """

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    async def get_session(
        self,
        access_token: str,
        session_id: str,
    ) -> dict[str, Any] | None:
        """Fetch a specific chat session."""
        client = await self._client()
        rows = await client.select(
            table="chat_sessions",
            access_token=access_token,
            filters={"id": f"eq.{session_id}"},
            limit=1,
        )
        return rows[0] if rows else None
        
    async def get_session_history(
        self,
        access_token: str,
        session_id: str,
    ) -> list[dict[str, Any]]:
        """Fetch all messages for a specific chat session, ordered by creation time."""
        client = await self._client()
        # PostgREST query: select=*&session_id=eq.{session_id}&order=created_at.asc
        rows = await client.select(
            table="chat_history",
            access_token=access_token,
            filters={"session_id": f"eq.{session_id}", "order": "created_at.asc"},
            limit=0, # no limit
        )
        return rows

    async def create_session(
        self,
        access_token: str,
        user_id: str,
    ) -> dict[str, Any] | None:
        """Create a new chat session."""
        client = await self._client()
        return await client.insert(
            table="chat_sessions",
            access_token=access_token,
            payload={"user_id": user_id},
        )

    async def add_message(
        self,
        access_token: str,
        session_id: str,
        role: str,
        message: str,
    ) -> dict[str, Any] | None:
        """Add a message to the chat history."""
        client = await self._client()
        return await client.insert(
            table="chat_history",
            access_token=access_token,
            payload={
                "session_id": session_id,
                "role": role,
                "message": message,
            },
        )
