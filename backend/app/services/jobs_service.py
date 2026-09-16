"""Jobs & Recruiter Workflow Service.

Handles job posting, semantic skill matching between students and jobs using Groq,
and recruiter pipeline management.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.core.config import get_settings
from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.repositories.jobs import JobsRepository
from app.repositories.skills import SkillsRepository
from app.schemas.jobs import (
    JobApplicationCreate,
    JobApplicationResponse,
    JobCreate,
    JobMatchResponse,
    JobResponse,
    RecruiterPipelineMetrics,
    RecruiterJobMetrics,
)

logger = logging.getLogger("careeros.jobs_service")


_MATCH_PROMPT = """You are an expert technical recruiter AI.
You will be given a candidate's skills (extracted from their profile/resume) and a job description/required skills.
Compare the two and return a structured JSON response matching this EXACT schema:
{
  "match_score": <int 0-100, representing how well the candidate's skills align with the requirements>,
  "matching_skills": [<string>, <string>... list of candidate skills that match the job requirements],
  "missing_skills": [<string>, <string>... list of required skills that the candidate is missing]
}
Be critical. A match_score above 90 should be rare and mean near-perfect alignment.
Respond ONLY in valid JSON.
"""


class JobsService:
    def __init__(
        self,
        jobs_repo: JobsRepository,
        skills_repo: SkillsRepository,
        groq_client: GroqClient,
    ) -> None:
        self._jobs = jobs_repo
        self._skills = skills_repo
        self._groq = groq_client

    async def create_job(
        self,
        claims: dict[str, Any],
        access_token: str,
        request: JobCreate,
    ) -> JobResponse:
        """Recruiters can create jobs."""
        recruiter_id = claims["sub"]
        
        payload = request.model_dump(exclude_unset=True)
        payload["recruiter_id"] = recruiter_id
        if request.deadline:
            payload["deadline"] = request.deadline.isoformat()

        job_data = await self._jobs.create_job(access_token, payload)
        if not job_data:
            raise ApiError(500, "job_creation_failed", "Failed to create job posting.")
        return JobResponse(**job_data)

    async def get_student_matches(
        self,
        claims: dict[str, Any],
        access_token: str,
    ) -> list[JobMatchResponse]:
        """Find jobs matching the student's skills.

        Uses the service-role key to list active jobs (public data) so that
        student-JWT RLS policies don't block the read. Skills and applications
        are fetched under the student's own token so RLS still protects them.
        """
        student_id = claims["sub"]
        settings = get_settings()
        admin_token = settings.supabase_service_role_key or access_token

        # Enrich claims with the access token so SkillsRepository can use it
        # (all repositories read the token from claims["_access_token"]).
        enriched_claims = {**claims, "_access_token": access_token}

        # 1. Fetch student's skills (use student token — RLS protected)
        skills_list = await self._skills.list_skills(enriched_claims, student_id)
        candidate_skills = [s.get("display_name", "") for s in skills_list if s.get("display_name")]

        # 2. Fetch all active jobs with admin/service-role token (public listing)
        active_jobs = await self._jobs.list_active_jobs(admin_token)

        # 3. Fetch applications (student token)
        apps = await self._jobs.get_student_applications(access_token, student_id)
        applied_job_ids = {str(app["job_id"]) for app in apps}

        matches = []
        for job in active_jobs:
            job_resp = JobResponse(**job)
            has_applied = str(job["id"]) in applied_job_ids
            req_skills = job.get("required_skills", []) or []

            if not candidate_skills:
                # No skills in DB yet — return jobs with a baseline display score
                # so the student can see what's available even before resume upload.
                # Estimate readiness as 35% so the card renders as "partial match".
                matches.append(JobMatchResponse(
                    job=job_resp,
                    match_score=35,
                    matching_skills=[],
                    missing_skills=req_skills,
                    has_applied=has_applied,
                ))
                continue

            # 4. Compare using LLM
            desc = job.get("description", "")
            user_prompt = (
                f"Candidate Skills: {', '.join(candidate_skills)}\n\n"
                f"Job Required Skills: {', '.join(req_skills)}\n"
                f"Job Description: {desc}"
            )

            try:
                raw = await self._groq.generate_structured(
                    system_prompt=_MATCH_PROMPT,
                    user_prompt=user_prompt,
                    temperature=0.1,
                    max_tokens=512,
                )
                matches.append(JobMatchResponse(
                    job=job_resp,
                    match_score=int(raw.get("match_score", 0)),
                    matching_skills=raw.get("matching_skills", []),
                    missing_skills=raw.get("missing_skills", []),
                    has_applied=has_applied,
                ))
            except Exception as e:
                logger.error("Failed to generate match score for job %s: %s", job["id"], e)
                matches.append(JobMatchResponse(
                    job=job_resp,
                    match_score=0,
                    matching_skills=[],
                    missing_skills=req_skills,
                    has_applied=has_applied,
                ))

        # Sort by match_score descending
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches

    async def apply_to_job(
        self,
        claims: dict[str, Any],
        access_token: str,
        job_id: str,
    ) -> JobApplicationResponse:
        student_id = claims["sub"]
        
        # First check if they already applied
        apps = await self._jobs.get_student_applications(access_token, student_id)
        if any(str(app["job_id"]) == str(job_id) for app in apps):
            raise ApiError(400, "already_applied", "You have already applied to this job.")
            
        # Optional: Generate match score dynamically at application time to save in DB
        app_data = await self._jobs.create_application(
            access_token=access_token,
            payload={
                "job_id": job_id,
                "student_id": student_id,
                "status": "new"
            }
        )
        if not app_data:
            raise ApiError(500, "application_failed", "Failed to submit application.")
            
        return JobApplicationResponse(**app_data)

    async def get_recruiter_dashboard(
        self,
        claims: dict[str, Any],
        access_token: str,
    ) -> dict[str, Any]:
        """Aggregate data for recruiter dashboard."""
        recruiter_id = claims["sub"]
        
        jobs = await self._jobs.list_recruiter_jobs(access_token, recruiter_id)
        apps = await self._jobs.get_recruiter_applications(access_token)
        
        # Calculate pipeline funnel
        pipeline_counts = {
            "new": 0, "reviewing": 0, "shortlisted": 0, "interviewed": 0, "offered": 0, "rejected": 0
        }
        for app in apps:
            pipeline_counts[app.get("status", "new")] += 1
            
        pipeline = [
            {"stage": "Talent Pool", "count": len(apps), "color": "#6E72E8"},
            {"stage": "Reviewed", "count": pipeline_counts["reviewing"] + pipeline_counts["shortlisted"] + pipeline_counts["interviewed"] + pipeline_counts["offered"], "color": "#4F7CFF"},
            {"stage": "Shortlisted", "count": pipeline_counts["shortlisted"] + pipeline_counts["interviewed"] + pipeline_counts["offered"], "color": "#8B7CFF"},
            {"stage": "Interviewed", "count": pipeline_counts["interviewed"] + pipeline_counts["offered"], "color": "#22A06B"},
            {"stage": "Offers Sent", "count": pipeline_counts["offered"], "color": "#12B76A"},
        ]
        
        # Job metrics
        job_metrics = []
        for job in jobs:
            job_apps = [a for a in apps if str(a["job_id"]) == str(job["id"])]
            shortlisted = [a for a in job_apps if a["status"] in ("shortlisted", "interviewed", "offered")]
            
            job_metrics.append({
                "job": JobResponse(**job).model_dump(),
                "applicants_count": len(job_apps),
                "shortlisted_count": len(shortlisted),
                "avg_match_score": 85 # Mocked avg score for simplicity unless we save score at apply time
            })
            
        return {
            "pipeline": pipeline,
            "job_metrics": job_metrics,
            "recent_applications": [JobApplicationResponse(**a).model_dump() for a in apps[:10]]
        }
        
    async def update_application_status(
        self,
        claims: dict[str, Any],
        access_token: str,
        application_id: str,
        status: str,
    ) -> JobApplicationResponse:
        valid_statuses = {"new", "reviewing", "shortlisted", "interviewed", "offered", "rejected"}
        if status not in valid_statuses:
            raise ApiError(400, "invalid_status", f"Status must be one of {valid_statuses}")
            
        updated = await self._jobs.update_application_status(access_token, application_id, status)
        if not updated:
            raise ApiError(404, "application_not_found", "Application not found or you lack permission.")
            
        return JobApplicationResponse(**updated)
