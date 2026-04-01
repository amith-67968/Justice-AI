# JusticeAI — AI-Powered Legal Assistance Platform

> India-focused legal AI assistant with document intelligence, case analysis, and RAG-based legal chat.

## Quick Start

### 1. Prerequisites

- **Python 3.11+**
- **OpenAI API key** (GPT-4o-mini recommended for cost/speed)
- **Tesseract OCR** (optional — for image-based document processing)

### 2. Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Edit `.env` and set your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Run

```bash
python main.py
```

Server starts at **http://localhost:8000**

### 4. Test

```bash
# With server running in another terminal:
python test_api.py
```

---

## API Endpoints

| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | `/health`          | Health check                         |
| POST   | `/chat`            | RAG-based legal chat                 |
| POST   | `/upload`          | Upload & process legal documents     |
| POST   | `/analyze`         | Full case analysis with rule engine  |
| POST   | `/extract-events`  | Extract dates and events from text   |

### Interactive Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Architecture

```
User Request
    │
    ├─► /chat ──────────► RAG (FAISS + OpenAI Embeddings) ──► LLM ──► Structured Response
    │
    ├─► /upload ────────► Text Extraction (PyMuPDF / Tesseract)
    │                         │
    │                         ├──► LLM Structured Extraction (single call)
    │                         └──► InLegalBERT Classification
    │
    ├─► /analyze ───────► Rule Engine (deterministic flags)
    │                         │
    │                         └──► LLM Final Analysis (single call)
    │
    └─► /extract-events ► LLM Event Extraction (with regex fallback)
```

### Key Design Decisions

- **Max 2 LLM calls per pipeline** — fast demo response
- **InLegalBERT only for classification** — lightweight, focused
- **FAISS in-memory** — no external DB dependency
- **Deterministic JSON prompts** — reliable structured output
- **Rule engine** — interpretable flags that adjust confidence

---

## Project Structure

```
backend/
├── main.py                     # FastAPI app + lifespan
├── config.py                   # Settings from .env
├── requirements.txt
├── .env.example
├── test_api.py                 # End-to-end test script
├── sample_requests.json        # API reference with examples
│
├── routes/
│   ├── chat.py                 # POST /chat
│   ├── upload.py               # POST /upload
│   ├── analyze.py              # POST /analyze
│   └── events.py               # POST /extract-events
│
├── services/
│   ├── rag_service.py          # FAISS vector store + RAG pipeline
│   ├── document_service.py     # Text extraction + LLM structured extraction
│   ├── analysis_service.py     # Rule engine + LLM case analysis
│   └── classification_service.py # InLegalBERT zero-shot classifier
│
├── utils/
│   ├── prompts.py              # All LLM prompt templates
│   └── extraction.py           # PDF/Image text extraction + regex helpers
│
├── models/
│   └── schemas.py              # Pydantic request/response models
│
├── data/                       # Legal knowledge base (auto-populated)
├── uploads/                    # Uploaded files (auto-created)
└── vector_store/               # FAISS index (auto-created)
```

---

## Sample Usage

### Chat
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_query": "What are my rights if my landlord refuses to return my security deposit?"}'
```

### Upload Document
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@complaint.pdf"
```

### Analyze Case
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"structured_data": {"document_type": "Consumer Complaint", "case_type": "Consumer Dispute", ...}}'
```

### Extract Events
```bash
curl -X POST http://localhost:8000/extract-events \
  -H "Content-Type: application/json" \
  -d '{"text": "The agreement was signed on 10th January 2024. Hearing on 20/05/2024."}'
```

---

## Tech Stack

| Component          | Technology                       |
|--------------------|----------------------------------|
| Framework          | FastAPI                          |
| LLM                | OpenAI (GPT-4o-mini)            |
| RAG                | LangChain + FAISS               |
| Embeddings         | OpenAI text-embedding-3-small   |
| PDF Extraction     | PyMuPDF                         |
| OCR Fallback       | Tesseract                        |
| Classification     | InLegalBERT (zero-shot)         |
| Data Validation    | Pydantic v2                      |
