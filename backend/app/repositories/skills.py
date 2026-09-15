"""Skills and skill evidence persistence via Supabase PostgREST.

Skills are normalized before storage. Evidence is linked to source.

Key invariants:
    - Proficiency is nullable. Resume extraction does not prove proficiency.
    - If a skill is manually verified, do NOT overwrite on re-extraction.
    - Evidence always links back to its source (resume_id, etc.).
"""

from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.skills_repo")

SKILL_COLUMNS: tuple[str, ...] = (
    "id",
    "user_id",
    "normalized_skill_key",
    "display_name",
    "proficiency",
    "source_summary",
    "verified",
    "created_at",
    "updated_at",
)


class SkillsRepository:
    """Reads/writes skill records via Supabase PostgREST."""

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    async def get_by_normalized_key(
        self,
        claims: dict[str, Any],
        user_id: str,
        normalized_key: str,
    ) -> dict[str, Any] | None:
        """Fetch an existing skill by normalized key."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(SKILL_COLUMNS)
        rows = await client.select(
            "skills",
            access_token,
            columns=select_list,
            filters={
                "user_id": f"eq.{user_id}",
                "normalized_skill_key": f"eq.{normalized_key}",
            },
            limit=1,
        )
        return rows[0] if rows else None

    async def upsert_skill(
        self,
        claims: dict[str, Any],
        *,
        user_id: str,
        normalized_key: str,
        display_name: str,
        source_summary: str = "",
    ) -> dict[str, Any] | None:
        """Create a skill if it doesn't exist; update display_name/source if not verified.

        RULE: If the skill is already manually verified, we update the source
        summary but do NOT change display_name or proficiency.
        """
        client = await self._client()
        access_token = claims.get("_access_token", "")

        existing = await self.get_by_normalized_key(claims, user_id, normalized_key)

        if existing:
            skill_id = str(existing.get("id", ""))
            if existing.get("verified"):
                # Manually verified — only update source_summary
                if source_summary:
                    await client.update(
                        "skills", access_token,
                        filters={"id": f"eq.{skill_id}"},
                        payload={"source_summary": source_summary},
                    )
                return existing
            else:
                # Not verified — update display_name and source_summary
                updated = await client.update(
                    "skills", access_token,
                    filters={"id": f"eq.{skill_id}"},
                    payload={
                        "display_name": display_name,
                        "source_summary": source_summary,
                    },
                )
                return updated or existing
        else:
            # New skill — create it (proficiency left null intentionally)
            payload: dict[str, Any] = {
                "user_id": user_id,
                "normalized_skill_key": normalized_key,
                "display_name": display_name,
                "source_summary": source_summary,
                "verified": False,
            }
            return await client.insert("skills", access_token, payload=payload)

    async def create_skill_evidence(
        self,
        claims: dict[str, Any],
        *,
        user_id: str,
        skill_id: str,
        source_type: str,
        source_id: str | None,
        evidence_text: str,
    ) -> dict[str, Any] | None:
        """Create a skill evidence record linking to its source."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        payload: dict[str, Any] = {
            "user_id": user_id,
            "skill_id": skill_id,
            "source_type": source_type,
            "evidence_text": evidence_text[:1000],  # truncate, not lose
        }
        if source_id:
            payload["source_id"] = source_id

        return await client.insert("skill_evidence", access_token, payload=payload)

    async def list_skills(
        self,
        claims: dict[str, Any],
        user_id: str,
    ) -> list[dict[str, Any]]:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(SKILL_COLUMNS)
        return await client.select(
            "skills",
            access_token,
            columns=select_list,
            filters={
                "user_id": f"eq.{user_id}",
                "order": "display_name.asc",
            },
            limit=200,
        )
