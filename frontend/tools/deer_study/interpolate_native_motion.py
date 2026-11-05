"""Local RIFE in-between study; never installs or approves runtime artwork."""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

os.environ.setdefault("MIOPEN_FIND_MODE", "FAST")

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageFilter


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument(
        "--pairs", type=int, nargs="*", help="One-based probe pairs only"
    )
    args = parser.parse_args()
    source, out = args.source.resolve(), args.out.resolve()
    if out.exists():
        raise RuntimeError("Refusing to overwrite a previous study")
    files = sorted((source / "frames").glob("frame-*.png"))
    receipt = json.loads((source / "receipt.json").read_text(encoding="utf-8"))
    if len(files) != receipt["decoded_frames"] or receipt["fps"] != 24:
        raise RuntimeError("Complete 24 fps source sequence required")
    model_root = args.lab.resolve() / "models/rife425-official"
    provenance = json.loads(
        (args.lab / "rife425-provenance.json").read_text(encoding="utf-8")
    )
    for entry in provenance["files"]:
        path = model_root / entry["file"]
        if path.suffix in {".py", ".pkl"} and sha(path) != entry["sha256"]:
            raise RuntimeError(f"RIFE provenance mismatch: {path}")
    sys.path.insert(0, str(model_root))
    from train_log.IFNet_HDv3 import IFNet

    torch.set_num_threads(4)
    torch.backends.cudnn.enabled = False
    device = "cuda" if torch.cuda.is_available() else "cpu"
    weights = torch.load(
        model_root / "train_log/flownet.pkl", map_location="cpu", weights_only=True
    )
    weights = {key.removeprefix("module."): value for key, value in weights.items()}
    model = IFNet()
    expected = set(model.state_dict())
    training_only = set(weights) - expected
    if any(not key.startswith(("teacher.", "caltime.")) for key in training_only):
        raise RuntimeError("Unexpected non-training checkpoint parameters")
    weights = {key: value for key, value in weights.items() if key in expected}
    model.load_state_dict(weights, strict=True)
    model.eval().to(device)
    del weights
    reference = np.asarray(Image.open(source / "reference.png").convert("RGB"))
    # Match the source compositor's two-pixel feather, including its support.
    mask = (
        np.asarray(
            Image.open(source / "leg-mask.png")
            .convert("L")
            .filter(ImageFilter.GaussianBlur(2))
        )
        > 0
    )
    height, width = reference.shape[:2]
    if mask.shape != (height, width):
        raise RuntimeError("Native mask dimensions differ")
    pairs = args.pairs or list(range(1, len(files)))
    if any(pair < 1 or pair >= len(files) for pair in pairs):
        raise RuntimeError("Pair outside source timeline")
    out.mkdir(parents=True)
    (out / "frames").mkdir()
    shutil.copy2(source / "reference.png", out / "reference.png")
    shutil.copy2(source / "leg-mask.png", out / "leg-mask.png")
    (out / "provenance").mkdir()
    shutil.copy2(__file__, out / "provenance/interpolate_native_motion.py")
    shutil.copy2(args.lab / "rife425-provenance.json", out / "provenance/rife.json")
    report = {
        "status": "INTERPOLATING_UNAPPROVED_STUDY",
        "motion_accepted": False,
        "source_directory": str(source),
        "source_video_sha256": receipt["video_sha256"],
        "source_frames": len(files),
        "source_fps": 24,
        "model": "Practical-RIFE 4.25",
        "checkpoint_sha256": sha(model_root / "train_log/flownet.pkl"),
        "source_revision": provenance["source_revision"],
        "fps": 24,
        "width": width,
        "height": height,
        "resize": False,
        "interpolation_timestep": 0.5,
        "inbetween_method": "learned optical-flow synthesis, not anatomy certification",
        "device": device,
        "excluded_training_only_parameters": sorted(training_only),
        "pairs": [],
    }
    started = time.monotonic()

    def tensor(array):
        value = torch.from_numpy(array.copy()).permute(2, 0, 1).unsqueeze(0)
        value = value.to(device=device, dtype=torch.float32) / 255.0
        return F.pad(value, (0, (-width) % 64, 0, (-height) % 64), mode="replicate")

    with torch.inference_mode():
        for pair in pairs:
            a = np.asarray(Image.open(files[pair - 1]).convert("RGB"))
            b = np.asarray(Image.open(files[pair]).convert("RGB"))
            if a.shape != reference.shape or b.shape != reference.shape:
                raise RuntimeError("Source registration dimensions changed")
            _, _, merged = model(
                torch.cat((tensor(a), tensor(b)), 1),
                timestep=0.5,
                scale_list=[16, 8, 4, 2, 1],
            )
            midpoint = (
                merged[-1][0, :, :height, :width]
                .permute(1, 2, 0)
                .clamp(0, 1)
                .mul(255)
                .round()
                .to(torch.uint8)
                .cpu()
                .numpy()
            )
            midpoint[~mask] = reference[~mask]
            if not np.isfinite(midpoint).all():
                raise RuntimeError("Non-finite synthesized image")
            filename = f"frame-{2 * pair:03}.png"
            Image.fromarray(midpoint).save(out / "frames" / filename)
            report["pairs"].append(
                {
                    "from": pair,
                    "to": pair + 1,
                    "output": filename,
                    "sha256": sha(out / "frames" / filename),
                }
            )
            print(f"MIDPOINT {pair}->{pair + 1}", flush=True)
    report["neural_inbetween_frames"] = len(pairs)
    if args.pairs:
        report["status"] = "GENERATED_PROBE_AWAITING_NATIVE_REVIEW"
    else:
        for index, path in enumerate(files):
            shutil.copy2(path, out / "frames" / f"frame-{2 * index + 1:03}.png")
        report["decoded_frames"] = 2 * len(files) - 1
        report["source_images_preserved_byte_exact"] = True
        report["outside_mask_exact_original"] = all(
            np.array_equal(
                np.asarray(Image.open(path).convert("RGB"))[~mask], reference[~mask]
            )
            for path in (out / "frames").glob("frame-*.png")
        )
        if not report["outside_mask_exact_original"]:
            raise RuntimeError("Protected pixels changed")
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-framerate",
                "24",
                "-i",
                str(out / "frames/frame-%03d.png"),
                "-c:v",
                "libx264",
                "-crf",
                "16",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(out / "candidate.mp4"),
            ],
            check=True,
        )
        report["video_sha256"] = sha(out / "candidate.mp4")
        report["status"] = "GENERATED_INTERPOLATED_AWAITING_NATIVE_REVIEW"
    report["elapsed_seconds"] = time.monotonic() - started
    (out / "receipt.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(
        json.dumps({key: value for key, value in report.items() if key != "pairs"}),
        flush=True,
    )


if __name__ == "__main__":
    main()
