"""Offline, bounded acoustic analysis; never infers a disease from a sound label."""
from __future__ import annotations

import hashlib
import json
import math
import time
from pathlib import Path
from uuid import uuid4

ANALYSIS_VERSION = "stethofuse-acoustic-analysis-v1"
LABELS = {"heart": ("absent", "present", "unknown"),
          "lung": ("neither", "crackle", "wheeze", "both")}


class AnalysisError(RuntimeError):
    pass


def checked_file(root, relative, expected):
    path = (root / relative).resolve(strict=True)
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise AnalysisError("model_artifact_invalid")
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if len(expected) != 64 or digest != expected:
        raise AnalysisError("model_artifact_mismatch")
    return path


def unavailable(code="analysis_unavailable"):
    return {"version": ANALYSIS_VERSION, "run_id": uuid4().hex, "status": "unavailable",
            "completed_at": int(time.time()), "error_code": code, "components": {}}


def interpret_windows(kind, windows, threshold=0.70, margin=0.15):
    """Conservative recording-level summary, keeping all window evidence visible."""
    labels = LABELS[kind]
    accepted = []
    for row in windows:
        scores = row["scores"]
        if len(scores) != len(labels) or not all(math.isfinite(v) and 0 <= v <= 1 for v in scores):
            raise AnalysisError("invalid_model_output")
        if abs(sum(scores) - 1) > 0.001:
            raise AnalysisError("invalid_model_output")
        ordered = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        index = ordered[0]
        clear = scores[index] >= threshold and scores[index] - scores[ordered[1]] >= margin
        row["finding"] = labels[index] if clear and labels[index] != "unknown" else "uncertain"
        if row["finding"] != "uncertain":
            accepted.append(row["finding"])
    if not windows:
        return "uncertain"
    if kind == "heart":
        if "present" in accepted:
            return "present"
        return "absent" if len(accepted) == len(windows) else "uncertain"
    crackle = any(v in ("crackle", "both") for v in accepted)
    wheeze = any(v in ("wheeze", "both") for v in accepted)
    if crackle and wheeze:
        return "both"
    if crackle:
        return "crackle"
    if wheeze:
        return "wheeze"
    return "neither" if len(accepted) == len(windows) else "uncertain"


