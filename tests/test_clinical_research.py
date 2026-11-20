"""Unit checks for the clinical evaluation toolkit (synthetic data only)."""
import json
from pathlib import Path

import numpy as np
import pytest

pytest.importorskip("sklearn")
soundfile = pytest.importorskip("soundfile")

from research.clinical.audio import load_mono, windows
from research.clinical.config import load_protocol
from research.clinical.datasets import age_group_from_band, age_group_from_years, cap_per_subject, Recording, load_bmdhs
from research.clinical.evaluation import (Calibrator, binary_metrics, expected_calibration_error, fit_with_threshold, gate_decision,
                                          gate_rates, per_subject, subject_balanced_weights, subject_split, target_decision,
                                          threshold_for_sensitivity, wilson_interval)
from research.clinical.features import feature_names, recording_features

PROTOCOL = load_protocol()
GROUPS = PROTOCOL.raw["age_groups"]


def test_protocol_declares_every_target_dataset_and_bar():
    from research.clinical.config import target_sources
    from research.clinical.datasets import LOADERS
    for name, target in PROTOCOL.raw["targets"].items():
        for source in target_sources(target):
            assert source["dataset"] in LOADERS, name
            assert source["positive"] and source["negative"], name
            assert not set(source["positive"]) & set(source["negative"]), name
        assert set(target["supported_population"]) <= set(GROUPS), name
        baseline = target.get("baseline_model", PROTOCOL.raw["baseline_model"])
        assert baseline in {**PROTOCOL.models, **target.get("extra_models", {})}, name


def test_age_groups():
    assert age_group_from_years(0.5, GROUPS) == "infant"
    assert age_group_from_years(70, GROUPS) == "older_adult"
    assert age_group_from_band("30-39", GROUPS) == "adult"
    assert age_group_from_band("10-19", GROUPS) is None  # crosses child/adolescent/adult boundary
    assert age_group_from_band("", GROUPS) is None


def test_audio_resample_window_and_features(tmp_path):
    rate = 8000
    t = np.arange(rate * 8) / rate
    tone = (0.3 * np.sin(2 * np.pi * 150 * t) * (np.sin(2 * np.pi * 1.2 * t) > 0)).astype(np.float32)
    path = tmp_path / "beat.wav"
    soundfile.write(path, tone, rate)
    settings = PROTOCOL.audio
    signal = load_mono(path, settings.sample_rate_hz)
    assert abs(len(signal) - 8 * settings.sample_rate_hz) <= 1
    framed = windows(signal, settings)
    assert framed.shape[1] == int(settings.window_sec * settings.sample_rate_hz) and len(framed) == 2
    features = recording_features(framed, settings)
    assert features.shape == (2, len(feature_names(settings))) and np.isfinite(features).all()
    period = features[0, feature_names(settings).index("periodicity_sec")]
    assert abs(period - 1 / 1.2) < 0.1  # recovers the on/off rhythm


def test_short_input_has_no_windows():
    assert len(windows(np.zeros(100, np.float32), PROTOCOL.audio)) == 0


def test_cap_per_subject_keeps_order():
    rows = [Recording("d", str(i), f"s{i % 2}", None) for i in range(6)]
    assert [r.recording_id for r in cap_per_subject(rows, 2)] == ["0", "1", "2", "3"]


def test_subject_split_never_leaks():
    rng = np.random.default_rng(0)
    subjects = np.repeat([f"s{i}" for i in range(40)], 5)
    labels = np.repeat(rng.integers(0, 2, 40), 5)
    train, test = subject_split(labels, subjects, 0.25, 1)
    assert not set(subjects[train]) & set(subjects[test])
    assert train.sum() + test.sum() == len(labels)


def test_subject_weights_balance_classes_and_subjects():
    labels = np.array([1, 1, 1, 0])
    subjects = np.array(["a", "a", "b", "c"])
    w = subject_balanced_weights(labels, subjects)
    assert w[:2].sum() == pytest.approx(w[2])
    assert w[labels == 1].sum() == pytest.approx(w[labels == 0].sum())


