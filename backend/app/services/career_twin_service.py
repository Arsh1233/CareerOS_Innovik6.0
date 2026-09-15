"""Business logic for Career Twin generation and retrieval.

Routes stay thin.  The service orchestrates:
1. Verify student role
2. Obtain authenticated profile
3. Collect available evidence
4. Determine target role
5. Build evidence snapshot
6. Invoke Career Twin agent
7. Validate output
8. Persist result
9. Return persisted result

Do not put business logic in the route handler.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.career_twin import (
    CareerTwinGenerateRequest,
    CareerTwinResponse,
    CareerTwinResult,
    EvidenceSnapshot,
)

logger = logging.getLogger("careeros.career_twin_service")

MODEL_PROVIDER = "groq"
MODEL_VERSION = "v1"
PROMPT_VERSION = "v1"


class CareerTwinService:
    """Orchestrates Career Twin generation, validation, and persistence."""

    def __init__(
        self,
        groq_client: GroqClient,
        profiles_repo: ProfilesRepository,
        twins_repo: CareerTwinsRepository,
    ) -> None:
        self._groq = groq_client
        self._profiles = profiles_repo
        self._twins = twins_repo

    async def generate(
        self,
        claims: dict[str, Any],
        access_token: str,
        request: CareerTwinGenerateRequest,
    ) -> CareerTwinResponse:
        """Generate a new Career Twin for the authenticated student.

        Flow: profile → evidence → agent → validation → persistence → response.
        """
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        # 1. Fetch the user's profile to build evidence.
        profile_row = await self._profiles.get_by_user_id(enriched_claims, user_id)
        if profile_row is None:
            raise ApiError(
                400,
                "profile_required",
                "A profile is required to generate a Career Twin. Please complete your profile first.",
            )

        # 2. Determine target role (request override → profile value → None).
        target_role = (
            request.target_role
            or profile_row.get("target_role_name")
            or None
        )

        # 3. Build evidence snapshot from profile.
        evidence = EvidenceSnapshot(
            target_role=target_role,
            education=profile_row.get("education") or [],
            experience=profile_row.get("experience") or [],
            skills=[],  # No skills module yet — populated from profile interests as proxy
            interests=profile_row.get("interests") or [],
            timeframe_years=profile_row.get("timeframe_years"),
            location=profile_row.get("location"),
        )

        # 4. Check if a recent twin exists with the same evidence version.
        existing = await self._twins.get_latest(enriched_claims, user_id)
        existing_version = None
        if existing:
            existing_version = existing.get("input_version")

        evidence_version = evidence.compute_version()
        if existing_version is not None and existing_version == evidence_version:
            # Same evidence — return the existing twin instead of regenerating.
            return self._build_response(existing, is_stale=False)

        # 5. Invoke the Career Twin agent.
        try:
            result = await self._groq.generate_structured(
                system_prompt=_SYSTEM_PROMPT,
                user_prompt=_build_user_prompt(evidence),
                temperature=0.3,
                max_tokens=4096,
            )
        except ApiError:
            raise  # Provider errors propagate directly.

        # 6. Validate with Pydantic.
        try:
            twin_result = CareerTwinResult.model_validate(result)
        except Exception as exc:
            logger.error("career_twin_validation_error error=%s", type(exc).__name__)
            raise ApiError(
                502,
                "ai_malformed_output",
                "The AI provider returned a response that could not be validated.",
            ) from exc

        # 7. Mark old twin as stale if one exists.
        if existing and existing.get("id"):
            try:
                await self._twins.mark_stale(enriched_claims, str(existing["id"]))
            except Exception:
                logger.warning("failed_to_mark_stale twin_id=%s", existing.get("id"))

        # 8. Persist the new result.
        now = datetime.now(timezone.utc)
        persisted = await self._twins.create(
            enriched_claims,
            user_id=user_id,
            target_role=target_role,
            input_version=evidence_version,
            model_provider=MODEL_PROVIDER,
            model_name=twin_result.model or "llama-3.3-70b-versatile",
            prompt_version=PROMPT_VERSION,
            evidence_snapshot=evidence.model_dump(),
            result=twin_result.model_dump(),
            status="generated",
        )

        twin_id = str(persisted["id"]) if persisted else None

        # 9. Return the persisted result.
        return CareerTwinResponse(
            result=twin_result,
            twin_id=twin_id,
            is_stale=False,
            generated_at=now,
        )

    async def get_latest(
        self,
        claims: dict[str, Any],
        access_token: str,
    ) -> CareerTwinResponse | None:
        """Retrieve the latest persisted Career Twin for the user.

        Does NOT generate a new one — generation is an explicit action.
        """
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        existing = await self._twins.get_latest(enriched_claims, user_id)
        if existing is None:
            return None

        return self._build_response(existing)

    def _build_response(
        self,
        row: dict[str, Any],
        *,
        is_stale: bool = False,
    ) -> CareerTwinResponse:
        """Build a CareerTwinResponse from a persisted database row."""
        result_data = row.get("result", {})
        if isinstance(result_data, str):
            import json
            result_data = json.loads(result_data)

        twin_result = CareerTwinResult.model_validate(result_data)
        twin_result.generated_at = row.get("created_at")
        twin_result.model = row.get("model_name")

        return CareerTwinResponse(
            result=twin_result,
            twin_id=str(row.get("id")) if row.get("id") else None,
            is_stale=is_stale or row.get("status") == "stale",
            generated_at=row.get("created_at"),
        )


# ── System prompt (shared with agent) ─────────────────────────────────────

_SYSTEM_PROMPT = """\
You are CareerOS Career Twin — an AI career intelligence agent.

