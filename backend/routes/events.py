"""
POST /extract-events — Date and event extraction endpoint.
"""

import json

from fastapi import APIRouter, HTTPException

from models.schemas import EventExtractionRequest, EventExtractionResponse, EventItem
from config import settings
from utils.llm import get_openai_client
from utils.prompts import EVENT_EXTRACTION_SYSTEM, EVENT_EXTRACTION_USER
from utils.extraction import extract_dates_regex

router = APIRouter()


@router.post("", response_model=EventExtractionResponse)
async def extract_events(request: EventExtractionRequest):
    """Extract dates and events from legal text."""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Try LLM extraction first
    try:
        result = await _llm_extract_events(text)
        if result.get("events"):
            return EventExtractionResponse(
                events=[EventItem(**e) for e in result["events"]]
            )
    except Exception as e:
        print(f"⚠️  LLM event extraction failed, using regex fallback: {e}")

    # Regex fallback
    dates = extract_dates_regex(text)
    events = [EventItem(date=d, description="Date found in document") for d in dates]
    return EventExtractionResponse(events=events)


async def _llm_extract_events(text: str) -> dict:
    """Use LLM to extract structured events from text."""
    client = get_openai_client()
    truncated = text[:settings.MAX_EXTRACTION_CHARS]

    resp = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": EVENT_EXTRACTION_SYSTEM},
            {"role": "user", "content": EVENT_EXTRACTION_USER.format(text=truncated)},
        ],
        temperature=0.0,
        max_tokens=1500,
    )
    content = resp.choices[0].message.content.strip()
    content = _strip_json_fences(content)
    return json.loads(content)


def _strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        else:
            lines = lines[1:]
        text = "\n".join(lines)
    return text.strip()
