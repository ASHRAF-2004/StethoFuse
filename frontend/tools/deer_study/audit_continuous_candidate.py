"""Native-frame inspection aids. No metric in this file accepts character motion."""

import argparse
import hashlib
import json
import statistics
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument("run", type=Path)
parser.add_argument(
    "--mask", type=Path, help="Inspect movement inside this registered mask."
)
parser.add_argument(
    "--native-leg-crop",
    action="store_true",
    help="Frames contain the leg crop, not the full deer.",
)
args = parser.parse_args()
run = args.run.resolve()
frames = sorted((run / "frames").glob("frame-*.png"))
if len(frames) < 2:
    raise RuntimeError("A decoded source sequence is required.")
out = run / "analysis"
out.mkdir(exist_ok=True)
first = cv2.imread(str(frames[0]))
height, width = first.shape[:2]
motion_mask = None
if args.mask:
    motion_mask = cv2.imread(str(args.mask.resolve()), cv2.IMREAD_GRAYSCALE)
    if motion_mask is None or motion_mask.shape != (height, width):
        raise RuntimeError("Motion mask must match the native frame canvas.")
    motion_mask = motion_mask > 0
    if not motion_mask.any():
        raise RuntimeError("Motion mask is empty.")
regions = {
    "leg": (0.17, 0.55, 0.52, 0.92),
    "face": (0.15, 0.23, 0.53, 0.41),
    "antlers": (0.02, 0.02, 0.83, 0.26),
    "ground": (0.04, 0.87, 0.96, 1),
}
if args.native_leg_crop:
    regions = {
        "leg": (0, 0, 1, 1),
        "supporting_foreleg": (0.65, 0.25, 0.95, 0.98),
        "ground": (0, 0.93, 1, 1),
    }


def crop(array, region):
    x0, y0, x1, y1 = regions[region]
    return array[
        round(y0 * height) : round(y1 * height), round(x0 * width) : round(x1 * width)
    ]


adjacent = []
previous = first
for index, path in enumerate(frames[1:], start=1):
    current = cv2.imread(str(path))
    if current.shape != first.shape:
        raise RuntimeError(f"Frame registration canvas changes at {index + 1}.")
    difference = cv2.absdiff(current, previous)
    row = {"from": index, "to": index + 1, "whole_rgb_mae": float(difference.mean())}
    for name in regions:
        patch = crop(difference, name)
        row[name + "_rgb_mae"] = float(patch.mean())
        row[name + "_changed_fraction_gt24"] = float((patch.max(axis=2) > 24).mean())
    if motion_mask is not None:
        patch = difference[motion_mask]
        row["masked_rgb_mae"] = float(patch.mean())
        row["masked_changed_fraction_gt24"] = float((patch.max(axis=1) > 24).mean())
    adjacent.append(row)
    previous = current

median = statistics.median(row["leg_rgb_mae"] for row in adjacent)
mad = statistics.median(abs(row["leg_rgb_mae"] - median) for row in adjacent)
threshold = max(12, median + 6 * mad)
flags = [row for row in adjacent if row["leg_rgb_mae"] > threshold]
masked_stats = None
if motion_mask is not None:
    masked_median = statistics.median(row["masked_rgb_mae"] for row in adjacent)
    masked_mad = statistics.median(
        abs(row["masked_rgb_mae"] - masked_median) for row in adjacent
    )
    masked_threshold = max(6, masked_median + 6 * masked_mad)
    masked_stats = {
        "source": str(args.mask.resolve()),
        "pixels": int(motion_mask.sum()),
        "median_rgb_mae": masked_median,
        "mad": masked_mad,
        "inspection_alert_threshold": masked_threshold,
        "alerts": [row for row in adjacent if row["masked_rgb_mae"] > masked_threshold],
        "largest_changes": sorted(
            adjacent, key=lambda row: row["masked_rgb_mae"], reverse=True
        )[:10],
    }
probe = json.loads(
    subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(run / "candidate.mp4"),
        ]
    )
)
stream = next(s for s in probe["streams"] if s["codec_type"] == "video")
report = {
    "status": "AWAITING_NATIVE_VISUAL_INSPECTION",
    "accepted": False,
    "warning": "Pixel differences flag inspection targets; they cannot validate anatomy or continuity.",
    "source_frame_count": len(frames),
    "unique_file_hashes": len(
        {hashlib.sha256(p.read_bytes()).hexdigest() for p in frames}
    ),
    "unique_hashes_are_not_pose_count": True,
    "native_dimensions": [width, height],
    "framing": "native foreleg crop" if args.native_leg_crop else "full character",
    "video_fps": stream["avg_frame_rate"],
    "video_duration": probe["format"]["duration"],
    "leg_median_rgb_mae": median,
    "leg_mad": mad,
    "inspection_alert_threshold": threshold,
    "alerts": flags,
    "largest_leg_changes": sorted(
        adjacent, key=lambda row: row["leg_rgb_mae"], reverse=True
    )[:10],
    "adjacent_pairs": adjacent,
    "masked_motion": masked_stats,
}
(out / "adjacent-report.json").write_bytes(
    (json.dumps(report, indent=2) + "\n").encode()
)

for kind in ["leg"] if args.native_leg_crop else ["full", "leg"]:
    cell = Image.open(frames[0])
    if kind == "leg":
        x0, y0, x1, y1 = regions[kind]
        box = (
            round(x0 * width),
            round(y0 * height),
            round(x1 * width),
            round(y1 * height),
        )
        cell = cell.crop(box)
    cell_width, cell_height = cell.size
    columns = 4 if kind == "full" or args.native_leg_crop else 8
    page_count = columns * 3
    for page, start in enumerate(range(0, len(frames), page_count)):
        sheet = Image.new(
            "RGB", (columns * cell_width, 3 * (cell_height + 28)), "#102c24"
        )
        draw = ImageDraw.Draw(sheet)
        for offset, path in enumerate(frames[start : start + page_count]):
            image = Image.open(path).convert("RGB")
            if kind == "leg":
                image = image.crop(box)
            x = (offset % columns) * cell_width
            y = (offset // columns) * (cell_height + 28)
            sheet.paste(image, (x, y + 28))
            draw.text((x + 8, y + 6), f"{start + offset + 1:03d}", fill="#fff1ce")
        sheet.save(out / f"native-{kind}-{page:02d}.jpg", quality=96)
print(
    json.dumps(
        {
            "status": report["status"],
            "accepted": False,
            "source_frame_count": len(frames),
            "native_dimensions": [width, height],
            "video_fps": stream["avg_frame_rate"],
            "alerts": [(row["from"], row["to"]) for row in flags],
            "masked_alerts": [
                (row["from"], row["to"]) for row in masked_stats["alerts"]
            ]
            if masked_stats
            else None,
            "full_report": str(out / "adjacent-report.json"),
        }
    )
)