Your job is to analyse a student's currently available career evidence and
produce a structured career twin analysis.  You are NOT a prediction engine.

## STRICT RULES — Never Violate

1. NEVER fabricate: guaranteed salaries, hiring probabilities, placement
   probabilities, arbitrary readiness percentages, or confidence scores.
2. NEVER invent credentials, skills, projects, or experience not in the evidence.
3. NEVER promise hiring outcomes or interview success.
4. Distinguish between what is KNOWN from evidence vs what is INFERRED.
5. When evidence is insufficient, say so explicitly — use "insufficient_data"
   or "more career evidence required" rather than guessing.
6. NEVER present an LLM-generated percentage as a scientifically validated
   probability.
7. If there is insufficient evidence for a section, return an empty list
   or a note explaining the gap — do NOT fabricate entries.

## Output Format

Return a JSON object matching this exact structure:
{
  "target_role": "string or null",
  "summary": "2-3 sentence honest summary of the career position",
  "current_position": {
    "education_context": "string summarizing education from evidence",
    "relevant_experience": "string summarizing experience from evidence",
    "known_skills": "string summarizing skills from evidence"
  },
  "strengths": [
    {
      "title": "short title",
      "evidence": "what evidence supports this strength",
      "relevance": "why this matters for the target role"
    }
  ],
  "gaps": [
    {
      "skill_or_capability": "what is missing",
      "reason": "why this matters for the target role",
      "priority": "critical or recommended or nice_to_have",
      "evidence_state": "missing or partial or insufficient"
    }
  ],
  "trajectory": [
    {
      "stage": "career stage name",
      "goal": "what this stage achieves",
      "capabilities_to_build": ["skill1", "skill2"],
      "recommended_actions": ["action1", "action2"]
    }
  ],
  "next_actions": [
    {
      "title": "action title",
      "reason": "why this action",
      "destination": "internal CareerOS route like /skills, /roadmap, /resume"
    }
  ],
  "evidence_coverage": 0.0 to 1.0,
  "evidence_quality": "sufficient or partial or insufficient"
}

## Evidence Coverage

evidence_coverage = (number of non-empty evidence fields) / (total expected fields)
Expected fields: education, experience, skills, interests, target_role

## Internal Routes

When suggesting next_actions with destinations, use only these valid CareerOS routes:
- /skills — Skill gap analysis
- /roadmap — Learning roadmap
- /mentor — ARIA career mentor chat
- /resume — Resume improvement
- /jobs — Job recommendations

## Tone

Be honest, constructive, and specific.  Prefer actionable advice over
vague encouragement.  If the student has minimal evidence, focus on
what they can do to build a stronger career profile.
"""


def _build_user_prompt(evidence: EvidenceSnapshot) -> str:
    """Build the user prompt from the evidence snapshot."""
    parts = [
        "Analyse this student's career evidence and produce a Career Twin.",
        "",
    ]

    if evidence.target_role:
        parts.append(f"Target Role: {evidence.target_role}")
    else:
        parts.append("Target Role: Not specified — suggest based on available evidence.")

    parts.append("")

    if evidence.education:
        parts.append("Education:")
        for edu in evidence.education:
            degree = edu.get("degree", "")
            institution = edu.get("institution", "")
            start = edu.get("start_year", "")
            end = edu.get("end_year", "")
            parts.append(f"  - {degree} from {institution} ({start}-{end})")
    else:
        parts.append("Education: Not provided")

    parts.append("")

    if evidence.experience:
        parts.append("Experience:")
        for exp in evidence.experience:
            title = exp.get("title", "")
            org = exp.get("organization", "")
            desc = exp.get("description", "")
            parts.append(f"  - {title} at {org}")
            if desc:
                parts.append(f"    {desc}")
    else:
        parts.append("Experience: Not provided")

    parts.append("")

    if evidence.skills:
        parts.append(f"Known Skills: {', '.join(evidence.skills)}")
    else:
        parts.append("Known Skills: Not provided")

    parts.append("")

    if evidence.interests:
        parts.append(f"Interests: {', '.join(evidence.interests)}")
    else:
        parts.append("Interests: Not provided")

    if evidence.timeframe_years:
        parts.append(f"\nTimeframe: {evidence.timeframe_years} years")

    if evidence.location:
        parts.append(f"Location: {evidence.location}")

    parts.append("")
    parts.append("Produce the Career Twin analysis as a JSON object.")

    return "\n".join(parts)
