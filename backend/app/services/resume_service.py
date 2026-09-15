"""Resume Intelligence service — orchestrates the full ingestion pipeline.

Pipeline (each step tracked independently):

    1.  Validate student identity (role guard done at route level)
    2.  Validate uploaded file (MIME, size, not empty)
    3.  Compute SHA-256 content hash
    4.  Check duplicate (same hash → return existing, skip expensive AI)
    5.  Create resume DB row (pending statuses)
    6.  Upload file to private Supabase Storage bucket
    7.  Extract text (pypdf)  → update parse_status
    8.  Call Resume Agent (Groq structured analysis) → update analysis_status
    9.  Run deterministic score rubric v1
   10.  Persist analysis + score → update analysis_status = ok
   11.  Upsert normalized skills + skill evidence
   12.  Build embedding text + generate vector (FastEmbed)
   13.  Upsert vector into Qdrant → update embedding_status
   14.  Best-effort: mark existing Career Twin as stale
   15.  Return the persisted resume response

Failure isolation:
    - Qdrant failure (step 13) does NOT destroy the analysis (steps 8-11)
    - Groq failure → analysis_status = failed, parse_status preserved
    - PDF parse failure → parse_status = failed, upload preserved

Security:
    - user_id always from verified JWT claims (never from request body)
    - No raw PDF content in logs
    - No API tokens in logs
    - extracted_text stored in DB for reanalysis but never returned in API response
"""

from __future__ import annotations

import hashlib
import io
import logging
import re
import unicodedata
from typing import Any

from app.agents.resume_agent import ResumeAgent
from app.core.errors import ApiError
from app.integrations.embeddings import build_resume_embed_text, embed_text
from app.integrations.groq import GroqClient
from app.integrations.qdrant_client import QdrantIntegration
from app.integrations.storage import StorageClient
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.resumes import ResumesRepository
from app.repositories.skills import SkillsRepository
from app.schemas.resume import (
    PipelineStatus,
    ResumeAnalysis,
    ResumeLatestResponse,
    ResumeListItem,
    ResumeUploadResponse,
    ScoreBreakdown,
    SkillExtracted,
)

logger = logging.getLogger("careeros.resume_service")

# ── Constants ─────────────────────────────────────────────────────────────

MAX_FILE_MB = 10
MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024
ALLOWED_MIME_TYPES = {"application/pdf"}
PDF_MAGIC_BYTES = b"%PDF"
MIN_EXTRACTABLE_CHARS = 50
SCORE_VERSION = "resume_score_v1"
MODEL_PROVIDER = "groq"
PROMPT_VERSION = "v1"


# ── Scoring rubric (deterministic — no LLM for final number) ──────────────

