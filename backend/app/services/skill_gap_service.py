"""Skill Gap Analysis service.

Deterministic where possible — gaps are computed from persisted skill evidence
vs. verified role requirements.  No AI call is made here.

Rules:
- Evidence comes from the skills table (populated by resume ingestion).
- Requirements come from role_required_skills migration seed.
- Resume mention ≠ mastery — we never invent a proficiency level.
- If no role is set: honest no_role state.
- If no requirements exist for the role: honest no_requirements state.
- Student identity is always from the JWT — never from a request parameter.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.repositories.profiles import ProfilesRepository
from app.repositories.role_requirements import RoleRequirementsRepository
from app.repositories.skills import SkillsRepository
from app.schemas.skills_roadmap import (
    CurrentSkill,
    MatchedSkill,
    SkillGap,
    SkillGapResponse,
)

logger = logging.getLogger("careeros.skill_gap_service")

IMPORTANCE_PRIORITY_MAP = {
    "critical": "critical",
    "recommended": "recommended",
    "optional": "optional",
}


def _normalise(name: str) -> str:
    """Lowercase + strip for comparison. Same logic used when inserting skills."""
    return name.lower().strip()


class SkillGapService:
    """Computes skill gap analysis deterministically from persisted data."""

    def __init__(
        self,
        profiles_repo: ProfilesRepository,
        skills_repo: SkillsRepository,
        role_requirements_repo: RoleRequirementsRepository,
    ) -> None:
        self._profiles = profiles_repo
        self._skills = skills_repo
        self._requirements = role_requirements_repo

    async def get_gap_analysis(
        self,
        claims: dict[str, Any],
        access_token: str,
    ) -> SkillGapResponse:
        """Compute skill gap for the authenticated student.

        Returns an honest result — never fabricates gaps or proficiency.
        """
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        # 1. Get profile to find target role
        profile = await self._profiles.get_by_user_id(enriched_claims, user_id)
        target_role_name: str | None = profile.get("target_role_name") if profile else None

        if not target_role_name:
            return SkillGapResponse(
                target_role="(not set)",
                current_skills=[],
                matched_skills=[],
                gaps=[],
                total_required=0,
                matched_count=0,
                gap_count=0,
                evidence_quality="no_role",
                generated_at=datetime.now(timezone.utc),
            )

        # 2. Load role requirements
        requirements = await self._requirements.get_requirements_for_role(
            access_token, target_role_name
        )

        if not requirements:
            # Honest: no requirements seeded for this role
            return SkillGapResponse(
                target_role=target_role_name,
                current_skills=[],
                matched_skills=[],
                gaps=[],
                total_required=0,
                matched_count=0,
                gap_count=0,
                evidence_quality="no_requirements",
                generated_at=datetime.now(timezone.utc),
            )

        # 3. Load student's skills from the database
        skill_rows = await self._skills.list_skills(enriched_claims, user_id)

        # Build a set of normalised keys the student has evidence for
        student_skill_keys: dict[str, dict[str, Any]] = {
            _normalise(row.get("normalized_skill_key", row.get("display_name", ""))): row
            for row in skill_rows
        }

        current_skills: list[CurrentSkill] = [
            CurrentSkill(
                skill=row.get("display_name", ""),
                normalized_key=_normalise(
                    row.get("normalized_skill_key", row.get("display_name", ""))
                ),
                evidence_summary=row.get("source_summary") or None,
            )
            for row in skill_rows
        ]

        # 4. Match requirements against student skills
        matched: list[MatchedSkill] = []
        gaps: list[SkillGap] = []

        for req in requirements:
            req_key = _normalise(req.get("skill_name", ""))
            req_display = req.get("display_name", req.get("skill_name", ""))
            importance = req.get("importance", "optional")
            priority = IMPORTANCE_PRIORITY_MAP.get(importance, "optional")
            min_level: str | None = req.get("minimum_level")

            if req_key in student_skill_keys:
                student_row = student_skill_keys[req_key]
                matched.append(
                    MatchedSkill(
                        skill=req_display,
                        normalized_key=req_key,
                        evidence_summary=student_row.get("source_summary") or None,
                    )
                )
            else:
                # Try fuzzy partial match (simple substring matching)
                fuzzy_match = None
                for student_key, student_row in student_skill_keys.items():
                    if req_key in student_key or student_key in req_key:
                        fuzzy_match = student_row
                        break

                if fuzzy_match:
                    matched.append(
                        MatchedSkill(
                            skill=req_display,
                            normalized_key=req_key,
                            evidence_summary=fuzzy_match.get("source_summary") or "Partially evidenced",
                        )
                    )
                else:
                    gaps.append(
                        SkillGap(
                            skill=req_display,
                            normalized_key=req_key,
                            priority=priority,  # type: ignore[arg-type]
                            required_level=min_level,
                            current_evidence=None,  # No evidence found — honest
                            reason=f"Required for {target_role_name} but not found in your resume or profile evidence.",
                            recommended_action=_recommend_action(req_display, priority),
                        )
                    )

        # 5. Sort gaps by priority
        priority_order = {"critical": 0, "recommended": 1, "optional": 2}
        gaps.sort(key=lambda g: priority_order.get(g.priority, 9))

        # 6. Determine evidence quality
        total = len(requirements)
        matched_count = len(matched)
        gap_count = len(gaps)

        if matched_count == 0 and gap_count == 0:
            quality = "no_requirements"
        elif matched_count / total >= 0.7:
            quality = "sufficient"
        elif matched_count / total >= 0.3:
            quality = "partial"
        else:
            quality = "insufficient"

        return SkillGapResponse(
            target_role=target_role_name,
            current_skills=current_skills,
            matched_skills=matched,
            gaps=gaps,
            total_required=total,
            matched_count=matched_count,
            gap_count=gap_count,
            evidence_quality=quality,
            generated_at=datetime.now(timezone.utc),
        )


def _recommend_action(skill: str, priority: str) -> str:
    """Generate a short recommended action string. Honest — never guarantees outcomes."""
    if priority == "critical":
        return f"Build practical {skill} experience through projects, courses, or work — this is a core requirement."
    if priority == "recommended":
        return f"Add {skill} to your learning roadmap to strengthen your profile for this role."
    return f"Consider learning {skill} as an optional enhancement for this role."
