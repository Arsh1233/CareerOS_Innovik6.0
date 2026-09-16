import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import get_settings
import httpx

def main():
    settings = get_settings()
    url = f"{settings.supabase_url}/rest/v1/career_twins?limit=1"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }
    
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            if data and data[0].get("result"):
                print("Result type:", type(data[0]["result"]))
                if isinstance(data[0]["result"], dict):
                    print("Result keys:", data[0]["result"].keys())
                    # Let's print the score if it exists
                    print("overall_score in result?", "overall_score" in data[0]["result"])
            else:
                print("No result data in career_twins")
        else:
            print(resp.status_code, resp.text)

if __name__ == "__main__":
    main()
