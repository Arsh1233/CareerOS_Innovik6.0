from typing import Any
from fastapi import APIRouter, Depends
from app.api.deps import CurrentUser, require_roles, get_profiles_repository
from app.integrations.groq import GroqClient, get_groq_client
from app.repositories.jobs import JobsRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.jobs import (
    JobApplicationCreate,
    JobApplicationResponse,
    JobCreate,
    JobMatchResponse,
    JobResponse,
)
from app.services.jobs_service import JobsService
from app.services.job_discovery_service import JobDiscoveryService
from app.integrations.hermes import HermesAgent, get_hermes_agent
from app.integrations.web_reader import WebReader, get_web_reader
from app.integrations.postgrest import PostgRESTClient
from app.api.deps import get_postgrest_client
from app.repositories.skills import SkillsRepository
from app.schemas.discovery import DiscoverJobsResponse
from pydantic import BaseModel

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_jobs_repository() -> JobsRepository:
    return JobsRepository()


def get_skills_repository() -> SkillsRepository:
    return SkillsRepository()


def get_jobs_service(
    jobs_repo: JobsRepository = Depends(get_jobs_repository),
    skills_repo: SkillsRepository = Depends(get_skills_repository),
    groq_client: GroqClient = Depends(get_groq_client),
) -> JobsService:
    return JobsService(jobs_repo=jobs_repo, skills_repo=skills_repo, groq_client=groq_client)


def get_job_discovery_service(
    hermes: HermesAgent = Depends(get_hermes_agent),
    web_reader: WebReader = Depends(get_web_reader),
    profiles_repo: ProfilesRepository = Depends(get_profiles_repository),
    skills_repo: SkillsRepository = Depends(get_skills_repository),
    postgrest: PostgRESTClient = Depends(get_postgrest_client),
) -> JobDiscoveryService:
    return JobDiscoveryService(
        hermes=hermes,
        web_reader=web_reader,
        profiles_repo=profiles_repo,
        skills_repo=skills_repo,
        postgrest=postgrest,
    )


# ── Student Endpoints ──────────────────────────────────────────────────────

@router.get(
    "/matches",
    response_model=list[JobMatchResponse],
    status_code=200,
    summary="Get job matches for student",
)
async def get_job_matches(
    user: CurrentUser = Depends(require_roles("student")),
    service: JobsService = Depends(get_jobs_service),
) -> list[JobMatchResponse]:
    """Return active jobs matched against the student's skills."""
    return await service.get_student_matches(
        claims=user.claims,
        access_token=user.access_token,
    )


@router.get(
    "/discover",
    response_model=DiscoverJobsResponse,
    status_code=200,
    summary="Discover jobs from external sources",
)
async def discover_jobs(
    user: CurrentUser = Depends(require_roles("student")),
    service: JobDiscoveryService = Depends(get_job_discovery_service),
) -> DiscoverJobsResponse:
    """Trigger Hermes agent to scrape and score jobs from external boards."""
    return await service.discover_jobs(
        claims=user.claims,
        access_token=user.access_token,
    )


@router.post(
    "/{job_id}/apply",
    response_model=JobApplicationResponse,
    status_code=201,
    summary="Apply to a job",
)
async def apply_to_job(
    job_id: str,
    user: CurrentUser = Depends(require_roles("student")),
    service: JobsService = Depends(get_jobs_service),
) -> JobApplicationResponse:
    """Submit a job application."""
    return await service.apply_to_job(
        claims=user.claims,
        access_token=user.access_token,
        job_id=job_id,
    )


# ── Recruiter Endpoints ────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=JobResponse,
    status_code=201,
    summary="Create a new job posting",
)
async def create_job(
    request: JobCreate,
    user: CurrentUser = Depends(require_roles("recruiter")),
    service: JobsService = Depends(get_jobs_service),
) -> JobResponse:
    """Post a new job (recruiter only)."""
    return await service.create_job(
        claims=user.claims,
        access_token=user.access_token,
        request=request,
    )


@router.get(
    "/dashboard",
    response_model=dict[str, Any],
    status_code=200,
    summary="Get recruiter dashboard metrics",
)
async def get_recruiter_dashboard(
    user: CurrentUser = Depends(require_roles("recruiter")),
    service: JobsService = Depends(get_jobs_service),
) -> dict[str, Any]:
    """Get metrics and applications for the recruiter's jobs."""
    return await service.get_recruiter_dashboard(
        claims=user.claims,
        access_token=user.access_token,
    )


class StatusUpdateRequest(BaseModel):
    status: str

@router.patch(
    "/applications/{application_id}/status",
    response_model=JobApplicationResponse,
    status_code=200,
    summary="Update application status",
)
async def update_application_status(
    application_id: str,
    request: StatusUpdateRequest,
    user: CurrentUser = Depends(require_roles("recruiter")),
    service: JobsService = Depends(get_jobs_service),
) -> JobApplicationResponse:
    """Update the status of an application (e.g. move to shortlisted)."""
    return await service.update_application_status(
        claims=user.claims,
        access_token=user.access_token,
        application_id=application_id,
        status=request.status,
    )
