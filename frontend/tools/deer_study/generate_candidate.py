"""Local generative video study. Never deploys or modifies an application asset.
Uses the original approved deer, not held poses, mesh warps or optical flow.
"""

import os

os.environ["TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL"] = "1"
os.environ["MIOPEN_FIND_MODE"] = "FAST"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
import argparse, json, time, gc, hashlib, subprocess, html
from pathlib import Path
import torch, ftfy
from torch.nn.attention import sdpa_kernel, SDPBackend
from PIL import Image
from safetensors.torch import save_file, load_file
from transformers import T5TokenizerFast, UMT5EncoderModel
from accelerate import cpu_offload
from diffusers import (
    WanImageToVideoPipeline,
    AutoencoderKLWan,
    UniPCMultistepScheduler,
    WanTransformer3DModel,
)
from accelerate import init_empty_weights
from types import MethodType
from bounded_transformer import load_transformer

ap = argparse.ArgumentParser()
ap.add_argument("--lab", type=Path)
ap.add_argument("--run", default="continuous-i2v-01")
ap.add_argument("--width", type=int, default=384)
ap.add_argument("--height", type=int, default=576)
ap.add_argument("--frames", type=int, default=49)
ap.add_argument("--steps", type=int, default=32)
ap.add_argument("--seed", type=int, default=2841)
ap.add_argument("--source", type=Path)
ap.add_argument("--prompt-file", type=Path)
ap.add_argument("--negative-file", type=Path)
ap.add_argument("--vae-precision", choices=["bf16", "fp32"], default="bf16")
ap.add_argument("--vae-tiled", action="store_true")
args = ap.parse_args()
lab = args.lab.resolve() if args.lab else Path(__file__).resolve().parent
project = lab.parents[1] / "Workspace/implementation"
root = project / "frontend/evidence/deer-frame-study/local-i2v" / args.run
if root.exists():
    raise RuntimeError("Run exists; preserve old results and choose a new --run ID.")
root.mkdir(parents=True)
start = time.time()
model = json.loads((lab / "download-state.json").read_text())
snapshot = Path(model["path"])
if model["status"] != "DOWNLOADED":
    raise RuntimeError("Model download is not complete.")
source = project / "frontend/public/assets/forest-world/deer-clearing.webp"
if args.source:
    source = args.source.resolve()
prompt = "A continuous locked-camera full-body shot of this exact spotted deer on the same mossy flower island. The playful deer clearly lifts its leftmost front hoof off the moss. The foreleg folds naturally backward under its chest, with the small cloven hoof hanging beneath the carpus. It paws once gently, then smoothly lowers that same hoof and plants it in its original spot. One natural pawing cycle over four seconds, with a small curious head tilt and ear flick. The three supporting hooves stay planted. It settles back into its original stance and original facing direction at the end. The same face, antler tines, spotted coat, body proportions, camera, size, lighting and ground remain consistent. Natural animal motion with physically coherent joints and clean limb overlap."
negative = "static frozen deer, no action, idle-only, slideshow, jump cut, abrupt pose change, camera motion, zoom, pan, moving island, floating feet, sliding support hooves, rubber leg, bowed lower-leg bone, broken joint, elongated hoof, malformed anatomy, duplicated leg, missing leg, fused limbs, switching legs, flexible antlers, changing antler branches, changing face or coat spots, body squash, body stretch, flicker, ghost limbs, blurred detail, subtitles, text, UI"
if args.prompt_file:
    prompt = args.prompt_file.read_text(encoding="utf-8").strip()
if args.negative_file:
    negative = args.negative_file.read_text(encoding="utf-8").strip()

receipt = {
    "status": "PREPARING",
    "source": "LOCAL_WAN22_GENERATIVE_I2V",
    "model": "Wan-AI/Wan2.2-TI2V-5B-Diffusers",
    "revision": model["revision"],
    "source_reference": str(source),
    "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "width": args.width,
    "height": args.height,
    "requested_frames": args.frames,
    "fps": 24,
    "steps": args.steps,
    "seed": args.seed,
    "prompt": prompt,
    "negative_prompt": negative,
    "paid_service_calls": 0,
    "source_pose_cuts": False,
    "local_anatomy_warp": False,
    "motion_accepted": False,
    "vae_precision": args.vae_precision,
    "vae_tiled": args.vae_tiled,
}


