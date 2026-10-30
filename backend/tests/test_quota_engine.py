import uuid
from datetime import date
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.database import AsyncSessionLocal, init_db
from app.models import (
    DeliveryMode,
    Institution,
    InstitutionType,
    ProgramQuota,
    SeatCategory,
    StudentEnrolment,
    ValidationStatus,
)
from app.core.verhoeff import generate_valid_apaar_id, validate_apaar_id
from app.adapters.apaar_registry import ApaarRegistryAdapter
from app.core.quota_engine import QuotaEngine


def test_verhoeff_validation_and_generation():
    """Verify full Verhoeff D5 dihedral group algorithm for APAAR IDs."""
    # 1. Generate valid 12-digit APAAR from 11 digits
    eleven = "98765432109"
    twelve = generate_valid_apaar_id(eleven)
    assert len(twelve) == 12
    assert twelve.startswith(eleven)

    # 2. Validate genuine ID
    is_valid, msg = validate_apaar_id(twelve)
    assert is_valid is True
    assert "authentic" in msg.lower()

    # 3. Single-digit substitution error must be rejected
    last_digit = int(twelve[-1])
    tampered_last = twelve[:-1] + str((last_digit + 1) % 10)
    is_valid, msg = validate_apaar_id(tampered_last)
    assert is_valid is False
    assert "failed verhoeff" in msg.lower()

    # 4. Adjacent transposition error (e.g. 54 -> 45) must be rejected
    transposed = twelve[:4] + twelve[5] + twelve[4] + twelve[6:]
    is_valid, msg = validate_apaar_id(transposed)
    assert is_valid is False

    # 5. Length and type validations
    assert validate_apaar_id("12345")[0] is False
    assert validate_apaar_id("1234567890123")[0] is False
    assert validate_apaar_id("12345678901A")[0] is False


def test_apaar_registry_adapter():
    """Verify Mock DigiLocker / ABC Registry lookup, downtime fallback, and provisional tokens."""
    adapter = ApaarRegistryAdapter(simulate_registry_downtime=False)

    # 1. Verified student
    res = adapter.verify_student(
        apaar_id="202610291230",
        full_name="Aarav Sharma",
        dob="2005-05-15",
    )
    assert res["status"] == "VERIFIED"
    assert res["validation_status"] == "ACCEPTED"
    assert res["digilocker_verified"] is True
    assert res["abc_id"] == "ABC-9910-1200-4411"

    # 2. Demographic mismatch (different name for same APAAR)
    res_mismatch = adapter.verify_student(
        apaar_id="202610291230",
        full_name="Vikramaditya Singhania",
        dob="2005-05-15",
    )
    assert res_mismatch["status"] == "DEMOGRAPHIC_MISMATCH"
    assert res_mismatch["validation_status"] == "WARNING_REVIEW"
    assert len(res_mismatch["flag_reasons"]) == 1

    # 3. Simulated Registry Downtime -> Non-destructive fallback to UNVERIFIED_PENDING_REGISTRY
    adapter_downtime = ApaarRegistryAdapter(simulate_registry_downtime=True)
    res_down = adapter_downtime.verify_student(
        apaar_id="202610291230",
        full_name="Aarav Sharma",
    )
    assert res_down["status"] == "DOWNTIME_DEFERRED"
    assert res_down["validation_status"] == "UNVERIFIED_PENDING_REGISTRY"
    assert res_down["retry_queued"] is True
    assert res_down["flag_reasons"][0]["code"] == "REGISTRY_DOWNTIME_DEFERRED"

    # 4. Foreign National / Opt-Out -> Issues idempotent PROV-APN-XXXX token
    res_fn = adapter.verify_student(
        apaar_id=None,
        full_name="Jean Dupont",
        seat_category="FN_SUPERNUMERARY",
        institution_id="INST-101",
        student_roll="FN-2026-001",
    )
    assert res_fn["status"] == "PROVISIONAL_EXEMPT"
    assert res_fn["validation_status"] == "ACCEPTED"
    assert res_fn["provisional_token"].startswith("PROV-APN-")

    # Idempotence check: same input must generate identical provisional token
    token2 = adapter.generate_provisional_token("INST-101", "FN-2026-001")
    assert res_fn["provisional_token"] == token2


