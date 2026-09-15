"""Resume Intelligence API endpoints.

All endpoints require an authenticated student role.

POST   /resumes/upload-resume         — Multipart PDF upload + analysis
GET    /resumes/latest                — Latest persisted result (no re-analysis)
GET    /resumes                       — List own resumes
DELETE /resumes/{resume_id}           — Archive (soft-delete) a resume
POST   /resumes/{resume_id}/reanalyze — Re-run analysis on existing resume

Endpoint path: POST /resumes/upload-resume (established — do NOT rename).
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import CurrentUser, require_roles
from app.integrations.groq import GroqClient, get_groq_client
from app.integrations.qdrant_client import QdrantIntegration, get_qdrant
from app.integrations.storage import StorageClient, get_storage_client
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.resumes import ResumesRepository
from app.repositories.skills import SkillsRepository
from app.schemas.resume import (
    ResumeLatestResponse,
    ResumeListItem,
    ResumeUploadResponse,
)
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])
logger = logging.getLogger("careeros.resumes_api")


# ── Dependency providers ───────────────────────────────────────────────────


def get_resumes_repository() -> ResumesRepository:
    return ResumesRepository()


def get_skills_repository() -> SkillsRepository:
    return SkillsRepository()


def get_career_twins_repository() -> CareerTwinsRepository:
    return CareerTwinsRepository()


def get_resume_service(
    groq: GroqClient = Depends(get_groq_client),
    storage: StorageClient = Depends(get_storage_client),
    qdrant: QdrantIntegration = Depends(get_qdrant),
    resumes_repo: ResumesRepository = Depends(get_resumes_repository),
    skills_repo: SkillsRepository = Depends(get_skills_repository),
    twins_repo: CareerTwinsRepository = Depends(get_career_twins_repository),
) -> ResumeService:
    from app.core.config import get_settings
    settings = get_settings()
    return ResumeService(
        groq_client=groq,
        storage_client=storage,
        qdrant=qdrant,
        resumes_repo=resumes_repo,
        skills_repo=skills_repo,
        twins_repo=twins_repo,
        resume_bucket=settings.resume_bucket,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post(
    "/upload-resume",
    response_model=ResumeUploadResponse,
    status_code=200,
    summary="Upload and analyse a resume PDF",
)
async def upload_resume(
    file: UploadFile = File(..., description="PDF resume file (max 10 MB)"),
    target_role: Annotated[str | None, Form()] = None,
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeUploadResponse:
    """Upload a PDF resume.

    The server validates the file, stores it privately, extracts text,
    runs structured Groq analysis, calculates a deterministic quality score,
    persists skills/evidence, and indexes the embedding in Qdrant.

    Do NOT rename this endpoint — the path is established in the API contract.
    """
    file_bytes = await file.read()
    return await service.upload_and_analyse(
        user.claims,
        filename=file.filename or "resume.pdf",
        file_bytes=file_bytes,
        content_type=file.content_type or "application/pdf",
        target_role=target_role or None,
    )


@router.get(
    "/latest",
    response_model=ResumeLatestResponse | None,
    status_code=200,
    summary="Get the latest persisted resume analysis",
)
async def get_latest_resume(
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeLatestResponse | None:
    """Retrieve the latest persisted resume for the authenticated student.

    Does NOT re-run analysis. Page reload should call this endpoint.
    Returns null if no resume has been uploaded yet.
    """
    return await service.get_latest(user.claims)


@router.get(
    "",
    response_model=list[ResumeListItem],
    status_code=200,
    summary="List own resumes",
)
async def list_resumes(
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> list[ResumeListItem]:
    """List all non-archived resumes for the authenticated student."""
    return await service.list_resumes(user.claims)


@router.delete(
    "/{resume_id}",
    status_code=204,
    summary="Archive (soft-delete) a resume",
)
async def delete_resume(
    resume_id: str,
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> None:
    """Soft-delete a resume by archiving it.

    The resume record and skill evidence are preserved for downstream
    analysis phases. Qdrant vector is deleted. Storage file is preserved
    (for potential reanalysis). Archived resumes are hidden from the UI.
    """
    await service.archive_resume(user.claims, resume_id)


@router.post(
    "/{resume_id}/reanalyze",
    response_model=ResumeUploadResponse,
    status_code=200,
    summary="Re-run analysis on an existing resume",
)
async def reanalyze_resume(
    resume_id: str,
    target_role: Annotated[str | None, Form()] = None,
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeUploadResponse:
    """Re-run the Groq analysis on an already-uploaded resume.

    Useful after updating a target role or when a previous analysis failed.
    Uses the stored extracted text — does NOT re-upload the file.
    """
    return await service.reanalyse(
        user.claims,
        resume_id,
        target_role=target_role or None,
    )
