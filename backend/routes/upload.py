"""
POST /upload — Document upload and processing endpoint.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException

from config import settings
from services.document_service import process_document

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp", ".txt"}


@router.post("")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a legal document (PDF or image).
    Pipeline: extract text → LLM structured extraction → InLegalBERT classification.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read file
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB} MB.")

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # Process
    try:
        result = await process_document(file.filename, file_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")
