"""Exploratory transfer check for a passed target: does its saved model still rank patients on other data?

    python -m research.clinical.transfer_check congenital_heart_disease

Not declared before results and not part of any pass bar. It is recorded so a passed result
that holds only inside one dataset is visible next to the pass. The checks are listed in research/clinical/transfer_check.py.
"""
from __future__ import annotations

import json
import sys

import joblib
import numpy as np
from sklearn.metrics import roc_auc_score

from .config import load_protocol
from .datasets import load
from .evaluation import per_subject
from .run import EVIDENCE_DIR, feature_table, load_rows

# target -> check name -> (dataset, label, positive, negative, recording-id suffix or None)
CHECKS = {
    "congenital_heart_disease": {
        "circor_murmur_all_sites": ("circor", "murmur", ["Present"], ["Absent"], None),
        "circor_murmur_pulmonary_site": ("circor", "murmur", ["Present"], ["Absent"], "_PV"),
        "zchsound_noisy_newborns": ("zchsound_noisy", "diagnosis", ["VSD", "ASD", "PDA"], ["NORMAL"], None),
    },
}


def _auroc(labels, scores) -> float:
    return round(float(roc_auc_score(labels, scores)), 3)


def age_only_auroc(protocol, target: dict) -> float:
    """How well age alone separates the target's own classes (a shortcut the model could use)."""
    rows = load(target["dataset"], protocol.data_root, protocol.raw["age_groups"], protocol.loader_options(target["dataset"]))
    order = list(protocol.raw["age_groups"])
    kept = [r for r in rows if r.labels.get(target["label"]) in target["positive"] + target["negative"] and r.age_group]
    labels = [int(r.labels[target["label"]] in target["positive"]) for r in kept]
    auroc = _auroc(labels, [order.index(r.age_group) for r in kept])
    return max(auroc, round(1 - auroc, 3))


def run(name: str, workers: int = 10) -> dict:
    protocol = load_protocol()
    target = protocol.raw["targets"][name]
    models = sorted((protocol.cache_dir / "models").glob(f"{name}-*.joblib"))
    if not models:
        raise SystemExit(f"{name}: no passed model saved for {protocol.version}")
    out = {"status": "exploratory", "note": __doc__.split("\n\n")[2].replace("\n", " ").strip(), "protocol_version": protocol.version,
           "target": name, "age_group_only_auroc": age_only_auroc(protocol, target), "models": {}}
    for path in models:
        saved = joblib.load(path)
        if saved["protocol_version"] != protocol.version:
            continue  # a model saved by another protocol run
        model = path.stem.split("-", 1)[1]
        for check, (dataset, label, positive, negative, suffix) in CHECKS[name].items():
            rows, _ = load_rows(protocol, [dataset])
            rows = [r for r in rows if r.labels.get(label) in positive + negative and (suffix is None or r.recording_id.endswith(suffix))]
            features, owner = feature_table(protocol, rows, saved["feature_set"], workers)
            labels = np.array([int(rows[i].labels[label] in positive) for i in owner])
            subjects = np.array([rows[i].subject for i in owner])
            _, scores, subject_labels = per_subject(saved["fitted"].model.predict(features), labels, subjects)
            out["models"].setdefault(model, {})[check] = {"dataset": dataset, "subjects": int(len(subject_labels)),
                                                          "positive_subjects": int(subject_labels.sum()),
                                                          "auroc": _auroc(subject_labels, scores)}
    return out


def main() -> int:
    name = sys.argv[1]
    result = run(name)
    path = EVIDENCE_DIR / f"clinical_{name}_{result['protocol_version'].rsplit('-', 1)[-1]}_transfer.json"
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(result, indent=2) + "\n")
    print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
