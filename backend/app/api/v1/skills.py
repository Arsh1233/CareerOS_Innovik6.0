"""Skill Gap Analysis API endpoint.

GET /skills/gap-analysis — Student-only. Deterministic from persisted evidence.
GET /skills              — List the student's current skills.

Identity always derived from JWT — never from request parameters.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_profiles_repository, require_roles
from app.repositories.profiles import ProfilesRepository
from app.repositories.role_requirements import RoleRequirementsRepository
from app.repositories.skills import SkillsRepository
from app.schemas.skills_roadmap import SkillGapResponse
from app.services.skill_gap_service import SkillGapService

router = APIRouter(prefix="/skills", tags=["skills"])
logger = logging.getLogger("careeros.skills_api")


# ── Dependency providers ───────────────────────────────────────────────────


def get_skills_repository() -> SkillsRepository:
    return SkillsRepository()


def get_role_requirements_repository() -> RoleRequirementsRepository:
    return RoleRequirementsRepository()


def get_skill_gap_service(
    profiles: ProfilesRepository = Depends(get_profiles_repository),
    skills: SkillsRepository = Depends(get_skills_repository),
    requirements: RoleRequirementsRepository = Depends(get_role_requirements_repository),
) -> SkillGapService:
    return SkillGapService(
        profiles_repo=profiles,
        skills_repo=skills,
        role_requirements_repo=requirements,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.get(
    "/gap-analysis",
    response_model=SkillGapResponse,
    status_code=200,
    summary="Get skill gap analysis",
)
async def get_skill_gap_analysis(
    user: CurrentUser = Depends(require_roles("student")),
    service: SkillGapService = Depends(get_skill_gap_service),
) -> SkillGapResponse:
    """Deterministic skill gap analysis for the authenticated student.

    Computes gaps from:
    - Persisted skill evidence (from resume ingestion)
    - Role requirements (from migration seed)

    Does NOT accept user identity from request params.
    Returns honest states when evidence or requirements are missing.
    """
    return await service.get_gap_analysis(
        user.claims,
        user.access_token,
    )
