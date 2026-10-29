"""Matte a native leg study and make a separate, unapproved full-deer preview."""

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter


def matte(rgb, key, hoof_mask=None):
    """Recover keyed edge coverage using nearby opaque colour; no shape warp."""
    rgb = rgb.astype(np.float32)
    distance = np.linalg.norm(rgb - key, axis=2)
    dark_hoof = rgb.max(2) < 35
    chroma_coverage = np.clip((rgb[..., 0] - rgb[..., 1] + 18) / 26, 0, 1)
    chroma_coverage[dark_hoof] = 1
    solid = (distance >= 45) & (chroma_coverage >= 0.99)
    _, labels = cv2.distanceTransformWithLabels(
        (~solid).astype(np.uint8),
        cv2.DIST_L2,
        5,
        labelType=cv2.DIST_LABEL_PIXEL,
    )
    foreground = rgb[solid]
    nearest = foreground[np.maximum(labels - 1, 0)]
    direction = nearest - key
    alpha = np.clip(
        ((rgb - key) * direction).sum(2) / np.maximum((direction**2).sum(2), 1),
        0,
        1,
    )
    alpha[distance < 8] = 0
    alpha[solid] = 1
    alpha = np.minimum(alpha, chroma_coverage)
    if hoof_mask is not None:
        # Segmentation protects the solid hoof's neutral/green reflections.
        # Erosion keeps this coverage correction inside its existing silhouette.
        interior = cv2.erode(hoof_mask, np.ones((3, 3), np.uint8)) > 0
        alpha[interior] = 1
    straight = np.clip(
        (rgb - (1 - alpha[..., None]) * key) / np.maximum(alpha[..., None], 1e-4),
        0,
        255,
    )
    return straight, alpha


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--original", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--hoof-coverage", type=Path)
    args = parser.parse_args()
    source, out = args.source.resolve(), args.out.resolve()
    if out.exists():
        raise RuntimeError("Refusing to overwrite a study")
    files = sorted((source / "frames").glob("frame-*.png"))
    if len(files) != 97:
        raise RuntimeError("This registered study requires 97 native positions")
    original = np.array(Image.open(args.original).convert("RGBA"))
    if original.shape != (1536, 1024, 4):
        raise RuntimeError("Approved original dimensions changed")
    box = [224, 832, 544, 1312]
    x0, y0, x1, y1 = box
    crop = original[y0:y1, x0:x1]
    old_alpha = crop[..., 3].astype(np.float32) / 255
    old_premul = crop[..., :3].astype(np.float32) * old_alpha[..., None]
    roi = (
        np.array(
            Image.open(source / "leg-mask.png")
            .convert("L")
            .filter(ImageFilter.GaussianBlur(2))
        ).astype(np.float32)
        / 255
    )
    key = np.array([41, 71, 59], dtype=np.float32)
    out.mkdir(parents=True)
    for name in ["frames", "patches", "provenance", "inspection"]:
        (out / name).mkdir()
    shutil.copy2(__file__, out / "provenance/prepare_motion_review.py")
    shutil.copy2(source / "receipt.json", out / "provenance/source-receipt.json")
    shutil.copy2(source / "leg-mask.png", out / "leg-mask.png")
    if args.hoof_coverage:
        shutil.copytree(args.hoof_coverage, out / "provenance/hoof-coverage")
    reference = np.round(old_premul + (1 - old_alpha[..., None]) * key).astype(np.uint8)
    Image.fromarray(reference).save(out / "reference.png")
    rest_start, rest_end = 81, 97
    protected_exact, last_exact = True, False
    for number, path in enumerate(files, start=1):
        hoof_mask = None
        if args.hoof_coverage:
            hoof_mask = np.asarray(
                Image.open(args.hoof_coverage / "masks" / path.name).convert("L")
            )
        rgb, alpha = matte(np.array(Image.open(path).convert("RGB")), key, hoof_mask)
        new_alpha = alpha * roi
        alpha = new_alpha + old_alpha * (1 - roi)
        # Use original pixels outside the generated ROI, including original glow.
        premul = rgb * new_alpha[..., None] + old_premul * (1 - roi[..., None])
        t = np.clip((number - rest_start) / (rest_end - rest_start), 0, 1)
        mix = t * t * (3 - 2 * t)
        # Stationary-rest appearance handoff only; active limb motion is not blended.
        premul = premul * (1 - mix) + old_premul * mix
        alpha = alpha * (1 - mix) + old_alpha * mix
        straight = np.clip(premul / np.maximum(alpha[..., None], 1e-4), 0, 255)
        patch = np.dstack((straight, alpha * 255)).round().astype(np.uint8)
        patch[roi == 0] = crop[roi == 0]
        if number == rest_end:
            patch = crop.copy()
            last_exact = np.array_equal(patch, crop)
        protected_exact &= np.array_equal(patch[roi == 0], crop[roi == 0])
        Image.fromarray(patch).save(
            out / "patches" / f"frame-{number:03}.webp", lossless=True
        )
        covered = patch[..., 3:4].astype(np.float32) / 255
        keyed = (
            (patch[..., :3] * covered + key * (1 - covered)).round().astype(np.uint8)
        )
        Image.fromarray(keyed).save(out / "frames" / f"frame-{number:03}.png")
        if number in [1, 29, 32, 35, 36, 65, 81, 89, 95, 96, 97]:
            full = original.copy()
            full[y0:y1, x0:x1] = patch
            Image.fromarray(full).save(out / "inspection" / f"deer-{number:03}.png")
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
    receipt = {
        "status": "GENERATED_MATTED_REVIEW_ONLY",
        "motion_accepted": False,
        "decoded_frames": 97,
        "fps": 24,
        "width": 320,
        "height": 480,
        "native_crop": box,
        "source": str(source),
        "source_generated_positions": 49,
        "neural_inbetweens": 48,
        "distinct_anatomical_poses_not_inferred_from_file_count": True,
        "motion": "far foreleg lowering; reverse playback is a disclosed lifting study",
        "running_or_full_body_motion": False,
        "matte": "known flat key, nearby foreground edge estimation; no shape warp",
        "hoof_coverage": str(args.hoof_coverage) if args.hoof_coverage else None,
        "stationary_rest_appearance_blend": [rest_start, rest_end],
        "original_rgba_preserved_outside_roi": bool(protected_exact),
        "last_patch_exact_approved_rgba": bool(last_exact),
        "original_sha256": hashlib.sha256(args.original.read_bytes()).hexdigest(),
        "video_sha256": hashlib.sha256(
            (out / "candidate.mp4").read_bytes()
        ).hexdigest(),
        "runtime_activated": False,
        "patch_bytes": sum(
            path.stat().st_size for path in (out / "patches").glob("*.webp")
        ),
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
