"""
RAG-based legal chat service.

Flow: user query → embedding → FAISS vector search → context → LLM → structured response.
Uses LangChain + FAISS with SentenceTransformers embeddings and Groq chat completions.
"""

from __future__ import annotations

import json
import os
import re
import threading
from pathlib import Path
from typing import Any

from config import settings
from utils.embeddings import SentenceTransformerEmbeddings
from utils.llm import (
    JSON_OBJECT_RESPONSE_FORMAT,
    extract_response_content,
    get_groq_client,
)
from utils.prompts import CHAT_SYSTEM, CHAT_USER


_GREETING_TOKENS = {
    "afternoon",
    "evening",
    "good",
    "hello",
    "help",
    "hey",
    "hi",
    "hii",
    "hiii",
    "morning",
    "namaste",
    "there",
    "yo",
}
_LOW_CONTEXT_PROMPTS = {
    "can you help",
    "help",
    "help me",
    "i need help",
    "legal help",
    "need help",
    "need legal help",
}


class RAGService:
    """Manages the vector store and RAG pipeline."""

    _VECTORSTORE_METADATA_FILE = "embedding_metadata.json"

    def __init__(self):
        self._vectorstore = None
        self._lock = threading.Lock()
        self._initialized = False

    def initialize(self):
        """Load or build the FAISS vector store from legal documents."""
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            print("Initializing RAG vector store ...")
            self._build_vectorstore()
            self._initialized = True
            print("RAG vector store ready")

    def _build_vectorstore(self):
        """Build FAISS index from documents in data/ directory."""
        from langchain_community.vectorstores import FAISS
        from langchain.text_splitter import RecursiveCharacterTextSplitter

        embeddings = SentenceTransformerEmbeddings(settings.EMBEDDING_MODEL)
        expected_metadata = self._expected_vectorstore_metadata()

        # Check for persisted index
        index_path = os.path.join(settings.VECTOR_STORE_DIR, "index.faiss")
        if os.path.exists(index_path) and self._has_compatible_vectorstore(expected_metadata):
            print("  Loading persisted FAISS index ...")
            try:
                self._vectorstore = FAISS.load_local(
                    settings.VECTOR_STORE_DIR,
                    embeddings,
                    allow_dangerous_deserialization=True,
                )
                return
            except Exception as exc:
                # Rebuild once if the on-disk index is stale or corrupted.
                print(f"  Existing FAISS index could not be loaded ({exc}); rebuilding ...")
        elif os.path.exists(index_path):
            print("  Existing FAISS index uses a different embedding model; rebuilding ...")

        # Build from documents
        docs = self._load_documents()
        if not docs:
            print("  No documents found; using sample legal data")
            docs = self._sample_legal_data()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.RAG_CHUNK_SIZE,
            chunk_overlap=settings.RAG_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " "],
        )
        chunks = splitter.create_documents(
            [d["text"] for d in docs],
            metadatas=[d.get("metadata", {}) for d in docs],
        )
        print(f"  Created {len(chunks)} chunks from {len(docs)} documents")

        self._vectorstore = FAISS.from_documents(chunks, embeddings)
        # Persist for future startups
        self._vectorstore.save_local(settings.VECTOR_STORE_DIR)
        self._save_vectorstore_metadata(expected_metadata)
        print("  FAISS index saved to disk")

    def _expected_vectorstore_metadata(self) -> dict[str, str]:
        return {
            "provider": "sentence-transformers",
            "model": settings.EMBEDDING_MODEL,
        }

    def _vectorstore_metadata_path(self) -> Path:
        return Path(settings.VECTOR_STORE_DIR) / self._VECTORSTORE_METADATA_FILE

    def _has_compatible_vectorstore(self, expected_metadata: dict[str, str]) -> bool:
        metadata_path = self._vectorstore_metadata_path()
        if not metadata_path.exists():
            return False

        try:
            current_metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return False

        return current_metadata == expected_metadata

    def _save_vectorstore_metadata(self, metadata: dict[str, str]):
        metadata_path = self._vectorstore_metadata_path()
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    def _load_documents(self) -> list[dict]:
        """Load .txt and .md files from the data/ directory."""
        docs = []
        data_dir = Path(settings.DATA_DIR)
        if not data_dir.exists():
            return docs

        for f in data_dir.iterdir():
            if f.suffix in (".txt", ".md"):
                text = f.read_text(encoding="utf-8", errors="ignore")
                if text.strip():
                    docs.append({
                        "text": text,
                        "metadata": {"source": f.name},
                    })
        return docs

    def _sample_legal_data(self) -> list[dict]:
        """Provide sample Indian legal data for demo purposes."""
        samples = [
            {
                "text": """
Consumer Protection Act, 2019 — Key Provisions

Section 2(7) — Consumer: Any person who buys goods or hires services for consideration.
Does not include a person who obtains goods for resale or commercial purposes.

Section 2(11) — Defect: Any fault, imperfection or shortcoming in the quality,
quantity, potency, purity or standard required under any law.

Section 2(12) — Deficiency: Any fault, imperfection, shortcoming or inadequacy
in quality, nature and manner of performance.

Section 35 — Jurisdiction of District Commission: Complaints where value of goods
or services does not exceed Rs. 1 crore.

Section 36 — Manner of filing complaint: Complaint can be filed by the consumer,
any voluntary consumer association, the Central or State Government, or one or
more consumers with same interest.

Section 38 — Procedure on admission of complaint: Issue notice to opposite party
within 21 days. Opposite party shall respond within 30 days (extendable by 15 days).

Section 39 — Procedure for hearing: Commission shall decide complaint within
3 months (5 months if testing required).

Section 69 — Product Liability: A manufacturer/seller is liable if a product
causes harm due to manufacturing defect, design defect, or deviation from
manufacturing specifications.

Time Limit: Complaint must be filed within 2 years from the date of cause of action.
""",
                "metadata": {"source": "consumer_protection_act_2019.txt"},
            },
            {
                "text": """
Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS) — Common Offences

Section 420 IPC (Section 318 BNS) — Cheating and Dishonestly Inducing Delivery of Property:
Punishment: Imprisonment up to 7 years and fine.
Elements: Deception, fraudulent or dishonest inducement, delivery of property.

Section 406 IPC (Section 316 BNS) — Criminal Breach of Trust:
Punishment: Imprisonment up to 3 years, or fine, or both.
Applies when property is entrusted and then misappropriated.

Section 498A IPC (Section 84-86 BNS) — Cruelty by Husband or Relatives:
Punishment: Imprisonment up to 3 years and fine.
Covers physical and mental cruelty, dowry harassment.
Non-bailable, cognizable offence.

Section 354 IPC (Section 74 BNS) — Assault or Criminal Force to Woman with Intent to Outrage Modesty:
Punishment: 1 to 5 years imprisonment and fine.

Section 302 IPC (Section 101 BNS) — Murder:
Punishment: Death or life imprisonment and fine.

FIR Filing Process:
1. Visit nearest police station
2. File complaint (oral or written)
3. Police must register FIR for cognizable offences (Section 154 CrPC / Section 173 BNSS)
4. If police refuse, complaint to Magistrate under Section 156(3) CrPC / Section 175(3) BNSS
5. Zero FIR can be filed at any police station regardless of jurisdiction
""",
                "metadata": {"source": "ipc_bns_common_offences.txt"},
            },
            {
                "text": """
Information Technology Act, 2000 — Cyber Crime Provisions

Section 43 — Penalty for damage to computer, computer system: Compensation up to Rs. 5 crores.

Section 65 — Tampering with computer source documents: Imprisonment up to 3 years or fine up to Rs. 2 lakhs.

Section 66 — Computer related offences (hacking): Imprisonment up to 3 years or fine up to Rs. 5 lakhs.

Section 66A — (Struck down by Supreme Court in Shreya Singhal v. Union of India, 2015)

Section 66B — Punishment for dishonestly receiving stolen computer resource: Imprisonment up to 3 years or fine up to Rs. 1 lakh.

Section 66C — Identity theft: Imprisonment up to 3 years and fine up to Rs. 1 lakh.

Section 66D — Cheating by personation using computer resource: Imprisonment up to 3 years and fine up to Rs. 1 lakh.

Section 66E — Violation of privacy (capturing/publishing private images): Imprisonment up to 3 years or fine up to Rs. 2 lakhs.

Section 67 — Publishing obscene material electronically: First conviction — up to 3 years and Rs. 5 lakhs fine.

Section 67A — Publishing sexually explicit material: First conviction — up to 5 years and Rs. 10 lakhs fine.

Section 67B — Publishing child pornography: First conviction — up to 5 years and Rs. 10 lakhs fine.

Cyber Crime Reporting:
1. File complaint at cybercrime.gov.in (National Cyber Crime Reporting Portal)
2. Call 1930 (Cyber Crime Helpline)
3. File FIR at local police station (Cyber Crime Cell)
4. Preserve all digital evidence (screenshots, emails, transaction records)
""",
                "metadata": {"source": "it_act_2000_cybercrime.txt"},
            },
            {
                "text": """
Rent Control and Tenancy Laws in India

Transfer of Property Act, 1882:
Section 105 — Lease defined: Transfer of right to enjoy property for a certain time.
Section 106 — Duration and termination: Agricultural lease year-to-year; other leases month-to-month; 15 days notice required.
Section 107 — Lease must be registered if for period exceeding one year.
Section 108 — Rights and liabilities of lessor and lessee.
Section 111 — Determination (termination) of lease: By efflux of time, event, forfeiture, surrender.

Tenant Rights:
- Cannot be evicted without due process of law
- Entitled to essential services (water, electricity)
- Right to fair rent (not exceeding statutory limits)
- Protection against arbitrary rent increase
- Right to receipt for rent paid

Landlord Rights:
- Eviction for non-payment of rent (after due notice)
- Eviction for personal/bona fide need
- Eviction for subletting without consent
- Eviction for causing damage to property
- Right to reasonable rent revision

Eviction Process:
1. Serve written notice (15-30 days depending on state)
2. If tenant does not vacate, file suit in Rent Controller/Civil Court
3. Court will hear both parties
4. Eviction order only for grounds specified in law

Model Tenancy Act, 2021 (Central Government):
- Security deposit capped at 2 months rent
- Rent revision not before 3 years
- Landlord must give 3 months notice for vacating
- Tenant must give 2 months notice before leaving
""",
                "metadata": {"source": "rent_tenancy_laws.txt"},
            },
            {
                "text": """
Civil Procedure and Legal Remedies in India

Code of Civil Procedure (CPC), 1908 / BNSS, 2023:

Filing a Civil Suit:
1. Determine jurisdiction (territorial and pecuniary)
2. Pay court fees (based on claim value)
3. File plaint in appropriate court
4. Court issues summons to defendant
5. Written statement by defendant within 30 days (extendable to 120 days)
6. Framing of issues
7. Evidence and hearing
8. Judgment

Court Hierarchy:
- District Court (up to specified value; varies by state)
- High Court (original and appellate jurisdiction)
- Supreme Court (appeal by Special Leave under Article 136)

Limitation Periods (Limitation Act, 1963):
- Suit for recovery of money: 3 years
- Suit for possession of immovable property: 12 years
- Suit for breach of contract: 3 years
- Suit for specific performance: 3 years
- Suit for damages (tort): 1 year

Alternative Dispute Resolution:
- Arbitration (Arbitration and Conciliation Act, 1996)
  - Binding, faster, flexible procedure
  - Award enforceable as court decree
- Mediation
  - Non-binding, parties mutually settle
- Lok Adalat
  - No court fees, decision is final, no appeal
  - Cases up to Rs. 1 crore in Permanent Lok Adalat

Legal Aid:
- Free legal aid under Legal Services Authorities Act, 1987
- Eligible: SC/ST, women, children, persons with disability, industrial workers
- National Legal Services Authority (NALSA): nalsa.gov.in
- District Legal Services Authority for local matters
""",
                "metadata": {"source": "civil_procedure_remedies.txt"},
            },
        ]

        # Also save to data/ for persistence
        data_dir = Path(settings.DATA_DIR)
        data_dir.mkdir(parents=True, exist_ok=True)
        for s in samples:
            fpath = data_dir / s["metadata"]["source"]
            if not fpath.exists():
                fpath.write_text(s["text"].strip(), encoding="utf-8")

        return samples

    def search(self, query: str, k: int | None = None) -> list[dict]:
        """Search the vector store and return relevant chunks."""
        if not self._initialized:
            self.initialize()

        if self._vectorstore is None:
            return []

        top_k = k or settings.RAG_TOP_K

        results = self._vectorstore.similarity_search_with_score(query, k=top_k)
        return [
            {
                "content": doc.page_content,
                "source": doc.metadata.get("source", "unknown"),
                "score": float(score),
            }
            for doc, score in results
        ]

    def _normalize_query(self, query: str) -> str:
        normalized = re.sub(r"[^a-z0-9\s]", " ", query.lower())
        return " ".join(normalized.split())

    def _should_skip_rag(self, query: str) -> bool:
        normalized = self._normalize_query(query)
        if not normalized:
            return True

        if normalized in _LOW_CONTEXT_PROMPTS:
            return True

        tokens = normalized.split()
        return len(tokens) <= 4 and all(token in _GREETING_TOKENS for token in tokens)

    def _greeting_response(self) -> dict[str, Any]:
        return {
            "answer": (
                "Hello. Tell me your legal issue in 1 or 2 sentences and I will help you "
                "with the relevant laws, explanation, and next steps."
            ),
            "relevant_laws": [],
            "explanation": "",
            "why_applicable": "",
            "next_steps": [
                "Describe the problem, the people involved, and what happened.",
                "Include important dates, money amounts, notices, or documents if you have them.",
            ],
            "sources": [],
        }

    async def chat(self, query: str) -> dict[str, Any]:
        """Full RAG pipeline: search → context → LLM → structured response."""
        if self._should_skip_rag(query):
            return self._greeting_response()

        # Vector search
        results = self.search(query)
        context = "\n\n---\n\n".join(
            f"[Source: {r['source']}]\n{r['content']}" for r in results
        ) or "No relevant legal context found in the knowledge base."

        sources = list({r["source"] for r in results})

        # LLM call
        client = get_groq_client()
        try:
            resp = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": CHAT_SYSTEM},
                    {"role": "user", "content": CHAT_USER.format(
                        query=query, context=context
                    )},
                ],
                temperature=0.2,
                max_completion_tokens=2000,
                response_format=JSON_OBJECT_RESPONSE_FORMAT,
            )
            content = extract_response_content(resp)
            content = _strip_json_fences(content)
            result = json.loads(content)
            # Ensure sources from vector search are included
            if "sources" not in result or not result["sources"]:
                result["sources"] = sources
            return result
        except (json.JSONDecodeError, Exception) as e:
            print(f"⚠️  RAG chat failed: {e}")
            return {
                "answer": "I apologize, but I'm having trouble processing your question right now. Please try again.",
                "relevant_laws": [],
                "explanation": "",
                "why_applicable": "",
                "next_steps": ["Please rephrase your question and try again",
                               "Consult a qualified legal professional for urgent matters"],
                "sources": sources,
            }


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


# Module-level singleton
rag = RAGService()
