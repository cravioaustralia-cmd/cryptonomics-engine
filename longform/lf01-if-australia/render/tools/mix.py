#!/usr/bin/env python3
"""lf01 mix → out/final-mix.wav + out/LOUDNORM_REPORT.md

Voice: the 34 seated Atlas files, placed on the Whisper-locked timeline (render/timeline.json), each trimmed
  only of its head/tail silence padding. ONE static gain for all chunks, from the measured integrated loudness
  of the whole VO. No compressor, no per-chunk normalising, no time-stretch.
Music: audio/music/bed.mp3 (Kevin MacLeod, "Long note One", CC BY 4.0), looped with a 6 s crossfade.
  Ducked under the voice by a smoothed side-chain from the placed VO; level states follow the score's
  music cues (cut on "rejected", single low note on V06, strings-only on V23, lift on V29, outro…).
SFX: in-house synthesised cues from render/sfx at the score's times (out/score.json).
Master: float sum → two-pass loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP, linear).
"""
import json, os, subprocess, sys
import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.io import wavfile

EP = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..'))
R = os.path.join(EP, 'render')
OUT = os.path.join(EP, 'out')
SR = 48000
T = json.load(open(os.path.join(R, 'timeline.json')))
SC = json.load(open(os.path.join(OUT, 'score.json')))
DUR = T['duration']
N = int(np.ceil(DUR * SR))

def decode(path, ch=1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    return a.reshape(-1, ch) if ch > 1 else a

meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x if x.ndim == 2 else x[:, None])

# ---------------------------------------------------------------- voice
vo = np.zeros(N, np.float32)
speech = np.zeros(N, np.float32)
chunks = []
for s in T['segments']:
    a = decode(os.path.join(EP, 'audio', 'vo', s['id'] + '.mp3'))
    a = a[int(s['srcIn'] * SR): int(s['srcOut'] * SR)]
    s['_lufs'] = lufs(a)
    s['_a'] = a
for s in T['segments']:
    pass
MED = float(np.median([s['_lufs'] for s in T['segments']]))
TRIMS = {}
for s in T['segments']:
    a = s.pop('_a')
    d = s['_lufs'] - MED
    if abs(d) > 2.0:  # outlier take: static level match to the median take (no dynamics)
        TRIMS[s['id']] = -d
        a = a * 10 ** (-d / 20)
    i = int(round(s['start'] * SR))
    n = min(len(a), N - i)
    vo[i:i + n] += a[:n]
    chunks.append(a)
    speech[i:i + n] = 1
vo_lufs = lufs(np.concatenate(chunks))
VO_TARGET = -18.0  # premix voice level; the master pass then lifts the whole mix linearly
vo_gain_db = VO_TARGET - vo_lufs
vo *= 10 ** (vo_gain_db / 20)
print(f'VO measured {vo_lufs:.2f} LUFS → static gain {vo_gain_db:+.2f} dB')

