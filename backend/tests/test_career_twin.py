"""Career Twin endpoint and service behaviour tests.

Uses provider test doubles — normal CI must NOT depend on live Groq calls.
"""

from __future__ import annotations

import json
import time
import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_profiles_repository
from app.api.v1.career_twin import (
    get_career_twin_groq_client,
    get_career_twins_repository,
)
from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.main import app
from app.repositories.career_twins import CareerTwinsRepository
from app.schemas.career_twin import (
    CareerTwinResult,
    CareerTwinResponse,
    EvidenceSnapshot,
)
from tests.conftest import (
    API_PREFIX,
    FakeProfilesRepository,
    auth_header,
    make_token,
    profile_row,
)


# ── Fake Groq Client ──────────────────────────────────────────────────────


class FakeGroqClient:
    """Test double for GroqClient."""

    def __init__(
        self,
        *,
        response: dict[str, Any] | None = None,
        error: ApiError | None = None,
    ) -> None:
        self._response = response
        self._error = error
        self.last_payload: dict[str, Any] | None = None

    @property
    def is_configured(self) -> bool:
        return self._error is None or self._error.status_code != 503

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        self.last_payload = {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if self._error is not None:
            raise self._error
        assert self._response is not None
        return self._response


# ── Fake Career Twins Repository ───────────────────────────────────────────


class FakeCareerTwinsRepository:
    """Test double for CareerTwinsRepository."""

    def __init__(
        self,
        *,
        latest: dict[str, Any] | None = None,
        created: dict[str, Any] | None = None,
    ) -> None:
        self._latest = latest
        self._created = created
        self.last_created: dict[str, Any] | None = None
        self.last_stale_id: str | None = None

    async def get_latest(
        self, claims: dict[str, Any], user_id: str
    ) -> dict[str, Any] | None:
        return self._latest

    async def create(
        self,
        claims: dict[str, Any],
        *,
        user_id: str,
        target_role: str | None,
        input_version: int,
        model_provider: str,
        model_name: str,
        prompt_version: str,
        evidence_snapshot: dict[str, Any],
        result: dict[str, Any],
        status: str = "generated",
    ) -> dict[str, Any] | None:
        self.last_created = {
            "user_id": user_id,
            "target_role": target_role,
            "input_version": input_version,
            "result": result,
            "status": status,
        }
        if self._created is not None:
            return self._created
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "target_role": target_role,
            "input_version": input_version,
            "result": result,
            "status": status,
            "created_at": "2026-09-15T12:00:00Z",
        }

    async def mark_stale(
        self, claims: dict[str, Any], twin_id: str
    ) -> dict[str, Any] | None:
        self.last_stale_id = twin_id
        return {"id": twin_id, "status": "stale"}


# ── Helper: valid Groq response ───────────────────────────────────────────


def valid_groq_response() -> dict[str, Any]:
    """A valid Career Twin JSON response from Groq."""
    return {
        "target_role": "AI Engineer",
        "summary": "The student has a solid foundation in software engineering with relevant education and some AI/ML interests. Key gaps exist in hands-on ML experience and production ML systems.",
        "current_position": {
            "education_context": "Completed undergraduate degree in a relevant field.",
            "relevant_experience": "Limited professional experience in AI/ML roles.",
            "known_skills": "Programming fundamentals, basic data analysis.",
        },
        "strengths": [
            {
                "title": "Strong educational foundation",
                "evidence": "Completed degree with relevant coursework.",
                "relevance": "Provides theoretical understanding needed for AI engineering roles.",
            },
            {
                "title": "Demonstrated interest in AI",
                "evidence": "Listed AI and ML as interests.",
                "relevance": "Shows motivation to pursue the target career path.",
            },
        ],
        "gaps": [
            {
                "skill_or_capability": "Production ML engineering",
                "reason": "AI Engineer roles require deploying and maintaining ML models in production.",
                "priority": "critical",
                "evidence_state": "missing",
            },
            {
                "skill_or_capability": "Deep learning frameworks",
                "reason": "PyTorch/TensorFlow proficiency is expected for most AI engineering positions.",
                "priority": "critical",
                "evidence_state": "missing",
            },
        ],
        "trajectory": [
            {
                "stage": "Foundation Builder",
                "goal": "Build core ML skills and complete foundational projects",
                "capabilities_to_build": ["Python ML stack", "Basic deep learning", "Data preprocessing"],
                "recommended_actions": [
                    "Complete an ML fundamentals course",
                    "Build 2-3 portfolio projects",
                ],
            },
            {
                "stage": "Junior AI Engineer",
                "goal": "Gain practical experience with production ML systems",
                "capabilities_to_build": ["MLOps basics", "Model deployment", "Cloud ML services"],
                "recommended_actions": [
                    "Contribute to open-source ML projects",
                    "Apply for junior AI/ML roles",
                ],
            },
        ],
        "next_actions": [
            {
                "title": "Build foundational ML skills",
                "reason": "Core ML knowledge is essential before pursuing specialized roles.",
                "destination": "/skills",
            },
            {
                "title": "Create a learning roadmap",
                "reason": "A structured plan helps build skills efficiently.",
                "destination": "/roadmap",
            },
        ],
        "evidence_coverage": 0.4,
        "evidence_quality": "partial",
    }


