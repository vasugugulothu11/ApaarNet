"""
Pytest Suite for Step 7:
1. DPDP Act 2023 Verification & Selective Disclosure Gateway (Zero-Exposure Predicate & SD-JWT).
2. Requirement 10 W3C Degree Certificate Studio & Offline Stateless QR Verifier.
3. Policy, Accreditation & National Command Center Telemetry.
4. Cryptographic Merkle Audit Ledger & Live 1-Click Tamper Simulation.
"""

import copy
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.seeder import seed_apaarnet_database
from app.core.verhoeff import generate_valid_apaar_id
from app.crypto.dpdp_verification import verify_sd_jwt_disclosures
from app.crypto.merkle_audit import verify_checkpoint_signature
from app.database import AsyncSessionLocal
from app.main import app
from app.models.audit import MerkleAuditLog
from app.models.enums import ValidationStatus
from app.models.student import StudentEnrolment
from app.schemas.dpdp import SdJwtPayload


@pytest_asyncio.fixture(scope="module", autouse=True)
async def ensure_seeded_db():
    """Ensure database has clean deterministic 50-college baseline with Cases A-E."""
    async with AsyncSessionLocal() as session:
        await seed_apaarnet_database(session)


@pytest.mark.asyncio
async def test_zero_exposure_predicate_verification():
    """
    Verify DPDP Zero-Exposure Predicate Mode:
    Returns ONLY an Ed25519-signed boolean assertion proving active enrollment in an
    AICTE-approved program without disclosing raw personal credentials or category.
    """
    apaar_id = generate_valid_apaar_id("48291038471")  # Aarav Sharma

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Employer submits verification request
        req_payload = {
            "apaar_id": apaar_id,
            "requester_name": "Tata Consultancy Services (TCS)",
            "requester_role": "EMPLOYER",
            "requested_fields": ["full_name", "program_name", "institution_name"],
            "disclosure_mode": "ZERO_EXPOSURE_PREDICATE",
            "predicate_query": "Verified Enrolment in AICTE-Approved Program",
        }
        req_resp = await client.post("/api/v1/verify/request", json=req_payload)
        assert req_resp.status_code == 201
        consent_item = req_resp.json()
        consent_id = consent_item["id"]
        assert consent_item["status"] == "PENDING_STUDENT_APPROVAL"

        # 2. Student approves via WebAuthn Passkey
        approve_payload = {
            "passkey_or_otp_code": "WEBAUTHN-PASSKEY-ASSERTION-OK",
            "disclosure_mode": "ZERO_EXPOSURE_PREDICATE",
        }
        appr_resp = await client.post(f"/api/v1/verify/consent/{consent_id}/approve", json=approve_payload)
        assert appr_resp.status_code == 200
        result = appr_resp.json()

        assert result["status"] == "VERIFICATION_SUCCESSFUL"
        assert result["disclosure_mode"] == "ZERO_EXPOSURE_PREDICATE"
        assert result["predicate_assertion"] is not None

        assertion = result["predicate_assertion"]
        assert assertion["apaar_id"] == apaar_id
        assert assertion["result"] is True
        assert assertion["predicate"] == "Verified Enrolment in AICTE-Approved Program"
        assert assertion["ed25519_signature"] is not None
        assert assertion["public_key"] is not None

        # Verify cryptographic signature of assertion
        import json, nacl.signing
        vk = nacl.signing.VerifyKey(bytes.fromhex(assertion["public_key"]))
        claim_dict = {
            "apaar_id": assertion["apaar_id"],
            "predicate": assertion["predicate"],
            "result": assertion["result"],
            "issuer": assertion["issuer"],
            "verified_at": assertion["verified_at"],
        }
        canonical_claim = json.dumps(claim_dict, sort_keys=True).encode("utf-8")
        vk.verify(canonical_claim, bytes.fromhex(assertion["ed25519_signature"]))

        # Verify Merkle audit sequence number returned
        assert result["audit_sequence_number"] > 0
        assert result["audit_record_hash"] is not None


