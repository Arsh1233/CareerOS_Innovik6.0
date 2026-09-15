from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import get_current_user, CurrentUser
from app.schemas.analytics import CollegeDashboard
from app.services.analytics_service import AnalyticsService
from app.repositories.analytics import AnalyticsRepository

router = APIRouter(prefix="/colleges", tags=["Colleges"])

def get_analytics_service() -> AnalyticsService:
    repo = AnalyticsRepository()
    return AnalyticsService(repo)

@router.get("/me/dashboard", response_model=CollegeDashboard)
def get_college_dashboard(
    user: CurrentUser = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    # In a real app, we'd look up the college_id from the user's claims or memberships.
    # For the hackathon, we assume the college user is mapped to a specific college or we 
    # fetch the first one they belong to.
    # We will just fetch a global or first college for demo purposes if not strictly enforced in claims yet.
    college_id = user.claims.get("college_id")
    
    # If no college_id in claims, fall back to the first college in the db (single-tenant demo).
    if not college_id:
        colleges = service.repository.get_all_colleges()
        if not colleges:
            raise HTTPException(status_code=404, detail="No college found")
        college_id = colleges[0]["id"]
        
    return service.get_college_dashboard(college_id)
