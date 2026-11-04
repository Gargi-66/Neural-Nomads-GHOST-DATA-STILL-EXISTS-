"""AEGIS 3.0 Module 4 — Dependency Graph Builder & Cycle Detection.

Builds directed action dependencies:
- Active sync data flows must be DISABLED before deleting source records.
- Active restore risks must be BLOCKED before deleting dependent records.
- Downstream copies should be deleted/redacted before or alongside source records.
"""

from typing import Dict, List, Optional, Set, Tuple


class DependencyCycleError(Exception):
    pass


class DependencyGraph:
    """Directed graph of remediation action dependencies."""

    def __init__(self) -> None:
        self.adj: Dict[str, Set[str]] = {}  # node -> set of nodes that depend on it
        self.in_degree: Dict[str, int] = {}
        self.nodes: Set[str] = set()

    def add_node(self, node: str) -> None:
        if node not in self.nodes:
            self.nodes.add(node)
            self.adj[node] = set()
            self.in_degree[node] = 0

    def add_dependency(self, prerequisite: str, dependent: str) -> None:
        """Adds an edge stating 'prerequisite' must execute BEFORE 'dependent'."""
        self.add_node(prerequisite)
        self.add_node(dependent)

        if dependent not in self.adj[prerequisite]:
            self.adj[prerequisite].add(dependent)
            self.in_degree[dependent] += 1

    def detect_cycles(self) -> Tuple[bool, List[str]]:
        """Kahn's algorithm to detect cycles and compute topological ordering."""
        in_deg = dict(self.in_degree)
        queue = [n for n in self.nodes if in_deg[n] == 0]
        topo_order: List[str] = []

        # Sort queue for deterministic tie-breaking
        queue.sort()

        while queue:
            curr = queue.pop(0)
            topo_order.append(curr)

            for neighbor in sorted(self.adj[curr]):
                in_deg[neighbor] -= 1
                if in_deg[neighbor] == 0:
                    queue.append(neighbor)
            queue.sort()

        if len(topo_order) != len(self.nodes):
            # Cycle detected
            remaining = [n for n, deg in in_deg.items() if deg > 0]
            return True, remaining

        return False, topo_order


def build_dependency_graph(
    active_flows: List[str],
    restore_risks: List[str],
    remediation_resources: List[str],
    explicit_dependencies: Optional[Dict[str, List[str]]] = None,
) -> DependencyGraph:
    """Builds the canonical dependency graph for a case.

    Rules:
    - Every active flow must precede all resource deletions.
    - Every restore risk must precede all resource deletions.
    - Explicit dependencies (e.g. replica -> primary) are wired.
    """
    graph = DependencyGraph()

    for flow in active_flows:
        graph.add_node(flow)
    for risk in restore_risks:
        graph.add_node(risk)
    for res in remediation_resources:
        graph.add_node(res)

    # Wire data flows & restore risks to precede deletions
    for res in remediation_resources:
        for flow in active_flows:
            graph.add_dependency(flow, res)
        for risk in restore_risks:
            graph.add_dependency(risk, res)

    if explicit_dependencies:
        for dep, prereqs in explicit_dependencies.items():
            for p in prereqs:
                graph.add_dependency(p, dep)

    return graph

