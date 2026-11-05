"""Experimental larger-model lowering study; no website/runtime activation.

Pinned official weights use bounded scaled FP8 storage, BF16 computation and
pinned CPU offload. The tiny placement-equivalence test is not a visual pass.
Require actual native-frame, anatomy, contact, matte and original-rest inspection.
"""

import os

os.environ["TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL"] = "1"
os.environ["MIOPEN_FIND_MODE"] = "FAST"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
import argparse, json, time, gc, hashlib, subprocess, html
from pathlib import Path
import torch, numpy as np, cv2, ftfy
from PIL import Image, ImageFilter
from accelerate import cpu_offload, init_empty_weights
from torch.nn.attention import sdpa_kernel, SDPBackend
from transformers import T5TokenizerFast, UMT5EncoderModel
from safetensors.torch import load_file, save_file
from diffusers import (
    WanVACEPipeline,
    WanVACETransformer3DModel,
    AutoencoderKLWan,
    UniPCMultistepScheduler,
)
from bounded_scaled_offload import load_scaled_offloaded

torch.backends.cudnn.enabled = False
torch.cuda.set_per_process_memory_fraction(0.84, 0)
ap = argparse.ArgumentParser()
ap.add_argument("--lab", type=Path, required=True)
ap.add_argument("--run", required=True)
ap.add_argument("--width", type=int, default=320)
ap.add_argument("--height", type=int, default=480)
ap.add_argument("--frames", type=int, default=49)
ap.add_argument("--steps", type=int, default=32)
ap.add_argument("--crop", type=int, nargs=4, default=[224, 832, 544, 1312])
args = ap.parse_args()
lab = args.lab.resolve()
project = Path(__file__).resolve().parents[3]
src = project / "frontend/evidence/deer-frame-study/vace-leg"
root = src / args.run

if not __import__("re").fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{1,90}", args.run):
    raise ValueError("Invalid study ID")
if (
    args.frames != 49
    or (args.width, args.height) != (320, 480)
    or args.crop != [224, 832, 544, 1312]
):
    raise ValueError("This registered pose study uses fixed native geometry")
root.mkdir(exist_ok=False)
start = time.time()
state = json.loads((lab / "vace14-download-state.json").read_text())
shared = json.loads((lab / "download-state.json").read_text())
snapshot = Path(state["path"])
encoder_path = Path(shared["path"])
prompt = "A locked close-up of a deer chest and exactly TWO front legs. One small cloven hoof is already raised at the start. That already raised hoof slowly LOWERS to the moss: the same bent leg smoothly unfolds its carpal joint, its straight cannon bone extends down in a narrow arc, and that same small hoof touches the ground slightly LEFT of the other planted hoof. Finish with both hooves planted and pause. The other leg remains completely still and planted throughout. Only the initially raised limb moves. Natural deer anatomy, one forearm, one carpus, one straight cannon, one short pastern and one normal small cloven hoof. The chest, other leg, flowers, moss, camera and framing stay fixed. A calm lowering and contact, no step or walk."
negative = "walking, stepping forward with other leg, raising the planted leg, holding the raised leg frozen, three visible forelegs, duplicate limb, ghost leg, double exposure, extra hoof, missing leg, detached hoof, split bone, flexible cannon, long deformed hoof, stretching, sliding, jumping, camera motion, body leaving frame, zoom, abrupt pose change, blur, text"

