"""
InLegalBERT-based case type classification service.

Uses a zero-shot classification pipeline with InLegalBERT to categorize
legal text into one of five case types. Model name loaded from .env.
"""

from __future__ import annotations

import threading
import warnings

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
        self._load_error: str | None = None

    def load_model(self):
        """Pre-load the model. Safe to call multiple times."""
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            model_name = settings.INLEGALBERT_MODEL
            print(f"Loading {model_name} for classification ...")
            try:
                from transformers import pipeline

                self._pipeline = pipeline(
                    "zero-shot-classification",
                    model=model_name,
                    device=-1,  # CPU
                )
                self._loaded = True
                self._load_error = None
                print(f"{model_name} loaded")
            except Exception as e:
                self._pipeline = None
                self._load_error = str(e)
                print(
                    f"âš ï¸  Could not load {model_name}; continuing without "
                    f"InLegalBERT classification. Error: {e}"
                )
                return

    def classify(self, text: str, max_chars: int | None = None) -> str:
        """
        Classify text into one of the predefined case types.
        Returns the label with the highest confidence.
        """
        if not self._loaded:
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
            return result["labels"][0]  # highest scoring label
        except Exception as e:
            print(f"⚠️  Classification failed: {e}")
            return "Others"

    def classify_with_scores(self, text: str, max_chars: int | None = None) -> dict:
        """Return all labels with confidence scores."""
        if not self._loaded:
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
        except Exception as e:
            print(f"⚠️  Classification failed: {e}")
            return {label: 0.0 for label in CASE_LABELS}


# Module-level singleton
classifier = CaseClassifier()


# Canonical InLegalBERT implementation. This overrides the legacy zero-shot
# version above, which is left in place only to avoid risky file-level churn.

CASE_LABEL_PROTOTYPES = {
    "Consumer Dispute": (
        "A consumer dispute involving defective goods, deficient services, refund "
        "claims, warranty issues, billing disputes, seller liability, or "
        "compensation under consumer protection law."
    ),
    "Civil Dispute": (
        "A civil dispute involving contracts, property, tenancy, leases, money "
        "recovery, injunctions, agreements, specific performance, or damages."
    ),
    "Criminal": (
        "A criminal matter involving an FIR, police complaint, arrest, assault, "
        "theft, cheating, breach of trust, intimidation, or another criminal offence."
    ),
    "Cyber Crime": (
        "A cyber crime matter involving online fraud, phishing, hacking, identity "
        "theft, data misuse, OTP scams, digital impersonation, or social media abuse."
    ),
    "Others": (
        "A legal issue that does not clearly fit consumer, civil, criminal, or "
        "cyber crime categories."
    ),
}

CASE_KEYWORD_HINTS = {
    "Consumer Dispute": (
        "consumer",
        "defect",
        "defective",
        "refund",
        "warranty",
        "invoice",
        "receipt",
        "seller",
        "buyer",
        "service",
        "compensation",
    ),
    "Civil Dispute": (
        "agreement",
        "contract",
        "breach",
        "property",
        "tenant",
        "landlord",
        "lease",
        "rent",
        "injunction",
        "damages",
        "specific performance",
    ),
    "Criminal": (
        "fir",
        "police",
        "accused",
        "arrest",
        "bail",
        "cheating",
        "theft",
        "assault",
        "criminal",
        "offence",
        "offense",
    ),
    "Cyber Crime": (
        "cyber",
        "online fraud",
        "phishing",
        "hacking",
        "hack",
        "identity theft",
        "otp",
        "digital",
        "email scam",
        "social media",
        "data breach",
    ),
    "Others": (),
}

SIMILARITY_TEMPERATURE = 0.15
LOW_CONFIDENCE_PROBABILITY = 0.45
LOW_CONFIDENCE_SIMILARITY = 0.30


