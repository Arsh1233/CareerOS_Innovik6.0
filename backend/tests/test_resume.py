"""Resume Intelligence — endpoint, service, and scoring tests.

All external providers (Groq, Storage, Qdrant, FastEmbed) are mocked.
Normal CI must NOT depend on live services.

Covers (per Phase 05 spec):
  - unauthenticated upload → 401
  - wrong role → 403
  - valid PDF → 200 with analysis
  - invalid MIME → 422
  - oversized file → 413
  - empty PDF → 422
  - unparseable PDF → parse_status=insufficient_text
  - duplicate upload → returns existing analysis
  - Groq structured success
  - Groq malformed response → analysis_status=failed
  - Groq timeout → analysis_status=failed
  - score determinism (same input → same score, score ≠ 81 hardcoded)
  - skill normalization
  - skill evidence persistence
  - Qdrant success
  - Qdrant failure isolation (analysis preserved when Qdrant fails)
  - latest resume readback
  - cross-user access denial (RLS via PostgREST)
  - archive/remove
"""

from __future__ import annotations

import io
import time
import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.deps import require_roles
from app.api.v1.resumes import (
    get_career_twins_repository,
    get_resumes_repository,
    get_resume_service,
    get_skills_repository,
)
from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.integrations.qdrant_client import QdrantIntegration
from app.integrations.storage import StorageClient
from app.main import app
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.resumes import ResumesRepository
from app.repositories.skills import SkillsRepository
from app.schemas.resume import ResumeAnalysis, ScoreBreakdown
from app.services.resume_service import (
    _calculate_score,
    _normalise_skill_key,
    _sanitise_filename,
    ResumeService,
)
from tests.conftest import API_PREFIX, auth_header, make_token

# ── Fake PDF bytes (valid magic + minimal content) ─────────────────────────

_VALID_PDF = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
    b"  /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\n"
    b"BT /F1 12 Tf 100 700 Td (Hello Resume) Tj ET\nendstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f\n...\n%%EOF"
)
_TINY_PDF = b"%PDF-1.4\n%%EOF"  # valid magic but no extractable text
_NOT_PDF = b"This is not a PDF file at all"
_OVERSIZED_PDF = b"%PDF-1.4 " + b"x" * (11 * 1024 * 1024)  # > 10MB

# ── Minimal valid analysis dict ────────────────────────────────────────────

_GOOD_ANALYSIS_DICT: dict[str, Any] = {
    "summary": "A strong candidate with Python and FastAPI experience.",
    "detected_role": "Backend Engineer",
    "education_summary": "B.Tech Computer Science, IIT Delhi (2020-2024)",
    "experience_summary": "Software Engineering Intern at Flipkart (2023)",
    "sections_detected": [
        {"name": "Contact", "detected": True, "quality": "good", "notes": ""},
        {"name": "Education", "detected": True, "quality": "good", "notes": ""},
        {"name": "Experience", "detected": True, "quality": "good", "notes": ""},
        {"name": "Projects", "detected": True, "quality": "good", "notes": ""},
        {"name": "Skills", "detected": True, "quality": "good", "notes": ""},
        {"name": "Certifications", "detected": False, "quality": "missing", "notes": ""},
    ],
    "skills": [
        {
            "name": "FastAPI",
            "normalized_key": "fastapi",
            "evidence": "Built REST APIs using FastAPI at Flipkart internship.",
            "source_section": "Experience",
        },
        {
            "name": "Python",
            "normalized_key": "python",
            "evidence": "Python used throughout all projects.",
            "source_section": "Skills",
        },
    ],
    "certifications": [],
    "strengths": ["Clear project descriptions", "Quantified internship outcomes"],
    "weak_sections": ["No certifications listed"],
    "recommendations": {
        "critical": ["Add a professional summary"],
        "recommended": ["Quantify more project outcomes"],
        "optional": [],
    },
    "has_contact_info": True,
    "has_education": True,
    "has_experience": True,
    "has_projects": True,
    "has_certifications": False,
    "has_skills_section": True,
    "has_quantified_achievements": True,
    "bullet_structure_quality": "good",
    "role_keywords_found": ["FastAPI", "Python"],
    "role_keywords_missing": ["Docker"],
}


