"""
Runtime-safe InLegalBERT classification service.

Uses the same InLegalBERT zero-shot pipeline when available, but it does not
crash backend startup if the model cannot be downloaded offline.
"""

from __future__ import annotations

import threading

from config import settings


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
        self._load_error: str | None = None

    def load_model(self):
        """Pre-load the model. Safe to call multiple times."""
        if self._loaded or self._pipeline is not None:
            return

        with self._lock:
            if self._loaded or self._pipeline is not None:
                return

            model_name = settings.INLEGALBERT_MODEL
            print(f"Loading {model_name} for classification ...")

            try:
                from transformers import pipeline

                self._pipeline = pipeline(
                    "zero-shot-classification",
                    model=model_name,
                    device=-1,
                )
                self._loaded = True
                self._load_error = None
                print(f"{model_name} loaded")
            except Exception as exc:
                self._pipeline = None
                self._load_error = str(exc)
                print(
                    f"Could not load {model_name}; continuing without "
                    f"InLegalBERT classification. Error: {exc}"
                )

    def classify(self, text: str, max_chars: int | None = None) -> str:
        """Return the top predicted case label, or 'Others' on fallback."""
        if not self._loaded and self._pipeline is None:
            self.load_model()
        if self._pipeline is None:
            return "Others"

        limit = max_chars or settings.CLASSIFICATION_MAX_CHARS
        truncated = text[:limit]

        try:
            result = self._pipeline(
                truncated,
                candidate_labels=CASE_LABELS,
                hypothesis_template="This is a legal case about {}.",
            )
            return result["labels"][0]
        except Exception as exc:
            print(f"Classification failed: {exc}")
            return "Others"

    def classify_with_scores(self, text: str, max_chars: int | None = None) -> dict:
        """Return all labels with confidence scores, or zeros on fallback."""
        if not self._loaded and self._pipeline is None:
            self.load_model()
        if self._pipeline is None:
            return {label: 0.0 for label in CASE_LABELS}

        limit = max_chars or settings.CLASSIFICATION_MAX_CHARS
        truncated = text[:limit]

        try:
            result = self._pipeline(
                truncated,
                candidate_labels=CASE_LABELS,
                hypothesis_template="This is a legal case about {}.",
            )
            return dict(zip(result["labels"], result["scores"]))
        except Exception as exc:
            print(f"Classification failed: {exc}")
            return {label: 0.0 for label in CASE_LABELS}


classifier = CaseClassifier()