class CaseClassifier:
    """InLegalBERT encoder-based classifier."""

    def __init__(self):
        self._tokenizer = None
        self._model = None
        self._torch = None
        self._label_embeddings = None
        self._lock = threading.Lock()
        self._loaded = False
        self._load_attempted = False
        self._load_error: str | None = None

    def load_model(self):
        """Pre-load the model. Safe to call multiple times."""
        if self._loaded and self._model is not None and self._label_embeddings is not None:
            return
        if self._load_attempted and self._model is None:
            return

        with self._lock:
            if self._loaded and self._model is not None and self._label_embeddings is not None:
                return
            if self._load_attempted and self._model is None:
                return

            model_name = settings.INLEGALBERT_MODEL
            print(f"Loading {model_name} for classification ...")

            try:
                import torch
                from transformers import AutoModel, AutoTokenizer
                from transformers import logging as hf_logging

                hf_logging.set_verbosity_error()
                warnings.filterwarnings(
                    "ignore",
                    message="`clean_up_tokenization_spaces` was not set.*",
                    category=FutureWarning,
                )
                self._load_attempted = True

                self._torch = torch
                try:
                    self._tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
                    self._model = AutoModel.from_pretrained(model_name, local_files_only=True)
                except Exception:
                    self._tokenizer = AutoTokenizer.from_pretrained(model_name)
                    self._model = AutoModel.from_pretrained(model_name)
                if hasattr(self._tokenizer, "clean_up_tokenization_spaces"):
                    self._tokenizer.clean_up_tokenization_spaces = False
                self._model.eval()
                self._label_embeddings = self._encode_texts(
                    [CASE_LABEL_PROTOTYPES[label] for label in CASE_LABELS],
                    max_length=256,
                )
                self._loaded = True
                self._load_error = None
                print(f"{model_name} loaded")
            except Exception as exc:
                self._tokenizer = None
                self._model = None
                self._torch = None
                self._label_embeddings = None
                self._loaded = False
                self._load_error = str(exc)
                print(
                    f"Could not load {model_name}; continuing without "
                    f"InLegalBERT classification. Error: {exc}"
                )

    def classify(self, text: str, max_chars: int | None = None) -> str:
        scores = self.classify_with_scores(text, max_chars=max_chars)
        if not scores:
            return "Others"
        top_label, top_score = max(scores.items(), key=lambda item: item[1])
        return top_label if top_score > 0.0 else "Others"

    def classify_with_scores(self, text: str, max_chars: int | None = None) -> dict[str, float]:
        if not self._loaded or self._model is None or self._label_embeddings is None:
            self.load_model()
        if self._model is None or self._label_embeddings is None or self._torch is None:
            return {label: 0.0 for label in CASE_LABELS}

        limit = max_chars or settings.CLASSIFICATION_MAX_CHARS
        truncated = self._prepare_text(text[:limit])
        if not truncated:
            return {label: 0.0 for label in CASE_LABELS}

        try:
            text_embedding = self._encode_texts([truncated], max_length=512)
            similarities = self._torch.matmul(text_embedding, self._label_embeddings.T).squeeze(0)
            keyword_boosts = self._keyword_boosts(truncated)
            logits = (similarities + keyword_boosts) / SIMILARITY_TEMPERATURE
            probabilities = self._torch.softmax(logits, dim=0)

            score_map = {
                label: float(probabilities[index].item())
                for index, label in enumerate(CASE_LABELS)
            }

            top_index = int(self._torch.argmax(probabilities).item())
            top_label = CASE_LABELS[top_index]
            top_probability = float(probabilities[top_index].item())
            top_similarity = float(similarities[top_index].item())
            top_boost = float(keyword_boosts[top_index].item())

            if (
                top_label != "Others"
                and top_probability < LOW_CONFIDENCE_PROBABILITY
                and top_similarity < LOW_CONFIDENCE_SIMILARITY
                and top_boost == 0.0
            ):
                score_map["Others"] = max(score_map["Others"], top_probability)
                score_map[top_label] = min(score_map[top_label], score_map["Others"])

            return dict(sorted(score_map.items(), key=lambda item: item[1], reverse=True))
        except Exception as exc:
            print(f"Classification failed: {exc}")
            return {label: 0.0 for label in CASE_LABELS}

    def _encode_texts(self, texts: list[str], max_length: int) -> object:
        if self._tokenizer is None or self._model is None or self._torch is None:
            raise RuntimeError("InLegalBERT encoder is not loaded.")

        encoded = self._tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )

        with self._torch.no_grad():
            outputs = self._model(**encoded)

        token_embeddings = outputs.last_hidden_state
        attention_mask = encoded["attention_mask"].unsqueeze(-1).type_as(token_embeddings)
        masked_embeddings = token_embeddings * attention_mask
        sentence_embeddings = masked_embeddings.sum(dim=1) / attention_mask.sum(dim=1).clamp(min=1.0)
        return self._torch.nn.functional.normalize(sentence_embeddings, p=2, dim=1)

    def _keyword_boosts(self, text: str) -> object:
        if self._torch is None or self._label_embeddings is None:
            raise RuntimeError("Torch is not available for keyword scoring.")

        lowered = text.lower()
        boosts = []
        for label in CASE_LABELS:
            hints = CASE_KEYWORD_HINTS[label]
            matches = sum(1 for hint in hints if hint in lowered)
            boosts.append(min(0.40, matches * 0.08))
        return self._torch.tensor(boosts, dtype=self._label_embeddings.dtype)

    @staticmethod
    def _prepare_text(text: str) -> str:
        normalized = " ".join(text.split())
        if not normalized:
            return ""
        return f"Legal case summary: {normalized}"


classifier = CaseClassifier()
