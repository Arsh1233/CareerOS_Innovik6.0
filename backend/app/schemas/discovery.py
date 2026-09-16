"""Discovery schemas — job and course objects returned by Hermes agent."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator


class DiscoveredJobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    job_type: str = "Full-time"
    experience: str = ""
    salary: str = ""
    skills_required: list[str] = []
    description: str
    apply_url: str
    source: str  # "LinkedIn" | "Naukri" | "Google Jobs" | "Microsoft" | "Government"
    deadline: str = ""
    match_score: int = 0       # 0-100, % of required skills student has
    readiness_score: int = 0   # 0-100, overall readiness for this role


class DiscoveredCourseResponse(BaseModel):
    id: str
    title: str
    provider: str   # "SWAYAM" | "NPTEL" | "CEC" | "CREC" | "Railway" | "NIOS"
    instructor: str = ""
    duration: str = ""
    level: str = "Beginner"
    skills_covered: list[str] = []
    description: str
    url: str
    is_free: bool = True
    has_certificate: bool = False
    language: str = "English"
    relevance_score: int = 0   # 0-100, how well it covers student's skill gaps


class DiscoverJobsResponse(BaseModel):
    jobs: list[DiscoveredJobResponse]
    target_role: str
    total: int
    cached: bool = False


class DiscoverCoursesResponse(BaseModel):
    courses: list[DiscoveredCourseResponse]
    skill_gaps: list[str]
    total: int
    cached: bool = False
