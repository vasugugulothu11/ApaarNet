"""
Ghost Admission Ring Bipartite Graph Detector.

Constructs a heterogeneous bipartite graph using NetworkX connecting StudentEnrolment
entities to shared phone numbers, emails, and bank hashes across institutions.
Detects syndicate rings (connected components with >= 3 students), computes ring metrics
(DOB uniformity, upload burst window, colleges involved), and produces React-Flow/D3-ready JSON.
"""

from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Set, Tuple
import networkx as nx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.institution import Institution
from app.models.student import StudentEnrolment
from app.schemas.intelligence import (
    GhostRingGraphResponse,
    GraphEdge,
    GraphNode,
    SyndicateRingSummary,
)


async def detect_ghost_admission_rings(
    session: AsyncSession,
    min_ring_size: int = 3,
) -> GhostRingGraphResponse:
    """
    Builds a NetworkX bipartite graph across students and shared contact/financial
    identifiers, extracts connected syndicate rings, and exports React-Flow topology.
    """
    # 1. Fetch all student enrolments with institution data
    stmt = select(StudentEnrolment).options(selectinload(StudentEnrolment.institution))
    students = list((await session.execute(stmt)).scalars().all())

    # 2. Build Bipartite Graph
    G = nx.Graph()

    for s in students:
        s_node_id = f"student:{s.id}"
        inst_name = s.institution.name if s.institution else "Unknown College"

        G.add_node(
            s_node_id,
            node_type="student",
            label=s.full_name,
            apaar_id=s.apaar_id or s.provisional_token or "PROVISIONAL",
            roll=s.institutional_student_id,
            college=inst_name,
            institution_id=str(s.institution_id),
            dob=str(s.dob),
            uploaded_at=s.uploaded_at.isoformat() if s.uploaded_at else "",
        )

        # Connect to Phone Node
        if s.phone_number and len(s.phone_number.strip()) > 5:
            phone_node_id = f"phone:{s.phone_number.strip()}"
            if not G.has_node(phone_node_id):
                G.add_node(phone_node_id, node_type="phone", label=s.phone_number.strip())
            G.add_edge(s_node_id, phone_node_id, edge_type="SHARED_PHONE")

        # Connect to Bank Account Hash Node
        if s.bank_account_hash and len(s.bank_account_hash.strip()) > 2:
            bank_node_id = f"bank:{s.bank_account_hash.strip()}"
            if not G.has_node(bank_node_id):
                G.add_node(bank_node_id, node_type="bank", label=s.bank_account_hash.strip())
            G.add_edge(s_node_id, bank_node_id, edge_type="SHARED_BANK")

        # Connect to Email Node (if common domain or shared email)
        if s.email and "@" in s.email and not s.email.endswith(".edu.in"):
            email_node_id = f"email:{s.email.strip().lower()}"
            if not G.has_node(email_node_id):
                G.add_node(email_node_id, node_type="email", label=s.email.strip().lower())
            G.add_edge(s_node_id, email_node_id, edge_type="SHARED_EMAIL")

    # 3. Detect Connected Components with >= min_ring_size students
    rings: List[SyndicateRingSummary] = []
    ring_nodes_set: Set[str] = set()

    ring_idx = 1
    for component in nx.connected_components(G):
        student_nodes = [n for n in component if G.nodes[n].get("node_type") == "student"]
        if len(student_nodes) < min_ring_size:
            continue

        # Extract Ring Members
        subg = G.subgraph(component)
        ring_nodes_set.update(component)

        # Metric 1: Colleges involved
        colleges = sorted(list({G.nodes[n].get("college") for n in student_nodes}))

        # Metric 2: Shared identifiers
        shared_identifiers = [
            f"{G.nodes[n].get('node_type', 'attr').upper()}: {G.nodes[n].get('label')}"
            for n in component
            if G.nodes[n].get("node_type") in ("phone", "bank", "email")
        ]

        # Metric 3: DOB Uniformity
        dobs = [G.nodes[n].get("dob") for n in student_nodes if G.nodes[n].get("dob")]
        if dobs:
            most_common_dob_count = Counter(dobs).most_common(1)[0][1]
            dob_uniformity = round((most_common_dob_count / len(dobs)) * 100.0, 1)
        else:
            dob_uniformity = 0.0

        # Metric 4: Upload Burst Window
        timestamps = []
        for n in student_nodes:
            ts_str = G.nodes[n].get("uploaded_at")
            if ts_str:
                try:
                    timestamps.append(datetime.fromisoformat(ts_str))
                except Exception:
                    pass

        if len(timestamps) >= 2:
            burst_window_min = round((max(timestamps) - min(timestamps)).total_seconds() / 60.0, 1)
        else:
            burst_window_min = 0.0

        # Risk categorization
        if len(colleges) >= 2:
            risk_category = "CROSS_COLLEGE_SEAT_BLOCKING_SYNDICATE"
        else:
            risk_category = "INTRA_COLLEGE_GHOST_ADMISSIONS"

        ring_summary = SyndicateRingSummary(
            ring_id=f"RING-{ring_idx:03d}",
            student_count=len(student_nodes),
            colleges_involved=colleges,
            colleges_count=len(colleges),
            shared_identifiers=shared_identifiers,
            dob_uniformity_pct=dob_uniformity,
            burst_window_minutes=burst_window_min,
            risk_category=risk_category,
            student_ids=[n.replace("student:", "") for n in student_nodes],
        )
        rings.append(ring_summary)
        ring_idx += 1

    # 4. Generate React-Flow / D3 Nodes and Edges for detected rings
    flow_nodes: List[GraphNode] = []
    flow_edges: List[GraphEdge] = []

    # Export all nodes belonging to detected rings
    subgraph_rings = G.subgraph(ring_nodes_set)
    for n in subgraph_rings.nodes:
        attrs = dict(G.nodes[n])
        node_type = attrs.get("node_type", "entity")
        label = attrs.get("label", n)
        flow_nodes.append(
            GraphNode(
                id=n,
                label=label,
                type=node_type,
                data=attrs,
            )
        )

    edge_counter = 1
    for u, v in subgraph_rings.edges:
        edge_type = G[u][v].get("edge_type", "LINKED_TO")
        flow_edges.append(
            GraphEdge(
                id=f"edge-{edge_counter}",
                source=u,
                target=v,
                label=edge_type,
            )
        )
        edge_counter += 1

    total_students_in_rings = sum(r.student_count for r in rings)

    return GhostRingGraphResponse(
        total_rings_detected=len(rings),
        total_students_in_rings=total_students_in_rings,
        rings=rings,
        nodes=flow_nodes,
        edges=flow_edges,
    )
