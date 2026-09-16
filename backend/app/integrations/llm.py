"""Unified LLM client factory.

Provides a single `get_llm_client()` function that returns either GeminiClient
or GroqClient depending on which API key is configured.

Priority: Gemini (if GEMINI_API_KEY set) → Groq (if GROQ_API_KEY set) → 503.

Both clients expose the same `generate_structured(system_prompt, user_prompt, ...)`
interface so all services remain provider-agnostic.
"""

from __future__ import annotations

from typing import Union

from app.core.config import Settings, get_settings
from app.integrations.gemini import GeminiClient, get_gemini_client
from app.integrations.groq import GroqClient, get_groq_client

LLMClient = Union[GeminiClient, GroqClient]


def get_llm_client() -> LLMClient:
    """Return an LLM client based on which API key is configured.

    Gemini takes priority over Groq when a valid AI Studio key is present
    (keys from https://aistudio.google.com/app/apikey start with 'AIza').
    Falls back to GroqClient otherwise.
    """
    settings = get_settings()

    # Validate Gemini key looks like a real AI Studio key
    gemini_key = settings.gemini_api_key or ""
    if gemini_key and gemini_key.startswith("AIza"):
        return get_gemini_client()

    return get_groq_client()