@pytest.mark.asyncio
async def test_quota_ledger_and_naive_comparison():
    """
    Demonstrates USP:
    For a 240-seat course with 24 OCI + 12 CIWGC + 6 excess students (total 282),
    verifies that a Naive Flat Counter falsely flags 42 students, whereas
    ApaarNet Quota Ledger recognizes 276 lawful seats and flags ONLY 6 excess students.
    """
    await init_db()

    async with AsyncSessionLocal() as session:
        # Create test institution
        suffix = uuid.uuid4().hex[:6]
        institution = Institution(
            aicte_permanent_id=f"1-COEP-{suffix}",
            aishe_code=f"C-3030-{suffix}",
            name="Pune Institute of Engineering & Technology",
            state="Maharashtra",
            district="Pune",
            institution_type=InstitutionType.AUTONOMOUS,
            official_email_domain="piet.ac.in",
            compliance_risk_score=0.01,
        )
        session.add(institution)
        await session.flush()

        # Create 240-seat program quota
        # 15% of 240 = 36 supernumerary seats
        quota = ProgramQuota(
            institution_id=institution.id,
            academic_year="2026-27",
            program_name="B.Tech Artificial Intelligence & Data Science",
            course_code=f"AIDS-{suffix}",
            delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
            approved_intake=240,
            nri_5pct_internal_cap=12,
            fn_oci_ciwgc_15pct_supernumerary_cap=36,
            tfw_5pct_supernumerary_cap=12,
            pmsss_supernumerary_cap=5,
            lateral_entry_2nd_yr_cap=24,
        )
        session.add(quota)
        await session.flush()

        # Batch insert students:
        # a) 240 regular general base students
        # b) 24 OCI supernumerary students
        # c) 12 CIWGC supernumerary students
        # d) 6 excess base students
        # Total = 282 students
        students = []

        # 240 General Base
        for i in range(1, 241):
            eleven = f"1000{i:07d}"
            apaar = generate_valid_apaar_id(eleven)
            students.append(
                StudentEnrolment(
                    apaar_id=apaar,
                    institutional_student_id=f"STU-BASE-{i:03d}",
                    institution_id=institution.id,
                    program_quota_id=quota.id,
                    full_name=f"General Student {i}",
                    phonetic_name_code=f"GNST{i}",
                    dob=date(2005, 1, 1),
                    gender="Female" if i % 2 == 0 else "Male",
                    seat_category=SeatCategory.GENERAL_BASE,
                    validation_status=ValidationStatus.ACCEPTED,
                    flag_reasons=[],
                )
            )

        # 24 OCI Supernumerary (valid passport/OCI provided)
        for i in range(1, 25):
            eleven = f"2000{i:07d}"
            apaar = generate_valid_apaar_id(eleven)
            students.append(
                StudentEnrolment(
                    apaar_id=apaar,
                    institutional_student_id=f"STU-OCI-{i:03d}",
                    institution_id=institution.id,
                    program_quota_id=quota.id,
                    full_name=f"OCI Student {i}",
                    phonetic_name_code=f"OCST{i}",
                    dob=date(2005, 2, 2),
                    gender="Male",
                    seat_category=SeatCategory.OCI_SUPERNUMERARY,
                    passport_or_oci_number=f"OCI-IND-{10000+i}",
                    validation_status=ValidationStatus.ACCEPTED,
                    flag_reasons=[],
                )
            )

        # 12 CIWGC Supernumerary
        for i in range(1, 13):
            eleven = f"3000{i:07d}"
            apaar = generate_valid_apaar_id(eleven)
            students.append(
                StudentEnrolment(
                    apaar_id=apaar,
                    institutional_student_id=f"STU-CIWGC-{i:03d}",
                    institution_id=institution.id,
                    program_quota_id=quota.id,
                    full_name=f"CIWGC Student {i}",
                    phonetic_name_code=f"CWST{i}",
                    dob=date(2005, 3, 3),
                    gender="Female",
                    seat_category=SeatCategory.CIWGC_SUPERNUMERARY,
                    passport_or_oci_number=f"UAE-VISA-{20000+i}",
                    validation_status=ValidationStatus.ACCEPTED,
                    flag_reasons=[],
                )
            )

        # 6 Excess Base Students
        for i in range(241, 247):
            eleven = f"1000{i:07d}"
            apaar = generate_valid_apaar_id(eleven)
            students.append(
                StudentEnrolment(
                    apaar_id=apaar,
                    institutional_student_id=f"STU-EXCESS-{i:03d}",
                    institution_id=institution.id,
                    program_quota_id=quota.id,
                    full_name=f"Excess Student {i}",
                    phonetic_name_code=f"EXST{i}",
                    dob=date(2005, 4, 4),
                    gender="Male",
                    seat_category=SeatCategory.GENERAL_BASE,
                    validation_status=ValidationStatus.FLAGGED_VIOLATION,
                    flag_reasons=[{"code": "BASE_APPROVED_INTAKE_EXCEEDED"}],
                )
            )

        session.add_all(students)
        await session.commit()

        # Run comparison between Naive Counter and ApaarNet Quota Ledger
        comparison = await QuotaEngine.compare_naive_vs_apaarnet(session, quota.id)

        # Assert total counts
        assert comparison["metrics"]["total_enrolled"] == 282
        assert comparison["metrics"]["sanctioned_approved_intake"] == 240
        assert comparison["metrics"]["lawful_supernumerary_allowance"] == 77  # 36 (FN/OCI) + 12 (TFW) + 5 (PMSSS) + 24 (Lateral)
        
        # NAIVE COUNTER: Falsely flags 42 students (282 - 240)
        assert comparison["naive_flat_system"]["apparent_excess_flagged"] == 42
        
        # APAARNET QUOTA LEDGER: Recognizes 276 lawful seats (240 base + 24 OCI + 12 CIWGC)
        # Flags ONLY the 6 true excess base students
        assert comparison["apaarnet_quota_ledger"]["actual_excess_flagged"] == 6
        
        # IMPACT: 36 false positive violations eliminated (85.71% false positive reduction)
        assert comparison["impact_summary"]["false_positive_flags_eliminated"] == 36
        assert comparison["impact_summary"]["false_positive_reduction_percentage"] > 85.0

        # Exact AICTE APH rule citation verification
        violations = comparison["apaarnet_quota_ledger"]["violations_cited"]
        assert len(violations) == 1
        assert violations[0]["rule"] == "APH-2026-SEC-2.1"
        assert violations[0]["code"] == "BASE_APPROVED_INTAKE_EXCEEDED"
        assert violations[0]["excess"] == 6


