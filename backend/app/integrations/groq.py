"""Groq integration — structured generation for the learning roadmap.

Groq exposes an OpenAI-compatible Chat Completions endpoint. The roadmap is the
only Phase 06 feature that needs a model, and it must return strict JSON so the
result can be validated with Pydantic *before* anything is persisted.

Failure handling is deliberately loud: a missing key, an unreachable provider,
or a malformed completion each raise an explicit `ApiError`. Nothing is ever
replaced with a fixture — an ungenerated roadmap is reported as a failure.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.groq")


class GroqClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _require_config(self) -> None:
        if not self._settings.groq_api_key:
            raise ApiError(
                503,
                "ai_not_configured",
                "Roadmap generation is not configured on the server.",
            )

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> Any:
        """Ask Groq for a JSON object and return it parsed.

        The caller must validate the shape; this method only guarantees that a
        JSON value came back, or raises.
        """
        self._require_config()

        url = f"{self._settings.groq_base_url}/chat/completions"
        payload: dict[str, Any] = {
            "model": self._settings.groq_model,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self._settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self._settings.groq_timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            logger.warning("groq_timeout model=%s", self._settings.groq_model)
            raise ApiError(
                503,
                "ai_timeout",
                "Roadmap generation timed out. Please try again.",
            ) from exc
        except httpx.HTTPError as exc:
            logger.warning("groq_request_failed error=%s", type(exc).__name__)
            raise ApiError(
                503,
                "ai_provider_unavailable",
                "The roadmap generator is unavailable. Please try again.",
            ) from exc

        if response.status_code != 200:
            logger.warning("groq_non_success status=%s", response.status_code)
            raise ApiError(
                503,
                "ai_provider_unavailable",
                "The roadmap generator is unavailable. Please try again.",
            )

        content = self._extract_content(response)
        if content is None:
            raise ApiError(
                502,
                "ai_invalid_response",
                "The roadmap generator returned no usable content.",
            )

        try:
            return json.loads(content)
        except (TypeError, ValueError) as exc:
            logger.warning("groq_invalid_json")
            raise ApiError(
                502,
                "ai_invalid_response",
                "The roadmap generator returned malformed data.",
            ) from exc

    @staticmethod
    def _extract_content(response: httpx.Response) -> str | None:
        try:
            body = response.json()
        except ValueError:
            return None
        choices = body.get("choices") if isinstance(body, dict) else None
        if not isinstance(choices, list) or not choices:
            return None
        message = choices[0].get("message") if isinstance(choices[0], dict) else None
        content = message.get("content") if isinstance(message, dict) else None
        return content if isinstance(content, str) and content.strip() else None
