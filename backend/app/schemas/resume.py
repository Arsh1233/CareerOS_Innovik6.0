"""Pydantic schemas for the Resume Intelligence pipeline.

All Groq output is validated through these models before any persistence.
Malformed AI output raises ValidationError rather than propagating garbage.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


# ── Extracted skill (from Groq) ───────────────────────────────────────────


class SkillExtracted(BaseModel):
    """One skill extracted from resume text by Groq.

    Evidence is required. Proficiency is intentionally absent:
    a keyword mention in a resume does NOT prove proficiency level.
    """

    name: str = Field(..., min_length=1, max_length=120)
    normalized_key: str = Field(..., min_length=1, max_length=120)
    evidence: str = Field(..., min_length=1)
    source_section: str = ""  # e.g. "Projects", "Experience"

    @field_validator("normalized_key", mode="before")
    @classmethod
    def _normalise(cls, v: str) -> str:
        return v.lower().strip().replace(" ", "_").replace("-", "_")


# ── Resume section scoring components ─────────────────────────────────────


class ScoreBreakdown(BaseModel):
    """Per-component breakdown of the deterministic resume quality score.

    Frontend should display this alongside the total score.
    Score is CareerOS's internal quality rubric — NOT an employer ATS prediction.
    """

    parseability: int = 0             # max 10
    contact_completeness: int = 0     # max 10
    education_present: int = 0        # max 10
    experience_clarity: int = 0       # max 15
    quantified_impact: int = 0        # max 15
    skill_evidence_coverage: int = 0  # max 15
    certifications_strength: int = 0  # max 10
    role_keyword_coverage: int = 0    # max 15 (only when target role available)
    total: int = 0                    # sum


# ── Groq structured output ────────────────────────────────────────────────


class ResumeSection(BaseModel):
    """A detected resume section."""

    name: str
    detected: bool
    quality: Literal["good", "needs_improvement", "missing"] = "missing"
    notes: str = ""


class ResumeAnalysis(BaseModel):
    """Validated Groq output for resume analysis.

    Every field is evidence-based. Groq must not fabricate proficiency
    or invent achievements not present in the resume text.
    """

    # high-level
    summary: str = ""
    detected_role: str | None = None   # role Groq infers from resume content

    # sections analysis
    sections_detected: list[ResumeSection] = []

    # evidence-based extractions
    education_summary: str = ""
    experience_summary: str = ""
    skills: list[SkillExtracted] = []
    certifications: list[str] = []

    # actionable feedback
    strengths: list[str] = []
    weak_sections: list[str] = []

    recommendations: dict[str, list[str]] = Field(
        default_factory=lambda: {"critical": [], "recommended": [], "optional": []}
    )

    # structural signals used by the deterministic scorer
    has_contact_info: bool = False
    has_education: bool = False
    has_experience: bool = False
    has_projects: bool = False
    has_certifications: bool = False
    has_skills_section: bool = False
    has_quantified_achievements: bool = False
    bullet_structure_quality: Literal["good", "partial", "poor"] = "poor"

    # target-role keyword hits (only if target role was provided to the agent)
    role_keywords_found: list[str] = []
    role_keywords_missing: list[str] = []

    @field_validator("recommendations", mode="before")
    @classmethod
    def _ensure_tiers(cls, v: Any) -> dict[str, list[str]]:
        base: dict[str, list[str]] = {"critical": [], "recommended": [], "optional": []}
        if isinstance(v, dict):
            base.update({k: val for k, val in v.items() if k in base})
        return base


# ── Pipeline status bundle ────────────────────────────────────────────────


class PipelineStatus(BaseModel):
    parse_status: str = "pending"
    analysis_status: str = "pending"
    embedding_status: str = "pending"


# ── API response shapes ───────────────────────────────────────────────────


class ResumeUploadResponse(BaseModel):
    """Response from POST /resumes/upload-resume."""

    resume_id: str
    original_filename: str
    file_size_bytes: int
    version: int
    is_duplicate: bool = False

    pipeline: PipelineStatus

    # Populated when analysis_status == "ok"
    analysis: ResumeAnalysis | None = None
    resume_quality_score: int | None = None
    score_version: str | None = None
    score_breakdown: ScoreBreakdown | None = None
    extracted_skills: list[SkillExtracted] = []

    # Human-readable status message for frontend display
    status_message: str = ""

    created_at: str = ""
    updated_at: str = ""


class ResumeListItem(BaseModel):
    """Summary item for GET /resumes list."""

    resume_id: str
    original_filename: str
    file_size_bytes: int
    version: int
    parse_status: str
    analysis_status: str
    embedding_status: str
    resume_quality_score: int | None = None
    is_archived: bool
    created_at: str


class ResumeLatestResponse(ResumeUploadResponse):
    """Response from GET /resumes/latest — same shape as upload response."""

    pass
