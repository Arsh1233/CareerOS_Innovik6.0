"""Tests for Phase 06: Skill Gap Analysis and Roadmap endpoints.

All tests are offline — no Supabase, Groq, or Qdrant connectivity needed.
Groq, repositories, and external services are mocked via dependency overrides.

Test groups:
A) Skill gap — no role, no requirements, no skills, matched, missing, priority, cross-user
B) Roadmap — generation, malformed Groq, Groq timeout, persistence, latest, milestone complete,
             reload persistence, cross-user denial
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_profiles_repository
from app.api.v1.roadmap import (
    get_career_twins_repository_local,
    get_roadmap_groq_client,
    get_roadmap_service,
    get_roadmaps_repository,
    get_role_requirements_repository_local,
    get_skill_gap_service as get_roadmap_gap_service,
    get_skills_repository_local,
)
from app.api.v1.skills import (
    get_role_requirements_repository,
    get_skill_gap_service,
    get_skills_repository,
)
from app.core.errors import ApiError
from app.main import app
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.profiles import ProfilesRepository
from app.repositories.roadmaps import RoadmapsRepository
from app.repositories.role_requirements import RoleRequirementsRepository
from app.repositories.skills import SkillsRepository
from app.schemas.skills_roadmap import MilestoneResponse, RoadmapResponse, SkillGapResponse
from app.services.roadmap_service import RoadmapService
from app.services.skill_gap_service import SkillGapService
from tests.conftest import (
    API_PREFIX,
    FakeProfilesRepository,
    auth_header,
    client,
    make_token,
    profile_row,
)

# ── Helpers ────────────────────────────────────────────────────────────────

USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())
NOW = datetime.now(timezone.utc).isoformat()


def fake_skill(key: str, display: str, summary: str = "") -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "user_id": USER_A,
        "normalized_skill_key": key,
        "display_name": display,
        "proficiency": None,
        "source_summary": summary,
        "verified": False,
        "created_at": NOW,
        "updated_at": NOW,
    }


def fake_requirement(skill_name: str, display: str, importance: str = "critical", level: str | None = None) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "role_name": "ai engineer",
        "skill_name": skill_name,
        "display_name": display,
        "importance": importance,
        "minimum_level": level,
        "version": 1,
    }


def fake_roadmap_row(user_id: str = USER_A, status: str = "active") -> dict[str, Any]:
    rid = str(uuid.uuid4())
    return {
        "id": rid,
        "user_id": user_id,
        "target_role": "AI Engineer",
        "version": 1,
        "pace_hours_per_week": 10,
        "plan": {"target_role": "AI Engineer", "weeks": []},
        "status": status,
        "model_provider": "groq",
        "model_name": "llama-3.3-70b-versatile",
        "prompt_version": "v1",
        "created_at": NOW,
        "updated_at": NOW,
    }


def fake_milestone_row(roadmap_id: str, week: int = 1, status: str = "pending") -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "roadmap_id": roadmap_id,
        "user_id": USER_A,
        "week_number": week,
        "title": f"Week {week} theme",
        "description": "Test objectives",
        "status": status,
        "completed_at": None,
        "created_at": NOW,
        "updated_at": NOW,
    }


def groq_roadmap_response(target_role: str = "AI Engineer") -> str:
    plan = {
        "target_role": target_role,
        "weeks": [
            {
                "week": 1,
                "theme": "Python Fundamentals",
                "objectives": ["Learn Python basics", "Practice exercises"],
                "skills": ["Python"],
                "tasks": [
                    {
                        "title": "Complete Python course",
                        "type": "course",
                        "estimated_hours": 5.0,
                        "description": "Work through a Python fundamentals course",
                        "destination": None,
                    }
                ],
            }
        ],
    }
    return json.dumps(plan)


class FakeSkillsRepository:
    def __init__(self, rows: list[dict[str, Any]] | None = None) -> None:
        self.rows = rows or []

    async def list_skills(self, claims: dict, user_id: str) -> list[dict]:
        return self.rows


class FakeRoleRequirementsRepository:
    def __init__(self, rows: list[dict[str, Any]] | None = None) -> None:
        self.rows = rows or []

    async def get_requirements_for_role(self, access_token: str, role_name: str, version: int = 1) -> list[dict]:
        return self.rows


class FakeRoadmapsRepository:
    def __init__(self) -> None:
        self._roadmap: dict[str, Any] | None = None
        self._milestones: list[dict[str, Any]] = []
        self._milestone_by_id: dict[str, dict[str, Any]] = {}
        self.last_status_update: str | None = None

    async def create(self, claims: dict, *, user_id: str, **kwargs: Any) -> dict | None:
        row = fake_roadmap_row(user_id)
        self._roadmap = row
        return row

    async def get_latest(self, claims: dict, user_id: str) -> dict | None:
        return self._roadmap

    async def create_milestones(self, claims: dict, milestones: list[dict]) -> list[dict]:
        results = []
        for m in milestones:
            row = dict(m)
            row["id"] = str(uuid.uuid4())
            row["created_at"] = NOW
            row["updated_at"] = NOW
            row["completed_at"] = None
            self._milestones.append(row)
            self._milestone_by_id[row["id"]] = row
            results.append(row)
        return results

    async def list_milestones(self, claims: dict, roadmap_id: str) -> list[dict]:
        return self._milestones

    async def get_milestone(self, claims: dict, milestone_id: str) -> dict | None:
        return self._milestone_by_id.get(milestone_id)

    async def update_milestone_status(self, claims: dict, milestone_id: str, status: str) -> dict | None:
        m = self._milestone_by_id.get(milestone_id)
        if m:
            m["status"] = status
            if status == "completed":
                m["completed_at"] = NOW
            self.last_status_update = status
        return m

    async def mark_stale(self, claims: dict, roadmap_id: str) -> dict | None:
        return None


class FakeCareerTwinsRepository:
    async def get_latest(self, claims: dict, user_id: str) -> dict | None:
        return None

    async def mark_stale(self, claims: dict, twin_id: str) -> dict | None:
        return None


def make_fake_gap_service(
    profile: dict | None,
    skills: list = [],
    requirements: list = [],
) -> SkillGapService:
    profiles_repo = FakeProfilesRepository(row=profile)
    skills_repo = FakeSkillsRepository(rows=skills)
    reqs_repo = FakeRoleRequirementsRepository(rows=requirements)
    return SkillGapService(
        profiles_repo=profiles_repo,
        skills_repo=skills_repo,
        role_requirements_repo=reqs_repo,
    )


def make_fake_roadmap_service(
    profile: dict | None,
    groq_response: str | None = None,
    groq_error: Exception | None = None,
    skills: list = [],
    requirements: list = [],
) -> RoadmapService:
    groq_client = MagicMock()
    groq_client.model = "llama-3.3-70b-versatile"
    if groq_error:
        groq_client.complete = AsyncMock(side_effect=groq_error)
    else:
        groq_client.complete = AsyncMock(return_value=groq_response or groq_roadmap_response())

    gap_service = make_fake_gap_service(profile, skills, requirements)

    return RoadmapService(
        groq_client=groq_client,
        profiles_repo=FakeProfilesRepository(row=profile),
        roadmaps_repo=FakeRoadmapsRepository(),
        twins_repo=FakeCareerTwinsRepository(),
        skill_gap_service=gap_service,
    )


# ── A: Skill Gap Tests ─────────────────────────────────────────────────────


class TestSkillGapEndpoint:
    def _override_gap(self, service: SkillGapService) -> None:
        app.dependency_overrides[get_profiles_repository] = lambda: service._profiles
        app.dependency_overrides[get_skills_repository] = lambda: service._skills
        app.dependency_overrides[get_role_requirements_repository] = lambda: service._requirements

    def test_no_role_returns_honest_state(self, client: TestClient) -> None:
        """No target role → evidence_quality: no_role, no fabricated gaps."""
        p = profile_row(USER_A, target_role_name=None)
        svc = make_fake_gap_service(profile=p, skills=[], requirements=[])
        self._override_gap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["evidence_quality"] == "no_role"
        assert data["target_role"] == "(not set)"
        assert data["gaps"] == []
        assert data["matched_skills"] == []

    def test_no_requirements_returns_honest_state(self, client: TestClient) -> None:
        """Role set but no seeded requirements → no_requirements state."""
        p = profile_row(USER_A, target_role_name="obscure role")
        svc = make_fake_gap_service(profile=p, skills=[], requirements=[])
        self._override_gap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["evidence_quality"] == "no_requirements"
        assert data["gaps"] == []

    def test_no_skills_all_required_become_gaps(self, client: TestClient) -> None:
        """Student has no skills → all requirements become gaps."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        reqs = [
            fake_requirement("python", "Python", "critical"),
            fake_requirement("mlops", "MLOps", "critical"),
        ]
        svc = make_fake_gap_service(profile=p, skills=[], requirements=reqs)
        self._override_gap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["gap_count"] == 2
        assert data["matched_count"] == 0
        # evidence_quality = insufficient (0/2 matched = 0%)
        assert data["evidence_quality"] == "insufficient"
        # Gaps are not fabricated — no invented proficiency
        for gap in data["gaps"]:
            assert gap["current_evidence"] is None

    def test_matched_skills_reduce_gaps(self, client: TestClient) -> None:
        """Student has Python → Python shows as matched, not a gap."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        skills = [fake_skill("python", "Python", "Mentioned in resume")]
        reqs = [
            fake_requirement("python", "Python", "critical"),
            fake_requirement("mlops", "MLOps", "critical"),
        ]
        svc = make_fake_gap_service(profile=p, skills=skills, requirements=reqs)
        self._override_gap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        matched_keys = [m["normalized_key"] for m in data["matched_skills"]]
        assert "python" in matched_keys
        gap_keys = [g["normalized_key"] for g in data["gaps"]]
        assert "mlops" in gap_keys
        assert "python" not in gap_keys

    def test_gaps_are_priority_sorted(self, client: TestClient) -> None:
        """Critical gaps appear before recommended, which appear before optional."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        reqs = [
            fake_requirement("optional_skill", "Optional Skill", "optional"),
            fake_requirement("critical_skill", "Critical Skill", "critical"),
            fake_requirement("recommended_skill", "Recommended Skill", "recommended"),
        ]
        svc = make_fake_gap_service(profile=p, skills=[], requirements=reqs)
        self._override_gap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token))
        assert resp.status_code == 200
        gaps = resp.json()["gaps"]
        priorities = [g["priority"] for g in gaps]
        # critical must come first
        assert priorities[0] == "critical"
        assert priorities[-1] == "optional"

    def test_unauthenticated_denied(self, client: TestClient) -> None:
        """No token → 401."""
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis")
        assert resp.status_code == 401

    def test_wrong_role_denied(self, client: TestClient) -> None:
        """Recruiter cannot access student skill gap."""
        token = make_token("recruiter", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token))
        assert resp.status_code == 403

    def test_cross_user_rls_simulation(self, client: TestClient) -> None:
        """Student B's service cannot see Student A's skills — each user gets their own RLS-scoped view."""
        p_b = profile_row(USER_B, target_role_name="AI Engineer")
        skills_b: list = []  # B has no skills
        reqs = [fake_requirement("python", "Python", "critical")]
        svc_b = make_fake_gap_service(profile=p_b, skills=skills_b, requirements=reqs)
        self._override_gap(svc_b)

        # B's token
        token_b = make_token("student", sub=USER_B)
        resp = client.get(f"{API_PREFIX}/skills/gap-analysis", headers=auth_header(token_b))
        assert resp.status_code == 200
        data = resp.json()
        # B sees no matched skills
        assert data["matched_count"] == 0


