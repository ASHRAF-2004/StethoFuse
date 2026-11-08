"""Isolated analysis state/report authorization; fixtures are not ML evidence."""
import json
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app.access_foundation import AccessDenied
from app.m1.analysis_engine import ANALYSIS_VERSION, AnalysisError, interpret_windows, unavailable
from app.m1.analysis_report import report_html
from app.m1.api import create_app
from test_m1_api import env, auth, upload, grant


def saved_result(env, analysis=None):
    recording = upload(env)
    identity = env.verifier.identities["owner"]
    env.store.request_separation(identity, recording["id"])
    job = env.store.claim_job()
    outputs = {kind: {"relative_path": job[kind + "_resource_id"] + ".wav",
                      "size": 48, "sha256": "a" * 64} for kind in ("heart", "lung")}
    provenance = {"model_version": "fixture", "input_artifact_sha256": "b" * 64}
    if analysis is not None:
        provenance["analysis"] = analysis
    env.store.complete_job(job, outputs, provenance)
    return recording, env.store.results(identity, job["result_id"])


def findings():
    return {"version": ANALYSIS_VERSION, "status": "partial", "run_id": "fixture-run",
            "completed_at": 1800000000, "source_sha256": {"original": "b" * 64},
            "components": {"heart": {"status": "unavailable", "finding": "uncertain"},
                           "lung": {"status": "complete", "finding": "wheeze", "track_agreement": False,
                                    "windows": [{"start_seconds": 0, "end_seconds": 8, "finding": "wheeze"}],
                                    "model_id": '<script>alert("model")</script>', "weights_sha256": "a" * 64}}}


def test_analysis_is_additive_and_owner_queue_is_idempotent(env):
    recording, result = saved_result(env)
    owner = env.verifier.identities["owner"]
    assert env.store.analysis(owner, result["id"])["status"] == "not_analyzed"
    first = env.store.request_analysis(owner, result["id"])
    assert first == env.store.request_analysis(owner, result["id"])
    claimed = env.store.claim_analysis()
    assert claimed["result_id"] == result["id"]
    assert claimed["run_id"] == first["run_id"]
    assert set(claimed["files"]) == {"original_audio", "heart_audio", "lung_audio"}
    assert env.store.complete_analysis({**claimed, "run_id": "wrong"}, findings()) is False
    assert env.store.complete_analysis(claimed, findings()) is True
    saved = env.store.results(owner, result["id"])
    assert saved["provenance"]["model_version"] == "fixture"
    assert saved["provenance"]["analysis"]["run_id"] == first["run_id"]
    assert env.store.recording(owner, recording["id"])["title"] == recording["title"]
    assert env.store.jobs(owner)[0]["status"] == "succeeded"


def test_recovery_requeues_once_then_exposes_failure(env):
    _, result = saved_result(env)
    owner = env.verifier.identities["owner"]
    env.store.request_analysis(owner, result["id"])
    assert env.store.claim_analysis()
    env.store.recover_interrupted_analysis()
    assert env.store.analysis(owner, result["id"])["status"] == "queued"
    assert env.store.claim_analysis()
    env.store.recover_interrupted_analysis()
    value = env.store.analysis(owner, result["id"])
    assert value["status"] == "unavailable"
    assert value["error_code"] == "analysis_interrupted"
    assert env.store.jobs(owner)[0]["status"] == "succeeded"


def test_disabling_owner_during_analysis_discards_findings_without_worker_failure(env):
    _, result = saved_result(env)
    owner = env.verifier.identities["owner"]
    env.store.request_analysis(owner, result["id"])
    request = env.store.claim_analysis()
    with env.store._connection(write=True) as db:
        db.execute("UPDATE af_users SET status='disabled' WHERE id=?", (env.users['owner']['id'],))
    assert env.store.complete_analysis(request, findings()) is False
    with env.store._connection() as db:
        value = json.loads(db.execute("SELECT provenance_json FROM m1_results WHERE id=?", (result['id'],)).fetchone()[0])
    assert value['analysis']['status'] == 'unavailable'
    assert value['analysis']['error_code'] == 'owner_unavailable'
    assert not value['analysis'].get('components')


