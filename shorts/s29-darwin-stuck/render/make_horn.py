#!/usr/bin/env python3
"""
Sad steam-train horn "toot" for gag 3 (s29 Darwin Stuck) — original synthesis, no third-party audio.

Mixkit (assets.mixkit.co) was unreachable from the render container, so per the brief's fallback
this cue is synthesised here and documented in sfx/sources.tsv as an original work.

Shape: a short "toot" then a long "tooo…" on a minor chord (A–C–E) whose pitch sags about two
semitones as it fades — the deflated sound of a train that has run out of track.
Output: ../sfx/sad_horn_toot.wav (48 kHz mono, 16-bit)
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'sfx', 'sad_horn_toot.wav')


def voice(f_curve, n_harm=14):
    phase = 2 * np.pi * np.cumsum(f_curve) / SR
    y = np.zeros_like(f_curve)
    for k in range(1, n_harm + 1):
        y += np.sin(k * phase) / k ** 1.15
    return y


def note(dur, sag_semis, t_sag0, vib=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sag = np.where(t > t_sag0, -sag_semis * np.clip((t - t_sag0) / max(dur - t_sag0, 1e-3), 0, 1) ** 1.4, 0.0)
    ratio = 2 ** (sag / 12) * (1 + vib * np.sin(2 * np.pi * 5.2 * t))
    chord = [220.0, 261.63, 329.63]  # A3 C4 E4 — minor, i.e. sad
    y = sum(voice(f * ratio * np.ones(n)) * w for f, w in zip(chord, (1.0, 0.8, 0.7)))
    att = np.clip(t / 0.03, 0, 1)
    rel = np.clip((dur - t) / 0.12, 0, 1)
    amp = att * rel * (1 - 0.55 * np.clip((t - t_sag0) / max(dur - t_sag0, 1e-3), 0, 1))
    return y * amp


short = note(0.24, 0.0, 0.24)
gap = np.zeros(int(0.09 * SR))
long = note(1.05, 2.2, 0.25, vib=0.004)
y = np.concatenate([short, gap, long])
# horn body: band-pass + gentle breathiness
sos = butter(2, [180, 2600], btype='bandpass', fs=SR, output='sos')
y = sosfilt(sos, y)
rng = np.random.default_rng(29)
air = sosfilt(butter(2, [800, 4000], btype='bandpass', fs=SR, output='sos'), rng.standard_normal(len(y)))
env = np.abs(y) / (np.abs(y).max() + 1e-9)
y = y + 0.05 * air * np.convolve(env, np.ones(800) / 800, mode='same')
# small room tail
ir = np.zeros(int(0.35 * SR)); ir[0] = 1
for d, g in ((0.031, 0.35), (0.047, 0.28), (0.071, 0.2), (0.113, 0.14), (0.171, 0.09)):
    ir[int(d * SR)] += g
y = np.convolve(y, ir)[: len(y) + int(0.3 * SR)]
y = y / np.abs(y).max() * 0.89  # ≈ −1 dBFS peak; final level set in the mix
wavfile.write(OUT, SR, (y * 32767).astype(np.int16))
print('wrote', OUT, f'{len(y) / SR:.2f}s')
