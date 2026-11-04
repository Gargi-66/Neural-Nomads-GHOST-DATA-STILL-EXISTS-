"""AEGIS 3.0 Module 4 — Action Ordering Engine.

Produces deterministic topological sequence of remediation actions.
"""

from typing import List, Tuple
from aegis.remediation.dependency_graph import DependencyGraph, DependencyCycleError


def order_remediation_actions(graph: DependencyGraph) -> List[str]:
    """Computes a deterministic topological order of actions.

    Raises DependencyCycleError if an unresolvable cycle exists.
    """
    has_cycle, result = graph.detect_cycles()
    if has_cycle:
        raise DependencyCycleError(f"Unresolvable cycle detected in remediation actions: {result}")
    return result

