import sys, traceback
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.repositories.analytics import AnalyticsRepository
from app.services.analytics_service import AnalyticsService

def main():
    repo = AnalyticsRepository()
    service = AnalyticsService(repo)
    colleges = repo.get_all_colleges()
    college_id = colleges[0]["id"]
    print(f"Using college_id: {college_id}")
    try:
        result = service.get_college_dashboard(college_id)
        print("Success! students:", result.total_students)
    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()

if __name__ == "__main__":
    main()
