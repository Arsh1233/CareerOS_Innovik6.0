from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.testclient import TestClient

app = FastAPI()

class MyRequest(BaseModel):
    name: str

class MyUser(BaseModel):
    id: str

def get_user() -> MyUser:
    return MyUser(id="123")

@app.post("/test1")
def test1(request: MyRequest, user: MyUser = Depends(get_user)):
    return request.name

client = TestClient(app)
print(client.post("/test1", json={"name": "test"}).json())
