"""
Shared OpenAI async client — single instance used by all services.
Eliminates duplicate _get_client() functions across modules.
"""

from __future__ import annotations

from openai import AsyncOpenAI
from config import settings

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    """Return a shared AsyncOpenAI client (lazy-initialized singleton)."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client
