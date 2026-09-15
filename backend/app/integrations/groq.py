"""Groq LLM provider wrapper.

Keeps Groq-specific code outside the agent/service.  Sends structured
requests, maps provider errors, and enforces bounded retry.

    Career Twin agent → Groq → Pydantic validation → service

GROQ_API_KEY must be configured; if missing, a controlled 503 is returned
instead of falling back to mock data.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.groq")

# Sensible defaults — Groq's LPU is fast; a generous timeout handles retries.
REQUEST_TIMEOUT_SECONDS = 30.0
MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 1.0


class GroqClient:
    """Thin async wrapper around the Groq REST API.

    Responsibilities:
    - Send structured model requests (JSON mode)
    - Configured model selection
    - Timeout enforcement
    - Bounded retry on transient failures
    - Provider error mapping
    - JSON result retrieval

    The client NEVER logs:
    - GROQ_API_KEY
    - Full private profile data
    - Token contents
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def is_configured(self) -> bool:
        return bool(self._settings.groq_api_key)

    def _require_configured(self) -> None:
        if not self.is_configured:
            raise ApiError(
                503,
                "ai_not_configured",
                "The AI provider (Groq) is not configured on the server.",
            )

    def _base_url(self) -> str:
        return "https://api.groq.com/openai/v1"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._settings.groq_api_key}",
            "Content-Type": "application/json",
        }

    def _model(self) -> str:
        return self._settings.groq_model or "llama-3.3-70b-versatile"

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """Send a chat completion request with JSON response format.

        Returns the parsed JSON content from the model response.

        Raises:
            ApiError: 503 if not configured, 502 for provider errors,
                      500 for unexpected failures.
        """
        self._require_configured()

        payload: dict[str, Any] = {
            "model": self._model(),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }

        last_error: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 2):  # 1 initial + retries
            try:
                return await self._do_request(payload)
            except ApiError:
                raise  # Already mapped — do not retry business errors
            except httpx.HTTPStatusError as exc:
                last_error = exc
                status = exc.response.status_code

                # Do not retry client errors (4xx).
                if 400 <= status < 500:
                    raise ApiError(
                        502,
                        "ai_provider_error",
                        f"The AI provider returned an error (HTTP {status}).",
                    ) from exc

                # Retry on 5xx (transient).
                logger.warning(
                    "groq_retry attempt=%d status=%d", attempt, status
                )
            except (httpx.HTTPError, httpx.TimeoutException) as exc:
                last_error = exc
                logger.warning(
                    "groq_retry attempt=%d error=%s", attempt, type(exc).__name__
                )

            # Bounded delay before retry (skip delay on last attempt).
            if attempt <= MAX_RETRIES:
                import asyncio
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

        # All retries exhausted.
        raise ApiError(
            503,
            "ai_provider_unavailable",
            "The AI provider is temporarily unavailable. Please try again later.",
        ) from last_error

    async def _do_request(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute a single Groq API request and return parsed JSON content."""
        url = f"{self._base_url()}/chat/completions"

        try:
            async with httpx.AsyncClient(
                timeout=REQUEST_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._headers(),
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ApiError(
                503,
                "ai_provider_timeout",
                "The AI provider took too long to respond.",
            ) from exc
        except httpx.HTTPStatusError as exc:
            # Map provider-specific errors.
            status = exc.response.status_code
            if status == 429:
                raise ApiError(
                    503,
                    "ai_rate_limited",
                    "The AI provider rate limit has been reached. Please try again later.",
                ) from exc
            if status == 401:
                raise ApiError(
                    503,
                    "ai_not_configured",
                    "The AI provider authentication failed. Check GROQ_API_KEY.",
                ) from exc
            raise  # Let caller decide on retries for 5xx.
        except httpx.HTTPError as exc:
            raise ApiError(
                503,
                "ai_provider_unavailable",
                "Could not reach the AI provider.",
            ) from exc

        # Parse the Groq response.
        try:
            body = response.json()
        except ValueError as exc:
            raise ApiError(
                502,
                "ai_invalid_response",
                "The AI provider returned an invalid response.",
            ) from exc

        # Extract content from the OpenAI-compatible response format.
        choices = body.get("choices", [])
        if not choices:
            raise ApiError(
                502,
                "ai_empty_response",
                "The AI provider returned no response content.",
            )

        message = choices[0].get("message", {})
        content = message.get("content", "")

        if not content:
            raise ApiError(
                502,
                "ai_empty_response",
                "The AI provider returned empty content.",
            )

        # Parse the JSON content.
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error(
                "groq_json_parse_error content_length=%d", len(content)
            )
            raise ApiError(
                502,
                "ai_malformed_output",
                "The AI provider returned non-JSON content.",
            ) from exc


# ── Factory ────────────────────────────────────────────────────────────────

_groq_client: GroqClient | None = None


def get_groq_client(settings: Settings | None = None) -> GroqClient:
    """Get or create the shared Groq client.

    Lazy instantiation so the API can boot without GROQ_API_KEY configured.
    """
    global _groq_client
    if _groq_client is None:
        if settings is None:
            from app.core.config import get_settings
            settings = get_settings()
        _groq_client = GroqClient(settings)
    return _groq_client
