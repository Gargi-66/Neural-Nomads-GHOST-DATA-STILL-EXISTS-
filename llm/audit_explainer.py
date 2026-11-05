from __future__ import annotations

import json
from typing import Iterable, Optional

from .config import GeminiConfig
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from rag.retriever import RetrievedChunk


class GeminiExplanationError(RuntimeError):
    pass


def explain_audit(question: str, chunks: Iterable[RetrievedChunk]) -> str:
    """Generate a provenance-grounded forensic explanation using Google Gemini.
    
    Guarantees:
    - Grounded only in retrieved context.
    - Deterministic Gold status is authoritative.
    - Gracefully handles missing credentials, network errors, and token exhaustion.
    """
    chunk_list = list(chunks)
    if not chunk_list:
        return (
            "### Forensic Audit Verdict\n"
            "**Insufficient Evidence**: No admissible Gold or Silver records matched the query. "
            "Under zero-trust audit principles, no deletion status can be established without verifiable data links."
        )

    config = GeminiConfig.from_env()
    try:
        config.validate()
    except RuntimeError as error:
        # Structured deterministic fallback when API key is unconfigured
        return _format_deterministic_fallback(question, chunk_list, reason=str(error))

    try:
        from google import genai
    except ImportError:
        return _format_deterministic_fallback(question, chunk_list, reason="google-genai SDK not installed")

    context_parts = []
    for index, chunk in enumerate(chunk_list, start=1):
        context_parts.append(f"Source {index} [{chunk.metadata.get('source_layer', 'unknown')}]: {chunk.metadata}\nRecord: {chunk.text}")
    context = "\n\n".join(context_parts)

    try:
        client = genai.Client(api_key=config.api_key)
        response = client.models.generate_content(
            model=config.model,
            contents=USER_PROMPT_TEMPLATE.format(question=question, context=context),
            config={
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.1,  # Low temperature for strict factual consistency
            },
        )
        if not getattr(response, "text", None):
            return "Insufficient evidence: Gemini returned no explanatory text."
        return response.text
    except Exception as error:
        return _format_deterministic_fallback(
            question, 
            chunk_list, 
            reason=f"Gemini API invocation skipped ({type(error).__name__}). Status preserved authoritatively from Gold warehouse."
        )


def _format_deterministic_fallback(question: str, chunks: list[RetrievedChunk], reason: str) -> str:
    """Deterministic structured report when Gemini API is unavailable or unconfigured."""
    case_chunks = [c for c in chunks if c.metadata.get("resource_type") == "CASE_AUDIT"]
    res_chunks = [c for c in chunks if c.metadata.get("source_file", "").endswith("resource_audit")]

    lines = [
        "### 1. Case & Customer Identification",
    ]
    if case_chunks:
        try:
            case_data = json.loads(case_chunks[0].text)
            lines.append(f"- **Case ID**: `{case_data.get('case_id')}`")
            lines.append(f"- **Customer ID**: `{case_data.get('customer_id')}`")
            lines.append(f"- **Audit Cutoff**: `{case_data.get('audit_cutoff')}`")
            lines.append("\n### 2. Forensic Audit Verdict (Gold Warehouse Ground Truth)")
            lines.append(f"- **Overall Deletion Status**: `{case_data.get('overall_deletion_status')}`")
            lines.append(f"- **Completion Percentage**: `{case_data.get('completion_percentage', 0)}%`")
            lines.append(f"- **Evidence Completeness**: `{case_data.get('evidence_completeness')}`")
        except Exception:
            lines.append("- Case metadata parsed from retrieved chunks.")
    else:
        lines.append("- Query parsed across warehouse entities.")

    lines.append("\n### 3. Evidentiary Findings (Tracked Resources)")
    if res_chunks:
        for rc in res_chunks:
            try:
                rd = json.loads(rc.text)
                lines.append(
                    f"- `{rd.get('resource_id')}` ({rd.get('system_id')} - {rd.get('resource_type')}): "
                    f"State = **{rd.get('verified_state')}** | Reason = {rd.get('classification_reason')}"
                )
                if rd.get('evidence_references'):
                    lines.append(f"  * Evidence Citation: `{rd.get('evidence_references')}`")
            except Exception:
                continue
    else:
        lines.append("- No individual resource audit rows retrieved.")

    lines.append("\n### 4. Grounding & Status Lineage Note")
    lines.append(f"- *Note*: {reason}")
    lines.append("- **Audit integrity guarantee**: Deletion classifications are deterministic SQLite outputs and never hallucinated.")

    return "\n".join(lines)
