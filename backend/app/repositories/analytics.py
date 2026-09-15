"""Analytics repository.

Uses Supabase PostgREST with the service-role key to perform cross-tenant
aggregate queries for college dashboards and super-admin telemetry.
The service-role key bypasses RLS — callers must enforce their own
authorization before invoking these methods.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.analytics_repo")

_TIMEOUT = 10.0


class AnalyticsRepository:
    """Thin PostgREST client scoped to analytics/admin queries."""

    def __init__(self) -> None:
        self._settings = get_settings()

    # ── internal helpers ──────────────────────────────────────────────────

    def _base_url(self) -> str:
        return f"{self._settings.supabase_url}/rest/v1"

    def _headers(self) -> dict[str, str]:
        """Service-role headers that bypass RLS for aggregate admin queries."""
        return {
            "apikey": self._settings.supabase_service_role_key,
            "Authorization": f"Bearer {self._settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }

    def _get(self, path: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
        """Synchronous GET using httpx (analytics endpoints are non-async for simplicity)."""
        url = f"{self._base_url()}{path}"
        try:
            with httpx.Client(timeout=_TIMEOUT) as client:
                resp = client.get(url, headers=self._headers(), params=params or {})
            if resp.status_code >= 400:
                logger.error("analytics_repo GET %s -> %d %s", path, resp.status_code, resp.text[:200])
                raise ApiError(502, "analytics_query_failed", "Analytics data unavailable.")
            return resp.json() if resp.text else []
        except httpx.HTTPError as exc:
            logger.warning("analytics_repo request_failed path=%s error=%s", path, exc)
            raise ApiError(503, "database_unavailable", "Cannot reach the analytics database.")

    # ── college data ──────────────────────────────────────────────────────

    def get_college_students(self, college_id: str) -> list[dict[str, Any]]:
        """All active student memberships for a college with their profiles."""
        return self._get(
            "/student_college_memberships",
            {
                "college_id": f"eq.{college_id}",
                "select": "department,enrollment_status,profiles!inner(user_id,display_name,email)",
            },
        )

    def get_latest_twins_for_users(self, user_ids: list[str]) -> dict[str, int]:
        """Latest career-twin overall_score for a list of user IDs."""
        if not user_ids:
            return {}
        ids_csv = "(" + ",".join(user_ids) + ")"
        rows = self._get(
            "/career_twin_snapshots",
            {
                "user_id": f"in.{ids_csv}",
                "select": "user_id,overall_score",
            },
        )
        scores: dict[str, int] = {}
        for row in rows:
            uid = row["user_id"]
            score = row.get("overall_score")
            if score is not None:
                if uid not in scores or score > scores[uid]:
                    scores[uid] = int(score)
        return scores

    def count_active_recruiters(self) -> int:
        rows = self._get(
            "/recruiter_organizations",
            {"verified_status": "eq.verified", "select": "id"},
        )
        return len(rows)

    # ── admin data ────────────────────────────────────────────────────────

    def get_all_colleges(self) -> list[dict[str, Any]]:
        return self._get(
            "/colleges",
            {"select": "id,name,city,verified_status,created_at", "order": "created_at.desc", "limit": "100"},
        )

    def get_all_recruiters(self) -> list[dict[str, Any]]:
        return self._get(
            "/recruiter_organizations",
            {"select": "id,name,verified_status,created_at", "order": "created_at.desc", "limit": "100"},
        )

    def get_all_profiles(self) -> list[dict[str, Any]]:
        """Fetch recent profiles for user management."""
        return self._get(
            "/profiles",
            {"select": "user_id,display_name,email,created_at", "order": "created_at.desc", "limit": "100"},
        )

    def get_all_org_memberships(self) -> list[dict[str, Any]]:
        return self._get(
            "/organization_memberships",
            {"select": "user_id,membership_role,college_id,recruiter_organization_id"},
        )

    def count_students_in_colleges(self) -> dict[str, int]:
        rows = self._get(
            "/student_college_memberships",
            {"enrollment_status": "eq.active", "select": "college_id"},
        )
        counts: dict[str, int] = {}
        for row in rows:
            cid = row["college_id"]
            counts[cid] = counts.get(cid, 0) + 1
        return counts
