"""Roadmap generation, persistence and milestone updates.

Flow: the deterministic skill-gap result is sent to Groq, the completion is
validated with `RoadmapPlan`, and only then is it persisted. A missing provider,
a timeout, or malformed output each fail the request — a fixture plan is never
substituted. Milestone completion records learning progress only and never
modifies skill proficiency.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import ValidationError

from app.core.config import Settings
from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.repositories.roadmaps import RoadmapsRepository
from app.schemas.roadmap import (
    GetRoadmapRequest,
    MilestoneOut,
    MilestoneUpdateRequest,
    RoadmapOut,
    RoadmapPlan,
    RoadmapWeek,
)
from app.schemas.skills import SkillGapResponse
from app.services.skill_gap_service import SkillGapService

logger = logging.getLogger("careeros.roadmap")

_MAX_WEEKS = 12
_MIN_WEEKS = 4

_SYSTEM_PROMPT = (
    "You are CareerOS's learning-roadmap planner. Produce a focused weekly "
    "learning plan that closes the given skill gaps for the target role. "
    "Return ONLY a JSON object with this exact shape:\n"
    '{"target_role": string, "weeks": [{"week": int, "theme": string, '
    '"objectives": [string], "skills": [string], "tasks": [{"title": string, '
    '"type": "course"|"project"|"practice"|"reading"|"certification"|"other", '
    '"estimated_hours": number, "description": string}]}]}\n'
    "Rules: weeks must be numbered consecutively starting at 1. Base every week "
    "only on the supplied gaps. Do NOT claim the learner has already completed "
    "anything, already owns any certification or project, or is guaranteed a job "
    "or a specific salary. Do not invent skills that are not in the supplied gaps."
)


class RoadmapService:
    def __init__(
        self,
        skill_gap: SkillGapService,
        roadmaps: RoadmapsRepository,
        groq: GroqClient,
        settings: Settings,
    ) -> None:
        self._skill_gap = skill_gap
        self._roadmaps = roadmaps
        self._groq = groq
        self._settings = settings

    async def generate(
        self, claims: dict[str, Any], user_id: str, payload: GetRoadmapRequest
    ) -> RoadmapOut:
        gap = await self._skill_gap.analyze(claims, user_id)
        _require_gap_inputs(gap)

        pace = payload.pace_hours_per_week
        planned_weeks = _weeks_for(gap)
        raw = await self._groq.generate_json(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=_user_prompt(gap, pace, planned_weeks),
        )

        try:
            plan = RoadmapPlan.model_validate(raw)
        except ValidationError as exc:
            logger.warning("roadmap_plan_invalid errors=%s", exc.error_count())
            raise ApiError(
                502,
                "ai_invalid_response",
                "The roadmap generator returned a plan that failed validation. "
                "Nothing was saved.",
            ) from exc

        milestones = [
            {"week_number": week.week, "title": _milestone_title(week)} for week in plan.weeks
        ]
        await self._roadmaps.create_roadmap(
            claims,
            user_id,
            target_role_name=gap.target_role or plan.target_role,
            requirements_version=None,
            pace_hours_per_week=pace,
            plan=plan.model_dump(),
            generated_by=self._settings.groq_model,
            milestones=milestones,
        )

        # Re-read the persisted row so the response is the authoritative record.
        return await self._require_latest(claims, user_id)

    async def latest(self, claims: dict[str, Any], user_id: str) -> RoadmapOut | None:
        row = await self._roadmaps.get_latest(claims, user_id)
        return _roadmap_out(row) if row else None

    async def _require_latest(self, claims: dict[str, Any], user_id: str) -> RoadmapOut:
        row = await self._roadmaps.get_latest(claims, user_id)
        if row is None:
            raise ApiError(500, "roadmap_not_persisted", "The roadmap could not be read back.")
        return _roadmap_out(row)

    async def update_milestone(
        self,
        claims: dict[str, Any],
        user_id: str,
        milestone_id: str,
        payload: MilestoneUpdateRequest,
    ) -> MilestoneOut:
        row = await self._roadmaps.update_milestone(
            claims, user_id, milestone_id, payload.status
        )
        if row is None:
            raise ApiError(404, "milestone_not_found", "That milestone does not exist.")
        return MilestoneOut(
            id=str(row["id"]),
            week_number=int(row["week_number"]),
            title=str(row["title"]),
            status=str(row["status"]),  # type: ignore[arg-type]
            completed_at=row.get("completed_at"),
            created_at=row.get("created_at"),
        )


def _require_gap_inputs(gap: SkillGapResponse) -> None:
    if gap.status == "no_target_role":
        raise ApiError(
            409,
            "target_role_required",
            "Set a target role before generating a roadmap.",
        )
    if gap.status == "insufficient_requirements":
        raise ApiError(
            409,
            "insufficient_requirements",
            gap.message or "No skill requirements are recorded for this role yet.",
        )
    if not gap.gaps:
        raise ApiError(
            409,
            "no_skill_gaps",
            "You have evidence for every required skill. There is nothing to plan.",
        )


def _weeks_for(gap: SkillGapResponse) -> int:
    return max(_MIN_WEEKS, min(_MAX_WEEKS, len(gap.gaps) + 2))


def _user_prompt(gap: SkillGapResponse, pace: int | None, planned_weeks: int) -> str:
    gap_lines = [
        {
            "skill": item.skill,
            "priority": item.priority,
            "required_level": item.required_level,
        }
        for item in gap.gaps
    ]
    return (
        f"Target role: {gap.target_role}\n"
        f"Available study time: {pace if pace is not None else 8} hours per week\n"
        f"Planned weeks (use exactly this many): {planned_weeks}\n"
        f"Skill gaps to close (JSON): {json.dumps(gap_lines)}\n"
        "Return the JSON plan now."
    )


def _milestone_title(week: RoadmapWeek) -> str:
    return f"Week {week.week}: {week.theme}"[:200]


def _roadmap_out(row: dict[str, Any]) -> RoadmapOut:
    return RoadmapOut(
        id=str(row["id"]),
        target_role=str(row["target_role_name"]),
        version=int(row["version"]),
        pace_hours_per_week=row.get("pace_hours_per_week"),
        status=str(row.get("status") or "active"),
        generated_by=row.get("generated_by"),
        plan=RoadmapPlan.model_validate(row["plan"]),
        milestones=[
            MilestoneOut(
                id=str(m["id"]),
                week_number=int(m["week_number"]),
                title=str(m["title"]),
                status=str(m["status"]),  # type: ignore[arg-type]
                completed_at=m.get("completed_at"),
                created_at=m.get("created_at"),
            )
            for m in row.get("milestones") or []
        ],
        career_twin_stale=bool(row.get("career_twin_stale") or False),
        created_at=row.get("created_at"),
    )
