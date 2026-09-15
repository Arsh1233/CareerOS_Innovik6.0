"""Skill gap endpoint.

Student-only. The user id is taken from the verified token — the request has no
ownership parameter, so a caller cannot ask for another student's analysis.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_skill_gap_service, require_roles
from app.schemas.skills import SkillGapResponse
from app.services.skill_gap_service import SkillGapService

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get(
    "/gap-analysis",
    response_model=SkillGapResponse,
    summary="Deterministic skill gap analysis for the caller's target role",
)
async def gap_analysis(
    user: CurrentUser = Depends(require_roles("student")),
    service: SkillGapService = Depends(get_skill_gap_service),
) -> SkillGapResponse:
    return await service.analyze(user.claims, user.id)
