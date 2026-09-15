"""Pydantic schemas for Skill Gap Analysis and Roadmap.

Source of truth for the API contract.  TypeScript mirrors in frontend must
match exactly — do NOT guess field names on either side.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


# ── Skill Gap ──────────────────────────────────────────────────────────────


class CurrentSkill(BaseModel):
    """A skill the student currently has evidence for."""

    model_config = ConfigDict(extra="forbid")

    skill: str
    normalized_key: str
    evidence_summary: str | None = None


class SkillGap(BaseModel):
    """A required skill that the student is missing or has insufficient evidence for."""

    model_config = ConfigDict(extra="forbid")

    skill: str
    normalized_key: str
    priority: Literal["critical", "recommended", "optional"]
    required_level: str | None = None  # nullable: we don't invent proficiency
    current_evidence: str | None = None  # what we actually found, not invented
    reason: str
    recommended_action: str


class MatchedSkill(BaseModel):
    """A required skill the student has sufficient evidence for."""

    model_config = ConfigDict(extra="forbid")

    skill: str
    normalized_key: str
    evidence_summary: str | None = None


class SkillGapResponse(BaseModel):
    """Result of GET /skills/gap-analysis."""

    model_config = ConfigDict(extra="forbid")

    target_role: str
    current_skills: list[CurrentSkill]
    matched_skills: list[MatchedSkill]
    gaps: list[SkillGap]
    total_required: int
    matched_count: int
    gap_count: int
    # "sufficient" | "partial" | "insufficient" | "no_requirements" | "no_role"
    evidence_quality: str
    generated_at: datetime


# ── Roadmap ───────────────────────────────────────────────────────────────


class RoadmapTask(BaseModel):
    """A single learning task within a week."""

    model_config = ConfigDict(extra="forbid")

    title: str
    type: str  # "course" | "project" | "reading" | "practice" | "other"
    estimated_hours: float
    description: str
    destination: str | None = None  # e.g. "/resume", "/career-twin", null


class RoadmapWeek(BaseModel):
    """One week of the learning roadmap."""

    model_config = ConfigDict(extra="forbid")

    week: int
    theme: str
    objectives: list[str]
    skills: list[str]
    tasks: list[RoadmapTask]


class RoadmapPlan(BaseModel):
    """Groq-generated roadmap structure. Validated before persistence."""

    model_config = ConfigDict(extra="forbid")

    target_role: str
    weeks: list[RoadmapWeek]


class RoadmapGenerateRequest(BaseModel):
    """Request body for POST /roadmap/get-roadmap."""

    model_config = ConfigDict(extra="forbid")

    pace_hours_per_week: int = Field(default=10, ge=2, le=60)
    target_role: str | None = None  # override; falls back to profile


class MilestoneResponse(BaseModel):
    """A single roadmap milestone."""

    model_config = ConfigDict(extra="forbid")

    id: str
    roadmap_id: str
    week_number: int
    title: str
    description: str | None = None
    status: Literal["pending", "in_progress", "completed"]
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MilestonePatchRequest(BaseModel):
    """Request body for PATCH /roadmap/milestones/{id}."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["pending", "in_progress", "completed"]


class RoadmapResponse(BaseModel):
    """Full roadmap with inline milestones."""

    model_config = ConfigDict(extra="forbid")

    id: str
    target_role: str
    version: int
    pace_hours_per_week: int
    plan: dict[str, Any]
    status: str
    milestones: list[MilestoneResponse]
    created_at: datetime
    updated_at: datetime
