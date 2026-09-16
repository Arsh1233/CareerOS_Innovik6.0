import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.repositories.analytics import AnalyticsRepository
from app.services.analytics_service import AnalyticsService

def main():
    repo = AnalyticsRepository()
    service = AnalyticsService(repo)
    
    colleges = repo.get_all_colleges()
    if not colleges:
        print("No colleges")
        return
        
    college_id = colleges[0]["id"]
    try:
        dashboard = service.get_college_dashboard(college_id)
        print("Dashboard generated successfully!")
        print("Students:", dashboard.total_students)
        print("Job Ready:", dashboard.job_ready_students)
        print("At Risk:", dashboard.at_risk_students)
        print("Departments:", len(dashboard.department_metrics))
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