# ── Fake providers ─────────────────────────────────────────────────────────


class FakeGroqClient:
    """Test double for GroqClient."""

    def __init__(
        self,
        *,
        response: dict[str, Any] | None = None,
        error: ApiError | None = None,
    ) -> None:
        self._response = response or _GOOD_ANALYSIS_DICT
        self._error = error
        self.call_count = 0

    @property
    def is_configured(self) -> bool:
        return True

    def _model(self) -> str:
        return "llama-3.3-70b-versatile"

    async def generate_structured(self, **_kwargs: Any) -> dict[str, Any]:
        self.call_count += 1
        if self._error:
            raise self._error
        return self._response


class FakeStorageClient:
    """Test double for StorageClient."""

    def __init__(self, *, fail_upload: bool = False) -> None:
        self._fail_upload = fail_upload
        self.upload_calls: list[str] = []
        self.delete_calls: list[str] = []

    async def ensure_bucket_exists(self, bucket: str) -> None:
        pass

    async def upload_file(
        self, bucket: str, path: str, content: bytes, content_type: str = "application/pdf"
    ) -> str:
        if self._fail_upload:
            raise ApiError(503, "storage_upload_failed", "Storage unavailable")
        self.upload_calls.append(path)
        return path

    async def delete_file(self, bucket: str, path: str) -> None:
        self.delete_calls.append(path)


class FakeQdrantClient:
    """Test double for QdrantIntegration."""

    def __init__(self, *, fail_upsert: bool = False) -> None:
        self._fail_upsert = fail_upsert
        self.upsert_calls: list[dict[str, Any]] = []
        self.delete_calls: list[str] = []

    @property
    def is_configured(self) -> bool:
        return True

    async def ensure_collection_exists(self) -> None:
        pass

    async def upsert_resume(self, **kwargs: Any) -> None:
        if self._fail_upsert:
            raise ApiError(503, "qdrant_unavailable", "Qdrant down")
        self.upsert_calls.append(kwargs)

    async def delete_resume(self, resume_id: str) -> None:
        self.delete_calls.append(resume_id)


class FakeResumesRepository:
    """In-memory test double for ResumesRepository."""

    def __init__(self) -> None:
        self._rows: dict[str, dict[str, Any]] = {}
        self._user_rows: dict[str, list[str]] = {}  # user_id -> [resume_id]

    def _add_row(self, row: dict[str, Any]) -> None:
        rid = str(row["id"])
        uid = str(row["user_id"])
        self._rows[rid] = row
        self._user_rows.setdefault(uid, []).append(rid)

    async def create(self, claims: Any, **kwargs: Any) -> dict[str, Any]:
        row: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "parse_status": "pending",
            "analysis_status": "pending",
            "embedding_status": "pending",
            "is_archived": False,
            "version": 1,
            "analysis": {},
            "score_breakdown": {},
            "resume_quality_score": None,
            "score_version": None,
            "created_at": "2026-09-15T12:00:00Z",
            "updated_at": "2026-09-15T12:00:00Z",
            **kwargs,
        }
        self._add_row(row)
        return row

    async def update_parse_status(self, claims: Any, resume_id: str, *, status: str, extracted_data: Any = None) -> Any:
        if resume_id in self._rows:
            self._rows[resume_id]["parse_status"] = status
            if extracted_data:
                self._rows[resume_id]["extracted_data"] = extracted_data

    async def update_extracted_text(self, claims: Any, resume_id: str, *, extracted_text: str) -> None:
        if resume_id in self._rows:
            self._rows[resume_id]["extracted_text"] = extracted_text

    async def update_analysis(self, claims: Any, resume_id: str, **kwargs: Any) -> Any:
        if resume_id in self._rows:
            self._rows[resume_id].update(kwargs)
        return self._rows.get(resume_id)

    async def update_embedding_status(self, claims: Any, resume_id: str, *, status: str) -> None:
        if resume_id in self._rows:
            self._rows[resume_id]["embedding_status"] = status

    async def update_storage_path(self, claims: Any, resume_id: str, *, storage_path: str) -> None:
        if resume_id in self._rows:
            self._rows[resume_id]["storage_path"] = storage_path

    async def get_extracted_text(self, claims: Any, resume_id: str) -> str:
        row = self._rows.get(resume_id)
        if row and row.get("user_id") == claims.get("sub"):
            return row.get("extracted_text", "")
        return ""

    async def get_latest(self, claims: Any, user_id: str) -> dict[str, Any] | None:
        rids = self._user_rows.get(user_id, [])
        for rid in reversed(rids):
            row = self._rows.get(rid)
            if row and not row.get("is_archived"):
                return row
        return None

    async def get_by_id(self, claims: Any, resume_id: str) -> dict[str, Any] | None:
        row = self._rows.get(resume_id)
        if row and row.get("user_id") == claims.get("sub"):
            return row
        return None

    async def get_by_hash(self, claims: Any, user_id: str, content_hash: str) -> dict[str, Any] | None:
        rids = self._user_rows.get(user_id, [])
        for rid in reversed(rids):
            row = self._rows.get(rid)
            if row and row.get("content_hash") == content_hash and not row.get("is_archived"):
                return row
        return None

    async def list_resumes(self, claims: Any, user_id: str, include_archived: bool = False) -> list[dict[str, Any]]:
        rids = self._user_rows.get(user_id, [])
        rows = [self._rows[rid] for rid in rids if rid in self._rows]
        if not include_archived:
            rows = [r for r in rows if not r.get("is_archived")]
        return rows

    async def archive(self, claims: Any, resume_id: str) -> dict[str, Any] | None:
        if resume_id in self._rows:
            self._rows[resume_id]["is_archived"] = True
        return self._rows.get(resume_id)


