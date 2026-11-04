from collections import defaultdict
from datetime import datetime
from typing import Iterable


_IDENTITY_FIELDS = ("name", "email", "phone", "email_hash")


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalize_identifier(value: str | None) -> str:
    return " ".join((value or "").casefold().split())


class IdentityIndex:
    def __init__(
        self,
        identity_rows: Iterable[dict[str, str]],
        audit_rows: Iterable[dict[str, str]],
    ) -> None:
        self._identities = {row["user_id"]: row for row in identity_rows}
        self._history: dict[str, list[dict[str, str]]] = defaultdict(list)
        self._aliases: dict[str, set[str]] = defaultdict(set)
        for row in audit_rows:
            self._history[row["user_id"]].append(row)
            if row["field_name"] in _IDENTITY_FIELDS:
                for value in (row["old_value"], row["new_value"]):
                    normalized = normalize_identifier(value)
                    if normalized:
                        self._aliases[normalized].add(row["user_id"])

        for history in self._history.values():
            history.sort(key=lambda row: parse_timestamp(row["event_time"]))

    def resolve(self, email: str, as_of: str) -> str | None:
        normalized_email = normalize_identifier(email)
        cutoff = parse_timestamp(as_of)
        matches = set(self._aliases.get(normalized_email, set()))
        for user_id, identity in self._identities.items():
            if parse_timestamp(identity["updated_at"]) <= cutoff:
                if normalize_identifier(identity.get("email")) == normalized_email:
                    matches.add(user_id)
        eligible = {
            user_id
            for user_id in matches
            if any(
                row["field_name"] == "email"
                and parse_timestamp(row["event_time"]) <= cutoff
                and normalized_email
                in {
                    normalize_identifier(row["old_value"]),
                    normalize_identifier(row["new_value"]),
                }
                for row in self._history.get(user_id, ())
            )
            or (
                user_id in self._identities
                and parse_timestamp(self._identities[user_id]["updated_at"]) <= cutoff
                and normalize_identifier(self._identities[user_id].get("email"))
                == normalized_email
            )
        }
        return next(iter(eligible)) if len(eligible) == 1 else None

    def identifiers(self, user_id: str, as_of: str) -> set[str]:
        cutoff = parse_timestamp(as_of)
        identifiers = {normalize_identifier(user_id)}
        identity = self._identities.get(user_id)
        if identity and parse_timestamp(identity["updated_at"]) <= cutoff:
            identifiers.update(
                normalize_identifier(identity.get(field_name))
                for field_name in _IDENTITY_FIELDS
            )
        for row in self._history.get(user_id, ()):
            if parse_timestamp(row["event_time"]) <= cutoff:
                identifiers.add(normalize_identifier(row["old_value"]))
                identifiers.add(normalize_identifier(row["new_value"]))
        return {value for value in identifiers if value}

    def identifiers_in_text(self, text: str, as_of: str) -> set[str]:
        normalized_text = normalize_identifier(text)
        cutoff = parse_timestamp(as_of)
        matches: set[str] = set()
        for user_id in self._identities:
            if parse_timestamp(self._identities[user_id]["updated_at"]) > cutoff:
                continue
            for identifier in self.identifiers(user_id, as_of):
                if len(identifier) >= 5 and identifier in normalized_text:
                    matches.add(identifier)
        return matches