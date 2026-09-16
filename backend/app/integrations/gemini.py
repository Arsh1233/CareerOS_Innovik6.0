"""Google Gemini LLM provider wrapper.

Drop-in replacement for GroqClient — exposes the same `generate_structured`
method so services require zero changes to swap providers.

Uses the Gemini REST API (generativelanguage.googleapis.com) with the
gemini-2.0-flash model for fast, cheap structured JSON output.

GEMINI_API_KEY must be set; missing key returns a controlled 503.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.gemini")

REQUEST_TIMEOUT_SECONDS = 45.0
MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 1.0

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class GeminiClient:
    """Thin async wrapper around the Google Gemini REST API.

    Provides the same interface as GroqClient so services are provider-agnostic.
    Only `generate_structured` is needed by CareerOS services.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def is_configured(self) -> bool:
        return bool(self._settings.gemini_api_key)

    def _require_configured(self) -> None:
        if not self.is_configured:
            raise ApiError(
                503,
                "ai_not_configured",
                "The AI provider (Google Gemini) is not configured on the server. Set GEMINI_API_KEY.",
            )

    def _model(self) -> str:
        return getattr(self._settings, "gemini_model", None) or "gemini-2.0-flash"

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """Send a Gemini generateContent request and return parsed JSON dict.

        The combined system + user prompt instructs Gemini to reply ONLY with
        valid JSON. The raw text response is extracted and parsed.

        Raises:
            ApiError: 503 if not configured, 502 for provider errors,
                      500 for unexpected failures.
        """
        self._require_configured()

        # Gemini uses a single contents array; we encode system/user as turns.
        payload: dict[str, Any] = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            },
        }

        model = self._model()
        url = f"{_BASE_URL}/models/{model}:generateContent"
        params = {"key": self._settings.gemini_api_key}

        last_error: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 2):
            try:
                return await self._do_request(url, params, payload)
            except ApiError:
                raise
            except httpx.HTTPStatusError as exc:
                last_error = exc
                status = exc.response.status_code
                if 400 <= status < 500:
                    raise ApiError(
                        502,
                        "ai_provider_error",
                        f"The AI provider returned an error (HTTP {status}).",
                    ) from exc
                logger.warning("gemini_retry attempt=%d status=%d", attempt, status)
            except (httpx.HTTPError, httpx.TimeoutException) as exc:
                last_error = exc
                logger.warning("gemini_retry attempt=%d error=%s", attempt, type(exc).__name__)

            if attempt <= MAX_RETRIES:
                import asyncio
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

        raise ApiError(
            503,
            "ai_provider_unavailable",
            "The AI provider is temporarily unavailable. Please try again later.",
        ) from last_error

    async def _do_request(
        self,
        url: str,
        params: dict[str, str],
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a single Gemini API request and return parsed JSON content."""
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post(url, json=payload, params=params)
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ApiError(503, "ai_provider_timeout", "Gemini took too long to respond.") from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status == 429:
                raise ApiError(503, "ai_rate_limited", "Gemini rate limit reached. Try again later.") from exc
            if status == 400:
                body = ""
                try:
                    body = exc.response.text
                except Exception:
                    pass
                raise ApiError(503, "ai_not_configured", f"Gemini returned 400: {body[:200]}") from exc
            if status == 403:
                raise ApiError(503, "ai_not_configured", "Gemini API key is invalid or quota exceeded.") from exc
            raise
        except httpx.HTTPError as exc:
            raise ApiError(503, "ai_provider_unavailable", "Could not reach Google Gemini.") from exc

        try:
            body = response.json()
        except ValueError as exc:
            raise ApiError(502, "ai_invalid_response", "Gemini returned invalid JSON.") from exc

        # Extract text from Gemini response structure:
        # body.candidates[0].content.parts[0].text
        try:
            candidates = body.get("candidates", [])
            if not candidates:
                raise KeyError("no candidates")
            content_text = candidates[0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ApiError(502, "ai_empty_response", "Gemini returned no content.") from exc

        if not content_text:
            raise ApiError(502, "ai_empty_response", "Gemini returned empty content.")

        # Strip markdown code fences if present (Gemini sometimes wraps JSON)
        cleaned = content_text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("gemini_json_parse_error content_length=%d content=%s", len(cleaned), cleaned[:200])
            raise ApiError(502, "ai_malformed_output", "Gemini returned non-JSON content.") from exc


# ── Singleton factory ──────────────────────────────────────────────────────

_gemini_client: GeminiClient | None = None


def get_gemini_client(settings: Settings | None = None) -> GeminiClient:
    """Return the shared Gemini client (lazy singleton)."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient(settings or get_settings())
    return _gemini_client
