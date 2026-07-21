from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.rag_service import answer_question

router = APIRouter(prefix="/chat", tags=["Chat"])
chat_router = router


class ChatRequest(BaseModel):
    message: str


class ChatSource(BaseModel):
    category: str
    source_document: str
    page: int | None = None
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    RAG-based clinical chatbot. Retrieves relevant chunks from the
    medical knowledge base (app/knowledge/<category>/) via TF-IDF
    similarity, then generates an answer grounded in those chunks using
    Groq's LLM API. Returns both the answer and which sources were used
    (category, source document, page) for transparency.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        result = answer_question(request.message.strip())
        return result
    except RuntimeError as e:
        # Most likely GROQ_API_KEY not set — surface a clear error rather
        # than a generic 500.
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")