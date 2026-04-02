"""Supabase queries for storing and reading classified documents."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from config import settings
from database.supabase_client import get_supabase_client

DOCUMENT_COLUMNS = "id, text, case_type, strength, created_at"
DEFAULT_BATCH_SIZE = 1000


class DatabaseOperationError(RuntimeError):
    """Raised when a Supabase query cannot be completed."""


def insert_document_record(text: str, case_type: str, strength: str) -> dict[str, Any]:
    """Insert one classified document row."""
    payload = {
        "text": text,
        "case_type": case_type,
        "strength": strength,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        response = (
            get_supabase_client()
            .table(settings.SUPABASE_DOCUMENTS_TABLE)
            .insert(payload)
            .execute()
        )
    except Exception as exc:  # pragma: no cover - depends on network/Supabase state
        raise DatabaseOperationError("Failed to insert the classified document into Supabase.") from exc

    data = getattr(response, "data", None)
    if not data:
        return payload

    return data[0] if isinstance(data, list) else data


def fetch_all_document_records(batch_size: int = DEFAULT_BATCH_SIZE) -> list[dict[str, Any]]:
    """Fetch all stored document rows ordered by newest first."""
    if batch_size <= 0:
        raise ValueError("batch_size must be greater than zero.")

    documents: list[dict[str, Any]] = []
    start = 0
    client = get_supabase_client()

    try:
        while True:
            response = (
                client.table(settings.SUPABASE_DOCUMENTS_TABLE)
                .select(DOCUMENT_COLUMNS)
                .order("created_at", desc=True)
                .range(start, start + batch_size - 1)
                .execute()
            )
            batch = list(getattr(response, "data", None) or [])
            documents.extend(batch)

            if len(batch) < batch_size:
                break

            start += batch_size
    except Exception as exc:  # pragma: no cover - depends on network/Supabase state
        raise DatabaseOperationError("Failed to fetch stored documents from Supabase.") from exc

    return documents
