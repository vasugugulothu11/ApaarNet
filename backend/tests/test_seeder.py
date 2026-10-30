"""
Integration and Unit Tests for ApaarNet Synthetic Seeder & Planted Anomaly Cases.

Verifies:
1. Fast, clean execution and idempotency of seed_apaarnet_database.
2. Case A: Supernumerary Quota USP (Apex B.Tech CSE 240 Base + 36 Supernumerary + 6 Excess = 282).
3. Case B: Lawful UGC Dual-Degree (Physical Regular + Online ODL).
4. Case C: Illegal Cross-State Regular Duplicate (TN + KA concurrent full-time regular).
5. Case D: Phonetic Evasion under Provisional Token vs. Genuine Twin Disambiguation.
6. Case E: 8-Student Ghost Admission Ring & Seat-Blocking Anomaly (Deccan Valley + Metro Tech).
7. Admin HTTP Endpoint POST /api/v1/admin/reseed-demo.
"""

from datetime import date
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select

from app.core.quota_engine import QuotaEngine
from app.core.seeder import reset_database, seed_apaarnet_database
from app.core.verhoeff import generate_valid_apaar_id
from app.database import AsyncSessionLocal
from app.main import app
from app.models import (
    CollisionType,
    DeliveryMode,
    DisputeStatus,
    DisputeTicket,
    Institution,
    ProgramQuota,
    SeatCategory,
    StudentEnrolment,
    ValidationStatus,
)


@pytest.mark.asyncio
async def test_seeder_execution_and_counts():
    """Verify that seeder executes cleanly and populates 50 institutions across 10 states."""
    async with AsyncSessionLocal() as session:
        result = await seed_apaarnet_database(session)

    assert result["status"] == "success"
    assert result["institutions_count"] == 50
    assert result["quotas_count"] >= 51
    assert result["students_count"] >= 1400
    assert result["disputes_count"] == 2

    # Verify counts in Postgres
    async with AsyncSessionLocal() as session:
        inst_count = (await session.execute(select(func.count(Institution.id)))).scalar_one()
        quota_count = (await session.execute(select(func.count(ProgramQuota.id)))).scalar_one()
        student_count = (await session.execute(select(func.count(StudentEnrolment.id)))).scalar_one()
        states_count = (await session.execute(select(func.count(func.distinct(Institution.state))))).scalar_one()

        assert inst_count == 50
        assert quota_count >= 51
        assert student_count >= 1400
        assert states_count == 10


@pytest.mark.asyncio
async def test_seeder_idempotency():
    """Verify that re-running the seeder clears and re-populates without unique/FK errors."""
    async with AsyncSessionLocal() as session:
        result_1 = await seed_apaarnet_database(session)
        result_2 = await seed_apaarnet_database(session)

    assert result_1["institutions_count"] == result_2["institutions_count"] == 50
    assert result_1["quotas_count"] == result_2["quotas_count"]
    assert result_1["students_count"] == result_2["students_count"]
    assert result_1["disputes_count"] == result_2["disputes_count"] == 2


