"""
InLegalBERT-based case type classification service.

Uses a zero-shot classification pipeline with InLegalBERT to categorize
legal text into one of five case types. Model name loaded from .env.
"""

from __future__ import annotations

import threading

from config import settings


# Case type labels
CASE_LABELS = [
    "Consumer Dispute",
    "Civil Dispute",
    "Criminal",
    "Cyber Crime",
    "Others",
]


class CaseClassifier:
    """Lazy-loaded InLegalBERT classifier (singleton)."""

    def __init__(self):
        self._pipeline = None
        self._lock = threading.Lock()
        self._loaded = False

    def load_model(self):
        """Pre-load the model. Safe to call multiple times."""
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            model_name = settings.INLEGALBERT_MODEL
            print(f"⏳  Loading {model_name} for classification …")
            from transformers import pipeline

            self._pipeline = pipeline(
                "zero-shot-classification",
                model=model_name,
                device=-1,  # CPU
            )
            self._loaded = True
            print(f"✅  {model_name} loaded")

    def classify(self, text: str, max_chars: int | None = None) -> str:
        """
        Classify text into one of the predefined case types.
        Returns the label with the highest confidence.
        """
        if not self._loaded:
            self.load_model()

        limit = max_chars or settings.CLASSIFICATION_MAX_CHARS
        truncated = text[:limit]

        try:
            result = self._pipeline(
                truncated,
                candidate_labels=CASE_LABELS,
                hypothesis_template="This is a legal case about {}.",
            )
            return result["labels"][0]  # highest scoring label
        except Exception as e:
            print(f"⚠️  Classification failed: {e}")
            return "Others"

    def classify_with_scores(self, text: str, max_chars: int | None = None) -> dict:
        """Return all labels with confidence scores."""
        if not self._loaded:
            self.load_model()

        limit = max_chars or settings.CLASSIFICATION_MAX_CHARS
        truncated = text[:limit]

        try:
            result = self._pipeline(
                truncated,
                candidate_labels=CASE_LABELS,
                hypothesis_template="This is a legal case about {}.",
            )
            return dict(zip(result["labels"], result["scores"]))
        except Exception as e:
            print(f"⚠️  Classification failed: {e}")
            return {label: 0.0 for label in CASE_LABELS}


# Module-level singleton
classifier = CaseClassifier()
