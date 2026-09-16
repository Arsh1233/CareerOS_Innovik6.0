import sys
from pathlib import Path
import random
import uuid
import httpx
import asyncio

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings

async def main():
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.")
        return 1

    base_url = f"{settings.supabase_url}/rest/v1"
    auth_url = f"{settings.supabase_url}/auth/v1/admin/users"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Ensure college exists
        resp = await client.get(
            f"{base_url}/colleges?name=eq.Demo College&select=id",
            headers={**headers, "Prefer": ""}
        )
        if resp.status_code == 200 and resp.json():
            college_id = resp.json()[0]["id"]
        else:
            college_id = str(uuid.uuid4())
            await client.post(
                f"{base_url}/colleges",
                json={"id": college_id, "name": "Demo College", "city": "Bengaluru", "verified_status": "verified"},
                headers=headers
            )
        
        departments = ["CS", "IT", "ECE", "EEE", "Mech"]
        first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", 
                       "Ananya", "Diya", "Aditi", "Avni", "Kavya", "Ishita", "Saanvi", "Aarohi", "Riya", "Myra"]
        last_names = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Rao", "Nair", "Menon"]

        print("Creating 30 demo users via Admin Auth API...")
        for i in range(30):
            email = f"demo_student_{i}_{uuid.uuid4().hex[:6]}@example.com"
            display_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Create user in auth.users
            try:
                auth_resp = await client.post(
                    auth_url,
                    json={
                        "email": email,
                        "password": "FakePassword123!",
                        "email_confirm": True,
                        "user_metadata": {"display_name": display_name}
                    },
                    headers={"apikey": settings.supabase_service_role_key, "Authorization": f"Bearer {settings.supabase_service_role_key}"}
                )
                auth_resp.raise_for_status()
                uid = auth_resp.json()["id"]
            except httpx.HTTPStatusError as e:
                print(f"Failed to create auth user {email}: {e.response.text}")
                continue

            # Update public.profiles if it wasn't auto-created or just update onboarding state
            # If trigger exists, it creates profile. Let's update it.
            await client.patch(
                f"{base_url}/profiles?user_id=eq.{uid}",
                json={"display_name": display_name, "onboarding_state": "complete"},
                headers=headers
            )

            # Insert membership
            dept = random.choice(departments)
            await client.post(
                f"{base_url}/student_college_memberships",
                json={"student_id": uid, "college_id": college_id, "enrollment_status": "active", "department": dept},
                headers=headers
            )

            # Insert twin snapshot
            r = random.random()
            if r < 0.15: score = random.randint(20, 49)
            elif r < 0.35: score = random.randint(75, 95)
            else: score = random.randint(50, 74)
            await client.post(
                f"{base_url}/career_twins",
                json={
                    "user_id": uid,
                    "target_role": "Software Engineer",
                    "result": {"overall_score": score}
                },
                headers=headers
            )
            print(f"  Created user {i+1}/30")

        # Recruiters
        rec_resp = await client.get(f"{base_url}/recruiter_organizations?select=id", headers={**headers, "Prefer": ""})
        if rec_resp.status_code == 200 and len(rec_resp.json()) < 5:
            rec_names = ["Infosys", "TCS", "Wipro", "Cognizant", "Amazon", "Google", "Microsoft"]
            for rn in rec_names:
                await client.post(
                    f"{base_url}/recruiter_organizations",
                    json={"id": str(uuid.uuid4()), "name": rn, "verified_status": "verified"},
                    headers=headers
                )
        
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
