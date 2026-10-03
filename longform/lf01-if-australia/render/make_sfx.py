"""In-house synthesised SFX + series sting for lf01 (numpy only; no third-party samples).
Writes audio/sfx/*.flac (48 kHz stereo, 24-bit, lossless). Every cue is listed in CUE_SHEET.md.

The "IF AUSTRALIA..." series sting (series_sting.wav) is defined here so later episodes can
regenerate the identical file: python3 make_sfx.py series_sting  (-> audio/sfx/series_sting.flac)
"""
import os, subprocess, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'audio', 'sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1942)


def t_(d):
    return np.arange(int(round(d * SR))) / SR


def env_ad(n, a, d_tau):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d_tau)
    return e


def lp(x, f, o=4):
    return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, f0, f1, o=2):
    return signal.sosfilt(signal.butter(o, [f0, f1], 'band', fs=SR, output='sos'), x)


def noise(d):
    return rng.standard_normal(int(round(d * SR)))


def sweep_sine(f0, f1, d, curve=3.0):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb(x, rt=2.2, mix=0.3, pre=0.02, bright=4000):
    """Stereo synthetic hall: decorrelated exponentially decaying noise IRs."""
    n = int(rt * SR)
    t = np.arange(n) / SR
    outs = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt)
        ir = lp(ir, bright, 2)
        ir[: int(pre * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum())
        o = signal.fftconvolve(x, ir)
        outs.append(np.pad(o, (0, max(0, len(x) + n - len(o))))[: len(x) + n])
    dry = np.pad(x, (0, n))
    return np.stack([dry * (1 - mix) + outs[0] * mix * 1.4, dry * (1 - mix) + outs[1] * mix * 1.4], 1)


def saw(f, t, phase=0.0):
    p = (np.cumsum(np.broadcast_to(f, t.shape)) / SR + phase) % 1.0
    return 2 * p - 1


def save(name, x, peak_db=-1.0):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    x = x - x.mean(0)
    pk = np.abs(x).max()
    x = x / pk * 10 ** (peak_db / 20)
    fade = min(len(x), int(0.01 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    tmp = os.path.join(OUT, name + '.tmp.wav')
    wavfile.write(tmp, SR, x.astype(np.float32))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'flac', '-sample_fmt', 's32', '-bits_per_raw_sample', '24',
                    '-compression_level', '8', os.path.join(OUT, name + '.flac')], check=True)
    os.remove(tmp)
    print(name, f'{len(x) / SR:.2f}s')


# ---------------------------------------------------------------- cues
def drone():
    d = 40.0
    t = t_(d)
    lfo = 1 + 0.25 * np.sin(2 * np.pi * 0.07 * t)
    x = 0.6 * np.sin(2 * np.pi * 41.2 * t) + 0.45 * np.sin(2 * np.pi * 55.0 * t + 0.4) * lfo
    x += 0.25 * np.sin(2 * np.pi * 82.4 * t) * (1 + 0.3 * np.sin(2 * np.pi * 0.11 * t))
    x += 0.5 * lp(noise(d), 180, 4) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t))
    x *= np.minimum(1, t / 0.25)
    return reverb(x, 3.0, 0.35, bright=900)[: len(t)]


def boom():
    d = 4.5
    n = int(round(d * SR))
    body = sweep_sine(85, 30, d, 2.2) * env_ad(n, 0.005, 1.1)
    crack = lp(noise(d), 900, 4) * env_ad(n, 0.002, 0.12) * 0.8
    rumble = lp(noise(d), 120, 4) * env_ad(n, 0.05, 1.6) * 1.6
    return reverb(body + crack + rumble, 3.5, 0.4, bright=1200)


def stamp_thud():
    d = 1.2
    n = int(round(d * SR))
    body = sweep_sine(150, 58, d, 18) * env_ad(n, 0.002, 0.13)
    click = bp(noise(d), 900, 3500) * env_ad(n, 0.0005, 0.012) * 0.9
    slap = lp(noise(d), 400) * env_ad(n, 0.001, 0.05) * 0.8
    return reverb(body + click + slap, 0.7, 0.18, bright=3000)


def drum(weight):
    """Taiko-like hit. weight 1 < 2 < 3 (heaviest)."""
    d = 2.5 + weight
    n = int(round(d * SR))
    f0 = {1: 120, 2: 100, 3: 85}[weight]
    body = sweep_sine(f0, f0 * 0.42, d, 9) * env_ad(n, 0.002, 0.35 + 0.18 * weight)
    skin = bp(noise(d), 200, 1800) * env_ad(n, 0.001, 0.03) * (0.6 + 0.15 * weight)
    x = body + skin
    if weight >= 2:
        x += 0.6 * sweep_sine(60, 32, d, 3) * env_ad(n, 0.004, 0.8)
    if weight >= 3:
        x += 0.9 * sweep_sine(48, 26, d, 1.5) * env_ad(n, 0.01, 1.6)
        x += lp(noise(d), 100) * env_ad(n, 0.03, 1.4) * 1.4
    return reverb(x, 2.0 + 0.6 * weight, 0.32, bright=2500)


