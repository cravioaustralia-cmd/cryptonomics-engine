"""lf02 mix at 1x: VO (untouched files, one static gain, no loudnorm) + music cues that change with the emotion +
environment beds only where the picture shows them + sparse picture-sync hits -> build/mix.wav (pre-master).
The 1.28x master and its two-pass loudnorm happen in speed_master.py, on the master only.

VO placement follows timeline.json 'play' segments: V27 and V31 skip spoken delivery instructions (see
build_timeline.py); the take files themselves are never modified.
Picture-sync hits (pin_thunk, click, tick) sit in a gap between words or on the cut, never over a word: a hit
whose time falls inside a Whisper word is moved to the nearest inter-word gap within 0.4 s, or dropped.
Every cue is written to build/cuesheet.json -> CUE_SHEET.md, so the sheet and the mix cannot drift apart.
"""
import json, os, subprocess
import numpy as np
import pyloudnorm as pyln
from scipy import signal as _sig
from scipy.ndimage import maximum_filter1d
import scipy.io.wavfile as wf

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
BUILD = os.path.join(EP, 'build')
os.makedirs(BUILD, exist_ok=True)
SR = 48000
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
CH = TL['chunks']
BR = {b['id']: b for b in TL['broll']}
KB = {k['id']: k for k in TL['kb']}
MK = TL['marks']
DUR = TL['duration']
N = int(DUR * SR) + SR
CUES = json.load(open(os.path.join(HERE, 'cues.json')))


def norm(x):
    import re
    return re.sub(r'[^a-z0-9]', '', x.lower())


def A(k, w, occ=0, off=0.0, end=False):
    n = 0
    for x in CH[k]['words']:
        if norm(x['w']).startswith(norm(w)):
            if n == occ:
                return (x['e'] if end else x['s']) + off
            n += 1
    raise KeyError((k, w, occ))


S = lambda k: CH[k]['start']
E = lambda k: CH[k]['end']


