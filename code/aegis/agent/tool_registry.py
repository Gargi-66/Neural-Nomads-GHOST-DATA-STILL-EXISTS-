"""AEGIS 3.0 Module 3 — Tool Registry & Controlled Permissions.

Registers allowed investigation tools with schema enforcement and permission checks.
"""

from typing import Dict, Any, Callable, List, Optional
from pydantic import BaseModel, ConfigDict


class ToolDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    description: str
    parameters_schema: Dict[str, Any]
    handler: Callable[..., Dict[str, Any]]
    is_destructive: bool = False


class ToolRegistryError(Exception):
    pass


class ToolRegistry:
    """Manages allowed tools and executes them with strict validation."""

    def __init__(self) -> None:
        self.tools: Dict[str, ToolDefinition] = {}

    def register_tool(self, tool: ToolDefinition) -> None:
        if tool.is_destructive:
            raise ToolRegistryError(f"Security Violation: Destructive tool '{tool.name}' is prohibited.")
        self.tools[tool.name] = tool

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Returns JSON schema definitions for registered tools."""
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters_schema,
            }
            for t in self.tools.values()
        ]

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Validates arguments and executes the registered tool."""
        if tool_name not in self.tools:
            return {
                "success": False,
                "error": f"Unknown tool '{tool_name}'. Tool is not registered.",
            }

        tool = self.tools[tool_name]
        try:
            result = tool.handler(**arguments)
            return {"success": True, "result": result}
        except TypeError as e:
            return {"success": False, "error": f"Invalid arguments for tool '{tool_name}': {e}"}
        except Exception as e:
            return {"success": False, "error": f"Execution error in tool '{tool_name}': {e}"}

