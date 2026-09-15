from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime
from uuid import UUID

class ChatMessage(BaseModel):
    id: UUID
    session_id: UUID
    role: Literal["user", "aria", "system"]
    message: str
    created_at: datetime

class ChatSession(BaseModel):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessage] = []

class ChatRequest(BaseModel):
    message: str = Field(..., description="The message from the user")
    session_id: Optional[UUID] = Field(None, description="The chat session ID. If not provided, a new session is created.")

class ChatResponse(BaseModel):
    session_id: UUID
    message: ChatMessage
