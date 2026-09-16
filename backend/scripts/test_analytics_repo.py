import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.repositories.analytics import AnalyticsRepository

def main():
    repo = AnalyticsRepository()
    try:
        colleges = repo.get_all_colleges()
        print("Colleges:", colleges)
    except Exception as e:
        print("Error fetching colleges:", e)
        
    if colleges:
        college_id = colleges[0]["id"]
        try:
            students = repo.get_college_students(college_id)
            print(f"Students for {college_id}:", len(students))
        except Exception as e:
            print("Error fetching students:", e)
            
if __name__ == "__main__":
    main()