def progress(stage, **info):
    receipt.update(status=stage, elapsed_seconds=time.time() - start, **info)
    (root / "receipt.json").write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
    print(
        json.dumps({"stage": stage, "elapsed": round(time.time() - start, 1), **info}),
        flush=True,
    )


device = next(
    i
    for i in range(torch.cuda.device_count())
    if "9060" in torch.cuda.get_device_name(i)
)
torch.cuda.set_device(device)
torch.backends.cudnn.enabled = False
torch.cuda.set_per_process_memory_fraction(0.84, device)
vae_dtype = torch.bfloat16 if args.vae_precision == "bf16" else torch.float32
try:
    embed_key = hashlib.sha256(
        (model["revision"] + prompt + negative).encode()
    ).hexdigest()[:20]
    embed_path = lab / f"prompt-{embed_key}.safetensors"
    if not embed_path.exists():
        progress("LOADING_TEXT_ENCODER")
        tokenizer = T5TokenizerFast.from_pretrained(
            snapshot / "tokenizer", local_files_only=True
        )
        encoder = UMT5EncoderModel.from_pretrained(
            snapshot / "text_encoder",
            dtype=torch.bfloat16,
            device_map={"": "cpu"},
            local_files_only=True,
            low_cpu_mem_usage=True,
        ).eval()
        encoder = cpu_offload(
            encoder,
            execution_device=torch.device(f"cuda:{device}"),
            offload_buffers=True,
        )
        texts = [
            " ".join(html.unescape(html.unescape(ftfy.fix_text(t))).split())
            for t in [prompt, negative]
        ]
        tokens = tokenizer(
            texts,
            padding="max_length",
            max_length=256,
            truncation=True,
            add_special_tokens=True,
            return_attention_mask=True,
            return_tensors="pt",
        ).to(f"cuda:{device}")
        progress("ENCODING_PROMPT")
        with torch.inference_mode():
            encoded = encoder(
                tokens.input_ids, attention_mask=tokens.attention_mask
            ).last_hidden_state
            for i, n in enumerate(tokens.attention_mask.sum(dim=1)):
                encoded[i, int(n) :] = 0
        if not torch.isfinite(encoded).all():
            raise RuntimeError("Nonfinite text embedding")
        save_file(
            {
                "prompt_embeds": encoded[:1].cpu().contiguous(),
                "negative_prompt_embeds": encoded[1:].cpu().contiguous(),
            },
            embed_path,
        )
        del encoder, tokenizer, encoded, tokens
        gc.collect()
        torch.cuda.empty_cache()
    progress("LOADING_VIDEO_MODEL")

    class StudyPipeline(WanImageToVideoPipeline):
        @property
        def _execution_device(self):
            return torch.device(f"cuda:{device}")

    with init_empty_weights():
        placeholder = WanTransformer3DModel.from_config(
            WanTransformer3DModel.load_config(snapshot, subfolder="transformer")
        ).to(dtype=torch.bfloat16)
    vae = AutoencoderKLWan.from_pretrained(
        snapshot,
        subfolder="vae",
        torch_dtype=vae_dtype,
        local_files_only=True,
        low_cpu_mem_usage=True,
    ).to(f"cuda:{device}")
    if args.vae_tiled:
        vae.enable_tiling()
    scheduler = UniPCMultistepScheduler.from_pretrained(
        snapshot, subfolder="scheduler", local_files_only=True
    )
    pipe = StudyPipeline(
        vae=vae,
        transformer=placeholder,
        text_encoder=None,
        tokenizer=None,
        scheduler=scheduler,
        expand_timesteps=True,
    )
    pipe.set_progress_bar_config(disable=True)
    original_prepare = pipe.prepare_latents

    def staged_prepare(self, *values, **keywords):
        result = original_prepare(*values, **keywords)
        self.vae.to_empty(device="meta")
        gc.collect()
        torch.cuda.empty_cache()
        self.transformer = load_transformer(snapshot, device, progress)
        original_forward = self.transformer.forward

        def efficient_forward(*values, **keywords):
            torch.cuda.empty_cache()
            with sdpa_kernel(SDPBackend.FLASH_ATTENTION):
                return original_forward(*values, **keywords)

        self.transformer.forward = efficient_forward
        return result

    pipe.prepare_latents = MethodType(staged_prepare, pipe)
    receipt["precision"] = (
        f"BF16 transformer, {args.vae_precision} VAE; generator and VAE occupy GPU in separate stages"
    )
    embeds = load_file(embed_path, device=f"cuda:{device}")
    approved = Image.open(source).convert("RGBA")
    matte = Image.new("RGBA", approved.size, "#29473b")
    matte.alpha_composite(approved)
    image = matte.convert("RGB").resize(
        (args.width, args.height), Image.Resampling.LANCZOS
    )
    image.save(root / "condition-frame.png")
    receipt["condition_sha256"] = hashlib.sha256(
        (root / "condition-frame.png").read_bytes()
    ).hexdigest()
    receipt["reference_preprocessing"] = (
        "Uniform resize and alpha composition over #29473b; no anatomical or local deformation"
    )

    def step(pipeline, index, timestep, kw):
        if not torch.isfinite(kw["latents"]).all():
            raise RuntimeError("Nonfinite diffusion latents")
        torch.cuda.empty_cache()
        progress(
            "GENERATING",
            step=index + 1,
            total_steps=args.steps,
            gpu_allocated_bytes=torch.cuda.memory_allocated(device),
        )
        if index + 1 == args.steps:
            save_file(
                {"latents": kw["latents"].cpu().contiguous()},
                root / "diffusion-latents.safetensors",
            )
            pipeline.transformer.to_empty(device="meta")
            gc.collect()
            torch.cuda.empty_cache()
            progress(
                "DENOISER_RELEASED_BEFORE_DECODE",
                gpu_allocated_bytes=torch.cuda.memory_allocated(device),
            )
            decoded_vae = AutoencoderKLWan.from_pretrained(
                snapshot,
                subfolder="vae",
                torch_dtype=vae_dtype,
                local_files_only=True,
                low_cpu_mem_usage=True,
            ).to(f"cuda:{device}")
            if args.vae_tiled:
                decoded_vae.enable_tiling()
            pipeline.vae = decoded_vae
            decode_count = [0]

            def decoded_chunk(module, inputs, output):
                decode_count[0] += 1
                if decode_count[0] % 10 == 0:
                    progress("DECODING_CHUNKS", chunks=decode_count[0])

            decoded_vae.decoder.register_forward_hook(decoded_chunk)
            progress(
                "DECODING_ON_GPU",
                gpu_allocated_bytes=torch.cuda.memory_allocated(device),
            )
        return kw

    progress("STARTING_DIFFUSION")
    with torch.inference_mode():
        video = pipe(
            image=image,
            prompt_embeds=embeds["prompt_embeds"],
            negative_prompt_embeds=embeds["negative_prompt_embeds"],
            height=args.height,
            width=args.width,
            num_frames=args.frames,
            num_inference_steps=args.steps,
            guidance_scale=5.0,
            generator=torch.Generator(device=f"cuda:{device}").manual_seed(args.seed),
            max_sequence_length=256,
            output_type="pil",
            callback_on_step_end=step,
        ).frames[0]
    progress("EXPORTING", decoded_frames=len(video))
    frames = root / "frames"
    frames.mkdir()
    for i, im in enumerate(video):
        im.save(frames / f"frame-{i + 1:03d}.png")
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
            str(frames / "frame-%03d.png"),
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
        decoded_frames=len(video),
    )
    pipe.maybe_free_model_hooks()
except Exception as exc:
    progress("FAILED_NO_ACTIVATION", error=repr(exc))
    raise
