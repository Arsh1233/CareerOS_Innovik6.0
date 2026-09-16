"""Service for discovering and scraping external jobs (Google, Naukri, etc)."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from app.core.errors import ApiError
from app.integrations.hermes import HermesAgent
from app.integrations.postgrest import PostgRESTClient
from app.integrations.web_reader import WebReader
from app.repositories.profiles import ProfilesRepository
from app.repositories.skills import SkillsRepository
from app.schemas.discovery import DiscoveredJobResponse, DiscoverJobsResponse

logger = logging.getLogger("careeros.job_discovery_service")


class JobDiscoveryService:
    def __init__(
        self,
        hermes: HermesAgent,
        web_reader: WebReader,
        profiles_repo: ProfilesRepository,
        skills_repo: SkillsRepository,
        postgrest: PostgRESTClient,
    ) -> None:
        self._hermes = hermes
        self._reader = web_reader
        self._profiles = profiles_repo
        self._skills = skills_repo
        self._postgrest = postgrest

    async def discover_jobs(
        self,
        claims: dict[str, Any],
        access_token: str,
        target_role: str | None = None,
    ) -> DiscoverJobsResponse:
        """Discover jobs from external sources for the user's target role."""
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        # 1. Get profile to determine target role
        profile = await self._profiles.get_by_user_id(enriched_claims, user_id)
        if not profile:
            raise ApiError(400, "profile_required", "Complete your profile to discover jobs.")
        
        role = target_role or profile.get("target_role_name")
        if not role:
            raise ApiError(400, "target_role_required", "Set a target role in your profile.")

        # 2. Check cache (Supabase table discovered_jobs)
        # Using service role client here is fine for cache, or we just rely on RLS with the user's token
        try:
            # We filter by user_id and make sure it's not older than 24h
            cached = await self._postgrest.select(
                "discovered_jobs",
                access_token,
                filters={
                    "user_id": f"eq.{user_id}",
                    "cached_at": "gt.now()-24 hours",
                },
                order="match_score.desc"
            )
            if cached and len(cached) > 0:
                logger.info("discover_jobs_cache_hit user_id=%s count=%d", user_id, len(cached))
                jobs = [
                    DiscoveredJobResponse(
                        id=str(c.get("id")),
                        title=c.get("title", ""),
                        company=c.get("company", ""),
                        location=c.get("location", ""),
                        job_type=c.get("job_type", "Full-time"),
                        experience=c.get("experience", ""),
                        salary=c.get("salary", ""),
                        skills_required=c.get("skills_required", []),
                        description=c.get("jd", ""),
                        apply_url=c.get("apply_url", ""),
                        source=c.get("source", "Unknown"),
                        deadline=c.get("deadline", ""),
                        match_score=c.get("match_score", 0),
                        readiness_score=c.get("readiness_score", 0),
                    )
                    for c in cached
                ]
                return DiscoverJobsResponse(jobs=jobs, target_role=role, total=len(jobs), cached=True)
        except Exception as e:
            logger.warning("failed_to_check_discovered_jobs_cache error=%s", e)

        # 3. If no cache, perform live scraping
        logger.info("discover_jobs_scraping user_id=%s role=%s", user_id, role)
        
        # Build search queries
        query = role.replace(" ", "+")
        urls = [
            f"https://www.google.com/search?q={query}+jobs&ibp=htl;jobs", # Google Jobs (often aggregates LinkedIn)
            f"https://www.naukri.com/{query.replace('+', '-')}-jobs",     # Naukri
            f"https://careers.microsoft.com/us/en/search-results?keywords={query}", # Microsoft
            f"https://www.ncs.gov.in/Pages/Search.aspx?q={query}",        # Govt NCS
        ]

        # Fetch all URLs concurrently via Jina
        html_contents = await self._reader.fetch_multi(urls)

        # Process via Hermes concurrently
        tasks = []
        sources = ["Google Jobs / LinkedIn", "Naukri", "Microsoft", "Government (NCS)"]
        for html, source in zip(html_contents, sources):
            tasks.append(self._hermes.extract_jobs(html, source))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Flatten and filter
        all_scraped_jobs = []
        for res in results:
            if isinstance(res, list):
                all_scraped_jobs.extend(res)
            elif isinstance(res, Exception):
                logger.error("hermes_job_extraction_failed error=%s", res)

        # Remove duplicates (by URL)
        seen_urls = set()
        unique_jobs = []
        for j in all_scraped_jobs:
            url = j.get("apply_url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_jobs.append(j)

        if not unique_jobs:
            logger.warning("discover_jobs_empty user_id=%s", user_id)
            return DiscoverJobsResponse(jobs=[], target_role=role, total=0, cached=False)

        # 4. Fetch user skills to compute match/readiness scores
        user_skills = set()
        try:
            persisted = await self._skills.get_student_skills(enriched_claims, user_id)
            user_skills = {s.get("name", "").lower() for s in persisted}
        except Exception as e:
            logger.warning("failed_to_fetch_user_skills error=%s", e)

        final_jobs = []
        for j in unique_jobs:
            req_skills = j.get("skills_required", [])
            req_skills_lower = {s.lower() for s in req_skills}
            
            # Simple overlap score
            if not req_skills_lower:
                match_score = 50
                readiness_score = 50
            else:
                overlap = len(req_skills_lower.intersection(user_skills))
                readiness_score = int((overlap / len(req_skills_lower)) * 100)
                # Match score might incorporate profile location/pref, but for now use readiness
                match_score = readiness_score

            j["match_score"] = min(100, max(0, match_score))
            j["readiness_score"] = min(100, max(0, readiness_score))

            # Provide default UUID for the id field if we don't insert it into DB
            new_job = DiscoveredJobResponse(
                id=str(uuid.uuid4()),
                title=j.get("title", "Unknown Role"),
                company=j.get("company", "Unknown Company"),
                location=j.get("location", "Remote"),
                job_type=j.get("job_type", "Full-time"),
                experience=j.get("experience", ""),
                salary=j.get("salary", ""),
                skills_required=j.get("skills_required", []),
                description=j.get("description", "No description provided."),
                apply_url=j.get("apply_url", ""),
                source=j.get("source", "Web"),
                deadline=j.get("deadline", ""),
                match_score=j.get("match_score", 0),
                readiness_score=j.get("readiness_score", 0),
            )
            final_jobs.append(new_job)

        # Sort by match score
        final_jobs.sort(key=lambda x: x.match_score, reverse=True)

        # 5. Cache the results in Supabase
        try:
            # We attempt to insert. If it fails, that's fine, we still return the jobs
            cache_payloads = []
            for j in final_jobs:
                cache_payloads.append({
                    "id": j.id,
                    "user_id": user_id,
                    "title": j.title,
                    "company": j.company,
                    "location": j.location,
                    "job_type": j.job_type,
                    "experience": j.experience,
                    "salary": j.salary,
                    "jd": j.description,
                    "skills_required": j.skills_required,
                    "apply_url": j.apply_url,
                    "source": j.source,
                    "deadline": j.deadline,
                    "match_score": j.match_score,
                    "readiness_score": j.readiness_score,
                })
            
            if cache_payloads:
                await self._postgrest.insert("discovered_jobs", access_token, cache_payloads)
                logger.info("discover_jobs_cached user_id=%s count=%d", user_id, len(cache_payloads))
        except Exception as e:
            logger.warning("failed_to_cache_discovered_jobs error=%s", e)

        return DiscoverJobsResponse(jobs=final_jobs, target_role=role, total=len(final_jobs), cached=False)
