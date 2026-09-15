"""Platform roles.

Authorisation is always derived server-side from the verified Supabase token
(`app_metadata.role`, which only the service role can write) — never from a
client-supplied role, user id, or URL parameter.
"""

from __future__ import annotations

from typing import Literal, get_args

AppRole = Literal["student", "college", "recruiter", "admin"]

ALL_ROLES: tuple[str, ...] = get_args(AppRole)

# Roles a user may pick when self-registering. `admin` is deliberately excluded:
# privileged access is granted by an operator, never by a signup form.
SELF_SERVICE_SIGNUP_ROLES: tuple[str, ...] = ("student", "college", "recruiter")

TENANT_ROLES: tuple[str, ...] = ("college", "recruiter")


def is_valid_role(value: str | None) -> bool:
    return value in ALL_ROLES
