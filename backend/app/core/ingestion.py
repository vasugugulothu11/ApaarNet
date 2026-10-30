"""
Adaptive Schema-Drift Ingestion Pipeline & Pre-Commit Sandbox Diff Chamber.

Provides:
1. Fuzzy Schema-Drift Column Mapper with Jaro-Winkler similarity and synonym detection.
2. Multi-format parser (CSV, Excel .xlsx, JSON).
3. Pre-Commit Sandbox Diff Chamber with real-time quota simulation, Verhoeff checksums,
   provisional token generation, downtime resilience, and row-level delta classification.
4. Idempotent Batch Commit with Merkle audit log integration.
"""

import csv
import io
import json
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import jellyfish
import openpyxl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.apaar_registry import default_registry_adapter, ApaarRegistryAdapter
from app.core.verhoeff import validate_apaar_id
from app.crypto.merkle_audit import append_audit_event
from app.models.enums import SeatCategory, ValidationStatus
from app.models.institution import Institution, ProgramQuota
from app.models.student import StudentEnrolment
from app.schemas.ingestion import (
    ColumnMappingItem,
    CommitBatchResponse,
    PreviewMappingResponse,
    SandboxDiffResponse,
    SandboxRowDiff,
)


CANONICAL_FIELDS: Dict[str, Dict[str, Any]] = {
    "apaar_id": {
        "required": False,
        "aliases": [
            "student_apaar_no", "apaar_number", "apaar_no", "apaar",
            "national_student_id", "abc_id", "uid", "aadhaar_apaar", "apaarno",
            "student_apaar_id", "apaar_id_number"
        ],
        "description": "12-digit National APAAR ID",
    },
    "institutional_student_id": {
        "required": True,
        "aliases": [
            "rollno", "roll_no", "roll_number", "student_id", "reg_no",
            "registration_no", "registration_number", "admission_no",
            "usn", "enrollment_no", "roll", "hall_ticket_no"
        ],
        "description": "Institutional student ID / roll number",
    },
    "full_name": {
        "required": True,
        "aliases": [
            "candidate_name", "student_name", "name", "name_of_student",
            "applicant_name", "full_name_of_student", "candidatename"
        ],
        "description": "Full legal name of candidate",
    },
    "dob": {
        "required": True,
        "aliases": [
            "dateofbirth", "date_of_birth", "birth_date", "d_o_b",
            "birthdate", "dob_date", "student_dob"
        ],
        "description": "Date of birth (YYYY-MM-DD or DD/MM/YYYY)",
    },
    "gender": {
        "required": True,
        "aliases": ["sex", "gender_code", "gender_desc"],
        "description": "Gender (Male/Female/Transgender)",
    },
    "seat_category": {
        "required": True,
        "aliases": [
            "quota_category", "category", "admission_category", "seat_type",
            "quota", "quota_type", "admission_quota", "allotment_category"
        ],
        "description": "AICTE Seat Category (GENERAL_BASE, NRI_INTERNAL, OCI_SUPERNUMERARY, etc.)",
    },
    "passport_or_oci_number": {
        "required": False,
        "aliases": [
            "passportno", "passport_no", "passport_number", "oci_no",
            "oci_number", "passport_oci", "passport_doc", "passport_or_oci"
        ],
        "description": "Passport or OCI number for foreign/OCI students",
    },
    "phone_number": {
        "required": False,
        "aliases": [
            "phone", "mobile", "mobile_no", "contact_number", "contact_no",
            "cell", "telephone", "phone_no"
        ],
        "description": "Candidate contact phone number",
    },
    "email": {
        "required": False,
        "aliases": ["student_email", "mail", "email_id", "email_address", "e_mail"],
        "description": "Email address of student",
    },
    "pincode": {
        "required": False,
        "aliases": ["pin_code", "postal_code", "zip", "zipcode", "pin", "area_pincode"],
        "description": "Postal pincode",
    },
    "parent_initials": {
        "required": False,
        "aliases": [
            "father_initials", "mother_initials", "parent_name",
            "guardian_initials", "father_name", "parent_initial"
        ],
        "description": "Parent initials or name abbreviation",
    },
    "bank_account_hash": {
        "required": False,
        "aliases": ["bank_hash", "bank_account", "account_no", "bank_acc", "bank_acc_hash"],
        "description": "Bank account number or identifier hash",
    },
}


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


