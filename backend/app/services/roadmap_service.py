"""Roadmap generation and milestone management service.

Orchestration flow:
1. Verify profile + target role
2. Load current skill gaps (from SkillGapService)
3. Build prompt with real evidence
4. Call Groq
5. Validate output with Pydantic BEFORE persistence
6. Persist roadmap + milestones
7. Mark Career Twin stale
8. Return persisted result

Rules:
- Groq must not invent: completed skills, certifications, projects, guaranteed outcomes.
- All AI output validated with Pydantic before any persistence.
- Milestone completion = learning progress only — not "skill mastered".
- Student identity always from JWT.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from pydantic import ValidationError

from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.repositories.career_twins import CareerTwinsRepository
from app.repositories.profiles import ProfilesRepository
from app.repositories.roadmaps import RoadmapsRepository
from app.schemas.skills_roadmap import (
    MilestoneResponse,
    RoadmapGenerateRequest,
    RoadmapPlan,
    RoadmapResponse,
)
from app.services.skill_gap_service import SkillGapService

logger = logging.getLogger("careeros.roadmap_service")

MODEL_PROVIDER = "groq"
PROMPT_VERSION = "v1"

ROADMAP_SYSTEM_PROMPT = """You are CareerOS's Roadmap Generator.
Your job: create a realistic, week-by-week learning roadmap based on real evidence provided.

STRICT RULES — never violate:
- Do NOT invent completed skills the student already has.
- Do NOT claim certifications or projects the student has not mentioned.
- Do NOT guarantee employment outcomes.
- Do NOT recommend skills not relevant to the target role.
- Every week must contain concrete, actionable tasks.
- Return ONLY valid JSON matching the schema below — no explanation, no markdown.

Schema:
{
  "target_role": "string",
  "weeks": [
    {
      "week": 1,
      "theme": "string",
      "objectives": ["string"],
      "skills": ["string"],
      "tasks": [
        {
          "title": "string",
          "type": "course|project|reading|practice|other",
          "estimated_hours": 4.0,
          "description": "string",
          "destination": null
        }
      ]
    }
  ]
}

destination may be one of: "/resume", "/career-twin", "/mentor", "/jobs", or null.
"""


def _build_roadmap_prompt(
    target_role: str,
    gap_skills: list[str],
    matched_skills: list[str],
    pace_hours: int,
    profile_education: str,
    profile_experience: str,
) -> str:
    matched_str = ", ".join(matched_skills[:15]) if matched_skills else "none recorded"
    gaps_str = (
        "\n".join(f"- {s}" for s in gap_skills[:15])
        if gap_skills
        else "No critical gaps identified."
    )

    return f"""Generate a personalized learning roadmap for a student targeting: {target_role}

Available time: {pace_hours} hours/week

Student's confirmed skill evidence (from resume):
{matched_str}

Identified skill gaps (required for {target_role} but missing from evidence):
{gaps_str}

Education context: {profile_education or "Not provided"}
Experience context: {profile_experience or "Not provided"}

