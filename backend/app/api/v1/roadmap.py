"""Roadmap API endpoints.

POST  /roadmap/get-roadmap          — Generate a new Groq-backed roadmap
GET   /roadmap/latest               — Latest persisted roadmap (no regeneration)
PATCH /roadmap/milestones/{id}      — Update milestone status

All endpoints require authenticated student role.
Identity always derived from JWT.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_profiles_repository, require_roles
from app.integrations.llm import LLMClient, get_llm_client
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.profiles import ProfilesRepository
from app.repositories.roadmaps import RoadmapsRepository
from app.repositories.role_requirements import RoleRequirementsRepository
from app.repositories.skills import SkillsRepository
from app.schemas.skills_roadmap import (
    MilestonePatchRequest,
    MilestoneResponse,
    RoadmapGenerateRequest,
    RoadmapResponse,
)
from app.services.roadmap_service import RoadmapService
from app.services.skill_gap_service import SkillGapService

router = APIRouter(prefix="/roadmap", tags=["roadmap"])
logger = logging.getLogger("careeros.roadmap_api")


# ── Dependency providers ───────────────────────────────────────────────────


def get_roadmaps_repository() -> RoadmapsRepository:
    return RoadmapsRepository()


def get_roadmap_llm_client() -> LLMClient:
    return get_llm_client()


def get_career_twins_repository_local() -> CareerTwinsRepository:
    return CareerTwinsRepository()


def get_skills_repository_local() -> SkillsRepository:
    return SkillsRepository()


def get_role_requirements_repository_local() -> RoleRequirementsRepository:
    return RoleRequirementsRepository()


def get_skill_gap_service(
    profiles: ProfilesRepository = Depends(get_profiles_repository),
    skills: SkillsRepository = Depends(get_skills_repository_local),
    requirements: RoleRequirementsRepository = Depends(get_role_requirements_repository_local),
) -> SkillGapService:
    return SkillGapService(
        profiles_repo=profiles,
        skills_repo=skills,
        role_requirements_repo=requirements,
    )


def get_roadmap_service(
    llm: LLMClient = Depends(get_roadmap_llm_client),
    profiles: ProfilesRepository = Depends(get_profiles_repository),
    roadmaps: RoadmapsRepository = Depends(get_roadmaps_repository),
    twins: CareerTwinsRepository = Depends(get_career_twins_repository_local),
    gap_service: SkillGapService = Depends(get_skill_gap_service),
) -> RoadmapService:
    return RoadmapService(
        groq_client=llm,
        profiles_repo=profiles,
        roadmaps_repo=roadmaps,
        twins_repo=twins,
        skill_gap_service=gap_service,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post(
    "/get-roadmap",
    response_model=RoadmapResponse,
    status_code=200,
    summary="Generate a personalized learning roadmap",
)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: RoadmapService = Depends(get_roadmap_service),
) -> RoadmapResponse:
    """Generate a Groq-backed roadmap from the student's real skill gap evidence.

    Validates Groq output with Pydantic before persistence.
    Marks the Career Twin stale after generation.
    """
    return await service.generate(user.claims, user.access_token, request)


@router.get(
    "/latest",
    response_model=RoadmapResponse | None,
    status_code=200,
    summary="Get latest persisted roadmap",
)
async def get_latest_roadmap(
    user: CurrentUser = Depends(require_roles("student")),
    service: RoadmapService = Depends(get_roadmap_service),
) -> RoadmapResponse | None:
    """Return the latest persisted roadmap with milestones.

    Does NOT generate a new roadmap. Returns null if none exists.
    """
    return await service.get_latest(user.claims, user.access_token)


@router.patch(
    "/milestones/{milestone_id}",
    response_model=MilestoneResponse,
    status_code=200,
    summary="Update milestone completion status",
)
async def patch_milestone(
    milestone_id: str,
    request: MilestonePatchRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: RoadmapService = Depends(get_roadmap_service),
) -> MilestoneResponse:
    """Update a roadmap milestone's status.

    Completed = learning progress only.
    Does NOT automatically make any skill "mastered".
    RLS ensures only the owning student can update their own milestones.
    """
    return await service.patch_milestone(
        user.claims, user.access_token, milestone_id, request.status
    )
