"""Hand-crafted per-window acoustic descriptors.

Gain-independent (each window is RMS-normalised) and restricted to the
stethoscope band set in the protocol. The vector layout is described by
``feature_names`` so evidence files can explain what a model used.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np
from scipy.signal import stft

from .config import AudioSettings

EPS = 1e-8
# Envelope periodicity lag range: covers heart rates from 30 to 200 beats per minute.
PERIOD_MIN_SEC, PERIOD_MAX_SEC = 0.3, 2.0


def _hz_to_mel(hz: np.ndarray) -> np.ndarray:
    return 2595.0 * np.log10(1.0 + hz / 700.0)


def _mel_to_hz(mel: np.ndarray) -> np.ndarray:
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)


@lru_cache(maxsize=8)
def mel_filterbank(sample_rate_hz: int, n_fft: int, n_mels: int, fmin_hz: float, fmax_hz: float) -> np.ndarray:
    """Triangular mel filters, shape (n_mels, n_fft // 2 + 1)."""
    bins = np.linspace(0.0, sample_rate_hz / 2.0, n_fft // 2 + 1)
    edges = _mel_to_hz(np.linspace(_hz_to_mel(np.array(fmin_hz)), _hz_to_mel(np.array(fmax_hz)), n_mels + 2))
    bank = np.zeros((n_mels, len(bins)), dtype=np.float64)
    for index in range(n_mels):
        low, centre, high = edges[index:index + 3]
        rising = (bins - low) / max(centre - low, EPS)
        falling = (high - bins) / max(high - centre, EPS)
        bank[index] = np.clip(np.minimum(rising, falling), 0.0, None)
    return bank


def feature_names(settings: AudioSettings) -> list[str]:
    mels = range(settings.n_mels)
    return (
        [f"logmel_mean_{i}" for i in mels]
        + [f"logmel_std_{i}" for i in mels]
        + [f"logmel_delta_{i}" for i in mels]
        + ["centroid_mean", "centroid_std", "flatness_mean", "flatness_std",
           "zero_crossing_rate", "envelope_cv", "periodicity_strength", "periodicity_sec"]
    )


def window_features(window: np.ndarray, settings: AudioSettings) -> np.ndarray:
    rms = float(np.sqrt(np.mean(window ** 2)))
    signal = window / (rms + EPS)
    _, _, spectrum = stft(signal, fs=settings.sample_rate_hz, nperseg=settings.n_fft,
                          noverlap=settings.n_fft - settings.hop_samples, boundary=None, padded=False)
    power = np.abs(spectrum) ** 2
    bank = mel_filterbank(settings.sample_rate_hz, settings.n_fft, settings.n_mels, settings.fmin_hz, settings.fmax_hz)
    logmel = np.log(bank @ power + EPS)
    delta = np.abs(np.diff(logmel, axis=1)).mean(axis=1) if logmel.shape[1] > 1 else np.zeros(settings.n_mels)

    freqs = np.linspace(0.0, settings.sample_rate_hz / 2.0, power.shape[0])
    band = (freqs >= settings.fmin_hz) & (freqs <= settings.fmax_hz)
    band_power = power[band] + EPS
    centroid = (freqs[band, None] * band_power).sum(axis=0) / band_power.sum(axis=0)
    flatness = np.exp(np.log(band_power).mean(axis=0)) / band_power.mean(axis=0)
    zcr = float(np.mean(np.abs(np.diff(np.signbit(signal).astype(np.int8)))))

    frame_energy = power.sum(axis=0)
    envelope = frame_energy - frame_energy.mean()
    envelope_cv = float(np.std(frame_energy) / (np.mean(frame_energy) + EPS))
    strength, period = _periodicity(envelope, settings.sample_rate_hz / settings.hop_samples)

    return np.concatenate([
        logmel.mean(axis=1), logmel.std(axis=1), delta,
        [centroid.mean(), centroid.std(), flatness.mean(), flatness.std(), zcr, envelope_cv, strength, period],
    ]).astype(np.float32)


def _periodicity(envelope: np.ndarray, frame_rate_hz: float) -> tuple[float, float]:
    """Strongest normalised autocorrelation peak inside the heart-rate lag range."""
    low, high = int(PERIOD_MIN_SEC * frame_rate_hz), int(PERIOD_MAX_SEC * frame_rate_hz)
    if len(envelope) <= high or not np.any(envelope):
        return 0.0, 0.0
    corr = np.correlate(envelope, envelope, mode="full")[len(envelope) - 1:]
    corr = corr / (corr[0] + EPS)
    lag = low + int(np.argmax(corr[low:high + 1]))
    return float(corr[lag]), float(lag / frame_rate_hz)


def recording_features(windows: np.ndarray, settings: AudioSettings) -> np.ndarray:
    """Shape (n_windows, n_features); empty when there are no windows."""
    if len(windows) == 0:
        return np.empty((0, len(feature_names(settings))), dtype=np.float32)
    return np.stack([window_features(window, settings) for window in windows])