def normalize_header_name(header: str) -> str:
    """Normalizes a raw header string for token matching."""
    return (
        header.lower()
        .replace("_", "")
        .replace("-", "")
        .replace(".", "")
        .replace(" ", "")
        .strip()
    )


def auto_map_column_headers(
    headers: List[str],
) -> Tuple[Dict[str, ColumnMappingItem], List[str], List[str]]:
    """
    Uses normalized token matching + Jaro-Winkler similarity (jellyfish) against
    ApaarNet's canonical StudentEnrolment fields to auto-align columns, returning
    confidence scores per column and flagging any unmapped required fields.
    """
    mappings: Dict[str, ColumnMappingItem] = {}
    assigned_canonical: Dict[str, str] = {}  # canonical -> best source header

    for header in headers:
        norm_h = normalize_header_name(header)
        best_match: Optional[str] = None
        best_score = 0.0
        match_type = "UNMAPPED"

        for canon_field, meta in CANONICAL_FIELDS.items():
            norm_c = normalize_header_name(canon_field)

            # 1. Exact match with canonical name
            if norm_h == norm_c:
                best_match = canon_field
                best_score = 1.0
                match_type = "EXACT"
                break

            # 2. Exact match with any known alias/synonym
            alias_exact = False
            for alias in meta["aliases"]:
                if norm_h == normalize_header_name(alias):
                    best_match = canon_field
                    best_score = 0.98
                    match_type = "SYNONYM"
                    alias_exact = True
                    break
            if alias_exact:
                break

            # 3. Fuzzy Jaro-Winkler similarity against canonical name and aliases
            sim_canon = jellyfish.jaro_winkler_similarity(norm_h, norm_c)
            if sim_canon > best_score and sim_canon >= 0.72:
                best_score = sim_canon
                best_match = canon_field
                match_type = "FUZZY_JARO_WINKLER"

            for alias in meta["aliases"]:
                sim_alias = jellyfish.jaro_winkler_similarity(norm_h, normalize_header_name(alias))
                if sim_alias > best_score and sim_alias >= 0.72:
                    best_score = sim_alias
                    best_match = canon_field
                    match_type = "FUZZY_JARO_WINKLER"

        if best_match and best_score >= 0.72:
            is_req = CANONICAL_FIELDS[best_match]["required"]
            mappings[header] = ColumnMappingItem(
                target_field=best_match,
                confidence=round(best_score, 3),
                match_type=match_type,
                is_required=is_req,
            )
            assigned_canonical[best_match] = header
        else:
            mappings[header] = ColumnMappingItem(
                target_field=None,
                confidence=0.0,
                match_type="UNMAPPED",
                is_required=False,
            )

    mapped_canonical_fields = sorted(list(assigned_canonical.keys()))
    required_canonical = [k for k, v in CANONICAL_FIELDS.items() if v["required"]]
    missing_required_fields = [k for k in required_canonical if k not in assigned_canonical]

    return mappings, mapped_canonical_fields, missing_required_fields


