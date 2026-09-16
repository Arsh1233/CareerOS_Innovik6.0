"""Free courses API endpoints.

GET /courses/ — Fetch discovered free courses (SWAYAM, NPTEL, etc) matching student gaps.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_postgrest_client, require_roles
from app.api.v1.skills import get_skill_gap_service
from app.integrations.hermes import HermesAgent, get_hermes_agent
from app.integrations.postgrest import PostgRESTClient
from app.integrations.web_reader import WebReader, get_web_reader
from app.repositories.skills import SkillsRepository
from app.schemas.discovery import DiscoverCoursesResponse
from app.services.course_discovery_service import CourseDiscoveryService
from app.services.skill_gap_service import SkillGapService

router = APIRouter(prefix="/courses", tags=["courses"])
logger = logging.getLogger("careeros.courses_api")


def get_skills_repository() -> SkillsRepository:
    return SkillsRepository()


def get_course_discovery_service(
    hermes: HermesAgent = Depends(get_hermes_agent),
    web_reader: WebReader = Depends(get_web_reader),
    skills: SkillsRepository = Depends(get_skills_repository),
    skill_gaps: SkillGapService = Depends(get_skill_gap_service),
    postgrest: PostgRESTClient = Depends(get_postgrest_client),
) -> CourseDiscoveryService:
    return CourseDiscoveryService(
        hermes=hermes,
        web_reader=web_reader,
        skills_repo=skills,
        skill_gap_service=skill_gaps,
        postgrest=postgrest,
    )


@router.get(
    "/",
    response_model=DiscoverCoursesResponse,
    status_code=200,
    summary="Discover free courses matching skill gaps",
)
async def get_discovered_courses(
    user: CurrentUser = Depends(require_roles("student")),
    service: CourseDiscoveryService = Depends(get_course_discovery_service),
) -> DiscoverCoursesResponse:
    """Return free courses from external providers (SWAYAM, NPTEL, etc) matching student skill gaps."""
    return await service.discover_courses(
        claims=user.claims,
        access_token=user.access_token,
    )