@pytest.mark.asyncio
async def test_sd_jwt_selective_attribute_disclosure():
    """
    Verify IETF SD-JWT Selective Disclosure Mode:
    Student selectively approves ONLY full_name, program_name, and institution_name,
    keeping dob and seat_category cryptographically masked in the signed _sd array.
    """
    apaar_id = generate_valid_apaar_id("48291038471")  # Aarav Sharma

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Employer requests extensive fields
        req_payload = {
            "apaar_id": apaar_id,
            "requester_name": "Infosys Ltd",
            "requester_role": "EMPLOYER",
            "requested_fields": ["full_name", "program_name", "institution_name", "dob", "seat_category"],
            "disclosure_mode": "SD_JWT_SELECTIVE",
        }
        req_resp = await client.post("/api/v1/verify/request", json=req_payload)
        assert req_resp.status_code == 201
        consent_id = req_resp.json()["id"]

        # 2. Student exercises DPDP statutory rights: approves ONLY 3 fields, refusing dob & seat_category
        approve_payload = {
            "passkey_or_otp_code": "WEBAUTHN-PASSKEY-ASSERTION-OK",
            "approved_fields": ["full_name", "program_name", "institution_name"],
            "disclosure_mode": "SD_JWT_SELECTIVE",
        }
        appr_resp = await client.post(f"/api/v1/verify/consent/{consent_id}/approve", json=approve_payload)
        assert appr_resp.status_code == 200
        result = appr_resp.json()

        assert result["sd_jwt"] is not None
        sd_jwt = result["sd_jwt"]

        # Assert only the 3 approved attributes are disclosed
        disclosed = sd_jwt["disclosed_attributes"]
        assert "full_name" in disclosed
        assert "program_name" in disclosed
        assert "institution_name" in disclosed
        assert "dob" not in disclosed
        assert "seat_category" not in disclosed

        # Undisclosed hashes must be present in _sd array
        assert len(sd_jwt["undisclosed_attribute_hashes"]) >= 2

        # Verify SD-JWT disclosures against signed payload
        sd_jwt_obj = SdJwtPayload(**sd_jwt)
        is_valid, revealed, expl = verify_sd_jwt_disclosures(sd_jwt_obj)
        assert is_valid is True
        assert revealed["full_name"] == disclosed["full_name"]


@pytest.mark.asyncio
async def test_student_consent_wallet_view():
    """Verify Student Consent Wallet lists all requests with statuses."""
    apaar_id = generate_valid_apaar_id("48291038471")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/v1/verify/student/{apaar_id}/requests")
        assert resp.status_code == 200
        records = resp.json()
        assert len(records) >= 2
        requesters = [r["requester_name"] for r in records]
        assert "Tata Consultancy Services (TCS)" in requesters
        assert "Infosys Ltd" in requesters


@pytest.mark.asyncio
async def test_dual_id_w3c_degree_issuance_and_offline_verification():
    """
    Official Requirement 10:
    1. Issues W3C Degree VC featuring BOTH apaar_id AND institutional_student_id side-by-side.
    2. Verifies the credential completely statelessly (offline) with Ed25519 signature.
    """
    # Fetch a student from database
    async with AsyncSessionLocal() as session:
        stu_res = await session.execute(
            select(StudentEnrolment)
            .where(StudentEnrolment.validation_status == ValidationStatus.ACCEPTED.value)
            .limit(1)
        )
        student = stu_res.scalar_one()
        stu_id = str(student.id)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Issue W3C Degree Credential
        issue_payload = {
            "graduation_year": 2026,
            "degree_level": "Bachelor of Technology",
            "specialization": "Computer Science and Engineering",
            "cgpa": 9.15,
        }
        issue_resp = await client.post(f"/api/v1/degrees/issue/{stu_id}", json=issue_payload)
        assert issue_resp.status_code == 201
        vc_data = issue_resp.json()

        # Requirement 10 Assertion: BOTH apaar_id AND institutional_student_id present side-by-side
        assert vc_data["apaar_id"] is not None
        assert vc_data["institutional_student_id"] is not None
        subject = vc_data["w3c_vc_json"]["credentialSubject"]
        assert "apaar_id" in subject
        assert "institutional_student_id" in subject
        assert vc_data["revocation_bit_index"] > 0
        assert vc_data["qr_payload_string"] is not None

        # 2. Stateless Offline Verification (0 DB Queries)
        verify_resp = await client.post(
            "/api/v1/degrees/verify-offline",
            json={
                "w3c_vc_json": vc_data["w3c_vc_json"],
                "issuer_public_key_hex": vc_data["issuer_public_key_hex"],
            },
        )
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()

        assert verify_data["is_valid"] is True
        assert verify_data["status"] == "VALID"
        assert verify_data["is_revoked"] is False
        assert verify_data["apaar_id"] == vc_data["apaar_id"]
        assert verify_data["institutional_student_id"] == vc_data["institutional_student_id"]


@pytest.mark.asyncio
async def test_offline_qr_tamper_detection():
    """Verify that tampering with even 1 character in student name fails offline verification immediately."""
    async with AsyncSessionLocal() as session:
        stu_res = await session.execute(
            select(StudentEnrolment)
            .where(StudentEnrolment.validation_status == ValidationStatus.ACCEPTED.value)
            .limit(1)
        )
        student = stu_res.scalar_one()
        stu_id = str(student.id)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        issue_resp = await client.post(
            f"/api/v1/degrees/issue/{stu_id}",
            json={"graduation_year": 2026, "degree_level": "B.Tech", "cgpa": 8.5},
        )
        vc_data = issue_resp.json()

        # Adversary modifies student name on credential
        tampered_vc = copy.deepcopy(vc_data["w3c_vc_json"])
        tampered_vc["credentialSubject"]["full_name"] += " [FORGED]"

        tamper_resp = await client.post(
            "/api/v1/degrees/verify-offline",
            json={
                "w3c_vc_json": tampered_vc,
                "issuer_public_key_hex": vc_data["issuer_public_key_hex"],
            },
        )
        assert tamper_resp.status_code == 200
        res = tamper_resp.json()

        assert res["is_valid"] is False
        assert res["status"] == "CRYPTOGRAPHICALLY_INVALID"
        assert "tampered" in res["explanation"].lower() or "mismatch" in res["explanation"].lower()


