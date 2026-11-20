"""Write ``docs/CLINICAL_EVALUATION.md`` from the recorded evidence files.

    python -m research.clinical.report

Every number in the document is copied from ``research/evidence/clinical_*``;
nothing is typed by hand, so the document cannot drift from the evidence.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from .config import REPO_ROOT, load_protocol
from .run import EVIDENCE_DIR

DOC = REPO_ROOT / "docs" / "CLINICAL_EVALUATION.md"


def _f(value, digits=3):
    return "—" if value is None else f"{value:.{digits}f}"


def _load(name: str, suffix: str):
    path = EVIDENCE_DIR / f"clinical_{name}_{suffix}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def target_table(protocol, suffix: str) -> list[str]:
    lines = ["| Condition | Model | Test patients (with condition) | AUROC [95% CI] | Sensitivity | Specificity | Calibration error | Result |",
             "|---|---|---|---|---|---|---|---|"]
    for name, target in protocol.raw["targets"].items():
        evidence = _load(name, suffix)
        if not evidence or evidence.get("status") != "evaluated":
            reason = (evidence or {}).get("reason", "no evidence yet")
            cohort = (evidence or {}).get("cohort")
            if cohort:
                reason += (f" (supported ages {', '.join(target.get('supported_population', []))}: "
                           f"{cohort['positive_subjects']} with, {cohort['negative_subjects']} without)")
            lines.append(f"| {target['title']} | — | — | — | — | — | — | Not run: {reason} |")
            continue
        for model, result in evidence["results"].items():
            t, ci = result["test"], result["bootstrap"]
            verdict = "**Passed**" if result["decision"]["passed"] else "Failed: " + ", ".join(result["decision"]["failed_checks"])
            selected = " (selected)" if evidence["selected_model"]["model"] == model else ""
            lines.append(f"| {target['title']} | {model}{selected} | {t['subjects']} ({t['positive_subjects']}) | "
                         f"{_f(t['auroc'])} [{_f(ci.get('auroc_ci_low'), 2)}, {_f(ci.get('auroc_ci_high'), 2)}] | "
                         f"{_f(t['sensitivity'], 2)} | {_f(t['specificity'], 2)} | {_f(t['expected_calibration_error'], 2)} | {verdict} |")
            external = (result.get("external_test") or {}).get("metrics")
            if external:
                lines.append(f"| ↳ external {target['external_test_dataset']} | {model} | {external['subjects']} records ({external['positive_subjects']}) | "
                             f"{_f(external['auroc'])} | {_f(external['sensitivity'], 2)} | {_f(external['specificity'], 2)} | "
                             f"{_f(external['expected_calibration_error'], 2)} | Not part of the pass bar |")
    return lines


def pooled_detail(protocol, suffix: str) -> list[str]:
    """For targets pooled across sites: who is in each site, which sites were dropped, and per-site test results."""
    out = []
    for name, target in protocol.raw["targets"].items():
        evidence = _load(name, suffix)
        if "sources" not in target or not evidence or "cohort" not in evidence:
            continue
        out += [f"### {target['title']}: by dataset", "",
                f"Baseline: `{target.get('baseline_model', protocol.raw['baseline_model'])}` (knows only which dataset a recording came from). "
                f"Datasets dropped for having one class only: {', '.join(evidence.get('datasets_dropped_single_class', [])) or 'none'}. "
                f"Recordings outside the supported ages: {evidence.get('recordings_excluded_outside_supported_age', 0)}.", "",
                "| Dataset | Patients with | Patients without |", "|---|---|---|"]
        for site, counts in evidence["cohort"].get("by_dataset", {}).items():
            out.append(f"| {site} | {counts['positive_subjects']} | {counts['negative_subjects']} |")
        if evidence.get("status") == "evaluated":
            model = evidence["selected_model"]["model"]
            out += ["", f"Held-out results for `{model}` by dataset:", "",
                    "| Dataset | Test patients (with) | AUROC | Sensitivity | Specificity |", "|---|---|---|---|---|"]
            for site, m in evidence["results"][model].get("by_dataset", {}).items():
                out.append(f"| {site} | {m['subjects']} ({m['positive_subjects']}) | {_f(m['auroc'])} | {_f(m['sensitivity'], 2)} | {_f(m['specificity'], 2)} |")
        out.append("")
    return out


def gate_table(suffix: str) -> list[str]:
    evidence = _load("gate", suffix)
    if not evidence or evidence.get("status") != "evaluated":
        missing = ", ".join(sorted((evidence or {}).get("missing_datasets", {})))
        return ["Not run: " + (f"missing datasets {missing}" if missing else "no evidence yet")]
    lines = [f"Cohort: {evidence['cohort']['recordings']} recordings from {evidence['cohort']['subjects']} subjects. "
             f"Missing declared datasets: {', '.join(sorted(evidence['missing_datasets'])) or 'none'}.", "",
             "| Model | Chest false rejection [95% CI high] | Unrelated false acceptance [95% CI high] | Uncertain | Result |", "|---|---|---|---|---|"]
    for model, result in evidence["results"].items():
        r = result["rates"]
        verdict = "**Passed**" if result["decision"]["passed"] else "Failed: " + ", ".join(result["decision"]["failed_checks"])
        lines.append(f"| {model} | {_f(r['chest_false_rejection'])} [{_f(r['chest_false_rejection_ci'][1])}] | "
                     f"{_f(r['unrelated_false_acceptance'])} [{_f(r['unrelated_false_acceptance_ci'][1])}] | {_f(r['uncertain_fraction'])} | {verdict} |")
    return lines


def build() -> str:
    protocol = load_protocol()
    suffix = protocol.version.rsplit("-", 1)[-1]
    bar, gate_bar = protocol.raw["target_pass_bar"], protocol.raw["gate"]["pass_bar"]
    out = [
        "# Clinical evaluation: condition checks and chest-sound gate", "",
        f"Generated by `python -m research.clinical.report` from protocol `{protocol.version}` "
        f"(`research/configs/{protocol.path.name}`). Do not edit numbers by hand.", "",
        "## What was tested", "",
        "Each condition model was trained and tested on **different patients** (split by patient, never by recording). "
        "Thresholds and calibration were chosen on training patients only; the held-out patients were used once. "
        "Every model is compared against a baseline that guesses the class rate; targets pooled across hospitals use a "
        "baseline that knows only the hospital, so a model gets no credit for recognising the site. Pass bars were declared before results "
        "and are not changed after seeing them.", "",
        f"A condition is switched on only if all hold on held-out patients: at least {bar['min_test_positive_subjects']} "
        f"patients with and without the condition; AUROC 95% lower bound ≥ {bar['min_auroc_ci_low']}; clearly better than the "
        f"baseline; sensitivity ≥ {bar['min_test_sensitivity']}; specificity ≥ {bar['min_test_specificity']}; calibration "
        f"error ≤ {bar['max_expected_calibration_error']}.", "",
        "## Condition results", "", *target_table(protocol, suffix), "",
        *pooled_detail(protocol, suffix),
        "## Automatic chest-sound gate", "",
        f"Pass bar: chest false rejection ≤ {gate_bar['max_chest_false_rejection']} (upper CI ≤ {gate_bar['max_chest_false_rejection_ci_high']}), "
        f"unrelated false acceptance ≤ {gate_bar['max_unrelated_false_acceptance']} (upper CI ≤ {gate_bar['max_unrelated_false_acceptance_ci_high']}), "
        f"uncertain ≤ {gate_bar['max_uncertain_fraction']}, and every declared dataset present.", "",
        *gate_table(suffix), "",
        "## Limits", "",
        "- These are research datasets, not this app's users or devices. Passing here is not clinical validation.",
        "- BMD-HS (valve diseases) is CC BY-NC-ND: non-commercial use only, and its test set is small.",
        "- PhysioNet 2016 publishes no patient identity, so it is used only as a second-dataset check.",
        "- ICBHI was downloaded from the official server with an expired TLS certificate, at the owner's choice; "
        "its counts (920 recordings, 126 patients) match the publication.",
        "- KAUH (Jordan) and RespiratoryDatabase@TR (Turkey) are CC BY 4.0; both used Littmann 3200 stethoscopes. "
        "RespiratoryDatabase@TR's no-COPD group (COPD0) has normal spirometry but chronic symptoms; it is not a healthy group.",
        "- The Fortis (New Delhi) lung set was downloaded but excluded: no patient identifiers or ages, duplicated files, "
        "and heart sounds inside its normal class.",
        "- BRACETS (Aveiro and Thessaloniki) and the heart-regurgitation set (Littmann 3200, echo-confirmed) are CC BY 4.0. "
        "BRACETS Aveiro has no healthy subjects, so it is dropped for COPD.",
        "- ZCHSound, HeartWave, Zhou et al. 2024 and the long-term-care pneumonia study were not used: recordings not obtained or "
        "available only on request.",
        "- No healthcare professional has reviewed these outputs.",
    ]
    return "\n".join(out) + "\n"


def main() -> int:
    with DOC.open("w", encoding="utf-8", newline="\n") as handle:  # LF on every platform, as in Git.
        handle.write(build())
    print(DOC.relative_to(REPO_ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
