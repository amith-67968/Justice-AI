"""
Shared Groq async client utilities.
Keeps one lazy-initialized client for the whole backend.
"""

from __future__ import annotations

from typing import Any

from config import settings

try:
    from groq import AsyncGroq
except ImportError as exc:  # pragma: no cover - depends on local environment
    AsyncGroq = None
    _groq_import_error = exc
else:
    _groq_import_error = None


JSON_OBJECT_RESPONSE_FORMAT = {"type": "json_object"}

_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    """Return a shared AsyncGroq client (lazy-initialized singleton)."""
    if AsyncGroq is None:
        raise RuntimeError(
            "The 'groq' package is not installed. Run 'pip install -r requirements.txt'."
        ) from _groq_import_error
    if not settings.GROQ_API_KEY:
        raise RuntimeError("Missing GROQ_API_KEY in environment configuration.")

    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


def extract_response_content(response: Any) -> str:
    """Normalize Groq chat completion content into a plain string."""
    try:
        content = response.choices[0].message.content
    except (AttributeError, IndexError, KeyError) as exc:
        raise RuntimeError("Groq returned an unexpected response payload.") from exc

    if isinstance(content, str):
        text = content.strip()
    elif isinstance(content, list):
        parts: list[str] = []
        for part in content:
            text_part = getattr(part, "text", None)
            if text_part:
                parts.append(text_part)
        text = "".join(parts).strip()
    else:
        text = ""

    if not text:
        raise RuntimeError("Groq returned an empty completion.")
    return text