# side-chain: smoothed VO envelope (attack 60 ms, release 700 ms)
env = np.abs(vo)
blk = 480
e = env[: len(env) // blk * blk].reshape(-1, blk).max(1)
e = np.concatenate([e, [0]])
sm = np.zeros_like(e)
att, rel = np.exp(-1 / (0.06 * SR / blk)), np.exp(-1 / (0.7 * SR / blk))
for k in range(1, len(e)):
    c = att if e[k] > sm[k - 1] else rel
    sm[k] = c * sm[k - 1] + (1 - c) * e[k]
thr = 10 ** (-42 / 20)
duck_k = np.clip((20 * np.log10(sm + 1e-9) + 42) / 12, 0, 1)  # 0 = silence, 1 = full speech
duck = np.repeat(duck_k, blk)[:N]
if len(duck) < N: duck = np.pad(duck, (0, N - len(duck)))

# ---------------------------------------------------------------- music bed (looped)
bed = decode(os.path.join(EP, 'audio', 'music', 'bed.mp3'), 2)
XF = int(6 * SR)
loop = bed.copy()
while len(loop) < N + SR:
    fade = np.linspace(0, 1, XF)[:, None]
    loop = np.concatenate([loop[:-XF], loop[-XF:] * (1 - fade) + bed[:XF] * fade, bed[XF:]])
loop = loop[:N]
bed_lufs = lufs(bed)
print(f'bed measured {bed_lufs:.2f} LUFS, looped to {DUR:.1f} s ({DUR / (len(bed) / SR):.2f}×)')
BED_BASE = VO_TARGET - 13.0 - bed_lufs  # bed sits ~13 LU under the voice in gaps …
DUCK_DB = -9.0                          # … and a further 9 dB down while the voice speaks

STATE = {'bed': 0, 'tension': 0, 'act1': 0, 'story': -1, 'north': 0, 'curious': -5, 'serious': -1.5, 'warm_respect': -3,
         'invasion': 0, 'build': 1.5, 'strings': 1.0, 'cutoff': 0, 'tense': 0, 'lift': 4, 'resolve': 2.5, 'warm': -2, 'outro': 5,
         'swell': 0}
level = np.full(N, -120.0, np.float32)
hpmask = np.zeros(N, np.float32)
cur, t_prev = 0.0, 0.0
events = sorted(SC['music'], key=lambda m: m['t'])
def ramp(t0, fade, frm, to):
    i0 = int(t0 * SR); i1 = min(N, i0 + max(1, int(fade * SR)))
    level[i0:i1] = np.linspace(frm, to, i1 - i0)
    level[i1:] = to
level[:] = BED_BASE + 0
for m in events:
    cue, t, fade = m['cue'], m['t'], m.get('fade', 0.8)
    frm = float(level[min(N - 1, int(t * SR))])
    if cue == 'cut':
        ramp(t, 0.06, frm, -120)
    elif cue in ('out', 'lownote'):
        ramp(t, fade if cue == 'out' else 0.8, frm, -120)
    elif cue == 'duck':
        ramp(t, fade, frm, BED_BASE + m['to'])
    else:
        to = BED_BASE + STATE.get(m.get('cue') if cue != 'swell' else 'swell', 0)
        ramp(t, fade if frm > -100 else max(fade, 1.4), max(frm, BED_BASE - 30), to)
    if cue == 'curious':
        hpmask[int(t * SR):] = 1
    elif cue not in ('duck',):
        hpmask[int(t * SR):] = 0
# end-screen outro: fade the music out over the last 2.5 s
level[-int(2.5 * SR):] += np.linspace(0, -40, int(2.5 * SR))
g = 10 ** ((level + DUCK_DB * duck) / 20)
mus = loop * g[:, None]
# "lighter" for the curious stretch: thin the low end of the same bed
sos = signal.butter(2, 260, 'high', fs=SR, output='sos')
thin = signal.sosfilt(sos, mus, axis=0)
mus = mus * (1 - hpmask[:, None]) + thin * hpmask[:, None]

# ---------------------------------------------------------------- sfx
SFXDIR = os.path.join(R, 'sfx')
fx = np.zeros((N, 2), np.float32)
cache = {}
def load(name):
    if name not in cache:
        sr, a = wavfile.read(os.path.join(SFXDIR, name + '.wav'))
        cache[name] = a.astype(np.float32)
    return cache[name]
SFX_TRIM = 0.0
sfx_list = list(SC['sfx'])
for m in SC['music']:
    if m['cue'] == 'lownote':
        sfx_list.append({'name': 'lownote', 't': m['t'], 'db': -6, 'len': 9.0, 'fadeOut': 2.5})
for c in sfx_list:
    name = c['name'] + (f"_{c['v']}" if c['name'] == 'explosion_far' else '')
    a = load(name).copy()
    if c.get('len'):
        L = int(c['len'] * SR)
        if len(a) < L: a = np.concatenate([a, np.zeros((L - len(a), 2), np.float32)])
        a = a[:L]
        fo = int(c.get('fadeOut', 0.3) * SR); a[-fo:] *= np.linspace(1, 0, fo)[:, None]
    if c.get('fadeIn'):
        fi = int(c['fadeIn'] * SR); a[:fi] *= np.linspace(0, 1, fi)[:, None]
    i = int(round(c['t'] * SR))
    if i >= N: continue
    if i < 0: a = a[-i:]; i = 0
    n = min(len(a), N - i)
    fx[i:i + n] += a[:n] * 10 ** ((c['db'] - 6) / 20)  # sfx bus −6 dB

pre = np.stack([vo, vo], 1) + mus + fx
pk = np.max(np.abs(pre))
print(f'premix peak {20 * np.log10(pk):.2f} dBFS')
os.makedirs(OUT, exist_ok=True)
raw = os.path.join(OUT, 'premix-raw.wav')
wavfile.write(raw, SR, pre.astype(np.float32))
# master-bus peak catch (transients only) so loudnorm pass 2 can stay linear
LIM_DB = -4.0
premix = os.path.join(OUT, 'premix.wav')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-af', f'alimiter=limit={10 ** (LIM_DB / 20):.4f}:attack=3:release=60:level=false:asc=1', '-c:a', 'pcm_f32le', premix], check=True)
_, lim = wavfile.read(premix)
act = np.abs(pre[: len(lim), 0]) > 10 ** ((LIM_DB - 0.5) / 20)
LIM_PCT = 100 * act.mean()
LIM_MAX = max(0.0, 20 * np.log10(pk) - LIM_DB)  # worst-case peak reduction
print(f'limiter: {LIM_PCT:.3f}% of samples above {LIM_DB - 0.5} dBFS, max reduction {LIM_MAX:.1f} dB')
stems = {'vo': np.stack([vo, vo], 1), 'music': mus, 'sfx': fx}
for k, v in stems.items():
    print(f'  stem {k}: {lufs(v):.1f} LUFS')

# ---------------------------------------------------------------- two-pass loudnorm on the master only
LN = 'I=-14:TP=-1.5:LRA=11'
p1 = subprocess.run(['ffmpeg', '-hide_banner', '-i', premix, '-af', f'loudnorm={LN}:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
meas = json.loads(p1[p1.rfind('{'):p1.rfind('}') + 1])
final = os.path.join(OUT, 'final-mix.wav')
p2 = subprocess.run(['ffmpeg', '-y', '-hide_banner', '-i', premix, '-af',
                     f"loudnorm={LN}:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true:print_format=json,aresample=48000",
                     '-c:a', 'pcm_s24le', final], capture_output=True, text=True).stderr
m2 = json.loads(p2[p2.rfind('{'):p2.rfind('}') + 1])
chk = subprocess.run(['ffmpeg', '-hide_banner', '-i', final, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
summ = chk[chk.rfind('Summary:'):]
def grab(key, unit):
    import re
    m = re.search(rf'{key}:\s+(-?[\d.]+) {unit}', summ); return float(m.group(1)) if m else None
I, TP, LRA = grab('I', 'LUFS'), grab('Peak', 'dBFS'), grab('LRA', 'LU')
rep = f"""# Loudness report — lf01 IF AUSTRALIA

Master: `out/final-mix.wav` (48 kHz, 24-bit), runtime {DUR:.2f} s.

| Measure | Value |
|---|---|
| Integrated loudness (ebur128, final) | **{I} LUFS** |
| True peak (ebur128, final) | **{TP} dBTP** |
| Loudness range (final) | {LRA} LU |
| Target | −14 LUFS, true peak ≤ −1.5 dBTP |

## How it was made
- **Voice:** 34 seated Atlas files, median take {MED:.2f} LUFS. One static gain of {vo_gain_db:+.2f} dB for every chunk. Outlier takes more than 2 LU off the median get a static level match only: {', '.join(f'{k} {v:+.1f} dB' for k, v in TRIMS.items()) or 'none'}. No compressor, no per-chunk normalise, no time-stretch. Only head/tail silence padding was trimmed (silencedetect, 80 ms margin).
- **Master peak catch:** `alimiter` at {LIM_DB:.0f} dBFS on the summed premix (not on the voice stem), so loudnorm pass 2 runs linear. It acts on {LIM_PCT:.3f}% of samples, maximum reduction {LIM_MAX:.1f} dB.
- **Music:** bed measured {bed_lufs:.2f} LUFS, looped with a 6 s crossfade, about 13 LU under the voice in gaps and a further {DUCK_DB:.0f} dB under speech (smoothed side-chain, 60 ms attack, 700 ms release).
- **Master:** two-pass `loudnorm` ({LN}), **master only**, linear mode.

## loudnorm pass 1 (premix measurement)
```
input_i {meas['input_i']}  input_tp {meas['input_tp']}  input_lra {meas['input_lra']}  input_thresh {meas['input_thresh']}  target_offset {meas['target_offset']}
```
## loudnorm pass 2
```
output_i {m2.get('output_i')}  output_tp {m2.get('output_tp')}  output_lra {m2.get('output_lra')}  normalization_type {m2.get('normalization_type')}
```
## ebur128 summary of the final master
```
{summ.strip()}
```
"""
open(os.path.join(EP, 'LOUDNORM_REPORT.md'), 'w').write(rep)
print(rep)
