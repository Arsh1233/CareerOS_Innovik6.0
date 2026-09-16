import asyncio
from app.integrations.postgrest import PostgRESTClient
from app.core.config import get_settings
import uuid

async def seed_jobs():
    settings = get_settings()
    client = PostgRESTClient(settings)
    admin_token = settings.supabase_service_role_key
    
    # 1. Fetch any profile to act as a fake recruiter
    profiles = await client.select('profiles', admin_token, columns='user_id', limit=1)
    if not profiles:
        print("No profiles found to use as recruiter")
        return
    fake_recruiter_id = profiles[0]['user_id']
    
    # 2. Insert sample jobs
    mock_jobs = [
        {
            "recruiter_id": fake_recruiter_id,
            "company_name": "Google",
            "title": "Software Engineer II",
            "department": "Engineering",
            "location": "Remote",
            "salary_range": "$120,000 - $160,000",
            "employment_type": "Full-time",
            "description": "We are looking for a strong Software Engineer with deep expertise in Python, React, and cloud architectures. You will build scalable systems and work closely with AI teams.",
            "required_skills": ["Python", "React", "PostgreSQL", "Cloud Computing", "System Design", "TypeScript"],
            "status": "active"
        },
        {
            "recruiter_id": fake_recruiter_id,
            "company_name": "Microsoft",
            "title": "Data Scientist",
            "department": "AI Research",
            "location": "Bangalore",
            "salary_range": "₹15,00,000 - ₹25,00,000",
            "employment_type": "Full-time",
            "description": "Join our AI research group to train large language models. Strong understanding of ML fundamentals, PyTorch, and Data structures required.",
            "required_skills": ["Python", "Machine Learning", "PyTorch", "Data Science", "SQL"],
            "status": "active"
        },
        {
            "recruiter_id": fake_recruiter_id,
            "company_name": "Innovik",
            "title": "Frontend Developer",
            "department": "Engineering",
            "location": "Remote",
            "salary_range": "₹8,00,000 - ₹12,00,000",
            "employment_type": "Full-time",
            "description": "Help us build beautiful UI/UX for our career platform. Needs strong React, Tailwind CSS, and TypeScript experience.",
            "required_skills": ["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML/CSS"],
            "status": "active"
        }
    ]
    
    res = await client.insert(table='jobs', access_token=admin_token, payload=mock_jobs)
    print(f"Inserted {len(mock_jobs)} mock jobs!")

asyncio.run(seed_jobs())
