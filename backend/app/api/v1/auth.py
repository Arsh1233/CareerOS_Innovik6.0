"""Authentication endpoints.

Supabase remains the single session authority: these routes broker the
provider call so the platform role can be assigned server-side and provider
errors can be mapped to the API error envelope.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict, EmailStr

from app.api.deps import CurrentUser, get_auth_service, get_current_user
from app.schemas.identity import AuthResult, LoginRequest, SignupRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class PasswordResetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class SimpleMessage(BaseModel):
    message: str


@router.post(
    "/signup",
    response_model=AuthResult,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account (student, college or recruiter)",
)
async def signup(
    payload: SignupRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResult:
    return await service.signup(payload)


@router.post(
    "/login",
    response_model=AuthResult,
    summary="Sign in with email and password",
)
async def login(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResult:
    return await service.login(payload)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke the current session",
)
async def logout(
    user: CurrentUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> None:
    await service.logout(user.access_token)


@router.post(
    "/password-reset",
    response_model=SimpleMessage,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Send a password reset link",
)
async def password_reset(
    payload: PasswordResetRequest,
    service: AuthService = Depends(get_auth_service),
) -> SimpleMessage:
    await service.request_password_reset(str(payload.email))
    return SimpleMessage(message="If an account exists for that address, a reset link has been sent.")
