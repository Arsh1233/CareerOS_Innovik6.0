"""Resume persistence via Supabase PostgREST.

Every user-scoped request carries the authenticated user's JWT.
RLS policies enforce ownership at the database level.

    FastAPI → Supabase PostgREST → PostgreSQL RLS
"""

from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.resumes_repo")

RESUME_COLUMNS: tuple[str, ...] = (
    "id",
    "user_id",
    "storage_path",
    "original_filename",
    "mime_type",
    "file_size_bytes",
    "content_hash",
    "version",
    "parse_status",
    "analysis_status",
    "embedding_status",
    "extracted_data",
    "analysis",
    "resume_quality_score",
    "score_version",
    "score_breakdown",
    "model_provider",
    "model_name",
    "prompt_version",
    "is_archived",
    "created_at",
    "updated_at",
)

# extracted_text is intentionally excluded from default columns — too large
# for list operations. Fetched explicitly when needed.


class ResumesRepository:
    """Reads/writes resume records via Supabase PostgREST."""

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    # ── Create ────────────────────────────────────────────────────────────

    async def create(
        self,
        claims: dict[str, Any],
        *,
        user_id: str,
        storage_path: str,
        original_filename: str,
        mime_type: str,
        file_size_bytes: int,
        content_hash: str,
        version: int = 1,
    ) -> dict[str, Any] | None:
        """Create a new resume row with pending pipeline statuses."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        payload: dict[str, Any] = {
            "user_id": user_id,
            "storage_path": storage_path,
            "original_filename": original_filename,
            "mime_type": mime_type,
            "file_size_bytes": file_size_bytes,
            "content_hash": content_hash,
            "version": version,
            "parse_status": "pending",
            "analysis_status": "pending",
            "embedding_status": "pending",
            "is_archived": False,
        }

        return await client.insert("resumes", access_token, payload=payload)

    # ── Status updates (pipeline steps update independently) ──────────────

    async def update_parse_status(
        self,
        claims: dict[str, Any],
        resume_id: str,
        *,
        status: str,
        extracted_data: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        payload: dict[str, Any] = {"parse_status": status}
        if extracted_data is not None:
            payload["extracted_data"] = extracted_data
        return await client.update(
            "resumes", access_token,
            filters={"id": f"eq.{resume_id}"},
            payload=payload,
        )

    async def update_extracted_text(
        self,
        claims: dict[str, Any],
        resume_id: str,
        *,
        extracted_text: str,
    ) -> None:
        """Store extracted text separately (large field, not in default select)."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        await client.update(
            "resumes", access_token,
            filters={"id": f"eq.{resume_id}"},
            payload={"extracted_text": extracted_text},
        )

    async def update_analysis(
        self,
        claims: dict[str, Any],
        resume_id: str,
        *,
        analysis: dict[str, Any],
        analysis_status: str,
        resume_quality_score: int | None,
        score_version: str | None,
        score_breakdown: dict[str, Any] | None,
        model_provider: str,
        model_name: str,
        prompt_version: str,
    ) -> dict[str, Any] | None:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        payload: dict[str, Any] = {
            "analysis": analysis,
            "analysis_status": analysis_status,
            "model_provider": model_provider,
            "model_name": model_name,
            "prompt_version": prompt_version,
        }
        if resume_quality_score is not None:
            payload["resume_quality_score"] = resume_quality_score
        if score_version:
            payload["score_version"] = score_version
        if score_breakdown:
            payload["score_breakdown"] = score_breakdown
        return await client.update(
            "resumes", access_token,
            filters={"id": f"eq.{resume_id}"},
            payload=payload,
        )

    async def update_embedding_status(
        self,
        claims: dict[str, Any],
        resume_id: str,
        *,
        status: str,
    ) -> None:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        await client.update(
            "resumes", access_token,
            filters={"id": f"eq.{resume_id}"},
            payload={"embedding_status": status},
        )

    async def update_storage_path(
        self,
        claims: dict[str, Any],
        resume_id: str,
        *,
        storage_path: str,
    ) -> None:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        await client.update(
            "resumes", access_token,
            filters={"id": f"eq.{resume_id}"},
            payload={"storage_path": storage_path},
        )

    # ── Read ──────────────────────────────────────────────────────────────

    async def get_extracted_text(
        self,
        claims: dict[str, Any],
        resume_id: str,
    ) -> str:
        """Fetch the large extracted_text field separately."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        rows = await client.select(
            "resumes",
            access_token,
            columns="extracted_text",
            filters={"id": f"eq.{resume_id}"},
            limit=1,
        )
        return rows[0].get("extracted_text", "") if rows else ""

    async def get_latest(
        self,
        claims: dict[str, Any],
        user_id: str,
    ) -> dict[str, Any] | None:
        """Get the most recent non-archived resume for the user."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(RESUME_COLUMNS)
        rows = await client.select(
            "resumes",
            access_token,
            columns=select_list,
            filters={
                "user_id": f"eq.{user_id}",
                "is_archived": "eq.false",
                "order": "created_at.desc",
            },
            limit=1,
        )
        return rows[0] if rows else None

    async def get_by_id(
        self,
        claims: dict[str, Any],
        resume_id: str,
    ) -> dict[str, Any] | None:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(RESUME_COLUMNS)
        rows = await client.select(
            "resumes",
            access_token,
            columns=select_list,
            filters={"id": f"eq.{resume_id}"},
            limit=1,
        )
        return rows[0] if rows else None

    async def get_by_hash(
        self,
        claims: dict[str, Any],
        user_id: str,
        content_hash: str,
    ) -> dict[str, Any] | None:
        """Find an existing resume by content hash (for duplicate detection)."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        select_list = ",".join(RESUME_COLUMNS)
        rows = await client.select(
            "resumes",
            access_token,
            columns=select_list,
            filters={
                "user_id": f"eq.{user_id}",
                "content_hash": f"eq.{content_hash}",
                "is_archived": "eq.false",
                "order": "created_at.desc",
            },
            limit=1,
        )
        return rows[0] if rows else None

    async def list_resumes(
        self,
        claims: dict[str, Any],
        user_id: str,
        include_archived: bool = False,
    ) -> list[dict[str, Any]]:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        list_cols = ",".join([
            "id", "user_id", "original_filename", "file_size_bytes", "version",
            "parse_status", "analysis_status", "embedding_status",
            "resume_quality_score", "is_archived", "created_at",
        ])
        filters: dict[str, str] = {
            "user_id": f"eq.{user_id}",
            "order": "created_at.desc",
        }
        if not include_archived:
            filters["is_archived"] = "eq.false"

        return await client.select(
            "resumes",
            access_token,
            columns=list_cols,
            filters=filters,
            limit=50,
        )

    # ── Archive (soft-delete) ─────────────────────────────────────────────

    async def archive(
        self,
        claims: dict[str, Any],
        resume_id: str,
    ) -> dict[str, Any] | None:
        """Soft-delete: mark as archived. Preserves evidence history."""
        client = await self._client()
        access_token = claims.get("_access_token", "")
        return await client.update(
            "resumes", access_token,
            filters={"id": f"eq.{resume_id}"},
            payload={"is_archived": True},
        )
