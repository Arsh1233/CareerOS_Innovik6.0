from __future__ import annotations

import logging
from typing import Any

from app.core.errors import ApiError
from app.integrations.groq import GroqClient
from app.repositories.chat import ChatRepository
from app.repositories.profiles import ProfilesRepository
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse

logger = logging.getLogger("careeros.chat_service")

class ChatService:
    def __init__(
        self,
        groq_client: GroqClient,
        profiles_repo: ProfilesRepository,
        chat_repo: ChatRepository,
    ) -> None:
        self._groq = groq_client
        self._profiles = profiles_repo
        self._chat = chat_repo

    async def chat(
        self,
        claims: dict[str, Any],
        access_token: str,
        request: ChatRequest,
    ) -> ChatResponse:
        user_id = claims["sub"]
        session_id = request.session_id

        # 1. Resolve Session
        if not session_id:
            # Create a new session
            session_data = await self._chat.create_session(access_token, user_id)
            if not session_data:
                raise ApiError(500, "session_creation_failed", "Failed to create chat session")
            session_id = session_data["id"]
        else:
            # Verify session belongs to user
            session_data = await self._chat.get_session(access_token, str(session_id))
            if not session_data:
                raise ApiError(404, "session_not_found", "Chat session not found")

        # 2. Fetch context
        profile = await self._profiles.get_by_user_id(
            {"_access_token": access_token}, user_id
        )
        history = await self._chat.get_session_history(access_token, str(session_id))
        
        # 3. Save user message
        user_msg = await self._chat.add_message(
            access_token=access_token,
            session_id=str(session_id),
            role="user",
            message=request.message,
        )
        if not user_msg:
            raise ApiError(500, "message_save_failed", "Failed to save user message")

        # 4. Construct Prompt
        target_role = profile.get("target_role_name") if profile else "Undecided"
        skills = profile.get("interests", []) if profile else []
        
        system_prompt = (
            f"You are ARIA, an AI Career Mentor for CareerOS.\n"
            f"The user's target role is {target_role}.\n"
            f"Their skills/interests include: {', '.join(skills)}.\n"
            "You are a helpful, encouraging mentor. Base your advice on their specific context.\n"
            "Keep your responses concise and action-oriented.\n"
            "IMPORTANT: Respond in JSON format with a single key 'reply' containing your message."
        )

        history_context = ""
        for h in history:
            history_context += f"{h['role']}: {h['message']}\n"
        
        user_prompt = f"Previous Conversation:\n{history_context}\nuser: {request.message}"

        # 5. Call LLM
        try:
            response_data = await self._groq.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=1024,
            )
            aria_reply = response_data.get("reply", "I'm sorry, I couldn't process that.")
        except Exception as e:
            logger.error(f"ARIA LLM failure: {e}")
            aria_reply = "I'm having trouble connecting to my brain right now. Please try again later."

        # 6. Save ARIA response
        aria_msg = await self._chat.add_message(
            access_token=access_token,
            session_id=str(session_id),
            role="aria",
            message=aria_reply,
        )
        if not aria_msg:
            raise ApiError(500, "message_save_failed", "Failed to save ARIA response")

        return ChatResponse(
            session_id=session_id,
            message=ChatMessage(**aria_msg)
        )
