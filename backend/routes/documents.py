"""Routes for reading stored classified documents."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models.schemas import StoredDocumentsResponse
from services.document_service import DocumentStorageError, fetch_all_stored_documents

router = APIRouter()


@router.get("", response_model=StoredDocumentsResponse)
async def list_documents():
    try:
        documents = await fetch_all_stored_documents()
        return {"documents": documents, "count": len(documents)}
    except DocumentStorageError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
