"""Small local segmentation probe for hoof coverage, never motion synthesis."""

import argparse
import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path

import cv2
import numpy as np
import torch
from mobile_sam import SamPredictor, sam_model_registry
from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--frames", nargs="*", type=int)
    args = parser.parse_args()
    if args.out.exists():
        raise RuntimeError("Refusing to overwrite a segmentation study")
    torch.set_num_threads(3)
    torch.backends.cudnn.enabled = False
    files = sorted((args.source / "frames").glob("frame-*.png"))
    root = args.lab / "MobileSAM"
    checkpoint = root / "weights/mobile_sam.pt"
    model = sam_model_registry["vit_t"](checkpoint=None)
    model.load_state_dict(
        torch.load(checkpoint, map_location="cpu", weights_only=True), strict=True
    )
    model.eval().to("cuda")
    predictor = SamPredictor(model)
    selected = args.frames or list(range(1, len(files) + 1))
    args.out.mkdir(parents=True)
    (args.out / "masks").mkdir()
    (args.out / "provenance").mkdir()
    shutil.copy2(__file__, args.out / "provenance/segment_hoof_coverage.py")
    # Tracking changes mask prompts only, never source pixels or limb geometry.
    centers, center, previous = [], np.array([174.0, 272.0]), None
    for file in files:
        gray = cv2.cvtColor(cv2.imread(str(file)), cv2.COLOR_BGR2GRAY)
        if previous is not None:
            flow = cv2.calcOpticalFlowFarneback(
                previous, gray, None, 0.5, 4, 21, 4, 7, 1.5, 0
            )
            x, y = np.round(center).astype(int)
            center += np.median(
                flow[y - 8 : y + 9, x - 8 : x + 9].reshape(-1, 2), axis=0
            )
        centers.append(center.copy())
        previous = gray
    sheet = (
        Image.new("RGB", (320 * 4, 508 * ((len(selected) + 3) // 4)), "#d8edcb")
        if args.frames
        else None
    )
    rows, start = [], time.monotonic()
    with torch.inference_mode():
        for index, number in enumerate(selected):
            rgb = np.array(Image.open(files[number - 1]).convert("RGB"))
            x, y = centers[number - 1]
            box = np.array([x - 34, y - 38, x + 30, y + 42])
            predictor.set_image(rgb)
            masks, scores, _ = predictor.predict(
                point_coords=np.array([[x, y], [x, y - 10]]),
                point_labels=np.array([1, 1]),
                box=box,
                multimask_output=True,
            )
            chosen = int(np.argmax(scores))
            mask = masks[chosen].astype(np.uint8) * 255
            limit = np.zeros(mask.shape, np.uint8)
            cv2.rectangle(
                limit,
                tuple(box[:2].round().astype(int)),
                tuple(box[2:].round().astype(int)),
                255,
                -1,
            )
            mask &= limit
            Image.fromarray(mask).save(args.out / "masks" / f"frame-{number:03}.png")
            rows.append(
                {
                    "frame": number,
                    "center": [float(x), float(y)],
                    "box": box.tolist(),
                    "score": float(scores[chosen]),
                    "area": int((mask > 0).sum()),
                }
            )
            if sheet is not None:
                overlay = rgb.copy()
                overlay[mask > 0] = (
                    overlay[mask > 0] * 0.5 + np.array([240, 40, 180]) * 0.5
                ).astype(np.uint8)
                sx, sy = index % 4 * 320, index // 4 * 508
                sheet.paste(Image.fromarray(overlay), (sx, sy + 28))
                ImageDraw.Draw(sheet).text(
                    (sx + 8, sy + 8), str(number), fill="#123a2b"
                )
            print(f"SEGMENTED {number}", flush=True)
    if sheet is not None:
        sheet.save(args.out / "probe.png")
    revision = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()
    report = {
        "status": "MASK_STUDY_REQUIRES_VISUAL_INSPECTION",
        "model": "MobileSAM vit_t",
        "repository": "https://github.com/ChaoningZhang/MobileSAM",
        "revision": revision,
        "license": "Apache-2.0",
        "checkpoint_sha256": hashlib.sha256(checkpoint.read_bytes()).hexdigest(),
        "frames": rows,
        "elapsed_seconds": time.monotonic() - start,
        "gpu_peak_bytes": torch.cuda.max_memory_allocated(),
        "source_pixels_warped": False,
        "runtime_activated": False,
    }
    (args.out / "receipt.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in report.items() if k != "frames"}), flush=True)


if __name__ == "__main__":
    main()
