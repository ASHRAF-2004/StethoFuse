"""Bounded checkpoint loading with scaled FP8 storage and BF16 computation.

Research only. Official checkpoint bytes stay unchanged. CPU blocks are staged
for one forward and restored from immutable CPU storage afterward. No full-shard
mapping, whole-model CUDA move, training, release or host-setting action.
"""

import gc
import json
import struct
from pathlib import Path

import torch
from torch import nn
from accelerate import init_empty_weights
from accelerate.utils import set_module_tensor_to_device
from diffusers import WanVACETransformer3DModel

SOURCE_DTYPES = {"F32": torch.float32, "BF16": torch.bfloat16, "F16": torch.float16}


def _scaled_hooks(module, scale):
    def compute(layer, inputs):
        if layer.weight.device.type != "cuda":
            raise RuntimeError("Offloaded linear was not staged before computation")
        if hasattr(layer, "_stored_fp8_weight"):
            raise RuntimeError("Reentrant scaled-weight conversion")
        layer._stored_fp8_weight = layer.weight.detach()
        layer.weight = nn.Parameter(
            layer._stored_fp8_weight.to(torch.bfloat16).mul_(scale), requires_grad=False
        )

    def restore(layer, inputs, output):
        if hasattr(layer, "_stored_fp8_weight"):
            layer.weight = nn.Parameter(layer._stored_fp8_weight, requires_grad=False)
            del layer._stored_fp8_weight

    module.register_forward_pre_hook(compute)
    module.register_forward_hook(restore, always_call=True)


def _offload_hooks(block, device):
    storage = {name: value.detach() for name, value in block.named_parameters()}
    if any(value.device.type != "cpu" for value in storage.values()):
        raise RuntimeError("CPU block has mixed initial storage devices")

    def stage(module, inputs):
        for name, value in storage.items():
            staged = value.to(device, non_blocking=True)
            set_module_tensor_to_device(
                module, name, device, value=staged, dtype=value.dtype
            )

    def restore(module, inputs, output):
        for name, value in storage.items():
            set_module_tensor_to_device(
                module, name, "cpu", value=value, dtype=value.dtype
            )

    block.register_forward_pre_hook(stage)
    block.register_forward_hook(restore, always_call=True)
    block._immutable_cpu_storage = storage
    return sum(value.numel() * value.element_size() for value in storage.values())


def load_scaled_offloaded(snapshot, device, progress, gpu_main_blocks=20):
    snapshot = Path(snapshot)
    config = WanVACETransformer3DModel.load_config(snapshot, subfolder="transformer")
    with init_empty_weights():
        model = WanVACETransformer3DModel.from_config(config)
    model.eval().requires_grad_(False)
    expected = {name: tuple(value.shape) for name, value in model.named_parameters()}
    scales = {}
    loaded = set()
    gpu_bytes = cpu_bytes = largest_tensor = 0
    files = sorted((snapshot / "transformer").glob("*.safetensors"))
    if not files:
        raise RuntimeError("No verified local transformer shards")
    for path in files:
        with path.open("rb") as handle:
            prefix = handle.read(8)
            if len(prefix) != 8:
                raise RuntimeError("Truncated safetensors prefix")
            length = struct.unpack("<Q", prefix)[0]
            if length > 16 * 1024 * 1024:
                raise RuntimeError("Unbounded safetensors header")
            header = json.loads(handle.read(length))
            base = 8 + length
            for key, metadata in header.items():
                if key == "__metadata__":
                    continue
                if key not in expected or tuple(metadata["shape"]) != expected[key]:
                    raise RuntimeError("Unexpected checkpoint parameter/shape: " + key)
                if key in loaded:
                    raise RuntimeError("Duplicate checkpoint parameter: " + key)
                start, stop = metadata["data_offsets"]
                handle.seek(base + start)
                raw = bytearray(handle.read(stop - start))
                if len(raw) != stop - start:
                    raise RuntimeError("Truncated checkpoint tensor: " + key)
                tensor = torch.frombuffer(
                    raw, dtype=SOURCE_DTYPES[metadata["dtype"]]
                ).reshape(metadata["shape"])
                if not bool(torch.isfinite(tensor).all()):
                    raise RuntimeError("Nonfinite source tensor: " + key)
                name = key.rsplit(".", 1)[0] if "." in key else ""
                module = model.get_submodule(name) if name else model
                if (
                    isinstance(module, nn.Linear)
                    and key.endswith(".weight")
                    and name.startswith(("blocks.", "vace_blocks."))
                ):
                    full = tensor.float()
                    maximum = float(full.abs().max())
                    scale = maximum / 448 if maximum else 1.0
                    value = (full / scale).to(torch.float8_e4m3fn)
                    scales[name] = scale
                    del full
                else:
                    value = tensor.to(torch.bfloat16)
                on_cpu = (
                    key.startswith("blocks.")
                    and int(key.split(".")[1]) >= gpu_main_blocks
                )
                if on_cpu:
                    value = value.pin_memory()
                target = "cpu" if on_cpu else f"cuda:{device}"
                set_module_tensor_to_device(
                    model, key, target, value=value, dtype=value.dtype
                )
                size = value.numel() * value.element_size()
                cpu_bytes += size if on_cpu else 0
                gpu_bytes += 0 if on_cpu else size
                largest_tensor = max(largest_tensor, len(raw))
                loaded.add(key)
                del tensor, value, raw
                if len(loaded) % 200 == 0:
                    gc.collect()
                    progress(
                        "LOADING_SCALED_FP8",
                        loaded_parameters=len(loaded),
                        total_parameters=len(expected),
                        resident_parameter_bytes=gpu_bytes,
                        offloaded_parameter_bytes=cpu_bytes,
                    )
        gc.collect()
    if loaded != set(expected):
        raise RuntimeError(
            "Missing checkpoint parameters: " + str(set(expected) - loaded)
        )
    for name, value in model.named_buffers():
        if value.device.type == "meta":
            raise RuntimeError("Uninitialized model buffer: " + name)
        set_module_tensor_to_device(model, name, f"cuda:{device}", value=value)
    for name, module in model.named_modules():
        if name in scales:
            _scaled_hooks(module, scales[name])
    staged_bytes = 0
    for index, block in enumerate(model.blocks):
        if index >= gpu_main_blocks:
            staged_bytes += _offload_hooks(block, f"cuda:{device}")
    if staged_bytes != cpu_bytes:
        raise RuntimeError("Offload storage accounting mismatch")
    model._research_storage = {
        "format": "per-linear scaled FP8 E4M3FN weights; BF16 biases/norms/computation",
        "gpu_main_blocks": gpu_main_blocks,
        "cpu_storage_pinned": all(
            value.is_pinned()
            for block in model.blocks[gpu_main_blocks:]
            for value in block._immutable_cpu_storage.values()
        ),
        "resident_parameter_bytes": gpu_bytes,
        "offloaded_parameter_bytes": cpu_bytes,
        "largest_source_tensor_bytes": largest_tensor,
        "scaled_linears": len(scales),
        "loaded_parameters": len(loaded),
    }
    progress(
        "SCALED_MODEL_READY",
        **model._research_storage,
        gpu_allocated_bytes=torch.cuda.memory_allocated(device),
    )
    return model
