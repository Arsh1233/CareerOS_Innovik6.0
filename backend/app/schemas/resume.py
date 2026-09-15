"""Resume contracts.

The analysis here is deterministic — it is computed from the text actually
extracted from the uploaded file, never guessed. Skills are only reported when
their name (or a known alias) is present in the resume text, and a detected
skill is a *mention*, not proven mastery.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

SectionStatus = Literal["good", "warn", "bad"]
ParseStatus = Literal["pending", "parsed", "failed"]
AnalysisStatus = Literal["pending", "complete", "failed"]

__all__ = [
    "ResumeSection",
    "ResumeImprovements",
    "ResumeAnalysis",
    "ResumeOut",
    "ResumeListResponse",
]


class ResumeSection(BaseModel):
    label: str
    score: int = Field(ge=0, le=100)
    status: SectionStatus


class ResumeImprovements(BaseModel):
    critical: list[str] = Field(default_factory=list)
    recommended: list[str] = Field(default_factory=list)
    optional: list[str] = Field(default_factory=list)


class ResumeAnalysis(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    quality_score: int = Field(ge=0, le=100)
    # None when the student has no target role or the role has no requirements.
    role_fit_score: int | None = None
    sections: list[ResumeSection] = Field(default_factory=list)
    detected_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    improvements: ResumeImprovements
    word_count: int = 0
    target_role: str | None = None
    analyzed_at: datetime


class ResumeOut(BaseModel):
    id: str
    filename: str
    mime_type: str | None = None
    size_bytes: int | None = None
    version: int
    parse_status: ParseStatus
    analysis_status: AnalysisStatus
    storage_path: str | None = None
    content_hash: str
    target_role: str | None = None
    analysis: ResumeAnalysis | None = None
    created_at: datetime | None = None


class ResumeListResponse(BaseModel):
    resumes: list[ResumeOut] = Field(default_factory=list)