def load(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def db(x):
    return 10 ** (x / 20)


meter = pyln.Meter(SR)


def lufs(x):
    try:
        return meter.integrated_loudness(x.astype(np.float64))
    except Exception:
        return -70.0


# ------------------------------------------------------------------ VO (placement only, one static gain = unity)
vo = np.zeros((N, 2), np.float32)
for k, c in CH.items():
    x = load(os.path.join(EP, 'audio', 'vo', k + '.mp3'))
    for seg in c['play']:
        a, n = int(round(seg['src'] * SR)), int(round(seg['len'] * SR))
        part = x[a:a + n].copy()
        f = int(0.015 * SR)                                   # 15 ms fades at edit points (in room tone)
        if seg['src'] > 0:
            part[:f] *= np.linspace(0, 1, f)[:, None]
        if a + n < len(x):
            part[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int(round(seg['at'] * SR))
        vo[i:i + len(part)] += part
VO_LUFS = lufs(vo[: int(E('V36') * SR)])
print(f'VO integrated (assembled, untouched): {VO_LUFS:.1f} LUFS')

# speech activity with look-ahead: beds are already down before a word starts
HOP = 64
win = int(0.03 * SR)
env = np.sqrt(np.convolve((vo ** 2).mean(1), np.ones(win) / win, mode='same'))[::HOP]
act = (env > db(-52)).astype(np.float32)
la = int(0.15 * SR / HOP)
act = maximum_filter1d(act, size=2 * la + 1)
a_up, a_dn = np.exp(-1 / (0.06 * SR / HOP)), np.exp(-1 / (0.45 * SR / HOP))
sm = np.zeros_like(act)
for i in range(1, len(act)):
    a = a_up if act[i] > sm[i - 1] else a_dn
    sm[i] = a * sm[i - 1] + (1 - a) * act[i]
voact = np.interp(np.arange(N), np.arange(len(sm)) * HOP, sm).astype(np.float32)

# ------------------------------------------------------------------ music
MUS = os.path.join(EP, 'audio', 'music')
TRACKS = {
    'SD': ('silent-descent-614.mp3', 'Silent Descent — Eugenio Mininni (Mixkit 614)'),
    'DD': ('dark-drama-605.mp3', 'Dark Drama — Eugenio Mininni (Mixkit 605)'),
    'BT': ('between-two-evils-1020.mp3', 'Between Two Evils — Michael Ramir C. (Mixkit 1020)'),
    'EC': ('echoes-188.mp3', 'Echoes — Andrew Ev (Mixkit 188)'),
    'CU': ('curiosity-480.mp3', 'Curiosity — Diego Nava (Mixkit 480)'),
    'FA': ('fallen-asper-565.mp3', 'Fallen (Asper) — Eugenio Mininni (Mixkit 565)'),
    'VA': ('vastness-184.mp3', 'Vastness — Andrew Ev (Mixkit 184)'),
    'JO': ('the-journey-79.mp3', 'The Journey — Ahjay Stelino (Mixkit 79)'),
}
_cache = {}


def track(k):
    if k not in _cache:
        _cache[k] = load(os.path.join(MUS, TRACKS[k][0]))
    return _cache[k]


UNDER = VO_LUFS - 23.0   # under narration: a quiet bed, the voice always clearer
GAP = VO_LUFS - 11.0     # pauses, openings, edit gaps: up to a normal level, never full
music = np.zeros((N, 2), np.float32)
CUESHEET = []


def music_cue(key, t0, t1, src0, fin, fout, label='', beat='', gap_adj=0.0):
    x = track(key)
    i0, i1 = int(t0 * SR), int(t1 * SR)
    s0 = int(src0 * SR)
    n = i1 - i0
    assert s0 + n <= len(x), (key, src0, t1 - t0, len(x) / SR)
    seg = x[s0:s0 + n]
    ref = lufs(x[s0:s0 + max(n, SR * 3)])
    base = db(GAP + gap_adj - ref)
    duck = db(UNDER - (GAP + gap_adj))
    g = base * (1 - voact[i0:i1] * (1 - duck))
    tt = np.arange(n) / SR
    f = np.minimum(1, tt / max(fin, 0.01)) * np.minimum(1, (n / SR - tt) / max(fout, 0.01))
    music[i0:i1] += seg * (g * f)[:, None]
    CUESHEET.append(('music', t0, t1, f'{TRACKS[key][0]} from {src0:.1f}s; fade in {fin}s / out {fout}s', label, beat))


SFXD = os.path.join(EP, 'audio', 'sfx')
sfx = np.zeros((N, 2), np.float32)
amb = np.zeros((N, 2), np.float32)
hits = np.zeros((N, 2), np.float32)


def sfx_cue(name, t, gain_db, label, beat, dur=None, fout=0.0, fin=0.0, bus=None):
    x = load(os.path.join(SFXD, name + '.flac'))
    if dur and dur * SR > len(x):                       # environment beds tile to the shot length
        reps = int(np.ceil(dur * SR / len(x)))
        x = np.concatenate([x] * reps)
    if dur:
        x = x[: int(dur * SR)].copy()
    if fin:
        k = min(len(x), int(fin * SR)); x[:k] *= np.linspace(0, 1, k)[:, None]
    if fout:
        k = min(len(x), int(fout * SR)); x[-k:] *= np.linspace(1, 0, k)[:, None]
    if t < 0:
        x = x[int(-t * SR):]
        t = 0.0
    i = int(t * SR)
    pk = np.abs(x).max() + 1e-9
    g = db(VO_LUFS + 14 + gain_db) / pk
    m = min(len(x), N - i)
    {'amb': amb, 'hits': hits}.get(bus, sfx)[i:i + m] += x[:m] * g
    CUESHEET.append(({'amb': 'amb', 'hits': 'sync'}.get(bus, 'sfx'), t, t + m / SR, f'{name}.flac ({gain_db:+.0f} dB)', label, beat))


def shot_amb(bid, name, gain_db, label):
    bb = BR[bid]
    sfx_cue(name, bb['tIn'] - 0.25, gain_db, label, f"{bid} ({bb['note']})", dur=bb['dur'] + 0.8, fin=0.35, fout=0.8, bus='amb')


b = BR
# ===== COLD OPEN: tension =====
sfx_cue('oars', 0.0, -12, 'Oars from frame 1 (synthesised in the project, make_oars.py)', 'V01 / B01', dur=b['B01']['tOut'] + 0.3, fin=0.2, fout=0.8, bus='amb')
shot_amb('B01', 'sea', -20, 'Quiet sea under the boats')
sfx_cue('drone', 0.0, -15, 'Low drone from frame 1', 'V01', dur=E('V01') + 1.0, fin=0.3, fout=1.0)
sfx_cue('low_note', A('V01', 'lost'), -9, 'One deep note on "lost"', 'V01', dur=6.0, fout=2.5)
music_cue('SD', S('V02') - 0.5, MK['title'] - 0.05, 20.0, 1.5, 0.4, label='Tension: the most famous defeat, then the what-if', beat='V02-V04')
sfx_cue('series_sting', MK['title'], -3, '"IF AUSTRALIA..." series sting as the title builds', 'V04 gap 2.5 s')
# ===== ACT 1: the back door =====
music_cue('CU', S('V05') - 0.2, S('V09') - 0.3, 8.0, 1.0, 0.9, label='Geography and the plan (curious, moving)', beat='V05-V08')
shot_amb('B04', 'rain', -14, 'Rain on the Western Front trench')
music_cue('SD', S('V09') - 0.3, E('V10') + 0.2, 80.0, 1.0, 0.6, label='Tension: the fleet, the minelayer at night', beat='V09-V10')
music_cue('DD', S('V11') - 0.2, E('V11') + 0.02, 30.0, 0.6, 0.05, label='War: three battleships sunk; cuts dead for the boom and the silence', beat='V11')
sfx_cue('underwater', E('V11') + 0.05, -8, 'Muffled underwater rumble, then silence (1.5 s gap)', 'V11 gap', dur=1.6, fout=1.0)
sfx_cue('boom', E('V11') + 0.05, -6, 'Muffled boom into the gap', 'V11 gap', dur=1.5, fout=1.1)
music_cue('FA', S('V12') - 0.1, E('V12') + 0.05, 40.0, 1.6, 0.3, label='Plans and argument: the first what-if', beat='V12')
sfx_cue('cliff_sting', E('V12') + 0.05, -7, 'Cliffhanger sting (Act 1 ends)', 'V12', dur=2.4, fout=1.2)
# ===== ACT 2: the landing =====
music_cue('BT', S('V13') - 0.2, E('V16') + 0.4, 10.0, 1.2, 0.8, label='War: the landing and the heights (heavy, insistent)', beat='V13-V16')
shot_amb('B10', 'sea', -16, 'Sea under the rowing boats')
shot_amb('B11', 'sea', -15, 'Surf on the pebbly beach')
music_cue('SD', S('V16b') - 0.2, E('V16b') + 0.9, 30.0, 1.2, 0.9, label='Tension and wonder: AE2 under the minefields', beat='V16b + gap 1 s')
music_cue('DD', S('V17') - 0.1, E('V18') + 0.9, 120.0, 0.9, 0.9, label='War: trenches, heat and snow, the August breakout', beat='V17-V18 + gap 1 s')
shot_amb('B14', 'low_wind', -12, 'Wind under the night snowstorm')
for c in [c for c in CUES if c['kind'] == 'pin' and S('V18') <= c['t'] <= E('V18')]:
    pass  # the August pins thunk via the shared pin cues below (louder)
music_cue('EC', S('V19') - 0.3, S('V21') - 0.3, 30.0, 1.2, 1.0, label='Loss and quiet: the escape at night', beat='V19-V20')
shot_amb('B16', 'sea', -16, 'Night sea, ships waiting offshore')
sfx_cue('strings_pad', S('V21') - 0.3, -9, 'Strings only: graves, Lone Pine, the memorial counters; beds out', 'V21 + gap 2 s', dur=S('V22') - S('V21') + 0.3, fin=0.6, fout=1.3)
# ===== ACT 3: what if they'd won? (the what-if can lift) =====
music_cue('VA', S('V22') - 0.1, E('V24') + 0.3, 20.0, 1.4, 0.9, label='What-if lift: the fleet sails through, Constantinople, Bulgaria', beat='V22-V24')
music_cue('FA', S('V25') - 0.2, E('V27') + 0.05, 120.0, 1.0, 0.3, label='Plans and argument: Russia, the counter-case, the borders', beat='V25-V27')
sfx_cue('cliff_sting', E('V27') + 0.05, -7, 'Cliffhanger sting (Act 3 ends), then 1.5 s hold', 'V27', dur=1.5, fout=0.9)
# ===== ACT 4: the twist =====
music_cue('EC', S('V28') - 0.1, E('V29') + 0.3, 100.0, 1.2, 0.9, label='Loss and reflection: a nation through defeat', beat='V28-V29')
music_cue('JO', S('V30') - 0.2, E('V30') + 0.3, 0.0, 1.0, 0.8, label='Warm: Anzac Day', beat='V30')
music_cue('FA', S('V31') - 0.1, E('V32') + 0.3, 200.0, 1.0, 0.9, label='What-if and reflection: a date in a textbook; Atatürk', beat='V31-V32')
music_cue('JO', S('V33') - 0.2, DUR, 12.0, 1.4, 3.5, label='Warm: the dawn service, the memorial, the outro under the badge and end screen', beat='V33-V36 + end screen', gap_adj=1.5)
shot_amb('B30', 'sea', -18, 'Waves at the dawn service beach')
shot_amb('B32', 'sea', -14, 'Waves on the pebbly beach')

# ===== PICTURE SYNC: hits moved off the words =====
ALLW = sorted((w['s'], w['e']) for c in CH.values() for w in c['words'])


def free_time(t, length):
    def clear(x):
        return all(not (s - 0.04 < x + length and x < e + 0.02) for s, e in ALLW if s < x + 1 and e > x - 1)
    if clear(t):
        return t
    best = None
    for d in np.arange(0.02, 0.41, 0.02):
        for x in (t - d, t + d):
            if clear(x):
                best = x
                break
        if best is not None:
            break
    return best


moved = dropped = 0
for c in CUES:
    name, gain, L = {'pin': ('pin_thunk', -13, 0.18), 'click': ('click', -17, 0.08), 'tick': ('tick', -17, 0.06)}.get(c['kind'], (None, 0, 0))
    if not name:
        continue
    if c['kind'] == 'pin' and S('V18') <= c['t'] <= E('V18'):
        gain = -8   # V18: pins light up with thunks
    t = free_time(c['t'], L)
    if t is None:
        dropped += 1
        continue
    if abs(t - c['t']) > 1e-3:
        moved += 1
    sfx_cue(name, t, gain, f"{c['label']}" + (f' (moved {t - c["t"]:+.2f} s off a word)' if abs(t - c['t']) > 1e-3 else ''), 'picture sync', bus='hits')
print(f'sync hits: moved {moved}, dropped {dropped} (would have sat on a word)')

# beds tuck under the voice
sos_dip = _sig.butter(2, [1500 / (SR / 2), 4000 / (SR / 2)], 'bandpass', output='sos')
band = np.stack([_sig.sosfilt(sos_dip, music[:, c]) for c in range(2)], 1).astype(np.float32)
music = music - band * (1 - db(-7)) * voact[:, None]
sfx = sfx * (1 - voact * (1 - db(-14)))[:, None]
amb = amb * (1 - voact * (1 - db(-10)))[:, None]

# margin keeper: wherever Atlas is sounding, beds stay >= 12 dB under the voice in the speech band
sos_sp = _sig.butter(4, [200 / (SR / 2), 5000 / (SR / 2)], 'bandpass', output='sos')
F = int(0.02 * SR)


def frames_db(x):
    y = _sig.sosfilt(sos_sp, x[:, 0] + x[:, 1]) / 2
    n = len(y) // F
    return 20 * np.log10(np.sqrt((y[: n * F].reshape(n, F) ** 2).mean(1)) + 1e-9)


vr = frames_db(vo)
for _ in range(3):
    br = frames_db(music + sfx + amb + hits)
    need = np.where(vr > -45, np.minimum(0.0, (vr - 12.0) - br), 0.0)
    need = -maximum_filter1d(-need, size=9)
    g = np.zeros_like(need)
    for i in range(1, len(need)):
        a = 0.37 if need[i] < g[i - 1] else 0.92
        g[i] = a * g[i - 1] + (1 - a) * need[i]
    gl = np.interp(np.arange(N), np.arange(len(g)) * F + F / 2, db(g)).astype(np.float32)[:, None]
    music, sfx, amb, hits = music * gl, sfx * gl, amb * gl, hits * gl
mix = vo + music + sfx + amb + hits

bed = music + sfx + amb + hits
vb = _sig.sosfilt(sos_sp, vo[:, 0] + vo[:, 1]) / 2
bb = _sig.sosfilt(sos_sp, bed[:, 0] + bed[:, 1]) / 2
nf = len(vb) // F
vr = 20 * np.log10(np.sqrt((vb[: nf * F].reshape(nf, F) ** 2).mean(1)) + 1e-9)
br = 20 * np.log10(np.sqrt((bb[: nf * F].reshape(nf, F) ** 2).mean(1)) + 1e-9)
live = vr > -40
ms = (vr - br)[live]
print(f'word safety: {live.sum()} voiced frames, voice above beds by min {ms.min():.1f} dB, 1st pct {np.percentile(ms, 1):.1f} dB, median {np.median(ms):.1f} dB')
json.dump({'voiced_frames': int(live.sum()), 'min_db': float(ms.min()), 'p1_db': float(np.percentile(ms, 1)), 'median_db': float(np.median(ms))},
          open(os.path.join(BUILD, 'word_safety.json'), 'w'), indent=1)
mix = mix[: int(DUR * SR)]
wf.write(os.path.join(BUILD, 'mix.wav'), SR, mix.astype(np.float32))
pre = lufs(mix)
print(f'pre-master mix (1x): {pre:.1f} LUFS, sample peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
json.dump({'vo_lufs_untouched': VO_LUFS, 'premaster_1x_lufs': pre}, open(os.path.join(BUILD, 'loudnorm.json'), 'w'), indent=1)
json.dump(CUESHEET, open(os.path.join(BUILD, 'cuesheet.json'), 'w'), indent=1)
