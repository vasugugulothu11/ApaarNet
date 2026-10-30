import uuid
from datetime import date, datetime, timedelta, timezone
import pytest
from sqlalchemy import select, text

from app.database import AsyncSessionLocal, init_db
from app.models import (
    CollisionType,
    ConsentRecord,
    DeliveryMode,
    DisclosureMode,
    DisputeStatus,
    DisputeTicket,
    Institution,
    InstitutionType,
    MerkleAuditLog,
    ProgramQuota,
    RequesterRole,
    SeatCategory,
    StudentEnrolment,
    ValidationStatus,
)
from app.crypto.merkle_audit import (
    append_audit_event,
    simulate_tamper_demonstration,
    verify_audit_chain,
)


@pytest.mark.asyncio
async def test_models_and_tables_creation():
    """Verify all 6 core tables can be instantiated, persisted, and queried."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Create Institution
        unique_suffix = uuid.uuid4().hex[:6]
        institution = Institution(
            aicte_permanent_id=f"1-COEP-{unique_suffix}",
            aishe_code=f"C-10101-{unique_suffix}",
            name="College of Engineering Pune (COEP)",
            state="Maharashtra",
            district="Pune",
            institution_type=InstitutionType.AUTONOMOUS,
            official_email_domain="coep.ac.in",
            compliance_risk_score=0.05,
        )
        session.add(institution)
        await session.flush()

        # 2. Create ProgramQuota
        quota = ProgramQuota(
            institution_id=institution.id,
            academic_year="2026-27",
            program_name="B.Tech Computer Engineering",
            course_code="COEP-CSE-01",
            delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
            approved_intake=120,
            nri_5pct_internal_cap=6,
            fn_oci_ciwgc_15pct_supernumerary_cap=18,
            tfw_5pct_supernumerary_cap=6,
            pmsss_supernumerary_cap=4,
            lateral_entry_2nd_yr_cap=12,
        )
        session.add(quota)
        await session.flush()

        # 3. Create StudentEnrolment
        student = StudentEnrolment(
            apaar_id="123456789012",
            institutional_student_id="COEP2026-CSE-001",
            institution_id=institution.id,
            program_quota_id=quota.id,
            full_name="Aarav Sharma",
            phonetic_name_code="ARVFSRM",
            dob=date(2005, 5, 15),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+919876543210",
            email="aarav.sharma@coep.ac.in",
            pincode="411005",
            validation_status=ValidationStatus.ACCEPTED,
            flag_reasons=[],
        )
        session.add(student)

        # 4. Create DisputeTicket
        inst_b = Institution(
            aicte_permanent_id=f"1-VJTI-{unique_suffix}",
            aishe_code=f"C-20202-{unique_suffix}",
            name="Veermata Jijabai Technological Institute (VJTI)",
            state="Maharashtra",
            district="Mumbai City",
            institution_type=InstitutionType.AUTONOMOUS,
            official_email_domain="vjti.ac.in",
            compliance_risk_score=0.02,
        )
        session.add(inst_b)
        await session.flush()

        dispute = DisputeTicket(
            student_apaar_or_token="123456789012",
            college_a_id=institution.id,
            college_b_id=inst_b.id,
            collision_type=CollisionType.EXACT_APAAR_REGULAR_CONFLICT,
            status=DisputeStatus.OPEN_TRI_PARTY,
            evidence_log={"note": "Concurrent admission flagged across COEP and VJTI"},
            officer_decision_reason=None,
        )
        session.add(dispute)

        # 5. Create ConsentRecord (DPDP Act)
        consent = ConsentRecord(
            apaar_id="123456789012",
            requester_name="Tata Consultancy Services (TCS) Campus Hiring",
            requester_role=RequesterRole.EMPLOYER,
            approved_fields=["full_name", "degree", "cgpa", "graduation_year"],
            disclosure_mode=DisclosureMode.ZERO_EXPOSURE_PREDICATE,
            passkey_or_otp_verified=True,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        session.add(consent)

        await session.commit()

        # Query and verify
        queried_student = await session.scalar(
            select(StudentEnrolment).where(StudentEnrolment.id == student.id)
        )
        assert queried_student is not None
        assert queried_student.apaar_id == "123456789012"
        assert queried_student.seat_category == SeatCategory.GENERAL_BASE
        assert queried_student.validation_status == ValidationStatus.ACCEPTED


@pytest.mark.asyncio
async def test_merkle_hash_chain_linking_and_trigger():
    """Verify append_audit_event produces linked SHA-256 hashes and valid Ed25519 checkpoints."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Append Event 1
        ev1 = await append_audit_event(
            session=session,
            actor_role="INSTITUTION_OPERATOR",
            action_type="BATCH_ENROLMENT_UPLOAD",
            entity_id="BATCH-001",
            payload_json={"uploaded_records": 60, "intake_year": "2026-27"},
            is_checkpoint=False,
        )
        assert ev1.seq_id >= 1
        assert len(ev1.record_hash) == 64

        # Append Event 2
        ev2 = await append_audit_event(
            session=session,
            actor_role="INSTITUTION_PRINCIPAL",
            action_type="BATCH_VERIFICATION_APPROVE",
            entity_id="BATCH-001",
            payload_json={"status": "APPROVED", "approver": "Principal Dr. K. Patil"},
            is_checkpoint=False,
        )
        # Event 2 prev_hash must link to Event 1 record_hash
        assert ev2.prev_hash == ev1.record_hash
        assert len(ev2.record_hash) == 64

        # Append Event 3 with Ed25519 signed checkpoint
        ev3 = await append_audit_event(
            session=session,
            actor_role="AICTE_REGIONAL_OFFICER",
            action_type="AUDIT_CHECKPOINT_SEAL",
            entity_id="BATCH-001",
            payload_json={"seal_type": "REGIONAL_SANCTIONED_SEAL", "score": 99.4},
            is_checkpoint=True,
        )
        assert ev3.prev_hash == ev2.record_hash
        assert ev3.checkpoint_signature is not None
        assert len(ev3.checkpoint_signature) == 128

        # Run cryptographic chain verification for this appended segment
        verification = await verify_audit_chain(
            session, start_seq_id=ev1.seq_id, end_seq_id=ev3.seq_id
        )
        assert verification["valid"] is True
        assert verification["checkpoints_verified"] == 1
        assert len(verification["errors"]) == 0