def test_metrics_threshold_and_calibration():
    p = np.array([0.1, 0.2, 0.8, 0.9])
    y = np.array([0, 0, 1, 1])
    m = binary_metrics(p, y, 0.5)
    assert m["auroc"] == 1 and m["sensitivity"] == 1 and m["specificity"] == 1
    assert threshold_for_sensitivity(p, y, 1.0) == 0.8
    assert expected_calibration_error(np.array([1.0, 0.0]), np.array([1, 0])) == 0
    calibrated = Calibrator().fit(np.array([0.4, 0.45, 0.55, 0.6]), np.array([0, 0, 1, 1]))(np.array([0.6]))
    assert calibrated[0] > 0.6


def test_per_subject_mean():
    names, scores, labels = per_subject(np.array([0.2, 0.4, 0.9]), np.array([0, 0, 1]), np.array(["a", "a", "b"]))
    assert list(names) == ["a", "b"] and scores == pytest.approx([0.3, 0.9]) and list(labels) == [0, 1]


def test_end_to_end_learns_separable_signal():
    rng = np.random.default_rng(3)
    subjects = np.repeat([f"s{i}" for i in range(60)], 4)
    labels = np.repeat(np.arange(60) % 2, 4)
    features = rng.normal(size=(240, 5)) + labels[:, None] * 2.0
    for name in ("logreg", "boosted_trees"):
        fitted = fit_with_threshold(name, features, labels, subjects, 5, 0, 0.8)
        _, scores, y = per_subject(fitted.model.predict(features), labels, subjects)
        assert binary_metrics(fitted.calibrator(scores), y, fitted.threshold)["auroc"] > 0.95
    prior = fit_with_threshold("prior", features, labels, subjects, 5, 0, 0.8)
    assert np.ptp(prior.model.predict(features)) == 0


def test_decisions_name_failed_checks():
    bar = PROTOCOL.raw["target_pass_bar"]
    good = {"positive_subjects": 20, "negative_subjects": 20, "sensitivity": 0.9, "specificity": 0.9, "expected_calibration_error": 0.05}
    ci = {"auroc_ci_low": 0.8, "delta_vs_baseline_ci_low": 0.2}
    assert target_decision(good, ci, bar, is_baseline=False)["passed"]
    assert "beats_baseline" in target_decision(good, ci, bar, is_baseline=True)["failed_checks"]
    weak = dict(good, positive_subjects=3)
    assert target_decision(weak, ci, bar, False)["failed_checks"] == ["enough_test_positive_subjects"]

    rates = gate_rates(np.array([0.9, 0.95, 0.1, 0.5]), np.array([1, 1, 0, 0]), (0.2, 0.8), 0.95)
    assert rates["uncertain_fraction"] == 0.25 and rates["chest_false_rejection"] == 0
    assert "uncertain_fraction" in gate_decision(rates, PROTOCOL.raw["gate"]["pass_bar"])["failed_checks"]
    low, high = wilson_interval(0, 100, 0.95)
    assert low == pytest.approx(0) and 0.03 < high < 0.05


def test_bmdhs_skips_out_of_taxonomy_rows(tmp_path):
    base = tmp_path / "bmdhs"
    (base / "train").mkdir(parents=True)
    (base / "additional_metadata.csv").write_text("patient_id,Age\np1,30-39\np2,30-39\n")
    (base / "train.csv").write_text("patient_id,AS,AR,MR,MS,N,recording_1\np1,1,0,0,0,0,AS_1\np2,N/A,N/A,N/A,N/A,N/A,X_2\n")
    for name in ("AS_1", "X_2"):
        soundfile.write(base / "train" / f"{name}.wav", np.zeros(4000, np.float32), 4000)
    rows = load_bmdhs(tmp_path, GROUPS)
    assert [r.recording_id for r in rows] == ["AS_1"] and rows[0].age_group == "adult"


def test_every_declared_model_names_a_declared_feature_set():
    for name, spec in PROTOCOL.models.items():
        PROTOCOL.feature_set(spec["features"])
        assert spec["classifier"] in {"prior", "logreg", "boosted_trees"}, name
    assert PROTOCOL.raw["baseline_model"] in PROTOCOL.models


def test_v1_protocol_still_loads_with_legacy_model_names():
    v1 = load_protocol(PROTOCOL.path.with_name("clinical_targets_v1.json"))
    assert v1.models["features_logreg"] == {"features": "handcrafted", "classifier": "logreg"}


