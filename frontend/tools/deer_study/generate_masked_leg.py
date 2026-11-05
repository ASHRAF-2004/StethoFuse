"""Native-crop VACE motion research. No website activation or release actions.

Only the moving foreleg is generated. Known rest/toe-off/raised keys constrain
actual in-between generation. Short key holds are timing constraints, not a claim
of49 distinct poses. Output must pass native anatomy, adjacency, matte and rest
handoff review; model metadata never accepts motion. Run one GPU worker at a time.
"""

import os

os.environ["TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL"] = "1"
os.environ["MIOPEN_FIND_MODE"] = "FAST"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
import argparse, json, time, gc, hashlib, subprocess, html
from pathlib import Path
import torch, numpy as np, cv2, ftfy
from PIL import Image, ImageFilter
from accelerate import cpu_offload
from torch.nn.attention import sdpa_kernel, SDPBackend
from transformers import T5TokenizerFast, UMT5EncoderModel
from safetensors.torch import load_file, save_file
from diffusers import (
    WanVACEPipeline,
    WanVACETransformer3DModel,
    AutoencoderKLWan,
    UniPCMultistepScheduler,
)
from bounded_transformer import load_transformer

torch.backends.cudnn.enabled = False
ap = argparse.ArgumentParser()
ap.add_argument("--lab", type=Path, required=True)
ap.add_argument("--run", required=True)
ap.add_argument("--width", type=int, default=384)
ap.add_argument("--height", type=int, default=576)
ap.add_argument("--frames", type=int, default=49)
ap.add_argument("--steps", type=int, default=32)
ap.add_argument("--crop", type=int, nargs=4, default=[192, 768, 576, 1344])
args = ap.parse_args()
lab = args.lab.resolve()
project = Path(__file__).resolve().parents[3]
src = project / "frontend/evidence/deer-frame-study/vace-leg"
root = src / args.run

if not __import__("re").fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{1,90}", args.run):
    raise ValueError("Invalid research run ID")
if args.frames != 49:
    raise ValueError("This multi-key timing study requires exactly49 source positions")
if args.width % 16 or args.height % 16:
    raise ValueError("Dimensions must be multiples of16")
if (
    args.crop[2] - args.crop[0] != args.width
    or args.crop[3] - args.crop[1] != args.height
):
    raise ValueError("This study requires a native crop without upscaling")
torch.cuda.set_per_process_memory_fraction(0.76, 0)
root.mkdir(exist_ok=False)
start = time.time()
state = json.loads((lab / "vace-download-state.json").read_text())
shared = json.loads((lab / "download-state.json").read_text())
snapshot = Path(state["path"])
encoder_path = Path(shared["path"])
prompt = "A locked close-up of exactly TWO deer front legs beneath a furry chest. The RIGHT front leg in the image stays planted and motionless. The LEFT front leg is the only moving limb: first its single small cloven hoof barely clears the moss, then that SAME leg bends naturally at the carpal joint and tucks its hoof, then smoothly unfolds and lowers that SAME hoof to its starting point. One slow continuous pawing cycle. There is only ONE left leg and ONE right leg throughout. When the left hoof lifts, its old planted leg disappears because it is the same limb moving. A straight rigid cannon bone, natural carpal articulation, short normal pastern and small cloven hoof. The unchanged chest, right leg, green background, flowers, moss and camera remain registered."
negative = "three visible front legs, extra planted leg beneath lifted leg, duplicate left leg, retained old limb, disembodied hoof, detached lower leg, double exposure, crossfade, broken leg, extra leg, missing leg, elongated hoof, rubber limb, twisted joint, fused legs, floating foot, abrupt pose jump, ghost limb, changing body, camera movement, flicker, blur, text"
receipt = {
    "status": "PREPARING",
    "model": state["model"],
    "revision": state["revision"],
    "source": "VACE_MASKED_LEG_KEYPOSE_INBETWEENS",
    "frames": args.frames,
    "fps": 24,
    "width": args.width,
    "height": args.height,
    "steps": args.steps,
    "seed": 7126,
    "keys": {
        "rest_start": list(range(5)),
        "early_lift": list(range(9, 13)),
        "peak": list(range(21, 25)),
        "early_lower": list(range(33, 37)),
        "rest_end": list(range(45, 49)),
    },
    "mask_scope": "only farther foreleg ROI; body/face/antlers and other supports preserved from approved source",
    "prompt": prompt,
    "negative_prompt": negative,
    "motion_accepted": False,
    "paid_service_calls": 0,
    "anatomical_warp": False,
    "separate_reference_images": False,
    "native_crop": args.crop,
    "crop_resampling": list((args.crop[2] - args.crop[0], args.crop[3] - args.crop[1]))
    != [args.width, args.height],
}


