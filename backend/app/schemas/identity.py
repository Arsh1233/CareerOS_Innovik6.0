"""Pydantic request/response schemas — the API contract surface."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.roles import ALL_ROLES, SELF_SERVICE_SIGNUP_ROLES

SelfServiceRole = Literal["student", "college", "recruiter"]
PlatformRole = Literal["student", "college", "recruiter", "admin"]

__all__ = [
    "ALL_ROLES",
    "SELF_SERVICE_SIGNUP_ROLES",
    "SelfServiceRole",
    "PlatformRole",
    "ErrorBody",
    "ErrorResponse",
    "HealthResponse",
    "SignupRequest",
    "LoginRequest",
    "AuthUser",
    "SessionTokens",
    "AuthResult",
    "MembershipOut",
    "EducationEntry",
    "ExperienceEntry",
    "ProfileOut",
    "ProfileUpdateRequest",
    "CurrentUserResponse",
]


# ── Envelope ──────────────────────────────────────────────────────────────


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str = ""
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    environment: str
    version: str
    capabilities: dict[str, bool]


# ── Auth ──────────────────────────────────────────────────────────────────


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: SelfServiceRole
    full_name: str = Field(min_length=1, max_length=120)

    @field_validator("full_name")
    @classmethod
    def _clean_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Full name cannot be empty.")
        return cleaned

    @field_validator("password")
    @classmethod
    def _password_strength(cls, value: str) -> str:
        if value.strip() != value:
            raise ValueError("Password cannot start or end with whitespace.")
        if value.isdigit() or value.isalpha():
            raise ValueError("Password must mix letters with numbers or symbols.")
        return value


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthUser(BaseModel):
    id: str
    email: str | None = None
    role: PlatformRole | None = None
    full_name: str | None = None
    onboarding_state: str = "not_started"


class SessionTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int | None = None
    expires_at: int | None = None


class AuthResult(BaseModel):
    """Result of signup/login.

    `session` is None when Supabase created the account but requires email
    confirmation before issuing tokens. The frontend must surface that state
    instead of pretending the user is signed in.
    """

    user: AuthUser
    session: SessionTokens | None = None
    message: str | None = None


# ── Identity / profile ────────────────────────────────────────────────────


class MembershipOut(BaseModel):
    id: str | None = None
    organization_type: Literal["college", "recruiter_organization"]
    organization_id: str | None = None
    organization_name: str | None = None
    membership_role: str | None = None
    status: str | None = None


class EducationEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    degree: str = Field(min_length=1, max_length=200)
    institution: str = Field(min_length=1, max_length=200)
    start_year: int | None = Field(default=None, ge=1950, le=2100)
    end_year: int | None = Field(default=None, ge=1950, le=2100)
    grade: str | None = Field(default=None, max_length=40)


class ExperienceEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    organization: str = Field(min_length=1, max_length=160)
    start_date: str | None = Field(default=None, max_length=20)
    end_date: str | None = Field(default=None, max_length=20)
    description: str | None = Field(default=None, max_length=2000)


class ProfileOut(BaseModel):
    user_id: str
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    education: list[EducationEntry] = Field(default_factory=list)
    experience: list[ExperienceEntry] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    target_role_id: str | None = None
    target_role_name: str | None = None
    target_salary_inr: int | None = None
    timeframe_years: int | None = None
    onboarding_state: str = "not_started"
    discoverability: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProfileUpdateRequest(BaseModel):
    """Partial profile update. Only provided fields are written."""

    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    location: str | None = Field(default=None, max_length=120)
    linkedin_url: str | None = Field(default=None, max_length=300)
    github_url: str | None = Field(default=None, max_length=300)
    education: list[EducationEntry] | None = None
    experience: list[ExperienceEntry] | None = None
    interests: list[str] | None = None
    target_role_name: str | None = Field(default=None, max_length=160)
    target_salary_inr: int | None = Field(default=None, ge=0, le=100_000_000)
    timeframe_years: int | None = Field(default=None, ge=0, le=40)
    onboarding_state: Literal["not_started", "in_progress", "complete"] | None = None
    discoverability: bool | None = None

    @field_validator("interests")
    @classmethod
    def _clean_interests(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned: list[str] = []
        for item in value:
            entry = " ".join(str(item).split())
            if not entry or len(entry) > 80:
                raise ValueError("Each interest must be 1-80 characters.")
            if entry not in cleaned:
                cleaned.append(entry)
        return cleaned[:25]

    @field_validator("linkedin_url", "github_url")
    @classmethod
    def _validate_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        if not cleaned.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return cleaned


class CurrentUserResponse(BaseModel):
    id: str
    email: str | None = None
    role: PlatformRole
    full_name: str | None = None
    profile: ProfileOut | None = None
    memberships: list[MembershipOut] = Field(default_factory=list)
