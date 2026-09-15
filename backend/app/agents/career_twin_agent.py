"""Career Twin Agent — structured reasoning about career trajectory.

The agent receives sanitized evidence from the service layer and produces
a structured Career Twin result.  It does NOT:
- Query Supabase
- Call PostgREST
- Write database rows
- Read arbitrary user IDs

Responsibility: structured reasoning only.

All output is validated against Pydantic schemas before persistence.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.schemas.career_twin import (
    CareerTwinResult,
    EvidenceSnapshot,
)

logger = logging.getLogger("careeros.career_twin_agent")

# ── System prompt ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
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


def build_user_prompt(evidence: EvidenceSnapshot) -> str:
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


async def generate_career_twin(
    groq_client: GroqClient,
    evidence: EvidenceSnapshot,
) -> CareerTwinResult:
    """Generate a Career Twin result using Groq.

    Flow:
    1. Build prompts from evidence
    2. Send to Groq with JSON response format
    3. Parse and validate with Pydantic
    4. Return validated result

    Raises:
        ApiError: 502 for malformed output after retries, 503 for provider issues.
    """
    user_prompt = build_user_prompt(evidence)

    raw_result = await groq_client.generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=4096,
    )

    # Validate with Pydantic.
    try:
        result = CareerTwinResult.model_validate(raw_result)
    except Exception as exc:
        logger.error(
            "career_twin_validation_error error=%s", type(exc).__name__
        )
        raise ApiError(
            502,
            "ai_malformed_output",
            "The AI provider returned a response that could not be validated.",
        ) from exc

    return result