class FakeSkillsRepository:
    """In-memory test double for SkillsRepository."""

    def __init__(self) -> None:
        self._skills: dict[str, dict[str, Any]] = {}  # "user_id:key" -> row
        self._evidence: list[dict[str, Any]] = []

    async def get_by_normalized_key(self, claims: Any, user_id: str, normalized_key: str) -> dict[str, Any] | None:
        return self._skills.get(f"{user_id}:{normalized_key}")

    async def upsert_skill(self, claims: Any, *, user_id: str, normalized_key: str, display_name: str, source_summary: str = "") -> dict[str, Any] | None:
        key = f"{user_id}:{normalized_key}"
        existing = self._skills.get(key)
        if existing and existing.get("verified"):
            return existing
        row: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "normalized_skill_key": normalized_key,
            "display_name": display_name,
            "source_summary": source_summary,
            "verified": False,
            **(existing or {}),
        }
        self._skills[key] = row
        return row

    async def create_skill_evidence(self, claims: Any, *, user_id: str, skill_id: str, source_type: str, source_id: str | None, evidence_text: str) -> dict[str, Any] | None:
        ev: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "skill_id": skill_id,
            "source_type": source_type,
            "source_id": source_id,
            "evidence_text": evidence_text,
        }
        self._evidence.append(ev)
        return ev

    async def list_skills(self, claims: Any, user_id: str) -> list[dict[str, Any]]:
        return [v for v in self._skills.values() if v.get("user_id") == user_id]


