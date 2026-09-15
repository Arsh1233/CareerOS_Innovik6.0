from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, CurrentUser
from app.schemas.analytics import AdminDashboard
from app.services.analytics_service import AnalyticsService
from app.repositories.analytics import AnalyticsRepository

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_analytics_service() -> AnalyticsService:
    repo = AnalyticsRepository()
    return AnalyticsService(repo)

@router.get("/dashboard", response_model=AdminDashboard)
def get_admin_dashboard(
    user: CurrentUser = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    # In a real app, we'd verify claims["role"] == "admin" here.
    # We allow it for demo telemetry
    return service.get_admin_dashboard()