Create a roadmap of 4-8 weeks addressing the critical and recommended gaps first.
Each week should fit within {pace_hours} hours total.
Return valid JSON only."""


class RoadmapService:
    """Orchestrates roadmap generation, validation, persistence, and milestone management."""

    def __init__(
        self,
        groq_client: GroqClient,
        profiles_repo: ProfilesRepository,
        roadmaps_repo: RoadmapsRepository,
        twins_repo: CareerTwinsRepository,
        skill_gap_service: SkillGapService,
    ) -> None:
        self._groq = groq_client
        self._profiles = profiles_repo
        self._roadmaps = roadmaps_repo
        self._twins = twins_repo
        self._gap_service = skill_gap_service

    async def generate(
        self,
        claims: dict[str, Any],
        access_token: str,
        request: RoadmapGenerateRequest,
    ) -> RoadmapResponse:
        """Generate, validate, persist, and return a new roadmap."""
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        # 1. Profile
        profile = await self._profiles.get_by_user_id(enriched_claims, user_id)
        if not profile:
            raise ApiError(
                400,
                "profile_required",
                "Complete your profile before generating a roadmap.",
            )

        target_role = request.target_role or profile.get("target_role_name") or None
        if not target_role:
            raise ApiError(
                400,
                "target_role_required",
                "Set a target role in your profile before generating a roadmap.",
            )

        # 2. Get current gap analysis
        gap_analysis = await self._gap_service.get_gap_analysis(claims, access_token)

        gap_skill_names = [g.skill for g in gap_analysis.gaps]
        matched_skill_names = [m.skill for m in gap_analysis.matched_skills]

        # 3. Prompt + Groq
        prompt = _build_roadmap_prompt(
            target_role=target_role,
            gap_skills=gap_skill_names,
            matched_skills=matched_skill_names,
            pace_hours=request.pace_hours_per_week,
            profile_education=str(profile.get("education") or ""),
            profile_experience=str(profile.get("experience") or ""),
        )

        groq_model = self._groq.model
        raw_response: str | None = None
        plan: RoadmapPlan | None = None

        try:
            raw_response = await self._groq.complete(
                system_prompt=ROADMAP_SYSTEM_PROMPT,
                user_message=prompt,
                temperature=0.3,
            )
            if not raw_response:
                raise ApiError(503, "groq_empty_response", "AI returned an empty roadmap.")

            # 4. Validate output before persistence
            plan = self._parse_and_validate(raw_response)
        except ApiError:
            raise
        except ValidationError as exc:
            logger.warning("roadmap_validation_failed errors=%s", exc.error_count())
            raise ApiError(
                503,
                "roadmap_validation_failed",
                "AI roadmap output failed validation. Please try again.",
            )
        except Exception as exc:
            logger.error("roadmap_generation_error error=%s", exc)
            raise ApiError(
                503,
                "roadmap_generation_failed",
                "Roadmap generation failed. Please retry.",
            )

        # 5. Persist roadmap
        plan_dict = plan.model_dump()
        roadmap_row = await self._roadmaps.create(
            enriched_claims,
            user_id=user_id,
            target_role=target_role,
            pace_hours_per_week=request.pace_hours_per_week,
            plan=plan_dict,
            model_provider=MODEL_PROVIDER,
            model_name=groq_model,
            prompt_version=PROMPT_VERSION,
        )

        if not roadmap_row:
            raise ApiError(503, "roadmap_persist_failed", "Failed to save roadmap. Please retry.")

        roadmap_id = str(roadmap_row["id"])

        # 6. Persist milestones (one per week)
        milestones_to_insert = []
        for week in plan.weeks:
            milestones_to_insert.append({
                "roadmap_id": roadmap_id,
                "user_id": user_id,
                "week_number": week.week,
                "title": week.theme,
                "description": "; ".join(week.objectives[:3]),
                "status": "pending",
            })

        inserted_milestones = await self._roadmaps.create_milestones(
            enriched_claims, milestones_to_insert
        )

        # 7. Mark Career Twin stale
        try:
            twin_row = await self._twins.get_latest(enriched_claims, user_id)
            if twin_row and twin_row.get("id") and twin_row.get("status") != "stale":
                await self._twins.mark_stale(enriched_claims, str(twin_row["id"]))
        except Exception as exc:
            logger.warning("twin_stale_mark_failed error=%s", exc)

        return _build_roadmap_response(roadmap_row, inserted_milestones)

    async def get_latest(
        self,
        claims: dict[str, Any],
        access_token: str,
    ) -> RoadmapResponse | None:
        """Return the latest roadmap with its milestones, or None."""
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        roadmap_row = await self._roadmaps.get_latest(enriched_claims, user_id)
        if not roadmap_row:
            return None

        milestones = await self._roadmaps.list_milestones(
            enriched_claims, str(roadmap_row["id"])
        )
        return _build_roadmap_response(roadmap_row, milestones)

    async def patch_milestone(
        self,
        claims: dict[str, Any],
        access_token: str,
        milestone_id: str,
        status: str,
    ) -> MilestoneResponse:
        """Update milestone status and return the authoritative persisted row.

        Completed milestone = learning progress ONLY.
        Does NOT automatically upgrade any skill proficiency.
        """
        enriched_claims = {**claims, "_access_token": access_token}

        # Fetch first to verify ownership (RLS also enforces this at DB level)
        existing = await self._roadmaps.get_milestone(enriched_claims, milestone_id)
        if not existing:
            raise ApiError(404, "milestone_not_found", "Milestone not found.")

        updated = await self._roadmaps.update_milestone_status(
            enriched_claims, milestone_id, status
        )
        if not updated:
            raise ApiError(503, "milestone_update_failed", "Failed to update milestone.")

        return _milestone_row_to_schema(updated)

    # ── private ───────────────────────────────────────────────────────────

    @staticmethod
    def _parse_and_validate(raw: str) -> RoadmapPlan:
        """Extract JSON from Groq response and validate with Pydantic."""
        text = raw.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(
                line for line in lines
                if not line.strip().startswith("```")
            ).strip()

        data = json.loads(text)
        return RoadmapPlan.model_validate(data)


def _build_roadmap_response(
    roadmap_row: dict[str, Any],
    milestones: list[dict[str, Any]],
) -> RoadmapResponse:
    return RoadmapResponse(
        id=str(roadmap_row["id"]),
        target_role=roadmap_row.get("target_role", ""),
        version=roadmap_row.get("version", 1),
        pace_hours_per_week=roadmap_row.get("pace_hours_per_week", 10),
        plan=roadmap_row.get("plan", {}),
        status=roadmap_row.get("status", "active"),
        milestones=[_milestone_row_to_schema(m) for m in milestones],
        created_at=roadmap_row["created_at"],
        updated_at=roadmap_row["updated_at"],
    )


def _milestone_row_to_schema(row: dict[str, Any]) -> MilestoneResponse:
    return MilestoneResponse(
        id=str(row["id"]),
        roadmap_id=str(row["roadmap_id"]),
        week_number=row.get("week_number", 0),
        title=row.get("title", ""),
        description=row.get("description") or None,
        status=row.get("status", "pending"),
        completed_at=row.get("completed_at") or None,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )
