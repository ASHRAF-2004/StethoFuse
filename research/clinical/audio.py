"""Audio loading, resampling and windowing shared by every task."""
from __future__ import annotations

from fractions import Fraction
from pathlib import Path

import numpy as np
import soundfile
from scipy.signal import resample_poly

from .config import AudioSettings


def load_mono(path: Path | str, sample_rate_hz: int) -> np.ndarray:
    """Decode any soundfile-readable file to float32 mono at ``sample_rate_hz``."""
    data, rate = soundfile.read(str(path), dtype="float32", always_2d=True)
    signal = data.mean(axis=1)
    if rate != sample_rate_hz:
        ratio = Fraction(sample_rate_hz, rate).limit_denominator(1000)
        signal = resample_poly(signal, ratio.numerator, ratio.denominator).astype(np.float32)
    return signal


def windows(signal: np.ndarray, settings: AudioSettings) -> np.ndarray:
    """Split into overlapping fixed windows; short tails are dropped, short inputs padded once.

    Returns an array of shape (n_windows, window_samples). Empty if the input is
    shorter than ``min_sec``.
    """
    rate = settings.sample_rate_hz
    size = int(round(settings.window_sec * rate))
    hop = int(round(settings.hop_sec * rate))
    if len(signal) < settings.min_sec * rate:
        return np.empty((0, size), dtype=np.float32)
    if len(signal) < size:
        signal = np.pad(signal, (0, size - len(signal)))
    starts = range(0, len(signal) - size + 1, hop)
    framed = np.stack([signal[start:start + size] for start in starts]).astype(np.float32)
    if len(framed) > settings.max_windows_per_recording:
        # Evenly spaced subset keeps coverage of long recordings without bias to the start.
        keep = np.linspace(0, len(framed) - 1, settings.max_windows_per_recording).round().astype(int)
        framed = framed[keep]
    return framed