def whoosh(d=0.9):
    n = int(round(d * SR))
    t = t_(d)
    x = noise(d)
    out = np.zeros(n)
    seg = 512
    for i in range(0, n, seg):
        u = i / n
        fc = 300 + 3200 * (u ** 1.5)
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], fc * 0.7, fc * 1.4)[-len(out[i:i + seg]):]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * np.minimum(1, (d - t) / 0.1)
    return reverb(out * e, 1.0, 0.2)


def low_note(d=9.0, f=73.42):
    t = t_(d)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 4.8 * t)
    x = sum(saw(f * (1 + det) * vib, t, ph) for det, ph in ((0, 0), (0.003, 0.3), (-0.0025, 0.6)))
    x = lp(x, 520, 4)
    e = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 2.0)
    return reverb(x * e, 3.0, 0.35, bright=1500)[: len(t)]


def siren(d=11.0):
    t = t_(d)
    # rise 3.2s, hold, slow fall from 7.5s
    f = np.where(t < 3.2, 160 + 400 * (t / 3.2) ** 0.7, 560)
    f = np.where(t > 7.5, 560 - 380 * np.clip((t - 7.5) / (d - 7.5), 0, 1) ** 0.8, f)
    f = f * (1 + 0.006 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph) + 0.15 * np.sin(5 * ph)
    x = lp(x, 1600, 2)  # distance
    e = np.minimum(1, t / 2.0) * np.minimum(1, (d - t) / 2.5)
    return reverb(x * e, 3.2, 0.55, bright=1400)[: len(t)]


def explosions_distant(d=8.0):
    n = int(round(d * SR))
    x = np.zeros(n)
    for at, g in ((0.6, 1.0), (2.3, 0.7), (3.4, 0.85), (5.6, 0.6)):
        k = int(at * SR)
        m = n - k
        b = lp(noise(m / SR), 160, 4) * env_ad(m, 0.01, 0.9) * 2.2 + sweep_sine(55, 28, m / SR, 2) * env_ad(m, 0.005, 0.7)
        x[k:] += g * b[:m]
    return reverb(lp(x, 400), 4.0, 0.55, bright=500)[: n]


def desert_wind(d=3.2):
    t = t_(d)
    n = len(t)
    x = noise(d)
    out = np.zeros(n)
    seg = 1024
    for i in range(0, n, seg):
        u = i / n
        fc = 500 + 900 * np.sin(np.pi * u)
        out[i:i + seg] = bp(x[max(0, i - 4096):i + seg], fc * 0.6, fc * 1.6)[-len(out[i:i + seg]):]
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    whistle = np.sin(2 * np.pi * np.cumsum(900 + 250 * np.sin(np.pi * t / d)) / SR) * 0.05
    return reverb((out + whistle) * e, 1.5, 0.3, bright=3000)


def sonar_ping(d=2.4):
    n = int(round(d * SR))
    t = t_(d)
    x = (np.sin(2 * np.pi * 1180 * t) + 0.3 * np.sin(2 * np.pi * 2360 * t)) * env_ad(n, 0.004, 0.35)
    return reverb(x, 2.4, 0.5, bright=5000)


def cable_snap(d=2.2):
    n = int(round(d * SR))
    t = t_(d)
    creak = bp(noise(0.5), 300, 900) * np.linspace(0, 1, int(0.5 * SR)) ** 2 * 0.25
    x = np.zeros(n)
    x[:len(creak)] += creak
    k = int(0.5 * SR)
    m = n - k
    crack = hp(noise(m / SR), 1500) * env_ad(m, 0.0003, 0.02) * 1.4
    twang = sum(np.sin(2 * np.pi * f * t[:m]) * env_ad(m, 0.001, tau) * a
                for f, tau, a in ((183, 0.6, 0.6), (431, 0.35, 0.4), (977, 0.2, 0.3), (1653, 0.12, 0.2)))
    whip = bp(noise(m / SR), 800, 4000) * env_ad(m, 0.001, 0.15) * 0.5
    x[k:] += crack + twang + whip
    return reverb(x, 1.6, 0.3)


def low_wind(d=12.0):
    t = t_(d)
    x = lp(noise(d), 260, 4) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t) * np.sin(2 * np.pi * 0.31 * t + 1))
    x += bp(noise(d), 300, 700) * 0.08 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t))
    e = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 2.0)
    return reverb(x * e, 2.0, 0.3, bright=800)[: len(t)]


