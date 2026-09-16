import asyncio
from app.integrations.postgrest import PostgRESTClient
from app.core.config import get_settings

async def test():
    settings = get_settings()
    client = PostgRESTClient(settings)
    admin_token = settings.supabase_service_role_key
    
    res = await client.select('profiles', admin_token, columns='id,target_role_name,skills_inventory')
    if res:
        for p in res:
            print(f"User: {p.get('id')}, Role: {p.get('target_role_name')}, Skills: {p.get('skills_inventory')}")
    else:
        print('No profiles found.')

asyncio.run(test())
