"""Pydantic request/response schemas for Career Twin.

The Career Twin is NOT a prediction engine.  It analyses currently available
evidence and returns structured reasoning.  No fabricated readiness percentages,
hiring probabilities, or salary forecasts are produced.

Source of truth for the frontend contract.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


# ── Request ────────────────────────────────────────────────────────────────


class CareerTwinGenerateRequest(BaseModel):
    """Request body for generating a Career Twin.

    Only user-editable fields are included.  The target role is persisted
    in the user's profile and read server-side — the frontend may optionally
    send a preferred target role to override the profile value for this
    generation.
    """

    model_config = ConfigDict(extra="forbid")

    target_role: str | None = Field(
        default=None,
        max_length=160,
        description="Preferred target role for this generation. Falls back to profile target_role_name.",
    )


# ── Strength / Gap / Trajectory ────────────────────────────────────────────


class Strength(BaseModel):
    """An identified strength backed by available evidence."""

    title: str
    evidence: str
    relevance: str


class Gap(BaseModel):
    """An identified gap with priority and evidence state."""

    skill_or_capability: str
    reason: str
    priority: Literal["critical", "recommended", "nice_to_have"]
    evidence_state: Literal["missing", "partial", "insufficient"]


class TrajectoryStage(BaseModel):
    """A stage in the career trajectory."""

    stage: str
    goal: str
    capabilities_to_build: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)


class NextAction(BaseModel):
    """A concrete next action the student can take."""

    title: str
    reason: str
    destination: str = ""


# ── Evidence Summary ───────────────────────────────────────────────────────


class EvidenceSummary(BaseModel):
    """Summary of the evidence available for this Career Twin generation."""

    education_context: str = ""
    relevant_experience: str = ""
    known_skills: str = ""


# ── Response ───────────────────────────────────────────────────────────────


class CareerTwinResult(BaseModel):
    """Structured Career Twin output produced by the AI agent.

    All fields that cannot be deterministically derived from evidence are
    set to None or omitted rather than fabricated.
    """

    model_config = ConfigDict(extra="forbid")

    target_role: str | None = None
    summary: str
    current_position: EvidenceSummary = Field(default_factory=EvidenceSummary)
    strengths: list[Strength] = Field(default_factory=list)
    gaps: list[Gap] = Field(default_factory=list)
    trajectory: list[TrajectoryStage] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)

    # Numeric policy: no fabricated readiness/placement/salary scores.
    # evidence_coverage is an honest metric of how much data we have.
    evidence_coverage: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Fraction of available evidence fields populated (0-1). Not a readiness score.",
    )

    evidence_quality: Literal["sufficient", "partial", "insufficient"] = "partial"
    generated_at: datetime | None = None
    model: str | None = None
    version: str = "v1"


class CareerTwinResponse(BaseModel):
    """API response wrapping a Career Twin result."""

    result: CareerTwinResult
    twin_id: str | None = None
    is_stale: bool = False
    generated_at: datetime | None = None


# ── Evidence Snapshot ──────────────────────────────────────────────────────


class EvidenceSnapshot(BaseModel):
    """The evidence used to generate a Career Twin.

    Stored alongside the result for versioning/staleness detection.
    """

    model_config = ConfigDict(extra="forbid")

    target_role: str | None = None
    education: list[dict[str, Any]] = Field(default_factory=list)
    experience: list[dict[str, Any]] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    timeframe_years: int | None = None
    location: str | None = None

    def compute_version(self) -> int:
        """Simple version hash from evidence contents.

        Used to detect when a new Twin should be generated because the
        underlying profile evidence changed.
        """
        import hashlib
        import json

        canonical = json.dumps(
            {
                "target_role": self.target_role,
                "education": self.education,
                "experience": self.experience,
                "skills": self.skills,
                "interests": self.interests,
                "timeframe_years": self.timeframe_years,
                "location": self.location,
            },
            sort_keys=True,
            default=str,
        )
        return int(hashlib.sha256(canonical.encode()).hexdigest()[:8], 16)