@pytest.mark.asyncio
async def test_quota_api_endpoints():
    """Verify /api/v1/quota/status and /api/v1/quota/compare endpoints via FastAPI AsyncClient."""
    await init_db()

    async with AsyncSessionLocal() as session:
        suffix = uuid.uuid4().hex[:6]
        inst = Institution(
            aicte_permanent_id=f"1-API-{suffix}",
            name="Apex Institute of Technology",
            state="Karnataka",
            district="Bangalore Urban",
            institution_type=InstitutionType.AFFILIATED,
            official_email_domain="apex.edu.in",
        )
        session.add(inst)
        await session.flush()

        quota = ProgramQuota(
            institution_id=inst.id,
            academic_year="2026-27",
            program_name="B.Tech Information Science",
            course_code=f"ISE-{suffix}",
            approved_intake=60,
            nri_5pct_internal_cap=3,
            fn_oci_ciwgc_15pct_supernumerary_cap=9,
            tfw_5pct_supernumerary_cap=3,
            pmsss_supernumerary_cap=2,
            lateral_entry_2nd_yr_cap=6,
        )
        session.add(quota)
        await session.commit()
        quota_id_str = str(quota.id)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test status endpoint
        resp_status = await client.get(f"/api/v1/quota/status/{quota_id_str}")
        assert resp_status.status_code == 200
        data_status = resp_status.json()
        assert data_status["program_quota_id"] == quota_id_str
        assert data_status["approved_intake"] == 60
        assert "breakdown" in data_status
        assert data_status["is_compliant"] is True

        # 2. Test compare endpoint
        resp_compare = await client.get(f"/api/v1/quota/compare/{quota_id_str}")
        assert resp_compare.status_code == 200
        data_compare = resp_compare.json()
        assert "naive_flat_system" in data_compare
        assert "apaarnet_quota_ledger" in data_compare
        assert "impact_summary" in data_compare

        # 3. Test non-existent UUID -> 404
        random_id = str(uuid.uuid4())
        resp_404 = await client.get(f"/api/v1/quota/status/{random_id}")
        assert resp_404.status_code == 404
