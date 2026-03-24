from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.chat_context import build_chat_context, load_session_metadata
from services.chatbot_groq import ask_contextual_chat


router = APIRouter()


class ChatTurn(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., min_length=1, max_length=1200)


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = Field(default=None, max_length=80)
    message: str = Field(..., min_length=1, max_length=1500)
    history: List[ChatTurn] = Field(default_factory=list)
    intent: str = Field(default="general", max_length=60)
    mode: str = Field(default="resume_context", max_length=40)


@router.post("/chat/message")
async def chat_message(payload: ChatMessageRequest) -> Dict:
    session_id = (payload.session_id or "").strip()
    question = payload.message.strip()
    mode = (payload.mode or "resume_context").strip().lower()

    if mode not in {"resume_context", "general"}:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'resume_context' or 'general'.")

    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    context = {}
    if mode == "resume_context":
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required in resume_context mode")
        try:
            metadata = load_session_metadata(session_id)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        context = build_chat_context(metadata)

    history = [{"role": turn.role.strip().lower(), "content": turn.content.strip()} for turn in payload.history]

    result = ask_contextual_chat(
        question=question,
        context=context,
        history=history,
        intent=payload.intent.strip().lower() if payload.intent else "general",
        mode=mode,
    )

    return {
        "status": result.get("status", "success"),
        "session_id": session_id or None,
        "answer": result.get("answer", ""),
        "model": result.get("model", "unknown"),
        "intent_used": result.get("intent_used", "auto"),
        "mode_used": result.get("mode_used", mode),
        "grounded": bool(result.get("grounded", True)),
        "warning": result.get("warning"),
    }
