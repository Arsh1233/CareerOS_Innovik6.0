"""Qdrant vector database integration for resume embeddings.

Resume vectors are derived data — PostgreSQL is the authoritative source.
Qdrant is an index. If Qdrant fails, the resume analysis is NOT lost.

Collection: resume_embeddings
Vector size: 384 (BAAI/bge-small-en-v1.5)
Distance: Cosine

Payload fields (no sensitive data):
    resume_id, user_id, resume_version, target_role, created_at

IMPORTANT:
    - Full resume text is NEVER stored in Qdrant payload.
    - Auth tokens and API keys are NEVER stored in Qdrant payload.
    - PostgreSQL remains the authoritative source.
    - A Qdrant failure must NOT roll back a valid resume analysis.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from app.core.config import Settings, get_settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.qdrant")

VECTOR_SIZE = 384
DISTANCE = "Cosine"
COLLECTION_NAME = "resume_embeddings"


class QdrantIntegration:
    """Async wrapper around qdrant-client for resume embedding operations."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Any = None

    @property
    def is_configured(self) -> bool:
        return bool(self._settings.qdrant_url)

    def _require_configured(self) -> None:
        if not self.is_configured:
            raise ApiError(
                503,
                "qdrant_not_configured",
                "Vector search is not configured on the server.",
            )

    async def _get_client(self) -> Any:
        if self._client is None:
            try:
                from qdrant_client import AsyncQdrantClient
            except ImportError as exc:
                raise ApiError(
                    503,
                    "qdrant_not_installed",
                    "Qdrant client is not installed.",
                ) from exc

            self._require_configured()
            kwargs: dict[str, Any] = {"url": self._settings.qdrant_url}
            if self._settings.qdrant_api_key:
                kwargs["api_key"] = self._settings.qdrant_api_key

            self._client = AsyncQdrantClient(**kwargs)
        return self._client

    async def ensure_collection_exists(self) -> None:
        """Create the resume_embeddings collection if absent.

        Idempotent — safe to call on every startup.
        """
        self._require_configured()
        try:
            from qdrant_client.models import Distance, VectorParams

            client = await self._get_client()
            collections = await client.get_collections()
            existing = {c.name for c in collections.collections}

            if COLLECTION_NAME not in existing:
                await client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                )
                logger.info("qdrant_collection_created name=%s", COLLECTION_NAME)
            else:
                logger.debug("qdrant_collection_exists name=%s", COLLECTION_NAME)
        except ApiError:
            raise
        except Exception as exc:
            logger.warning("qdrant_ensure_collection_failed error=%s", repr(exc))
            raise ApiError(
                503,
                "qdrant_unavailable",
                "Could not connect to the vector database.",
            ) from exc

    async def upsert_resume(
        self,
        *,
        resume_id: str,
        user_id: str,
        resume_version: int,
        vector: list[float],
        target_role: str | None = None,
        created_at: str = "",
    ) -> None:
        """Insert or replace the resume embedding point in Qdrant.

        Payload contains only non-secret metadata. Full resume text
        is never stored here.
        """
        self._require_configured()
        try:
            from qdrant_client.models import PointStruct

            client = await self._get_client()
            # Use a deterministic UUID derived from resume_id for the point
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"resume:{resume_id}"))

            payload: dict[str, Any] = {
                "resume_id": resume_id,
                "user_id": user_id,
                "resume_version": resume_version,
                "created_at": created_at,
            }
            if target_role:
                payload["target_role"] = target_role

            await client.upsert(
                collection_name=COLLECTION_NAME,
                points=[PointStruct(id=point_id, vector=vector, payload=payload)],
            )
            logger.info("qdrant_upsert_ok resume_id=<redacted>")
        except ApiError:
            raise
        except Exception as exc:
            logger.warning("qdrant_upsert_failed error=%s", repr(exc))
            raise ApiError(
                503,
                "qdrant_unavailable",
                "Could not write to the vector database.",
            ) from exc

    async def delete_resume(self, resume_id: str) -> None:
        """Delete a resume's embedding point. Best-effort."""
        if not self.is_configured:
            return
        try:
            from qdrant_client.models import PointIdsList

            client = await self._get_client()
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"resume:{resume_id}"))
            await client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=PointIdsList(points=[point_id]),
            )
        except Exception as exc:
            logger.warning("qdrant_delete_failed error=%s", repr(exc))


# ── Factory ────────────────────────────────────────────────────────────────

_qdrant: QdrantIntegration | None = None


def get_qdrant() -> QdrantIntegration:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantIntegration(get_settings())
    return _qdrant
