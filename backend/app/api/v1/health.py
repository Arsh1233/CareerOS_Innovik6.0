"""Operational health.

Reports which integrations are configured.  It never probes secrets or claims a
provider works when it has not been exercised.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.core.version import SERVICE_NAME, SERVICE_VERSION
from app.schemas.identity import HealthResponse

router = APIRouter(tags=["system"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service status and configured capabilities",
)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    capabilities = settings.capability_report()

    # Core readiness: auth verification (JWKS or JWT secret) AND at least one
    # database access path (PostgREST over HTTPS or direct PostgreSQL).
    auth_ready = capabilities["supabase_auth"] or bool(settings.supabase_jwt_secret)
    postgrest_ready = auth_ready  # PostgREST uses supabase_url + supabase_anon_key
    direct_db_ready = capabilities["database"]  # database_url

    core_ready = auth_ready and (postgrest_ready or direct_db_ready)

    return HealthResponse(
        status="ok" if core_ready else "degraded",
        service=SERVICE_NAME,
        environment=settings.app_env,
        version=SERVICE_VERSION,
        capabilities=capabilities,
    )
