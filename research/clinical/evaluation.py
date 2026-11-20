"""Subject-held-out training, comparison and pass/fail decisions.

Windows are classified individually and averaged per subject. Every split is
by subject so no person contributes to both training and test. Thresholds and
calibration come from out-of-fold training predictions only; the test set is
used once, for the reported numbers.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

LOGIT_EPS = 1e-6


# ----- models -------------------------------------------------------------------

class WindowModel:
    """Window-level classifier; each subject carries equal total training weight."""

    def __init__(self, name: str, seed: int):
        self.name = name
        self.seed = seed
        self.estimator: Any = None
        self.prior = 0.5

    def _build(self):
        if self.name == "logreg":
            return make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, C=0.5))
        if self.name == "boosted_trees":
            return HistGradientBoostingClassifier(max_iter=200, learning_rate=0.05, max_leaf_nodes=15,
                                                  l2_regularization=1.0, random_state=self.seed)
        raise ValueError(f"Unknown classifier {self.name!r}")

    def fit(self, features: np.ndarray, labels: np.ndarray, subjects: np.ndarray) -> "WindowModel":
        weights = subject_balanced_weights(labels, subjects)
        self.prior = float(np.average(labels, weights=weights))
        if self.name == "prior":
            return self
        self.estimator = self._build()
        if hasattr(self.estimator, "steps"):
            self.estimator.fit(features, labels, **{f"{self.estimator.steps[-1][0]}__sample_weight": weights})
        else:
            self.estimator.fit(features, labels, sample_weight=weights)
        return self

    def predict(self, features: np.ndarray) -> np.ndarray:
        if self.name == "prior":
            return np.full(len(features), self.prior)
        return self.estimator.predict_proba(features)[:, 1]


def subject_balanced_weights(labels: np.ndarray, subjects: np.ndarray) -> np.ndarray:
    """Each subject sums to 1, then each class sums to the same total."""
    _, inverse, counts = np.unique(subjects, return_inverse=True, return_counts=True)
    weights = 1.0 / counts[inverse]
    for value in (0, 1):
        mask = labels == value
        if mask.any():
            weights[mask] *= 0.5 / weights[mask].sum()
    return weights * len(labels)


def per_subject(scores: np.ndarray, labels: np.ndarray, subjects: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    names, inverse = np.unique(subjects, return_inverse=True)
    mean = np.bincount(inverse, weights=scores) / np.bincount(inverse)
    subject_label = np.zeros(len(names), dtype=int)
    subject_label[inverse] = labels
    return names, mean, subject_label


# ----- calibration and threshold ------------------------------------------------------

@dataclass
class Calibrator:
    """Platt scaling fitted on out-of-fold subject scores."""
    slope: float = 1.0
    intercept: float = 0.0

    @staticmethod
    def logit(p: np.ndarray) -> np.ndarray:
        p = np.clip(p, LOGIT_EPS, 1 - LOGIT_EPS)
        return np.log(p / (1 - p))

    def fit(self, scores: np.ndarray, labels: np.ndarray) -> "Calibrator":
        if len(np.unique(labels)) < 2 or np.ptp(scores) == 0:
            return self
        model = LogisticRegression(C=1e6, max_iter=1000).fit(self.logit(scores)[:, None], labels)
        self.slope, self.intercept = float(model.coef_[0, 0]), float(model.intercept_[0])
        return self

    def __call__(self, scores: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-(self.slope * self.logit(scores) + self.intercept)))


def threshold_for_sensitivity(probabilities: np.ndarray, labels: np.ndarray, sensitivity: float) -> float:
    positives = np.sort(probabilities[labels == 1])
    if len(positives) == 0:
        return 0.5
    index = int(math.floor((1 - sensitivity) * len(positives)))
    return float(positives[min(index, len(positives) - 1)])


# ----- metrics --------------------------------------------------------------------

def expected_calibration_error(probabilities: np.ndarray, labels: np.ndarray, bins: int = 10) -> float:
    edges = np.linspace(0, 1, bins + 1)
    index = np.clip(np.digitize(probabilities, edges[1:-1]), 0, bins - 1)
    error = 0.0
    for b in range(bins):
        mask = index == b
        if mask.any():
            error += mask.mean() * abs(probabilities[mask].mean() - labels[mask].mean())
    return float(error)


def binary_metrics(probabilities: np.ndarray, labels: np.ndarray, threshold: float) -> dict[str, float | int | None]:
    predicted = probabilities >= threshold
    positives, negatives = labels == 1, labels == 0
    sensitivity = float(predicted[positives].mean()) if positives.any() else None
    specificity = float((~predicted[negatives]).mean()) if negatives.any() else None
    auroc = float(roc_auc_score(labels, probabilities)) if positives.any() and negatives.any() else None
    return {
        "subjects": int(len(labels)), "positive_subjects": int(positives.sum()), "negative_subjects": int(negatives.sum()),
        "auroc": auroc, "sensitivity": sensitivity, "specificity": specificity,
        "balanced_accuracy": None if sensitivity is None or specificity is None else (sensitivity + specificity) / 2,
        "expected_calibration_error": expected_calibration_error(probabilities, labels), "threshold": threshold,
    }


def stratified_bootstrap(labels: np.ndarray, resamples: int, seed: int):
    """Yield index arrays resampled within each class (keeps both classes present)."""
    rng = np.random.default_rng(seed)
    pos, neg = np.flatnonzero(labels == 1), np.flatnonzero(labels == 0)
    for _ in range(resamples):
        yield np.concatenate([rng.choice(pos, len(pos)), rng.choice(neg, len(neg))])


def bootstrap_auroc(probs: dict[str, np.ndarray], labels: np.ndarray, baseline: str, resamples: int,
                    confidence: float, seed: int) -> dict[str, dict[str, float]]:
    """Percentile CIs for each model's AUROC and its paired difference from the baseline."""
    if len(np.unique(labels)) < 2:
        return {}
    samples: dict[str, list[float]] = {name: [] for name in probs}
    deltas: dict[str, list[float]] = {name: [] for name in probs}
    for index in stratified_bootstrap(labels, resamples, seed):
        base = roc_auc_score(labels[index], probs[baseline][index])
        for name, p in probs.items():
            value = roc_auc_score(labels[index], p[index])
            samples[name].append(value)
            deltas[name].append(value - base)
    tail = (1 - confidence) / 2 * 100
    return {name: {"auroc_ci_low": float(np.percentile(samples[name], tail)),
                   "auroc_ci_high": float(np.percentile(samples[name], 100 - tail)),
                   "delta_vs_baseline_ci_low": float(np.percentile(deltas[name], tail)),
                   "delta_vs_baseline_ci_high": float(np.percentile(deltas[name], 100 - tail))}
            for name in probs}


