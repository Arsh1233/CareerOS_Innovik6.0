"""Supabase Storage integration for private resume files.

All resume PDFs are stored in a PRIVATE bucket — never publicly accessible.
Access is always through the backend which verifies ownership before acting.

Architecture:
    FastAPI → Supabase Storage REST API (service-role key for uploads)

Why service-role for storage uploads?
    The Supabase Storage API requires the service-role key for bucket
    management operations (create, upload). User JWTs can be used for
    Storage row-level security via RLS policies, but managing the bucket
    itself requires elevated credentials. The service-role key is NEVER
    sent to the frontend.

IMPORTANT:
    - No public URLs are ever generated.
    - No resume PDF content appears in logs.
    - No storage paths are trusted from the frontend.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.storage")

_STORAGE_TIMEOUT = 30.0


class StorageClient:
    """Thin async wrapper around Supabase Storage REST API.

    Uses the service-role key for uploads/deletes (privileged server ops).
    Never leaks credentials, bucket paths, or file content to logs.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _require_config(self) -> None:
        if not self._settings.supabase_url or not self._settings.supabase_service_role_key:
            raise ApiError(
                503,
                "storage_not_configured",
                "File storage is not configured on the server.",
            )

    def _base_url(self) -> str:
        return f"{self._settings.supabase_url}/storage/v1"

    def _service_headers(self) -> dict[str, str]:
        return {
            "apikey": self._settings.supabase_service_role_key,
            "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
        }

    async def ensure_bucket_exists(self, bucket: str) -> None:
        """Create the private bucket if it does not exist.

        Called once at startup / first upload. Idempotent.
        """
        self._require_config()
        url = f"{self._base_url()}/bucket"
        headers = {**self._service_headers(), "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=_STORAGE_TIMEOUT) as client:
                # Check if bucket already exists
                resp = await client.get(
                    f"{self._base_url()}/bucket/{bucket}",
                    headers=self._service_headers(),
                )
                if resp.status_code == 200:
                    return  # Already exists

                # Create it as private
                resp = await client.post(
                    url,
                    json={
                        "id": bucket,
                        "name": bucket,
                        "public": False,  # NEVER public
                    },
                    headers=headers,
                )
                if resp.status_code not in (200, 201):
                    # 409 = already exists (race condition) — that is fine
                    if resp.status_code != 409:
                        logger.warning(
                            "storage_bucket_create_failed bucket=%s status=%d",
                            bucket,
                            resp.status_code,
                        )
        except httpx.HTTPError as exc:
            logger.warning("storage_bucket_ensure_failed error=%s", type(exc).__name__)
            raise ApiError(
                503,
                "storage_unavailable",
                "File storage is temporarily unreachable.",
            ) from exc

    async def upload_file(
        self,
        bucket: str,
        path: str,
        content: bytes,
        content_type: str = "application/pdf",
    ) -> str:
        """Upload file bytes to the private bucket.

        Returns the storage path (not a URL — never a public URL).
        Raises ApiError on failure.
        """
        self._require_config()
        url = f"{self._base_url()}/object/{bucket}/{path}"
        headers = {
            **self._service_headers(),
            "Content-Type": content_type,
            "x-upsert": "true",  # allow replace on re-upload
        }

        try:
            async with httpx.AsyncClient(timeout=_STORAGE_TIMEOUT) as client:
                resp = await client.post(url, content=content, headers=headers)
        except httpx.TimeoutException as exc:
            raise ApiError(
                503,
                "storage_timeout",
                "File upload timed out. Please try again.",
            ) from exc
        except httpx.HTTPError as exc:
            raise ApiError(
                503,
                "storage_unavailable",
                "File storage is temporarily unreachable.",
            ) from exc

        if resp.status_code not in (200, 201):
            logger.warning(
                "storage_upload_failed path=<redacted> status=%d", resp.status_code
            )
            raise ApiError(
                503,
                "storage_upload_failed",
                "Failed to store the uploaded file. Please try again.",
            )

        return path

    async def delete_file(self, bucket: str, path: str) -> None:
        """Delete a file from the bucket.

        Best-effort — logs warning on failure but does not raise.
        (Callers should track orphaned objects separately.)
        """
        self._require_config()
        url = f"{self._base_url()}/object/{bucket}/{path}"

        try:
            async with httpx.AsyncClient(timeout=_STORAGE_TIMEOUT) as client:
                resp = await client.delete(url, headers=self._service_headers())
                if resp.status_code not in (200, 204):
                    logger.warning(
                        "storage_delete_failed path=<redacted> status=%d",
                        resp.status_code,
                    )
        except httpx.HTTPError as exc:
            logger.warning("storage_delete_error error=%s", type(exc).__name__)

    async def create_signed_url(
        self,
        bucket: str,
        path: str,
        expires_in: int = 300,
    ) -> str | None:
        """Create a short-lived signed URL for the file.

        Used only for server-side operations (e.g. passing to another service).
        NEVER expose this URL to the frontend or return it in API responses
        unless there is a clear, verified need.
        """
        self._require_config()
        url = f"{self._base_url()}/object/sign/{bucket}/{path}"
        headers = {**self._service_headers(), "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=_STORAGE_TIMEOUT) as client:
                resp = await client.post(
                    url,
                    json={"expiresIn": expires_in},
                    headers=headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    signed_url = data.get("signedURL") or data.get("signedUrl")
                    if signed_url:
                        return f"{self._settings.supabase_url}/storage/v1{signed_url}"
        except httpx.HTTPError:
            pass

        logger.warning("storage_signed_url_failed path=<redacted>")
        return None


# ── Factory ────────────────────────────────────────────────────────────────

_storage_client: StorageClient | None = None


def get_storage_client() -> StorageClient:
    global _storage_client
    if _storage_client is None:
        _storage_client = StorageClient(get_settings())
    return _storage_client
