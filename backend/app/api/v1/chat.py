from fastapi import APIRouter, Depends
from app.api.deps import CurrentUser, require_roles, get_profiles_repository
from app.integrations.llm import LLMClient, get_llm_client
from app.repositories.chat import ChatRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])

def get_chat_repository() -> ChatRepository:
    return ChatRepository()

def get_chat_service(
    llm: LLMClient = Depends(get_llm_client),
    profiles: ProfilesRepository = Depends(get_profiles_repository),
    chat_repo: ChatRepository = Depends(get_chat_repository),
) -> ChatService:
    return ChatService(groq_client=llm, profiles_repo=profiles, chat_repo=chat_repo)

@router.post(
    "/",
    response_model=ChatResponse,
    status_code=200,
    summary="Chat with ARIA Mentor",
)
async def chat_with_aria(
    request: ChatRequest,
    user: CurrentUser = Depends(require_roles("student")),
    service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    """Send a message to ARIA and receive a response.
    
    Creates a new session if session_id is missing.
    Maintains chat history in Supabase.
    """
    return await service.chat(
        claims=user.claims,
        access_token=user.access_token,
        request=request,
    )
