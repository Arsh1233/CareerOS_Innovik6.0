from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.identity import PlatformRole


# ── College Analytics ──────────────────────────────────────────────────────


class StudentMetric(BaseModel):
    name: str
    email: str
    department: Optional[str]
    readiness: int
    status: str
    issue: Optional[str]


class DepartmentMetric(BaseModel):
    dept: str
    students: int
    readiness: int
    placed: int
    atRisk: int


class CollegeDashboard(BaseModel):
    total_students: int
    job_ready_students: int
    at_risk_students: int
    active_recruiters: int
    department_metrics: List[DepartmentMetric]
    students: List[StudentMetric]


# ── Admin Telemetry ────────────────────────────────────────────────────────


class UserMetric(BaseModel):
    name: str
    email: str
    role: PlatformRole
    status: str
    college: Optional[str]
    joined: str


class CollegeMetric(BaseModel):
    name: str
    city: Optional[str]
    students: int
    active: int
    readiness: int
    status: str
    joinDate: str


class RecruiterMetric(BaseModel):
    name: str
    contact: Optional[str]
    roles: int
    hires: int
    plan: str
    status: str
    since: str


class AdminDashboard(BaseModel):
    total_users: int
    active_colleges: int
    active_recruiters: int
    users: List[UserMetric]
    colleges: List[CollegeMetric]
    recruiters: List[RecruiterMetric]
