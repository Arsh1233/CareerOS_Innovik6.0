from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.testclient import TestClient

app = FastAPI()

class StartSessionRequest(BaseModel):
    interview_type: str = "Technical"
    difficulty: str = "Medium"

def require_roles(role: str):
    def _dependency() -> str:
        return role
    return _dependency

def get_service() -> str:
    return "service"

@app.post("/test1")
def test1(
    request: StartSessionRequest,
    user: str = Depends(require_roles("student")),
    service: str = Depends(get_service)
):
    return request.interview_type

client = TestClient(app)
print(client.post("/test1", json={"interview_type": "Behavioral", "difficulty": "Hard"}).json())
