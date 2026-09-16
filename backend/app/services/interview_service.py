"""ECHO Interview Agent service.

Orchestrates the full interview lifecycle:
  1. start_session  — issues a signed URL + creates a DB row
  2. end_session    — fetches transcript from ElevenLabs, scores it with Groq,
                      persists the rubric scores and feedback
  3. get_result     — retrieves a past session's persisted result
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.core.errors import ApiError
from app.integrations.elevenlabs import ElevenLabsClient
from app.integrations.groq import GroqClient
from app.repositories.interview import InterviewRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.interview import (
    EndSessionRequest,
    InterviewFeedback,
    InterviewResult,
    InterviewSessionSummary,
    RubricScore,
    StartSessionRequest,
    StartSessionResponse,
)

logger = logging.getLogger("careeros.interview_service")

# Groq rubric prompt version — bump when the prompt changes so scores can be
# compared or re-derived for historical sessions.
RUBRIC_VERSION = "v1"

_RUBRIC_SYSTEM_PROMPT = """You are an expert interview evaluator for CareerOS.
Your task is to score a job interview transcript using a structured rubric.

You will receive a transcript of a conversation between an AI interviewer (ECHO) and a student candidate.
Evaluate the candidate's responses only (not the interviewer's questions).

Score each dimension from 0 to 100:
- technical: Accuracy, depth, and correctness of technical knowledge demonstrated.
- communication: Clarity, structure, conciseness, and use of appropriate terminology.
- confidence: Composure, decisiveness, and ability to handle follow-up questions.
- overall: Weighted average (technical × 0.5 + communication × 0.3 + confidence × 0.2), rounded to nearest integer.

Also provide:
- strongest_area: Name of the best-performing dimension (technical|communication|confidence)
- strongest_explanation: 1-2 sentences explaining the strength with specific evidence from the transcript.
- improvement_area: Name of the weakest dimension.
- improvement_explanation: 1-2 sentences with specific, actionable advice.
- summary: 2-3 sentence overall summary of the candidate's performance.
- recommended_action: One concrete next step (e.g., "Complete the System Design module, then retake this interview.").

