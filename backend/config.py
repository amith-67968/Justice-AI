"""
Application configuration — all settings loaded from .env file.
Single source of truth for every configurable value in the app.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── LLM ──────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # ── Embeddings ───────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL",
        "sentence-transformers/all-MiniLM-L6-v2",
    )

    # ── InLegalBERT ──────────────────────────────────────────────────────
    INLEGALBERT_MODEL: str = os.getenv("INLEGALBERT_MODEL", "law-ai/InLegalBERT")
    CLASSIFICATION_MAX_CHARS: int = int(os.getenv("CLASSIFICATION_MAX_CHARS", "2000"))

    # ── RAG ──────────────────────────────────────────────────────────────
    RAG_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    RAG_CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "200"))
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "4"))

    # ── Document Processing ──────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
    MAX_EXTRACTION_CHARS: int = int(os.getenv("MAX_EXTRACTION_CHARS", "12000"))

    @property
    def MAX_FILE_SIZE_BYTES(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    # ── Server ───────────────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    SUPABASE_DOCUMENTS_TABLE: str = os.getenv("SUPABASE_DOCUMENTS_TABLE", "documents").strip()

    # ── Tesseract ────────────────────────────────────────────────────────
    TESSERACT_CMD: str | None = os.getenv("TESSERACT_CMD")

    # ── Paths ────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads")
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
    VECTOR_STORE_DIR: str = os.path.join(os.path.dirname(__file__), "vector_store")


settings = Settings()

# Ensure directories exist
for directory in [settings.UPLOAD_DIR, settings.DATA_DIR, settings.VECTOR_STORE_DIR]:
    os.makedirs(directory, exist_ok=True)
