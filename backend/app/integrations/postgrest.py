"""Supabase PostgREST data access layer.

Every user-scoped request goes through PostgREST over HTTPS, carrying the
authenticated user's access token.  RLS in PostgreSQL is enforced by Supabase
automatically — the API never bypasses it.

    FastAPI → Supabase PostgREST → PostgreSQL RLS

The service-role key is intentionally NOT used here; it must remain restricted
to privileged server operations (account provisioning / role assignment).
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.postgrest")

# Sensible timeout — the reachable HTTPS endpoint should respond quickly.
# A long timeout here would cause the API to hang when the network is
# misconfigured.
REQUEST_TIMEOUT_SECONDS = 10.0


class PostgRESTClient:
    """Thin wrapper around Supabase's PostgREST /rest/v1 endpoint.

    Every mutating request uses `Prefer: return=representation` so the
    caller always sees the authoritative persisted row, never the submitted
    payload.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    # ── helpers ───────────────────────────────────────────────────────────

    def _require_config(self) -> None:
        if not self._settings.supabase_url or not self._settings.supabase_anon_key:
            raise ApiError(
                503,
                "postgrest_not_configured",
                "Database access is not configured on the server.",
            )

    def _base_url(self) -> str:
        return f"{self._settings.supabase_url}/rest/v1"

    def _headers(self, access_token: str) -> dict[str, str]:
        """Headers that authenticate the request as the real user.

        Supabase evaluates RLS against this token's `sub` claim.
        """
        return {
            "apikey": self._settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    async def _request(
        self,
        method: str,
        path: str,
        access_token: str,
        *,
        json_body: dict[str, Any] | None = None,
        params: dict[str, str] | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        self._require_config()
        url = f"{self._base_url()}{path}"
        headers = self._headers(access_token)
        if extra_headers:
            headers.update(extra_headers)

        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                return await client.request(
                    method,
                    url,
                    json=json_body,
                    params=params,
                    headers=headers,
                )
        except httpx.HTTPError as exc:
            logger.warning(
                "postgrest_request_failed method=%s path=%s error=%s",
                method,
                path,
                type(exc).__name__,
            )
            raise ApiError(
                503,
                "database_unavailable",
                "The database is temporarily unreachable. Please retry.",
            ) from exc

    # ── public API ────────────────────────────────────────────────────────

    async def select(
        self,
        table: str,
        access_token: str,
        *,
        columns: str = "*",
        filters: dict[str, str] | None = None,
        limit: int = 1,
    ) -> list[dict[str, Any]]:
        """SELECT … WHERE … via PostgREST query parameters."""
        params: dict[str, str] = {"select": columns}
        if filters:
            for key, value in filters.items():
                params[key] = value
        if limit > 0:
            params["limit"] = str(limit)

        response = await self._request("GET", f"/{table}", access_token, params=params)

        if response.status_code == 200:
            rows = response.json()
            # PostgREST returns a JSON array for select queries.
            if isinstance(rows, list):
                return rows
            return []

        self._raise_for_status(response, table)

    async def update(
        self,
        table: str,
        access_token: str,
        *,
        filters: dict[str, str],
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        """PATCH … WHERE … RETURNING * via PostgREST."""
        params = {**filters}
        response = await self._request(
            "PATCH",
            f"/{table}",
            access_token,
            json_body=payload,
            params=params,
            extra_headers={"Prefer": "return=representation"},
        )

        if response.status_code == 200:
            rows = response.json()
            if isinstance(rows, list) and rows:
                return rows[0]
            # RLS may allow the operation but no rows match — this is not an
            # error; the caller decides (404 vs. silent).
            return None

        self._raise_for_status(response, table)

    async def insert(
        self,
        table: str,
        access_token: str,
        *,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        """INSERT … RETURNING * via PostgREST."""
        response = await self._request(
            "POST",
            f"/{table}",
            access_token,
            json_body=payload,
            extra_headers={
                "Prefer": "return=representation",
            },
        )

        if response.status_code in (200, 201):
            rows = response.json()
            if isinstance(rows, list) and rows:
                return rows[0]
            return None

        self._raise_for_status(response, table)

    # ── error mapping ─────────────────────────────────────────────────────

    @staticmethod
    def _raise_for_status(response: httpx.Response, table: str) -> None:
        """Map PostgREST / Supabase errors into the CareerOS API envelope.

        Never expose raw SQL messages, JWT contents, or internal URLs.
        """
        status = response.status_code

        try:
            body = response.json()
        except ValueError:
            body = None

        # Supabase PostgREST error message extraction.
        message = ""
        code = ""
        if isinstance(body, dict):
            message = body.get("message", "") or body.get("hint", "") or ""
            code = str(body.get("code", "") or "")
        elif isinstance(body, list) and body:
            first = body[0]
            if isinstance(first, dict):
                message = first.get("message", "") or ""
                code = str(first.get("code", "") or "")

        logger.warning(
            "postgrest_error table=%s status=%s code=%s", table, status, code
        )

        if status == 401:
            raise ApiError(
                401,
                "not_authenticated",
                "The database rejected the request. Please sign in again.",
            )
        if status == 403:
            raise ApiError(
                403,
                "forbidden",
                "You do not have permission to access this resource.",
            )
        if status == 404 or (status == 200 and not body):
            raise ApiError(
                404,
                "not_found",
                "The requested resource was not found.",
            )
        if status == 409:
            raise ApiError(
                409,
                "conflict",
                "The request conflicts with an existing resource.",
            )
        if status >= 500:
            raise ApiError(
                503,
                "database_unavailable",
                "The database encountered an error. Please retry.",
            )

        # Catch-all for unexpected status codes.
        raise ApiError(
            503,
            "database_unavailable",
            "An unexpected database error occurred. Please retry.",
        )
