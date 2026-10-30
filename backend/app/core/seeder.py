"""
Deterministic Seed Engine for ApaarNet (SIH26263).

Populates 50 AICTE-approved institutions across 10 Indian states with realistic
curricula, quota caps, and ~1,500+ synthetic student records, plus 5 deterministic
demonstration cases (Cases A, B, C, D, E) for live evaluation.
"""

import hashlib
import random
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Tuple
from faker import Faker
import jellyfish
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.verhoeff import generate_valid_apaar_id
from app.crypto.merkle_audit import append_audit_event
from app.models import (
    CollisionType,
    ConsentRecord,
    DeliveryMode,
    DisclosureMode,
    DisputeStatus,
    DisputeTicket,
    Institution,
    InstitutionType,
    ProgramQuota,
    RequesterRole,
    SeatCategory,
    StudentEnrolment,
    ValidationStatus,
    User,
)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}:{key.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password or ":" not in hashed_password:
            return False
        salt, key_hex = hashed_password.split(":", 1)
        test_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(test_key.hex(), key_hex)
    except Exception:
        return False

DEMO_USERS = [
    {
        "email": "admin@aicte-india.org",
        "password": "password123",
        "role": "NATIONAL_ADMIN",
        "name": "Dr. R. K. Verma",
        "title": "AICTE National Vigilance Director",
        "organization": "All India Council for Technical Education (HQ, New Delhi)",
        "identifier": "EMP-AICTE-0081",
        "allowed_dashboard_path": "/dashboard/admin",
    },
    {
        "email": "registrar@apex-inst.ac.in",
        "password": "password123",
        "role": "INSTITUTION_REGISTRAR",
        "name": "Prof. S. Kulkarni",
        "title": "Nodal Registrar, Apex Institute (AICTE: 1-10000001)",
        "organization": "Apex Institute of Technology, Bangalore Urban",
        "identifier": "INST-REG-10000001",
        "allowed_dashboard_path": "/institution-portal",
    },
    {
        "email": "aarav.sharma@student.apaar.in",
        "password": "password123",
        "role": "STUDENT_DATA_PRINCIPAL",
        "name": "Aarav Sharma",
        "title": "Student Data Principal (APAAR: 482910384715)",
        "organization": "Apex Institute of Technology — B.Tech Computer Science",
        "identifier": "APAAR-482910384715",
        "allowed_dashboard_path": "/consent-wallet",
    },
    {
        "email": "coe@tech-univ.ac.in",
        "password": "password123",
        "role": "UNIVERSITY_CONTROLLER",
        "name": "Dr. M. Nair",
        "title": "Controller of Examinations, Degree Issuing Authority",
        "organization": "Apex Technical University Examination Division",
        "identifier": "UNIV-COE-9042",
        "allowed_dashboard_path": "/degree-studio",
    },
]

fake = Faker("en_IN")
Faker.seed(26263)
random.seed(26263)

# 10 Indian States & Districts
INDIAN_STATES = [
    ("Karnataka", ["Bangalore Urban", "Mysuru", "Mangaluru", "Hubballi-Dharwad"]),
    ("Maharashtra", ["Pune", "Mumbai City", "Nagpur", "Nashik"]),
    ("Tamil Nadu", ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"]),
    ("Telangana", ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad"]),
    ("Uttar Pradesh", ["Lucknow", "Kanpur Nagar", "Gautam Buddha Nagar", "Varanasi"]),
    ("Delhi", ["New Delhi", "North Delhi", "South Delhi", "West Delhi"]),
    ("Gujarat", ["Ahmedabad", "Vadodara", "Surat", "Rajkot"]),
    ("West Bengal", ["Kolkata", "Paschim Bardhaman", "Darjeeling", "Howrah"]),
    ("Kerala", ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur"]),
    ("Andhra Pradesh", ["Visakhapatnam", "NTR (Vijayawada)", "Guntur", "Tirupati"]),
]

COLLEGE_PREFIXES = [
    "National Institute of Technology",
    "Apex Institute of Technology",
    "Sardar Patel College of Engineering",
    "Maharaja Agrasen Institute of Technology",
    "Birla Technical Institute",
    "Coimbatore Institute of Engineering",
    "Deccan Valley Engineering College",
    "Metro Tech Institute",
    "Vidyavardhini Technical University",
    "Aditya Institute of Science & Technology",
    "Heritage Institute of Technology",
    "Symbiosis Technical College",
    "Marathwada Institute of Technology",
    "St. Xavier Technical Campus",
    "Indira Gandhi Institute of Technology",
]


def get_phonetic_code(name: str) -> str:
    """Normalizes honorifics and produces Metaphone representation."""
    cleaned = (
        name.lower()
        .replace("mohd.", "mohammed")
        .replace("md.", "mohammed")
        .replace("ch.", "chandra")
        .strip()
    )
    return jellyfish.metaphone(cleaned)


async def reset_database(session: AsyncSession) -> None:
    """Cleans existing business entities idempotently before re-seeding."""
    from sqlalchemy import text
    await session.execute(text("TRUNCATE TABLE merkle_audit_log RESTART IDENTITY;"))
    await session.execute(delete(DisputeTicket))
    await session.execute(delete(ConsentRecord))
    await session.execute(delete(StudentEnrolment))
    await session.execute(delete(ProgramQuota))
    await session.execute(delete(Institution))
    await session.execute(delete(User))
    await session.commit()


async def seed_apaarnet_database(session: AsyncSession) -> Dict[str, Any]:
    """
    Executes full deterministic seeding of institutions, quotas, students,
    and the 5 demonstration anomaly scenarios.
    """
    # Deterministic seeding reset
    random.seed(26263)
    Faker.seed(26263)

    # 0. Clean database
    await reset_database(session)

    # 1. Create 50 Diverse Institutions across 10 States
    institutions: List[Institution] = []

    # Pin the 8 deterministic institutions required for Demonstration Cases A, B, C, D, E:
    pinned_institutions_data = [
        # Inst 1 (Cases A & B)
        ("1-10000001", "C-10001", "Apex Institute of Technology", "Karnataka", "Bangalore Urban", InstitutionType.AUTONOMOUS, "apex.edu.in", 0.02),
        # Inst 2 (Case B ODL)
        ("1-10000002", "C-10002", "National Institute of Computing & Science", "Karnataka", "Bangalore Urban", InstitutionType.AFFILIATED, "nics.edu.in", 0.01),
        # Inst 3 (Case C TN)
        ("1-10000003", "C-10003", "PSG Institute of Advanced Technology", "Tamil Nadu", "Coimbatore", InstitutionType.AUTONOMOUS, "psgiat.edu.in", 0.03),
        # Inst 4 (Case C KA)
        ("1-10000004", "C-10004", "BMS Institute of Engineering & Technology", "Karnataka", "Bangalore Urban", InstitutionType.AUTONOMOUS, "bmsiet.edu.in", 0.02),
        # Inst 5 (Case E Deccan Valley)
        ("1-10000005", "C-10005", "Deccan Valley Engineering College", "Maharashtra", "Pune", InstitutionType.ENGINEERING, "deccanvalley.edu.in", 0.85),
        # Inst 6 (Case E Metro Tech)
        ("1-10000006", "C-10006", "Metro Tech Institute", "Maharashtra", "Mumbai City", InstitutionType.AFFILIATED, "metrotech.edu.in", 0.78),
        # Inst 7 (Case D Hyderabad)
        ("1-10000007", "C-10007", "Hyderabad Institute of Technology", "Telangana", "Hyderabad", InstitutionType.AUTONOMOUS, "hit.edu.in", 0.04),
        # Inst 8 (Case D Secunderabad)
        ("1-10000008", "C-10008", "Secunderabad College of Engineering", "Telangana", "Hyderabad", InstitutionType.AFFILIATED, "sce.edu.in", 0.06),
    ]

    inst_map: Dict[str, Institution] = {}
    for perm_id, aishe, name, state, dist, itype, domain, risk in pinned_institutions_data:
        inst = Institution(
            aicte_permanent_id=perm_id,
            aishe_code=aishe,
            name=name,
            state=state,
            district=dist,
            institution_type=itype,
            official_email_domain=domain,
            compliance_risk_score=risk,
        )
        institutions.append(inst)
        inst_map[perm_id] = inst

    # Generate remaining 42 institutions (1-10000009 to 1-10000050)
    inst_types = list(InstitutionType)
    for idx in range(9, 51):
        perm_id = f"1-{10000000 + idx}"
        aishe = f"C-{10000 + idx}"
        state, districts = INDIAN_STATES[(idx - 9) % len(INDIAN_STATES)]
        district = districts[(idx // 3) % len(districts)]
        itype = inst_types[idx % len(inst_types)]
        prefix = COLLEGE_PREFIXES[(idx) % len(COLLEGE_PREFIXES)]
        name = f"{prefix} ({district})"
        domain = f"{prefix.lower().replace(' ', '')[:8]}-{idx}.edu.in"
        risk = round(random.uniform(0.01, 0.25), 3)

        inst = Institution(
            aicte_permanent_id=perm_id,
            aishe_code=aishe,
            name=name,
            state=state,
            district=district,
            institution_type=itype,
            official_email_domain=domain,
            compliance_risk_score=risk,
        )
        institutions.append(inst)
        inst_map[perm_id] = inst

    session.add_all(institutions)
    await session.flush()

    # 2. Program Quotas per Institution
    quotas: List[ProgramQuota] = []
    quota_map: Dict[str, ProgramQuota] = {}

    # Case A: Apex B.Tech CSE (240 approved intake)
    quota_case_a = ProgramQuota(
        institution_id=inst_map["1-10000001"].id,
        academic_year="2026-27",
        program_name="B.Tech Computer Science and Engineering",
        course_code="CSE-240",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=240,
        nri_5pct_internal_cap=12,
        fn_oci_ciwgc_15pct_supernumerary_cap=36,
        tfw_5pct_supernumerary_cap=12,
        pmsss_supernumerary_cap=5,
        lateral_entry_2nd_yr_cap=24,
    )
    quotas.append(quota_case_a)
    quota_map["APEX-CSE-240"] = quota_case_a

    # Case B Part 1: Apex B.Tech Mechanical (REGULAR_PHYSICAL)
    quota_case_b1 = ProgramQuota(
        institution_id=inst_map["1-10000001"].id,
        academic_year="2026-27",
        program_name="B.Tech Mechanical Engineering",
        course_code="MECH-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_b1)
    quota_map["APEX-MECH-60"] = quota_case_b1

    # Case B Part 2: NICS Diploma in Data Science (ONLINE_ODL)
    quota_case_b2 = ProgramQuota(
        institution_id=inst_map["1-10000002"].id,
        academic_year="2026-27",
        program_name="Diploma in Data Science",
        course_code="ODL-DS-120",
        delivery_mode=DeliveryMode.ONLINE_ODL,
        approved_intake=120,
        nri_5pct_internal_cap=0,
        fn_oci_ciwgc_15pct_supernumerary_cap=0,
        tfw_5pct_supernumerary_cap=0,
        pmsss_supernumerary_cap=0,
        lateral_entry_2nd_yr_cap=0,
    )
    quotas.append(quota_case_b2)
    quota_map["NICS-ODL-DS"] = quota_case_b2

    # Case C: PSG IT (TN) & BMS ECE (KA)
    quota_case_c1 = ProgramQuota(
        institution_id=inst_map["1-10000003"].id,
        academic_year="2026-27",
        program_name="B.Tech Information Technology",
        course_code="PSG-IT-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_c1)
    quota_map["PSG-IT-60"] = quota_case_c1

    quota_case_c2 = ProgramQuota(
        institution_id=inst_map["1-10000004"].id,
        academic_year="2026-27",
        program_name="B.Tech Electronics and Communication",
        course_code="BMS-ECE-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_c2)
    quota_map["BMS-ECE-60"] = quota_case_c2

    # Case D: Hyderabad Inst & Secunderabad College
    quota_case_d1 = ProgramQuota(
        institution_id=inst_map["1-10000007"].id,
        academic_year="2026-27",
        program_name="B.Tech Computer Engineering",
        course_code="HIT-CE-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_d1)
    quota_map["HIT-CE-60"] = quota_case_d1

    quota_case_d2 = ProgramQuota(
        institution_id=inst_map["1-10000008"].id,
        academic_year="2026-27",
        program_name="B.Tech Computer Engineering",
        course_code="SCE-CE-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_d2)
    quota_map["SCE-CE-60"] = quota_case_d2

    # Case E: Deccan Valley & Metro Tech
    quota_case_e1 = ProgramQuota(
        institution_id=inst_map["1-10000005"].id,
        academic_year="2026-27",
        program_name="B.Tech Civil Engineering",
        course_code="DVC-CIVIL-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_e1)
    quota_map["DVC-CIVIL-60"] = quota_case_e1

    quota_case_e2 = ProgramQuota(
        institution_id=inst_map["1-10000006"].id,
        academic_year="2026-27",
        program_name="B.Tech Civil Engineering",
        course_code="METRO-CIVIL-60",
        delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
        approved_intake=60,
        nri_5pct_internal_cap=3,
        fn_oci_ciwgc_15pct_supernumerary_cap=9,
        tfw_5pct_supernumerary_cap=3,
        pmsss_supernumerary_cap=2,
        lateral_entry_2nd_yr_cap=6,
    )
    quotas.append(quota_case_e2)
    quota_map["METRO-CIVIL-60"] = quota_case_e2

    # Generic quotas for other institutions
    for inst in institutions:
        if inst.aicte_permanent_id in [
            "1-10000001", "1-10000002", "1-10000003", "1-10000004",
            "1-10000005", "1-10000006", "1-10000007", "1-10000008"
        ]:
            continue

        q = ProgramQuota(
            institution_id=inst.id,
            academic_year="2026-27",
            program_name="B.Tech Computer Science",
            course_code=f"CSE-{inst.aicte_permanent_id.split('-')[-1][-3:]}",
            delivery_mode=DeliveryMode.REGULAR_PHYSICAL,
            approved_intake=60,
            nri_5pct_internal_cap=3,
            fn_oci_ciwgc_15pct_supernumerary_cap=9,
            tfw_5pct_supernumerary_cap=3,
            pmsss_supernumerary_cap=2,
            lateral_entry_2nd_yr_cap=6,
        )
        quotas.append(q)
        quota_map[f"GEN-{inst.aicte_permanent_id}"] = q

    session.add_all(quotas)
    await session.flush()

    # 3. Seed Students
    students: List[StudentEnrolment] = []
    student_counter = 100000

    def next_apaar() -> str:
        nonlocal student_counter
        student_counter += 1
        eleven = f"99{student_counter:09d}"
        return generate_valid_apaar_id(eleven)

    # -------------------------------------------------------------
    # CASE A: Supernumerary Quota USP Demo (282 Students at Apex CSE)
    # -------------------------------------------------------------
    # 228 Base General
    for i in range(1, 229):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"APEX-CSE-BASE-{i:03d}",
                institution_id=inst_map["1-10000001"].id,
                program_quota_id=quota_map["APEX-CSE-240"].id,
                full_name=name,
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2005, 1, 1),
                gender="Male" if i % 2 == 0 else "Female",
                seat_category=SeatCategory.GENERAL_BASE,
                phone_number=fake.phone_number(),
                email=f"stu.base.{i}@apex.edu.in",
                pincode="560001",
                validation_status=ValidationStatus.ACCEPTED,
                flag_reasons=[],
            )
        )

    # 12 NRI Internal (fills 240 approved base intake)
    for i in range(1, 13):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"APEX-NRI-{i:03d}",
                institution_id=inst_map["1-10000001"].id,
                program_quota_id=quota_map["APEX-CSE-240"].id,
                full_name=f"{name} (NRI)",
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2005, 2, 2),
                gender="Male",
                seat_category=SeatCategory.NRI_INTERNAL,
                phone_number=fake.phone_number(),
                email=f"stu.nri.{i}@apex.edu.in",
                pincode="560001",
                validation_status=ValidationStatus.ACCEPTED,
                flag_reasons=[],
            )
        )

    # 24 OCI Supernumerary (valid passport/OCI provided)
    for i in range(1, 25):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"APEX-OCI-{i:03d}",
                institution_id=inst_map["1-10000001"].id,
                program_quota_id=quota_map["APEX-CSE-240"].id,
                full_name=name,
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2005, 3, 3),
                gender="Female",
                seat_category=SeatCategory.OCI_SUPERNUMERARY,
                passport_or_oci_number=f"OCI-APEX-2026-{1000+i}",
                phone_number=fake.phone_number(),
                email=f"stu.oci.{i}@apex.edu.in",
                pincode="560001",
                validation_status=ValidationStatus.ACCEPTED,
                flag_reasons=[],
            )
        )

    # 12 CIWGC Supernumerary (valid passport/OCI provided)
    for i in range(1, 13):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"APEX-CIWGC-{i:03d}",
                institution_id=inst_map["1-10000001"].id,
                program_quota_id=quota_map["APEX-CSE-240"].id,
                full_name=name,
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2005, 4, 4),
                gender="Male",
                seat_category=SeatCategory.CIWGC_SUPERNUMERARY,
                passport_or_oci_number=f"CIWGC-GULF-2026-{2000+i}",
                phone_number=fake.phone_number(),
                email=f"stu.ciwgc.{i}@apex.edu.in",
                pincode="560001",
                validation_status=ValidationStatus.ACCEPTED,
                flag_reasons=[],
            )
        )

    # 6 Excess Base Students (violates APH-2026-SEC-2.1)
    for i in range(1, 7):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"APEX-EXCESS-{i:03d}",
                institution_id=inst_map["1-10000001"].id,
                program_quota_id=quota_map["APEX-CSE-240"].id,
                full_name=f"{name} (Excess Base)",
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2005, 5, 5),
                gender="Male",
                seat_category=SeatCategory.GENERAL_BASE,
                phone_number=fake.phone_number(),
                email=f"stu.excess.{i}@apex.edu.in",
                pincode="560001",
                validation_status=ValidationStatus.FLAGGED_VIOLATION,
                flag_reasons=[{
                    "rule": "APH-2026-SEC-2.1",
                    "code": "BASE_APPROVED_INTAKE_EXCEEDED",
                    "description": "Student admitted beyond approved intake capacity of 240.",
                }],
            )
        )

    # -------------------------------------------------------------
    # CASE B: Lawful UGC Dual-Degree Demo ("Aarav Sharma")
    # -------------------------------------------------------------
    apaar_case_b = generate_valid_apaar_id("48291038471")
    # Record 1: B.Tech Mechanical (REGULAR_PHYSICAL) at Apex
    students.append(
        StudentEnrolment(
            apaar_id=apaar_case_b,
            institutional_student_id="APEX-MECH-2026-042",
            institution_id=inst_map["1-10000001"].id,
            program_quota_id=quota_map["APEX-MECH-60"].id,
            full_name="Aarav Sharma",
            phonetic_name_code=get_phonetic_code("Aarav Sharma"),
            dob=date(2005, 5, 15),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9844011223",
            email="aarav.sharma@apex.edu.in",
            pincode="560001",
            parent_initials="K.S.",
            validation_status=ValidationStatus.ACCEPTED,
            flag_reasons=[],
        )
    )
    # Record 2: Diploma in Data Science (ONLINE_ODL) at NICS
    students.append(
        StudentEnrolment(
            apaar_id=apaar_case_b,
            institutional_student_id="NICS-ODL-2026-881",
            institution_id=inst_map["1-10000002"].id,
            program_quota_id=quota_map["NICS-ODL-DS"].id,
            full_name="Aarav Sharma",
            phonetic_name_code=get_phonetic_code("Aarav Sharma"),
            dob=date(2005, 5, 15),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9844011223",
            email="aarav.ds@nics.edu.in",
            pincode="560001",
            parent_initials="K.S.",
            validation_status=ValidationStatus.ACCEPTED,
            flag_reasons=[{
                "rule": "UGC-2022-DUAL-DEGREE",
                "code": "UGC_DUAL_DEGREE_PERMITTED",
                "description": "Simultaneous enrollment in 1 Physical Regular + 1 Online/ODL program is permitted under UGC Guidelines 2022.",
            }],
        )
    )

    # -------------------------------------------------------------
    # CASE C: Illegal Cross-State Regular Duplicate ("Priya Nair")
    # -------------------------------------------------------------
    apaar_case_c = generate_valid_apaar_id("73920184629")
    # Record 1: PSG IT (TN) - REGULAR_PHYSICAL
    students.append(
        StudentEnrolment(
            apaar_id=apaar_case_c,
            institutional_student_id="PSG-IT-2026-104",
            institution_id=inst_map["1-10000003"].id,
            program_quota_id=quota_map["PSG-IT-60"].id,
            full_name="Priya Nair",
            phonetic_name_code=get_phonetic_code("Priya Nair"),
            dob=date(2005, 7, 20),
            gender="Female",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9744123456",
            email="priya.nair@psgiat.edu.in",
            pincode="641004",
            parent_initials="M.N.",
            validation_status=ValidationStatus.FLAGGED_VIOLATION,
            flag_reasons=[{
                "rule": "AICTE-REQ-3-DUPLICATE",
                "code": "CONCURRENT_REGULAR_COLLISION",
                "description": "Cross-institutional collision: Active concurrent admission detected in physical regular mode.",
            }],
        )
    )
    # Record 2: BMS ECE (KA) - REGULAR_PHYSICAL
    students.append(
        StudentEnrolment(
            apaar_id=apaar_case_c,
            institutional_student_id="BMS-ECE-2026-215",
            institution_id=inst_map["1-10000004"].id,
            program_quota_id=quota_map["BMS-ECE-60"].id,
            full_name="Priya Nair",
            phonetic_name_code=get_phonetic_code("Priya Nair"),
            dob=date(2005, 7, 20),
            gender="Female",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9744123456",
            email="priya.nair@bmsiet.edu.in",
            pincode="560019",
            parent_initials="M.N.",
            validation_status=ValidationStatus.FLAGGED_VIOLATION,
            flag_reasons=[{
                "rule": "AICTE-REQ-3-DUPLICATE",
                "code": "CONCURRENT_REGULAR_COLLISION",
                "description": "Cross-institutional collision: Active concurrent admission detected in physical regular mode.",
            }],
        )
    )

    # -------------------------------------------------------------
    # CASE D: Unlinked Phonetic Duplicate Evasion vs Genuine Twins
    # -------------------------------------------------------------
    # D1: Evasion / Ghost Duplicate
    # Record 1 at HIT (Valid APAAR)
    apaar_case_d = generate_valid_apaar_id("55192837461")
    students.append(
        StudentEnrolment(
            apaar_id=apaar_case_d,
            provisional_token=None,
            institutional_student_id="HIT-CSE-2026-019",
            institution_id=inst_map["1-10000007"].id,
            program_quota_id=quota_map["HIT-CE-60"].id,
            full_name="Mohammed Rayyan Khan",
            phonetic_name_code=get_phonetic_code("Mohammed Rayyan Khan"),
            dob=date(2006, 5, 14),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9885012345",
            email="rayyan.khan@hit.edu.in",
            pincode="500032",
            parent_initials="S.K.",
            validation_status=ValidationStatus.WARNING_REVIEW,
            flag_reasons=[],
        )
    )
    # Record 2 at SCE (Missing APAAR, PROV-APN-9001, Phonetic match)
    students.append(
        StudentEnrolment(
            apaar_id=None,
            provisional_token="PROV-APN-9001",
            institutional_student_id="SCE-CSE-2026-088",
            institution_id=inst_map["1-10000008"].id,
            program_quota_id=quota_map["SCE-CE-60"].id,
            full_name="Mohd. Rayan Khan",
            phonetic_name_code=get_phonetic_code("Mohd. Rayan Khan"),
            dob=date(2006, 5, 14),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9885012345",
            email="rayan.khan@sce.edu.in",
            pincode="500032",
            parent_initials="S.K.",
            validation_status=ValidationStatus.FLAGGED_VIOLATION,
            flag_reasons=[{
                "rule": "AICTE-REQ-3-GHOST-EVASION",
                "code": "PHONETIC_DEMOGRAPHIC_COLLISION",
                "description": "High-confidence demographic match with Mohammed Rayyan Khan (HIT) under unverified provisional token.",
            }],
        )
    )

    # D2: Genuine Twins (Rohan & Sohan Deshmukh) at HIT
    apaar_twin_1 = generate_valid_apaar_id("61029384751")
    apaar_twin_2 = generate_valid_apaar_id("61029384752")
    students.append(
        StudentEnrolment(
            apaar_id=apaar_twin_1,
            institutional_student_id="ROLL-TWIN-01",
            institution_id=inst_map["1-10000007"].id,
            program_quota_id=quota_map["HIT-CE-60"].id,
            full_name="Rohan Deshmukh",
            phonetic_name_code=get_phonetic_code("Rohan Deshmukh"),
            dob=date(2006, 8, 19),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9822011223",
            email="rohan.deshmukh@hit.edu.in",
            pincode="411001",
            parent_initials="V.D.",
            validation_status=ValidationStatus.ACCEPTED,
            flag_reasons=[],
        )
    )
    students.append(
        StudentEnrolment(
            apaar_id=apaar_twin_2,
            institutional_student_id="ROLL-TWIN-02",
            institution_id=inst_map["1-10000007"].id,
            program_quota_id=quota_map["HIT-CE-60"].id,
            full_name="Sohan Deshmukh",
            phonetic_name_code=get_phonetic_code("Sohan Deshmukh"),
            dob=date(2006, 8, 19),
            gender="Male",
            seat_category=SeatCategory.GENERAL_BASE,
            phone_number="+91-9822011223",
            email="sohan.deshmukh@hit.edu.in",
            pincode="411001",
            parent_initials="V.D.",
            validation_status=ValidationStatus.ACCEPTED,
            flag_reasons=[],
        )
    )

    # -------------------------------------------------------------
    # CASE E: 8-Student Ghost Admission Ring & Seat-Blocking Anomaly
    # -------------------------------------------------------------
    burst_time = datetime(2026, 10, 15, 14, 0, 0, tzinfo=timezone.utc)
    shared_phone = "+91-9876543210"
    shared_bank_hash = "BANK-RING-999"

    # 5 at Deccan Valley
    for i in range(1, 6):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"DVC-GHOST-{i:03d}",
                institution_id=inst_map["1-10000005"].id,
                program_quota_id=quota_map["DVC-CIVIL-60"].id,
                full_name=name,
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2006, 1, 1),
                gender="Male",
                seat_category=SeatCategory.GENERAL_BASE,
                phone_number=shared_phone,
                bank_account_hash=shared_bank_hash,
                email=f"ghost.{i}@deccanvalley.edu.in",
                pincode="411004",
                validation_status=ValidationStatus.FLAGGED_VIOLATION,
                flag_reasons=[{
                    "rule": "AICTE-REQ-3-FRAUD-RING",
                    "code": "SYNDICATE_BURST_ENROLMENT",
                    "description": "Syndicate pattern: Clustered upload burst sharing identical phone and bank account hash.",
                }],
                uploaded_at=burst_time + timedelta(minutes=i),
            )
        )

    # 3 at Metro Tech
    for i in range(1, 4):
        ap = next_apaar()
        name = fake.name()
        students.append(
            StudentEnrolment(
                apaar_id=ap,
                institutional_student_id=f"METRO-GHOST-{i:03d}",
                institution_id=inst_map["1-10000006"].id,
                program_quota_id=quota_map["METRO-CIVIL-60"].id,
                full_name=name,
                phonetic_name_code=get_phonetic_code(name),
                dob=date(2006, 1, 1),
                gender="Male",
                seat_category=SeatCategory.GENERAL_BASE,
                phone_number=shared_phone,
                bank_account_hash=shared_bank_hash,
                email=f"ghost.{i}@metrotech.edu.in",
                pincode="400001",
                validation_status=ValidationStatus.FLAGGED_VIOLATION,
                flag_reasons=[{
                    "rule": "AICTE-REQ-3-FRAUD-RING",
                    "code": "SYNDICATE_BURST_ENROLMENT",
                    "description": "Syndicate pattern: Cross-college syndicate sharing identical phone and bank account hash.",
                }],
                uploaded_at=burst_time + timedelta(minutes=i + 5),
            )
        )

    # Add ~1,200 fast baseline students across other institutions
    for inst_code, quota_obj in list(quota_map.items())[:35]:
        if "APEX-CSE-240" in inst_code:
            continue
        base_count = random.randint(25, 45)
        for i in range(1, base_count + 1):
            ap = next_apaar()
            name = fake.name()
            students.append(
                StudentEnrolment(
                    apaar_id=ap,
                    institutional_student_id=f"STU-{inst_code[-4:]}-{i:03d}",
                    institution_id=quota_obj.institution_id,
                    program_quota_id=quota_obj.id,
                    full_name=name,
                    phonetic_name_code=get_phonetic_code(name),
                    dob=date(2005, random.randint(1, 12), random.randint(1, 28)),
                    gender="Male" if i % 2 == 0 else "Female",
                    seat_category=SeatCategory.GENERAL_BASE,
                    phone_number=fake.phone_number(),
                    email=f"student.{i}@{inst_map.get(str(quota_obj.institution_id), institutions[0]).official_email_domain}",
                    pincode=fake.postcode(),
                    validation_status=ValidationStatus.ACCEPTED,
                    flag_reasons=[],
                )
            )

    # Bulk insert all students
    session.add_all(students)
    await session.commit()

    # 4. Seed Demonstration Dispute Tickets
    ticket_c = DisputeTicket(
        student_apaar_or_token=apaar_case_c,
        college_a_id=inst_map["1-10000003"].id,
        college_b_id=inst_map["1-10000004"].id,
        collision_type=CollisionType.EXACT_APAAR_REGULAR_CONFLICT,
        status=DisputeStatus.OPEN_TRI_PARTY,
        evidence_log={
            "student_name": "Priya Nair",
            "detected_mode": "REGULAR_PHYSICAL",
            "institution_a": "PSG Institute of Advanced Technology (TN)",
            "institution_b": "BMS Institute of Engineering & Technology (KA)",
        },
        officer_decision_reason=None,
    )
    ticket_d = DisputeTicket(
        student_apaar_or_token="PROV-APN-9001",
        college_a_id=inst_map["1-10000007"].id,
        college_b_id=inst_map["1-10000008"].id,
        collision_type=CollisionType.PHONETIC_PROVISIONAL_MATCH,
        status=DisputeStatus.OPEN_TRI_PARTY,
        evidence_log={
            "anchor_name_a": "Mohammed Rayyan Khan",
            "evading_name_b": "Mohd. Rayan Khan",
            "matched_dob": "2006-05-14",
            "matched_pincode": "500032",
        },
        officer_decision_reason=None,
    )
    session.add_all([ticket_c, ticket_d])

    # 4b. Seed 4 Strict Stakeholder User Accounts for Multi-Tenant Auth
    for user_info in DEMO_USERS:
        u = User(
            email=user_info["email"],
            hashed_password=hash_password(user_info["password"]),
            role=user_info["role"],
            name=user_info["name"],
            title=user_info["title"],
            organization=user_info["organization"],
            identifier=user_info["identifier"],
            allowed_dashboard_path=user_info["allowed_dashboard_path"],
            is_active=True,
        )
        session.add(u)
    await session.commit()

    # 5. Append Cryptographic Audit Event for Seeding
    await append_audit_event(
        session=session,
        actor_role="SYSTEM_ADMIN",
        action_type="DEMO_DATABASE_RESEEDED",
        entity_id="GLOBAL_SEED_50K",
        payload_json={
            "institutions_seeded": len(institutions),
            "quotas_seeded": len(quotas),
            "students_seeded": len(students),
            "users_seeded": len(DEMO_USERS),
            "demonstration_cases": ["CASE_A_QUOTA_USP", "CASE_B_UGC_DUAL", "CASE_C_CROSS_STATE", "CASE_D_PHONETIC_EVASION", "CASE_E_GHOST_RING"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        is_checkpoint=True,
    )

    return {
        "status": "success",
        "institutions_count": len(institutions),
        "quotas_count": len(quotas),
        "students_count": len(students),
        "users_count": len(DEMO_USERS),
        "disputes_count": 2,
        "demonstration_cases": {
            "case_a_quota_usp": {
                "institution": "Apex Institute of Technology",
                "quota_code": "CSE-240",
                "total_enrolled": 282,
                "approved_intake": 240,
                "excess_students": 6,
            },
            "case_b_ugc_dual_degree": {
                "student": "Aarav Sharma",
                "apaar_id": apaar_case_b,
                "verdict": "LAWFUL_DUAL_DEGREE",
            },
            "case_c_cross_state_duplicate": {
                "student": "Priya Nair",
                "apaar_id": apaar_case_c,
                "verdict": "ILLEGAL_CONCURRENT_PHYSICAL_ENROLMENT",
            },
            "case_d_phonetic_evasion": {
                "evading_token": "PROV-APN-9001",
                "phonetic_match": "Mohammed Rayyan Khan vs Mohd. Rayan Khan",
                "twins_disambiguated": "Rohan Deshmukh & Sohan Deshmukh (ACCEPTED)",
            },
            "case_e_ghost_ring": {
                "shared_phone": shared_phone,
                "shared_bank_hash": shared_bank_hash,
                "syndicate_colleges": ["Deccan Valley Engineering College", "Metro Tech Institute"],
            },
        },
    }


# Backward-compatible alias as requested: seed_demo_data()
seed_demo_data = seed_apaarnet_database

