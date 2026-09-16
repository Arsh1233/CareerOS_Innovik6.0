"""Version 1 API router.

Each module's router is mounted onto the `/api/v1` prefix exactly once, so
endpoint paths match the established contract paths (`/auth/login`,
`/users/me`, ...) without duplication.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, career_twin, health, resumes, roadmap, skills, users, chat, voice, jobs, colleges, admin, courses

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(career_twin.router)
api_router.include_router(resumes.router)
api_router.include_router(skills.router)
api_router.include_router(roadmap.router)
api_router.include_router(chat.router)
api_router.include_router(voice.router)
api_router.include_router(jobs.router)
api_router.include_router(colleges.router)
api_router.include_router(admin.router)
api_router.include_router(courses.router)
