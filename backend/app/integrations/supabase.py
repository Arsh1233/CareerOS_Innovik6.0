"""Supabase Auth integration (GoTrue REST).

The frontend never talks to Supabase with the service-role key. Signup/login
are brokered here so that:
- the platform role is written to `app_metadata`, which only the service role
  can modify (a client cannot grant itself a role);
- provider errors are translated into the API error envelope.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.supabase")

REQUEST_TIMEOUT_SECONDS = 15.0


class SupabaseAuthClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    # ── internals ─────────────────────────────────────────────────────────

    def _require_auth_config(self) -> None:
        if not self._settings.supabase_url or not self._settings.supabase_anon_key:
            raise ApiError(
                503,
                "auth_not_configured",
                "Authentication provider is not configured on the server.",
            )

    def _require_admin_config(self) -> None:
        self._require_auth_config()
        if not self._settings.supabase_service_role_key:
            raise ApiError(
                503,
                "auth_admin_not_configured",
                "Account provisioning is not configured on the server.",
            )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        url = f"{self._settings.supabase_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                return await client.request(method, url, json=json_body, headers=headers)
        except httpx.HTTPError as exc:
            logger.warning("supabase_request_failed path=%s error=%s", path, type(exc).__name__)
            raise ApiError(
                503,
                "auth_provider_unavailable",
                "Authentication provider is unavailable. Please retry.",
            ) from exc

    @staticmethod
    def _error_code(payload: Any) -> str | None:
        if not isinstance(payload, dict):
            return None
        for key in ("error_code", "code", "error"):
            value = payload.get(key)
            if isinstance(value, str) and value:
                return value
        return None

    @staticmethod
    def _error_message(payload: Any) -> str:
        if isinstance(payload, dict):
            for key in ("msg", "message", "error_description", "error"):
                value = payload.get(key)
                if isinstance(value, str) and value:
                    return value
        return "Authentication request failed."

    # ── public API ────────────────────────────────────────────────────────

    async def password_grant(self, email: str, password: str) -> dict[str, Any]:
        self._require_auth_config()
        response = await self._request(
            "POST",
            "/auth/v1/token?grant_type=password",
            json_body={"email": email, "password": password},
            headers={
                "apikey": self._settings.supabase_anon_key,
                "Content-Type": "application/json",
            },
        )

        if response.status_code == 200:
            return response.json()

        payload = _safe_json(response)
        code = self._error_code(payload)
        if response.status_code in (400, 401) or code in ("invalid_grant", "invalid_credentials"):
            raise ApiError(401, "invalid_credentials", "Email or password is incorrect.")
        if response.status_code == 429:
            raise ApiError(429, "rate_limited", "Too many attempts. Please try again shortly.")
        logger.warning("supabase_password_grant_failed status=%s", response.status_code)
        raise ApiError(503, "auth_provider_unavailable", "Sign-in failed. Please retry.")

    async def admin_create_user(
        self,
        *,
        email: str,
        password: str,
        full_name: str,
        role: str,
    ) -> dict[str, Any]:
        """Create a user with a server-assigned role.

        `email_confirm=True` is set because the API is the trusted provisioning
        path; email ownership is verified separately during onboarding.
        """
        self._require_admin_config()
        response = await self._request(
            "POST",
            "/auth/v1/admin/users",
            json_body={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name},
                "app_metadata": {"role": role},
            },
            headers={
                "apikey": self._settings.supabase_service_role_key,
                "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
                "Content-Type": "application/json",
            },
        )

        if response.status_code in (200, 201):
            return response.json()

        payload = _safe_json(response)
        code = self._error_code(payload)
        if response.status_code in (409, 422) and code in (
            "email_exists",
            "user_already_exists",
            "email_already_exists",
        ):
            raise ApiError(409, "email_already_registered", "An account already exists for this email.")
        if response.status_code == 422:
            raise ApiError(422, "invalid_signup", self._error_message(payload))
        logger.warning("supabase_admin_create_user_failed status=%s", response.status_code)
        raise ApiError(503, "auth_provider_unavailable", "Account creation failed. Please retry.")

    async def admin_update_user_role(self, user_id: str, role: str) -> None:
        """Server-side role grant. Used by operators, never by clients."""
        self._require_admin_config()
        response = await self._request(
            "PUT",
            f"/auth/v1/admin/users/{user_id}",
            json_body={"app_metadata": {"role": role}},
            headers={
                "apikey": self._settings.supabase_service_role_key,
                "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
                "Content-Type": "application/json",
            },
        )
        if response.status_code not in (200, 201):
            logger.warning("supabase_admin_update_role_failed status=%s", response.status_code)
            raise ApiError(503, "auth_provider_unavailable", "Role update failed.")

    async def admin_delete_user(self, user_id: str) -> bool:
        """Delete an account and its cascading rows.

        Used by the live verification suite to clean up the accounts it creates.
        Returns False when the provider reports the user is already gone.
        """
        self._require_admin_config()
        response = await self._request(
            "DELETE",
            f"/auth/v1/admin/users/{user_id}",
            headers={
                "apikey": self._settings.supabase_service_role_key,
                "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
            },
        )
        if response.status_code in (200, 204):
            return True
        if response.status_code == 404:
            return False
        logger.warning("supabase_admin_delete_user_failed status=%s", response.status_code)
        raise ApiError(503, "auth_provider_unavailable", "Account cleanup failed.")

    async def request_password_reset(self, email: str) -> None:
        self._require_auth_config()
        response = await self._request(
            "POST",
            "/auth/v1/recover",
            json_body={"email": email},
            headers={
                "apikey": self._settings.supabase_anon_key,
                "Content-Type": "application/json",
            },
        )
        # Always report success: whether an address exists is not disclosed.
        if response.status_code not in (200, 201, 202, 204):
            logger.warning("supabase_recover_unexpected_status status=%s", response.status_code)

    async def revoke_session(self, access_token: str) -> None:
        self._require_auth_config()
        response = await self._request(
            "POST",
            "/auth/v1/logout",
            headers={
                "apikey": self._settings.supabase_anon_key,
                "Authorization": f"Bearer {access_token}",
            },
        )
        if response.status_code not in (200, 204):
            # The client clears its local tokens regardless; a 401 here means
            # the session was already invalid.
            logger.info("supabase_logout_non_success status=%s", response.status_code)


def _safe_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return None