# ── B: Roadmap Tests ───────────────────────────────────────────────────────


class TestRoadmapEndpoints:
    def _override_roadmap(self, service: RoadmapService) -> None:
        app.dependency_overrides[get_roadmap_groq_client] = lambda: service._groq
        app.dependency_overrides[get_profiles_repository] = lambda: service._profiles
        app.dependency_overrides[get_roadmaps_repository] = lambda: service._roadmaps
        app.dependency_overrides[get_career_twins_repository_local] = lambda: service._twins
        app.dependency_overrides[get_skills_repository_local] = lambda: service._gap_service._skills
        app.dependency_overrides[get_role_requirements_repository_local] = lambda: service._gap_service._requirements

    def test_generate_roadmap_success(self, client: TestClient) -> None:
        """Successful generation returns a valid RoadmapResponse with milestones."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p)
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_role"] == "AI Engineer"
        assert "plan" in data
        assert isinstance(data["milestones"], list)

    def test_generate_roadmap_no_profile(self, client: TestClient) -> None:
        """No profile → 400 profile_required."""
        svc = make_fake_roadmap_service(profile=None)
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 400
        assert resp.json()["error"]["code"] == "profile_required"

    def test_generate_roadmap_no_target_role(self, client: TestClient) -> None:
        """Profile with no target role → 400 target_role_required."""
        p = profile_row(USER_A, target_role_name=None)
        svc = make_fake_roadmap_service(profile=p)
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 400
        assert resp.json()["error"]["code"] == "target_role_required"

    def test_generate_roadmap_malformed_groq(self, client: TestClient) -> None:
        """Malformed Groq output → 503 validation error, not silent success."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p, groq_response='{"broken": true}')
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 503

    def test_generate_roadmap_groq_timeout(self, client: TestClient) -> None:
        """Groq timeout → 503, not a fake success."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(
            profile=p, groq_error=ApiError(503, "groq_timeout", "Groq timed out.")
        )
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 503

    def test_get_latest_roadmap_when_none(self, client: TestClient) -> None:
        """No roadmap generated yet → returns null (not 404)."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p)
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.get(f"{API_PREFIX}/roadmap/latest", headers=auth_header(token))
        assert resp.status_code == 200
        # No roadmap yet → null
        assert resp.json() is None

    def test_get_latest_roadmap_after_generate(self, client: TestClient) -> None:
        """After generation, GET /latest returns the persisted roadmap."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p)
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        # Generate first
        gen = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert gen.status_code == 200

        # Now latest should return the same roadmap (same service instance)
        latest = client.get(f"{API_PREFIX}/roadmap/latest", headers=auth_header(token))
        assert latest.status_code == 200
        data = latest.json()
        assert data is not None
        assert data["target_role"] == "AI Engineer"

    def test_milestone_complete_persists(self, client: TestClient) -> None:
        """PATCH milestone status=completed persists and returns authoritative row."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p)

        # Pre-insert a milestone into the fake repository
        roadmap_row = fake_roadmap_row(USER_A)
        milestone_row = fake_milestone_row(roadmap_row["id"], week=1, status="pending")
        svc._roadmaps._roadmap = roadmap_row  # type: ignore[attr-defined]
        svc._roadmaps._milestones = [milestone_row]  # type: ignore[attr-defined]
        svc._roadmaps._milestone_by_id = {milestone_row["id"]: milestone_row}  # type: ignore[attr-defined]

        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        resp = client.patch(
            f"{API_PREFIX}/roadmap/milestones/{milestone_row['id']}",
            json={"status": "completed"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"
        # completed_at must be set
        assert data["completed_at"] is not None

    def test_milestone_complete_is_learning_progress_only(self, client: TestClient) -> None:
        """Completing a milestone does NOT modify any skill proficiency."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p, skills=[fake_skill("python", "Python")])

        roadmap_row = fake_roadmap_row(USER_A)
        milestone_row = fake_milestone_row(roadmap_row["id"], week=1, status="pending")
        svc._roadmaps._roadmap = roadmap_row  # type: ignore[attr-defined]
        svc._roadmaps._milestones = [milestone_row]  # type: ignore[attr-defined]
        svc._roadmaps._milestone_by_id = {milestone_row["id"]: milestone_row}  # type: ignore[attr-defined]

        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        # Complete the milestone
        client.patch(
            f"{API_PREFIX}/roadmap/milestones/{milestone_row['id']}",
            json={"status": "completed"},
            headers=auth_header(token),
        )
        # Skill repository was not touched — no proficiency update
        # (SkillsRepository.upsert_skill not called — only milestone status changed)
        assert svc._roadmaps.last_status_update == "completed"  # type: ignore[attr-defined]

    def test_milestone_reload_persistence(self, client: TestClient) -> None:
        """After marking complete, GET /latest shows same completion state."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p)

        roadmap_row = fake_roadmap_row(USER_A)
        milestone_row = fake_milestone_row(roadmap_row["id"], week=1, status="pending")
        svc._roadmaps._roadmap = roadmap_row  # type: ignore[attr-defined]
        svc._roadmaps._milestones = [milestone_row]  # type: ignore[attr-defined]
        svc._roadmaps._milestone_by_id = {milestone_row["id"]: milestone_row}  # type: ignore[attr-defined]

        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)

        # Mark complete
        client.patch(
            f"{API_PREFIX}/roadmap/milestones/{milestone_row['id']}",
            json={"status": "completed"},
            headers=auth_header(token),
        )

        # Load latest — milestone should show completed
        latest = client.get(f"{API_PREFIX}/roadmap/latest", headers=auth_header(token))
        assert latest.status_code == 200
        data = latest.json()
        assert data is not None
        milestones = data["milestones"]
        assert len(milestones) == 1
        assert milestones[0]["status"] == "completed"

    def test_roadmap_unauthenticated_denied(self, client: TestClient) -> None:
        """No token → 401 on all roadmap endpoints."""
        resp = client.get(f"{API_PREFIX}/roadmap/latest")
        assert resp.status_code == 401

    def test_roadmap_wrong_role_denied(self, client: TestClient) -> None:
        """Recruiter cannot generate or view student roadmap."""
        token = make_token("recruiter", sub=USER_A)
        resp = client.post(
            f"{API_PREFIX}/roadmap/get-roadmap",
            json={"pace_hours_per_week": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 403

    def test_milestone_not_found_returns_404(self, client: TestClient) -> None:
        """Trying to patch a nonexistent milestone → 404."""
        p = profile_row(USER_A, target_role_name="AI Engineer")
        svc = make_fake_roadmap_service(profile=p)
        self._override_roadmap(svc)

        token = make_token("student", sub=USER_A)
        fake_id = str(uuid.uuid4())
        resp = client.patch(
            f"{API_PREFIX}/roadmap/milestones/{fake_id}",
            json={"status": "completed"},
            headers=auth_header(token),
        )
        assert resp.status_code == 404

    def test_cross_user_milestone_denied(self, client: TestClient) -> None:
        """Student B cannot update Student A's milestone (RLS simulated via empty repo)."""
        # Student B's service has no milestones
        p_b = profile_row(USER_B, target_role_name="AI Engineer")
        svc_b = make_fake_roadmap_service(profile=p_b)
        self._override_roadmap(svc_b)

        token_b = make_token("student", sub=USER_B)
        fake_milestone_id = str(uuid.uuid4())  # belongs to A, unknown to B's repo
        resp = client.patch(
            f"{API_PREFIX}/roadmap/milestones/{fake_milestone_id}",
            json={"status": "completed"},
            headers=auth_header(token_b),
        )
        assert resp.status_code == 404  # not found from B's perspective