def pin_thunk(d=0.6):
    n = int(round(d * SR))
    body = sweep_sine(210, 95, d, 30) * env_ad(n, 0.001, 0.06)
    tick = bp(noise(d), 1200, 4000) * env_ad(n, 0.0003, 0.006) * 0.5
    return reverb(body + tick, 0.5, 0.15)


def strings_pad(d=22.0):
    """Sustained string-ensemble pad for V23 (strings only). A minor -> F -> D minor -> E."""
    t = t_(d)
    chords = [(0.0, (110.0, 164.81, 220.0, 261.63)), (5.5, (87.31, 174.61, 220.0, 261.63)),
              (11.0, (73.42, 146.83, 220.0, 293.66)), (16.5, (82.41, 164.81, 207.65, 246.94))]
    x = np.zeros((len(t), 2))
    for i, (at, notes) in enumerate(chords):
        end = chords[i + 1][0] if i + 1 < len(chords) else d
        seg = (t >= at - 1.2) & (t < end + 1.6)
        tt = t[seg] - (at - 1.2)
        L = (end + 1.6) - (at - 1.2)
        e = np.minimum(1, tt / 1.8) * np.minimum(1, (L - tt) / 1.6)
        for f in notes:
            for ch in range(2):
                vib = 1 + 0.0035 * np.sin(2 * np.pi * (5.1 + 0.4 * ch) * tt + f)
                v = sum(saw(f * (1 + det) * vib, tt, rng.random()) for det in (-0.004, 0.0, 0.0045))
                x[seg, ch] += v * e / (1 + f / 400)
    x = np.stack([lp(x[:, 0], 1900, 4), lp(x[:, 1], 1900, 4)], 1)
    x[:, 0] = hp(x[:, 0], 60)
    x[:, 1] = hp(x[:, 1], 60)
    w = reverb(x[:, 0] + x[:, 1], 3.5, 0.5, bright=3500)[: len(t)]
    return 0.5 * x + 0.8 * w


def series_sting(d=4.5):
    """IF AUSTRALIA... series sting (defined here for every episode).
    One low taiko hit, a rising open-fifth brass swell on D, and a soft high shimmer that rings out."""
    t = t_(d)
    n = len(t)
    hit = drum(2)[:n, 0] * 0.9
    fs = (73.42, 110.0, 146.83, 220.0)
    sw = np.zeros(n)
    rise = np.clip((t - 0.15) / 1.4, 0, 1)
    cut = 300 + 2600 * rise ** 2
    for f in fs:
        sw += saw(f, t) + 0.5 * saw(f * 1.004, t, 0.3)
    out = np.zeros(n)
    seg = 512
    for i in range(0, n, seg):
        fc = cut[min(i, n - 1)]
        out[i:i + seg] = lp(sw[max(0, i - 4096):i + seg], fc, 2)[-len(out[i:i + seg]):]
    e = np.clip((t - 0.1) / 1.3, 0, 1) ** 1.5 * np.exp(-np.maximum(0, t - 1.7) / 0.9)
    shimmer = sum(np.sin(2 * np.pi * f * t) for f in (587.33, 880.0, 1174.66)) * \
        np.clip((t - 1.4) / 0.2, 0, 1) * np.exp(-np.maximum(0, t - 1.6) / 1.1) * 0.12
    x = hit + out * e * 0.22 + shimmer
    return reverb(x, 2.8, 0.38, bright=5000)


def cliff_sting(d=3.5):
    t = t_(d)
    n = len(t)
    hit = drum(1)[:n, 0] * 0.8
    cl = sum(saw(f, t) for f in (98.0, 103.83, 146.83, 155.56))
    cl = lp(cl, 1100, 2)
    e = np.clip((t - 0.05) / 0.35, 0, 1) * np.exp(-np.maximum(0, t - 0.6) / 0.8)
    x = hit + cl * e * 0.22
    return reverb(x, 3.0, 0.42, bright=2500)


CUES = {
    'drone': drone, 'boom': boom, 'stamp_thud': stamp_thud,
    'drum_1': lambda: drum(1), 'drum_2': lambda: drum(2), 'drum_3': lambda: drum(3),
    'whoosh': whoosh, 'low_note': low_note, 'siren': siren, 'explosions_distant': explosions_distant,
    'desert_wind': desert_wind, 'sonar_ping': sonar_ping, 'cable_snap': cable_snap,
    'low_wind': low_wind, 'pin_thunk': pin_thunk, 'strings_pad': strings_pad,
    'series_sting': series_sting, 'cliff_sting': cliff_sting,
}

if __name__ == '__main__':
    import zlib
    for k in (sys.argv[1:] or CUES):
        rng = np.random.default_rng(zlib.crc32(k.encode()))  # per-cue seed: any cue regenerates identically on its own
        save(k, CUES[k]())
