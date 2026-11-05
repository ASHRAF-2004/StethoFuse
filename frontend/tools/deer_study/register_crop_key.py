"""Register a generated key on static context with one global similarity matrix.

No local anatomy warp. Registration is a measurement, never an art-quality pass.
"""

import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("--reference", type=Path, required=True)
parser.add_argument("--mask", type=Path, required=True)
parser.add_argument("--key", type=Path, required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args()
base = np.array(Image.open(args.reference).convert("RGB"))
height, width = base.shape[:2]
key = np.array(
    Image.open(args.key)
    .convert("RGB")
    .resize((width, height), Image.Resampling.LANCZOS)
)
mask = np.array(Image.open(args.mask).convert("L"))
if mask.shape != (height, width):
    raise ValueError("Reference and movement-mask dimensions differ.")
static = (mask == 0).astype("uint8") * 255
sift = cv2.SIFT_create()
points_a, descriptors_a = sift.detectAndCompute(
    cv2.cvtColor(key, cv2.COLOR_RGB2GRAY), static
)
points_b, descriptors_b = sift.detectAndCompute(
    cv2.cvtColor(base, cv2.COLOR_RGB2GRAY), static
)
if descriptors_a is None or descriptors_b is None:
    raise ValueError("Insufficient static-context features.")
pairs = cv2.BFMatcher().knnMatch(descriptors_a, descriptors_b, k=2)
good = [a for a, b in pairs if a.distance < 0.7 * b.distance]
if len(good) < 30:
    raise ValueError("Insufficient static-context matches.")
a = np.float32([points_a[m.queryIdx].pt for m in good])
b = np.float32([points_b[m.trainIdx].pt for m in good])
matrix, inliers = cv2.estimateAffinePartial2D(
    a, b, method=cv2.RANSAC, ransacReprojThreshold=2
)
if matrix is None or inliers is None:
    raise ValueError("No reliable similarity registration.")
scale = float(np.hypot(matrix[0, 0], matrix[0, 1]))
rotation = float(np.degrees(np.arctan2(matrix[1, 0], matrix[0, 0])))
if int(inliers.sum()) < 25 or not 0.97 < scale < 1.03 or abs(rotation) >= 1:
    raise ValueError("Key geometry differs too much; reject instead of deforming it.")
args.out.mkdir(parents=True, exist_ok=False)
registered = cv2.warpAffine(
    key,
    matrix,
    (width, height),
    flags=cv2.INTER_LANCZOS4,
    borderMode=cv2.BORDER_REFLECT101,
)
Image.fromarray(registered).save(args.out / "registered.png")
proof = {
    "method": "uniform resize and one whole-crop similarity matrix; no local anatomical deformation",
    "inputs": {
        name: {
            "path": str(path.resolve()),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        for name, path in [
            ("reference", args.reference),
            ("mask", args.mask),
            ("key", args.key),
        ]
    },
    "native_canvas": [width, height],
    "matches": len(good),
    "inliers": int(inliers.sum()),
    "matrix": matrix.tolist(),
    "scale": scale,
    "rotation_degrees": rotation,
    "art_quality_accepted": False,
}
(args.out / "registration.json").write_bytes(
    (json.dumps(proof, indent=2) + "\n").encode()
)
print(json.dumps(proof))