def wilson_interval(successes: int, total: int, confidence: float) -> tuple[float, float]:
    if total == 0:
        return 0.0, 1.0
    from scipy.stats import norm
    z = norm.ppf(1 - (1 - confidence) / 2)
    p = successes / total
    centre = (p + z * z / (2 * total)) / (1 + z * z / total)
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / (1 + z * z / total)
    return max(0.0, centre - half), min(1.0, centre + half)


# ----- splitting and the full train/evaluate cycle -------------------------------------------

def subject_split(labels: np.ndarray, subjects: np.ndarray, test_fraction: float, seed: int) -> tuple[np.ndarray, np.ndarray]:
    """Window masks (train, test) from a stratified split by subject."""
    folds = max(2, round(1 / test_fraction))
    splitter = StratifiedGroupKFold(n_splits=folds, shuffle=True, random_state=seed)
    train_index, test_index = next(splitter.split(np.zeros(len(labels)), labels, subjects))
    train, test = np.zeros(len(labels), bool), np.zeros(len(labels), bool)
    train[train_index], test[test_index] = True, True
    assert not set(subjects[train]) & set(subjects[test]), "subject leakage between train and test"
    return train, test


def out_of_fold_subject_scores(model_name: str, features, labels, units, folds: int, seed: int, groups=None):
    """Out-of-fold scores averaged per unit. Folds split by ``groups`` (defaults to ``units``)."""
    groups = units if groups is None else groups
    n_groups_per_class = min(len(np.unique(groups[labels == v])) for v in (0, 1))
    folds = max(2, min(folds, n_groups_per_class))
    splitter = StratifiedGroupKFold(n_splits=folds, shuffle=True, random_state=seed)
    scores = np.zeros(len(labels))
    for train_index, held_index in splitter.split(features, labels, groups):
        model = WindowModel(model_name, seed).fit(features[train_index], labels[train_index], units[train_index])
        scores[held_index] = model.predict(features[held_index])
    return per_subject(scores, labels, units)