@pytest.mark.asyncio
async def test_degree_bitstring_revocation():
    """Verify that flipping the revocation bit causes instant offline verification failure (REVOKED)."""
    async with AsyncSessionLocal() as session:
        stu_res = await session.execute(
            select(StudentEnrolment)
            .where(StudentEnrolment.validation_status == ValidationStatus.ACCEPTED.value)
            .limit(1)
        )
        student = stu_res.scalar_one()
        stu_id = str(student.id)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        issue_resp = await client.post(
            f"/api/v1/degrees/issue/{stu_id}",
            json={"graduation_year": 2026, "degree_level": "B.Tech", "cgpa": 8.0},
        )
        vc_data = issue_resp.json()
        bit_index = vc_data["revocation_bit_index"]

        # Revoke the credential
        revoke_resp = await client.post(
            f"/api/v1/degrees/revoke/{bit_index}",
            json={"reason": "Revoked by Academic Council order #7712"},
        )
        assert revoke_resp.status_code == 200
        assert revoke_resp.json()["status"] == "REVOKED_SUCCESSFULLY"

        # Offline verification must now return REVOKED
        verify_resp = await client.post(
            "/api/v1/degrees/verify-offline",
            json={
                "w3c_vc_json": vc_data["w3c_vc_json"],
                "issuer_public_key_hex": vc_data["issuer_public_key_hex"],
            },
        )
        assert verify_resp.status_code == 200
        res = verify_resp.json()

        assert res["is_valid"] is False
        assert res["status"] == "REVOKED"
        assert res["is_revoked"] is True
        assert f"index {bit_index}" in res["explanation"].lower()


@pytest.mark.asyncio
async def test_national_overview_and_accreditation_exports():
    """Verify Requirement 9 national overview KPIs and NAAC/NBA accreditation export."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. National Overview Telemetry
        tele_resp = await client.get("/api/v1/reports/national-overview")
        assert tele_resp.status_code == 200
        tele = tele_resp.json()

        assert tele["total_institutions"] == 50
        assert tele["total_students_enrolled"] >= 1400
        assert tele["total_approved_intake"] >= 3000
        assert tele["verified_apaar_coverage_pct"] >= 85.0
        assert tele["open_tri_party_disputes"] >= 2
        assert len(tele["state_breakdown"]) == 10
        assert tele["seat_distribution"]["general_base"] > 1000
        assert tele["seat_distribution"]["fn_oci_ciwgc_supernumerary"] >= 36

        # 2. Institutions portal selector
        inst_resp = await client.get("/api/v1/reports/institutions")
        assert inst_resp.status_code == 200
        insts = inst_resp.json()
        assert len(insts) == 50
        assert len(insts[0]["program_quotas"]) >= 1

        # 3. NAAC/NBA Accreditation Export (CSV format)
        csv_resp = await client.get("/api/v1/reports/export/NAAC_NBA_ACCREDITATION?format=csv")
        assert csv_resp.status_code == 200
        assert "sanctioned_intake" in csv_resp.text
        assert "accreditation_compliance_status" in csv_resp.text

        # 4. State Policy Matrix Export (JSON format)
        json_resp = await client.get("/api/v1/reports/export/STATE_POLICY_MATRIX?format=json")
        assert json_resp.status_code == 200
        assert json_resp.json()["total_records"] == 50


@pytest.mark.asyncio
async def test_merkle_audit_ledger_and_simulate_tamper():
    """Verify live Merkle audit ledger and 1-click tamper attack simulation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Verify live Merkle ledger
        ledger_resp = await client.get("/api/v1/audit/ledger?limit=30")
        assert ledger_resp.status_code == 200
        ledger = ledger_resp.json()

        assert ledger["total_entries"] > 0
        assert ledger["chain_integrity_valid"] is True
        assert len(ledger["entries"]) > 0

        # 2. Run 1-Click Tamper Simulation
        tamper_resp = await client.post("/api/v1/audit/simulate-tamper")
        assert tamper_resp.status_code == 200
        sim = tamper_resp.json()

        assert sim["original_chain_valid"] is True
        assert sim["status"] == "tamper_detected"
        assert sim["local_hash_mismatch_detected"] is True
        assert sim["chain_link_broken_detected"] is True
        assert sim["ed25519_checkpoint_signature_rejected"] is True
        assert "explanation" in sim
