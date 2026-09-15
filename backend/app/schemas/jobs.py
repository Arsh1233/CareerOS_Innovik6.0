from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class JobCreate(BaseModel):
    company_name: str
    title: str
    department: Optional[str] = None
    location: str
    salary_range: Optional[str] = None
    employment_type: str = "Full-time"
    description: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    deadline: Optional[datetime] = None


class JobResponse(BaseModel):
    id: UUID
    recruiter_id: UUID
    company_name: str
    title: str
    department: Optional[str]
    location: str
    salary_range: Optional[str]
    employment_type: str
    description: Optional[str]
    required_skills: List[str]
    status: str
    deadline: Optional[datetime]
    created_at: datetime


class JobMatchResponse(BaseModel):
    job: JobResponse
    match_score: int
    matching_skills: List[str]
    missing_skills: List[str]
    has_applied: bool


class JobApplicationCreate(BaseModel):
    job_id: UUID


class JobApplicationResponse(BaseModel):
    id: UUID
    job_id: UUID
    student_id: UUID
    status: str
    match_score: Optional[int]
    matching_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    created_at: datetime
    
    # Extra fields usually joined in for recruiter view
    student_name: Optional[str] = None
    student_college: Optional[str] = None


class RecruiterPipelineMetrics(BaseModel):
    stage: str
    count: int
    color: str


class RecruiterJobMetrics(BaseModel):
    job: JobResponse
    applicants_count: int
    shortlisted_count: int
    avg_match_score: Optional[int]