@pytest.mark.asyncio
async def test_case_a_supernumerary_quota_usp():
    """
    Case A (Supernumerary Quota USP):
    Apex Institute of Technology (1-10000001), CSE-240:
    - Approved intake: 240
    - NRI 5% internal cap: 12 (within 240)
    - FN/OCI/CIWGC 15% supernumerary cap: 36 (24 OCI + 12 CIWGC)
    - Seeded students: 228 Base + 12 NRI + 24 OCI + 12 CIWGC + 6 Excess Base = 282 students.
    - Naive Quota Engine would flag 42 students (282 - 240).
    - ApaarNet Engine correctly flags only the 6 excess base students!
    """
    async with AsyncSessionLocal() as session:
        # Fetch Apex Institute and CSE-240 Quota
        inst_res = await session.execute(
            select(Institution).where(Institution.aicte_permanent_id == "1-10000001")
        )
        apex_inst = inst_res.scalar_one()
        assert apex_inst.name == "Apex Institute of Technology"

        quota_res = await session.execute(
            select(ProgramQuota).where(
                ProgramQuota.institution_id == apex_inst.id,
                ProgramQuota.course_code == "CSE-240",
            )
        )
        cse_quota = quota_res.scalar_one()
        assert cse_quota.approved_intake == 240
        assert cse_quota.nri_5pct_internal_cap == 12
        assert cse_quota.fn_oci_ciwgc_15pct_supernumerary_cap == 36

        # Fetch enrolled students
        students_res = await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.program_quota_id == cse_quota.id)
        )
        enrolled = students_res.scalars().all()
        assert len(enrolled) == 282

        # Count categories
        base_accepted = [s for s in enrolled if s.seat_category == SeatCategory.GENERAL_BASE and s.validation_status == ValidationStatus.ACCEPTED]
        nri_accepted = [s for s in enrolled if s.seat_category == SeatCategory.NRI_INTERNAL and s.validation_status == ValidationStatus.ACCEPTED]
        oci_accepted = [s for s in enrolled if s.seat_category == SeatCategory.OCI_SUPERNUMERARY and s.validation_status == ValidationStatus.ACCEPTED]
        ciwgc_accepted = [s for s in enrolled if s.seat_category == SeatCategory.CIWGC_SUPERNUMERARY and s.validation_status == ValidationStatus.ACCEPTED]
        excess_flagged = [s for s in enrolled if s.validation_status == ValidationStatus.FLAGGED_VIOLATION]

        assert len(base_accepted) == 228
        assert len(nri_accepted) == 12
        assert len(base_accepted) + len(nri_accepted) == 240  # Exactly fills 240 approved base intake
        assert len(oci_accepted) == 24
        assert len(ciwgc_accepted) == 12
        assert len(excess_flagged) == 6

        # Verify passport/OCI numbers are set for all 36 supernumerary students
        for s in oci_accepted + ciwgc_accepted:
            assert s.passport_or_oci_number is not None
            assert len(s.passport_or_oci_number) > 5

        # Verify excess violation reason
        for s in excess_flagged:
            assert any(f.get("code") == "BASE_APPROVED_INTAKE_EXCEEDED" for f in s.flag_reasons)
            assert any(f.get("rule") == "APH-2026-SEC-2.1" for f in s.flag_reasons)

        # Run QuotaEngine comparison: Naive vs ApaarNet
        comparison = await QuotaEngine.compare_naive_vs_apaarnet(session, cse_quota.id)
        assert comparison["metrics"]["total_enrolled"] == 282
        assert comparison["metrics"]["sanctioned_approved_intake"] == 240
        assert comparison["naive_flat_system"]["apparent_excess_flagged"] == 42
        assert comparison["apaarnet_quota_ledger"]["actual_excess_flagged"] == 6
        assert comparison["impact_summary"]["false_positive_flags_eliminated"] == 36


@pytest.mark.asyncio
async def test_case_b_lawful_ugc_dual_degree():
    """
    Case B (Lawful UGC Dual-Degree):
    Student 'Aarav Sharma' (APAAR 482910384715) enrolled simultaneously in:
    1. B.Tech Mechanical (REGULAR_PHYSICAL) at Apex Institute of Technology
    2. Diploma in Data Science (ONLINE_ODL) at National Institute of Computing & Science
    Both must be ACCEPTED under UGC Guidelines 2022 without false collision flags.
    """
    apaar_b = generate_valid_apaar_id("48291038471")

    async with AsyncSessionLocal() as session:
        records_res = await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.apaar_id == apaar_b)
        )
        records = records_res.scalars().all()
        assert len(records) == 2

        # Check institutions
        inst_ids = {r.institution_id for r in records}
        assert len(inst_ids) == 2

        # Check delivery modes
        quotas_res = await session.execute(
            select(ProgramQuota).where(ProgramQuota.id.in_([r.program_quota_id for r in records]))
        )
        quotas = {q.id: q for q in quotas_res.scalars().all()}

        modes = [quotas[r.program_quota_id].delivery_mode for r in records]
        assert DeliveryMode.REGULAR_PHYSICAL in modes
        assert DeliveryMode.ONLINE_ODL in modes

        # Both records must be ACCEPTED
        for r in records:
            assert r.validation_status == ValidationStatus.ACCEPTED
            assert r.full_name == "Aarav Sharma"
            assert r.parent_initials == "K.S."


