"""Roadmap contracts.

`RoadmapPlan` is the schema the Groq completion must satisfy. It is validated
*before* a row is written, so a malformed completion can never reach the
database. The prompt forbids invented credentials or guaranteed outcomes, and
validation rejects structurally invalid output outright.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

__all__ = [
    "RoadmapTask",
    "RoadmapWeek",
    "RoadmapPlan",
    "MilestoneOut",
    "RoadmapOut",
    "GetRoadmapRequest",
    "MilestoneUpdateRequest",
]

TaskType = Literal["course", "project", "practice", "reading", "certification", "other"]
MilestoneStatus = Literal["pending", "complete"]


class RoadmapTask(BaseModel):
    # LLM output: tolerate extra keys but validate everything we rely on.
    model_config = ConfigDict(extra="ignore")

    title: str = Field(min_length=1, max_length=200)
    type: TaskType = "other"
    estimated_hours: float = Field(default=0, ge=0, le=200)
    description: str = Field(default="", max_length=1000)


class RoadmapWeek(BaseModel):
    model_config = ConfigDict(extra="ignore")

    week: int = Field(ge=1, le=104)
    theme: str = Field(min_length=1, max_length=200)
    objectives: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    tasks: list[RoadmapTask] = Field(default_factory=list)


class RoadmapPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")

    target_role: str = Field(min_length=1, max_length=160)
    weeks: list[RoadmapWeek] = Field(min_length=1, max_length=52)


class MilestoneOut(BaseModel):
    id: str
    week_number: int
    title: str
    status: MilestoneStatus
    completed_at: datetime | None = None
    created_at: datetime | None = None


class RoadmapOut(BaseModel):
    id: str
    target_role: str
    version: int
    pace_hours_per_week: int | None = None
    status: str
    generated_by: str | None = None
    plan: RoadmapPlan
    milestones: list[MilestoneOut] = Field(default_factory=list)
    career_twin_stale: bool = False
    created_at: datetime | None = None


class GetRoadmapRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pace_hours_per_week: int | None = Field(default=None, ge=1, le=80)


class MilestoneUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Completion records *learning progress only* — it never implies mastery and
    # never modifies the user's skill proficiency.
    status: MilestoneStatus
