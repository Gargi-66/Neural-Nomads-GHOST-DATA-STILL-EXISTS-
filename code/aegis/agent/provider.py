"""AEGIS 3.0 Module 3 — Provider Adapter & LLM Interface.

Encapsulates LLM communication, retry policy, timeout budgets, and deterministic mock execution.
"""

import os
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class LLMToolCall(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tool_name: str
    arguments: Dict[str, Any]


class LLMResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    content: Optional[str] = None
    tool_calls: List[LLMToolCall] = Field(default_factory=list)
    raw_data: Optional[Dict[str, Any]] = None
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0


class LLMProviderAdapter(ABC):
    """Abstract interface for LLM providers."""

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        timeout: float = 10.0,
    ) -> LLMResponse:
        """Sends a structured chat request with available tools."""
        pass


class MockLLMProviderAdapter(LLMProviderAdapter):
    """Deterministic mock provider for hermetic testing."""

    def __init__(self, scripted_responses: Optional[List[LLMResponse]] = None) -> None:
        self.scripted_responses: List[LLMResponse] = list(scripted_responses or [])
        self.call_history: List[List[Dict[str, Any]]] = []
        self.should_timeout: bool = False

    def push_response(self, response: LLMResponse) -> None:
        self.scripted_responses.append(response)

    def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        timeout: float = 10.0,
    ) -> LLMResponse:
        self.call_history.append(messages)
        if self.should_timeout:
            raise TimeoutError("Mock LLM provider timed out after deadline.")

        if not self.scripted_responses:
            # Default fallback response
            return LLMResponse(
                content="Investigation concluded with no further tool calls.",
                tool_calls=[],
                input_tokens=10,
                output_tokens=10,
            )

        resp = self.scripted_responses.pop(0)
        return resp