IMPORTANT: Respond ONLY in valid JSON matching this exact schema:
{
  "technical": <int 0-100>,
  "communication": <int 0-100>,
  "confidence": <int 0-100>,
  "overall": <int 0-100>,
  "strongest_area": "<string>",
  "strongest_explanation": "<string>",
  "improvement_area": "<string>",
  "improvement_explanation": "<string>",
  "summary": "<string>",
  "recommended_action": "<string>"
}"""


def _build_transcript_text(transcript_data: Any) -> str:
    """Convert ElevenLabs transcript JSON into a readable string for Groq."""
    if not transcript_data:
        return "(No transcript available)"

    # ElevenLabs conversation transcript is a list of turn objects
    # Each turn has: role, message (or content), time_in_call_secs
    lines: list[str] = []
    turns = transcript_data if isinstance(transcript_data, list) else []
    for turn in turns:
        role = turn.get("role", "unknown")
        message = turn.get("message") or turn.get("content", "")
        if message:
            label = "ECHO (interviewer)" if role == "agent" else "Candidate"
            lines.append(f"{label}: {message}")

    return "\n".join(lines) if lines else "(Empty transcript)"


class InterviewService:
    def __init__(
        self,
        elevenlabs: ElevenLabsClient,
        groq: GroqClient,
        interview_repo: InterviewRepository,
        profiles_repo: ProfilesRepository,
    ) -> None:
        self._elevenlabs = elevenlabs
        self._groq = groq
        self._interview = interview_repo
        self._profiles = profiles_repo

    async def start_session(
        self,
        claims: dict[str, Any],
        access_token: str,
        request: StartSessionRequest,
    ) -> StartSessionResponse:
        """Create a DB session and return a signed ElevenLabs WS URL."""
        user_id = claims["sub"]

        # Fetch profile to inject context into ElevenLabs agent via dynamic vars
        enriched_claims = {**claims, "_access_token": access_token}
        profile = await self._profiles.get_by_user_id(enriched_claims, str(user_id))
        target_role = (profile or {}).get("target_role_name") or "General"
        user_name = (profile or {}).get("display_name") or "Candidate"

        dynamic_variables = {
            "target_role": target_role,
            "interview_type": request.interview_type,
            "difficulty": request.difficulty,
            "user_name": user_name,
        }

        # Get signed URL from ElevenLabs (raises 503 if not configured)
        signed_url = await self._elevenlabs.get_signed_url(
            dynamic_variables=dynamic_variables
        )

        # Create the DB row
        session_data = await self._interview.create_session(
            access_token=access_token,
            user_id=user_id,
            interview_type=request.interview_type,
            difficulty=request.difficulty,
            target_role=target_role,
        )
        if not session_data:
            raise ApiError(500, "session_creation_failed", "Failed to create interview session.")

        return StartSessionResponse(
            session_id=session_data["id"],
            signed_url=signed_url,
            elevenlabs_agent_id=self._elevenlabs._settings.elevenlabs_agent_id,
        )

    async def end_session(
        self,
        claims: dict[str, Any],
        access_token: str,
        request: EndSessionRequest,
    ) -> InterviewResult:
        """Fetch transcript from ElevenLabs, score with Groq, persist results."""
        user_id = claims["sub"]
        session_id = str(request.session_id)

        # Verify ownership
        session = await self._interview.get_session(access_token, session_id)
        if not session:
            raise ApiError(404, "session_not_found", "Interview session not found.")
        if str(session.get("user_id")) != str(user_id):
            raise ApiError(403, "forbidden", "You do not own this session.")

        # Update with the ElevenLabs conversation ID and duration
        await self._interview.update_session(
            access_token=access_token,
            session_id=session_id,
            elevenlabs_conversation_id=request.elevenlabs_conversation_id,
            duration_seconds=request.duration_seconds,
            status="complete",
        )

        # Fetch transcript from ElevenLabs — may need a brief retry since the
        # transcript is written asynchronously after the conversation ends.
        transcript_data: list[Any] = []
        try:
            import asyncio
            for attempt in range(3):
                conversation = await self._elevenlabs.get_conversation(
                    request.elevenlabs_conversation_id
                )
                # ElevenLabs may nest transcript under different keys
                transcript_data = (
                    conversation.get("transcript")
                    or conversation.get("conversation", {}).get("transcript")
                    or []
                )
                if transcript_data:
                    break
                if attempt < 2:
                    logger.info(
                        "echo_transcript_empty attempt=%d session_id=%s — retrying",
                        attempt + 1, session_id,
                    )
                    await asyncio.sleep(2)
        except ApiError as exc:
            logger.warning(
                "echo_transcript_fetch_failed session_id=%s el_conv_id=%s error=%s",
                session_id, request.elevenlabs_conversation_id, exc.message,
            )
            # Persist failure but don't block the user
            await self._interview.update_session(
                access_token=access_token,
                session_id=session_id,
                status="failed",
            )
            raise

        # Score the transcript with Groq
        scores, feedback = await self._score_transcript(
            transcript_data=transcript_data,
            session=session,
        )

        # Persist everything
        await self._interview.update_session(
            access_token=access_token,
            session_id=session_id,
            transcript=transcript_data,
            rubric_version=RUBRIC_VERSION,
            scores=scores.model_dump() if scores else None,
            feedback=feedback.model_dump() if feedback else None,
            status="scored",
        )

        # Re-fetch for the final response
        updated = await self._interview.get_session(access_token, session_id)
        return self._to_result(updated or session, scores=scores, feedback=feedback)

    async def get_result(
        self,
        claims: dict[str, Any],
        access_token: str,
        session_id: str,
    ) -> InterviewResult:
        """Return a persisted interview result."""
        session = await self._interview.get_session(access_token, session_id)
        if not session:
            raise ApiError(404, "session_not_found", "Interview session not found.")

        scores: RubricScore | None = None
        feedback: InterviewFeedback | None = None
        if session.get("scores"):
            try:
                scores = RubricScore(**session["scores"])
            except Exception:
                pass
        if session.get("feedback"):
            try:
                feedback = InterviewFeedback(**session["feedback"])
            except Exception:
                pass

        return self._to_result(session, scores=scores, feedback=feedback)

    async def list_sessions(
        self,
        claims: dict[str, Any],
        access_token: str,
        limit: int = 10,
    ) -> list[InterviewSessionSummary]:
        """List the student's most recent sessions."""
        user_id = claims["sub"]
        rows = await self._interview.list_sessions(access_token, user_id, limit=limit)
        summaries = []
        for row in rows:
            overall: int | None = None
            if row.get("scores") and isinstance(row["scores"], dict):
                overall = row["scores"].get("overall")
            summaries.append(
                InterviewSessionSummary(
                    session_id=row["id"],
                    interview_type=row.get("interview_type", "Technical"),
                    difficulty=row.get("difficulty", "Medium"),
                    target_role=row.get("target_role"),
                    status=row.get("status", "pending"),
                    overall_score=overall,
                    created_at=row["created_at"],
                )
            )
        return summaries

    # ── private helpers ─────────────────────────────────────────────────────

    async def _score_transcript(
        self,
        transcript_data: list[Any],
        session: dict[str, Any],
    ) -> tuple[RubricScore | None, InterviewFeedback | None]:
        """Send the transcript to Groq and parse rubric scores."""
        transcript_text = _build_transcript_text(transcript_data)
        target_role = session.get("target_role", "General")
        interview_type = session.get("interview_type", "Technical")
        difficulty = session.get("difficulty", "Medium")

        user_prompt = (
            f"Interview Type: {interview_type} | Difficulty: {difficulty} | "
            f"Target Role: {target_role}\n\n"
            f"=== TRANSCRIPT ===\n{transcript_text}\n=== END TRANSCRIPT ==="
        )

        try:
            raw = await self._groq.generate_structured(
                system_prompt=_RUBRIC_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.2,
                max_tokens=1024,
            )
            scores = RubricScore(
                technical=int(raw.get("technical", 50)),
                communication=int(raw.get("communication", 50)),
                confidence=int(raw.get("confidence", 50)),
                overall=int(raw.get("overall", 50)),
            )
            feedback = InterviewFeedback(
                strongest_area=str(raw.get("strongest_area", "communication")),
                strongest_explanation=str(raw.get("strongest_explanation", "")),
                improvement_area=str(raw.get("improvement_area", "technical")),
                improvement_explanation=str(raw.get("improvement_explanation", "")),
                summary=str(raw.get("summary", "")),
                recommended_action=str(raw.get("recommended_action", "")),
            )
            return scores, feedback
        except Exception as exc:
            logger.error("echo_rubric_scoring_failed error=%s", exc)
            return None, None

    @staticmethod
    def _to_result(
        session: dict[str, Any],
        *,
        scores: RubricScore | None,
        feedback: InterviewFeedback | None,
    ) -> InterviewResult:
        transcript = session.get("transcript")
        return InterviewResult(
            session_id=session["id"],
            status=session.get("status", "pending"),
            interview_type=session.get("interview_type", "Technical"),
            difficulty=session.get("difficulty", "Medium"),
            target_role=session.get("target_role"),
            scores=scores,
            feedback=feedback,
            transcript=transcript if isinstance(transcript, list) else None,
            duration_seconds=session.get("duration_seconds"),
            created_at=session["created_at"],
        )
