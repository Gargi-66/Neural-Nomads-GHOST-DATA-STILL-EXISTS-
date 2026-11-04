"""AEGIS 3.0 Module 3 — Agent Orchestrator.

Manages the bounded ReAct tool execution loop with timeouts and call limits.
"""

import time
import json
import logging
from typing import Dict, Any, Optional

from aegis.agent.provider import LLMProviderAdapter, LLMToolCall, LLMResponse
from aegis.agent.tool_registry import ToolRegistry
from aegis.agent.context import InvestigationContext
from aegis.agent.safety_gate import SafetyGate
from aegis.validation.models import CandidateFinding

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Bounded agent loop driving evidence investigation."""

    def __init__(
        self,
        provider: LLMProviderAdapter,
        tool_registry: ToolRegistry,
        safety_gate: SafetyGate,
        max_tool_calls: int = 5,
        timeout_seconds: float = 15.0,
    ) -> None:
        self.provider = provider
        self.tools = tool_registry
        self.safety_gate = safety_gate
        self.max_tool_calls = max_tool_calls
        self.timeout_seconds = timeout_seconds

    def run_investigation(self, context: InvestigationContext) -> InvestigationContext:
        """Executes the bounded investigation loop."""
        start_time = time.time()
        tool_call_count = 0

        # Construct initial system context
        messages = [
            {
                "role": "system",
                "content": (
                    f"You are the AEGIS Deletion Investigation Agent for case '{context.case_id}'. "
                    f"Investigate evidence as of cutoff '{context.audit_at.isoformat()}'. "
                    f"Use available tools to query records, check admissibility, and propose findings. "
                    f"All findings must be submitted via 'propose_finding' tool. "
                    f"Do not invent facts or attempt to execute direct deletion operations."
                ),
            },
            {
                "role": "user",
                "content": f"Investigate deletion request for user '{context.user_id}': {context.request_text}",
            },
        ]

        while tool_call_count < self.max_tool_calls:
            # Check execution timeout deadline
            elapsed = time.time() - start_time
            if elapsed >= self.timeout_seconds:
                context.termination_reason = "TIMEOUT_EXCEEDED"
                logger.warning("Investigation for case %s timed out after %.2fs", context.case_id, elapsed)
                break

            # Call model
            try:
                response = self.provider.generate(
                    messages=messages,
                    tools=self.tools.get_tool_definitions(),
                    timeout=max(1.0, self.timeout_seconds - elapsed),
                )
            except TimeoutError:
                context.termination_reason = "PROVIDER_TIMEOUT"
                break
            except Exception as e:
                context.termination_reason = f"PROVIDER_ERROR: {e}"
                break

            # If no tool calls -> model finished investigation
            if not response.tool_calls:
                context.investigation_complete = True
                context.termination_reason = "INVESTIGATION_CONCLUDED"
                break

            # Process each requested tool call
            for call in response.tool_calls:
                tool_call_count += 1
                tool_name = call.tool_name
                args = call.arguments

                # Intercept propose_finding to pass through SafetyGate
                if tool_name == "propose_finding":
                    try:
                        cand = CandidateFinding(**args)
                        is_acc, val_report = self.safety_gate.process_proposed_finding(cand, context)
                        result = {
                            "accepted": is_acc,
                            "reason": val_report.reason or "Candidate accepted by Module 2.",
                        }
                    except Exception as e:
                        result = {"accepted": False, "error": f"Invalid CandidateFinding schema: {e}"}
                else:
                    result = self.tools.execute_tool(tool_name, args)

                # Record in context history
                context.record_tool_call(tool_name, args, result)

                # Feed result back into conversation
                messages.append({
                    "role": "assistant",
                    "content": f"Tool call: {tool_name}",
                    "tool_calls": [{"name": tool_name, "arguments": args}],
                })
                messages.append({
                    "role": "tool",
                    "name": tool_name,
                    "content": json.dumps(result),
                })

                if tool_call_count >= self.max_tool_calls:
                    context.termination_reason = "MAX_TOOL_CALLS_REACHED"
                    break

        if not context.termination_reason:
            context.termination_reason = "MAX_TOOL_CALLS_REACHED"

        return context

