"""Oars for the cold open (no oars file exists in audio/sfx): synthesised in the project, numpy, seeded.
Each stroke: a soft wooden knock as the blade bites, a band-passed water swirl, then drips. -> ../audio/sfx/oars.flac"""
import os, numpy as np, subprocess
from scipy import signal
SR = 48000
rng = np.random.default_rng(1915)
N = int(9.5 * SR)
out = np.zeros((N, 2), np.float32)
def bp(x, lo, hi):
    return signal.sosfilt(signal.butter(3, [lo / (SR / 2), hi / (SR / 2)], 'bandpass', output='sos'), x)
for k, t0 in enumerate([0.25, 2.35, 4.45, 6.6, 8.7]):
    for side, pan in ((0, 0.75), (1, 0.25)):                   # a boat-full: oars a beat apart, left and right
        tt = t0 + side * 0.18 + rng.uniform(-0.05, 0.05)
        i = int(tt * SR)
        n = int(1.3 * SR)
        e = np.arange(n) / SR
        knock = np.sin(2 * np.pi * (150 + 40 * rng.random()) * e) * np.exp(-e / 0.035) * 0.5
        swirl = bp(rng.standard_normal(n), 250, 1800) * (np.minimum(1, e / 0.07) * np.exp(-e / 0.42)) * 0.6
        drips = np.zeros(n)
        for _ in range(5):
            j = int((0.45 + rng.random() * 0.7) * SR)
            m = int(0.06 * SR)
            if j + m < n:
                f = 1400 + 900 * rng.random()
                drips[j:j + m] += np.sin(2 * np.pi * f * np.arange(m) / SR * (1 + np.arange(m) / m * 0.4)) * np.exp(-np.arange(m) / SR / 0.012) * 0.12
        x = (knock + swirl + drips).astype(np.float32)
        m = min(n, N - i)
        out[i:i + m, 0] += x[:m] * (1 - pan)
        out[i:i + m, 1] += x[:m] * pan
out /= np.abs(out).max() * 1.12
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio', 'sfx', 'oars.flac')
import scipy.io.wavfile as wf
tmp = '/tmp/oars.wav'
wf.write(tmp, SR, out)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'flac', '-sample_fmt', 's32', p], check=True)
print('wrote', p)
