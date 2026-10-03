#!/usr/bin/env python3
"""lf01 sound design, synthesised in-house (numpy, no third-party samples) → render/sfx/*.wav (48 kHz stereo).

Scripted calls only (see CUE_SHEET.md). Includes the new IF AUSTRALIA series sting, built here so later
episodes can reuse sfx/sting_series.wav unchanged.
"""
import os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1942)

def t_(d): return np.arange(int(d * SR)) / SR
def env_exp(d, tau): return np.exp(-t_(d) / tau)
def adsr(n, a, r):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def lp(x, f, o=4): return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f1, f2, o=2): return signal.sosfilt(signal.butter(o, [f1, f2], 'band', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))
def sweep_sine(f0, f1, d, curve='exp'):
    tt = t_(d)
    f = f0 * (f1 / f0) ** (tt / d) if curve == 'exp' else f0 + (f1 - f0) * tt / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def saw(f, d, detune=0.0):
    tt = t_(d); ph = (f * (1 + detune)) * tt
    return 2 * (ph - np.floor(ph + 0.5))
def reverb(x, dur=2.0, mix=0.3, damp=3000, pre=0.012):
    n = int(dur * SR)
    out = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t_(dur) / (dur / 6.5))
        ir = lp(ir, damp, 2)
        ir = np.concatenate([np.zeros(int(pre * SR)), ir])
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        wet = signal.fftconvolve(x, ir)[: len(x) + n]
        dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
        out.append(dry * (1 - mix) + wet * mix)
    return np.stack(out, 1)
def st(x): return np.stack([x, x], 1) if x.ndim == 1 else x
def save(name, x, peak=-1.0):
    x = st(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak / 20)
    # gentle fade-out to avoid clicks
    n = min(len(x), int(0.02 * SR)); x[-n:] *= np.linspace(1, 0, n)[:, None]
    wavfile.write(os.path.join(OUT, name + '.wav'), SR, x.astype(np.float32))
    print(name, f'{len(x) / SR:.2f}s')
def pad(x, d): return np.concatenate([x, np.zeros(max(0, int(d * SR) - len(x)))])
def at(base, x, t0, g=1.0):
    i = int(t0 * SR); base[i:i + len(x)] += g * x[: len(base) - i]; return base

# ---------------------------------------------------------------- drone (cold open, frame 1)
d = 40
tt = t_(d)
dr = sum(a * np.sin(2 * np.pi * f * tt + p) for f, a, p in ((41.2, 1.0, 0), (61.8, 0.5, 1), (82.4, 0.35, 2), (41.45, 0.6, 0.5)))
dr *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * tt)
dr += 0.35 * lp(noise(d), 160) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * tt + 1))
dr *= adsr(len(dr), 0.25, 3.0)
save('drone', reverb(dr, 3.0, 0.35, 1200), -3)

# ---------------------------------------------------------------- boom ("invade Australia")
d = 5
b = sweep_sine(85, 34, d) * env_exp(d, 0.9)
b += 0.5 * lp(noise(d), 300) * env_exp(d, 0.18)
b += 0.25 * lp(noise(d), 2500) * env_exp(d, 0.03)
save('boom', reverb(b, 3.5, 0.4, 900), -1)

# ---------------------------------------------------------------- stamp thud
d = 1.2
s = sweep_sine(150, 55, d) * env_exp(d, 0.07) + 0.6 * lp(noise(d), 1800) * env_exp(d, 0.02) + 0.2 * bp(noise(d), 300, 900) * env_exp(d, 0.05)
save('stamp', reverb(s, 0.7, 0.18, 2500), -1)

# ---------------------------------------------------------------- pin thunk (soft, woody)
d = 0.6
k = sweep_sine(210, 120, d) * env_exp(d, 0.035) + 0.7 * sweep_sine(90, 55, d) * env_exp(d, 0.06) + 0.15 * bp(noise(d), 800, 2500) * env_exp(d, 0.008)
save('thunk', reverb(k, 0.5, 0.15, 3000), -2)