def progress(stage, **kw):
    receipt.update(status=stage, elapsed_seconds=time.time() - start, **kw)
    (root / "receipt.json").write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
    print(
        json.dumps({"stage": stage, "elapsed": round(time.time() - start, 1), **kw}),
        flush=True,
    )


try:
    embed_path = lab / (
        "prompt-"
        + hashlib.sha256((prompt + negative).encode()).hexdigest()[:20]
        + ".safetensors"
    )
    if not embed_path.exists():
        progress("ENCODING_PROMPT")
        tokenizer = T5TokenizerFast.from_pretrained(
            encoder_path / "tokenizer", local_files_only=True
        )
        encoder = UMT5EncoderModel.from_pretrained(
            encoder_path / "text_encoder",
            dtype=torch.bfloat16,
            device_map={"": "cpu"},
            local_files_only=True,
        ).eval()
        encoder = cpu_offload(
            encoder, execution_device=torch.device("cuda:0"), offload_buffers=True
        )
        text = [
            " ".join(html.unescape(html.unescape(ftfy.fix_text(t))).split())
            for t in [prompt, negative]
        ]
        tokens = tokenizer(
            text,
            padding="max_length",
            max_length=256,
            truncation=True,
            return_tensors="pt",
        ).to("cuda")
        with torch.inference_mode():
            enc = encoder(
                tokens.input_ids, attention_mask=tokens.attention_mask
            ).last_hidden_state
            for i, n in enumerate(tokens.attention_mask.sum(1)):
                enc[i, int(n) :] = 0
        save_file(
            {
                "prompt_embeds": enc[:1].cpu().contiguous(),
                "negative_prompt_embeds": enc[1:].cpu().contiguous(),
            },
            embed_path,
        )
        del encoder, tokenizer, tokens, enc
        gc.collect()
        torch.cuda.empty_cache()
    progress("PREPARING_CONSTRAINTS")
    size = (args.width, args.height)
    box = tuple(args.crop)
    original = Image.open(src / "original-matte.png").convert("RGB")
    reference = original.resize(size, Image.Resampling.LANCZOS)
    base = original.crop(box).resize(size, Image.Resampling.LANCZOS)
    peak = (
        Image.open(src / "peak-leg-only.png")
        .convert("RGB")
        .crop(box)
        .resize(size, Image.Resampling.LANCZOS)
    )
    roi = (
        Image.open(src / "leg-mask.png")
        .crop(box)
        .resize(size, Image.Resampling.NEAREST)
    )
    roi_np = np.array(roi)
    core = cv2.erode(roi_np, np.ones((7, 7), np.uint8))
    early = Image.open(src / "registered-early-lift-crop.png").convert("RGB")
    early = Image.composite(early, base, roi)
    gray = Image.new("RGB", size, (128, 128, 128))
    video = []
    masks = []
    mid = args.frames // 2
    for i in range(args.frames):
        if i < 5 or i >= args.frames - 5:
            video.append(base.copy())
            masks.append(Image.new("L", size, 0))
        elif 9 <= i <= 12 or 33 <= i <= 36:
            video.append(early.copy())
            masks.append(Image.fromarray(np.where(core > 0, 0, roi_np).astype("uint8")))
        elif 21 <= i <= 24:
            video.append(peak.copy())
            masks.append(Image.fromarray(np.where(core > 0, 0, roi_np).astype("uint8")))
        else:
            video.append(Image.composite(gray, base, roi))
            masks.append(roi.copy())
    roi.save(root / "leg-mask.png")
    base.save(root / "reference.png")
    peak.save(root / "peak-key.png")
    transformer = load_transformer(
        snapshot, 0, progress, model_class=WanVACETransformer3DModel
    )
    original_forward = transformer.forward

    def efficient_forward(*values, **keywords):
        torch.cuda.empty_cache()
        with sdpa_kernel(SDPBackend.FLASH_ATTENTION):
            return original_forward(*values, **keywords)

    transformer.forward = efficient_forward
    vae = AutoencoderKLWan.from_pretrained(
        snapshot, subfolder="vae", torch_dtype=torch.float32, local_files_only=True
    ).to("cuda")
    vae.enable_tiling(
        tile_sample_min_height=256,
        tile_sample_min_width=256,
        tile_sample_stride_height=192,
        tile_sample_stride_width=192,
    )
    scheduler = UniPCMultistepScheduler.from_pretrained(
        snapshot, subfolder="scheduler", flow_shift=3.0, local_files_only=True
    )
    pipe = WanVACEPipeline(
        transformer=transformer,
        vae=vae,
        text_encoder=None,
        tokenizer=None,
        scheduler=scheduler,
    )
    pipe.set_progress_bar_config(disable=True)
    embeds = load_file(embed_path, device="cuda")
    original_encode = vae.encode

    def tracked_encode(*values, **keywords):
        progress(
            "ENCODING_CONSTRAINTS", gpu_allocated_bytes=torch.cuda.memory_allocated()
        )
        result = original_encode(*values, **keywords)
        torch.cuda.empty_cache()
        return result

    vae.encode = tracked_encode

    def step(p, index, t, kw):
        if not bool(torch.isfinite(kw["latents"]).all()):
            raise RuntimeError("Nonfinite latents")
        torch.cuda.empty_cache()
        progress(
            "GENERATING_INBETWEENS",
            step=index + 1,
            total=args.steps,
            gpu_allocated_bytes=torch.cuda.memory_allocated(),
            gpu_reserved_bytes=torch.cuda.memory_reserved(),
        )
        if index + 1 == args.steps:
            save_file(
                {"latents": kw["latents"].cpu().contiguous()},
                root / "latents.safetensors",
            )
            p.transformer.to_empty(device="meta")
            gc.collect()
            torch.cuda.empty_cache()
        return kw

    progress("STARTING_GENERATION")
    with torch.inference_mode():
        result = pipe(
            video=video,
            mask=masks,
            reference_images=None,
            prompt_embeds=embeds["prompt_embeds"],
            negative_prompt_embeds=embeds["negative_prompt_embeds"],
            height=args.height,
            width=args.width,
            num_frames=args.frames,
            num_inference_steps=args.steps,
            guidance_scale=5.0,
            conditioning_scale=1.35,
            generator=torch.Generator(device="cuda").manual_seed(7126),
            output_type="pil",
            max_sequence_length=256,
            callback_on_step_end=step,
        ).frames[0]
    progress("COMPOSITING", decoded_frames=len(result))
    raw = root / "raw-frames"
    final = root / "frames"
    raw.mkdir()
    final.mkdir()
    feather = roi.filter(ImageFilter.GaussianBlur(2))
    alpha = np.array(feather)
    protected = alpha == 0
    ref = np.array(base)
    outside_exact = True
    for i, frame in enumerate(result):
        frame.save(raw / f"frame-{i + 1:03d}.png")
        cel = (
            base.copy()
            if i in [0, args.frames - 1]
            else Image.composite(frame, base, feather)
        )
        cel.save(final / f"frame-{i + 1:03d}.png")
        outside_exact = outside_exact and np.array_equal(
            np.array(cel)[protected], ref[protected]
        )
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
            str(final / "frame-%03d.png"),
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
        "GENERATED_AWAITING_NATIVE_REVIEW",
        outside_mask_exact_original=bool(outside_exact),
        video_sha256=hashlib.sha256((root / "candidate.mp4").read_bytes()).hexdigest(),
    )
except Exception as e:
    progress(
        "FAILED_NO_ACTIVATION",
        error=repr(e),
        traceback=__import__("traceback").format_exc(),
    )
    raise
