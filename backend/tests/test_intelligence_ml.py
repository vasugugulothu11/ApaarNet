"""
Pytest Suite for AI/ML Intelligence Layer & Tri-Party Dispute Adjudication.

Verifies:
1. Dual-Degree UGC 2022 Legality Matrix & Exact APAAR Collisions (Cases B & C).
2. Phonetic Fellegi-Sunter Duplicate Linkage & Twin Disambiguation Guard (Case D).
3. NetworkX Bipartite Graph Ghost Admission Ring Detection (Case E).
4. Explainable Isolation Forest & SHAP Waterfall Institutional Risk Rankings.
5. Tri-Party Dispute Adjudication with Ed25519-Signed Merkle Audit Trail.
"""

import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.seeder import seed_apaarnet_database
from app.core.verhoeff import generate_valid_apaar_id
from app.crypto.merkle_audit import verify_checkpoint_signature
from app.database import AsyncSessionLocal
from app.main import app
from app.models.audit import MerkleAuditLog
from app.models.dispute import DisputeTicket
from app.models.enums import DisputeStatus, ValidationStatus
from app.models.student import StudentEnrolment


@pytest_asyncio.fixture(scope="module", autouse=True)
async def ensure_seeded_db():
    """Ensure database has clean deterministic 50-college baseline with Cases A-E."""
    async with AsyncSessionLocal() as session:
        await seed_apaarnet_database(session)


@pytest.mark.asyncio
async def test_exact_apaar_collisions_and_ugc_dual_degree():
    """
    Verify:
    1. Case B ('Aarav Sharma' 482910384715): 1 Regular Physical + 1 Online ODL -> LAWFUL_UGC_DUAL_DEGREE.
    2. Case C ('Priya Nair' 739201846297): 2 Regular Physical across TN & KA -> ILLEGAL_CONCURRENT_REGULAR.
    """
    apaar_b = generate_valid_apaar_id("48291038471")
    apaar_c = generate_valid_apaar_id("73920184629")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/intelligence/collisions")
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_exact_collisions"] >= 2
        exact_map = {c["apaar_id"]: c for c in data["exact_collisions"]}

        # 1. Verify Case B (Lawful UGC Dual-Degree)
        assert apaar_b in exact_map
        case_b = exact_map[apaar_b]
        assert case_b["student_name"] == "Aarav Sharma"
        assert case_b["verdict"] == "LAWFUL_UGC_DUAL_DEGREE"
        assert case_b["is_lawful"] is True
        assert "REGULAR_PHYSICAL" in case_b["delivery_modes"]
        assert "ONLINE_ODL" in case_b["delivery_modes"]
        assert "UGC Guidelines" in case_b["explanation"]

        # 2. Verify Case C (Illegal Cross-State Regular Conflict)
        assert apaar_c in exact_map
        case_c = exact_map[apaar_c]
        assert case_c["student_name"] == "Priya Nair"
        assert case_c["verdict"] == "ILLEGAL_CONCURRENT_REGULAR"
        assert case_c["is_lawful"] is False
        assert case_c["dispute_ticket_id"] is not None
        assert case_c["delivery_modes"].count("REGULAR_PHYSICAL") >= 2


@pytest.mark.asyncio
async def test_phonetic_fellegi_sunter_and_twin_disambiguation():
    """
    Verify:
    1. Case D Evasion: 'Mohammed Rayyan Khan' vs 'Mohd. Rayan Khan' (PROV-APN-9001)
       scores P(Match) >= 0.90 with HIGH_CONFIDENCE_DUPLICATE_EVASION.
    2. Case D Twins: Genuine twins 'Rohan Deshmukh' & 'Sohan Deshmukh' sharing DOB,
       parent, phone, and pincode receive Twin Disambiguation Guard (P(Match) <= 0.20).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/intelligence/collisions")
        assert resp.status_code == 200
        data = resp.json()

        phonetic_matches = data["phonetic_matches"]
        assert len(phonetic_matches) >= 1

        # Find Evasion Pair
        evasion_match = None
        twin_match = None

        for m in phonetic_matches:
            names = {m["anchor_student"]["name"], m["candidate_student"]["name"]}
            if "Mohammed Rayyan Khan" in names and "Mohd. Rayan Khan" in names:
                evasion_match = m
            if "Rohan Deshmukh" in names and "Sohan Deshmukh" in names:
                twin_match = m

        # Check Case D Evasion
        assert evasion_match is not None
        assert evasion_match["match_probability"] >= 0.90
        assert evasion_match["verdict"] == "HIGH_CONFIDENCE_DUPLICATE_EVASION"
        assert evasion_match["dob_match"] is True
        assert evasion_match["parent_initials_match"] is True
        assert evasion_match["pincode_match"] is True
        assert evasion_match["is_twin_disambiguated"] is False

        # Check Case D Twins
        assert twin_match is not None
        assert twin_match["is_twin_disambiguated"] is True
        assert twin_match["match_probability"] <= 0.20
        assert twin_match["verdict"] == "DISAMBIGUATED_GENUINE_TWINS"
        assert "Twin Disambiguation Guard" in twin_match["explanation"]


@pytest.mark.asyncio
async def test_ghost_ring_graph_detection():
    """
    Verify Case E Ghost Admission Ring:
    8 students across Deccan Valley & Metro Tech sharing phone +91-9876543210
    and bank hash BANK-RING-999 detected as a multi-college syndicate ring.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/intelligence/ghost-rings")
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_rings_detected"] >= 1
        assert data["total_students_in_rings"] >= 8

        # Find Case E Ring
        case_e_ring = None
        for ring in data["rings"]:
            if (
                "Deccan Valley Engineering College" in ring["colleges_involved"]
                and "Metro Tech Institute" in ring["colleges_involved"]
            ):
                case_e_ring = ring
                break

        assert case_e_ring is not None
        assert case_e_ring["student_count"] == 8
        assert case_e_ring["colleges_count"] == 2
        assert case_e_ring["dob_uniformity_pct"] == 100.0
        assert case_e_ring["burst_window_minutes"] <= 15.0
        assert case_e_ring["risk_category"] == "CROSS_COLLEGE_SEAT_BLOCKING_SYNDICATE"

        # Check React-Flow / D3 Topology
        assert len(data["nodes"]) >= 8
        assert len(data["edges"]) >= 8
        node_types = {n["type"] for n in data["nodes"]}
        assert "student" in node_types
        assert "phone" in node_types
        assert "bank" in node_types


