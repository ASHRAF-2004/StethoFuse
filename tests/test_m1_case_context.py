"""Case context: spec-driven validation, access, export, deletion and migration."""
import sqlite3

import pytest

from app.m1.case_context import CaseContextError, field_spec, validate_context
from app.m1.store import SCHEMA_VERSION, M1Store
from test_m1_api import auth, env, grant, upload  # noqa: F401  (fixtures)

VALID = {"case_reference": "CASE-001", "age_group": "child", "sex": "not_stated", "reason": "symptoms",
         "symptoms": ["fever", "cough"], "chest_location": "mitral", "position": "sitting", "device": "Digital stethoscope 2"}


def test_validation_normalises_and_drops_blanks():
    clean = validate_context({**VALID, "device": ""})
    assert "device" not in clean
    assert clean["symptoms"] == ["cough", "fever"]  # spec order


@pytest.mark.parametrize("payload", [
    {"name": "Jane"}, {"age_group": "toddler"}, {"symptoms": ["cough", "cough"]}, {"symptoms": "cough"},
    {"case_reference": "Jane Doe"}, {"case_reference": "x" * 41}, {"device": "<script>"},
])
def test_validation_rejects_unknown_or_free_text(payload):
    with pytest.raises(CaseContextError):
        validate_context(payload)


def test_every_spec_field_has_bilingual_labels():
    for field in field_spec()["fields"]:
        assert field["label"]["en"] and field["label"]["ar"]
        for option in field.get("options", []):
            assert option["label"]["en"] and option["label"]["ar"]


def test_owner_edits_reader_sees_other_denied(env):
    recording = upload(env)
    path = f"/api/recordings/{recording['id']}/context"
    assert env.client.get(path, headers=auth()).json()["context"] == {}
    saved = env.client.put(path, headers=auth(), json={"context": VALID})
    assert saved.status_code == 200 and saved.json()["context"]["age_group"] == "child"
    assert env.client.put(path, headers=auth(), json={"context": {"name": "x"}}).status_code == 422
    assert env.client.get(path, headers=auth("other")).status_code == 403
    assert env.client.put(path, headers=auth("other"), json={"context": VALID}).status_code == 403

    grant(env, recording)
    shared = env.client.get(path, headers=auth("analyst")).json()
    assert shared["context"]["reason"] == "symptoms" and shared["can_edit"] is False
    assert env.client.put(path, headers=auth("analyst"), json={"context": VALID}).status_code == 403

    cleared = env.client.put(path, headers=auth(), json={"context": {}})
    assert cleared.json()["context"] == {} and cleared.json()["updated_at"] is None


def test_spec_endpoint_requires_sign_in(env):
    assert env.client.get("/api/case-context/spec").status_code == 401
    assert env.client.get("/api/case-context/spec", headers=auth()).json()["version"] == field_spec()["version"]


def test_export_includes_and_deletion_removes_context(env):
    recording = upload(env)
    env.client.put(f"/api/recordings/{recording['id']}/context", headers=auth(), json={"context": VALID})
    exported = env.client.get("/api/account/export", headers=auth()).json()
    assert exported["case_context"][0]["context"]["case_reference"] == "CASE-001"


def test_v3_database_migrates_to_current(tmp_path):
    path = tmp_path / "m1.sqlite3"
    store = M1Store(path)
    store.initialize()
    db = sqlite3.connect(path)
    db.executescript("DROP TABLE m1_case_context; DROP TABLE m1_meta; "
                     "CREATE TABLE m1_meta (version INTEGER PRIMARY KEY CHECK(version=3)); INSERT INTO m1_meta VALUES(3);")
    db.close()
    M1Store(path).initialize()
    db = sqlite3.connect(path)
    assert db.execute("SELECT version FROM m1_meta").fetchone()[0] == SCHEMA_VERSION == 4
    assert db.execute("SELECT COUNT(*) FROM m1_case_context").fetchone()[0] == 0
    db.close()


def test_clinical_targets_endpoint_serves_published_status(env):
    from app.m1.clinical_status import clinical_status, targets_for
    assert env.client.get("/api/clinical-targets").status_code == 401
    body = env.client.get("/api/clinical-targets", headers=auth()).json()
    assert body == clinical_status() and body["targets"]
    for target in targets_for(None):
        assert target["assessable"] is False  # unknown age is never assessed


def test_report_sections_show_supplied_details_and_never_invent_conditions():
    from app.m1.analysis_report import case_section, condition_section
    from app.m1.clinical_status import clinical_status
    html = case_section({"age_group": "child", "symptoms": ["cough", "fever"]}, "en")
    assert "Child (1–11)" in html and "Cough, Fever" in html and html.count("Not supplied") == len(field_spec()["fields"]) - 2
    assert "طفل" in case_section({"age_group": "child"}, "ar")
    conditions = condition_section({"age_group": "child"}, "en")
    for target in clinical_status()["targets"]:
        assert target["title"]["en"] in conditions
    assert "Validated model available" not in conditions or any(t["status"] == "activated" for t in clinical_status()["targets"])
