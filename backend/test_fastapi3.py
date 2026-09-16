from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.testclient import TestClient

app = FastAPI()

class StartSessionRequest(BaseModel):
    interview_type: str = "Technical"
    difficulty: str = "Medium"

class CurrentUser(BaseModel):
    id: str

def get_current_user() -> CurrentUser:
    return CurrentUser(id="123")

def require_roles(role: str):
    def _dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        return user
    return _dependency

def get_service() -> str:
    return "service"

@app.post("/test1")
def test1(
    request: StartSessionRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: str = Depends(get_service)
):
    return request.interview_type

client = TestClient(app)
print(client.post("/test1", json={"interview_type": "Behavioral", "difficulty": "Hard"}).json())
