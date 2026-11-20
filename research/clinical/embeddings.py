"""Frozen PANNs CNN14 (16 kHz) audio embeddings.

Architecture follows Kong et al., "PANNs: Large-Scale Pretrained Audio Neural
Networks" (audioset_tagging_cnn, MIT licence). Only the 2048-d penultimate
embedding is used; the AudioSet head is loaded for strict key matching and ignored.
Windows arrive at the protocol rate (4 kHz) and are upsampled, so every source
has the same band limit and the model cannot separate sources by bandwidth.
"""
from __future__ import annotations

import hashlib
from fractions import Fraction
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn.functional as F
from scipy.signal import resample_poly
from torch import nn

from .config import local_path
from torchlibrosa.stft import LogmelFilterBank, Spectrogram


# Data-only numpy types the published checkpoint's sampler state needs; nothing executable is allowed.
NUMPY_ARRAY_GLOBALS = [(np._core.multiarray._reconstruct, "numpy.core.multiarray._reconstruct"), np.ndarray, np.dtype,
                       np.dtypes.Int64DType, np.dtypes.Float64DType, np.dtypes.Float32DType]


class ConvBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False)
        self.bn1, self.bn2 = nn.BatchNorm2d(out_channels), nn.BatchNorm2d(out_channels)

    def forward(self, x: torch.Tensor, pool: tuple[int, int]) -> torch.Tensor:
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        return F.avg_pool2d(x, kernel_size=pool)


class Cnn14(nn.Module):
    def __init__(self, sample_rate: int, window_size: int, hop_size: int, mel_bins: int, fmin: float, fmax: float):
        super().__init__()
        self.spectrogram_extractor = Spectrogram(n_fft=window_size, hop_length=hop_size, win_length=window_size,
                                                 window="hann", center=True, pad_mode="reflect", freeze_parameters=True)
        self.logmel_extractor = LogmelFilterBank(sr=sample_rate, n_fft=window_size, n_mels=mel_bins, fmin=fmin, fmax=fmax,
                                                 ref=1.0, amin=1e-10, top_db=None, freeze_parameters=True)
        self.bn0 = nn.BatchNorm2d(mel_bins)
        widths = [1, 64, 128, 256, 512, 1024, 2048]
        for index in range(6):
            setattr(self, f"conv_block{index + 1}", ConvBlock(widths[index], widths[index + 1]))
        self.fc1 = nn.Linear(2048, 2048)
        self.fc_audioset = nn.Linear(2048, 527)

    def embed(self, waveform: torch.Tensor) -> torch.Tensor:
        x = self.logmel_extractor(self.spectrogram_extractor(waveform))
        x = self.bn0(x.transpose(1, 3)).transpose(1, 3)
        for index in range(1, 7):
            x = getattr(self, f"conv_block{index}")(x, (2, 2) if index < 6 else (1, 1))
        x = x.mean(dim=3)
        x = x.max(dim=2).values + x.mean(dim=2)
        return F.relu(self.fc1(x))


class PannsEmbedder:
    def __init__(self, spec: dict[str, Any], input_rate_hz: int):
        checkpoint = local_path(spec["checkpoint"])
        digest = hashlib.sha256(checkpoint.read_bytes()).hexdigest()
        if digest != spec["checkpoint_sha256"]:
            raise ValueError(f"PANNs checkpoint hash mismatch: {digest}")
        self.model = Cnn14(spec["sample_rate_hz"], spec["window_size"], spec["hop_size"], spec["mel_bins"], spec["fmin"], spec["fmax"])
        with torch.serialization.safe_globals(NUMPY_ARRAY_GLOBALS):  # sampler state holds numpy arrays; no code objects.
            state = torch.load(checkpoint, map_location="cpu", weights_only=True)["model"]
        self.model.load_state_dict(state, strict=True)
        self.model.eval()
        ratio = Fraction(spec["sample_rate_hz"], input_rate_hz)
        self.up, self.down = ratio.numerator, ratio.denominator
        self.batch_size = spec["batch_size"]

    @torch.inference_mode()
    def __call__(self, windows: np.ndarray) -> np.ndarray:
        if len(windows) == 0:
            return np.empty((0, 2048), dtype=np.float32)
        audio = resample_poly(windows, self.up, self.down, axis=1).astype(np.float32)
        audio /= np.sqrt(np.mean(audio ** 2, axis=1, keepdims=True)) * 10 + 1e-8  # gain-independent, ~0.1 RMS
        out = [self.model.embed(torch.from_numpy(audio[i:i + self.batch_size])).numpy()
               for i in range(0, len(audio), self.batch_size)]
        return np.concatenate(out).astype(np.float32)
