"""AEGIS 3.0 Module 3 — Agent Package Entry.
"""

from aegis.agent.provider import (
    LLMProviderAdapter,
    MockLLMProviderAdapter,
    LLMToolCall,
    LLMResponse,
)
from aegis.agent.tool_registry import (
    ToolDefinition,
    ToolRegistry,
    ToolRegistryError,
)
from aegis.agent.context import InvestigationContext
from aegis.agent.safety_gate import SafetyGate
from aegis.agent.orchestrator import AgentOrchestrator
from aegis.agent.reporter import generate_investigation_report
from aegis.agent.tools.standard_tools import make_standard_tools

__all__ = [
    "LLMProviderAdapter",
    "MockLLMProviderAdapter",
    "LLMToolCall",
    "LLMResponse",
    "ToolDefinition",
    "ToolRegistry",
    "ToolRegistryError",
    "InvestigationContext",
    "SafetyGate",
    "AgentOrchestrator",
    "generate_investigation_report",
    "make_standard_tools",
]

