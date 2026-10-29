"""Bounded reader for official safetensors checkpoints; no full-shard mappings.
FP8 storage is limited to transformer-block Linear layers. Norms, input/output
and conditioning remain BF16. Layerwise hooks restore BF16 for computation.
"""

import json, struct, time, gc
from pathlib import Path
import torch
from accelerate import init_empty_weights
from accelerate.utils import set_module_tensor_to_device
from diffusers import WanTransformer3DModel

DTYPES = {
    "F32": torch.float32,
    "F16": torch.float16,
    "BF16": torch.bfloat16,
    "F64": torch.float64,
}


def load_transformer(
    snapshot, device, progress, storage="bf16", model_class=WanTransformer3DModel
):
    cfg = model_class.load_config(snapshot, subfolder="transformer")
    with init_empty_weights():
        model = model_class.from_config(cfg)
    files = sorted((Path(snapshot) / "transformer").glob("*.safetensors"))
    loaded = set()
    storage_bytes = 0
    peak_tensor = 0
    expected = set(dict(model.named_parameters()))
    for file in files:
        with file.open("rb") as handle:
            size = struct.unpack("<Q", handle.read(8))[0]
            header = json.loads(handle.read(size))
            base = 8 + size
            for key, meta in header.items():
                if key == "__metadata__":
                    continue
                if key not in expected:
                    raise RuntimeError("Unexpected checkpoint parameter " + key)
                lo, hi = meta["data_offsets"]
                handle.seek(base + lo)
                raw = bytearray(handle.read(hi - lo))
                if len(raw) != hi - lo:
                    raise RuntimeError("Truncated parameter " + key)
                tensor = torch.frombuffer(raw, dtype=DTYPES[meta["dtype"]]).reshape(
                    meta["shape"]
                )
                module_name = key.rsplit(".", 1)[0] if "." in key else ""
                module = model.get_submodule(module_name) if module_name else model
                quantized = (
                    storage == "fp8"
                    and module_name.startswith("blocks.")
                    and isinstance(module, torch.nn.Linear)
                )
                dtype = torch.float8_e4m3fn if quantized else torch.bfloat16
                if not bool(torch.isfinite(tensor).all()):
                    raise RuntimeError("Nonfinite checkpoint parameter " + key)
                if quantized and float(tensor.abs().max()) > 448:
                    raise RuntimeError("FP8 range exceeded " + key)
                value = tensor.to(dtype=dtype)
                set_module_tensor_to_device(
                    model, key, f"cuda:{device}", value=value, dtype=dtype
                )
                storage_bytes += value.numel() * value.element_size()
                peak_tensor = max(peak_tensor, len(raw))
                loaded.add(key)
                del tensor, value, raw
        gc.collect()
        progress(
            "LOADING_VIDEO_TENSORS",
            loaded_parameters=len(loaded),
            total_parameters=len(expected),
            storage_bytes=storage_bytes,
        )
    if loaded != expected:
        raise RuntimeError("Missing checkpoint parameters " + str(expected - loaded))
    model.eval().requires_grad_(False)
    if storage == "fp8":
        model.enable_layerwise_casting(
            storage_dtype=torch.float8_e4m3fn,
            compute_dtype=torch.bfloat16,
            skip_modules_pattern=(
                "patch_embedding",
                "condition_embedder",
                "norm",
                "proj_out",
            ),
        )
    model.to(f"cuda:{device}")
    progress(
        "VIDEO_MODEL_RESIDENT",
        storage_bytes=storage_bytes,
        largest_source_tensor_bytes=peak_tensor,
        gpu_allocated_bytes=torch.cuda.memory_allocated(device),
    )
    return model
