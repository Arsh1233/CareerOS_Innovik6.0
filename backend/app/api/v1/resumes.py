"""Resume endpoints.

Student-only. Identity comes from the verified token, so a caller cannot upload
or read a resume for another account, and the repository is RLS-scoped as well.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Response, UploadFile

from app.api.deps import CurrentUser, get_resume_service, require_roles
from app.core.errors import ApiError
from app.schemas.resume import ResumeListResponse, ResumeOut
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resume"])


@router.post(
    "/upload-resume",
    response_model=ResumeOut,
    status_code=201,
    summary="Upload a resume and store its deterministic analysis",
)
async def upload_resume(
    file: UploadFile = File(..., description="PDF or DOCX resume, max 10MB."),
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeOut:
    content = await file.read()
    return await service.upload(
        user.claims,
        user.access_token,
        filename=file.filename or "resume",
        content_type=file.content_type,
        content=content,
    )


@router.get("/latest", response_model=ResumeOut, summary="The most recent resume")
async def latest_resume(
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeOut:
    resume = await service.latest(user.claims, user.id)
    if resume is None:
        raise ApiError(404, "resume_not_found", "You have not uploaded a resume yet.")
    return resume


@router.get("", response_model=ResumeListResponse, summary="All of the caller's resumes")
async def list_resumes(
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> ResumeListResponse:
    return await service.list_resumes(user.claims, user.id)


@router.delete("/{resume_id}", status_code=204, summary="Delete one of the caller's resumes")
async def delete_resume(
    resume_id: str,
    user: CurrentUser = Depends(require_roles("student")),
    service: ResumeService = Depends(get_resume_service),
) -> Response:
    await service.delete(user.claims, user.id, resume_id)
    return Response(status_code=204)
