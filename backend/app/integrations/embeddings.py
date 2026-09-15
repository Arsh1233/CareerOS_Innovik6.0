"""Local embedding generation using FastEmbed.

Project-wide vector contract (DO NOT change without versioning):
    EMBEDDING_MODEL  = BAAI/bge-small-en-v1.5
    VECTOR_DIMENSION = 384
    DISTANCE_METRIC  = Cosine

FastEmbed downloads the model (~135 MB) on first use and caches it locally.
This is acceptable for a hackathon/MVP. Production would pre-bake the model.

IMPORTANT:
    - The embedding text is built from structured resume content only.
    - Full extracted_text (raw PDF) is NOT embedded — too noisy.
    - No sensitive PII (emails, phone numbers) is included in embed text.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.core.errors import ApiError

logger = logging.getLogger("careeros.embeddings")

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
VECTOR_DIMENSION = 384
DISTANCE_METRIC = "Cosine"

# Lazy — model loads on first embed call to avoid slowing app startup.
_embed_model: Any = None


def _get_model() -> Any:
    global _embed_model
    if _embed_model is None:
        try:
            from fastembed import TextEmbedding
        except ImportError as exc:
            raise ApiError(
                503,
                "embedding_not_installed",
                "Embedding library is not installed.",
            ) from exc

        logger.info(
            "embedding_model_loading model=%s (first use — may take a moment)",
            EMBEDDING_MODEL,
        )
        _embed_model = TextEmbedding(model_name=EMBEDDING_MODEL)
        logger.info("embedding_model_ready model=%s dim=%d", EMBEDDING_MODEL, VECTOR_DIMENSION)
    return _embed_model


def embed_text(text: str) -> list[float]:
    """Generate a 384-dim embedding for the given text.

    Raises ApiError(503) if the embedding library is unavailable.
    """
    if not text or not text.strip():
        raise ApiError(
            422,
            "empty_embed_text",
            "Cannot embed empty text.",
        )

    try:
        model = _get_model()
        # fastembed returns a generator of numpy arrays
        vectors = list(model.embed([text]))
        if not vectors:
            raise ValueError("No vectors returned")
        # Convert numpy array to plain Python list
        vec = vectors[0]
        result = [float(x) for x in vec]
        if len(result) != VECTOR_DIMENSION:
            logger.warning(
                "embedding_dim_mismatch expected=%d got=%d",
                VECTOR_DIMENSION,
                len(result),
            )
        return result
    except ApiError:
        raise
    except Exception as exc:
        logger.error("embedding_failed error=%s", repr(exc))
        raise ApiError(
            503,
            "embedding_failed",
            "Could not generate resume embedding.",
        ) from exc


# ── Build embedding text ───────────────────────────────────────────────────

_PII_PATTERN = re.compile(
    r"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b"         # email
    r"|(?:\+?91[-\s]?)?[6-9]\d{9}\b"                # Indian mobile
    r"|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b"           # US phone
    r"|\b\d{6}\b",                                   # 6-digit PIN
    re.IGNORECASE,
)


def _strip_pii(text: str) -> str:
    return _PII_PATTERN.sub("[redacted]", text)


def build_resume_embed_text(analysis: dict[str, Any], target_role: str | None = None) -> str:
    """Build the text to embed from structured resume analysis.

    Uses skills, projects, experience summaries, and education — NOT raw
    PDF text which is noisy and may contain PII.
    """
    parts: list[str] = []

    if target_role:
        parts.append(f"Target Role: {target_role}")

    edu = analysis.get("education_summary", "")
    if edu:
        parts.append(f"Education: {edu}")

    exp = analysis.get("experience_summary", "")
    if exp:
        parts.append(f"Experience: {exp}")

    skills = analysis.get("skills", [])
    if skills:
        skill_names = [
            s.get("name", "") if isinstance(s, dict) else str(s)
            for s in skills
        ]
        parts.append(f"Skills: {', '.join(filter(None, skill_names))}")

    strengths = analysis.get("strengths", [])
    if strengths:
        parts.append(f"Strengths: {'; '.join(strengths[:5])}")

    summary = analysis.get("summary", "")
    if summary:
        parts.append(f"Summary: {summary}")

    text = "\n".join(parts)
    return _strip_pii(text) if text.strip() else "Resume content unavailable"