def _calculate_score(analysis: ResumeAnalysis, target_role: str | None) -> ScoreBreakdown:
    """Deterministic Resume Quality Score — v1 rubric.

    Groq extracts the evidence signals. This function calculates the score.
    Score is CareerOS's quality assessment, NOT an employer ATS prediction.

    Component weights:
        parseability            10
        contact_completeness    10
        education_present       10
        experience_clarity      15
        quantified_impact       15
        skill_evidence_coverage 15
        certifications_strength 10
        role_keyword_coverage   15 (only when target role available)

    When no target role: redistribute 15 pts proportionally across others.
    """
    b = ScoreBreakdown()

    # 1. Parseability — always 10 (we got here, text was extracted)
    b.parseability = 10

    # 2. Contact completeness
    b.contact_completeness = 10 if analysis.has_contact_info else 0

    # 3. Education present
    b.education_present = 10 if analysis.has_education else 0

    # 4. Experience clarity (experience OR projects)
    if analysis.has_experience and analysis.has_projects:
        b.experience_clarity = 15
    elif analysis.has_experience or analysis.has_projects:
        b.experience_clarity = 10
    else:
        b.experience_clarity = 0

    # Adjust for bullet quality
    if analysis.bullet_structure_quality == "poor" and b.experience_clarity > 0:
        b.experience_clarity = max(0, b.experience_clarity - 5)
    elif analysis.bullet_structure_quality == "partial" and b.experience_clarity > 0:
        b.experience_clarity = max(0, b.experience_clarity - 2)

    # 5. Quantified impact
    b.quantified_impact = 15 if analysis.has_quantified_achievements else 3

    # 6. Skill evidence coverage
    num_skills = len(analysis.skills)
    if num_skills >= 8:
        b.skill_evidence_coverage = 15
    elif num_skills >= 4:
        b.skill_evidence_coverage = 10
    elif num_skills >= 1:
        b.skill_evidence_coverage = 5
    else:
        b.skill_evidence_coverage = 0

    # 7. Certifications
    b.certifications_strength = 10 if analysis.has_certifications else 0

    # 8. Role keyword coverage (only when target role provided)
    if target_role:
        found = len(analysis.role_keywords_found)
        missing = len(analysis.role_keywords_missing)
        total = found + missing
        if total > 0:
            ratio = found / total
            b.role_keyword_coverage = round(ratio * 15)
        else:
            b.role_keyword_coverage = 8  # no keywords specified = neutral
    else:
        # No target role — redistribute 15 pts proportionally
        base_total = (
            b.parseability + b.contact_completeness + b.education_present
            + b.experience_clarity + b.quantified_impact
            + b.skill_evidence_coverage + b.certifications_strength
        )
        if base_total > 0:
            # Scale all components to sum to 100
            scale = 100 / 85  # 85 is max without role component
            b.parseability = round(b.parseability * scale)
            b.contact_completeness = round(b.contact_completeness * scale)
            b.education_present = round(b.education_present * scale)
            b.experience_clarity = round(b.experience_clarity * scale)
            b.quantified_impact = round(b.quantified_impact * scale)
            b.skill_evidence_coverage = round(b.skill_evidence_coverage * scale)
            b.certifications_strength = round(b.certifications_strength * scale)
        b.role_keyword_coverage = 0

    b.total = (
        b.parseability
        + b.contact_completeness
        + b.education_present
        + b.experience_clarity
        + b.quantified_impact
        + b.skill_evidence_coverage
        + b.certifications_strength
        + b.role_keyword_coverage
    )
    b.total = min(100, max(0, b.total))
    return b


# ── Filename sanitiser ─────────────────────────────────────────────────────

def _sanitise_filename(name: str) -> str:
    """Produce a safe, deterministic storage filename."""
    # Normalise unicode
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    # Replace unsafe chars
    name = re.sub(r"[^\w.\-]", "_", name)
    # Collapse multiple underscores / dots
    name = re.sub(r"_+", "_", name)
    name = re.sub(r"\.+", ".", name)
    name = name.strip("._")
    return name[:120] or "resume.pdf"


# ── PDF text extractor ────────────────────────────────────────────────────

