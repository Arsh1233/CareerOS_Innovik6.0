"""Skill-gap contracts.

`status` is the honest-state field the UI branches on:

* ``ok``                        — requirements and the comparison exist.
* ``no_target_role``            — the student has not chosen a target role.
* ``insufficient_requirements`` — a target role is set but no sourced
  requirement set exists for it. Gaps are NOT invented in this case.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

SkillPriority = Literal["critical", "recommended", "optional"]
EvidenceQuality = Literal["none", "limited", "moderate", "strong"]
GapStatus = Literal["ok", "no_target_role", "insufficient_requirements"]

__all__ = [
    "SkillPriority",
    "EvidenceQuality",
    "GapStatus",
    "SkillGapItem",
    "SkillGapResponse",
]


class SkillGapItem(BaseModel):
    skill: str
    skill_key: str
    priority: SkillPriority
    required_level: str | None = None
    current_evidence: str | None = None
    reason: str
    recommended_action: str


class SkillGapResponse(BaseModel):
    status: GapStatus
    target_role: str | None = None
    current_skills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    gaps: list[SkillGapItem] = Field(default_factory=list)
    evidence_quality: EvidenceQuality = "none"
    evidence_count: int = 0
    requirement_count: int = 0
    career_twin_stale: bool = False
    generated_at: datetime
    message: str | None = None
