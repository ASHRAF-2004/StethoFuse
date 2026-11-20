"""Turn recorded evidence into the status file the app serves.

    python -m research.clinical.publish

Only evidence produced under the current protocol is read. A target without
evidence is published as ``not_run``. Nothing here changes a decision; it
copies the recorded decision, the selected model's test numbers and the bar.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from .config import REPO_ROOT, Protocol, load_protocol, target_sources
from .run import EVIDENCE_DIR

STATUS_FORMAT = "stethofuse-clinical-status-v1"


def decision_status(protocol: Protocol, name: str, passed: bool) -> str:
    """``activated`` only when the worker runs the model (``publish.live``); passing tests alone is ``passed``."""
    if not passed:
        return "not_activated"
    return "activated" if name in protocol.raw["publish"].get("live", []) else "passed"


def _evidence(protocol: Protocol, name: str) -> dict[str, Any] | None:
    path = EVIDENCE_DIR / f"clinical_{name}_{protocol.version.rsplit('-', 1)[-1]}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if data.get("provenance", {}).get("protocol_version") == protocol.version else None


def target_status(protocol: Protocol, name: str) -> dict[str, Any]:
    target, bar = protocol.target(name), protocol.raw["target_pass_bar"]
    entry: dict[str, Any] = {
        "key": name, "organ": target["organ"], "title": {"en": target["title"], "ar": target.get("title_ar", target["title"])},
        "supported_population": target["supported_population"], "dataset": ", ".join(dict.fromkeys(s["dataset"] for s in target_sources(target))),
        "bar": {"min_auroc_ci_low": bar["min_auroc_ci_low"], "min_test_sensitivity": bar["min_test_sensitivity"],
                "min_test_specificity": bar["min_test_specificity"], "max_expected_calibration_error": bar["max_expected_calibration_error"],
                "min_test_positive_subjects": bar["min_test_positive_subjects"]},
    }
    evidence = _evidence(protocol, name)
    if evidence is None or evidence.get("status") != "evaluated":
        return {**entry, "status": "not_run", "reason": (evidence or {}).get("reason") or "no evidence recorded yet",
                "missing_datasets": sorted((evidence or {}).get("missing_datasets", {}))}
    selected = evidence["selected_model"]
    result = evidence["results"][selected["model"]]
    test, ci = result["test"], result["bootstrap"]
    return {**entry, "status": decision_status(protocol, name, selected["activated"]), "model": selected["model"],
            "evidence_run_utc": evidence["provenance"]["run_utc"], "failed_checks": result["decision"]["failed_checks"],
            "test": {"subjects": test["subjects"], "positive_subjects": test["positive_subjects"], "auroc": test["auroc"],
                     "auroc_ci_low": ci.get("auroc_ci_low"), "auroc_ci_high": ci.get("auroc_ci_high"),
                     "sensitivity": test["sensitivity"], "specificity": test["specificity"],
                     "expected_calibration_error": test["expected_calibration_error"]},
            "external_test": (result.get("external_test") or {}).get("metrics")}


def gate_status(protocol: Protocol) -> dict[str, Any]:
    evidence = _evidence(protocol, "gate")
    if evidence is None or evidence.get("status") != "evaluated":
        return {"status": "not_run", "missing_datasets": sorted((evidence or {}).get("missing_datasets", {}))}
    selected = evidence["selected_model"]
    result = evidence["results"][selected["model"]]
    return {"status": decision_status(protocol, "gate", selected["activated"]), "model": selected["model"],
            "failed_checks": result["decision"]["failed_checks"], "rates": result["rates"],
            "missing_datasets": sorted(evidence.get("missing_datasets", {}))}


def build_status(protocol: Protocol) -> dict[str, Any]:
    return {"format": STATUS_FORMAT, "protocol_version": protocol.version,
            "gate": gate_status(protocol), "targets": [target_status(protocol, name) for name in protocol.raw["targets"]]}


def main() -> int:
    protocol = load_protocol()
    path = REPO_ROOT / protocol.raw["publish"]["status_file"]
    path.write_text(json.dumps(build_status(protocol), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(path.relative_to(REPO_ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
