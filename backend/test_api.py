from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user, CurrentUser

def override_get_current_user():
    return CurrentUser(
        id="00000000-0000-0000-0000-000000000000",
        email="test@test.com",
        role="student",
        claims={"sub": "00000000-0000-0000-0000-000000000000"},
        access_token="fake"
    )

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

res = client.post("/api/v1/voice/start-session", json={
    "interview_type": "Technical",
    "difficulty": "Medium"
})

print("VOICE START-SESSION:", res.status_code, res.json())

res2 = client.post("/api/v1/chat/", json={
    "message": "hello",
    "session_id": None
})

print("CHAT:", res2.status_code, res2.json())
