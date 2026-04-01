"""
JusticeAI — FastAPI Backend Entry Point
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes.chat import router as chat_router
from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.events import router as events_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: pre-warm heavy models in background so first request isn't slow."""
    # Import lazily to avoid blocking import-time
    from services.classification_service import classifier
    from services.rag_service import rag

    # Warm up InLegalBERT & vector store in a thread so we don't block the loop
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, classifier.load_model)
    await loop.run_in_executor(None, rag.initialize)
    print("Models loaded; server ready")
    yield


app = FastAPI(
    title="JusticeAI",
    description="AI-Powered Legal Assistance Platform (India-focused)",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──────────────────────────────────────────────────────────────────
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["Analysis"])
app.include_router(events_router, prefix="/extract-events", tags=["Events"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
