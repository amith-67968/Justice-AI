"""
Application configuration — all settings loaded from .env file.
Single source of truth for every configurable value in the app.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── LLM ──────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # ── Embeddings ───────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

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

    # ── Tesseract ────────────────────────────────────────────────────────
    TESSERACT_CMD: str | None = os.getenv("TESSERACT_CMD")

    # ── Paths ────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads")
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
    VECTOR_STORE_DIR: str = os.path.join(os.path.dirname(__file__), "vector_store")


settings = Settings()

# Ensure directories exist
for d in [settings.UPLOAD_DIR, settings.DATA_DIR, settings.VECTOR_STORE_DIR]:
    os.makedirs(d, exist_ok=True)