def test_report_lists_every_target_and_the_gate():
    from research.clinical.report import build
    text = build()
    for target in PROTOCOL.raw["targets"].values():
        assert f"| {target['title']} |" in text
    assert "## Automatic chest-sound gate" in text


def test_passing_model_is_activated_only_when_the_worker_runs_it():
    from research.clinical.publish import decision_status
    live = PROTOCOL.raw["publish"]["live"]
    assert decision_status(PROTOCOL, "gate", False) == "not_activated"
    assert decision_status(PROTOCOL, "gate", True) == ("activated" if "gate" in live else "passed")
    assert decision_status(PROTOCOL, "no_such_target", True) == "passed"


def test_every_evidence_file_ran_under_a_recorded_protocol_revision():
    from research.clinical.config import REPO_ROOT
    import hashlib
    for version in ("v1", "v2", "v3", "v4"):
        path = REPO_ROOT / "research" / "configs" / f"clinical_targets_{version}.json"
        protocol = load_protocol(path)
        # Earlier file states are listed in "revisions"; the current file state is also valid.
        known = {revision.get("sha256") for revision in protocol.raw["revisions"]} | {hashlib.sha256(path.read_bytes()).hexdigest()}
        for path in (REPO_ROOT / "research" / "evidence").glob(f"clinical_*_{version}.json"):
            provenance = json.loads(path.read_text(encoding="utf-8"))["provenance"]
            assert provenance["protocol_sha256"] in known, path.name
            assert ":" not in provenance["data_root"], "evidence must not record a machine's absolute path"


def test_kauh_loader_keeps_one_filter_export_and_normalises_diagnosis(tmp_path):
    from research.clinical.datasets import load_kauh
    base = tmp_path / "kauh" / "Audio Files"
    base.mkdir(parents=True)
    for name in ("EP1_N,N,P R M,70,F", "BP1_N,N,P R M,70,F", "EP2_copd,E W,P L L,55,M", "EP3_Heart Failure + COPD,C,P L U,66,M"):
        soundfile.write(base / f"{name}.wav", np.zeros(4000, dtype=np.float32), 4000)
    rows = load_kauh(tmp_path, GROUPS, filter="E")
    assert [r.labels["diagnosis"] for r in rows] == ["healthy", "copd", "heart failure + copd"]
    assert {r.subject for r in rows} == {"kauh:P1", "kauh:P2", "kauh:P3"}
    assert rows[0].age_group == age_group_from_years(70, GROUPS)


def test_respiratorydatabase_tr_loader_reads_spreadsheet_labels(tmp_path):
    openpyxl = pytest.importorskip("openpyxl")
    from research.clinical.datasets import load_respiratorydatabase_tr
    base = tmp_path / "respiratorydatabase_tr"
    (base / "audio").mkdir(parents=True)
    book = openpyxl.Workbook()
    book.active.append(["Patient ID", "Diagnosis"])
    book.active.append(["H001", "COPD0"])
    book.active.append(["H002", "COPD3"])
    book.save(base / "Labels.xlsx")
    for name in ("H001_L1", "H001_R1", "H002_L1", "H009_L1"):
        soundfile.write(base / "audio" / f"{name}.wav", np.zeros(4000, dtype=np.float32), 4000)
    rows = load_respiratorydatabase_tr(tmp_path, GROUPS)
    assert [(r.subject, r.labels["diagnosis"]) for r in rows] == [
        ("respiratorydatabase_tr:H001", "COPD0"), ("respiratorydatabase_tr:H001", "COPD0"), ("respiratorydatabase_tr:H002", "COPD3")]
    assert all(r.age_group is None for r in rows)


def test_published_age_range_admits_a_dataset_only_inside_supported_groups():
    from research.clinical.datasets import groups_covering
    assert groups_covering([38, 68], GROUPS) <= {"adult", "older_adult"}
    assert "child" in groups_covering([10, 40], GROUPS)


