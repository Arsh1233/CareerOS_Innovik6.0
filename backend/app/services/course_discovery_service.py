"""Service for discovering free courses from SWAYAM, NPTEL, etc."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from app.core.errors import ApiError
from app.integrations.hermes import HermesAgent
from app.integrations.postgrest import PostgRESTClient
from app.integrations.web_reader import WebReader
from app.repositories.skills import SkillsRepository
from app.schemas.discovery import DiscoveredCourseResponse, DiscoverCoursesResponse
from app.services.skill_gap_service import SkillGapService

logger = logging.getLogger("careeros.course_discovery_service")


class CourseDiscoveryService:
    def __init__(
        self,
        hermes: HermesAgent,
        web_reader: WebReader,
        skills_repo: SkillsRepository,
        skill_gap_service: SkillGapService,
        postgrest: PostgRESTClient,
    ) -> None:
        self._hermes = hermes
        self._reader = web_reader
        self._skills = skills_repo
        self._skill_gaps = skill_gap_service
        self._postgrest = postgrest

    async def discover_courses(
        self,
        claims: dict[str, Any],
        access_token: str,
    ) -> DiscoverCoursesResponse:
        """Discover free courses that cover the user's skill gaps."""
        user_id = str(claims["sub"])
        enriched_claims = {**claims, "_access_token": access_token}

        # 1. Get user's skill gaps
        try:
            gap_analysis = await self._skill_gaps.get_gap_analysis(claims, access_token)
            # Take top 5 critical/recommended skill gaps
            gaps = [g.skill for g in gap_analysis.gaps if g.priority in ("critical", "recommended")][:5]
        except Exception as e:
            logger.warning("failed_to_get_skill_gaps error=%s", e)
            gaps = []

        if not gaps:
            # If no gaps, maybe they are just looking for general upskilling.
            gaps = ["Python", "Data Structures", "System Design", "Communication"]

        # 2. Check cache (Supabase table discovered_courses)
        # Note: courses are not user-specific in the same way jobs are, we can cache them globally
        # or by skill. For simplicity, we'll fetch all recent courses and filter by skill,
        # or just fetch globally.
        try:
            cached = await self._postgrest.select(
                "discovered_courses",
                access_token,
                filters={
                    "cached_at": "gt.now()-72 hours",
                }
            )
            if cached and len(cached) > 0:
                logger.info("discover_courses_cache_hit count=%d", len(cached))
                courses = []
                for c in cached:
                    course = DiscoveredCourseResponse(
                        id=str(c.get("id")),
                        title=c.get("title", ""),
                        provider=c.get("provider", "Web"),
                        instructor=c.get("instructor", ""),
                        duration=c.get("duration", ""),
                        level=c.get("level", "Beginner"),
                        skills_covered=c.get("skills_covered", []),
                        description=c.get("description", ""),
                        url=c.get("url", ""),
                        is_free=c.get("is_free", True),
                        has_certificate=c.get("has_certificate", False),
                        language=c.get("language", "English"),
                        relevance_score=0,
                    )
                    # Compute relevance score against user gaps
                    course.relevance_score = self._compute_relevance(course.skills_covered, gaps)
                    if course.relevance_score > 0:
                        courses.append(course)

                if courses:
                    courses.sort(key=lambda x: x.relevance_score, reverse=True)
                    # Return top 10
                    courses = courses[:10]
                    return DiscoverCoursesResponse(courses=courses, skill_gaps=gaps, total=len(courses), cached=True)
        except Exception as e:
            logger.warning("failed_to_check_discovered_courses_cache error=%s", e)

        # 3. If no cache or not enough relevant courses, perform live scraping
        logger.info("discover_courses_scraping user_id=%s gaps=%s", user_id, gaps)
        
        # Build search URLs based on gaps. We'll just search for the first 2 gaps to keep it fast.
        query_parts = "+OR+".join([g.replace(" ", "+") for g in gaps[:2]])
        urls = [
            f"https://swayam.gov.in/explorer?category=ALL&keyword={query_parts}", # SWAYAM
            f"https://nptel.ac.in/courses?q={query_parts}",                      # NPTEL
        ]

        # Fetch all URLs concurrently via Jina
        html_contents = await self._reader.fetch_multi(urls)

        # Process via Hermes concurrently
        tasks = []
        sources = ["SWAYAM", "NPTEL"]
        for html, source in zip(html_contents, sources):
            tasks.append(self._hermes.extract_courses(html, source))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Flatten and filter
        all_scraped_courses = []
        for res in results:
            if isinstance(res, list):
                all_scraped_courses.extend(res)
            elif isinstance(res, Exception):
                logger.error("hermes_course_extraction_failed error=%s", res)

        # Remove duplicates (by URL)
        seen_urls = set()
        unique_courses = []
        for c in all_scraped_courses:
            url = c.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_courses.append(c)

        if not unique_courses:
            logger.warning("discover_courses_empty user_id=%s", user_id)
            return DiscoverCoursesResponse(courses=[], skill_gaps=gaps, total=0, cached=False)

        final_courses = []
        for c in unique_courses:
            new_course = DiscoveredCourseResponse(
                id=str(uuid.uuid4()),
                title=c.get("title", "Unknown Course"),
                provider=c.get("provider", "Web"),
                instructor=c.get("instructor", ""),
                duration=c.get("duration", ""),
                level=c.get("level", "Beginner"),
                skills_covered=c.get("skills_covered", []),
                description=c.get("description", "No description provided."),
                url=c.get("url", ""),
                is_free=c.get("is_free", True),
                has_certificate=c.get("has_certificate", False),
                language=c.get("language", "English"),
                relevance_score=self._compute_relevance(c.get("skills_covered", []), gaps),
            )
            final_courses.append(new_course)

        # Sort by relevance
        final_courses.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # We only return top 10
        final_courses = final_courses[:10]

        # 5. Cache the results in Supabase
        try:
            cache_payloads = []
            for c in final_courses:
                cache_payloads.append({
                    "id": c.id,
                    "title": c.title,
                    "provider": c.provider,
                    "instructor": c.instructor,
                    "duration": c.duration,
                    "level": c.level,
                    "description": c.description,
                    "skills_covered": c.skills_covered,
                    "url": c.url,
                    "is_free": c.is_free,
                    "has_certificate": c.has_certificate,
                    "language": c.language,
                })
            
            if cache_payloads:
                await self._postgrest.insert("discovered_courses", access_token, cache_payloads)
                logger.info("discover_courses_cached count=%d", len(cache_payloads))
        except Exception as e:
            logger.warning("failed_to_cache_discovered_courses error=%s", e)

        return DiscoverCoursesResponse(courses=final_courses, skill_gaps=gaps, total=len(final_courses), cached=False)

    def _compute_relevance(self, course_skills: list[str], gaps: list[str]) -> int:
        """Compute relevance score (0-100) based on overlap with skill gaps."""
        if not course_skills or not gaps:
            return 50 # Default middle score
        
        c_skills_lower = {s.lower() for s in course_skills}
        gaps_lower = {s.lower() for s in gaps}
        
        overlap = len(c_skills_lower.intersection(gaps_lower))
        if overlap == 0:
            return 20 # Low relevance
        
        # Max out around 3 overlapping skills
        score = min(100, int((overlap / min(3, len(gaps_lower))) * 100))
        return score
