"""
POST /analyze — Case analysis endpoint.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.analysis_service import analyze_case

router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Flexible analysis request — accepts the output from /upload directly."""
    structured_data: dict = Field(..., description="Structured extraction from /upload")
    documents: Optional[list[dict]] = Field(None, description="Multiple document extractions")
    raw_text: Optional[str] = Field(None, description="Original raw text (optional)")


@router.post("")
async def analyze(request: AnalyzeRequest):
    """
    Analyze a case using structured document data.
    Pipeline: rule engine → LLM final analysis.
    """
    try:
        result = await analyze_case(
            structured_data=request.structured_data,
            documents=request.documents,
            raw_text=request.raw_text,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
