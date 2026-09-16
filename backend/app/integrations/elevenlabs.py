"""ElevenLabs Conversational AI integration.

Provides two capabilities needed for Phase 08 (ECHO):
1.  get_signed_url  — issues a short-lived WS URL the browser uses to connect
    directly to ElevenLabs (keeps API key server-side).
2.  get_conversation — fetches the full transcript + metadata after a session
    ends, so the backend can score it with Groq.

ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID must be configured; missing keys
return a clean 503 instead of crashing.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.elevenlabs")

_BASE_URL = "https://api.elevenlabs.io/v1"


class ElevenLabsClient:
    """Thin async wrapper around ElevenLabs Conversational AI REST API.

    Only covers the two operations ECHO needs:
    - Signed URL generation (browser connects directly to EL WebSocket).
    - Conversation retrieval (transcript + metadata after session ends).
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def is_configured(self) -> bool:
        return bool(self._settings.elevenlabs_api_key and self._settings.elevenlabs_agent_id)

    def _require_configured(self) -> None:
        if not self._settings.elevenlabs_api_key:
            raise ApiError(
                503,
                "ai_not_configured",
                "ElevenLabs API key is not configured on the server.",
            )
        if not self._settings.elevenlabs_agent_id:
            raise ApiError(
                503,
                "ai_not_configured",
                "ElevenLabs Agent ID is not configured on the server. "
                "Set ELEVENLABS_AGENT_ID in backend/.env.",
            )

    def _headers(self) -> dict[str, str]:
        return {
            "xi-api-key": self._settings.elevenlabs_api_key,
            "Content-Type": "application/json",
        }

    async def get_signed_url(
        self,
        *,
        dynamic_variables: dict[str, str] | None = None,
    ) -> str:
        """Return a short-lived signed WebSocket URL for the browser.

        The browser opens this URL directly with the ElevenLabs WebSocket
        protocol. The API key never leaves the server.

        Args:
            dynamic_variables: Optional variables injected into the agent's
                system prompt at session start (e.g. target_role, user_name).

        Returns:
            The signed WebSocket URL string.
        """
        self._require_configured()
        agent_id = self._settings.elevenlabs_agent_id
        url = f"{_BASE_URL}/convai/conversation/get-signed-url"
        params = {"agent_id": agent_id}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers=self._headers(), params=params)
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ApiError(
                503,
                "ai_provider_timeout",
                "ElevenLabs took too long to respond.",
            ) from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status == 401:
                raise ApiError(503, "ai_not_configured", "ElevenLabs API key is invalid.") from exc
            if status == 404:
                raise ApiError(
                    503,
                    "ai_not_configured",
                    f"ElevenLabs Agent '{agent_id}' not found. Check ELEVENLABS_AGENT_ID.",
                ) from exc
            raise ApiError(502, "ai_provider_error", f"ElevenLabs returned HTTP {status}.") from exc
        except httpx.HTTPError as exc:
            raise ApiError(503, "ai_provider_unavailable", "Could not reach ElevenLabs.") from exc

        try:
            body = response.json()
            signed_url: str = body["signed_url"]
        except (ValueError, KeyError) as exc:
            raise ApiError(502, "ai_invalid_response", "ElevenLabs returned an unexpected response.") from exc

        logger.info("elevenlabs_signed_url_issued agent_id=%s", agent_id)
        return signed_url

    async def get_conversation(self, conversation_id: str) -> dict[str, Any]:
        """Fetch a completed conversation's transcript and metadata.

        Called at end-session time. ElevenLabs stores the full turn-by-turn
        transcript; we retrieve it here for Groq rubric scoring.

        Returns:
            Raw conversation dict from ElevenLabs (transcript, duration, etc.)
        """
        self._require_configured()
        url = f"{_BASE_URL}/convai/conversations/{conversation_id}"

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers=self._headers())
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ApiError(503, "ai_provider_timeout", "ElevenLabs took too long to respond.") from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status == 404:
                raise ApiError(
                    404,
                    "conversation_not_found",
                    f"ElevenLabs conversation '{conversation_id}' not found.",
                ) from exc
            raise ApiError(502, "ai_provider_error", f"ElevenLabs returned HTTP {status}.") from exc
        except httpx.HTTPError as exc:
            raise ApiError(503, "ai_provider_unavailable", "Could not reach ElevenLabs.") from exc

        try:
            return response.json()
        except ValueError as exc:
            raise ApiError(502, "ai_invalid_response", "ElevenLabs returned non-JSON.") from exc


# ── Singleton factory ──────────────────────────────────────────────────────

_elevenlabs_client: ElevenLabsClient | None = None


def get_elevenlabs_client() -> ElevenLabsClient:
    """Return the shared ElevenLabs client (lazy singleton)."""
    global _elevenlabs_client
    if _elevenlabs_client is None:
        _elevenlabs_client = ElevenLabsClient(get_settings())
    return _elevenlabs_client
