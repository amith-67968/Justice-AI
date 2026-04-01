"""
POST /chat — RAG-based legal chat endpoint.
"""

from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse
from services.rag_service import rag

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Answer a legal question using RAG over Indian legal documents."""
    try:
        result = await rag.chat(request.user_query)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
