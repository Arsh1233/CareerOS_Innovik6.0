"""Business logic for authentication and identity.

Routes stay thin: validation happens in schemas, persistence in repositories,
provider calls in integrations, and the orchestration lives here.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.errors import ApiError
from app.core.security import (
    email_from_claims,
    full_name_from_claims,
    role_from_claims,
)
from app.integrations.supabase import SupabaseAuthClient
from app.repositories.profiles import ProfilesRepository
from app.schemas.identity import (
    AuthResult,
    AuthUser,
    CurrentUserResponse,
    LoginRequest,
    MembershipOut,
    ProfileOut,
    ProfileUpdateRequest,
    SessionTokens,
    SignupRequest,
)

logger = logging.getLogger("careeros.auth")


class AuthService:
    def __init__(self, auth_client: SupabaseAuthClient, profiles: ProfilesRepository) -> None:
        self._auth = auth_client
        self._profiles = profiles

    # ── signup / login ────────────────────────────────────────────────────

    async def signup(self, payload: SignupRequest) -> AuthResult:
        created = await self._auth.admin_create_user(
            email=str(payload.email),
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
        )
        user_id = str(created.get("id") or "")
        if not user_id:
            logger.error("signup_missing_user_id")
            raise ApiError(503, "auth_provider_unavailable", "Account creation returned no identity.")

        user = AuthUser(
            id=user_id,
            email=str(payload.email),
            role=payload.role,
            full_name=payload.full_name,
        )

        tokens = await self._try_password_grant(str(payload.email), payload.password)
        if tokens is None:
            return AuthResult(
                user=user,
                session=None,
                message="Account created. Confirm your email address to sign in.",
            )
        return AuthResult(user=self._user_from_grant(tokens, user), session=_tokens(tokens))

    async def login(self, payload: LoginRequest) -> AuthResult:
        grant = await self._auth.password_grant(str(payload.email), payload.password)
        user = self._user_from_grant(grant, None)
        if user.role is None:
            # Identity exists but no platform role was granted server-side. Do
            # not guess a role from metadata the user can edit.
            raise ApiError(
                403,
                "role_not_assigned",
                "This account has no CareerOS role assigned. Please contact support.",
            )
        return AuthResult(user=user, session=_tokens(grant))

    async def _try_password_grant(self, email: str, password: str) -> dict[str, Any] | None:
        try:
            return await self._auth.password_grant(email, password)
        except ApiError:
            return None

    @staticmethod
    def _user_from_grant(grant: dict[str, Any], fallback: AuthUser | None) -> AuthUser:
        raw_user = grant.get("user") or {}
        user_id = str(raw_user.get("id") or (fallback.id if fallback else ""))
        role = role_from_claims(raw_user) or (fallback.role if fallback else None)
        email = raw_user.get("email") or (fallback.email if fallback else None)
        full_name = full_name_from_claims(raw_user) or (fallback.full_name if fallback else None)
        return AuthUser(
            id=user_id,
            email=email,
            role=role,
            full_name=full_name,
        )

    # ── current identity ──────────────────────────────────────────────────

    async def build_current_user(self, claims: dict[str, Any], access_token: str) -> CurrentUserResponse:
        user_id = str(claims["sub"])
        role = role_from_claims(claims)
        if role is None:
            raise ApiError(
                403,
                "role_not_assigned",
                "This account has no CareerOS role assigned. Please contact support.",
            )

        profile_row = await self._profiles.get_by_user_id(claims, user_id)
        membership_rows = await self._profiles.list_memberships(claims, user_id)

        profile = _profile_from_row(profile_row) if profile_row else None
        return CurrentUserResponse(
            id=user_id,
            email=email_from_claims(claims),
            role=role,  # type: ignore[arg-type]
            full_name=(
                full_name_from_claims(claims)
                or (profile.display_name if profile else None)
            ),
            profile=profile,
            memberships=[_membership_from_row(row) for row in membership_rows],
        )

    # ── profile mutation ──────────────────────────────────────────────────

    async def update_profile(
        self, claims: dict[str, Any], payload: ProfileUpdateRequest
    ) -> ProfileOut:
        user_id = str(claims["sub"])
        fields = payload.model_dump(exclude_unset=True)
        if not fields:
            raise ApiError(400, "empty_update", "Provide at least one profile field to update.")

        row = await self._profiles.update_fields(claims, user_id, fields)
        if row is None:
            raise ApiError(404, "profile_not_found", "No profile exists for this account.")
        return _profile_from_row(row)

    async def request_password_reset(self, email: str) -> None:
        await self._auth.request_password_reset(email)

    async def logout(self, access_token: str) -> None:
        await self._auth.revoke_session(access_token)


# ── row mapping ───────────────────────────────────────────────────────────


def _tokens(grant: dict[str, Any]) -> SessionTokens | None:
    access_token = grant.get("access_token")
    refresh_token = grant.get("refresh_token")
    if not isinstance(access_token, str) or not isinstance(refresh_token, str):
        return None
    return SessionTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=grant.get("expires_in"),
        expires_at=grant.get("expires_at"),
    )


def _profile_from_row(row: dict[str, Any]) -> ProfileOut:
    return ProfileOut.model_validate(row)


def _membership_from_row(row: dict[str, Any]) -> MembershipOut:
    is_college = row.get("college_id") is not None
    return MembershipOut(
        id=str(row["id"]) if row.get("id") else None,
        organization_type="college" if is_college else "recruiter_organization",
        organization_id=str(row["college_id"] or row["recruiter_organization_id"] or "") or None,
        organization_name=row.get("organization_name"),
        membership_role=row.get("membership_role"),
        status=row.get("status"),
    )
