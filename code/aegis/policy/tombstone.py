"""AEGIS 3.0 Module 1 — Tombstone Policy Specialist.

Handles the explicit logic for ACCOUNT_TOMBSTONE under Rule 15:
- Stable internal user_id is permitted to preserve referential integrity.
- Direct identifiers (name, email, phone, email_hash) are strictly prohibited.
"""

from typing import List, Tuple, Set

PROHIBITED_DIRECT_IDENTIFIERS: Set[str] = {
    "name",
    "email",
    "phone",
    "email_hash",
    "telephone",
    "first_name",
    "last_name",
    "full_name",
}

PERMITTED_INTERNAL_IDENTIFIERS: Set[str] = {
    "user_id",
    "internal_id",
    "account_id",
}


def evaluate_tombstone_identifiers(present_identifiers: List[str]) -> Tuple[List[str], List[str], List[str]]:
    """Evaluates identifiers present in an account tombstone.

    Returns:
        (permitted, prohibited, violating_present)
    """
    permitted: List[str] = []
    prohibited: List[str] = []
    violating_present: List[str] = []

    for ident in present_identifiers:
        norm = ident.strip().lower()
        if norm in PERMITTED_INTERNAL_IDENTIFIERS:
            permitted.append(ident)
        elif norm in PROHIBITED_DIRECT_IDENTIFIERS:
            prohibited.append(ident)
            violating_present.append(ident)
        else:
            # Conservative: unknown identifier in tombstone flagged as prohibited
            prohibited.append(ident)
            violating_present.append(ident)

    return permitted, prohibited, violating_present