@dataclass
class FittedTarget:
    model: WindowModel
    calibrator: Calibrator
    threshold: float


def fit_with_threshold(model_name: str, features, labels, units, folds: int, seed: int,
                       target_sensitivity: float, groups=None) -> FittedTarget:
    _, oof, oof_labels = out_of_fold_subject_scores(model_name, features, labels, units, folds, seed, groups)
    calibrator = Calibrator().fit(oof, oof_labels)
    threshold = threshold_for_sensitivity(calibrator(oof), oof_labels, target_sensitivity)
    model = WindowModel(model_name, seed).fit(features, labels, units)
    return FittedTarget(model, calibrator, threshold)


def target_decision(metrics: dict[str, Any], ci: dict[str, float], bar: dict[str, Any], is_baseline: bool) -> dict[str, Any]:
    """Apply the declared bar; every failed check is listed by name."""
    checks = {
        "enough_test_positive_subjects": metrics["positive_subjects"] >= bar["min_test_positive_subjects"],
        "enough_test_negative_subjects": metrics["negative_subjects"] >= bar["min_test_negative_subjects"],
        "auroc_ci_low": ci.get("auroc_ci_low", 0.0) >= bar["min_auroc_ci_low"],
        "beats_baseline": (not is_baseline) and ci.get("delta_vs_baseline_ci_low", 0.0) > bar["must_beat_baseline_auroc_ci_low"],
        "sensitivity": (metrics["sensitivity"] or 0.0) >= bar["min_test_sensitivity"],
        "specificity": (metrics["specificity"] or 0.0) >= bar["min_test_specificity"],
        "calibration": metrics["expected_calibration_error"] <= bar["max_expected_calibration_error"],
    }
    return {"passed": all(checks.values()), "failed_checks": [name for name, ok in checks.items() if not ok]}


def gate_rates(probabilities: np.ndarray, is_chest: np.ndarray, band: tuple[float, float], confidence: float) -> dict[str, Any]:
    low, high = band
    rejected, accepted = probabilities < low, probabilities > high
    uncertain = ~(rejected | accepted)
    chest, other = is_chest == 1, is_chest == 0
    false_rejections, false_acceptances = int((rejected & chest).sum()), int((accepted & other).sum())
    return {
        "chest_recordings": int(chest.sum()), "unrelated_recordings": int(other.sum()),
        "chest_false_rejection": false_rejections / max(1, chest.sum()),
        "chest_false_rejection_ci": wilson_interval(false_rejections, int(chest.sum()), confidence),
        "unrelated_false_acceptance": false_acceptances / max(1, other.sum()),
        "unrelated_false_acceptance_ci": wilson_interval(false_acceptances, int(other.sum()), confidence),
        "uncertain_fraction": float(uncertain.mean()) if len(uncertain) else 0.0,
    }


def gate_decision(rates: dict[str, Any], bar: dict[str, float]) -> dict[str, Any]:
    checks = {
        "chest_false_rejection": rates["chest_false_rejection"] <= bar["max_chest_false_rejection"],
        "chest_false_rejection_ci_high": rates["chest_false_rejection_ci"][1] <= bar["max_chest_false_rejection_ci_high"],
        "unrelated_false_acceptance": rates["unrelated_false_acceptance"] <= bar["max_unrelated_false_acceptance"],
        "unrelated_false_acceptance_ci_high": rates["unrelated_false_acceptance_ci"][1] <= bar["max_unrelated_false_acceptance_ci_high"],
        "uncertain_fraction": rates["uncertain_fraction"] <= bar["max_uncertain_fraction"],
    }
    return {"passed": all(checks.values()), "failed_checks": [name for name, ok in checks.items() if not ok]}
