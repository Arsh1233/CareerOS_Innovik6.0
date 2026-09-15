"""Version 1 API router.

Each module's router is mounted onto the `/api/v1` prefix exactly once, so
endpoint paths match the established contract paths (`/auth/login`,
`/users/me`, ...) without duplication.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, health, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