receipt = {
    "status": "PREPARING",
    "model": state["model"],
    "revision": state["revision"],
    "source": "VACE14_NATIVE_MASKED_LOWERING",
    "frames": args.frames,
    "fps": 24,
    "width": args.width,
    "height": args.height,
    "steps": args.steps,
    "seed": 7126,
    "keys": {
        "raised_start": list(range(5)),
        "toe_off": list(range(29, 33)),
        "original_rest_end": list(range(45, 49)),
    },
    "mask_scope": "only farther foreleg ROI; body/face/antlers and other supports preserved from approved source",
    "prompt": prompt,
    "negative_prompt": negative,
    "motion_accepted": False,
    "paid_service_calls": 0,
    "anatomical_warp": False,
    "storage_precision": "scaled FP8 transformer blocks with BF16 compute/conditioning/VAE;24 base blocks staged from CPU",
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
    gray = Image.new("RGB", size, (128, 128, 128))
    video = []
    masks = []
    mid = args.frames // 2
    natural_peak = (
        Image.open(src / "registered-lift-reference.png").convert("RGB").crop(box)
    )
    natural_peak = Image.composite(natural_peak, base, roi)
    early = (
        Image.open(src / "registered-early-lift-crop.png")
        .convert("RGB")
        .crop((32, 64, 352, 544))
    )
    early = Image.composite(early, base, roi)
    first_core = core.copy()
    first_core[:126] = 0
    for i in range(args.frames):
        if i >= 45:
            video.append(base.copy())
            masks.append(Image.new("L", size, 0))
        elif i < 5:
            video.append(natural_peak.copy())
            masks.append(
                Image.fromarray(np.where(first_core > 0, 0, roi_np).astype("uint8"))
            )
        elif 29 <= i <= 32:
            video.append(early.copy())
            masks.append(Image.fromarray(np.where(core > 0, 0, roi_np).astype("uint8")))
        else:
            video.append(Image.composite(gray, base, roi))
            masks.append(roi.copy())
    roi.save(root / "leg-mask.png")
    base.save(root / "reference.png")
    peak.save(root / "peak-key.png")
    integrity = json.loads((lab / "vace14-integrity-proof.json").read_text())
    expected_files = {
        item["path"]
        for item in json.loads((lab / "vace14-model-info.json").read_text())["files"]
        if item["path"].startswith("transformer/") and item.get("sha256")
    }
    if (
        not integrity["all_match"]
        or {item["file"] for item in integrity["files"]} != expected_files
    ):
        raise ValueError("Checkpoint integrity proof incomplete")
    with init_empty_weights():
        placeholder = WanVACETransformer3DModel.from_config(
            WanVACETransformer3DModel.load_config(snapshot, subfolder="transformer")
        ).to(dtype=torch.bfloat16)
    shared_vae = Path(
        json.loads((lab / "vace-download-state.json").read_text())["path"]
    )

    class ResearchPipeline(WanVACEPipeline):
        @property
        def _execution_device(self):
            return torch.device("cuda:0")

        def prepare_latents(self, *values, **keywords):
            result = super().prepare_latents(*values, **keywords)
            self.vae.clear_cache()
            self.vae.to_empty(device="meta")
            gc.collect()
            torch.cuda.empty_cache()
            self.transformer = load_scaled_offloaded(
                snapshot, 0, progress, gpu_main_blocks=16
            )
            original_forward = self.transformer.forward

            def efficient_forward(*v, **kw):
                torch.cuda.empty_cache()
                with sdpa_kernel(SDPBackend.FLASH_ATTENTION):
                    return original_forward(*v, **kw)

            self.transformer.forward = efficient_forward
            return result

    vae = AutoencoderKLWan.from_pretrained(
        shared_vae, subfolder="vae", torch_dtype=torch.bfloat16, local_files_only=True
    ).to("cuda")
    scheduler = UniPCMultistepScheduler.from_pretrained(
        snapshot, subfolder="scheduler", flow_shift=3.0, local_files_only=True
    )
    pipe = ResearchPipeline(
        transformer=placeholder,
        vae=vae,
        text_encoder=None,
        tokenizer=None,
        scheduler=scheduler,
    )
    pipe.set_progress_bar_config(disable=True)
    embeds = load_file(embed_path, device="cuda")

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
            p.vae = AutoencoderKLWan.from_pretrained(
                shared_vae,
                subfolder="vae",
                torch_dtype=torch.bfloat16,
                local_files_only=True,
            ).to("cuda")
            progress("DECODING_SAME_TAKE")
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
            conditioning_scale=1.15,
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
            if i == args.frames - 1
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