# ---------------------------------------------------------------- whoosh (before each scenario numeral)
d = 0.9
w = bp(noise(d), 300, 3000)
cen = np.linspace(400, 2600, len(w))
w = lp(w, 3200) * np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) ** 1.6
save('whoosh', reverb(w, 0.8, 0.2), -2)

# ---------------------------------------------------------------- soft zoom swish (pin approach)
d = 1.0
z = bp(noise(d), 500, 5000) * (t_(d) / d) ** 2.2 * np.exp(-((t_(d) - 0.9) / 0.12) ** 2 * 0.0 + 0)
z *= np.clip((d - t_(d)) / 0.12, 0, 1)
save('zoom_in', reverb(z, 0.6, 0.25), -4)

# ---------------------------------------------------------------- drums: 1, 2 (heavier), 3 (heaviest)
def drum(f0, f1, tau, d, body=1.0):
    x = sweep_sine(f0, f1, d) * env_exp(d, tau) * body
    x += 0.55 * lp(noise(d), 1400) * env_exp(d, 0.025)
    x += 0.3 * bp(noise(d), 120, 400) * env_exp(d, tau * 0.6)
    return x
d1 = drum(150, 58, 0.35, 2.5)
save('drum_1', reverb(d1, 2.0, 0.3, 2000), -2)
d2 = drum(130, 48, 0.55, 3.5) + 0.7 * pad(drum(95, 40, 0.6, 3.4), 3.5)
save('drum_2', reverb(d2, 2.6, 0.33, 1800), -1)
d3 = drum(120, 40, 0.8, 5) + 0.9 * pad(sweep_sine(70, 28, 4.8) * env_exp(4.8, 1.3), 5)
cl = sum(np.sin(2 * np.pi * f * t_(5)) for f in (311, 587, 1009, 1430)) * env_exp(5, 0.6) * 0.06
d3 += cl
save('drum_3', reverb(d3, 3.4, 0.38, 1500), -0.5)

# ---------------------------------------------------------------- series sting (title build, 2.5 s gap)
d = 3.2
x = np.zeros(int(d * SR))
x = at(x, drum(120, 50, 0.6, 2.5), 0.0, 0.9)
tt = t_(d)
sw = np.clip(tt / 1.3, 0, 1) ** 1.8 * np.exp(-np.clip(tt - 1.35, 0, None) / 0.6)
chord = sum(lp(saw(f, d, 0.003) + saw(f, d, -0.004), 1800) for f in (73.42, 110.0, 146.83, 220.0))  # D2 A2 D3 A3: open fifths
x += 0.22 * chord * sw
x = at(x, drum(160, 70, 0.3, 1.6), 1.32, 0.6)  # accent on the ellipsis dots
shimmer = sum(np.sin(2 * np.pi * f * tt) for f in (880, 1318.5, 1760)) * np.clip((tt - 1.3) / 0.05, 0, 1) * np.exp(-np.clip(tt - 1.3, 0, None) / 0.9) * 0.05
x += shimmer
save('sting_series', reverb(x, 3.0, 0.32, 2400), -1)

# ---------------------------------------------------------------- cliffhanger sting
d = 3.0
tt = t_(d)
sw = np.clip(tt / 1.1, 0, 1) ** 2 * np.exp(-np.clip(tt - 1.15, 0, None) / 0.5)
c = sum(lp(saw(f, d, 0.002) + saw(f, d, -0.003), 900) for f in (55.0, 58.27, 82.41))  # A1, Bb1, E2: tense
x = 0.3 * c * sw
x = at(x, drum(110, 42, 0.7, 2.0), 1.12, 0.9)
save('sting_cliff', reverb(x, 2.8, 0.35, 1500), -1)

# ---------------------------------------------------------------- single low note (V06, prisoners)
d = 9
tt = t_(d)
vib = 1 + 0.004 * np.sin(2 * np.pi * 4.8 * tt)
ph = np.cumsum(55.0 * vib) / SR
note = lp(2 * (ph - np.floor(ph + 0.5)), 420, 2) + 0.4 * np.sin(2 * np.pi * ph)
note *= adsr(len(note), 1.2, 2.5)
save('lownote', reverb(note, 3.0, 0.4, 900), -4)

