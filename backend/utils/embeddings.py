"""
SentenceTransformers embeddings wrapper for LangChain + FAISS.
Replaces hosted embeddings without changing the surrounding RAG flow.
"""

from __future__ import annotations

from functools import lru_cache

from config import settings

try:
    from sentence_transformers import SentenceTransformer
except ImportError as exc:  # pragma: no cover - depends on local environment
    SentenceTransformer = None
    _sentence_transformers_import_error = exc
else:
    _sentence_transformers_import_error = None

from langchain_core.embeddings import Embeddings


@lru_cache(maxsize=4)
def _load_model(model_name: str) -> SentenceTransformer:
    if SentenceTransformer is None:
        raise RuntimeError(
            "The 'sentence-transformers' package is not installed. "
            "Run 'pip install -r requirements.txt'."
        ) from _sentence_transformers_import_error
    return SentenceTransformer(model_name)


class SentenceTransformerEmbeddings(Embeddings):
    """Minimal LangChain-compatible embedding adapter."""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL

    @property
    def model(self) -> SentenceTransformer:
        return _load_model(self.model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        return self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self.model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()