def test_report_and_analysis_require_exact_current_result_access(env):
    recording, result = saved_result(env, findings())
    url = f'/api/results/{result["id"]}'
    for suffix in ("/analysis", "/report", "/report?locale=ar"):
        assert env.client.get(url + suffix).status_code == 401
        for name in ("other", "analyst", "admin"):
            assert env.client.get(url + suffix, headers=auth(name)).status_code == 403
    permission = grant(env, recording, resource_id=result["id"], permission="read")
    assert env.client.get(url + "/analysis", headers=auth("analyst")).status_code == 200
    report = env.client.get(url + "/report?locale=ar", headers=auth("analyst"))
    assert report.status_code == 200
    assert 'lang="ar" dir="rtl"' in report.text
    assert "private, no-store" in report.headers["cache-control"]
    assert "attachment" in report.headers["content-disposition"]
    assert "script-src" not in report.headers["content-security-policy"]
    assert "default-src 'none'" in report.headers["content-security-policy"]
    assert '<script>' not in report.text
    assert '&lt;script&gt;' in report.text
    denied = env.client.post(url + "/analysis", json={}, headers=auth("analyst"))
    assert denied.status_code == 403
    env.store.revoke_all(env.verifier.identities["owner"], recording["id"],
                         env.users["analyst"]["id"], recording["id"])
    assert env.client.get(url + "/report", headers=auth("analyst")).status_code == 403


def test_an_audio_only_grant_does_not_grant_findings_or_report(env):
    recording, result = saved_result(env, findings())
    original = next(r for r in recording["resources"] if r["kind"] == "original_audio")
    grant(env, recording, resource_id=original["id"], permission="read")
    for suffix in ("analysis", "report"):
        assert env.client.get(f'/api/results/{result["id"]}/{suffix}', headers=auth("analyst")).status_code == 403


def test_no_report_is_invented_before_analysis_and_capability_is_explicit(env):
    _, result = saved_result(env)
    url = f'/api/results/{result["id"]}'
    assert env.client.get(url + "/report", headers=auth()).status_code == 409
    assert env.client.post(url + "/analysis", headers=auth(), json={}).status_code == 503
    with TestClient(create_app(replace(env.settings, analysis_enabled=True), verifier=env.verifier)) as client:
        assert client.get('/api/auth/me', headers=auth()).json()["capabilities"]["analysis"] is True
        a = client.post(url + "/analysis", headers=auth(), json={})
        b = client.post(url + "/analysis", headers=auth(), json={})
        assert a.status_code == b.status_code == 202
        assert a.json()["run_id"] == b.json()["run_id"]
        assert client.post(url + "/analysis", headers=auth(), json={"model":"other"}).status_code == 422


def test_partial_report_preserves_uncertainty_and_escapes_notes():
    value = report_html({"id": "fixture", "public_id": "RES-fixture"}, findings(), reviews=[{
        "notes": '<img src=x onerror="steal()">', "reviewer_display_name": "Fixture", "decision": "pending"}])
    assert "Analysis unavailable" in value
    assert "Original and separated tracks produced different findings" in value
    assert '<img src=x' not in value
    assert '&lt;img' in value
    assert "not probabilities of disease" in value
    assert "https://stethofuse.ashraf-alsaloul.com/app/results/fixture" in value


def test_uncertainty_and_positive_summary_do_not_equate_targets_with_health():
    assert interpret_windows("heart", []) == "uncertain"
    assert interpret_windows("heart", [{"scores": [0.5, 0.48, 0.02]}]) == "uncertain"
    assert interpret_windows("heart", [{"scores": [0.1, 0.8, 0.1]}]) == "present"
    assert interpret_windows("heart", [{"scores": [0.05, 0.05, 0.9]}]) == "uncertain"
    assert interpret_windows("lung", [{"scores": [0.1, 0.8, 0.05, 0.05]},
                                       {"scores": [0.1, 0.05, 0.8, 0.05]}]) == "both"
    assert interpret_windows("lung", [{"scores": [0.8, 0.1, 0.05, 0.05]},
                                       {"scores": [0.5, 0.4, 0.05, 0.05]}]) == "uncertain"
    for scores in ([float("nan"), 0, 0], [2, -1, 0], [0, 0, 0]):
        with pytest.raises(AnalysisError):
            interpret_windows("heart", [{"scores": scores}])
    assert unavailable()["components"] == {}