def parse_file_to_rows(
    file_bytes: bytes, filename: str
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Parses an uploaded file (CSV, Excel .xlsx, or JSON) into headers and list of row dicts.
    """
    filename_lower = filename.lower()

    if filename_lower.endswith(".csv"):
        try:
            text_content = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            text_content = file_bytes.decode("latin-1")

        f = io.StringIO(text_content)
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = [row for row in reader]
        return list(headers), rows

    elif filename_lower.endswith(".xlsx"):
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        sheet = wb.active
        all_rows = list(sheet.iter_rows(values_only=True))
        if not all_rows:
            return [], []

        headers = [str(c).strip() if c is not None else f"col_{i}" for i, c in enumerate(all_rows[0])]
        rows = []
        for r in all_rows[1:]:
            if all(v is None for v in r):
                continue
            row_dict = {}
            for h, v in zip(headers, r):
                row_dict[h] = v
            rows.append(row_dict)
        return headers, rows

    elif filename_lower.endswith(".json"):
        data = json.loads(file_bytes.decode("utf-8"))
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            headers = list(data[0].keys())
            return headers, data
        elif isinstance(data, dict):
            # Check if there's a list key
            for k, v in data.items():
                if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                    return list(v[0].keys()), v
        return [], []

    else:
        # Default try CSV
        try:
            text_content = file_bytes.decode("utf-8-sig")
            f = io.StringIO(text_content)
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            return list(headers), [row for row in reader]
        except Exception as e:
            raise ValueError(f"Unsupported file format for '{filename}': {str(e)}")


def parse_date_value(val: Any) -> Optional[date]:
    """Robust parser for diverse date representations."""
    if val is None:
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()

    val_str = str(val).strip()
    if not val_str:
        return None

    # Try common formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            continue

    return None


def normalize_seat_category(val: Any) -> str:
    """Maps various category names to the official SeatCategory enum value."""
    if not val:
        return SeatCategory.GENERAL_BASE.value

    s = str(val).strip().upper().replace(" ", "_").replace("-", "_")

    if "GENERAL" in s or "BASE" in s or "OPEN" in s or "MERIT" in s:
        return SeatCategory.GENERAL_BASE.value
    if "NRI" in s:
        return SeatCategory.NRI_INTERNAL.value
    if "OCI" in s:
        return SeatCategory.OCI_SUPERNUMERARY.value
    if "FOREIGN" in s or "FN" in s:
        return SeatCategory.FN_SUPERNUMERARY.value
    if "CIWGC" in s or "GULF" in s:
        return SeatCategory.CIWGC_SUPERNUMERARY.value
    if "TFW" in s or "WAIVER" in s:
        return SeatCategory.TFW_SUPERNUMERARY.value
    if "PMSSS" in s or "KASHMIR" in s or "LADAKH" in s:
        return SeatCategory.PMSSS_SUPERNUMERARY.value
    if "LATERAL" in s or "2ND_YEAR" in s or "DIPLOMA" in s:
        return SeatCategory.LATERAL_ENTRY.value

    return SeatCategory.GENERAL_BASE.value


def normalize_gender(val: Any) -> str:
    """Normalizes gender representations."""
    if not val:
        return "Male"
    g = str(val).strip().lower()
    if g.startswith("m") or g == "boy":
        return "Male"
    if g.startswith("f") or g == "girl":
        return "Female"
    return "Transgender"


async def evaluate_sandbox_diff(
    session: AsyncSession,
    institution_id: uuid.UUID,
    program_quota_id: uuid.UUID,
    rows: List[Dict[str, Any]],
    column_mapping: Optional[Dict[str, str]] = None,
    simulate_registry_downtime: bool = False,
) -> SandboxDiffResponse:
    """
    Evaluates incoming student rows against:
    a) APAAR & Provisional Check (Verhoeff checksum, provisional tokens, downtime fallback)
    b) Mandatory Document Rules (APH-2026-SEC-4.2 for FN/OCI)
    c) Real-Time Quota Simulation (catching exact row where caps are exceeded)
    d) Row-Level Delta Classification (NEW_INSERT, FIELD_MODIFIED_DIFF, IDEMPOTENT_NO_CHANGE, REJECTED_OR_FLAGGED)
    Returns structured Sandbox Diff response and CSV error report string.
    """
    # 1. Fetch Institution and Program Quota
    inst = await session.get(Institution, institution_id)
    if not inst:
        raise ValueError(f"Institution with ID '{institution_id}' not found.")

    quota = await session.get(ProgramQuota, program_quota_id)
    if not quota:
        raise ValueError(f"ProgramQuota with ID '{program_quota_id}' not found.")

    if quota.institution_id != institution_id:
        raise ValueError(f"ProgramQuota '{program_quota_id}' does not belong to Institution '{institution_id}'.")

    # 2. Fetch existing students in this quota
    existing_res = await session.execute(
        select(StudentEnrolment).where(StudentEnrolment.program_quota_id == program_quota_id)
    )
    existing_students = list(existing_res.scalars().all())

    # Build lookup maps
    existing_by_roll: Dict[str, StudentEnrolment] = {
        s.institutional_student_id.strip(): s for s in existing_students
    }
    existing_by_apaar: Dict[str, StudentEnrolment] = {
        s.apaar_id.strip(): s for s in existing_students if s.apaar_id
    }

    # Current quota metrics in database
    sim_general_base = sum(1 for s in existing_students if s.seat_category == SeatCategory.GENERAL_BASE.value)
    sim_nri = sum(1 for s in existing_students if s.seat_category == SeatCategory.NRI_INTERNAL.value)
    sim_base_total = sim_general_base + sim_nri
    sim_supernumerary = sum(
        1 for s in existing_students
        if s.seat_category in (
            SeatCategory.FN_SUPERNUMERARY.value,
            SeatCategory.OCI_SUPERNUMERARY.value,
            SeatCategory.CIWGC_SUPERNUMERARY.value,
        )
    )
    sim_tfw = sum(1 for s in existing_students if s.seat_category == SeatCategory.TFW_SUPERNUMERARY.value)
    sim_pmsss = sum(1 for s in existing_students if s.seat_category == SeatCategory.PMSSS_SUPERNUMERARY.value)

    # 3. Setup registry adapter
    registry_adapter = ApaarRegistryAdapter(simulate_registry_downtime=simulate_registry_downtime)

    sandbox_diff_rows: List[SandboxRowDiff] = []
    error_report_rows: List[Dict[str, Any]] = []

    new_insert_count = 0
    field_modified_diff_count = 0
    idempotent_no_change_count = 0
    flagged_or_rejected_count = 0

    for idx, raw_row in enumerate(rows, start=1):
        # Apply column mapping if provided
        norm_row: Dict[str, Any] = {}
        if column_mapping:
            for src_col, val in raw_row.items():
                target_field = column_mapping.get(src_col)
                if target_field and target_field in CANONICAL_FIELDS:
                    norm_row[target_field] = val
                elif src_col in CANONICAL_FIELDS:
                    norm_row[src_col] = val
        else:
            norm_row = dict(raw_row)

        roll = str(norm_row.get("institutional_student_id") or f"ROLL-{idx:04d}").strip()
        full_name = str(norm_row.get("full_name") or "Unknown Student").strip()
        gender = normalize_gender(norm_row.get("gender"))
        seat_category = normalize_seat_category(norm_row.get("seat_category"))
        raw_dob = parse_date_value(norm_row.get("dob")) or date(2005, 1, 1)
        raw_apaar = str(norm_row.get("apaar_id")).strip() if norm_row.get("apaar_id") else None
        if raw_apaar and (raw_apaar.lower() in ("none", "null", "") or len(raw_apaar) < 5):
            raw_apaar = None

        passport_or_oci = (
            str(norm_row.get("passport_or_oci_number")).strip()
            if norm_row.get("passport_or_oci_number")
            else None
        )
        phone = str(norm_row.get("phone_number")).strip() if norm_row.get("phone_number") else None
        email = str(norm_row.get("email")).strip() if norm_row.get("email") else None
        pincode = str(norm_row.get("pincode")).strip() if norm_row.get("pincode") else None
        parent_initials = (
            str(norm_row.get("parent_initials")).strip()
            if norm_row.get("parent_initials")
            else None
        )
        bank_hash = (
            str(norm_row.get("bank_account_hash")).strip()
            if norm_row.get("bank_account_hash")
            else None
        )

        validation_status = ValidationStatus.ACCEPTED.value
        flag_reasons: List[Dict[str, Any]] = []
        provisional_token: Optional[str] = None
        effective_apaar: Optional[str] = raw_apaar

        # --- Check A: APAAR & Registry / Provisional Check ---
        if effective_apaar:
            if simulate_registry_downtime:
                validation_status = ValidationStatus.UNVERIFIED_PENDING_REGISTRY.value
                flag_reasons.append({
                    "rule": "APH-2026-FALLBACK-L1",
                    "code": "REGISTRY_DOWNTIME_DEFERRED",
                    "description": (
                        "National DigiLocker/ABC registry unreachable. Record accepted "
                        "as UNVERIFIED_PENDING_REGISTRY and queued for retry."
                    ),
                })
            else:
                is_valid_verhoeff, verhoeff_msg = validate_apaar_id(effective_apaar)
                if not is_valid_verhoeff:
                    validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                    flag_reasons.append({
                        "rule": "APH-2026-APAAR-FORMAT",
                        "code": "VERHOEFF_CHECKSUM_INVALID",
                        "description": verhoeff_msg,
                    })
        else:
            # Missing APAAR or Foreign/Opt-Out -> Issue Provisional Token
            provisional_token = registry_adapter.generate_provisional_token(
                str(institution_id), roll, reason="FOREIGN_OR_OPT_OUT"
            )
            effective_apaar = None

        # --- Check B: Mandatory Document Rules (APH-2026-SEC-4.2) ---
        if seat_category in (
            SeatCategory.FN_SUPERNUMERARY.value,
            SeatCategory.OCI_SUPERNUMERARY.value,
            SeatCategory.CIWGC_SUPERNUMERARY.value,
        ):
            if not passport_or_oci:
                validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                flag_reasons.append({
                    "rule": "APH-2026-SEC-4.2",
                    "code": "MISSING_PASSPORT_OCI_CREDENTIAL",
                    "description": (
                        f"Student in category '{seat_category}' must provide a verified "
                        "Passport or OCI registration number."
                    ),
                })

        # --- Check C: Delta Classification against Existing Student ---
        existing_student = existing_by_roll.get(roll) or (
            existing_by_apaar.get(effective_apaar) if effective_apaar else None
        )

        field_diffs: Dict[str, Dict[str, Any]] = {}
        if existing_student:
            # Compare fields
            fields_to_compare = [
                ("full_name", full_name),
                ("dob", raw_dob),
                ("gender", gender),
                ("seat_category", seat_category),
                ("phone_number", phone),
                ("email", email),
                ("passport_or_oci_number", passport_or_oci),
                ("pincode", pincode),
                ("parent_initials", parent_initials),
            ]
            for field_name, new_val in fields_to_compare:
                old_val = getattr(existing_student, field_name)
                # Normalize types for diffing
                old_str = str(old_val or "").strip()
                new_str = str(new_val or "").strip()
                if old_str != new_str:
                    field_diffs[field_name] = {
                        "old": str(old_val) if old_val is not None else None,
                        "new": str(new_val) if new_val is not None else None,
                    }

            if field_diffs:
                delta_type = "FIELD_MODIFIED_DIFF"
            else:
                delta_type = "IDEMPOTENT_NO_CHANGE"
        else:
            delta_type = "NEW_INSERT"

        # --- Check D: Real-Time Quota Simulation ---
        # Only simulate quota consumption for new admissions or category changes
        if delta_type == "NEW_INSERT" or (
            delta_type == "FIELD_MODIFIED_DIFF" and "seat_category" in field_diffs
        ):
            if seat_category == SeatCategory.NRI_INTERNAL.value:
                if sim_nri + 1 > quota.nri_5pct_internal_cap:
                    validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                    flag_reasons.append({
                        "rule": "APH-2026-SEC-2.3",
                        "code": "NRI_INTERNAL_CAP_EXCEEDED",
                        "excess": (sim_nri + 1) - quota.nri_5pct_internal_cap,
                        "description": (
                            f"NRI Internal enrolment exceeds 5% sanctioned internal cap "
                            f"({quota.nri_5pct_internal_cap}) at row {idx}."
                        ),
                    })
                sim_nri += 1
                sim_base_total += 1

            elif seat_category == SeatCategory.GENERAL_BASE.value:
                if sim_base_total + 1 > quota.approved_intake:
                    validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                    flag_reasons.append({
                        "rule": "APH-2026-SEC-2.1",
                        "code": "BASE_APPROVED_INTAKE_EXCEEDED",
                        "excess": (sim_base_total + 1) - quota.approved_intake,
                        "description": (
                            f"Base approved intake capacity ({quota.approved_intake}) "
                            f"exceeded at row {idx}."
                        ),
                    })
                sim_base_total += 1

            elif seat_category in (
                SeatCategory.FN_SUPERNUMERARY.value,
                SeatCategory.OCI_SUPERNUMERARY.value,
                SeatCategory.CIWGC_SUPERNUMERARY.value,
            ):
                if sim_supernumerary + 1 > quota.fn_oci_ciwgc_15pct_supernumerary_cap:
                    validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                    flag_reasons.append({
                        "rule": "APH-2026-SEC-4.1",
                        "code": "SUPERNUMERARY_15PCT_CAP_EXCEEDED",
                        "excess": (sim_supernumerary + 1) - quota.fn_oci_ciwgc_15pct_supernumerary_cap,
                        "description": (
                            f"FN/OCI/CIWGC 15% supernumerary quota capacity "
                            f"({quota.fn_oci_ciwgc_15pct_supernumerary_cap}) exceeded at row {idx}."
                        ),
                    })
                sim_supernumerary += 1

        # Classify row delta type
        if validation_status == ValidationStatus.FLAGGED_VIOLATION.value:
            final_delta_type = "REJECTED_OR_FLAGGED"
            flagged_or_rejected_count += 1
        elif delta_type == "NEW_INSERT":
            final_delta_type = "NEW_INSERT"
            new_insert_count += 1
        elif delta_type == "FIELD_MODIFIED_DIFF":
            final_delta_type = "FIELD_MODIFIED_DIFF"
            field_modified_diff_count += 1
        else:
            final_delta_type = "IDEMPOTENT_NO_CHANGE"
            idempotent_no_change_count += 1

        # Build diff row
        diff_item = SandboxRowDiff(
            row_index=idx,
            institutional_student_id=roll,
            full_name=full_name,
            apaar_id=effective_apaar,
            provisional_token=provisional_token,
            seat_category=seat_category,
            delta_type=final_delta_type,
            field_diffs=field_diffs,
            validation_status=validation_status,
            flag_reasons=flag_reasons,
        )
        sandbox_diff_rows.append(diff_item)

        # Log to error report if flagged
        if flag_reasons:
            for flag in flag_reasons:
                error_report_rows.append({
                    "row": idx,
                    "roll": roll,
                    "name": full_name,
                    "apaar_or_token": effective_apaar or provisional_token or "NONE",
                    "seat_category": seat_category,
                    "violation_code": flag.get("code", "UNKNOWN_FLAG"),
                    "rule": flag.get("rule", "APH-2026"),
                    "description": flag.get("description", ""),
                })

    # Generate CSV error report string
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer)
    csv_writer.writerow([
        "Row", "Institutional Roll", "Student Name", "APAAR or Provisional Token",
        "Seat Category", "Violation Code", "AICTE Rule", "Explanation"
    ])
    for err in error_report_rows:
        csv_writer.writerow([
            err["row"],
            err["roll"],
            err["name"],
            err["apaar_or_token"],
            err["seat_category"],
            err["violation_code"],
            err["rule"],
            err["description"],
        ])
    error_csv_str = csv_buffer.getvalue()

    return SandboxDiffResponse(
        institution_id=institution_id,
        program_quota_id=program_quota_id,
        total_rows=len(rows),
        new_insert_count=new_insert_count,
        field_modified_diff_count=field_modified_diff_count,
        idempotent_no_change_count=idempotent_no_change_count,
        flagged_or_rejected_count=flagged_or_rejected_count,
        simulated_quota_status={
            "approved_intake": quota.approved_intake,
            "simulated_base_intake_used": sim_base_total,
            "simulated_nri_internal_used": sim_nri,
            "nri_5pct_internal_cap": quota.nri_5pct_internal_cap,
            "simulated_supernumerary_used": sim_supernumerary,
            "supernumerary_15pct_cap": quota.fn_oci_ciwgc_15pct_supernumerary_cap,
            "is_within_approved_limits": (sim_base_total <= quota.approved_intake),
        },
        rows=sandbox_diff_rows,
        error_report_csv=error_csv_str,
    )


async def commit_batch_enrolments(
    session: AsyncSession,
    institution_id: uuid.UUID,
    program_quota_id: uuid.UUID,
    rows: List[Dict[str, Any]],
    allow_flagged_with_warning: bool = True,
    column_mapping: Optional[Dict[str, str]] = None,
) -> CommitBatchResponse:
    """
    Commits approved/warning rows into student_enrolments, updates existing rows
    cleanly on FIELD_MODIFIED_DIFF, skips IDEMPOTENT_NO_CHANGE rows so retrying
    the exact same upload twice never creates duplicate records, and records a
    signed batch ingestion event in merkle_audit_log.
    """
    # Run sandbox diff evaluation first to get authoritative row statuses
    sandbox_eval = await evaluate_sandbox_diff(
        session=session,
        institution_id=institution_id,
        program_quota_id=program_quota_id,
        rows=rows,
        column_mapping=column_mapping,
        simulate_registry_downtime=False,
    )

    # Fetch existing students lookup
    existing_res = await session.execute(
        select(StudentEnrolment).where(StudentEnrolment.program_quota_id == program_quota_id)
    )
    existing_map = {s.institutional_student_id.strip(): s for s in existing_res.scalars().all()}

    committed_new_inserts = 0
    committed_updates = 0
    skipped_idempotent = 0
    flagged_committed = 0

    new_entities: List[StudentEnrolment] = []

    for diff_row in sandbox_eval.rows:
        roll = diff_row.institutional_student_id

        if diff_row.delta_type == "IDEMPOTENT_NO_CHANGE":
            skipped_idempotent += 1
            continue

        if diff_row.delta_type == "REJECTED_OR_FLAGGED":
            if not allow_flagged_with_warning:
                # Omit rejected rows
                continue
            # Otherwise commit with FLAGGED_VIOLATION status
            flagged_committed += 1

        if diff_row.delta_type == "FIELD_MODIFIED_DIFF":
            # Update existing entity
            existing_student = existing_map.get(roll)
            if existing_student:
                for field_name, diff_val in diff_row.field_diffs.items():
                    new_val = diff_val["new"]
                    if field_name == "dob" and new_val:
                        setattr(existing_student, "dob", parse_date_value(new_val))
                    elif field_name == "full_name" and new_val:
                        setattr(existing_student, "full_name", new_val)
                        setattr(existing_student, "phonetic_name_code", get_phonetic_code(new_val))
                    elif hasattr(existing_student, field_name):
                        setattr(existing_student, field_name, new_val)

                if diff_row.validation_status == ValidationStatus.FLAGGED_VIOLATION.value:
                    existing_student.validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                    existing_student.flag_reasons = diff_row.flag_reasons

                committed_updates += 1
            continue

        # NEW_INSERT (or FLAGGED_VIOLATION new row)
        # Find raw row to get full optional attributes like email, phone, etc.
        raw_source = rows[diff_row.row_index - 1]
        phone = raw_source.get("phone_number") or raw_source.get("phone") or raw_source.get("mobile")
        email = raw_source.get("email") or raw_source.get("student_email")
        pincode = raw_source.get("pincode") or raw_source.get("pin_code")
        parent = raw_source.get("parent_initials") or raw_source.get("father_initials")
        passport = (
            raw_source.get("passport_or_oci_number")
            or raw_source.get("passportno")
            or raw_source.get("passport_no")
        )
        dob_val = parse_date_value(raw_source.get("dob") or raw_source.get("dateofbirth")) or date(2005, 1, 1)

        student_entity = StudentEnrolment(
            apaar_id=diff_row.apaar_id,
            provisional_token=diff_row.provisional_token,
            institutional_student_id=diff_row.institutional_student_id,
            institution_id=institution_id,
            program_quota_id=program_quota_id,
            full_name=diff_row.full_name,
            phonetic_name_code=get_phonetic_code(diff_row.full_name),
            dob=dob_val,
            gender=normalize_gender(raw_source.get("gender")),
            seat_category=diff_row.seat_category,
            passport_or_oci_number=passport,
            phone_number=phone,
            email=email,
            pincode=pincode,
            parent_initials=parent,
            validation_status=diff_row.validation_status,
            flag_reasons=diff_row.flag_reasons,
        )
        new_entities.append(student_entity)
        if diff_row.delta_type == "NEW_INSERT":
            committed_new_inserts += 1

    if new_entities:
        session.add_all(new_entities)
    await session.commit()

    # Append Ed25519 Signed Audit Event to Merkle Ledger
    audit_entry = await append_audit_event(
        session=session,
        actor_role="INSTITUTION_ADMIN",
        action_type="STUDENT_BATCH_INGESTED",
        entity_id=str(program_quota_id),
        payload_json={
            "institution_id": str(institution_id),
            "program_quota_id": str(program_quota_id),
            "total_processed": len(rows),
            "new_inserts": committed_new_inserts,
            "updates": committed_updates,
            "skipped_idempotent": skipped_idempotent,
            "flagged_committed": flagged_committed,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        is_checkpoint=True,
    )

    return CommitBatchResponse(
        status="success",
        institution_id=institution_id,
        program_quota_id=program_quota_id,
        total_processed=len(rows),
        committed_new_inserts=committed_new_inserts,
        committed_updates=committed_updates,
        skipped_idempotent=skipped_idempotent,
        flagged_committed=flagged_committed,
        audit_sequence_number=audit_entry.seq_id,
        audit_record_hash=audit_entry.record_hash,
        merkle_signature=audit_entry.checkpoint_signature,
    )

