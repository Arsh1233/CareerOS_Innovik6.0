"""Typed application configuration.

All values come from the process environment (or `backend/.env` for local
development). Nothing in here is ever sent to the frontend — the API only
exposes behaviour, never provider credentials.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["development", "test", "staging", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: AppEnv = "development"
    log_level: str = "INFO"

    # The API is mounted under this prefix. Frontend base URLs must end here so
    # endpoint paths are appended exactly once (no double prefix).
    api_v1_prefix: str = "/api/v1"

    # Explicit origin allowlist. `*` is intentionally unsupported because
    # credentialed requests must not be answered with a wildcard origin.
    cors_allowed_origins: str = "http://localhost:8443"

    # ── Supabase ──────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ── PostgreSQL ────────────────────────────────────────────────────────
    database_url: str = ""
    database_pool_max_size: int = 10

    # ── Providers used from later phases ──────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Google Gemini (alternative LLM provider) ──────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    qdrant_url: str = ""
    qdrant_api_key: str = ""

    # ── Resume Intelligence (Phase 05) ────────────────────────────────────
    resume_max_file_mb: int = 10
    resume_bucket: str = "resumes"

    # ── Embedding contract (project-wide — do NOT change without versioning)
    # Model: BAAI/bge-small-en-v1.5  |  Dimension: 384  |  Distance: Cosine
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    qdrant_resume_collection: str = "resume_embeddings"

    elevenlabs_api_key: str = ""
    elevenlabs_agent_id: str = ""

    n8n_base_url: str = ""
    n8n_webhook_secret: str = ""

    langsmith_api_key: str = ""
    langsmith_project: str = "careeros"

    @field_validator("supabase_url", "n8n_base_url", "qdrant_url")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def jwks_url(self) -> str:
        return f"{self.supabase_url}/auth/v1/.well-known/jwks.json"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    def capability_report(self) -> dict[str, bool]:
        """Which optional integrations are configured.

        Reported by `/health` so operators can see readiness without exposing
        any secret material.
        """
        return {
            "supabase_auth": bool(self.supabase_url and self.supabase_anon_key),
            "supabase_admin": bool(self.supabase_url and self.supabase_service_role_key),
            "supabase_storage": bool(self.supabase_url and self.supabase_service_role_key),
            "database": bool(self.database_url),
            "groq": bool(self.groq_api_key),
            "gemini": bool(self.gemini_api_key),
            "qdrant": bool(self.qdrant_url and self.qdrant_api_key),
            "elevenlabs": bool(self.elevenlabs_api_key),
            "elevenlabs_agent": bool(self.elevenlabs_api_key and self.elevenlabs_agent_id),
            "n8n": bool(self.n8n_base_url),
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