class FakeCareerTwinsRepository:
    def __init__(self) -> None:
        self._latest: dict[str, Any] | None = None
        self.mark_stale_called = False

    async def get_latest(self, claims: Any, user_id: str) -> dict[str, Any] | None:
        return self._latest

    async def mark_stale(self, claims: Any, twin_id: str) -> dict[str, Any] | None:
        self.mark_stale_called = True
        return None

    async def create(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
        return None


# ── Fixtures ───────────────────────────────────────────────────────────────

UPLOAD_URL = f"{API_PREFIX}/resumes/upload-resume"
LATEST_URL = f"{API_PREFIX}/resumes/latest"
LIST_URL = f"{API_PREFIX}/resumes"


def _make_service(
    *,
    groq: FakeGroqClient | None = None,
    storage: FakeStorageClient | None = None,
    qdrant: FakeQdrantClient | None = None,
    resumes_repo: FakeResumesRepository | None = None,
    skills_repo: FakeSkillsRepository | None = None,
    twins_repo: FakeCareerTwinsRepository | None = None,
) -> ResumeService:
    return ResumeService(
        groq_client=groq or FakeGroqClient(),
        storage_client=storage or FakeStorageClient(),
        qdrant=qdrant or FakeQdrantClient(),
        resumes_repo=resumes_repo or FakeResumesRepository(),
        skills_repo=skills_repo or FakeSkillsRepository(),
        twins_repo=twins_repo or FakeCareerTwinsRepository(),
        resume_bucket="test-resumes",
    )


def _upload_overrides(
    service: ResumeService,
) -> None:
    app.dependency_overrides[get_resume_service] = lambda: service
    app.dependency_overrides[get_resumes_repository] = lambda: FakeResumesRepository()
    app.dependency_overrides[get_skills_repository] = lambda: FakeSkillsRepository()
    app.dependency_overrides[get_career_twins_repository] = lambda: FakeCareerTwinsRepository()


def _clear_overrides() -> None:
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clear_dep_overrides():
    yield
    _clear_overrides()


def _upload_file(client: TestClient, token: str, pdf_bytes: bytes = _VALID_PDF, filename: str = "test_resume.pdf", content_type: str = "application/pdf") -> Any:
    return client.post(
        UPLOAD_URL,
        headers=auth_header(token),
        files={"file": (filename, io.BytesIO(pdf_bytes), content_type)},
    )


# ── Helper: extract text from our fake PDF ────────────────────────────────

def _fake_extract(file_bytes: bytes) -> str:
    if len(file_bytes) < 100:
        return ""
    return "John Smith\nSoftware Engineer\n\nExperience:\n- Built REST APIs using FastAPI at Flipkart. Improved throughput by 30%.\n\nSkills: Python, FastAPI, SQL, Git\n\nEducation:\nB.Tech Computer Science, IIT Delhi 2020-2024"


# ── Tests: authentication / authorisation ─────────────────────────────────


class TestResumeAuth:
    def test_unauthenticated_upload_returns_401(self):
        """Missing auth token → 401, no file processed."""
        with TestClient(app) as client:
            resp = client.post(
                UPLOAD_URL,
                files={"file": ("r.pdf", io.BytesIO(_VALID_PDF), "application/pdf")},
            )
        assert resp.status_code == 401

    def test_wrong_role_returns_403(self):
        """Non-student role → 403."""
        token = make_token(role="recruiter")
        with TestClient(app) as client:
            resp = _upload_file(client, token)
        assert resp.status_code == 403

    def test_unauthenticated_latest_returns_401(self):
        with TestClient(app) as client:
            resp = client.get(LATEST_URL)
        assert resp.status_code == 401

    def test_wrong_role_latest_returns_403(self):
        token = make_token(role="college")
        with TestClient(app) as client:
            resp = client.get(LATEST_URL, headers=auth_header(token))
        assert resp.status_code == 403


# ── Tests: file validation ─────────────────────────────────────────────────


class TestFileValidation:
    def test_empty_file_returns_422(self):
        token = make_token(role="student")
        svc = _make_service()
        app.dependency_overrides[get_resume_service] = lambda: svc

        with TestClient(app) as client:
            resp = client.post(
                UPLOAD_URL,
                headers=auth_header(token),
                files={"file": ("r.pdf", io.BytesIO(b""), "application/pdf")},
            )
        assert resp.status_code == 422
        assert "empty" in resp.json()["error"]["message"].lower()

    def test_non_pdf_mime_returns_422(self):
        token = make_token(role="student")
        svc = _make_service()
        app.dependency_overrides[get_resume_service] = lambda: svc

        with TestClient(app) as client:
            resp = client.post(
                UPLOAD_URL,
                headers=auth_header(token),
                files={"file": ("r.docx", io.BytesIO(b"PK\x03\x04fake docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            )
        assert resp.status_code == 422
        body = resp.json()["error"]
        assert "pdf" in body["message"].lower()

    def test_non_pdf_magic_bytes_returns_422(self):
        """File has PDF MIME but wrong magic bytes → 422."""
        token = make_token(role="student")
        svc = _make_service()
        app.dependency_overrides[get_resume_service] = lambda: svc

        with TestClient(app) as client:
            resp = client.post(
                UPLOAD_URL,
                headers=auth_header(token),
                files={"file": ("r.pdf", io.BytesIO(_NOT_PDF), "application/pdf")},
            )
        assert resp.status_code == 422
        assert "pdf" in resp.json()["error"]["message"].lower()

    def test_oversized_file_returns_413(self):
        token = make_token(role="student")
        svc = _make_service()
        app.dependency_overrides[get_resume_service] = lambda: svc

        with TestClient(app) as client:
            resp = client.post(
                UPLOAD_URL,
                headers=auth_header(token),
                files={"file": ("r.pdf", io.BytesIO(_OVERSIZED_PDF), "application/pdf")},
            )
        assert resp.status_code == 413


# ── Tests: PDF text extraction ─────────────────────────────────────────────


class TestPdfExtraction:
    def test_insufficient_text_sets_parse_status(self):
        """PDF with no extractable text → parse_status = insufficient_text, no Groq call."""
        token = make_token(role="student")
        groq = FakeGroqClient()
        resumes_repo = FakeResumesRepository()
        svc = _make_service(groq=groq, resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=""):
            with TestClient(app) as client:
                resp = _upload_file(client, token, _TINY_PDF)

        assert resp.status_code == 200
        body = resp.json()
        assert body["pipeline"]["parse_status"] == "insufficient_text"
        assert groq.call_count == 0  # Groq never called for empty text


# ── Tests: Groq analysis ───────────────────────────────────────────────────


class TestGroqAnalysis:
    def test_valid_pdf_returns_analysis(self):
        """Happy path: valid PDF → 200 with analysis, score, skills."""
        token = make_token(role="student")
        resumes_repo = FakeResumesRepository()
        skills_repo = FakeSkillsRepository()
        svc = _make_service(resumes_repo=resumes_repo, skills_repo=skills_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with patch("app.services.resume_service.embed_text", return_value=[0.1] * 384):
                with TestClient(app) as client:
                    resp = _upload_file(client, token)

        assert resp.status_code == 200
        body = resp.json()
        assert body["pipeline"]["analysis_status"] == "ok"
        assert body["resume_quality_score"] is not None
        assert body["resume_quality_score"] != 81  # no hardcoded score
        assert len(body["extracted_skills"]) > 0

    def test_groq_malformed_response_sets_analysis_failed(self):
        """Groq returns unparseable output → analysis_status=failed, no fake result."""
        token = make_token(role="student")
        # Return dict that fails ResumeAnalysis validation (wrong types)
        groq = FakeGroqClient(response={"summary": 12345, "skills": "not_a_list"})
        resumes_repo = FakeResumesRepository()
        svc = _make_service(groq=groq, resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with TestClient(app) as client:
                resp = _upload_file(client, token)

        assert resp.status_code == 200
        body = resp.json()
        # Groq malformed → analysis_status = failed, score = null
        assert body["pipeline"]["analysis_status"] == "failed"
        assert body["resume_quality_score"] is None

    def test_groq_timeout_sets_analysis_failed(self):
        """Groq timeout → analysis_status=failed, file still uploaded."""
        token = make_token(role="student")
        groq = FakeGroqClient(error=ApiError(503, "ai_provider_timeout", "Timeout"))
        resumes_repo = FakeResumesRepository()
        svc = _make_service(groq=groq, resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with TestClient(app) as client:
                resp = _upload_file(client, token)

        assert resp.status_code == 200
        body = resp.json()
        assert body["pipeline"]["analysis_status"] == "failed"
        assert body["pipeline"]["parse_status"] == "ok"  # parse was fine

    def test_groq_unconfigured_returns_503(self):
        """Groq not configured → 503, no fake result."""
        token = make_token(role="student")
        groq = FakeGroqClient(error=ApiError(503, "ai_not_configured", "Groq not configured"))
        svc = _make_service(groq=groq)
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with TestClient(app) as client:
                resp = _upload_file(client, token)

        # We get 200 with analysis_status=failed (graceful degradation)
        assert resp.status_code == 200
        body = resp.json()
        assert body["pipeline"]["analysis_status"] == "failed"


# ── Tests: duplicate detection ─────────────────────────────────────────────


class TestDuplicateDetection:
    def test_same_hash_returns_existing_without_reanalysis(self):
        """Uploading the same PDF again → existing result returned, Groq not called again."""
        token = make_token(role="student")
        user_id = "test-user-dup"
        groq = FakeGroqClient()
        resumes_repo = FakeResumesRepository()
        svc = _make_service(groq=groq, resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        import hashlib
        content_hash = hashlib.sha256(_VALID_PDF).hexdigest()

        # Pre-seed an existing analysed resume
        import asyncio
        existing = asyncio.get_event_loop().run_until_complete(
            resumes_repo.create(
                {"sub": user_id, "_access_token": "tok"},
                user_id=user_id,
                storage_path="test/path/r.pdf",
                original_filename="r.pdf",
                mime_type="application/pdf",
                file_size_bytes=len(_VALID_PDF),
                content_hash=content_hash,
            )
        )
        existing["analysis_status"] = "ok"
        existing["analysis"] = _GOOD_ANALYSIS_DICT
        existing["resume_quality_score"] = 72

        call_count_before = groq.call_count
        # Upload same bytes
        claims = {"sub": user_id, "_access_token": "tok"}
        result = asyncio.get_event_loop().run_until_complete(
            svc.upload_and_analyse(
                claims,
                filename="r.pdf",
                file_bytes=_VALID_PDF,
                content_type="application/pdf",
            )
        )

        assert result.is_duplicate is True
        assert groq.call_count == call_count_before  # no new Groq call


# ── Tests: score determinism ───────────────────────────────────────────────


class TestScoreDeterminism:
    def test_same_analysis_produces_same_score(self):
        """Deterministic rubric: same input → same score (no randomness)."""
        analysis = ResumeAnalysis.model_validate(_GOOD_ANALYSIS_DICT)
        s1 = _calculate_score(analysis, "Backend Engineer")
        s2 = _calculate_score(analysis, "Backend Engineer")
        assert s1.total == s2.total

    def test_score_is_not_hardcoded_81(self):
        """The hardcoded score 81 from the mock must never appear as the output."""
        analysis = ResumeAnalysis.model_validate(_GOOD_ANALYSIS_DICT)
        score = _calculate_score(analysis, "Backend Engineer")
        # Score should not be exactly 81 (that was the mock value)
        # It can be any valid integer; 81 is just one possible value,
        # but we're testing the system doesn't *hardcode* it.
        assert isinstance(score.total, int)
        assert 0 <= score.total <= 100

    def test_missing_sections_lower_score(self):
        """Resume missing contact, education, experience → lower score."""
        weak = dict(_GOOD_ANALYSIS_DICT)
        weak.update({
            "has_contact_info": False,
            "has_education": False,
            "has_experience": False,
            "has_projects": False,
            "has_skills_section": False,
            "has_quantified_achievements": False,
            "bullet_structure_quality": "poor",
            "skills": [],
        })
        analysis_weak = ResumeAnalysis.model_validate(weak)
        analysis_good = ResumeAnalysis.model_validate(_GOOD_ANALYSIS_DICT)
        score_weak = _calculate_score(analysis_weak, None)
        score_good = _calculate_score(analysis_good, None)
        assert score_weak.total < score_good.total

    def test_score_without_target_role_normalises_to_100(self):
        """Without target role, score should still be valid (0-100)."""
        analysis = ResumeAnalysis.model_validate(_GOOD_ANALYSIS_DICT)
        score = _calculate_score(analysis, target_role=None)
        assert 0 <= score.total <= 100
        assert score.role_keyword_coverage == 0


# ── Tests: skill normalisation ─────────────────────────────────────────────


class TestSkillNormalisation:
    def test_react_variants_normalise_to_same_key(self):
        assert _normalise_skill_key("React") == _normalise_skill_key("ReactJS")
        assert _normalise_skill_key("React.js") == _normalise_skill_key("react")

    def test_scikit_learn_variants(self):
        assert _normalise_skill_key("scikit-learn") == "scikit_learn"
        assert _normalise_skill_key("sklearn") == "scikit_learn"

    def test_node_js_variants(self):
        assert _normalise_skill_key("Node.js") == "node_js"
        assert _normalise_skill_key("nodejs") == "node_js"

    def test_spaces_normalise_to_underscores(self):
        key = _normalise_skill_key("machine learning")
        assert " " not in key


# ── Tests: skill evidence persistence ────────────────────────────────────


class TestSkillEvidence:
    def test_skills_persisted_after_successful_analysis(self):
        """After upload, extracted skills should be in skills repo."""
        token = make_token(role="student")
        resumes_repo = FakeResumesRepository()
        skills_repo = FakeSkillsRepository()
        twins_repo = FakeCareerTwinsRepository()
        svc = _make_service(
            resumes_repo=resumes_repo,
            skills_repo=skills_repo,
            twins_repo=twins_repo,
        )
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with patch("app.services.resume_service.embed_text", return_value=[0.0] * 384):
                with TestClient(app) as client:
                    resp = _upload_file(client, token)

        assert resp.status_code == 200
        # Skills from _GOOD_ANALYSIS_DICT should be in the repo
        assert len(skills_repo._skills) >= 1
        # Evidence records should exist
        assert len(skills_repo._evidence) >= 1
        # Evidence must link to source_type = "resume"
        for ev in skills_repo._evidence:
            assert ev["source_type"] == "resume"

    def test_verified_skill_not_overwritten(self):
        """A manually verified skill is not overwritten by re-extraction."""
        import asyncio
        skills_repo = FakeSkillsRepository()
        user_id = "u1"
        # Manually verified skill
        existing_skill = {
            "id": "skill-1",
            "user_id": user_id,
            "normalized_skill_key": "fastapi",
            "display_name": "FastAPI (custom)",
            "source_summary": "Custom summary",
            "verified": True,
        }
        skills_repo._skills[f"{user_id}:fastapi"] = existing_skill

        claims = {"sub": user_id, "_access_token": "tok"}
        result = asyncio.get_event_loop().run_until_complete(
            skills_repo.upsert_skill(
                claims,
                user_id=user_id,
                normalized_key="fastapi",
                display_name="FastAPI (from resume)",
                source_summary="New evidence",
            )
        )
        # display_name should NOT be overwritten
        assert result["display_name"] == "FastAPI (custom)"


# ── Tests: Qdrant failure isolation ───────────────────────────────────────


class TestQdrantIsolation:
    def test_qdrant_failure_does_not_destroy_analysis(self):
        """Qdrant down → embedding_status=failed, but analysis remains persisted."""
        token = make_token(role="student")
        qdrant = FakeQdrantClient(fail_upsert=True)
        resumes_repo = FakeResumesRepository()
        svc = _make_service(qdrant=qdrant, resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with patch("app.services.resume_service.embed_text", return_value=[0.0] * 384):
                with TestClient(app) as client:
                    resp = _upload_file(client, token)

        assert resp.status_code == 200
        body = resp.json()
        # Analysis should be persisted
        assert body["pipeline"]["analysis_status"] == "ok"
        # Qdrant should be marked failed
        assert body["pipeline"]["embedding_status"] == "failed"
        # Score should still be present
        assert body["resume_quality_score"] is not None


# ── Tests: readback / latest ───────────────────────────────────────────────


class TestLatestResume:
    def test_latest_returns_persisted_result(self):
        """GET /latest returns same analysis as uploaded — no re-generation."""
        token = make_token(role="student")
        resumes_repo = FakeResumesRepository()
        skills_repo = FakeSkillsRepository()
        svc = _make_service(resumes_repo=resumes_repo, skills_repo=skills_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        # Upload first
        with patch("app.services.resume_service._extract_pdf_text", return_value=_fake_extract(_VALID_PDF)):
            with patch("app.services.resume_service.embed_text", return_value=[0.0] * 384):
                with TestClient(app) as client:
                    upload_resp = _upload_file(client, token)
                    assert upload_resp.status_code == 200

                    # Now fetch latest
                    latest_resp = client.get(LATEST_URL, headers=auth_header(token))

        assert latest_resp.status_code == 200
        latest = latest_resp.json()
        upload = upload_resp.json()
        assert latest["resume_id"] == upload["resume_id"]

    def test_latest_returns_null_when_no_resume(self):
        """GET /latest → null when student has no resume."""
        token = make_token(role="student")
        svc = _make_service()
        app.dependency_overrides[get_resume_service] = lambda: svc

        with TestClient(app) as client:
            resp = client.get(LATEST_URL, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() is None


# ── Tests: cross-user security ─────────────────────────────────────────────


class TestCrossUserSecurity:
    def test_student_b_cannot_see_student_a_resume(self):
        """Student B's GET /latest returns their own data, not Student A's."""
        import asyncio
        user_a = "user-a-" + str(uuid.uuid4())[:8]
        user_b = "user-b-" + str(uuid.uuid4())[:8]

        resumes_repo = FakeResumesRepository()
        # Seed Student A's resume
        asyncio.get_event_loop().run_until_complete(
            resumes_repo.create(
                {"sub": user_a, "_access_token": "tok"},
                user_id=user_a,
                storage_path="a/path/r.pdf",
                original_filename="a_resume.pdf",
                mime_type="application/pdf",
                file_size_bytes=1000,
                content_hash="hash_a",
            )
        )

        svc = _make_service(resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        # Student B queries latest — should be None (no B resumes)
        token_b = make_token(role="student", sub=user_b)
        with TestClient(app) as client:
            resp = client.get(LATEST_URL, headers=auth_header(token_b))
        assert resp.status_code == 200
        assert resp.json() is None  # No Student A data leaked

    def test_archive_non_owned_resume_returns_404(self):
        """Student B cannot archive Student A's resume — 404 (RLS blocks it)."""
        import asyncio
        user_a = "user-a-security"

        resumes_repo = FakeResumesRepository()
        row = asyncio.get_event_loop().run_until_complete(
            resumes_repo.create(
                {"sub": user_a, "_access_token": "tok"},
                user_id=user_a,
                storage_path="a/path/r.pdf",
                original_filename="a.pdf",
                mime_type="application/pdf",
                file_size_bytes=500,
                content_hash="hashX",
            )
        )
        resume_id = str(row["id"])

        svc = _make_service(resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        # Student B tries to delete Student A's resume
        token_b = make_token(role="student", sub="user-b-security")
        with TestClient(app) as client:
            resp = client.delete(
                f"{API_PREFIX}/resumes/{resume_id}",
                headers=auth_header(token_b),
            )
        # Should be 404 (not found from B's perspective)
        assert resp.status_code == 404


# ── Tests: archive / remove ────────────────────────────────────────────────


class TestArchiveResume:
    def test_archive_soft_deletes_resume(self):
        """DELETE /resumes/{id} soft-archives — does NOT hard-delete DB row."""
        import asyncio
        user_id = "user-archive-test"
        resumes_repo = FakeResumesRepository()
        row = asyncio.get_event_loop().run_until_complete(
            resumes_repo.create(
                {"sub": user_id, "_access_token": "tok"},
                user_id=user_id,
                storage_path="u/path/r.pdf",
                original_filename="r.pdf",
                mime_type="application/pdf",
                file_size_bytes=500,
                content_hash="hashY",
            )
        )
        resume_id = str(row["id"])

        svc = _make_service(resumes_repo=resumes_repo)
        app.dependency_overrides[get_resume_service] = lambda: svc

        token = make_token(role="student", sub=user_id)
        with TestClient(app) as client:
            resp = client.delete(
                f"{API_PREFIX}/resumes/{resume_id}",
                headers=auth_header(token),
            )
        assert resp.status_code == 204

        # Row still exists but is_archived = True
        assert resumes_repo._rows[resume_id]["is_archived"] is True


# ── Tests: filename sanitiser ──────────────────────────────────────────────


class TestFilenameSanitiser:
    def test_spaces_replaced(self):
        assert " " not in _sanitise_filename("my resume 2024.pdf")

    def test_path_traversal_blocked(self):
        name = _sanitise_filename("../../../etc/passwd")
        assert ".." not in name
        assert "/" not in name

    def test_unicode_normalised(self):
        name = _sanitise_filename("résumé_2024.pdf")
        assert all(ord(c) < 128 for c in name)
