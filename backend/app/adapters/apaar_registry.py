"""
Mock DigiLocker / Academic Bank of Credits (ABC) APAAR Registry Adapter.

Provides simulated live lookup against national APAAR registries, resilient fallback
handling during registry outages, and deterministic provisional token issuance for
Foreign Nationals and students who exercise statutory DPDP opt-outs.
"""

import hashlib
from typing import Any, Dict, Optional, Tuple

import jellyfish

from app.config import settings
from app.core.verhoeff import validate_apaar_id


class ApaarRegistryAdapter:
    def __init__(self, simulate_registry_downtime: bool = False):
        self.simulate_registry_downtime = simulate_registry_downtime
        # In-memory mock registry of established National Academic Depository records
        self._mock_registry: Dict[str, Dict[str, Any]] = {
            "202610291230": {
                "full_name": "Aarav Sharma",
                "dob": "2005-05-15",
                "gender": "Male",
                "abc_id": "ABC-9910-1200-4411",
                "digilocker_linked": True,
            },
            "202610291248": {
                "full_name": "Priya Patel",
                "dob": "2005-08-22",
                "gender": "Female",
                "abc_id": "ABC-9910-1200-4412",
                "digilocker_linked": True,
            },
            "202610291255": {
                "full_name": "Rohan Gupta",
                "dob": "2004-11-30",
                "gender": "Male",
                "abc_id": "ABC-9910-1200-4413",
                "digilocker_linked": True,
            },
        }

    def register_mock_student(
        self,
        apaar_id: str,
        full_name: str,
        dob: str,
        gender: str = "Male",
        abc_id: Optional[str] = None,
    ) -> None:
        """Seeds a mock student record into the simulated national registry."""
        self._mock_registry[apaar_id] = {
            "full_name": full_name,
            "dob": dob,
            "gender": gender,
            "abc_id": abc_id or f"ABC-{apaar_id[:4]}-{apaar_id[4:8]}-{apaar_id[8:]}",
            "digilocker_linked": True,
        }

    @staticmethod
    def generate_provisional_token(
        institution_id: str,
        student_identifier: str,
        reason: str = "FOREIGN_OR_OPT_OUT",
    ) -> str:
        """
        Generates an idempotent, standardized provisional token: PROV-APN-XXXX
        Guarantees that a student opted-out or foreign national is uniquely tracked
        across submission batches without collision or arbitrary mutation.
        """
        seed = f"{institution_id}:{student_identifier}:{reason}".encode("utf-8")
        token_hash = hashlib.sha256(seed).hexdigest()[:8].upper()
        return f"PROV-APN-{token_hash}"

    def verify_student(
        self,
        apaar_id: Optional[str],
        full_name: str,
        dob: Optional[str] = None,
        seat_category: str = "GENERAL_BASE",
        opted_out: bool = False,
        institution_id: Optional[str] = None,
        student_roll: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes national registry verification against DigiLocker / ABC:
        1. If Foreign National or opted out, issues idempotent provisional token.
        2. If registry downtime is simulated, NEVER rejects; marks UNVERIFIED_PENDING_REGISTRY.
        3. Validates Verhoeff D5 dihedral checksum on APAAR ID.
        4. Cross-checks demographic match against National ABC profile.
        """
        # Case 1: Foreign National or Opt-Out -> Issue Provisional Token
        is_foreign = seat_category in ("FN_SUPERNUMERARY", "CIWGC_SUPERNUMERARY")
        if is_foreign or opted_out or not apaar_id:
            roll = student_roll or full_name
            inst = institution_id or "INST-DEFAULT"
            token = self.generate_provisional_token(inst, roll)
            return {
                "status": "PROVISIONAL_EXEMPT",
                "validation_status": "ACCEPTED",
                "provisional_token": token,
                "apaar_id": None,
                "retry_queued": False,
                "flag_reasons": [],
                "message": (
                    f"Provisional token {token} issued under AICTE Foreign/Opt-Out exemption policy."
                ),
            }

        # Case 2: Registry Downtime -> Non-blocking fallback to UNVERIFIED_PENDING_REGISTRY
        if self.simulate_registry_downtime:
            return {
                "status": "DOWNTIME_DEFERRED",
                "validation_status": "UNVERIFIED_PENDING_REGISTRY",
                "provisional_token": None,
                "apaar_id": apaar_id,
                "retry_queued": True,
                "flag_reasons": [
                    {
                        "code": "REGISTRY_DOWNTIME_DEFERRED",
                        "rule": "APH-2026-FALLBACK-L1",
                        "description": (
                            "National DigiLocker/ABC registry currently unreachable. "
                            "Record accepted non-destructively as UNVERIFIED_PENDING_REGISTRY "
                            "and queued for background idempotence verification."
                        ),
                    }
                ],
                "message": "Verification deferred due to registry outage.",
            }

        # Case 3: Mathematical Verhoeff Checksum Validation
        is_valid_verhoeff, verhoeff_msg = validate_apaar_id(apaar_id)
        if not is_valid_verhoeff:
            return {
                "status": "INVALID_CHECKSUM",
                "validation_status": "FLAGGED_VIOLATION",
                "provisional_token": None,
                "apaar_id": apaar_id,
                "retry_queued": False,
                "flag_reasons": [
                    {
                        "code": "VERHOEFF_CHECKSUM_INVALID",
                        "rule": "APH-2026-APAAR-FORMAT",
                        "description": verhoeff_msg,
                    }
                ],
                "message": verhoeff_msg,
            }

        # Case 4: Registry Lookup & Demographic Cross-Check
        if apaar_id in self._mock_registry:
            record = self._mock_registry[apaar_id]
            # Calculate Jaro-Winkler similarity for name robustness (handles minor spelling variance)
            similarity = jellyfish.jaro_winkler_similarity(
                full_name.strip().lower(), record["full_name"].strip().lower()
            )

            if similarity >= 0.82:
                return {
                    "status": "VERIFIED",
                    "validation_status": "ACCEPTED",
                    "provisional_token": None,
                    "apaar_id": apaar_id,
                    "abc_id": record["abc_id"],
                    "digilocker_verified": True,
                    "retry_queued": False,
                    "flag_reasons": [],
                    "message": "Student successfully verified against National Academic Depository.",
                }
            else:
                return {
                    "status": "DEMOGRAPHIC_MISMATCH",
                    "validation_status": "WARNING_REVIEW",
                    "provisional_token": None,
                    "apaar_id": apaar_id,
                    "retry_queued": False,
                    "flag_reasons": [
                        {
                            "code": "DEMOGRAPHIC_NAME_MISMATCH",
                            "rule": "APH-2026-KYC-MISMATCH",
                            "description": (
                                f"Submitted name '{full_name}' does not match National Registry name "
                                f"'{record['full_name']}' (match score: {similarity:.2f})."
                            ),
                        }
                    ],
                    "message": "Demographic discrepancy detected with national database.",
                }

        # Case 5: Valid Checksum, but not yet present in mock registry
        if settings.USE_MOCK_APAAR_REGISTRY:
            # Under mock testing mode, valid Verhoeff numbers are auto-admitted with generated ABC IDs
            return {
                "status": "VERIFIED_MOCK",
                "validation_status": "ACCEPTED",
                "provisional_token": None,
                "apaar_id": apaar_id,
                "abc_id": f"ABC-MOCK-{apaar_id[:4]}-{apaar_id[-4:]}",
                "digilocker_verified": True,
                "retry_queued": False,
                "flag_reasons": [],
                "message": "Verified against sandbox DigiLocker registry.",
            }
        else:
            return {
                "status": "RECORD_NOT_FOUND",
                "validation_status": "FLAGGED_VIOLATION",
                "provisional_token": None,
                "apaar_id": apaar_id,
                "retry_queued": False,
                "flag_reasons": [
                    {
                        "code": "APAAR_NOT_FOUND",
                        "rule": "APH-2026-REGISTRY-404",
                        "description": f"APAAR ID {apaar_id} not found in National Academic Depository.",
                    }
                ],
                "message": "APAAR record does not exist in national registry.",
            }


# Global default instance
default_registry_adapter = ApaarRegistryAdapter()
