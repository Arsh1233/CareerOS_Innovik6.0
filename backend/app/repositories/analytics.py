"""Analytics repository.

Uses Supabase PostgREST with the service-role key to perform cross-tenant
aggregate queries for college dashboards and super-admin telemetry.
The service-role key bypasses RLS — callers must enforce their own
authorization before invoking these methods.
"""
from __future__ import annotations

import logging
import time
from threading import Lock
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import ApiError

logger = logging.getLogger("careeros.analytics_repo")

_TIMEOUT = 10.0
_CACHE_TTL = 60  # seconds — fast enough to feel live, slow enough to be snappy

_shared_client = httpx.Client(
    timeout=_TIMEOUT,
    limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
)

# Simple thread-safe TTL cache: key -> (value, expires_at)
_cache: dict[str, tuple[Any, float]] = {}
_cache_lock = Lock()


def _cache_get(key: str) -> Any | None:
    with _cache_lock:
        entry = _cache.get(key)
        if entry and time.time() < entry[1]:
            return entry[0]
        return None


def _cache_set(key: str, value: Any) -> None:
    with _cache_lock:
        _cache[key] = (value, time.time() + _CACHE_TTL)


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
            resp = _shared_client.get(url, headers=self._headers(), params=params or {})
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
        cache_key = f"college_students:{college_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            logger.debug("cache_hit key=%s", cache_key)
            return cached

        memberships = self._get(
            "/student_college_memberships",
            {
                "college_id": f"eq.{college_id}",
                "select": "student_id,department,enrollment_status",
            },
        )
        if not memberships:
            return []

        student_ids = [m["student_id"] for m in memberships if m.get("student_id")]
        if not student_ids:
            return []

        ids_csv = "(" + ",".join(student_ids) + ")"
        profiles = self._get(
            "/profiles",
            {
                "user_id": f"in.{ids_csv}",
                "select": "user_id,display_name,email",
            },
        )

        prof_by_id = {p["user_id"]: p for p in profiles}
        for m in memberships:
            sid = m.get("student_id")
            m["profiles"] = prof_by_id.get(sid) or {}

        _cache_set(cache_key, memberships)
        return memberships

    def get_latest_twins_for_users(self, user_ids: list[str]) -> dict[str, int]:
        """Latest career-twin overall_score for a list of user IDs."""
        if not user_ids:
            return {}
        ids_csv = "(" + ",".join(user_ids) + ")"
        rows = self._get(
            "/career_twins",
            {
                "user_id": f"in.{ids_csv}",
                "select": "user_id,result",
            },
        )
        scores: dict[str, int] = {}
        for row in rows:
            uid = row["user_id"]
            res = row.get("result") or {}
            score = res.get("overall_score")
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
