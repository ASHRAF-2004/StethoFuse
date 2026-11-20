"""Optional pseudonymous case details attached to one recording.

The allowed fields and values come from ``case_context_fields.json``; nothing
outside that spec is stored. Readers are anyone who can open the recording;
only the owner can change it. Rows are deleted with the owning account.
"""
from __future__ import annotations

import json
import re
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

SPEC_PATH = Path(__file__).with_name("case_context_fields.json")


class CaseContextError(ValueError):
    """Payload does not match the declared field spec."""


@lru_cache(maxsize=1)
def field_spec() -> dict[str, Any]:
    return json.loads(SPEC_PATH.read_text(encoding="utf-8"))


def validate_context(payload: dict[str, Any], spec: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return a normalised copy; unknown keys or values raise ``CaseContextError``.

    Empty values are dropped so a missing detail stays missing rather than blank.
    """
    spec = spec or field_spec()
    fields = {field["key"]: field for field in spec["fields"]}
    unknown = set(payload) - set(fields)
    if unknown:
        raise CaseContextError(f"Unknown case fields: {', '.join(sorted(unknown))}")
    clean: dict[str, Any] = {}
    for key, value in payload.items():
        field = fields[key]
        if value in (None, "", []):
            continue
        if field["type"] == "code":
            if not isinstance(value, str) or len(value.strip()) > field["max_length"] or not re.fullmatch(field["pattern"], value.strip()):
                raise CaseContextError(f"{key} must match the allowed code format.")
            clean[key] = value.strip()
        elif field["type"] == "choice":
            if value not in {option["value"] for option in field["options"]}:
                raise CaseContextError(f"{key} has an unsupported value.")
            clean[key] = value
        elif field["type"] == "multi_choice":
            allowed = [option["value"] for option in field["options"]]
            if not isinstance(value, list) or not set(value) <= set(allowed) or len(set(value)) != len(value):
                raise CaseContextError(f"{key} has unsupported or repeated values.")
            clean[key] = [option for option in allowed if option in value]  # spec order, deterministic
        else:
            raise CaseContextError(f"Field type {field['type']!r} is not supported.")
    return clean


class CaseContextStore:
    def case_context(self, identity, recording_id):
        with self._connection() as db:
            actor = self._actor(db, identity)
            recording = self._recording(db, actor, recording_id)
            return self._case_context_dto(db, recording_id, recording["is_owner"])

    def update_case_context(self, identity, recording_id, payload):
        clean = validate_context(payload)
        with self._connection(write=True) as db:
            actor = self._actor(db, identity)
            self._owner(db, actor, recording_id)
            if clean:
                db.execute("INSERT INTO m1_case_context(recording_id,context_json,updated_at) VALUES(?,?,?) "
                           "ON CONFLICT(recording_id) DO UPDATE SET context_json=excluded.context_json,updated_at=excluded.updated_at",
                           (recording_id, json.dumps(clean, sort_keys=True), int(time.time())))
            else:
                db.execute("DELETE FROM m1_case_context WHERE recording_id=?", (recording_id,))
            self._audit(db, actor["id"], "case_context.updated", recording_id)
            return self._case_context_dto(db, recording_id, True)

    @staticmethod
    def _case_context_dto(db, recording_id, can_edit):
        row = db.execute("SELECT context_json,updated_at FROM m1_case_context WHERE recording_id=?", (recording_id,)).fetchone()
        return {"spec_version": field_spec()["version"], "can_edit": can_edit,
                "context": json.loads(row[0]) if row else {}, "updated_at": row[1] if row else None}
