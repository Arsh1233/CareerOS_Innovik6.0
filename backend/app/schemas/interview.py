from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import UUID


class StartSessionRequest(BaseModel):
    interview_type: str = Field("Technical", description="Technical|Behavioral|System Design|Mixed")
    difficulty: str = Field("Medium", description="Easy|Medium|Hard")


class StartSessionResponse(BaseModel):
    session_id: UUID
    signed_url: str
    elevenlabs_agent_id: str


class EndSessionRequest(BaseModel):
    session_id: UUID = Field(..., description="Our DB session ID from start-session")
    elevenlabs_conversation_id: str = Field(
        ..., description="The conversation ID from ElevenLabs (received via WS metadata event)"
    )
    duration_seconds: Optional[int] = Field(None, description="Elapsed interview time in seconds")


class RubricScore(BaseModel):
    technical: int = Field(..., ge=0, le=100, description="Technical accuracy and depth (0-100)")
    communication: int = Field(..., ge=0, le=100, description="Clarity and articulation (0-100)")
    confidence: int = Field(..., ge=0, le=100, description="Confidence and composure (0-100)")
    overall: int = Field(..., ge=0, le=100, description="Weighted overall score (0-100)")


class InterviewFeedback(BaseModel):
    strongest_area: str
    strongest_explanation: str
    improvement_area: str
    improvement_explanation: str
    summary: str
    recommended_action: str


class InterviewResult(BaseModel):
    session_id: UUID
    status: str
    interview_type: str
    difficulty: str
    target_role: Optional[str]
    scores: Optional[RubricScore]
    feedback: Optional[InterviewFeedback]
    transcript: Optional[List[Dict[str, Any]]]
    duration_seconds: Optional[int]
    created_at: datetime


class InterviewSessionSummary(BaseModel):
    """Lightweight summary for listing past sessions."""
    session_id: UUID
    interview_type: str
    difficulty: str
    target_role: Optional[str]
    status: str
    overall_score: Optional[int]
    created_at: datetime
