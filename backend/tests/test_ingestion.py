"""
Pytest Suite for Adaptive Schema Ingestion & Pre-Commit Sandbox Diff Chamber.

Verifies:
1. Messy CSV header auto-mapping with confidence scores (preview-mapping).
2. Pre-commit delta detection and quota overflow flagging (sandbox-diff).
3. Registry downtime resilience (UNVERIFIED_PENDING_REGISTRY fallback).
4. Idempotent double-commit protection and Merkle audit log checkpointing (commit-batch).
"""

import io
import uuid
from datetime import date
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.verhoeff import generate_valid_apaar_id
from app.crypto.merkle_audit import verify_checkpoint_signature
from app.database import AsyncSessionLocal
from app.main import app
from app.models.enums import DeliveryMode, InstitutionType, SeatCategory, ValidationStatus
from app.models.institution import Institution, ProgramQuota
from app.models.student import StudentEnrolment


@pytest.mark.asyncio
async def test_messy_csv_header_auto_mapping():
    """Verify that drifted ERP headers are accurately mapped using Jaro-Winkler & synonyms."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test via JSON preview endpoint
        messy_headers = [
            "Student_APAAR_No",
            "RollNo",
            "Candidate_Name",
            "Quota_Category",
            "DateOfBirth",
            "Sex",
            "PassportNo",
            "Contact_Number",
            "Parent_Initials",
        ]
        sample_records = [
            {
                "Student_APAAR_No": "991000000018",
                "RollNo": "ERP-2026-001",
                "Candidate_Name": "Amitabh Roy",
                "Quota_Category": "GENERAL_BASE",
                "DateOfBirth": "2005-04-12",
                "Sex": "Male",
                "PassportNo": "",
                "Contact_Number": "+91-9876543210",
                "Parent_Initials": "S.R.",
            }
        ]

        resp = await client.post(
            "/api/v1/ingest/preview-mapping-json",
            json={"headers": messy_headers, "records": sample_records},
        )
        assert resp.status_code == 200
        data = resp.json()

        mappings = data["mappings"]
        assert mappings["Student_APAAR_No"]["target_field"] == "apaar_id"
        assert mappings["Student_APAAR_No"]["confidence"] >= 0.90
        assert mappings["RollNo"]["target_field"] == "institutional_student_id"
        assert mappings["RollNo"]["confidence"] >= 0.90
        assert mappings["Candidate_Name"]["target_field"] == "full_name"
        assert mappings["Candidate_Name"]["confidence"] >= 0.90
        assert mappings["Quota_Category"]["target_field"] == "seat_category"
        assert mappings["Quota_Category"]["confidence"] >= 0.90
        assert mappings["DateOfBirth"]["target_field"] == "dob"
        assert mappings["DateOfBirth"]["confidence"] >= 0.90
        assert mappings["Sex"]["target_field"] == "gender"
        assert mappings["Sex"]["confidence"] >= 0.90
        assert mappings["PassportNo"]["target_field"] == "passport_or_oci_number"
        assert mappings["Contact_Number"]["target_field"] == "phone_number"
        assert mappings["Parent_Initials"]["target_field"] == "parent_initials"

        assert data["missing_required_fields"] == []
        assert len(data["sample_preview"]) == 1
        assert data["sample_preview"][0]["institutional_student_id"] == "ERP-2026-001"
        assert data["sample_preview"][0]["full_name"] == "Amitabh Roy"

        # 2. Test via CSV file upload multipart endpoint
        csv_content = (
            "RollNo,Candidate_Name,DateOfBirth,Sex,Quota_Category\n"
            "ROLL-101,Sneha Rao,2005-08-14,Female,GENERAL_BASE\n"
        )
        files = {"file": ("students.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
        resp_upload = await client.post("/api/v1/ingest/preview-mapping", files=files)
        assert resp_upload.status_code == 200
        data_upload = resp_upload.json()
        assert data_upload["mappings"]["RollNo"]["target_field"] == "institutional_student_id"
        assert data_upload["mappings"]["Candidate_Name"]["target_field"] == "full_name"


@pytest.mark.asyncio
async def test_sandbox_diff_deltas_and_quota_overflow():
    """
    Verify:
    1. Row delta classification: NEW_INSERT, FIELD_MODIFIED_DIFF, IDEMPOTENT_NO_CHANGE.
    2. Real-time Quota Overflow detection (approved intake breach).
    3. Mandatory Passport/OCI check for FN/OCI supernumerary quotas.
    4. CSV error report generation.
    """
    async with AsyncSessionLocal() as session:
        # Create a test institution and a small quota
        inst = Institution(
            aicte_permanent_id=f"1-TEST-{uuid.uuid4().hex[:6]}",
            aishe_code=f"C-TEST-{uuid.uuid4().hex[:4]}",
            name="Sandbox Testing Institute of Technology",
            state="Karnataka",
            district="Bangalore Urban",
            institution_type=InstitutionType.AUTONOMOUS,
            official_email_domain="sandboxtest.edu.in",
            compliance_risk_score=0.01,
        )
        session.add(inst)
        await session.flush()

        quota = ProgramQuota(
            institution_id=inst.id,
            academic_year="2026-27",
            program_name="B.Tech Robotics",
            course_code="ROBO-TEST-02",
            delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
            approved_intake=2,  # Small intake to easily test cap overflow
            nri_5pct_internal_cap=1,
            fn_oci_ciwgc_15pct_supernumerary_cap=1,
            tfw_5pct_supernumerary_cap=0,
            pmsss_supernumerary_cap=0,
            lateral_entry_2nd_yr_cap=0,
        )
        session.add(quota)
        await session.flush()

        # Seed 1 existing student
        existing_apaar = generate_valid_apaar_id("11112222333")
        existing_student = StudentEnrolment(
            apaar_id=existing_apaar,
            institutional_student_id="EXISTING-001",
            institution_id=inst.id,
            program_quota_id=quota.id,
            full_name="Karan Malhotra",
            phonetic_name_code="KRN MLHTR",
            dob=date(2005, 1, 1),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE.value,
            email="karan@sandboxtest.edu.in",
            phone_number="+91-9876500001",
            pincode="560001",
            validation_status=ValidationStatus.ACCEPTED.value,
            flag_reasons=[],
        )
        session.add(existing_student)
        await session.commit()

        inst_id = str(inst.id)
        quota_id = str(quota.id)

    # Now evaluate batch in sandbox:
    # Row 1: IDEMPOTENT_NO_CHANGE (Exact match to existing)
    # Row 2: FIELD_MODIFIED_DIFF (Same roll, but changed phone and email)
    # Row 3: NEW_INSERT that fits within approved intake (2nd base student)
    # Row 4: REJECTED_OR_FLAGGED (3rd base student -> BASE_APPROVED_INTAKE_EXCEEDED)
    # Row 5: REJECTED_OR_FLAGGED (OCI student missing passport -> MISSING_PASSPORT_OCI_CREDENTIAL)
    apaar_new_1 = generate_valid_apaar_id("22223333444")
    apaar_new_2 = generate_valid_apaar_id("33334444555")

    rows_payload = [
        # Row 1: Idempotent no change
        {
            "institutional_student_id": "EXISTING-001",
            "full_name": "Karan Malhotra",
            "apaar_id": existing_apaar,
            "dob": "2005-01-01",
            "gender": "Male",
            "seat_category": "GENERAL_BASE",
            "email": "karan@sandboxtest.edu.in",
            "phone_number": "+91-9876500001",
            "pincode": "560001",
        },
        # Row 2: Field modified diff (using a copy of existing student id with new phone)
        {
            "institutional_student_id": "EXISTING-001",
            "full_name": "Karan Malhotra",
            "apaar_id": existing_apaar,
            "dob": "2005-01-01",
            "gender": "Male",
            "seat_category": "GENERAL_BASE",
            "email": "karan.updated@sandboxtest.edu.in",
            "phone_number": "+91-9876599999",
            "pincode": "560001",
        },
        # Row 3: New insert (fills approved intake 2/2)
        {
            "institutional_student_id": "NEW-002",
            "full_name": "Deepika Sen",
            "apaar_id": apaar_new_1,
            "dob": "2005-03-15",
            "gender": "Female",
            "seat_category": "GENERAL_BASE",
            "email": "deepika@sandboxtest.edu.in",
            "phone_number": "+91-9876500002",
        },
        # Row 4: Quota breach (3/2 base students)
        {
            "institutional_student_id": "NEW-003",
            "full_name": "Vikram Seth",
            "apaar_id": apaar_new_2,
            "dob": "2005-04-20",
            "gender": "Male",
            "seat_category": "GENERAL_BASE",
            "email": "vikram@sandboxtest.edu.in",
            "phone_number": "+91-9876500003",
        },
        # Row 5: Missing passport for OCI
        {
            "institutional_student_id": "OCI-001",
            "full_name": "Maya Lin",
            "apaar_id": None,
            "dob": "2005-06-10",
            "gender": "Female",
            "seat_category": "OCI_SUPERNUMERARY",
            "passport_or_oci_number": "",  # Missing!
        },
    ]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/ingest/sandbox-diff",
            json={
                "institution_id": inst_id,
                "program_quota_id": quota_id,
                "simulate_registry_downtime": False,
                "rows": rows_payload,
            },
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_rows"] == 5
        rows = data["rows"]

        # Check Row 1
        assert rows[0]["delta_type"] == "IDEMPOTENT_NO_CHANGE"
        assert rows[0]["validation_status"] == "ACCEPTED"

        # Check Row 2
        assert rows[1]["delta_type"] == "FIELD_MODIFIED_DIFF"
        assert "email" in rows[1]["field_diffs"]
        assert rows[1]["field_diffs"]["email"]["new"] == "karan.updated@sandboxtest.edu.in"
        assert "phone_number" in rows[1]["field_diffs"]

        # Check Row 3
        assert rows[2]["delta_type"] == "NEW_INSERT"
        assert rows[2]["validation_status"] == "ACCEPTED"

        # Check Row 4 (Quota breach)
        assert rows[3]["delta_type"] == "REJECTED_OR_FLAGGED"
        assert rows[3]["validation_status"] == "FLAGGED_VIOLATION"
        assert any(f["code"] == "BASE_APPROVED_INTAKE_EXCEEDED" for f in rows[3]["flag_reasons"])

        # Check Row 5 (Missing Passport / Provisional token generated)
        assert rows[4]["delta_type"] == "REJECTED_OR_FLAGGED"
        assert rows[4]["validation_status"] == "FLAGGED_VIOLATION"
        assert rows[4]["provisional_token"] is not None
        assert rows[4]["provisional_token"].startswith("PROV-APN-")
        assert any(f["code"] == "MISSING_PASSPORT_OCI_CREDENTIAL" for f in rows[4]["flag_reasons"])

        # Verify CSV error report contains the 2 flagged rows
        assert "Row,Institutional Roll,Student Name" in data["error_report_csv"]
        assert "BASE_APPROVED_INTAKE_EXCEEDED" in data["error_report_csv"]
        assert "MISSING_PASSPORT_OCI_CREDENTIAL" in data["error_report_csv"]


@pytest.mark.asyncio
async def test_registry_downtime_resilience():
    """Verify that simulate_registry_downtime marks records UNVERIFIED_PENDING_REGISTRY instead of rejecting."""
    async with AsyncSessionLocal() as session:
        inst = Institution(
            aicte_permanent_id=f"1-DT-{uuid.uuid4().hex[:6]}",
            aishe_code=f"C-DT-{uuid.uuid4().hex[:4]}",
            name="Downtime Resilience Institute",
            state="Delhi",
            district="New Delhi",
            institution_type=InstitutionType.AFFILIATED,
            official_email_domain="dtresilience.edu.in",
            compliance_risk_score=0.01,
        )
        session.add(inst)
        await session.flush()

        quota = ProgramQuota(
            institution_id=inst.id,
            academic_year="2026-27",
            program_name="B.Tech Computer Science",
            course_code=f"CS-DT-{uuid.uuid4().hex[:4]}",
            delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
            approved_intake=60,
            nri_5pct_internal_cap=3,
            fn_oci_ciwgc_15pct_supernumerary_cap=9,
            tfw_5pct_supernumerary_cap=3,
            pmsss_supernumerary_cap=2,
            lateral_entry_2nd_yr_cap=6,
        )
        session.add(quota)
        await session.commit()

        inst_id = str(inst.id)
        quota_id = str(quota.id)

    apaar = generate_valid_apaar_id("98712345678")
    payload = {
        "institution_id": inst_id,
        "program_quota_id": quota_id,
        "simulate_registry_downtime": True,
        "rows": [
            {
                "institutional_student_id": "DT-001",
                "full_name": "Rajesh Kumar",
                "apaar_id": apaar,
                "dob": "2005-02-14",
                "gender": "Male",
                "seat_category": "GENERAL_BASE",
            }
        ],
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/ingest/sandbox-diff", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        row = data["rows"][0]
        assert row["validation_status"] == "UNVERIFIED_PENDING_REGISTRY"
        assert any(f["code"] == "REGISTRY_DOWNTIME_DEFERRED" for f in row["flag_reasons"])


@pytest.mark.asyncio
async def test_idempotent_double_commit_and_merkle_audit():
    """
    Verify:
    1. First batch commit inserts records and generates Ed25519 checkpoint signature.
    2. Second commit of identical batch skips all rows (idempotent, 0 duplicates).
    3. Merkle audit log record hash is cryptographically verifiable.
    """
    async with AsyncSessionLocal() as session:
        inst = Institution(
            aicte_permanent_id=f"1-IDEM-{uuid.uuid4().hex[:6]}",
            aishe_code=f"C-IDEM-{uuid.uuid4().hex[:4]}",
            name="Idempotency Test Institute",
            state="Maharashtra",
            district="Pune",
            institution_type=InstitutionType.ENGINEERING,
            official_email_domain="idemtest.edu.in",
            compliance_risk_score=0.01,
        )
        session.add(inst)
        await session.flush()

        quota = ProgramQuota(
            institution_id=inst.id,
            academic_year="2026-27",
            program_name="B.Tech Computer Science",
            course_code="CSE-IDEM-60",
            delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
            approved_intake=60,
            nri_5pct_internal_cap=3,
            fn_oci_ciwgc_15pct_supernumerary_cap=9,
            tfw_5pct_supernumerary_cap=3,
            pmsss_supernumerary_cap=2,
            lateral_entry_2nd_yr_cap=6,
        )
        session.add(quota)
        await session.commit()

        inst_id = str(inst.id)
        quota_id = str(quota.id)

    apaar_1 = generate_valid_apaar_id("77711122233")
    apaar_2 = generate_valid_apaar_id("77711122244")

    batch_rows = [
        {
            "institutional_student_id": "IDEM-STU-01",
            "full_name": "Ananya Roy",
            "apaar_id": apaar_1,
            "dob": "2005-09-01",
            "gender": "Female",
            "seat_category": "GENERAL_BASE",
            "email": "ananya@idemtest.edu.in",
        },
        {
            "institutional_student_id": "IDEM-STU-02",
            "full_name": "Arjun Singhania",
            "apaar_id": apaar_2,
            "dob": "2005-10-15",
            "gender": "Male",
            "seat_category": "GENERAL_BASE",
            "email": "arjun@idemtest.edu.in",
        },
    ]

    commit_payload = {
        "institution_id": inst_id,
        "program_quota_id": quota_id,
        "rows": batch_rows,
        "allow_flagged_with_warning": True,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First commit
        resp_1 = await client.post("/api/v1/ingest/commit-batch", json=commit_payload)
        assert resp_1.status_code == 200
        data_1 = resp_1.json()

        assert data_1["status"] == "success"
        assert data_1["committed_new_inserts"] == 2
        assert data_1["skipped_idempotent"] == 0
        assert data_1["audit_sequence_number"] > 0
        assert data_1["audit_record_hash"] is not None
        assert data_1["merkle_signature"] is not None

        # Verify cryptographic signature of checkpoint
        assert verify_checkpoint_signature(
            hash_str=data_1["audit_record_hash"],
            signature_hex=data_1["merkle_signature"],
        ) is True

        # Second commit with the exact same data
        resp_2 = await client.post("/api/v1/ingest/commit-batch", json=commit_payload)
        assert resp_2.status_code == 200
        data_2 = resp_2.json()

        # Must skip both as idempotent with 0 new inserts
        assert data_2["committed_new_inserts"] == 0
        assert data_2["skipped_idempotent"] == 2

    # Verify that database contains exactly 2 students in this quota (no duplicates created)
    async with AsyncSessionLocal() as session:
        count_res = await session.execute(
            select(StudentEnrolment).where(
                StudentEnrolment.program_quota_id == uuid.UUID(quota_id),
                StudentEnrolment.institutional_student_id.in_(["IDEM-STU-01", "IDEM-STU-02"]),
            )
        )
        students = count_res.scalars().all()
        assert len(students) == 2

