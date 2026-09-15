from __future__ import annotations

import logging
from typing import Any

from app.integrations.postgrest import PostgRESTClient

logger = logging.getLogger("careeros.jobs_repo")


class JobsRepository:
    """Reads/writes jobs and job_applications via Supabase PostgREST using the
    caller's JWT. RLS enforces isolation.
    """

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    # ── Jobs ─────────────────────────────────────────────────────────────────

    async def create_job(self, access_token: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        client = await self._client()
        return await client.insert(
            table="jobs",
            access_token=access_token,
            payload=payload,
        )

    async def list_active_jobs(self, access_token: str) -> list[dict[str, Any]]:
        client = await self._client()
        return await client.select(
            table="jobs",
            access_token=access_token,
            filters={"status": "eq.active", "order": "created_at.desc"},
            limit=0,
        )
        
    async def list_recruiter_jobs(self, access_token: str, recruiter_id: str) -> list[dict[str, Any]]:
        client = await self._client()
        return await client.select(
            table="jobs",
            access_token=access_token,
            filters={"recruiter_id": f"eq.{recruiter_id}", "order": "created_at.desc"},
            limit=0,
        )

    # ── Applications ─────────────────────────────────────────────────────────

    async def create_application(self, access_token: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        client = await self._client()
        return await client.insert(
            table="job_applications",
            access_token=access_token,
            payload=payload,
        )

    async def get_student_applications(self, access_token: str, student_id: str) -> list[dict[str, Any]]:
        client = await self._client()
        return await client.select(
            table="job_applications",
            access_token=access_token,
            filters={"student_id": f"eq.{student_id}"},
            limit=0,
        )

    async def get_recruiter_applications(self, access_token: str) -> list[dict[str, Any]]:
        """Fetch applications for all jobs owned by the current recruiter.
        RLS guarantees they only see their own applications.
        """
        client = await self._client()
        # PostgREST allows embedding related tables if foreign keys are set up, 
        # but for simplicity, we just fetch all visible applications.
        # Ideally, we would join with the student profile here, but we will do it in service layer.
        return await client.select(
            table="job_applications",
            access_token=access_token,
            filters={"order": "created_at.desc"},
            limit=0,
        )

    async def update_application_status(self, access_token: str, application_id: str, status: str) -> dict[str, Any] | None:
        client = await self._client()
        return await client.update(
            table="job_applications",
            access_token=access_token,
            filters={"id": f"eq.{application_id}"},
            payload={"status": status},
        )
