"""Identity and profile endpoints — the shared structured input to every
student module. Reads and writes are scoped by the verified token and enforced
again by RLS at the database.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_auth_service, get_current_user
from app.schemas.identity import CurrentUserResponse, ProfileOut, ProfileUpdateRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["identity"])


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Current identity, profile and organisation memberships",
)
async def read_me(
    user: CurrentUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> CurrentUserResponse:
    return await service.build_current_user(user.claims, user.access_token)


@router.put(
    "/profile",
    response_model=ProfileOut,
    summary="Update the caller's own profile",
)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: CurrentUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> ProfileOut:
    return await service.update_profile(user.claims, user.access_token, payload)
