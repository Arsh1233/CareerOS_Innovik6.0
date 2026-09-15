"""Profile and organisation-membership persistence.

User-facing reads/writes go through Supabase PostgREST over HTTPS using the
authenticated user's JWT.  Supabase evaluates PostgreSQL RLS policies against
this token automatically.

    FastAPI -> Supabase PostgREST -> RLS -> PostgreSQL

Direct PostgreSQL connections are reserved for migrations, privileged backend
jobs, and the admin connection context (see base.py).
"""

from __future__ import annotations

from typing import Any

from app.integrations.postgrest import PostgRESTClient

# Columns returned to the API. Kept explicit so we can never leak a column
# that was added later for internal use.
PROFILE_COLUMNS: tuple[str, ...] = (
    "user_id",
    "display_name",
    "email",
    "phone",
    "location",
    "linkedin_url",
    "github_url",
    "education",
    "experience",
    "interests",
    "target_role_id",
    "target_role_name",
    "target_salary_inr",
    "timeframe_years",
    "onboarding_state",
    "discoverability",
    "created_at",
    "updated_at",
)

# API field name -> database column. Doubles as the write whitelist, so a
# payload key can never be interpolated into SQL or PostgREST.
UPDATABLE_COLUMNS: dict[str, str] = {
    "display_name": "display_name",
    "phone": "phone",
    "location": "location",
    "linkedin_url": "linkedin_url",
    "github_url": "github_url",
    "education": "education",
    "experience": "experience",
    "interests": "interests",
    "target_role_name": "target_role_name",
    "target_salary_inr": "target_salary_inr",
    "timeframe_years": "timeframe_years",
    "onboarding_state": "onboarding_state",
    "discoverability": "discoverability",
}

_SELECT_LIST = ",".join(PROFILE_COLUMNS)


class ProfilesRepository:
    """Reads/writes executed via Supabase PostgREST using the caller's JWT.

    RLS policies enforce ownership at the database level.  The PostgREST
    client never uses the service-role key for these operations.
    """

    def __init__(self, postgrest: PostgRESTClient | None = None) -> None:
        self._postgrest = postgrest

    async def _client(self) -> PostgRESTClient:
        """Lazy acquisition so the repository can be constructed before the
        PostgREST client is wired in dependency injection."""
        if self._postgrest is None:
            from app.core.config import get_settings
            self._postgrest = PostgRESTClient(get_settings())
        return self._postgrest

    async def get_by_user_id(
        self, claims: dict[str, Any], user_id: str
    ) -> dict[str, Any] | None:
        client = await self._client()
        access_token = claims.get("_access_token", "")
        rows = await client.select(
            "profiles",
            access_token,
            columns=_SELECT_LIST,
            filters={"user_id": f"eq.{user_id}"},
            limit=1,
        )
        return rows[0] if rows else None

    async def update_fields(
        self,
        claims: dict[str, Any],
        user_id: str,
        fields: dict[str, Any],
    ) -> dict[str, Any] | None:
        client = await self._client()
        access_token = claims.get("_access_token", "")

        # Build the update payload using the write whitelist.
        payload: dict[str, Any] = {}
        for api_field, value in fields.items():
            column = UPDATABLE_COLUMNS.get(api_field)
            if column is None:
                continue
            payload[column] = value

        if not payload:
            return await self.get_by_user_id(claims, user_id)

        row = await client.update(
            "profiles",
            access_token,
            filters={"user_id": f"eq.{user_id}"},
            payload=payload,
        )
        return row

    async def list_memberships(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        client = await self._client()
        access_token = claims.get("_access_token", "")

        # Query organization_memberships with joins via PostgREST embed syntax.
        # Supabase PostgREST supports resource embedding:
        #   ?select=*,colleges(name),recruiter_organizations(name)
        # But a simpler approach for now is to fetch the memberships and then
        # fetch org names separately.  For Phase 03, membership data is minimal
        # and the simpler approach is sufficient.
        org_rows = await client.select(
            "organization_memberships",
            access_token,
            columns="id,membership_role,status,college_id,recruiter_organization_id",
            filters={"user_id": f"eq.{user_id}"},
            limit=50,
        )

        if not org_rows:
            return []

        # Enrich with organization names.  This is a read-only follow-up that
        # does not require elevated privileges.
        result: list[dict[str, Any]] = []
        for row in org_rows:
            org_name = None
            college_id = row.get("college_id")
            org_id = row.get("recruiter_organization_id")

            if college_id:
                college_rows = await client.select(
                    "colleges",
                    access_token,
                    columns="name",
                    filters={"id": f"eq.{college_id}"},
                    limit=1,
                )
                if college_rows:
                    org_name = college_rows[0].get("name")
            elif org_id:
                org_rows_resolved = await client.select(
                    "recruiter_organizations",
                    access_token,
                    columns="name",
                    filters={"id": f"eq.{org_id}"},
                    limit=1,
                )
                if org_rows_resolved:
                    org_name = org_rows_resolved[0].get("name")

            result.append({
                **row,
                "organization_name": org_name,
            })

        return result

    async def list_student_college_memberships(
        self, claims: dict[str, Any], user_id: str
    ) -> list[dict[str, Any]]:
        """Fetch student-college memberships via PostgREST."""
        client = await self._client()
        access_token = claims.get("_access_token", "")

        rows = await client.select(
            "student_college_memberships",
            access_token,
            columns="id,student_id,college_id,department,batch",
            filters={"student_id": f"eq.{user_id}"},
            limit=50,
        )
        return rows
