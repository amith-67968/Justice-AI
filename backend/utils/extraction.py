"""
Text extraction utilities — PDF (PyMuPDF), Image (Tesseract), and regex helpers.
"""

from __future__ import annotations

import io
import re
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

from config import settings


# ── PDF extraction ──────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using PyMuPDF. Falls back to OCR per page if needed."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages: list[str] = []
    for page in doc:
        text = page.get_text("text")
        if text and text.strip():
            pages.append(text.strip())
        else:
            # Attempt OCR on the page rendered as image
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr_text = _ocr_image(img)
            if ocr_text:
                pages.append(ocr_text)
    doc.close()
    return "\n\n".join(pages)


# ── Image extraction ────────────────────────────────────────────────────────

def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image using Tesseract OCR."""
    img = Image.open(io.BytesIO(file_bytes))
    return _ocr_image(img)


def _ocr_image(img: Image.Image) -> str:
    """Run Tesseract OCR on a PIL image."""
    try:
        import pytesseract

        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        return pytesseract.image_to_string(img, lang="eng").strip()
    except Exception as e:
        print(f"⚠️  OCR failed: {e}")
        return ""


# ── Detect file type ────────────────────────────────────────────────────────

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}

def detect_and_extract(filename: str, file_bytes: bytes) -> str:
    """Auto-detect file type and extract text."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in IMAGE_EXTENSIONS:
        return extract_text_from_image(file_bytes)
    else:
        # Try decoding as plain text
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return extract_text_from_pdf(file_bytes)  # fallback


# ── Regex helpers (fallback / supplementary) ────────────────────────────────

_DATE_PATTERNS = [
    r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b",        # DD/MM/YYYY or MM-DD-YY
    r"\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b",           # YYYY-MM-DD
    r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\b",  # 12 Jan 2024
    r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b",  # Jan 12, 2024
]

_MONEY_PATTERNS = [
    r"(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:lakhs?|crores?|lacs?))?",
    r"[\d,]+(?:\.\d{1,2})?\s*(?:rupees|lakhs?|crores?|lacs?)",
]


def extract_dates_regex(text: str) -> list[str]:
    """Extract date strings from text using regex patterns."""
    dates: list[str] = []
    for pattern in _DATE_PATTERNS:
        dates.extend(re.findall(pattern, text, re.IGNORECASE))
    return list(dict.fromkeys(dates))  # dedupe, preserve order


def extract_money_regex(text: str) -> list[str]:
    """Extract monetary values from text using regex patterns."""
    values: list[str] = []
    for pattern in _MONEY_PATTERNS:
        values.extend(re.findall(pattern, text, re.IGNORECASE))
    return list(dict.fromkeys(values))