@pytest.mark.asyncio
async def test_merkle_immutability_trigger_rejection():
    """Verify that PostgreSQL trigger blocks any UPDATE or DELETE on merkle_audit_log."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Insert a sample log first
        log = await append_audit_event(
            session=session,
            actor_role="AICTE_AUDITOR",
            action_type="COMPLIANCE_INSPECTION",
            entity_id="INST-999",
            payload_json={"compliance": "PASS"},
        )
        target_id = log.seq_id

        # 1. Attempt UPDATE -> must be rejected
        with pytest.raises(Exception) as exc_update:
            await session.execute(
                text("UPDATE merkle_audit_log SET actor_role = 'ROGUE_ACTOR' WHERE seq_id = :id"),
                {"id": target_id},
            )
            await session.commit()
        assert "strictly prohibited" in str(exc_update.value).lower()
        await session.rollback()

        # 2. Attempt DELETE -> must be rejected
        with pytest.raises(Exception) as exc_delete:
            await session.execute(
                text("DELETE FROM merkle_audit_log WHERE seq_id = :id"),
                {"id": target_id},
            )
            await session.commit()
        assert "strictly prohibited" in str(exc_delete.value).lower()
        await session.rollback()


def test_simulate_tamper_demonstration():
    """Verify that in-memory tamper simulation detects any single-byte change."""
    result = simulate_tamper_demonstration()

    assert result["status"] == "tamper_detected"
    assert result["original_chain_valid"] is True
    assert result["local_hash_mismatch_detected"] is True
    assert result["chain_link_broken_detected"] is True
    assert result["ed25519_checkpoint_signature_rejected"] is True
    assert result["original_payload"]["student_count"] == 60
    assert result["tampered_payload"]["student_count"] == 61
    assert result["original_record_hash"] != result["tampered_record_hash"]
