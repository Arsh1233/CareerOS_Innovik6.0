"""Resume persistence.

Every statement runs on the caller's RLS-scoped connection, so a student can
only read, mutate or delete their own resumes.
"""

from __future__ import annotations

import json
from typing import Any

from app.repositories.base import user_scoped_connection

_RESUME_COLUMNS = (
    "id, user_id, filename, mime_type, size_bytes, content_hash, storage_path, "
    "version, parse_status, analysis_status, extracted_text, extracted_data, "
    "analysis, ats_score, created_at"
)


class ResumesRepository:
    async def create(
        self,
        claims: dict[str, Any],
        user_id: str,
        *,
        filename: str,
        mime_type: str | None,
        size_bytes: int | None,
        content_hash: str,
        storage_path: str | None,
        parse_status: str,
        analysis_status: str,
        extracted_text: str | None,
        extracted_data: dict[str, Any],
        analysis: dict[str, Any] | None,
        ats_score: int | None,
    ) -> dict[str, Any]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                "select coalesce(max(version), 0) + 1 as next_version "
                "from public.resumes where user_id = %s",
                (user_id,),
            )
            row = await cursor.fetchone()
            version = int((row or {}).get("next_version") or 1)

            cursor = await conn.execute(
                f"""
                insert into public.resumes
                  (user_id, filename, mime_type, size_bytes, content_hash,
                   storage_path, version, parse_status, analysis_status,
                   extracted_text, extracted_data, analysis, ats_score)
                values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
                returning {_RESUME_COLUMNS}
                """,
                (
                    user_id,
                    filename,
                    mime_type,
                    size_bytes,
                    content_hash,
                    storage_path,
                    version,
                    parse_status,
                    analysis_status,
                    extracted_text,
                    json.dumps(extracted_data),
                    json.dumps(analysis) if analysis is not None else None,
                    ats_score,
                ),
            )
            created = await cursor.fetchone()
            return created or {}

    async def get_latest(
        self, claims: dict[str, Any], user_id: str
    ) -> dict[str, Any] | None:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                f"""
                select {_RESUME_COLUMNS}
                from public.resumes
                where user_id = %s
                order by created_at desc
                limit 1
                """,
                (user_id,),
            )
            return await cursor.fetchone()

    async def list_for_user(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                f"""
                select {_RESUME_COLUMNS}
                from public.resumes
                where user_id = %s
                order by created_at desc
                """,
                (user_id,),
            )
            return list(await cursor.fetchall())

    async def delete(
        self, claims: dict[str, Any], user_id: str, resume_id: str
    ) -> bool:
        async with user_scoped_connection(claims) as conn:
            cursor = await conn.execute(
                "delete from public.resumes where id = %s and user_id = %s",
                (resume_id, user_id),
            )
            return cursor.rowcount > 0