def test_site_only_baseline_and_single_class_sites_are_handled(monkeypatch):
    from research.clinical import run
    from research.clinical.datasets import Recording
    rows = ([Recording("a", f"a{i}", f"a:{i}", Path("x"), {"dx": "pos" if i < 8 else "neg"}, "adult") for i in range(10)]
            + [Recording("b", f"b{i}", f"b:{i}", Path("x"), {"dx": "pos" if i < 2 else "neg"}, "adult") for i in range(10)]
            + [Recording("c", f"c{i}", f"c:{i}", Path("x"), {"dx": "pos"}, "adult") for i in range(5)])
    monkeypatch.setattr(run, "load_rows", lambda protocol, names: ([r for r in rows if r.dataset in names], {}))
    target = {"sources": [{"dataset": d, "label": "dx", "positive": ["pos"], "negative": ["neg"]} for d in "abc"],
              "supported_population": ["adult"], "restrict_to_supported_population": True, "require_both_classes_per_dataset": True}
    kept, is_positive, notes = run.labelled_rows(PROTOCOL, target)
    assert notes["datasets_dropped_single_class"] == ["c"]
    assert len(kept) == 20 and is_positive.sum() == 10
    tables = run.FeatureTables(PROTOCOL, kept, 1)
    tables.owner = np.arange(len(kept))
    site = tables("site")
    assert site.shape == (20, 2) and (site.sum(axis=1) == 1).all()


def test_regurgitation_status_uses_graded_echo_findings_only():
    from research.clinical.datasets import regurgitation_status
    assert regurgitation_status([("MR", 2), ("TR", 1)], "MR") == "present"
    assert regurgitation_status([("MR", 0)], "MR") == "trace"
    assert regurgitation_status([("MR", None)], "MR") == "trace"
    assert regurgitation_status([("TR", 3), ("N", None)], "MR") == "absent"


def test_bracets_loader_splits_hospitals(tmp_path):
    from research.clinical.datasets import load_bracets
    base = tmp_path / "bracets"
    (base / "Metadata").mkdir(parents=True)
    (base / "Metadata" / "Metadata.txt").write_text(
        "SubjectID,Age,Gender,Height,Weight,BMI,Diagnosis,Place\n01,70,M,1.7,70,24,COPD,Aveiro\n02,40,F,1.6,60,23,Healthy,Thessaloniki\n",
        encoding="utf-8")
    for subject in ("01", "02"):
        folder = base / "Data" / subject / "Sound" / "EXTD"
        folder.mkdir(parents=True)
        soundfile.write(folder / f"{subject}_01_PBL.wav", np.zeros(4000, dtype=np.float32), 4000)
    rows = load_bracets(tmp_path, GROUPS, place="Thessaloniki")
    assert [(r.dataset, r.subject, r.labels["diagnosis"]) for r in rows] == [("bracets_thessaloniki", "bracets:02", "healthy")]


def test_zchsound_loader_reads_both_label_formats(tmp_path):
    from research.clinical.datasets import load_zchsound
    base = tmp_path / "zchsound"
    (base / "clean Heartsound Data").mkdir(parents=True)
    (base / "Noise Heartsound Data Details").mkdir()
    (base / "Clean Heartsound Data Details.csv").write_text(
        "fileName,gender,age(days),diagnosis\nZCH0001.wav,M,2310,NORMAL\nZCH0002.wav,F,40,vsd\nZCH0003.wav,F,10,ASD\n", encoding="utf-8")
    (base / "Noise Heartsound Data Details.csv").write_text(
        "﻿fileName;gender;age(days);diagnosis\nZCH0942.wav;M;1;PFO\n", encoding="utf-8")
    for folder, name in (("clean Heartsound Data", "ZCH0001"), ("clean Heartsound Data", "ZCH0002"), ("Noise Heartsound Data Details", "ZCH0942")):
        soundfile.write(base / folder / f"{name}.wav", np.zeros(4000, dtype=np.float32), 4000)
    clean = load_zchsound(tmp_path, GROUPS)
    assert [(r.dataset, r.subject, r.labels["diagnosis"], r.age_group) for r in clean] == [
        ("zchsound", "zchsound:ZCH0001", "NORMAL", age_group_from_years(2310 / 365.25, GROUPS)),
        ("zchsound", "zchsound:ZCH0002", "VSD", age_group_from_years(40 / 365.25, GROUPS))]
    noisy = load_zchsound(tmp_path, GROUPS, subset="noisy")
    assert [(r.dataset, r.labels["diagnosis"], r.age_group) for r in noisy] == [("zchsound_noisy", "PFO", age_group_from_years(1 / 365.25, GROUPS))]
