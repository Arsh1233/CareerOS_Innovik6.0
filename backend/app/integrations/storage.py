"""Supabase Storage integration (private buckets).

Raw resume bytes are uploaded to a private bucket when storage is configured.
The upload is *best-effort*: when it is not configured or fails, the analysis
still runs on the bytes held in the request, and `storage_path` is recorded as
null. That is reported to the caller rather than hidden — no fake path is
written.
"""

from __future__ import annotations

import logging

import httpx

from app.core.config import Settings

logger = logging.getLogger("careeros.storage")

REQUEST_TIMEOUT_SECONDS = 30.0


class SupabaseStorageClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def is_configured(self) -> bool:
        return bool(self._settings.supabase_url and self._settings.supabase_anon_key)

    async def upload(
        self,
        *,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str,
        access_token: str,
    ) -> str | None:
        """Upload as the calling user. Returns the storage path, or None.

        Uploading with the user's own token means the bucket's storage policies
        decide access — the service-role key is not used for user uploads.
        """
        if not self.is_configured:
            logger.info("resume_storage_not_configured")
            return None

        url = f"{self._settings.supabase_url}/storage/v1/object/{bucket}/{path}"
        headers = {
            "apikey": self._settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": content_type or "application/octet-stream",
            "x-upsert": "false",
        }
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post(url, content=content, headers=headers)
        except httpx.HTTPError as exc:
            logger.warning("resume_storage_upload_failed error=%s", type(exc).__name__)
            return None

        if response.status_code in (200, 201):
            return path
        logger.warning("resume_storage_upload_non_success status=%s", response.status_code)
        return None