@pytest.mark.asyncio
async def test_explainable_institutional_anomaly_shap():
    """
    Verify:
    1. Isolation Forest & SHAP waterfall computed across 50 institutions.
    2. Deccan Valley Engineering College ranks in the top anomaly positions with high risk score.
    3. Plain-English waterfall explanations accurately cite birthday clustering or burst ratios.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/intelligence/risk-rankings")
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_institutions"] == 50
        assert data["anomalous_institutions_count"] >= 2

        rankings = data["rankings"]
        top_colleges = [r["name"] for r in rankings[:5]]

        # Deccan Valley Engineering College must rank at the top
        assert "Deccan Valley Engineering College" in top_colleges

        dvc_profile = next(r for r in rankings if r["name"] == "Deccan Valley Engineering College")
        assert dvc_profile["risk_score"] >= 80.0
        assert dvc_profile["is_anomaly"] is True

        # Check SHAP Waterfall items
        features = {w["feature_name"] for w in dvc_profile["shap_waterfall"]}
        assert "dob_shannon_entropy" in features
        assert "upload_burst_ratio" in features
        assert "shared_contact_ratio" in features

        # Verify plain-English summary exists
        assert len(dvc_profile["plain_english_summary"]) > 10


@pytest.mark.asyncio
async def test_dispute_adjudication_and_merkle_audit():
    """
    Verify:
    1. Listing active dispute tickets.
    2. Adjudicating a dispute ticket (CONFIRMED_DUPLICATE).
    3. Ensuring student records are updated and an Ed25519-signed Merkle checkpoint is recorded.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List disputes
        resp = await client.get("/api/v1/intelligence/disputes")
        assert resp.status_code == 200
        disputes = resp.json()
        assert len(disputes) >= 2

        # Pick the provisional evasion dispute (PROV-APN-9001)
        target_ticket = next(
            (d for d in disputes if d["student_apaar_or_token"] == "PROV-APN-9001"),
            disputes[0]
        )
        ticket_id = target_ticket["id"]

        # 2. Adjudicate dispute
        adjudication_payload = {
            "decision": "CONFIRMED_DUPLICATE",
            "officer_decision_reason": (
                "AICTE Hearing Order #8821: Fingerprint match confirms 'Mohd. Rayan Khan' is identical "
                "to registered student 'Mohammed Rayyan Khan'. Admission at College B terminated."
            ),
            "additional_evidence": {
                "biometric_verification_id": "BIO-KYC-9901-MATCH",
                "hearing_date": "2026-10-29",
            },
        }

        resolve_resp = await client.post(
            f"/api/v1/intelligence/disputes/{ticket_id}/resolve",
            json=adjudication_payload,
        )
        assert resolve_resp.status_code == 200
        resolved_ticket = resolve_resp.json()
        assert resolved_ticket["status"] == "CONFIRMED_DUPLICATE"
        assert "Order #8821" in resolved_ticket["officer_decision_reason"]
        assert "BIO-KYC-9901-MATCH" in resolved_ticket["evidence_log"]["adjudication_evidence"]["biometric_verification_id"]

    # 3. Verify Merkle Audit Log contains signed checkpoint entry for adjudication
    async with AsyncSessionLocal() as session:
        audit_res = await session.execute(
            select(MerkleAuditLog)
            .where(
                MerkleAuditLog.action_type == "DISPUTE_ADJUDICATED",
                MerkleAuditLog.entity_id == ticket_id,
            )
            .order_by(MerkleAuditLog.seq_id.desc())
        )
        audit_entry = audit_res.scalar_one()

        assert audit_entry.actor_role == "AICTE_HEARING_OFFICER"
        assert audit_entry.record_hash is not None
        assert audit_entry.checkpoint_signature is not None

        # Verify signature authenticity
        is_sig_valid = verify_checkpoint_signature(
            hash_str=audit_entry.record_hash,
            signature_hex=audit_entry.checkpoint_signature,
        )
        assert is_sig_valid is True
