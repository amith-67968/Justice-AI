"""
Case analysis service — rule engine + LLM final analysis.

Pipeline:
1. Apply lightweight deterministic rules
2. Single LLM call for comprehensive case assessment
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
from utils.prompts import ANALYSIS_SYSTEM, ANALYSIS_USER


# ── Rule Engine ─────────────────────────────────────────────────────────────

def apply_rules(structured_data: dict, documents: list[dict] | None = None) -> dict:
    """
    Lightweight deterministic rule engine.
    Returns rule_flags and a preliminary_score adjustment.
    """
    flags: list[str] = []
    score_adj = 0  # adjustment to confidence (-10 to +10 per rule)

    all_docs = documents or [structured_data]

    for doc in all_docs:
        missing = [m.lower() for m in doc.get("missing_elements", [])]
        key_clauses = [c.lower() for c in doc.get("key_clauses", [])]
        doc_type = doc.get("document_type", "").lower()
        monetary = doc.get("monetary_values", [])

        # ── Missing elements rules ─────────────────────────────────────
        if any("signature" in m for m in missing):
            flags.append("MISSING_SIGNATURE: Document lacks signature — reduces evidentiary value")
            score_adj -= 10

        if any("stamp" in m for m in missing):
            flags.append("MISSING_STAMP: Document not stamped — may affect validity")
            score_adj -= 5

        if any("date" in m for m in missing):
            flags.append("MISSING_DATE: No date found — timeline difficult to establish")
            score_adj -= 5

        if any("witness" in m for m in missing):
            flags.append("MISSING_WITNESS: No witness signature — may weaken enforceability")
            score_adj -= 5

        if any("notari" in m for m in missing):
            flags.append("NOT_NOTARIZED: Document not notarized — may challenge authenticity")
            score_adj -= 5

        # ── Positive evidence rules ────────────────────────────────────
        if any("payment" in c or "receipt" in c or "transaction" in c for c in key_clauses):
            flags.append("PAYMENT_PROOF: Payment/receipt documentation found — strengthens claim")
            score_adj += 10

        if "fir" in doc_type:
            flags.append("FIR_FILED: FIR filing documented — strong procedural step")
            score_adj += 10

        if "court order" in doc_type or "judgment" in doc_type:
            flags.append("COURT_ORDER: Court order/judgment present — very strong evidence")
            score_adj += 15

        if monetary:
            flags.append(f"MONETARY_VALUES: {len(monetary)} monetary value(s) identified")

        if any("agreement" in c or "contract" in c for c in key_clauses):
            flags.append("AGREEMENT_FOUND: Contractual agreement documented")
            score_adj += 5

        # ── Document completeness ──────────────────────────────────────
        parties = doc.get("parties", [])
        if len(parties) >= 2:
            flags.append("MULTIPLE_PARTIES: Both parties identified — strengthens record")
            score_adj += 5
        elif len(parties) == 0:
            flags.append("NO_PARTIES: No parties identified — weakens case foundation")
            score_adj -= 10

    # Clamp score adjustment
    score_adj = max(-30, min(30, score_adj))

    return {
        "rule_flags": flags,
        "preliminary_score_adjustment": score_adj,
    }


# ── LLM Final Analysis ─────────────────────────────────────────────────────

async def analyze_case(
    structured_data: dict,
    documents: list[dict] | None = None,
    raw_text: str | None = None,
) -> dict[str, Any]:
    """
    Full analysis pipeline:
    1. Run rule engine
    2. Single LLM call for final assessment
    """
    all_docs = documents or [structured_data]

    # Step 1: Rule engine
    rule_result = apply_rules(structured_data, all_docs)

    # Get case_type from first document
    case_type = structured_data.get("case_type", "Others")
    if not case_type:
        for doc in all_docs:
            if doc.get("case_type"):
                case_type = doc["case_type"]
                break

    # Step 2: LLM analysis
    analysis = await _llm_analyze(
        all_docs,
        rule_result["rule_flags"],
        case_type,
    )

    # Merge rule flags into response
    analysis["rule_flags"] = rule_result["rule_flags"]

    # Adjust confidence based on rules
    if "confidence_score" in analysis:
        adj = rule_result["preliminary_score_adjustment"]
        analysis["confidence_score"] = max(0, min(100,
            analysis["confidence_score"] + adj
        ))

    return analysis


async def _llm_analyze(
    documents: list[dict],
    rule_flags: list[str],
    case_type: str,
) -> dict:
    """Single LLM call for case analysis."""
    client = get_groq_client()

    structured_json = json.dumps({"documents": documents}, indent=2, default=str)
    flags_text = "\n".join(f"• {f}" for f in rule_flags) if rule_flags else "No flags raised."

    try:
        resp = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM},
                {"role": "user", "content": ANALYSIS_USER.format(
                    structured_json=structured_json,
                    rule_flags=flags_text,
                    case_type=case_type,
                )},
            ],
            temperature=0.0,
            max_completion_tokens=2000,
            response_format=JSON_OBJECT_RESPONSE_FORMAT,
        )
        content = extract_response_content(resp)
        content = _strip_json_fences(content)
        return json.loads(content)
    except (json.JSONDecodeError, Exception) as e:
        print(f"⚠️  LLM analysis failed: {e}")
        return _fallback_analysis()


def _fallback_analysis() -> dict:
    return {
        "case_strength": "Moderate",
        "case_complexity": "Medium",
        "confidence_score": 50,
        "summary": "Analysis could not be completed. Please review the documents manually.",
        "strong_points": ["Documents were successfully extracted"],
        "weak_points": ["Automated analysis encountered an error"],
        "next_steps": ["Consult a qualified legal professional for detailed analysis"],
        "document_analysis": [],
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