@pytest.mark.asyncio
async def test_case_c_illegal_cross_state_regular_duplicate():
    """
    Case C (Illegal Cross-State Regular Duplicate):
    Student 'Priya Nair' (APAAR 739201846297) enrolled in two full-time REGULAR_PHYSICAL
    programs in Tamil Nadu (PSG) and Karnataka (BMS) simultaneously.
    Both records must be FLAGGED_VIOLATION and a tri-party DisputeTicket generated.
    """
    apaar_c = generate_valid_apaar_id("73920184629")

    async with AsyncSessionLocal() as session:
        records_res = await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.apaar_id == apaar_c)
        )
        records = records_res.scalars().all()
        assert len(records) == 2

        # Both records must be FLAGGED_VIOLATION with CONCURRENT_REGULAR_COLLISION
        for r in records:
            assert r.validation_status == ValidationStatus.FLAGGED_VIOLATION
            assert any(f.get("code") == "CONCURRENT_REGULAR_COLLISION" for f in r.flag_reasons)
            assert r.full_name == "Priya Nair"

        # Check tri-party dispute ticket
        ticket_res = await session.execute(
            select(DisputeTicket).where(DisputeTicket.student_apaar_or_token == apaar_c)
        )
        ticket = ticket_res.scalar_one()
        assert ticket.status == DisputeStatus.OPEN_TRI_PARTY
        assert ticket.collision_type == CollisionType.EXACT_APAAR_REGULAR_CONFLICT
        assert ticket.college_a_id is not None
        assert ticket.college_b_id is not None
        assert ticket.evidence_log["student_name"] == "Priya Nair"


@pytest.mark.asyncio
async def test_case_d_phonetic_duplicate_evasion_and_twins():
    """
    Case D:
    1. Unlinked Phonetic Duplicate Evasion:
       - 'Mohammed Rayyan Khan' at HIT (valid APAAR)
       - 'Mohd. Rayan Khan' at SCE (provisional token 'PROV-APN-9001', matching DOB/pincode/parent)
       - Second record flagged as demographic collision with tri-party dispute ticket.
    2. Twin Disambiguation:
       - Twins 'Rohan Deshmukh' and 'Sohan Deshmukh' at HIT share DOB, parent, phone, pincode.
       - Have distinct roll numbers and distinct valid APAAR IDs.
       - Both ACCEPTED and NOT falsely merged.
    """
    async with AsyncSessionLocal() as session:
        # Part 1: Phonetic Evasion
        apaar_d = generate_valid_apaar_id("55192837461")
        rec_hit = (await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.apaar_id == apaar_d)
        )).scalar_one()
        assert rec_hit.full_name == "Mohammed Rayyan Khan"
        assert rec_hit.dob == date(2006, 5, 14)
        assert rec_hit.pincode == "500032"
        assert rec_hit.parent_initials == "S.K."

        rec_sce = (await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.provisional_token == "PROV-APN-9001")
        )).scalar_one()
        assert rec_sce.full_name == "Mohd. Rayan Khan"
        assert rec_sce.dob == date(2006, 5, 14)
        assert rec_sce.pincode == "500032"
        assert rec_sce.parent_initials == "S.K."
        assert rec_sce.validation_status == ValidationStatus.FLAGGED_VIOLATION
        assert any(f.get("code") == "PHONETIC_DEMOGRAPHIC_COLLISION" for f in rec_sce.flag_reasons)

        ticket_d = (await session.execute(
            select(DisputeTicket).where(DisputeTicket.student_apaar_or_token == "PROV-APN-9001")
        )).scalar_one()
        assert ticket_d.status == DisputeStatus.OPEN_TRI_PARTY
        assert ticket_d.collision_type == CollisionType.PHONETIC_PROVISIONAL_MATCH

        # Part 2: Twin Disambiguation
        twin_1_id = generate_valid_apaar_id("61029384751")
        twin_2_id = generate_valid_apaar_id("61029384752")

        t1 = (await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.apaar_id == twin_1_id)
        )).scalar_one()
        t2 = (await session.execute(
            select(StudentEnrolment).where(StudentEnrolment.apaar_id == twin_2_id)
        )).scalar_one()

        assert t1.full_name == "Rohan Deshmukh"
        assert t2.full_name == "Sohan Deshmukh"
        assert t1.dob == t2.dob == date(2006, 8, 19)
        assert t1.parent_initials == t2.parent_initials == "V.D."
        assert t1.phone_number == t2.phone_number == "+91-9822011223"
        assert t1.pincode == t2.pincode == "411001"
        assert t1.institutional_student_id != t2.institutional_student_id
        assert t1.apaar_id != t2.apaar_id
        assert t1.validation_status == ValidationStatus.ACCEPTED
        assert t2.validation_status == ValidationStatus.ACCEPTED


