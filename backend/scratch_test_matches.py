import asyncio
import logging
from app.core.config import get_settings
from app.integrations.postgrest import PostgRESTClient
from app.repositories.jobs import JobsRepository
from app.repositories.skills import SkillsRepository
from app.integrations.llm import get_llm_client
from app.services.jobs_service import JobsService

logging.basicConfig(level=logging.DEBUG)

async def test_matches():
    settings = get_settings()
    client = PostgRESTClient(settings)
    jobs_repo = JobsRepository(client)
    skills_repo = SkillsRepository(client)
    llm = get_llm_client()
    
    service = JobsService(jobs_repo, skills_repo, llm)
    
    # Fake claims
    claims = {"sub": "84ac485d-41e7-4b89-a17e-c221a0322a68", "_access_token": settings.supabase_service_role_key}
    
    try:
        matches = await service.get_student_matches(claims, settings.supabase_service_role_key)
        print(f"Matches count: {len(matches)}")
        for m in matches:
            print(f"Job: {m.job.title} | Score: {m.match_score} | Missing: {m.missing_skills}")
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test_matches())
