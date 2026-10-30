"""Build a bounded idle from an inspected range; preserve source and disclose timing."""

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from mobile_sam import SamPredictor, sam_model_registry
from PIL import Image


def matting(rgb, original_core):
    image = rgb.astype(np.float32)
    height, width = image.shape[:2]
    left = cv2.GaussianBlur(np.median(image[:, :6], axis=1), (1, 31), 0)
    right = cv2.GaussianBlur(np.median(image[:, -6:], axis=1), (1, 31), 0)
    blend = np.linspace(0, 1, width)[None, :, None]
    key = left[:, None] * (1 - blend) + right[:, None] * blend
    distance = np.linalg.norm(image - key, axis=2)
    solid = distance > 90
    solid[: int(height * 0.26)] = distance[: int(height * 0.26)] > 150
    solid |= original_core & (distance > 12)
    _, labels = cv2.distanceTransformWithLabels(
        (~solid).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL
    )
    nearest = image[solid][np.maximum(labels - 1, 0)]
    direction = nearest - key
    a = np.clip(
        ((image - key) * direction).sum(2)
        / np.maximum((direction * direction).sum(2), 1),
        0,
        1,
    )
    a[distance < 7] = 0
    a[solid] = 1
    foreground = np.clip(
        (image - key * (1 - a[..., None])) / np.maximum(a[..., None], 1e-4), 0, 255
    )
    # Colour bleed prevents dark/green YUV fringes around a transparent silhouette.
    foreground[a < 0.02] = nearest[a < 0.02]
    return np.dstack((foreground, a * 255)).round().astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--lab", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--first", type=int, default=1)
    parser.add_argument("--last", type=int, default=25)
    parser.add_argument("--original", type=Path, required=True)
    args = parser.parse_args()
    if args.out.exists():
        raise RuntimeError("Use a new output directory")
    source = sorted((args.source / "frames").glob("frame-*.png"))
    chosen = source[args.first - 1 : args.last]
    if len(chosen) != args.last - args.first + 1:
        raise RuntimeError("Source selection missing")
    root = args.lab / "models/rife425-official"
    sys.path.insert(0, str(root))
    from train_log.IFNet_HDv3 import IFNet

    torch.set_num_threads(3)
    torch.backends.cudnn.enabled = False
    model = IFNet()
    weights = torch.load(
        root / "train_log/flownet.pkl", map_location="cpu", weights_only=True
    )
    weights = {k.removeprefix("module."): v for k, v in weights.items()}
    expected = model.state_dict()
    model.load_state_dict(
        {k: v for k, v in weights.items() if k in expected}, strict=True
    )
    model.eval().to("cuda")
    del weights
    sam = sam_model_registry['vit_t'](checkpoint=None)
    sam.load_state_dict(torch.load(args.lab / 'MobileSAM/weights/mobile_sam.pt', map_location='cpu', weights_only=True), strict=True)
    predictor = SamPredictor(sam.eval().to('cuda'))
    height, width = np.array(Image.open(chosen[0])).shape[:2]
    original_alpha = np.array(
        Image.open(args.original)
        .convert("RGBA")
        .resize((width, height), Image.Resampling.LANCZOS)
    )[..., 3]
    original_core = (
        cv2.erode((original_alpha > 250).astype(np.uint8), np.ones((9, 9), np.uint8))
        > 0
    )
    original_core[: int(height * 0.45)] = False
    target_height = width * 3 // 2
    if target_height < height or (target_height - height) % 2:
        raise RuntimeError("Only symmetric native padding is permitted")
    top = (target_height - height) // 2
    args.out.mkdir(parents=True)
    for name in ["forward", "raw", "coverage", "packed", "inspection"]:
        (args.out / name).mkdir()
    shutil.copy2(__file__, args.out / "prepare-source.py")
    mapping, cache = [], {}

    def tensor(number):
        if number not in cache:
            array = np.array(Image.open(chosen[number]).convert("RGB"))
            t = (
                torch.from_numpy(array)
                .permute(2, 0, 1)
                .unsqueeze(0)
                .to("cuda", torch.float32)
                / 255
            )
            cache[number] = F.pad(
                t, (0, (-width) % 64, 0, (-height) % 64), mode="replicate"
            )
        while len(cache) > 4:
            del cache[next(iter(cache))]
        return cache[number]

    with torch.inference_mode():
        for i in range(49):
            position = (len(chosen) - 1) * (0.5 - 0.5 * math.cos(math.pi * i / 48))
            left = min(int(position), len(chosen) - 1)
            right = min(left + 1, len(chosen) - 1)
            fraction = position - left
            if fraction < 1e-7 or left == right:
                rgb = np.array(Image.open(chosen[left]).convert("RGB"))
            else:
                _, _, merged = model(
                    torch.cat((tensor(left), tensor(right)), 1),
                    timestep=fraction,
                    scale_list=[16, 8, 4, 2, 1],
                )
                rgb = (
                    merged[-1][0, :, :height, :width]
                    .permute(1, 2, 0)
                    .clamp(0, 1)
                    .mul(255)
                    .round()
                    .to(torch.uint8)
                    .cpu()
                    .numpy()
                )
            Image.fromarray(rgb).save(args.out / 'raw' / f'frame-{i+1:03}.png')
            predictor.set_image(rgb)
            body, scores, _ = predictor.predict(
                point_coords=np.array([[.34*width,.36*height],[.56*width,.54*height],[.46*width,.82*height],[.86*width,.82*height],[.58*width,.75*height],[.03*width,.5*height]]),
                point_labels=np.array([1,1,1,1,0,0]),
                box=np.array([.1*width,.23*height,.94*width,.88*height]),multimask_output=True)
            ground, ground_scores, _ = predictor.predict(
                point_coords=np.array([[.5*width,.9*height],[.17*width,.85*height],[.84*width,.9*height],[.01*width,.75*height],[.99*width,.75*height]]),
                point_labels=np.array([1,1,1,0,0]),
                box=np.array([.01*width,.73*height,.99*width,.99*height]),multimask_output=True)
            coverage = body[int(np.argmax(scores))] | ground[int(np.argmax(ground_scores))]
            coverage[:int(height*.29)]=False
            coverage = cv2.erode(coverage.astype(np.uint8), np.ones((3,3),np.uint8)) > 0
            Image.fromarray(coverage.astype(np.uint8)*255).save(args.out / 'coverage' / f'frame-{i+1:03}.png')
            rgba = matting(rgb, coverage)
            padded = np.zeros((target_height, width, 4), np.uint8)
            padded[top : top + height] = rgba
            Image.fromarray(padded).save(args.out / "forward" / f"frame-{i + 1:03}.png")
            mapping.append(
                {
                    "pose": i + 1,
                    "source_position": args.first + position,
                    "fraction": fraction,
                }
            )
    sequence = list(range(1, 50)) + list(range(48, 0, -1))
    for i, pose in enumerate(sequence, start=1):
        rgba = np.array(Image.open(args.out / "forward" / f"frame-{pose:03}.png"))
        packed = np.concatenate(
            (rgba[..., :3], np.repeat(rgba[..., 3:4], 3, axis=2)), axis=1
        )
        Image.fromarray(packed).save(args.out / "packed" / f"frame-{i:03}.png")
    Image.open(args.out / "forward/frame-001.png").save(
        args.out / "poster.webp", quality=95, method=6
    )
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-framerate",
            "24",
            "-i",
            str(args.out / "packed/frame-%03d.png"),
            "-c:v",
            "libx264",
            "-crf",
            "17",
            "-preset",
            "slow",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            str(args.out / "idle-packed.mp4"),
        ],
        check=True,
    )
    report = {
        "status": "CANDIDATE_REQUIRES_VISUAL_REVIEW",
        "owner_approved": False,
        "source": str(args.source),
        "source_native_fps": 16,
        "source_selection": [args.first, args.last],
        "source_positions_selected": len(chosen),
        "evaluated_forward_poses": 49,
        "timeline_positions": 97,
        "presentation_fps": 24,
        "reverse_return_disclosed": True,
        "motion_curve": "cosine-eased neural in-betweens; zero velocity at each reversal",
        "native_dimensions": [width, height],
        "padded_dimensions": [width, target_height],
        "padding_top_bottom": top,
        "image_resize_or_anatomical_mesh": False,
        "packing": "RGB left, alpha right in the same H264 frame",
        "loop_start_end_identical": True,
        "mapping": mapping,
        "video_sha256": hashlib.sha256(
            (args.out / "idle-packed.mp4").read_bytes()
        ).hexdigest(),
        "video_bytes": (args.out / "idle-packed.mp4").stat().st_size,
    }
    (args.out / "manifest.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in report.items() if k != "mapping"}), flush=True)


if __name__ == "__main__":
    main()
