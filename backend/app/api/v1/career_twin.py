"""Career Twin API endpoints.

POST /career-twin/get-career-twin — Generate a new Career Twin
GET  /career-twin/latest           — Retrieve the latest persisted result

Both endpoints require an authenticated student role.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import (
    CurrentUser,
    get_profiles_repository,
    require_roles,
)
from app.integrations.groq import GroqClient, get_groq_client
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.career_twin import (
    CareerTwinGenerateRequest,
    CareerTwinResponse,
)
from app.services.career_twin_service import CareerTwinService

router = APIRouter(prefix="/career-twin", tags=["career-twin"])


# ── Dependency providers ───────────────────────────────────────────────────


def get_career_twins_repository() -> CareerTwinsRepository:
    return CareerTwinsRepository()


def get_career_twin_groq_client() -> GroqClient:
    return get_groq_client()


def get_career_twin_service(
    groq: GroqClient = Depends(get_career_twin_groq_client),
    profiles: ProfilesRepository = Depends(get_profiles_repository),
    twins: CareerTwinsRepository = Depends(get_career_twins_repository),
) -> CareerTwinService:
    return CareerTwinService(
        groq_client=groq,
        profiles_repo=profiles,
        twins_repo=twins,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post(
    "/get-career-twin",
    response_model=CareerTwinResponse,
    status_code=200,
    summary="Generate a Career Twin",
)
async def generate_career_twin(
    request: CareerTwinGenerateRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: CareerTwinService = Depends(get_career_twin_service),
) -> CareerTwinResponse:
    """Generate a new Career Twin for the authenticated student.

    Uses the student's profile evidence and the configured AI provider
    (Groq) to produce a structured career analysis.

    The result is persisted in Supabase for reload/readback.
    """
    return await service.generate(
        user.claims,
        user.access_token,
        request,
    )


@router.get(
    "/latest",
    response_model=CareerTwinResponse | None,
    status_code=200,
    summary="Get latest Career Twin",
)
async def get_latest_career_twin(
    user: CurrentUser = Depends(require_roles("student")),
    service: CareerTwinService = Depends(get_career_twin_service),
) -> CareerTwinResponse | None:
    """Retrieve the latest persisted Career Twin for the authenticated student.

    Does NOT generate a new result.  Page reload should use this endpoint.
    Returns null if no Career Twin has been generated yet.
    """
    return await service.get_latest(
        user.claims,
        user.access_token,
    )
