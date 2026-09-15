"""Deterministic skill-gap analysis.

No model is involved. Inputs are read server-side — the caller's profile target
role, the persisted `skills` and `skill_evidence` rows, and the sourced
`role_required_skills` for that role. Nothing is invented:

* a required skill with no recorded evidence is a gap, with a reason;
* a matched skill only means evidence exists — the response never asserts a
  proficiency level for it;
* a role with no requirement set produces `insufficient_requirements`, not
  fabricated gaps.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from app.repositories.skills import SkillsRepository
from app.schemas.skills import EvidenceQuality, SkillGapItem, SkillGapResponse

_PRIORITY_ORDER = {"critical": 0, "recommended": 1, "optional": 2}


def normalize_skill_key(name: str) -> str:
    """Canonical key shared with the migration seed and resume ingestion."""
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


class SkillGapService:
    def __init__(self, skills: SkillsRepository) -> None:
        self._skills = skills

    async def analyze(self, claims: dict[str, Any], user_id: str) -> SkillGapResponse:
        now = datetime.now(timezone.utc)
        profile = await self._skills.get_profile_context(claims, user_id)
        target_role = (profile or {}).get("target_role_name") or None
        twin_stale = bool((profile or {}).get("career_twin_stale") or False)

        if not target_role:
            return SkillGapResponse(
                status="no_target_role",
                generated_at=now,
                career_twin_stale=twin_stale,
                message="Choose a target role to see which skills you still need.",
            )

        requirement = await self._skills.get_latest_role_requirement(claims, target_role)
        if requirement is None:
            return SkillGapResponse(
                status="insufficient_requirements",
                target_role=target_role,
                generated_at=now,
                career_twin_stale=twin_stale,
                message=(
                    "No skill requirements are recorded for this role yet, so gaps "
                    "cannot be calculated. Nothing has been assumed."
                ),
            )

        required = await self._skills.list_required_skills(claims, str(requirement["id"]))
        if not required:
            return SkillGapResponse(
                status="insufficient_requirements",
                target_role=str(requirement.get("role_name") or target_role),
                generated_at=now,
                career_twin_stale=twin_stale,
                message=(
                    "This role has no required-skill set recorded yet, so gaps cannot "
                    "be calculated."
                ),
            )

        user_skills = await self._skills.list_user_skills(claims, user_id)
        evidence = await self._skills.list_evidence(claims, user_id)

        owned_keys = {str(row["skill_key"]) for row in user_skills}
        evidenced_keys = {str(row["skill_key"]) for row in evidence}

        matched: list[str] = []
        gaps: list[SkillGapItem] = []
        for req in required:
            key = str(req["skill_key"])
            if key in owned_keys or key in evidenced_keys:
                matched.append(str(req["skill_name"]))
                continue
            importance = str(req.get("importance") or "recommended")
            gaps.append(
                SkillGapItem(
                    skill=str(req["skill_name"]),
                    skill_key=key,
                    priority=importance,  # type: ignore[arg-type]
                    required_level=req.get("minimum_level"),
                    current_evidence=None,
                    reason=_reason(importance, req.get("minimum_level")),
                    recommended_action=_action(importance),
                )
            )

        gaps.sort(key=lambda item: (_PRIORITY_ORDER.get(item.priority, 3), item.skill.lower()))

        return SkillGapResponse(
            status="ok",
            target_role=str(requirement.get("role_name") or target_role),
            current_skills=[str(row["skill_name"]) for row in user_skills],
            matched_skills=matched,
            gaps=gaps,
            evidence_quality=_quality(len(matched), len(required)),
            evidence_count=len(matched),
            requirement_count=len(required),
            career_twin_stale=twin_stale,
            generated_at=now,
            message=None,
        )


def _reason(importance: str, minimum_level: str | None) -> str:
    level = f" (target level: {minimum_level})" if minimum_level else ""
    if importance == "critical":
        return f"Core requirement for this role{level} and no evidence is recorded yet."
    if importance == "recommended":
        return f"Expected for this role{level} but no evidence is recorded yet."
    return f"Optional for this role{level}; no evidence is recorded yet."


def _action(importance: str) -> str:
    if importance == "critical":
        return "Prioritise this: complete a course or project and record it as evidence."
    if importance == "recommended":
        return "Plan a focused course or project and record the outcome as evidence."
    return "Address this once the critical gaps are closed."


def _quality(evidence_count: int, requirement_count: int) -> EvidenceQuality:
    if requirement_count <= 0 or evidence_count <= 0:
        return "none"
    ratio = evidence_count / requirement_count
    if ratio < 0.34:
        return "limited"
    if ratio < 0.67:
        return "moderate"
    return "strong"