def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pypdf.

    Returns empty string if text is unextractable (image-only PDF).
    Never raises — caller checks for insufficient text.
    """
    try:
        import pypdf  # type: ignore

        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        parts: list[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                parts.append(text)
        return "\n".join(parts)
    except Exception as exc:
        logger.warning("pdf_extraction_error error=%s", type(exc).__name__)
        return ""


# ── Skill normaliser ──────────────────────────────────────────────────────

_NORMALISE_MAP: dict[str, str] = {
    "reactjs": "react",
    "react.js": "react",
    "vuejs": "vue",
    "vue.js": "vue",
    "nodejs": "node_js",
    "node.js": "node_js",
    "expressjs": "express",
    "express.js": "express",
    "scikit learn": "scikit_learn",
    "scikit-learn": "scikit_learn",
    "sklearn": "scikit_learn",
    "tensorflow": "tensorflow",
    "tf": "tensorflow",
    "pytorch": "pytorch",
    "py torch": "pytorch",
    "hugging face": "hugging_face",
    "huggingface": "hugging_face",
    "aws": "aws",
    "amazon web services": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "azure": "azure",
    "microsoft azure": "azure",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "mongodb": "mongodb",
    "mongo": "mongodb",
    "fastapi": "fastapi",
    "fast api": "fastapi",
    "django rest framework": "django_rest_framework",
    "drf": "django_rest_framework",
}


def _normalise_skill_key(name: str) -> str:
    lower = name.lower().strip()
    if lower in _NORMALISE_MAP:
        return _NORMALISE_MAP[lower]
    # Generic: lowercase, replace space/hyphen/dot with underscore
    key = re.sub(r"[\s\-\.]+", "_", lower)
    key = re.sub(r"[^\w]", "", key)
    return key or "unknown_skill"


# ── Service ────────────────────────────────────────────────────────────────


class ResumeService:
    """Orchestrates the resume intelligence pipeline.

    Route handlers stay thin — all logic lives here.
    """

    def __init__(
        self,
        groq_client: GroqClient,
        storage_client: StorageClient,
        qdrant: QdrantIntegration,
        resumes_repo: ResumesRepository,
        skills_repo: SkillsRepository,
        twins_repo: CareerTwinsRepository,
        *,
        resume_bucket: str = "resumes",
    ) -> None:
        self._groq = groq_client
        self._storage = storage_client
        self._qdrant = qdrant
        self._resumes = resumes_repo
        self._skills = skills_repo
        self._twins = twins_repo
        self._bucket = resume_bucket
        self._agent = ResumeAgent(groq_client)

    # ── Public: upload ────────────────────────────────────────────────────

    async def upload_and_analyse(
        self,
        claims: dict[str, Any],
        *,
        filename: str,
        file_bytes: bytes,
        content_type: str,
        target_role: str | None = None,
    ) -> ResumeUploadResponse:
        """Full pipeline: validate → store → extract → analyse → embed → index."""
        user_id = str(claims["sub"])
        access_token = str(claims.get("_access_token", ""))
        enriched = {**claims, "_access_token": access_token}

        # Step 1: Validate file
        self._validate_file(filename, file_bytes, content_type)

        # Step 2: Content hash + duplicate detection
        content_hash = hashlib.sha256(file_bytes).hexdigest()
        existing = await self._resumes.get_by_hash(enriched, user_id, content_hash)
        if existing and existing.get("analysis_status") == "ok":
            logger.info("resume_duplicate_detected user_id=<redacted>")
            return self._build_response(existing, is_duplicate=True)

        # Step 3: Determine version
        version = 1
        if existing:
            version = int(existing.get("version", 1)) + 1

        # Step 4: Create DB row (pending states)
        safe_filename = _sanitise_filename(filename)
        # Placeholder — real path set after we have resume_id
        row = await self._resumes.create(
            enriched,
            user_id=user_id,
            storage_path="pending",
            original_filename=filename[:255],
            mime_type=content_type,
            file_size_bytes=len(file_bytes),
            content_hash=content_hash,
            version=version,
        )
        if not row:
            raise ApiError(500, "resume_create_failed", "Failed to create resume record.")

        resume_id = str(row["id"])

        # Step 5: Upload to Supabase Storage
        storage_path = f"{user_id}/{resume_id}/{safe_filename}"
        try:
            await self._storage.upload_file(
                self._bucket,
                storage_path,
                file_bytes,
                content_type="application/pdf",
            )
            # Update storage_path in DB
            await self._resumes.update_analysis(
                enriched, resume_id,
                analysis={},
                analysis_status="pending",
                resume_quality_score=None,
                score_version=None,
                score_breakdown=None,
                model_provider="",
                model_name="",
                prompt_version="",
            )
            # Update storage_path in DB
            await self._resumes.update_storage_path(enriched, resume_id, storage_path=storage_path)
        except ApiError:
            raise

        # Step 6: Extract text
        extracted_text = _extract_pdf_text(file_bytes)
        char_count = len(extracted_text.strip())

        if char_count < MIN_EXTRACTABLE_CHARS:
            await self._resumes.update_parse_status(
                enriched, resume_id,
                status="insufficient_text",
                extracted_data={"char_count": char_count},
            )
            row_updated = await self._resumes.get_by_id(enriched, resume_id)
            return self._build_response(
                row_updated or row,
                status_message="PDF text is insufficient for analysis. Please upload a text-extractable PDF (not a scanned image).",
            )

        await self._resumes.update_parse_status(
            enriched, resume_id,
            status="ok",
            extracted_data={"char_count": char_count, "pages_estimated": char_count // 500 + 1},
        )
        # Store extracted_text separately (large field)
        await self._resumes.update_extracted_text(enriched, resume_id, extracted_text=extracted_text)

        # Step 7: Groq analysis
        analysis: ResumeAnalysis | None = None
        try:
            analysis = await self._agent.analyse(
                extracted_text=extracted_text,
                target_role=target_role,
            )
        except ApiError as exc:
            await self._resumes.update_analysis(
                enriched, resume_id,
                analysis={"error": exc.message},
                analysis_status="failed",
                resume_quality_score=None,
                score_version=None,
                score_breakdown=None,
                model_provider=MODEL_PROVIDER,
                model_name=self._groq._model() if hasattr(self._groq, "_model") else "",
                prompt_version=PROMPT_VERSION,
            )
            row_failed = await self._resumes.get_by_id(enriched, resume_id)
            return self._build_response(
                row_failed or row,
                status_message=f"AI analysis failed: {exc.message}. Your resume was saved — you can retry analysis later.",
            )

        # Step 8: Deterministic score
        score_breakdown = _calculate_score(analysis, target_role)

        # Step 9: Persist analysis
        model_name = self._groq._model() if hasattr(self._groq, "_model") else "llama-3.3-70b-versatile"
        await self._resumes.update_analysis(
            enriched, resume_id,
            analysis=analysis.model_dump(),
            analysis_status="ok",
            resume_quality_score=score_breakdown.total,
            score_version=SCORE_VERSION,
            score_breakdown=score_breakdown.model_dump(),
            model_provider=MODEL_PROVIDER,
            model_name=model_name,
            prompt_version=PROMPT_VERSION,
        )

        # Step 10: Persist skills + evidence
        await self._persist_skills(enriched, user_id, resume_id, analysis)

        # Step 11: Generate embedding + index Qdrant
        embed_status = "pending"
        try:
            embed_text_content = build_resume_embed_text(
                analysis.model_dump(), target_role=target_role
            )
            vector = embed_text(embed_text_content)

            await self._qdrant.upsert_resume(
                resume_id=resume_id,
                user_id=user_id,
                resume_version=version,
                vector=vector,
                target_role=target_role,
                created_at=str(row.get("created_at", "")),
            )
            embed_status = "ok"
        except ApiError as exc:
            logger.warning(
                "resume_embedding_failed resume_id=<redacted> error=%s", exc.code
            )
            embed_status = "failed"
        except Exception as exc:
            logger.warning("resume_embedding_unexpected error=%s", repr(exc))
            embed_status = "failed"

        await self._resumes.update_embedding_status(enriched, resume_id, status=embed_status)

        # Step 12: Best-effort Career Twin staleness
        await self._mark_twin_stale(enriched, user_id)

        # Step 13: Fetch final row and return
        final_row = await self._resumes.get_by_id(enriched, resume_id)
        status_msg = ""
        if embed_status == "failed":
            status_msg = "Resume analysed successfully. Vector search indexing is pending — it will be retried automatically."

        return self._build_response(final_row or row, analysis=analysis, score_breakdown=score_breakdown, status_message=status_msg)

    # ── Public: get latest ────────────────────────────────────────────────

    async def get_latest(
        self,
        claims: dict[str, Any],
    ) -> ResumeLatestResponse | None:
        """Return the latest persisted resume without re-running analysis."""
        user_id = str(claims["sub"])
        access_token = str(claims.get("_access_token", ""))
        enriched = {**claims, "_access_token": access_token}

        row = await self._resumes.get_latest(enriched, user_id)
        if row is None:
            return None
        return self._build_response(row)  # type: ignore[return-value]

    # ── Public: list ──────────────────────────────────────────────────────

    async def list_resumes(
        self,
        claims: dict[str, Any],
    ) -> list[ResumeListItem]:
        user_id = str(claims["sub"])
        access_token = str(claims.get("_access_token", ""))
        enriched = {**claims, "_access_token": access_token}

        rows = await self._resumes.list_resumes(enriched, user_id)
        return [
            ResumeListItem(
                resume_id=str(r.get("id", "")),
                original_filename=r.get("original_filename", ""),
                file_size_bytes=int(r.get("file_size_bytes", 0)),
                version=int(r.get("version", 1)),
                parse_status=r.get("parse_status", ""),
                analysis_status=r.get("analysis_status", ""),
                embedding_status=r.get("embedding_status", ""),
                resume_quality_score=r.get("resume_quality_score"),
                is_archived=bool(r.get("is_archived", False)),
                created_at=str(r.get("created_at", "")),
            )
            for r in rows
        ]

    # ── Public: archive ───────────────────────────────────────────────────

    async def archive_resume(
        self,
        claims: dict[str, Any],
        resume_id: str,
    ) -> None:
        """Soft-delete a resume. Preserves evidence for downstream phases."""
        user_id = str(claims["sub"])
        access_token = str(claims.get("_access_token", ""))
        enriched = {**claims, "_access_token": access_token}

        # Verify ownership via RLS (PostgREST will reject cross-user)
        row = await self._resumes.get_by_id(enriched, resume_id)
        if not row:
            raise ApiError(404, "resume_not_found", "Resume not found.")

        await self._resumes.archive(enriched, resume_id)

        # Best-effort: delete from Qdrant (not critical)
        try:
            if self._qdrant.is_configured:
                await self._qdrant.delete_resume(resume_id)
        except Exception:
            pass

    # ── Public: reanalyse ─────────────────────────────────────────────────

    async def reanalyse(
        self,
        claims: dict[str, Any],
        resume_id: str,
        target_role: str | None = None,
    ) -> ResumeUploadResponse:
        """Re-run the analysis pipeline on an existing resume."""
        user_id = str(claims["sub"])
        access_token = str(claims.get("_access_token", ""))
        enriched = {**claims, "_access_token": access_token}

        row = await self._resumes.get_by_id(enriched, resume_id)
        if not row:
            raise ApiError(404, "resume_not_found", "Resume not found.")

        # Get extracted_text from DB
        extracted_text = await self._resumes.get_extracted_text(enriched, resume_id)

        if not extracted_text or len(extracted_text.strip()) < MIN_EXTRACTABLE_CHARS:
            raise ApiError(
                422,
                "resume_text_insufficient",
                "Stored resume text is insufficient to reanalyse. Please upload a new resume.",
            )

        # Groq analysis
        try:
            analysis = await self._agent.analyse(
                extracted_text=extracted_text,
                target_role=target_role,
            )
        except ApiError as exc:
            await self._resumes.update_analysis(
                enriched, resume_id,
                analysis={"error": exc.message},
                analysis_status="failed",
                resume_quality_score=None,
                score_version=None,
                score_breakdown=None,
                model_provider=MODEL_PROVIDER,
                model_name="",
                prompt_version=PROMPT_VERSION,
            )
            raise

        score_breakdown = _calculate_score(analysis, target_role)
        model_name = self._groq._model() if hasattr(self._groq, "_model") else "llama-3.3-70b-versatile"

        await self._resumes.update_analysis(
            enriched, resume_id,
            analysis=analysis.model_dump(),
            analysis_status="ok",
            resume_quality_score=score_breakdown.total,
            score_version=SCORE_VERSION,
            score_breakdown=score_breakdown.model_dump(),
            model_provider=MODEL_PROVIDER,
            model_name=model_name,
            prompt_version=PROMPT_VERSION,
        )

        await self._persist_skills(enriched, user_id, resume_id, analysis)

        # Re-embed
        embed_status = "pending"
        try:
            embed_text_content = build_resume_embed_text(
                analysis.model_dump(), target_role=target_role
            )
            vector = embed_text(embed_text_content)
            version = int(row.get("version", 1))
            await self._qdrant.upsert_resume(
                resume_id=resume_id,
                user_id=user_id,
                resume_version=version,
                vector=vector,
                target_role=target_role,
            )
            embed_status = "ok"
        except Exception as exc:
            logger.warning("reanalyse_embed_failed error=%s", repr(exc))
            embed_status = "failed"

        await self._resumes.update_embedding_status(enriched, resume_id, status=embed_status)
        await self._mark_twin_stale(enriched, user_id)

        final_row = await self._resumes.get_by_id(enriched, resume_id)
        return self._build_response(final_row or row, analysis=analysis, score_breakdown=score_breakdown)

    # ── Private helpers ───────────────────────────────────────────────────

    def _validate_file(
        self, filename: str, file_bytes: bytes, content_type: str
    ) -> None:
        """Validate uploaded file. Raises ApiError on any violation."""
        # Size check
        if not file_bytes:
            raise ApiError(422, "empty_file", "The uploaded file is empty.")
        if len(file_bytes) > MAX_FILE_BYTES:
            raise ApiError(
                413,
                "file_too_large",
                f"File exceeds the maximum size of {MAX_FILE_MB} MB.",
            )

        # MIME type check (do not trust filename extension alone)
        norm_ct = (content_type or "").lower().split(";")[0].strip()
        if norm_ct not in ALLOWED_MIME_TYPES:
            raise ApiError(
                422,
                "unsupported_file_type",
                "Only PDF files are accepted for resume upload.",
            )

        # PDF magic bytes signature check
        if not file_bytes.startswith(PDF_MAGIC_BYTES):
            raise ApiError(
                422,
                "invalid_pdf",
                "The uploaded file does not appear to be a valid PDF.",
            )

    async def _persist_skills(
        self,
        enriched_claims: dict[str, Any],
        user_id: str,
        resume_id: str,
        analysis: ResumeAnalysis,
    ) -> None:
        """Upsert extracted skills and create evidence records."""
        seen_keys: set[str] = set()

        for skill_data in analysis.skills:
            norm_key = _normalise_skill_key(skill_data.name)
            if norm_key in seen_keys:
                continue
            seen_keys.add(norm_key)

            try:
                skill_row = await self._skills.upsert_skill(
                    enriched_claims,
                    user_id=user_id,
                    normalized_key=norm_key,
                    display_name=skill_data.name,
                    source_summary=skill_data.evidence[:200],
                )
                if skill_row and skill_row.get("id"):
                    await self._skills.create_skill_evidence(
                        enriched_claims,
                        user_id=user_id,
                        skill_id=str(skill_row["id"]),
                        source_type="resume",
                        source_id=resume_id,
                        evidence_text=skill_data.evidence,
                    )
            except Exception as exc:
                logger.warning(
                    "skill_persist_failed skill=<redacted> error=%s", type(exc).__name__
                )

    async def _mark_twin_stale(
        self,
        enriched_claims: dict[str, Any],
        user_id: str,
    ) -> None:
        """Best-effort: mark the latest Career Twin as stale after new resume."""
        try:
            existing_twin = await self._twins.get_latest(enriched_claims, user_id)
            if existing_twin and existing_twin.get("id"):
                twin_id = str(existing_twin["id"])
                if existing_twin.get("status") != "stale":
                    await self._twins.mark_stale(enriched_claims, twin_id)
                    logger.info("career_twin_marked_stale twin_id=<redacted>")
        except Exception as exc:
            logger.warning(
                "twin_staleness_mark_failed error=%s", type(exc).__name__
            )

    def _build_response(
        self,
        row: dict[str, Any],
        *,
        analysis: ResumeAnalysis | None = None,
        score_breakdown: ScoreBreakdown | None = None,
        is_duplicate: bool = False,
        status_message: str = "",
    ) -> ResumeUploadResponse:
        """Build a unified response from a DB row."""
        # Re-parse analysis from row if not provided
        if analysis is None:
            raw_analysis = row.get("analysis")
            if raw_analysis and isinstance(raw_analysis, dict) and raw_analysis:
                try:
                    analysis = ResumeAnalysis.model_validate(raw_analysis)
                except Exception:
                    analysis = None

        # Re-parse score breakdown from row if not provided
        if score_breakdown is None:
            raw_breakdown = row.get("score_breakdown")
            if raw_breakdown and isinstance(raw_breakdown, dict) and raw_breakdown:
                try:
                    score_breakdown = ScoreBreakdown.model_validate(raw_breakdown)
                except Exception:
                    score_breakdown = None

        skills = analysis.skills if analysis else []

        return ResumeUploadResponse(
            resume_id=str(row.get("id", "")),
            original_filename=str(row.get("original_filename", "")),
            file_size_bytes=int(row.get("file_size_bytes", 0)),
            version=int(row.get("version", 1)),
            is_duplicate=is_duplicate,
            pipeline=PipelineStatus(
                parse_status=row.get("parse_status", "pending"),
                analysis_status=row.get("analysis_status", "pending"),
                embedding_status=row.get("embedding_status", "pending"),
            ),
            analysis=analysis,
            resume_quality_score=row.get("resume_quality_score"),
            score_version=row.get("score_version"),
            score_breakdown=score_breakdown,
            extracted_skills=skills,
            status_message=status_message,
            created_at=str(row.get("created_at", "")),
            updated_at=str(row.get("updated_at", "")),
        )
