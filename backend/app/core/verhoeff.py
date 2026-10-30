"""
Verhoeff Checksum Algorithm Implementation based on the Dihedral Group D5.

Used nationally for Indian ID formats including 12-digit APAAR (Automated Permanent
Academic Account Registry) and Aadhaar to detect all single-digit errors and all
adjacent transposition errors.
"""

from typing import Tuple

# The multiplication table d based on dihedral group D5 symmetries of a regular pentagon
_D = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    (1, 2, 3, 4, 0, 6, 7, 8, 9, 5),
    (2, 3, 4, 0, 1, 7, 8, 9, 5, 6),
    (3, 4, 0, 1, 2, 8, 9, 5, 6, 7),
    (4, 0, 1, 2, 3, 9, 5, 6, 7, 8),
    (5, 9, 8, 7, 6, 0, 4, 3, 2, 1),
    (6, 5, 9, 8, 7, 1, 0, 4, 3, 2),
    (7, 6, 5, 9, 8, 2, 1, 0, 4, 3),
    (8, 7, 6, 5, 9, 3, 2, 1, 0, 4),
    (9, 8, 7, 6, 5, 4, 3, 2, 1, 0),
)

# The permutation table p applying cyclic permutations
_P = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    (1, 5, 7, 6, 2, 8, 3, 0, 9, 4),
    (5, 8, 0, 3, 7, 9, 6, 1, 4, 2),
    (8, 9, 1, 6, 0, 4, 3, 5, 2, 7),
    (9, 4, 5, 3, 1, 2, 6, 8, 7, 0),
    (4, 2, 8, 6, 5, 7, 3, 9, 0, 1),
    (2, 7, 9, 3, 8, 0, 6, 4, 1, 5),
    (7, 0, 4, 6, 9, 1, 3, 2, 5, 8),
)

# The inverse table inv in D5
_INV = (0, 4, 3, 2, 1, 5, 6, 7, 8, 9)


def validate_apaar_id(apaar_id: str) -> Tuple[bool, str]:
    """
    Validates a 12-digit APAAR ID against the Verhoeff checksum algorithm.

    Returns:
        (is_valid, reason_or_description)
    """
    if not apaar_id or not isinstance(apaar_id, str):
        return False, "APAAR ID must be a non-empty string."

    clean_id = apaar_id.replace("-", "").replace(" ", "").strip()

    if len(clean_id) != 12:
        return False, f"APAAR ID must be exactly 12 digits, got {len(clean_id)}."

    if not clean_id.isdigit():
        return False, "APAAR ID must contain only decimal digits."

    # Validate using Verhoeff D5 algorithm
    c = 0
    for i, ch in enumerate(reversed(clean_id)):
        c = _D[c][_P[i % 8][int(ch)]]

    if c == 0:
        return True, "Valid APAAR ID with authentic Verhoeff checksum."
    else:
        return (
            False,
            "Invalid APAAR ID checksum (failed Verhoeff D5 dihedral verification).",
        )


def generate_valid_apaar_id(eleven_digits: str) -> str:
    """
    Given an 11-digit string, computes the Verhoeff check digit and returns
    a mathematically valid 12-digit APAAR ID.
    """
    clean_digits = eleven_digits.replace("-", "").replace(" ", "").strip()

    if len(clean_digits) != 11 or not clean_digits.isdigit():
        raise ValueError(
            f"Input must be an 11-digit numeric string, got '{clean_digits}' ({len(clean_digits)} chars)."
        )

    c = 0
    for i, ch in enumerate(reversed(clean_digits), start=1):
        c = _D[c][_P[i % 8][int(ch)]]

    checksum_digit = str(_INV[c])
    return clean_digits + checksum_digit