# ---------------------------------------------------------------- air-raid siren (distant)
d = 14
tt = t_(d)
f = np.where(tt < 3.5, 170 + 380 * (tt / 3.5) ** 0.7, 550 + 25 * np.sin(2 * np.pi * 0.35 * (tt - 3.5)))
f = np.where(tt > 10.5, 550 - 330 * (np.clip(tt - 10.5, 0, None) / 3.5) ** 1.2, f)
ph = np.cumsum(f) / SR
sir = np.sign(np.sin(2 * np.pi * ph)) * 0.3 + np.sin(2 * np.pi * ph) + 0.4 * np.sin(4 * np.pi * ph)
sir = lp(bp(sir, 150, 2600), 2200) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.6 * tt))
sir *= adsr(len(sir), 0.5, 2.0)
save('siren', reverb(sir, 3.5, 0.55, 1800, 0.04), -3)

# ---------------------------------------------------------------- distant explosions (4 variants, no screams)
for v in range(4):
    d = 4.5
    e = 0.9 * lp(noise(d), 220 + 60 * v) * env_exp(d, 0.35 + 0.1 * v) + sweep_sine(60 - 5 * v, 30, d) * env_exp(d, 0.5) * 0.8
    e = np.roll(e, int(0.01 * SR * v))
    save(f'explosion_far_{v}', reverb(lp(e, 700), 3.5, 0.5, 700, 0.05), -2)

# ---------------------------------------------------------------- desert wind gust (the comic beat)
d = 3.2
tt = t_(d)
g = noise(d)
g = bp(g, 250, 2200) * np.sin(np.pi * np.clip(tt / 2.9, 0, 1)) ** 2.2
g += 0.4 * bp(noise(d), 1500, 4500) * np.sin(np.pi * np.clip((tt - 0.6) / 1.8, 0, 1)) ** 3
save('wind_gust', reverb(g, 1.5, 0.25, 4000), -3)

# ---------------------------------------------------------------- sonar ping
d = 3.0
p = np.sin(2 * np.pi * 1180 * t_(d)) * np.clip(t_(d) / 0.004, 0, 1) * env_exp(d, 0.35) + 0.25 * np.sin(2 * np.pi * 2360 * t_(d)) * env_exp(d, 0.12)
x = p.copy()
x = at(x, p * 0.25, 0.42); x = at(x, p * 0.1, 0.84)
save('sonar', reverb(x, 2.5, 0.45, 3500), -3)

# ---------------------------------------------------------------- snapping cable
d = 2.5
tt = t_(d)
crack = hp(noise(d), 1500) * env_exp(d, 0.006)
twang = sweep_sine(950, 180, d) * env_exp(d, 0.35) * 0.5 + sweep_sine(1900, 300, d) * env_exp(d, 0.2) * 0.2
recoil = bp(noise(d), 200, 2000) * np.exp(-((tt - 0.25) / 0.18) ** 2) * 0.35
save('snap', reverb(crack + twang + recoil, 1.8, 0.3, 3000), -0.5)

# ---------------------------------------------------------------- low wind tone (after the snap)
d = 30
tt = t_(d)
wl = lp(noise(d), 380, 2) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.09 * tt) * np.sin(2 * np.pi * 0.023 * tt + 1))
wl += 0.25 * bp(noise(d), 500, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * tt + 2))
wl *= adsr(len(wl), 1.5, 3.0)
save('wind_low', reverb(wl, 2.5, 0.3, 900), -4)

# ---------------------------------------------------------------- crackle (between the Navy and Army icons)
d = 3.5
cr = np.zeros(int(d * SR))
for _ in range(220):
    i = rng.integers(0, len(cr) - 400); n = rng.integers(20, 300)
    cr[i:i + n] += rng.standard_normal(n) * rng.uniform(0.2, 1.0) * np.exp(-np.arange(n) / (n / 4))
buzz = np.sign(np.sin(2 * np.pi * 100 * t_(d))) * 0.08 * (rng.random(len(cr)) > 0.6)
cr = bp(cr + lp(buzz, 900), 400, 6000) * adsr(len(cr), 0.15, 0.6)
save('crackle', reverb(cr, 0.8, 0.2, 5000), -3)
