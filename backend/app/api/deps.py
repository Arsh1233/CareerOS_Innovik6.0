"""Shared FastAPI dependencies.

Authorisation lives here: routes declare the roles they accept and identity is
always derived from a verified token.
"""

from __future__ import annotations

from typing import Any, Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict

from app.core.config import Settings, get_settings
from app.core.errors import ApiError
from app.core.security import decode_access_token, role_from_claims
from app.integrations.groq import GroqClient
from app.integrations.storage import SupabaseStorageClient
from app.integrations.supabase import SupabaseAuthClient
from app.repositories.profiles import ProfilesRepository
from app.repositories.resumes import ResumesRepository
from app.repositories.roadmaps import RoadmapsRepository
from app.repositories.skills import SkillsRepository
from app.services.auth_service import AuthService
from app.services.roadmap_service import RoadmapService
from app.services.resume_service import ResumeService
from app.services.skill_gap_service import SkillGapService

bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Supabase access token issued by POST /auth/login.",
)


class CurrentUser(BaseModel):
    """Verified caller identity. Never constructed from client input."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    email: str | None = None
    role: str | None = None
    claims: dict[str, Any]
    access_token: str


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "") or ""


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise ApiError(401, "not_authenticated", "Authentication required.")

    claims = decode_access_token(credentials.credentials, settings)
    return CurrentUser(
        id=str(claims["sub"]),
        email=claims.get("email"),
        role=role_from_claims(claims),
        claims=claims,
        access_token=credentials.credentials,
    )


def require_roles(*allowed: str) -> Callable[..., Any]:
    """Dependency factory that restricts a route to specific platform roles."""

    async def _dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role is None:
            raise ApiError(
                403,
                "role_not_assigned",
                "This account has no CareerOS role assigned. Please contact support.",
            )
        if user.role not in allowed:
            raise ApiError(
                403,
                "forbidden",
                "Your role is not permitted to perform this action.",
                {"required_roles": list(allowed)},
            )
        return user

    return _dependency


# ── service providers (overridable in tests) ──────────────────────────────


def get_supabase_auth_client(settings: Settings = Depends(get_settings)) -> SupabaseAuthClient:
    return SupabaseAuthClient(settings)


def get_profiles_repository() -> ProfilesRepository:
    return ProfilesRepository()


def get_auth_service(
    auth_client: SupabaseAuthClient = Depends(get_supabase_auth_client),
    profiles: ProfilesRepository = Depends(get_profiles_repository),
) -> AuthService:
    return AuthService(auth_client=auth_client, profiles=profiles)


def get_skills_repository() -> SkillsRepository:
    return SkillsRepository()


def get_roadmaps_repository() -> RoadmapsRepository:
    return RoadmapsRepository()


def get_groq_client(settings: Settings = Depends(get_settings)) -> GroqClient:
    return GroqClient(settings)


def get_skill_gap_service(
    skills: SkillsRepository = Depends(get_skills_repository),
) -> SkillGapService:
    return SkillGapService(skills=skills)


def get_roadmap_service(
    skill_gap: SkillGapService = Depends(get_skill_gap_service),
    roadmaps: RoadmapsRepository = Depends(get_roadmaps_repository),
    groq: GroqClient = Depends(get_groq_client),
    settings: Settings = Depends(get_settings),
) -> RoadmapService:
    return RoadmapService(
        skill_gap=skill_gap,
        roadmaps=roadmaps,
        groq=groq,
        settings=settings,
    )


def get_resumes_repository() -> ResumesRepository:
    return ResumesRepository()


def get_storage_client(settings: Settings = Depends(get_settings)) -> SupabaseStorageClient:
    return SupabaseStorageClient(settings)


def get_resume_service(
    resumes: ResumesRepository = Depends(get_resumes_repository),
    skills: SkillsRepository = Depends(get_skills_repository),
    storage: SupabaseStorageClient = Depends(get_storage_client),
    settings: Settings = Depends(get_settings),
) -> ResumeService:
    return ResumeService(resumes=resumes, skills=skills, storage=storage, settings=settings)
