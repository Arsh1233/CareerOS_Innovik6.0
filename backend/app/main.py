"""CareerOS FastAPI application entrypoint.

Run locally with:

    uvicorn app.main:app --reload --port 8000

The app boots without provider credentials so `/health` can report what is
configured. Endpoints that need a missing integration fail with an explicit
503 instead of returning placeholder data.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.version import SERVICE_NAME, SERVICE_VERSION
from app.repositories.base import close_pool

logger = logging.getLogger("careeros")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper())
    logger.info(
        "startup service=%s env=%s capabilities=%s",
        SERVICE_NAME,
        settings.app_env,
        {name: ok for name, ok in settings.capability_report().items()},
    )
    try:
        yield
    finally:
        await close_pool()


settings = get_settings()

app = FastAPI(
    title="CareerOS API",
    version=SERVICE_VERSION,
    description=(
        "CareerOS backend — students, colleges and recruiters sharing one career "
        "intelligence loop. PostgreSQL (Supabase) is the source of truth; Qdrant "
        "is a derived search index."
    ),
    lifespan=lifespan,
    # API docs are disabled in production so schema details are not public.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid4().hex
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

register_exception_handlers(app)
app.include_router(api_router, prefix=settings.api_v1_prefix)
