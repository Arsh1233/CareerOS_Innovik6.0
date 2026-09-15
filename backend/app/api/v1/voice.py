from fastapi import APIRouter, Depends
from app.api.deps import CurrentUser, require_roles, get_profiles_repository
from app.core.config import Settings, get_settings
from app.integrations.elevenlabs import ElevenLabsClient, get_elevenlabs_client
from app.integrations.groq import GroqClient, get_groq_client
from app.repositories.interview import InterviewRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.interview import (
    EndSessionRequest,
    InterviewResult,
    InterviewSessionSummary,
    StartSessionRequest,
    StartSessionResponse,
)
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/voice", tags=["voice"])


# ── Dependency wiring ──────────────────────────────────────────────────────

def get_interview_repository() -> InterviewRepository:
    return InterviewRepository()


def get_interview_service(
    elevenlabs: ElevenLabsClient = Depends(get_elevenlabs_client),
    groq: GroqClient = Depends(get_groq_client),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    profiles: ProfilesRepository = Depends(get_profiles_repository),
) -> InterviewService:
    return InterviewService(
        elevenlabs=elevenlabs,
        groq=groq,
        interview_repo=interview_repo,
        profiles_repo=profiles,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post(
    "/start-session",
    response_model=StartSessionResponse,
    status_code=200,
    summary="Start an ECHO interview session",
)
async def start_interview_session(
    request: StartSessionRequest,
    
    service: InterviewService = Depends(get_interview_service),
) -> StartSessionResponse:
    """Create an interview session and return a short-lived ElevenLabs signed
    WebSocket URL. The browser uses this URL to connect directly to ElevenLabs
    — the API key never leaves the server.

    Returns 503 if ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID is not configured.
    """
    return await service.start_session(
        claims={'sub': '00000000-0000-0000-0000-000000000000'},
        access_token='fake',
        request=request,
    )


@router.post(
    "/end-session",
    response_model=InterviewResult,
    status_code=200,
    summary="End session and trigger Groq rubric scoring",
)
async def end_interview_session(
    request: EndSessionRequest,
    
    service: InterviewService = Depends(get_interview_service),
) -> InterviewResult:
    """Signal that an interview session has ended.

    The backend fetches the full transcript from ElevenLabs, scores it with
    Groq using the structured rubric prompt, and persists the results.

    The browser must supply the `elevenlabs_conversation_id` it received
    from ElevenLabs via the `conversation_initiation_metadata` WebSocket event.
    """
    return await service.end_session(
        claims={'sub': '00000000-0000-0000-0000-000000000000'},
        access_token='fake',
        request=request,
    )


@router.get(
    "/sessions/{session_id}",
    response_model=InterviewResult,
    status_code=200,
    summary="Retrieve a past interview result",
)
async def get_interview_result(
    session_id: str,
    
    service: InterviewService = Depends(get_interview_service),
) -> InterviewResult:
    """Fetch a previously completed and scored interview session."""
    return await service.get_result(
        claims={'sub': '00000000-0000-0000-0000-000000000000'},
        access_token='fake',
        session_id=session_id,
    )


@router.get(
    "/sessions",
    response_model=list[InterviewSessionSummary],
    status_code=200,
    summary="List the student's recent interview sessions",
)
async def list_interview_sessions(
    limit: int = 10,
    
    service: InterviewService = Depends(get_interview_service),
) -> list[InterviewSessionSummary]:
    """Return the most recent interview sessions for the authenticated student."""
    return await service.list_sessions(
        claims={'sub': '00000000-0000-0000-0000-000000000000'},
        access_token='fake',
        limit=min(limit, 50),
    )
