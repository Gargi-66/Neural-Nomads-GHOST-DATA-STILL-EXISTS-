import re


_POSITIVE_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\b(?:delete|deleted|deletion|deleting|erase|erased|erasure|purge|purging)\b",
        r"\b(?:close|remove|wipe)\s+(?:my|this|the|an?)\s+(?:customer\s+)?(?:account|profile|personal data|personal information|records?)\b",
        r"\bremove\b[^.?!]{0,80}\b(?:search result|personal details|personal information|personal data|profile|account|records?)\b",
        r"\b(?:deletion|deleting|delete|erasure|erasing|erase)\s+(?:request|case|process)\b",
        r"\b(?:my|this|the)\s+(?:deletion|erasure)\s+request\b",
        r"\b(?:account|profile|personal data|personal information)\b[^.?!]{0,100}\b(?:already been removed|is gone|has been removed|still existed|still exists)\b",
        r"\b(?:verify|check|inspect|confirm|tell me|let me know)\b[^.?!]{0,100}\b(?:account|profile|data|request|traces?|search result)\b[^.?!]{0,90}\b(?:deleted|gone|removed|erased|still exists|still visible|remains?)\b",
        r"\bexclus[aã]o\b|\bexcluir\b|\bapagar\b",
        r"\beliminaci[oó]n\b|\beliminar\b|\bborra(?:r|do)?\b",
        r"\bsuppression\b|\bsupprimer\b|\beffacer\b",
        r"\uC0AD\uC81C|\uD0C8\uD1F4",
        r"\u524A\u9664|\u6D88\u53BB",
    )
)

_NEGATIVE_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\b(?:do not|don't|never)\s+(?:delete|erase|remove|close)\b",
        r"\bnot\s+(?:asking|requesting|authorizing|seeking)\b[^.?!]{0,80}\b(?:delete|deletion|erase|erasure|remove|removal|close|closure)\b",
        r"\b(?:keep|leave)\s+(?:my\s+)?(?:account|profile)\s+(?:as is|active|in place)\b",
        r"\b(?:without|rather than)\s+(?:deleting|erasing|removing|closing)\b",
        r"\bremove me from (?:the )?marketing\b",
        r"\b(?:only|just)\s+(?:want|need)\s+(?:to\s+)?(?:download|export|access|correct|update|change|reset|opt out|stop)\b",
        r"\u524A\u9664\u3057\u306A\u3044|\u524A\u9664\u305B\u305A",
        r"\uC0AD\uC81C\uD558\uC9C0\s*\uB9C8",
    )
)


def authorizes_deletion(request_text: str) -> bool:
    """Return whether the text clearly requests account or personal-data deletion."""
    normalized = request_text.casefold()
    if any(pattern.search(normalized) for pattern in _NEGATIVE_PATTERNS):
        return False
    return any(pattern.search(normalized) for pattern in _POSITIVE_PATTERNS)