"""Load the declared clinical protocol and resolve local paths."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = REPO_ROOT / "research" / "configs" / "clinical_targets_v4.json"
# v1 listed model names only; they map onto (feature set, classifier) pairs.
V1_MODELS = {"prior": ("handcrafted", "prior"), "features_logreg": ("handcrafted", "logreg"),
             "features_boosted_trees": ("handcrafted", "boosted_trees")}


def local_path(value: str) -> Path:
    """Config paths are relative to the repository root unless absolute (e.g. from an environment variable)."""
    path = Path(value)
    return path if path.is_absolute() else (REPO_ROOT / path).resolve()


@dataclass(frozen=True)
class AudioSettings:
    sample_rate_hz: int
    window_sec: float
    hop_sec: float
    min_sec: float
    max_windows_per_recording: int
    n_fft: int
    hop_samples: int
    n_mels: int
    fmin_hz: float
    fmax_hz: float


@dataclass(frozen=True)
class Protocol:
    raw: dict[str, Any]
    path: Path

    @property
    def version(self) -> str:
        return self.raw["version"]

    @property
    def audio(self) -> AudioSettings:
        return AudioSettings(**self.raw["audio"])

    @property
    def data_root(self) -> Path:
        return local_path(os.environ.get(self.raw["data_root_env"], self.raw["default_data_root"]))

    @property
    def data_root_label(self) -> str:
        """How the data root was chosen, without the machine's absolute path (for evidence files)."""
        env = self.raw["data_root_env"]
        return f"${env}" if env in os.environ else self.raw["default_data_root"]

    @property
    def cache_dir(self) -> Path:
        return local_path(os.environ.get(self.raw["cache_dir_env"], self.raw["default_cache_dir"]))

    @property
    def models(self) -> dict[str, dict[str, str]]:
        models = self.raw["models"]
        if isinstance(models, list):
            return {name: {"features": V1_MODELS[name][0], "classifier": V1_MODELS[name][1]} for name in models}
        return models

    def dataset_options(self, name: str) -> dict[str, Any]:
        """Declared per-dataset settings. Loader arguments only; ``published_age_years`` is read by the age rule."""
        return dict(self.raw.get("dataset_options", {}).get(name, {}))

    def loader_options(self, name: str) -> dict[str, Any]:
        return {k: v for k, v in self.dataset_options(name).items() if k not in NON_LOADER_OPTIONS}

    def feature_set(self, name: str) -> dict[str, Any]:
        return self.raw.get("feature_sets", {"handcrafted": {}})[name]

    def target(self, name: str) -> dict[str, Any]:
        try:
            return self.raw["targets"][name]
        except KeyError as error:
            raise KeyError(f"Unknown target {name!r}; declared: {sorted(self.raw['targets'])}") from error


NON_LOADER_OPTIONS = {"published_age_years", "note"}


def target_sources(target: dict[str, Any]) -> list[dict[str, Any]]:
    """A target's labelled sources; single-dataset targets declare one source inline."""
    if "sources" in target:
        return target["sources"]
    return [{key: target[key] for key in ("dataset", "label", "positive", "negative")}]


def load_protocol(path: Path | str = DEFAULT_CONFIG) -> Protocol:
    path = Path(path)
    raw = json.loads(path.read_text(encoding="utf-8"))
    for key in ("version", "audio", "split", "bootstrap", "models", "baseline_model", "gate", "targets", "target_pass_bar"):
        if key not in raw:
            raise ValueError(f"{path.name} is missing required key {key!r}")
    if raw["baseline_model"] not in raw["models"]:
        raise ValueError("baseline_model must be one of models")
    return Protocol(raw=raw, path=path)