# ── Tests ──────────────────────────────────────────────────────────────────


class TestCareerTwinGenerateEndpoint:
    """POST /career-twin/get-career-twin"""

    def test_requires_authentication(self, client: TestClient) -> None:
        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            json={},
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "not_authenticated"

    def test_requires_student_role(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id, role="college")
        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={},
        )
        assert response.status_code == 403

    def test_rejects_profile_required(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        fake_groq = FakeGroqClient(response=valid_groq_response())
        fake_twins = FakeCareerTwinsRepository()
        fake_profiles = FakeProfilesRepository(row=None)

        app.dependency_overrides[get_career_twin_groq_client] = lambda: fake_groq
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_profiles_repository] = lambda: fake_profiles

        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "profile_required"

    def test_generates_and_persists_result(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        fake_groq = FakeGroqClient(response=valid_groq_response())
        fake_twins = FakeCareerTwinsRepository()
        fake_profiles = FakeProfilesRepository(
            row=profile_row(
                user_id,
                target_role_name="AI Engineer",
                education=[
                    {"degree": "B.Tech CS", "institution": "IIT Bombay", "start_year": 2020, "end_year": 2024}
                ],
                interests=["AI", "ML", "NLP"],
            )
        )

        app.dependency_overrides[get_career_twin_groq_client] = lambda: fake_groq
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_profiles_repository] = lambda: fake_profiles

        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={"target_role": "AI Engineer"},
        )

        assert response.status_code == 200
        body = response.json()

        # Verify the result structure.
        assert "result" in body
        result = body["result"]
        assert result["target_role"] == "AI Engineer"
        assert "summary" in result
        assert isinstance(result["strengths"], list)
        assert isinstance(result["gaps"], list)
        assert isinstance(result["trajectory"], list)
        assert isinstance(result["next_actions"], list)

        # Verify persistence was called.
        assert fake_twins.last_created is not None
        assert fake_twins.last_created["user_id"] == user_id
        assert fake_twins.last_created["target_role"] == "AI Engineer"

        # Verify the agent received profile evidence.
        assert fake_groq.last_payload is not None
        assert "AI Engineer" in fake_groq.last_payload["user_prompt"]

    def test_ai_not_configured_returns_503(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        fake_groq = FakeGroqClient(
            error=ApiError(503, "ai_not_configured", "AI not configured.")
        )
        fake_twins = FakeCareerTwinsRepository()
        fake_profiles = FakeProfilesRepository(row=profile_row(user_id))

        app.dependency_overrides[get_career_twin_groq_client] = lambda: fake_groq
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_profiles_repository] = lambda: fake_profiles

        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={},
        )
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "ai_not_configured"

    def test_malformed_ai_output_returns_502(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        # Return something that is NOT valid Career Twin JSON.
        fake_groq = FakeGroqClient(response={"invalid": True})
        fake_twins = FakeCareerTwinsRepository()
        fake_profiles = FakeProfilesRepository(row=profile_row(user_id))

        app.dependency_overrides[get_career_twin_groq_client] = lambda: fake_groq
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_profiles_repository] = lambda: fake_profiles

        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={},
        )
        assert response.status_code == 502
        assert response.json()["error"]["code"] == "ai_malformed_output"

    def test_rejects_extra_fields(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        app.dependency_overrides[get_career_twin_groq_client] = lambda: FakeGroqClient()
        app.dependency_overrides[get_career_twins_repository] = lambda: FakeCareerTwinsRepository()
        app.dependency_overrides[get_profiles_repository] = lambda: FakeProfilesRepository(row=profile_row(user_id))

        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={"unknown_field": "hacked"},
        )
        assert response.status_code == 422

    def test_returns_200_with_empty_request(self, client: TestClient) -> None:
        """Empty request body is valid — all fields are optional."""
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        fake_groq = FakeGroqClient(response=valid_groq_response())
        fake_twins = FakeCareerTwinsRepository()
        fake_profiles = FakeProfilesRepository(row=profile_row(user_id))

        app.dependency_overrides[get_career_twin_groq_client] = lambda: fake_groq
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_profiles_repository] = lambda: fake_profiles

        response = client.post(
            f"{API_PREFIX}/career-twin/get-career-twin",
            headers=auth_header(token),
            json={},
        )
        assert response.status_code == 200


