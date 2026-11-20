"""Command line: extract features, train, compare and record evidence.

    python -m research.clinical.run gate
    python -m research.clinical.run target copd
    python -m research.clinical.run all

Evidence is written to ``research/evidence/clinical_<task>_<version-suffix>.json``.
Models that pass their declared bar are saved under the cache directory.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import sklearn

from .audio import load_mono, windows
from .config import REPO_ROOT, AudioSettings, Protocol, load_protocol, target_sources
from .datasets import DatasetMissing, Recording, cap_per_subject, groups_covering, load
from .evaluation import (FittedTarget, binary_metrics, bootstrap_auroc, fit_with_threshold, gate_decision, gate_rates,
                         per_subject, subject_split, target_decision)
from .features import feature_names, recording_features

EVIDENCE_DIR = REPO_ROOT / "research" / "evidence"


# ----- features --------------------------------------------------------------------

def _extract(job: tuple[str, AudioSettings]) -> np.ndarray:
    path, settings = job
    try:
        return recording_features(windows(load_mono(path, settings.sample_rate_hz), settings), settings)
    except Exception:  # Undecodable file: recorded as zero windows, never silently relabelled.
        return np.empty((0, len(feature_names(settings))), dtype=np.float32)


def _embed_all(protocol: Protocol, rows: list[Recording], spec: dict[str, Any]) -> list[np.ndarray]:
    from .embeddings import PannsEmbedder  # Torch is only needed for this feature set.
    settings, embedder = protocol.audio, PannsEmbedder(spec, protocol.audio.sample_rate_hz)
    out = []
    for row in rows:
        try:
            out.append(embedder(windows(load_mono(row.path, settings.sample_rate_hz), settings)))
        except Exception:  # Same failure policy as the hand-crafted extractor.
            out.append(np.empty((0, 2048), dtype=np.float32))
    return out


def feature_table(protocol: Protocol, rows: list[Recording], feature_set: str, workers: int) -> tuple[np.ndarray, np.ndarray]:
    """Window features and, per window, the index of its recording in ``rows`` (cached)."""
    settings, spec = protocol.audio, protocol.feature_set(feature_set)
    key = hashlib.sha256(json.dumps([feature_set, spec, asdict(settings), sorted(str(r.path) for r in rows)]).encode()).hexdigest()[:16]
    cache = protocol.cache_dir / f"{feature_set}-{key}.npz"
    if cache.exists():
        stored = np.load(cache)
        return stored["features"], stored["owner"]
    if feature_set == "handcrafted":
        with ProcessPoolExecutor(max_workers=workers) as pool:
            per_recording = list(pool.map(_extract, [(str(r.path), settings) for r in rows], chunksize=8))
    else:
        per_recording = _embed_all(protocol, rows, spec)
    owner = np.concatenate([np.full(len(f), i) for i, f in enumerate(per_recording)]).astype(np.int64)
    features = np.concatenate(per_recording).astype(np.float32)
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(cache, features=features, owner=owner)
    return features, owner


SITE_FEATURES = "site"


class FeatureTables:
    """Feature sets for one cohort, computed on first use; all share one window layout."""

    def __init__(self, protocol: Protocol, rows: list[Recording], workers: int):
        self.protocol, self.rows, self.workers, self.owner = protocol, rows, workers, None
        self._tables: dict[str, np.ndarray] = {}

    def __call__(self, feature_set: str) -> np.ndarray:
        if feature_set == SITE_FEATURES:
            return self._site()
        if feature_set not in self._tables:
            features, owner = feature_table(self.protocol, self.rows, feature_set, self.workers)
            if self.owner is not None and not np.array_equal(owner, self.owner):
                raise RuntimeError(f"{feature_set} windows do not align with other feature sets")
            self.owner, self._tables[feature_set] = owner, features
        return self._tables[feature_set]

    def _site(self) -> np.ndarray:
        """One-hot source dataset per window: lets a baseline know the recording site and nothing else."""
        owner = self.layout()
        names = sorted({row.dataset for row in self.rows})
        site = np.array([names.index(self.rows[i].dataset) for i in owner])
        return np.eye(len(names), dtype=np.float32)[site]

    def layout(self) -> np.ndarray:
        if self.owner is None:
            self("handcrafted")
        return self.owner


def load_rows(protocol: Protocol, names: list[str]) -> tuple[list[Recording], dict[str, str]]:
    rows, missing = [], {}
    for name in names:
        try:
            rows.extend(load(name, protocol.data_root, protocol.raw["age_groups"], protocol.loader_options(name)))
        except DatasetMissing as error:
            missing[name] = str(error)
    return rows, missing


# ----- evidence helpers -------------------------------------------------------------

def _provenance(protocol: Protocol) -> dict[str, Any]:
    return {
        "protocol_version": protocol.version,
        "protocol_sha256": hashlib.sha256(protocol.path.read_bytes()).hexdigest(),
        "run_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "python": platform.python_version(), "numpy": np.__version__, "scikit_learn": sklearn.__version__,
        "data_root": protocol.data_root_label,
    }


def _write(name: str, protocol: Protocol, payload: dict[str, Any]) -> Path:
    suffix = protocol.version.rsplit("-", 1)[-1]
    path = EVIDENCE_DIR / f"clinical_{name}_{suffix}.json"
    path.write_text(json.dumps({"provenance": _provenance(protocol), **payload}, indent=2) + "\n", encoding="utf-8")
    return path


def _subject_counts(rows: list[Recording], labels: np.ndarray) -> dict[str, int]:
    subjects = {(r.subject, int(y)) for r, y in zip(rows, labels)}
    return {"recordings": len(rows), "subjects": len({s for s, _ in subjects}),
            "positive_subjects": sum(1 for _, y in subjects if y == 1), "negative_subjects": sum(1 for _, y in subjects if y == 0)}


# ----- tasks ------------------------------------------------------------------------

def run_gate(protocol: Protocol, workers: int) -> dict[str, Any]:
    gate, split, seed = protocol.raw["gate"], protocol.raw["split"], protocol.raw["split"]["seed"]
    positives, missing_pos = load_rows(protocol, gate["positive_datasets"])
    negatives, missing_neg = load_rows(protocol, gate["negative_datasets"])
    if not positives or not negatives:
        return {"status": "not_run", "missing_datasets": {**missing_pos, **missing_neg}}
    cap = gate["max_recordings_per_subject"]
    positives, negatives = cap_per_subject(positives, cap), cap_per_subject(negatives, cap)
    rows, is_chest = positives + negatives, np.array([1] * len(positives) + [0] * len(negatives))

    tables = FeatureTables(protocol, rows, workers)
    owner = tables.layout()
    labels, subjects = is_chest[owner], np.array([rows[i].subject for i in owner])
    recording_keys = np.array([f"{rows[i].dataset}:{rows[i].recording_id}" for i in owner])
    train, test = subject_split(labels, subjects, split["test_fraction"], seed)

    results = {}
    for model_name, spec in protocol.models.items():
        features = tables(spec["features"])
        fitted = fit_with_threshold(spec["classifier"], features[train], labels[train], recording_keys[train],
                                    split["cv_folds"], seed, target_sensitivity=1 - gate["pass_bar"]["max_chest_false_rejection"],
                                    groups=subjects[train])
        keys, scores, rec_labels = per_subject(fitted.model.predict(features[test]), labels[test], recording_keys[test])
        probabilities = fitted.calibrator(scores)
        rates = gate_rates(probabilities, rec_labels, tuple(gate["uncertain_band"]), protocol.raw["bootstrap"]["confidence"])
        decision = gate_decision(rates, gate["pass_bar"])
        if missing_pos or missing_neg:  # A gate trained without a declared source would mis-handle that source.
            decision = {"passed": False, "failed_checks": decision["failed_checks"] + ["declared_datasets_missing"]}
        results[model_name] = {"rates": rates, "decision": decision,
                               "by_source": _gate_breakdown(keys, probabilities, rec_labels, rows, gate["uncertain_band"])}
        if results[model_name]["decision"]["passed"]:
            _save_model(protocol, "gate", model_name, protocol.models[model_name]["features"], fitted)

    selected = _select(results, lambda r: -(r["rates"]["chest_false_rejection"] + r["rates"]["unrelated_false_acceptance"]
                                            + r["rates"]["uncertain_fraction"]))
    return {"status": "evaluated", "missing_datasets": {**missing_pos, **missing_neg},
            "test_unit": "recording (split by subject)", "cohort": _subject_counts(rows, is_chest),
            "results": results, "selected_model": selected,
            "limitations": ["PhysioNet 2016 publishes no subject identity; each record is treated as its own subject."]}


def _gate_breakdown(keys, probabilities, labels, rows: list[Recording], band) -> dict[str, Any]:
    category = {f"{r.dataset}:{r.recording_id}": f"{r.dataset}/{r.labels.get('category', r.age_group or 'all')}" for r in rows}
    out: dict[str, Counter] = {}
    for key, p, y in zip(keys, probabilities, labels):
        verdict = "rejected" if p < band[0] else "accepted" if p > band[1] else "uncertain"
        out.setdefault(category[key], Counter())[verdict] += 1
    return {name: dict(counts) for name, counts in sorted(out.items())}


def labelled_rows(protocol: Protocol, target: dict[str, Any]) -> tuple[list[Recording], np.ndarray, dict[str, Any]]:
    """Recordings of every declared source with their class, after the declared population rules."""
    sources = target_sources(target)
    all_rows, missing = load_rows(protocol, sorted({source["dataset"] for source in sources}))
    rows, is_positive = [], []
    for source in sources:
        for row in all_rows:
            value = row.labels.get(source["label"])
            if row.dataset == source["dataset"] and value in source["positive"] + source["negative"]:
                rows.append(row)
                is_positive.append(int(value in source["positive"]))
    notes: dict[str, Any] = {"missing_datasets": missing, "recordings_excluded_outside_supported_age": 0}
    if target.get("restrict_to_supported_population"):
        keep = [_in_supported_population(protocol, row, target["supported_population"]) for row in rows]
        notes["recordings_excluded_outside_supported_age"] = keep.count(False)
        rows, is_positive = [r for r, k in zip(rows, keep) if k], [y for y, k in zip(is_positive, keep) if k]
    if target.get("require_both_classes_per_dataset"):
        classes: dict[str, set[int]] = {}
        for row, y in zip(rows, is_positive):
            classes.setdefault(row.dataset, set()).add(y)
        dropped = sorted(name for name, seen in classes.items() if len(seen) < 2)
        notes["datasets_dropped_single_class"] = dropped
        is_positive = [y for r, y in zip(rows, is_positive) if r.dataset not in dropped]
        rows = [r for r in rows if r.dataset not in dropped]
    return rows, np.array(is_positive, dtype=np.int64), notes


def _in_supported_population(protocol: Protocol, row: Recording, supported: list[str]) -> bool:
    if row.age_group is not None:
        return row.age_group in supported
    published = protocol.dataset_options(row.dataset).get("published_age_years")
    return bool(published) and groups_covering(published, protocol.raw["age_groups"]) <= set(supported)


def run_target(protocol: Protocol, name: str, workers: int) -> dict[str, Any]:
    target, split, seed = protocol.target(name), protocol.raw["split"], protocol.raw["split"]["seed"]
    bar, boot = protocol.raw["target_pass_bar"], protocol.raw["bootstrap"]
    baseline = target.get("baseline_model", protocol.raw["baseline_model"])
    models = {**protocol.models, **target.get("extra_models", {})}
    rows, is_positive, notes = labelled_rows(protocol, target)
    if not rows:
        return {"status": "not_run", **notes, "reason": "no labelled recordings available"}
    cohort = _subject_counts(rows, is_positive)
    cohort["by_dataset"] = {site: _subject_counts([r for r in rows if r.dataset == site],
                                                  np.array([y for r, y in zip(rows, is_positive) if r.dataset == site]))
                            for site in sorted({r.dataset for r in rows})}
    if min(cohort["positive_subjects"], cohort["negative_subjects"]) < 4:
        return {"status": "not_run", **notes, "cohort": cohort, "reason": "fewer than 4 subjects in a class; cannot split by subject"}

    tables = FeatureTables(protocol, rows, workers)
    owner = tables.layout()
    labels, subjects = is_positive[owner], np.array([rows[i].subject for i in owner])
    # Stratify by site and class together so no site's class mix is concentrated in one split.
    sites = sorted({r.dataset for r in rows})
    strata = labels * len(sites) + np.array([sites.index(rows[i].dataset) for i in owner])
    train, test = subject_split(strata, subjects, split["test_fraction"], seed)

    fitted, probs = {}, {}
    for model_name, spec in models.items():
        features = tables(spec["features"])
        fitted[model_name] = fit_with_threshold(spec["classifier"], features[train], labels[train], subjects[train],
                                                split["cv_folds"], seed, bar["target_sensitivity"])
        test_subjects, scores, subject_labels = per_subject(fitted[model_name].model.predict(features[test]), labels[test], subjects[test])
        probs[model_name] = fitted[model_name].calibrator(scores)
    intervals = bootstrap_auroc(probs, subject_labels, baseline, boot["resamples"], boot["confidence"], seed)

    age_of = {r.subject: r.age_group or "unknown" for r in rows}
    site_of = {r.subject: r.dataset for r in rows}
    results = {}
    for model_name, p in probs.items():
        metrics = binary_metrics(p, subject_labels, fitted[model_name].threshold)
        results[model_name] = {
            "test": metrics, "bootstrap": intervals.get(model_name, {}),
            "decision": target_decision(metrics, intervals.get(model_name, {}), bar, model_name in (baseline, protocol.raw["baseline_model"])),
            "by_age_group": _by_group(p, subject_labels, test_subjects, age_of, fitted[model_name].threshold),
            "by_dataset": _by_group(p, subject_labels, test_subjects, site_of, fitted[model_name].threshold),
        }
        if target.get("external_test_dataset"):
            results[model_name]["external_test"] = _external(protocol, target, fitted[model_name], models[model_name]["features"], workers)
        if results[model_name]["decision"]["passed"]:
            _save_model(protocol, name, model_name, models[model_name]["features"], fitted[model_name])

    candidates = {k: v for k, v in results.items() if k not in (baseline, protocol.raw["baseline_model"])}
    return {"status": "evaluated", "target": target, **notes, "test_unit": "subject", "baseline_model": baseline,
            "cohort": cohort, "train_subjects": int(len(set(subjects[train]))), "test_subjects": int(len(test_subjects)),
            "results": results, "selected_model": _select(candidates or results, lambda r: r["test"]["auroc"] or 0.0)}


def _by_group(probabilities, labels, subjects, group_of: dict[str, str], threshold: float) -> dict[str, Any]:
    groups = np.array([group_of[s] for s in subjects])
    return {group: binary_metrics(probabilities[groups == group], labels[groups == group], threshold)
            for group in sorted(set(groups))}


def _external(protocol: Protocol, target: dict[str, Any], fitted: FittedTarget, feature_set: str, workers: int) -> dict[str, Any]:
    rows, missing = load_rows(protocol, [target["external_test_dataset"]])
    rows = [r for r in rows if r.labels.get(target["label"]) in target["positive"] + target["negative"]]
    if not rows:
        return {"status": "not_run", "missing_datasets": missing}
    features, owner = feature_table(protocol, rows, feature_set, workers)
    is_positive = np.array([int(r.labels[target["label"]] in target["positive"]) for r in rows])
    _, scores, labels = per_subject(fitted.model.predict(features), is_positive[owner], np.array([rows[i].subject for i in owner]))
    return {"status": "evaluated", "dataset": target["external_test_dataset"], "unit": "record (no subject identity published)",
            "metrics": binary_metrics(fitted.calibrator(scores), labels, fitted.threshold)}


def _select(results: dict[str, Any], score) -> dict[str, Any]:
    passing = {name: r for name, r in results.items() if r["decision"]["passed"]}
    pool = passing or results
    best = max(pool, key=lambda name: score(pool[name]))
    return {"model": best, "activated": bool(passing)}


def _save_model(protocol: Protocol, name: str, model_name: str, feature_set: str, fitted: FittedTarget) -> None:
    directory = protocol.cache_dir / "models"
    directory.mkdir(parents=True, exist_ok=True)
    joblib.dump({"protocol_version": protocol.version, "audio": asdict(protocol.audio), "feature_set": feature_set,
                 "feature_spec": protocol.feature_set(feature_set), "fitted": fitted}, directory / f"{name}-{model_name}.joblib")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("task", choices=["gate", "target", "all"])
    parser.add_argument("name", nargs="?", help="target name for the 'target' task")
    parser.add_argument("--config", default=None)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args(argv)
    protocol = load_protocol(args.config) if args.config else load_protocol()

    tasks: list[tuple[str, Any]] = []
    if args.task in {"gate", "all"}:
        tasks.append(("gate", lambda: run_gate(protocol, args.workers)))
    if args.task == "target":
        if not args.name:
            parser.error("target requires a name")
        tasks.append((args.name, lambda: run_target(protocol, args.name, args.workers)))
    if args.task == "all":
        tasks += [(n, lambda n=n: run_target(protocol, n, args.workers)) for n in protocol.raw["targets"]]
    for name, task in tasks:
        path = _write(name, protocol, task())
        print(f"{name}: {path.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
