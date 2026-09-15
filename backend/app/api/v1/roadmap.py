"""Roadmap endpoints.

Student-only. Every route derives identity from the verified token and the
repository is RLS-scoped, so one student can never read or change another
student's roadmap or milestones.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_roadmap_service, require_roles
from app.core.errors import ApiError
from app.schemas.roadmap import (
    GetRoadmapRequest,
    MilestoneOut,
    MilestoneUpdateRequest,
    RoadmapOut,
)
from app.services.roadmap_service import RoadmapService

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.post(
    "/get-roadmap",
    response_model=RoadmapOut,
    status_code=201,
    summary="Generate, validate and persist a personalized learning roadmap",
)
async def get_roadmap(
    payload: GetRoadmapRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: RoadmapService = Depends(get_roadmap_service),
) -> RoadmapOut:
    return await service.generate(user.claims, user.id, payload)


@router.get(
    "/latest",
    response_model=RoadmapOut,
    summary="The caller's current active roadmap",
)
async def latest_roadmap(
    user: CurrentUser = Depends(require_roles("student")),
    service: RoadmapService = Depends(get_roadmap_service),
) -> RoadmapOut:
    roadmap = await service.latest(user.claims, user.id)
    if roadmap is None:
        raise ApiError(404, "roadmap_not_found", "You do not have a saved roadmap yet.")
    return roadmap


@router.patch(
    "/milestones/{milestone_id}",
    response_model=MilestoneOut,
    summary="Set a milestone's status (learning progress only)",
)
async def update_milestone(
    milestone_id: str,
    payload: MilestoneUpdateRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: RoadmapService = Depends(get_roadmap_service),
) -> MilestoneOut:
    return await service.update_milestone(user.claims, user.id, milestone_id, payload)