class TestCareerTwinLatestEndpoint:
    """GET /career-twin/latest"""

    def test_requires_authentication(self, client: TestClient) -> None:
        response = client.get(f"{API_PREFIX}/career-twin/latest")
        assert response.status_code == 401

    def test_requires_student_role(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id, role="recruiter")
        response = client.get(
            f"{API_PREFIX}/career-twin/latest",
            headers=auth_header(token),
        )
        assert response.status_code == 403

    def test_returns_null_when_no_twin(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        fake_twins = FakeCareerTwinsRepository(latest=None)
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_career_twin_groq_client] = lambda: FakeGroqClient()
        app.dependency_overrides[get_profiles_repository] = lambda: FakeProfilesRepository(row=profile_row(user_id))

        response = client.get(
            f"{API_PREFIX}/career-twin/latest",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        # FastAPI returns null for None response_model.
        assert response.json() is None

    def test_returns_latest_twin(self, client: TestClient) -> None:
        user_id = str(uuid.uuid4())
        token = make_token(sub=user_id)

        existing_twin = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "target_role": "AI Engineer",
            "result": valid_groq_response(),
            "status": "generated",
            "created_at": "2026-09-15T12:00:00Z",
            "model_name": "llama-3.3-70b-versatile",
        }

        fake_twins = FakeCareerTwinsRepository(latest=existing_twin)
        app.dependency_overrides[get_career_twins_repository] = lambda: fake_twins
        app.dependency_overrides[get_career_twin_groq_client] = lambda: FakeGroqClient()
        app.dependency_overrides[get_profiles_repository] = lambda: FakeProfilesRepository(row=profile_row(user_id))

        response = client.get(
            f"{API_PREFIX}/career-twin/latest",
            headers=auth_header(token),
        )
        assert response.status_code == 200
        body = response.json()
        assert body is not None
        assert body["result"]["target_role"] == "AI Engineer"
        assert body["twin_id"] == existing_twin["id"]


class TestCareerTwinResult:
    """Pydantic schema validation."""

    def test_valid_result(self) -> None:
        result = CareerTwinResult.model_validate(valid_groq_response())
        assert result.target_role == "AI Engineer"
        assert result.evidence_quality == "partial"
        assert len(result.strengths) == 2
        assert len(result.gaps) == 2
        assert result.evidence_coverage == 0.4

    def test_minimal_result(self) -> None:
        result = CareerTwinResult.model_validate({
            "summary": "Insufficient evidence for analysis.",
            "evidence_quality": "insufficient",
        })
        assert result.target_role is None
        assert result.strengths == []
        assert result.gaps == []
        assert result.evidence_coverage is None

    def test_evidence_snapshot_version(self) -> None:
        e1 = EvidenceSnapshot(
            target_role="AI Engineer",
            education=[{"degree": "B.Tech"}],
            interests=["AI"],
        )
        e2 = EvidenceSnapshot(
            target_role="AI Engineer",
            education=[{"degree": "B.Tech"}],
            interests=["AI"],
        )
        e3 = EvidenceSnapshot(
            target_role="Data Scientist",
            education=[{"degree": "B.Tech"}],
            interests=["AI"],
        )
        assert e1.compute_version() == e2.compute_version()
        assert e1.compute_version() != e3.compute_version()


class TestCareerTwinNumericPolicy:
    """Verify no fabricated numeric scores leak through."""

    def test_no_readiness_score_in_response(self) -> None:
        result = CareerTwinResult.model_validate(valid_groq_response())
        data = result.model_dump()
        # The result should NOT contain readiness_score, placement_probability, etc.
        assert "readiness_score" not in data
        assert "placement_probability" not in data
        assert "salary_prediction" not in data

    def test_evidence_coverage_is_honest_metric(self) -> None:
        result = CareerTwinResult.model_validate(valid_groq_response())
        assert result.evidence_coverage is not None
        assert 0.0 <= result.evidence_coverage <= 1.0

    def test_no_salary_forecast(self) -> None:
        result = CareerTwinResult.model_validate(valid_groq_response())
        data = result.model_dump()
        # Verify no salary fields exist.
        assert "predicted_salary" not in data
        assert "salary_forecast" not in data
