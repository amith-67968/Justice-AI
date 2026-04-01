"""
Document processing service — extracts text + structured JSON from uploaded files.
Orchestrates: text extraction → LLM structured extraction → InLegalBERT classification.
"""

from __future__ import annotations

import json
from typing import Any

from config import settings
from utils.llm import (
    JSON_OBJECT_RESPONSE_FORMAT,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import EXTRACTION_SYSTEM, EXTRACTION_USER
from utils.extraction import detect_and_extract, extract_dates_regex, extract_money_regex
from services.classification_service import classifier


async def process_document(filename: str, file_bytes: bytes) -> dict[str, Any]:
    """
    Full document pipeline:
    1. Extract raw text (PDF / Image / plain text)
    2. LLM structured extraction (single call)
    3. InLegalBERT case classification
    4. Merge regex fallback dates/money
    """

    # ── Step 1: Text extraction ────────────────────────────────────────────
    raw_text = detect_and_extract(filename, file_bytes)
    if not raw_text.strip():
        return {
            "filename": filename,
            "extracted_text": "",
            "structured_data": _empty_extraction(),
            "message": "Could not extract text from the uploaded file.",
        }

    # ── Step 2: LLM structured extraction ──────────────────────────────────
    structured = await _llm_extract(raw_text)

    # ── Step 3: InLegalBERT classification ─────────────────────────────────
    import asyncio
    loop = asyncio.get_running_loop()
    case_type = await loop.run_in_executor(None, classifier.classify, raw_text)

    # Attach case_type to every document entry
    for doc in structured.get("documents", []):
        doc["case_type"] = case_type

    # ── Step 4: Merge regex fallback ───────────────────────────────────────
    _enrich_with_regex(structured, raw_text)

    # Build the flat extraction dict matching StructuredExtraction schema
    first_doc = structured["documents"][0] if structured.get("documents") else {}
    flat = {
        "document_type": first_doc.get("document_type", ""),
        "parties": first_doc.get("parties", []),
        "dates": first_doc.get("dates", []),
        "monetary_values": first_doc.get("monetary_values", []),
        "key_clauses": first_doc.get("key_clauses", []),
        "missing_elements": first_doc.get("missing_elements", []),
        "evidence_strength": first_doc.get("evidence_strength", ""),
        "reason": first_doc.get("reason", ""),
        "case_type": case_type,
    }

    return {
        "filename": filename,
        "extracted_text": raw_text,
        "structured_data": flat,
        "documents": structured.get("documents", []),
        "message": "Document processed successfully",
    }


async def _llm_extract(text: str) -> dict:
    """Single LLM call to extract structured JSON from document text."""
    client = get_groq_client()

    # Truncate very long documents using config limit
    truncated = text[:settings.MAX_EXTRACTION_CHARS]

    try:
        resp = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM},
                {"role": "user", "content": EXTRACTION_USER.format(text=truncated)},
            ],
            temperature=0.0,
            max_completion_tokens=2000,
            response_format=JSON_OBJECT_RESPONSE_FORMAT,
        )
        content = extract_response_content(resp)
        content = _strip_json_fences(content)
        return json.loads(content)
    except (json.JSONDecodeError, Exception) as e:
        print(f"⚠️  LLM extraction failed: {e}")
        return {"documents": []}


def _enrich_with_regex(structured: dict, raw_text: str):
    """Merge regex-extracted dates and money into the structured output."""
    regex_dates = extract_dates_regex(raw_text)
    regex_money = extract_money_regex(raw_text)

    for doc in structured.get("documents", []):
        existing_dates = set(doc.get("dates", []))
        for d in regex_dates:
            if d not in existing_dates:
                doc.setdefault("dates", []).append(d)
        existing_money = set(doc.get("monetary_values", []))
        for m in regex_money:
            if m not in existing_money:
                doc.setdefault("monetary_values", []).append(m)


def _empty_extraction() -> dict:
    return {
        "document_type": "",
        "parties": [],
        "dates": [],
        "monetary_values": [],
        "key_clauses": [],
        "missing_elements": [],
        "evidence_strength": "",
        "reason": "",
        "case_type": "",
    }


def _strip_json_fences(text: str) -> str:
    """Remove ```json ... ``` fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        else:
            lines = lines[1:]
        text = "\n".join(lines)
    return text.strip()
