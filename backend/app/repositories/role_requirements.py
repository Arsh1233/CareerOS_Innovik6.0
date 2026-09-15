"""Role requirements repository via Supabase PostgREST.

Role requirements are read by all authenticated users (needed for gap analysis).
No user-scoped writes — requirements come from migrations/seeds only.
"""

from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.role_requirements_repo")

REQUIREMENT_COLUMNS: tuple[str, ...] = (
    "id",
    "role_name",
    "skill_name",
    "display_name",
    "importance",
    "minimum_level",
    "version",
)


class RoleRequirementsRepository:
    """Reads role_required_skills via Supabase PostgREST."""

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    async def get_requirements_for_role(
        self,
        access_token: str,
        role_name: str,
        version: int = 1,
    ) -> list[dict[str, Any]]:
        """Return all required skills for a given normalised role name and version."""
        client = await self._client()
        select_list = ",".join(REQUIREMENT_COLUMNS)
        return await client.select(
            "role_required_skills",
            access_token,
            columns=select_list,
            filters={
                "role_name": f"eq.{role_name.lower().strip()}",
                "version": f"eq.{version}",
                "order": "importance.asc",
            },
            limit=100,
        )
