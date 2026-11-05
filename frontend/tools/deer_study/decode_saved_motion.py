import os

os.environ["TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL"] = "1"
os.environ["MIOPEN_FIND_MODE"] = "FAST"
import argparse, json, time, hashlib, subprocess
from pathlib import Path
import torch
from PIL import Image
from safetensors.torch import load_file
from diffusers import AutoencoderKLWan
from diffusers.models.autoencoders.autoencoder_kl_wan import unpatchify
from diffusers.video_processor import VideoProcessor

ap = argparse.ArgumentParser()
ap.add_argument("--lab", type=Path, default=Path(__file__).resolve().parent)
ap.add_argument("--run", required=True)
ap.add_argument("--precision", choices=["bf16", "fp32"], default="bf16")
ap.add_argument("--tile", action="store_true")
ap.add_argument("--tag", default="fast")
args = ap.parse_args()
lab = args.lab.resolve()
project = lab.parents[1] / "Workspace/implementation"
parent = project / "frontend/evidence/deer-frame-study/local-i2v" / args.run
root = parent / (
    "decode-" + args.precision + ("-tiled" if args.tile else "-full") + "-" + args.tag
)
root.mkdir(exist_ok=False)
receipt = json.loads((parent / "receipt.json").read_text())
receipt.update(
    status="DECODER_PROBE",
    decoder_precision=args.precision,
    decoder_tiled=args.tile,
    motion_accepted=False,
)
start = time.time()


def progress(stage, **info):
    receipt.update(status=stage, decode_elapsed_seconds=time.time() - start, **info)
    (root / "receipt.json").write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
    print(
        json.dumps({"stage": stage, "seconds": round(time.time() - start, 1), **info}),
        flush=True,
    )


try:
    model = json.loads((lab / "download-state.json").read_text())
    dtype = torch.bfloat16 if args.precision == "bf16" else torch.float32
    progress("LOADING_DECODER")
    vae = (
        AutoencoderKLWan.from_pretrained(
            model["path"], subfolder="vae", torch_dtype=dtype, local_files_only=True
        )
        .to("cuda")
        .eval()
    )
    if args.tile:
        vae.enable_tiling()
    processor = VideoProcessor(vae_scale_factor=vae.config.scale_factor_spatial)
    chunks = [0]
    written = [0]
    partial = root / "frames"
    partial.mkdir()

    def observed_chunk(module, inputs, output):
        chunks[0] += 1
        if not args.tile:
            chunk = (
                unpatchify(output.detach(), patch_size=vae.config.patch_size)
                if vae.config.patch_size
                else output.detach()
            )
            for frame in processor.postprocess_video(
                chunk.clamp(-1, 1), output_type="pil"
            )[0]:
                written[0] += 1
                frame.save(partial / f"frame-{written[0]:03d}.png")
        progress("DECODING_CHUNKS", chunks=chunks[0], native_frames_written=written[0])

    vae.decoder.register_forward_hook(observed_chunk)
    lat = load_file(parent / "diffusion-latents.safetensors", device="cuda")[
        "latents"
    ].to(dtype)
    condition_source = parent / "condition-frame.png"
    if not condition_source.exists():
        condition_source = Path(receipt["source_reference"])
    image = (
        Image.open(condition_source)
        .convert("RGB")
        .resize((receipt["width"], receipt["height"]), Image.Resampling.LANCZOS)
    )
    im = (
        processor.preprocess(image, height=receipt["height"], width=receipt["width"])
        .to("cuda", dtype)
        .unsqueeze(2)
    )
    mean = torch.tensor(vae.config.latents_mean, device="cuda", dtype=dtype).view(
        1, -1, 1, 1, 1
    )
    std = torch.tensor(vae.config.latents_std, device="cuda", dtype=dtype).view(
        1, -1, 1, 1, 1
    )
    with torch.inference_mode():
        progress("ENCODING_START_CONDITION")
        condition = vae.encode(im, return_dict=False)[0].mode()
        lat[:, :, :1] = (condition - mean) / std
        progress("DECODING_SAVED_MOTION")
        video = vae.decode(lat * std + mean, return_dict=False)[0]
        if not bool(torch.isfinite(video).all()):
            raise RuntimeError("Nonfinite decoded pixels")
        frames = processor.postprocess_video(video, output_type="pil")[0]
    progress("EXPORTING", decoded_frames=len(frames))
    folder = root / "frames"
    folder.mkdir(exist_ok=True)
    for i, frame in enumerate(frames):
        frame.save(folder / f"frame-{i + 1:03d}.png")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-framerate",
            "24",
            "-i",
            str(folder / "frame-%03d.png"),
            "-c:v",
            "libx264",
            "-crf",
            "17",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(root / "candidate.mp4"),
        ],
        check=True,
    )
    progress(
        "GENERATED_AWAITING_NATIVE_FRAME_REVIEW",
        video_sha256=hashlib.sha256((root / "candidate.mp4").read_bytes()).hexdigest(),
    )
except Exception as exc:
    progress("FAILED_NO_ACTIVATION", error=repr(exc))
    raise
