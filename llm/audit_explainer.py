from __future__ import annotations

from typing import Iterable

from .config import GeminiConfig
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from rag.retriever import RetrievedChunk


class GeminiExplanationError(RuntimeError):
    pass


def explain_audit(question: str, chunks: Iterable[RetrievedChunk]) -> str:
    chunk_list = list(chunks)
    if not chunk_list:
        return "Insufficient evidence: no matching Gold or Silver records were retrieved."

    config = GeminiConfig.from_env()
    try:
        config.validate()
    except RuntimeError as error:
        return f"Insufficient evidence for generated explanation: {error}"

    try:
        from google import genai
    except ImportError:
        return "Gemini explanation unavailable: the google-genai package is not installed."

    context_parts = []
    for index, chunk in enumerate(chunk_list, start=1):
        context_parts.append(f"Source {index}: {chunk.metadata}\nText: {chunk.text}")
    context = "\n\n".join(context_parts)

    try:
        client = genai.Client(api_key=config.api_key)
        response = client.models.generate_content(
            model=config.model,
            contents=USER_PROMPT_TEMPLATE.format(question=question, context=context),
            config={"system_instruction": SYSTEM_PROMPT},
        )
        if not getattr(response, "text", None):
            return "Insufficient evidence: Gemini returned no explanatory text."
        return response.text
    except Exception as error:
        return f"Gemini explanation unavailable due to API error ({type(error).__name__}). No deletion status was recalculated."