@pytest.mark.asyncio
async def test_case_e_ghost_admission_ring_and_burst():
    """
    Case E (8-Student Ghost Admission Ring & Seat-Blocking Anomaly):
    At Deccan Valley (1-10000005) and Metro Tech (1-10000006), 8 synthetic students
    share the exact same phone (+91-9876543210), bank_account_hash (BANK-RING-999),
    and identical birth dates (2006-01-01), with clustered upload burst timestamps.
    All 8 records must be FLAGGED_VIOLATION.
    """
    async with AsyncSessionLocal() as session:
        ring_res = await session.execute(
            select(StudentEnrolment).where(
                StudentEnrolment.phone_number == "+91-9876543210",
                StudentEnrolment.bank_account_hash == "BANK-RING-999",
            )
        )
        ring_students = ring_res.scalars().all()
        assert len(ring_students) == 8

        # 5 at Deccan Valley, 3 at Metro Tech
        inst_ids = {s.institution_id for s in ring_students}
        assert len(inst_ids) == 2

        inst_res = await session.execute(
            select(Institution).where(Institution.id.in_(inst_ids))
        )
        colleges = {i.id: i.name for i in inst_res.scalars().all()}
        assert "Deccan Valley Engineering College" in colleges.values()
        assert "Metro Tech Institute" in colleges.values()

        dvc_count = sum(1 for s in ring_students if colleges[s.institution_id] == "Deccan Valley Engineering College")
        metro_count = sum(1 for s in ring_students if colleges[s.institution_id] == "Metro Tech Institute")
        assert dvc_count == 5
        assert metro_count == 3

        # All 8 students share DOB and are flagged
        for s in ring_students:
            assert s.dob == date(2006, 1, 1)
            assert s.validation_status == ValidationStatus.FLAGGED_VIOLATION
            assert any(f.get("code") == "SYNDICATE_BURST_ENROLMENT" for f in s.flag_reasons)


@pytest.mark.asyncio
async def test_admin_reseed_endpoint():
    """Verify that POST /api/v1/admin/reseed-demo returns 200 OK and valid summary payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/admin/reseed-demo")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["institutions_count"] == 50
        assert data["quotas_count"] >= 51
        assert data["students_count"] >= 1400
        assert data["disputes_count"] == 2
        assert "case_a_quota_usp" in data["demonstration_cases"]
        assert "case_b_ugc_dual_degree" in data["demonstration_cases"]
        assert "case_c_cross_state_duplicate" in data["demonstration_cases"]
        assert "case_d_phonetic_evasion" in data["demonstration_cases"]
        assert "case_e_ghost_ring" in data["demonstration_cases"]
