from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class ChatRequest(BaseModel):
    message: str = Field(...)
    session_id: Optional[UUID] = Field(None)

try:
    print("Test 1:", ChatRequest.model_validate({"message": "hello", "session_id": None}))
except Exception as e:
    print("Test 1 failed:", e)

try:
    print("Test 2:", ChatRequest.model_validate({"message": "hello", "session_id": ""}))
except Exception as e:
    print("Test 2 failed:", e)

try:
    print("Test 3:", ChatRequest.model_validate({"message": "hello"}))
except Exception as e:
    print("Test 3 failed:", e)
