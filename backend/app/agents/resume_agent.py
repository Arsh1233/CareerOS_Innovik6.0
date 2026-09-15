"""Resume Agent — Groq-powered structured resume analysis.

The agent handles reasoning only. It:
    - Accepts validated extracted text (NOT raw file bytes)
    - Accepts optional target role context
    - Calls Groq with a structured system prompt
    - Returns a validated ResumeAnalysis Pydantic model

The agent does NOT:
    - Query Supabase or any database
    - Write to any storage
    - Accept user_id from the caller
    - Generate the final numeric score (that is deterministic backend code)

Groq extracts evidence. Backend deterministic code calculates the score.
"""

from __future__ import annotations

import logging

from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.schemas.resume import ResumeAnalysis

logger = logging.getLogger("careeros.resume_agent")

# Agent version — increment when prompt changes materially.
AGENT_VERSION = "v1"

# Retry policy: try up to 2 times for malformed output before giving up.
MAX_VALIDATION_RETRIES = 2


class ResumeAgent:
    """Groq-powered resume analysis agent.

    Input:  extracted text + optional target role
    Output: validated ResumeAnalysis
    """

    def __init__(self, groq_client: GroqClient) -> None:
        self._groq = groq_client

    async def analyse(
        self,
        *,
        extracted_text: str,
        target_role: str | None = None,
    ) -> ResumeAnalysis:
        """Analyse a resume and return a validated structured result.

        Raises:
            ApiError 503: AI provider not configured or unavailable
            ApiError 502: AI output persistently malformed after retries
        """
        if not extracted_text or len(extracted_text.strip()) < 50:
            raise ApiError(
                422,
                "resume_text_insufficient",
                "Resume text is too short to analyse. Please upload a text-extractable PDF.",
            )

        user_prompt = _build_user_prompt(extracted_text, target_role)
        last_exc: Exception | None = None

        for attempt in range(1, MAX_VALIDATION_RETRIES + 2):
            raw = await self._groq.generate_structured(
                system_prompt=_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.2,
                max_tokens=4096,
            )

            try:
                result = ResumeAnalysis.model_validate(raw)
                logger.info(
                    "resume_agent_ok attempt=%d skills=%d",
                    attempt,
                    len(result.skills),
                )
                return result
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "resume_agent_validation_failed attempt=%d error=%s",
                    attempt,
                    type(exc).__name__,
                )

        raise ApiError(
            502,
            "ai_malformed_output",
            "The AI provider returned a response that could not be validated after retries.",
        ) from last_exc


# ── System prompt ──────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are CareerOS Resume Intelligence — an AI resume analysis agent.

Your job is to analyse a student resume and produce a structured JSON report.

## STRICT RULES

1. NEVER fabricate skills, experience, or achievements not present in the text.
2. NEVER claim proficiency level (beginner/intermediate/advanced) from keyword
   mention alone. Leave proficiency assessment to the student.
3. NEVER invent job titles, company names, or education details.
4. Extract evidence: quote or closely paraphrase from the resume text.
5. If a section is absent, mark detected=false — do NOT invent content.
6. Recommendations must be actionable and specific to the resume content.
7. Do NOT generate the numeric score — only extract the evidence signals.

## Output Format

Return a JSON object with EXACTLY this structure:

{
  "summary": "2-3 sentence honest summary of the resume",
  "detected_role": "role you infer from the resume content, or null",

  "education_summary": "summary of education from resume text",
  "experience_summary": "summary of work/internship experience from resume text",

  "sections_detected": [
    {
      "name": "Contact",
      "detected": true,
      "quality": "good",
      "notes": ""
    },
    {
      "name": "Education",
      "detected": true,
      "quality": "good",
      "notes": ""
    },
    {
      "name": "Experience",
      "detected": true,
      "quality": "good",
      "notes": ""
    },
    {
      "name": "Projects",
      "detected": true,
      "quality": "needs_improvement",
      "notes": "Projects lack quantified outcomes"
    },
    {
      "name": "Skills",
      "detected": true,
      "quality": "good",
      "notes": ""
    },
    {
      "name": "Certifications",
      "detected": false,
      "quality": "missing",
      "notes": ""
    }
  ],

  "skills": [
    {
      "name": "FastAPI",
      "normalized_key": "fastapi",
      "evidence": "Built REST APIs using FastAPI for the project XYZ",
      "source_section": "Projects"
    }
  ],

  "certifications": ["AWS Certified Cloud Practitioner"],

  "strengths": [
    "Clear project descriptions with technology stack",
    "Quantified impact in internship section"
  ],

  "weak_sections": [
    "No professional summary section",
    "Skills section lists tools without context"
  ],

  "recommendations": {
    "critical": [
      "Add a professional summary (2-3 sentences) aligned to the target role"
    ],
    "recommended": [
      "Quantify project outcomes with metrics where possible"
    ],
    "optional": [
      "Consider adding a certifications section"
    ]
  },

  "has_contact_info": true,
  "has_education": true,
  "has_experience": true,
  "has_projects": true,
  "has_certifications": false,
  "has_skills_section": true,
  "has_quantified_achievements": false,
  "bullet_structure_quality": "partial",

  "role_keywords_found": [],
  "role_keywords_missing": []
}

## Quality Values
- "good": section is present, clear, and well-structured
- "needs_improvement": section exists but is weak or incomplete
- "missing": section is absent

## Bullet Structure Quality
- "good": most bullets use action verb + result structure
- "partial": some bullets follow good structure
- "poor": bullets are vague or list-only without context
"""


def _build_user_prompt(extracted_text: str, target_role: str | None) -> str:
    parts = ["Analyse the following resume and return the structured JSON report."]

    if target_role:
        parts.append(
            f"\nTarget Role: {target_role}"
            f"\nFor role_keywords_found and role_keywords_missing, identify"
            f" keywords relevant to a '{target_role}' role that are present"
            f" or absent in the resume text."
        )
    else:
        parts.append(
            "\nNo target role specified. Leave role_keywords_found and"
            " role_keywords_missing as empty arrays."
        )

    # Trim to avoid token waste on very large resumes (keep meaningful content)
    text = extracted_text.strip()
    if len(text) > 8000:
        text = text[:8000] + "\n[... resume truncated for analysis ...]"

    parts.append(f"\n---RESUME START---\n{text}\n---RESUME END---")
    parts.append("\nReturn only the JSON object. No prose outside the JSON.")
    return "\n".join(parts)