class AnalysisEngine:
    """Model files are authenticated locally; no runtime downloads/remote code."""
    def __init__(self, directory):
        import torch
        torch.set_num_threads(2)
        self.root = Path(directory).resolve(strict=True)
        self.manifest = json.loads((self.root / "manifest.json").read_text())
        if self.manifest.get("version") != ANALYSIS_VERSION:
            raise AnalysisError("analysis_manifest_invalid")
        self.loaded = {}
        self.errors = {}
        for kind in LABELS:
            try:
                self.loaded[kind] = self._load(kind)
            except Exception:
                # Stable code only; do not disclose filesystem or library messages.
                self.errors[kind] = "model_unavailable"

    def _load(self, kind):
        import torch
        from transformers import (ASTConfig, ASTFeatureExtractor, ASTModel,
                                  Wav2Vec2Config, Wav2Vec2FeatureExtractor,
                                  Wav2Vec2ForSequenceClassification)
        config = self.manifest["models"][kind]
        folder = self.root / kind
        for name, digest in config["files"].items():
            checked_file(folder, name, digest)
        if kind == "heart":
            model = Wav2Vec2ForSequenceClassification.from_pretrained(
                folder, local_files_only=True, use_safetensors=True,
                config=Wav2Vec2Config.from_pretrained(folder, local_files_only=True))
            actual = tuple(model.config.id2label[i].lower() for i in range(3))
            if actual != LABELS[kind]:
                raise AnalysisError("model_labels_mismatch")
            processor = Wav2Vec2FeatureExtractor.from_pretrained(folder, local_files_only=True)
        else:
            class RespiratoryAST(torch.nn.Module):
                def __init__(self):
                    super().__init__()
                    self.ast = ASTModel(ASTConfig.from_pretrained(folder, local_files_only=True))
                    self.classifier = torch.nn.Sequential(torch.nn.Dropout(0.3), torch.nn.Linear(768, 4))

                def forward(self, input_values):
                    return self.classifier(self.ast(input_values).last_hidden_state.mean(dim=1))
            model = RespiratoryAST()
            weights = torch.load(folder / "best_sota_model.pth", map_location="cpu", weights_only=True, mmap=True)
            model.load_state_dict(weights, strict=True)
            processor = ASTFeatureExtractor.from_pretrained(folder, local_files_only=True)
        model.eval()
        for parameter in model.parameters():
            parameter.requires_grad_(False)
        return model, processor

    def predict(self, kind, samples, sample_rate):
        import numpy as np
        import torch
        from scipy.signal import resample_poly
        signal = np.asarray(samples, dtype=np.float32)
        if signal.ndim != 1 or not 0 < len(signal) <= sample_rate * 120 or not np.isfinite(signal).all():
            raise AnalysisError("invalid_analysis_audio")
        if len(signal) < sample_rate or float(np.sqrt(np.mean(signal.astype(np.float64) ** 2))) < 1e-7:
            return []
        divisor = math.gcd(sample_rate, 16000)
        signal = resample_poly(signal, 16000 // divisor, sample_rate // divisor).astype(np.float32)
        model, processor = self.loaded[kind]
        windows = []
        for start in range(0, len(signal), 128000):
            chunk = signal[start:start + 128000]
            if len(chunk) < 16000:
                break
            # Reproduce the respiratory model's documented cyclic padding only.
            source_length = len(chunk)
            if kind == "lung" and source_length < 128000:
                chunk = np.tile(chunk, math.ceil(128000 / source_length))[:128000]
            inputs = processor(chunk, sampling_rate=16000, return_tensors="pt")
            with torch.inference_mode():
                output = model(**inputs) if kind == "heart" else model(inputs["input_values"])
                logits = output.logits if kind == "heart" else output
                scores = torch.softmax(logits[0], dim=-1).tolist()
            windows.append({"start_seconds": round(start / 16000, 4),
                            "end_seconds": round((start + source_length) / 16000, 4),
                            "scores": [round(v, 7) for v in scores]})
        return windows

    def analyze(self, original, separated, sample_rate, source_hashes):
        started = time.perf_counter()
        report = {"version": ANALYSIS_VERSION, "run_id": uuid4().hex,
                  "created_at": int(time.time()), "status": "complete", "components": {},
                  "source_sha256": source_hashes, "sample_rate_hz": sample_rate,
                  "duration_seconds": round(len(original) / sample_rate, 4),
                  "score_type": "uncalibrated_model_score", "disease_prediction": None}
        for index, kind in enumerate(LABELS):
            entry = self.manifest["models"][kind]
            component = {"model_id": entry["id"], "revision": entry["revision"],
                         "weights_sha256": entry["weights_sha256"],
                         "labels": list(LABELS[kind]), "status": "complete",
                         "validation": entry["validation"], "finding": "uncertain"}
            try:
                if kind not in self.loaded:
                    raise AnalysisError("model_unavailable")
                windows = self.predict(kind, separated[index], sample_rate)
                raw_windows = self.predict(kind, original, sample_rate)
                finding = interpret_windows(kind, windows)
                raw_finding = interpret_windows(kind, raw_windows)
                component.update({"windows": windows, "original_windows": raw_windows,
                                  "separated_finding": finding, "original_finding": raw_finding,
                                  "track_agreement": finding == raw_finding,
                                  "finding": finding if finding == raw_finding else "uncertain"})
                if not windows:
                    component["status"] = "insufficient_evidence"
            except Exception:
                component.update({"status": "unavailable", "error_code": "component_analysis_failed"})
                report["status"] = "partial"
            report["components"][kind] = component
        if all(v["status"] == "unavailable" for v in report["components"].values()):
            report["status"] = "unavailable"
        report.update({"completed_at": int(time.time()), "runtime_seconds": round(time.perf_counter() - started, 4)})
        return report
