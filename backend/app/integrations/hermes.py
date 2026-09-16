"""Hermes extraction agent for structured data from web pages.

Uses Groq's llama3-groq-70b-8192-tool-use-preview model (branded as "Hermes" 
for its strong tool-use / JSON extraction capabilities) to parse raw markdown 
from job boards and course catalogs into structured data.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger("careeros.hermes")

_MODEL = "llama3-groq-70b-8192-tool-use-preview"
_TIMEOUT = 60.0

_JOB_EXTRACTION_PROMPT = """You are a job data extraction specialist. 
Given raw markdown text scraped from a job board, extract ALL job listings you can find.

For each job return a JSON object with exactly these fields:
- title: job title (string)
- company: company/organization name (string)  
- location: city, state or "Remote" (string)
- job_type: "Full-time" | "Part-time" | "Contract" | "Internship" | "Government" (string)
- experience: experience required e.g. "2-5 years" or "" (string)
- salary: salary/stipend if mentioned e.g. "₹8-12 LPA" or "" (string)
- skills_required: list of technical/soft skills mentioned (list of strings, max 10)
- description: 2-3 sentence JD summary (string)
- apply_url: the direct apply/job URL — MUST be a real full URL starting with https:// (string)
- source: which platform this is from (string)
- deadline: application deadline if mentioned, else "" (string)

Return ONLY a JSON array of job objects. If no valid jobs found, return [].
Do not include any explanation or markdown fences."""

_COURSE_EXTRACTION_PROMPT = """You are a course data extraction specialist.
Given raw markdown text scraped from an online learning platform, extract ALL courses listed.

For each course return a JSON object with exactly these fields:
- title: course title (string)
- provider: platform name e.g. "SWAYAM", "NPTEL", "CEC", "CREC", "NIOS" (string)
- instructor: instructor/institution name (string)
- duration: e.g. "8 weeks", "12 hours" or "" (string)
- level: "Beginner" | "Intermediate" | "Advanced" | "All Levels" (string)
- skills_covered: list of skills/topics this course covers (list of strings, max 8)
- description: 1-2 sentence course summary (string)
- url: the direct course enrollment/detail URL — MUST be a real full URL starting with https:// (string)
- is_free: true (boolean, always true for these platforms)
- has_certificate: whether a certificate is offered (boolean)
- language: "English" | "Hindi" | "Telugu" | other (string)

Return ONLY a JSON array of course objects. If no courses found, return [].
Do not include any explanation or markdown fences."""


class HermesAgent:
    """Hermes extraction agent using the central LLM client."""

    def __init__(self) -> None:
        self._settings = get_settings()

    async def _extract(self, system_prompt: str, content: str, *, max_tokens: int = 4096) -> list[dict[str, Any]]:
        """Send content to LLM and parse JSON array response."""
        if not content or not content.strip():
            return []
            
        from app.integrations.llm import get_llm_client
        client = get_llm_client()

        # Wrap in {"items": [...]} since json_object mode requires an object
        system_prompt += '\n\nIMPORTANT: Return your JSON array wrapped in {"items": [...]} object.'
        user_prompt = f"Extract structured data from this content:\n\n{content}"

        try:
            parsed = await client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.1,
                max_tokens=max_tokens,
            )
            items = parsed.get("items", parsed) if isinstance(parsed, dict) else parsed
            if isinstance(items, list):
                return items
            return []
        except Exception as exc:
            logger.error("hermes_extract_failed error=%s", exc)
            return []

    async def extract_jobs(self, html_content: str, source: str) -> list[dict[str, Any]]:
        """Extract job listings from scraped page content."""
        prompt = _JOB_EXTRACTION_PROMPT + f"\n\nSource platform: {source}"
        jobs = await self._extract(prompt, html_content)
        # Inject source if missing and validate URLs
        result = []
        for j in jobs:
            if not isinstance(j, dict):
                continue
            if not j.get("apply_url", "").startswith("http"):
                continue  # skip jobs without valid URLs
            j["source"] = j.get("source") or source
            result.append(j)
        logger.info("hermes_jobs_extracted source=%s count=%d", source, len(result))
        return result

    async def extract_courses(self, html_content: str, provider: str) -> list[dict[str, Any]]:
        """Extract courses from scraped page content."""
        prompt = _COURSE_EXTRACTION_PROMPT + f"\n\nPlatform: {provider}"
        courses = await self._extract(prompt, html_content)
        result = []
        for c in courses:
            if not isinstance(c, dict):
                continue
            if not c.get("url", "").startswith("http"):
                continue  # skip courses without valid URLs
            c["provider"] = c.get("provider") or provider
            c["is_free"] = True
            result.append(c)
        logger.info("hermes_courses_extracted provider=%s count=%d", provider, len(result))
        return result


_agent: HermesAgent | None = None


def get_hermes_agent() -> HermesAgent:
    global _agent
    if _agent is None:
        _agent = HermesAgent()
    return _agent
