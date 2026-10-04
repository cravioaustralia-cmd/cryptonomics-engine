"""lf03 mix at 1x: voice (untouched apart from the one bleep) + scene-led music beds + picture-sync effects -> build/mix.wav.
No loudnorm here. The 1.28x stretch and the two-pass loudnorm run on the finished master only (speed_master.py).
Recipe carried over from the lf01 film: beds sit far under the voice while it talks, come up (not full) in pauses,
and a speech-band margin keeper holds everything else at least 12 dB under the voice."""
import json, os, subprocess
import numpy as np
import pyloudnorm as pyln
import scipy.io.wavfile as wf
from scipy import signal as sg
from scipy.ndimage import maximum_filter1d
import scenes as SC

EP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
BUILD = os.path.join(EP, 'build')
os.makedirs(BUILD, exist_ok=True)
SR = 48000
N = int(SC.DUR * SR)
db = lambda x: 10 ** (x / 20)
meter = pyln.Meter(SR)


def load(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def lufs(x):
    return meter.integrated_loudness(x.astype(np.float64))


# ------------------------------------------------------------------ voice: placed as recorded, one bleep
vo = np.zeros((N, 2), np.float32)
for k, c in SC.T.items():
    x = load(os.path.join(EP, 'audio', 'vo', k + '.mp3'))
    i = int(round(c['start'] * SR))
    vo[i:i + len(x)] += x[: N - i]
VO_LUFS = lufs(vo)
print(f'voice assembled, untouched: {VO_LUFS:.1f} LUFS')

# S22 bleep. Edges measured on the waveform: the "p" release at 26.27 s, the "ss" ends at 26.53 s, "off" starts at 26.54 s.
B0, B1 = SC.S('S22') + 26.24, SC.S('S22') + 26.545
i0, i1 = int(B0 * SR), int(B1 * SR)
ctx = vo[int((B0 - 2.0) * SR):i0, 0]
speech_rms = np.sqrt((ctx[np.abs(ctx) > 0.01] ** 2).mean())
tt = np.arange(i1 - i0) / SR
ramp = np.minimum(1, np.minimum(tt, tt[-1] - tt) / 0.006)
tone = (np.sin(2 * np.pi * 1000 * tt) * np.sqrt(2) * speech_rms * db(-3) * ramp).astype(np.float32)
vo[i0:i1] = tone[:, None]
BLEEP = {'take': 'S22', 'word': 'piss', 'start_1x': round(B0, 3), 'end_1x': round(B1, 3), 'in_take': [26.24, 26.545], 'tone': '1 kHz sine, 3 dB under the surrounding speech RMS'}
print('bleep', BLEEP)

# speech activity with 150 ms look-ahead (beds are already down before a word starts)
HOP = 64
win = int(0.03 * SR)
env = np.sqrt(np.convolve((vo ** 2).mean(1), np.ones(win) / win, mode='same'))[::HOP]
act = (env > db(-52)).astype(np.float32)
la = int(0.15 * SR / HOP)
act = maximum_filter1d(act, size=2 * la + 1)
a_up, a_dn = np.exp(-1 / (0.06 * SR / HOP)), np.exp(-1 / (0.45 * SR / HOP))
sm = np.zeros_like(act)
for j in range(1, len(act)):
    a = a_up if act[j] > sm[j - 1] else a_dn
    sm[j] = a * sm[j - 1] + (1 - a) * act[j]
voact = np.interp(np.arange(N), np.arange(len(sm)) * HOP, sm).astype(np.float32)

# ------------------------------------------------------------------ music
TR = {'tense': ('tense-vertigo-597.mp3', 'Vertigo, Eugenio Mininni (Mixkit 597)'),
      'inv': ('investigative-feedback-dreams-588.mp3', 'Feedback Dreams, Eugenio Mininni (Mixkit 588)'),
      'sombre': ('sombre-piano-classical-7-714.mp3', 'Classical 7, Jonny S. (Mixkit 714)'),
      'surge': ('poll-surge-dreaming-big-31.mp3', 'Dreaming Big, Ahjay Stelino (Mixkit 31)')}
_tr = {}


def seg(key, s0, n):
    if key not in _tr:
        _tr[key] = load(os.path.join(EP, 'audio', 'music', TR[key][0]))
    x = _tr[key]
    out = x[int(s0 * SR):int(s0 * SR) + n]
    xf = int(2.0 * SR)
    while len(out) < n:   # loop with a 2 s crossfade if a section outlasts the track
        ramp = np.linspace(0, 1, xf)[:, None]
        head = x[:xf] * ramp
        out = np.concatenate([out[:-xf], out[-xf:] * (1 - ramp) + head, x[xf:]])
    return out[:n]


UNDER = VO_LUFS - 23.0   # under the voice: felt more than heard
GAP = VO_LUFS - 11.0     # pauses: up, never full
music = np.zeros((N, 2), np.float32)
CUES = []
for key, t0, t1, s0, fi, fo, label in SC.MUSIC:
    a, b = int(t0 * SR), min(N, int(t1 * SR))
    x = seg(key, s0, b - a)
    ref = lufs(_tr[key][int(s0 * SR):int(s0 * SR) + max(b - a, 3 * SR)])
    base = db(GAP - ref)
    g = base * (1 - voact[a:b] * (1 - db(UNDER - GAP)))
    t = np.arange(b - a) / SR
    f = np.minimum(1, t / max(fi, 0.01)) * np.minimum(1, ((b - a) / SR - t) / max(fo, 0.01))
    music[a:b] += x * (g * f)[:, None]
    CUES.append(('music', t0, t1, f'{TR[key][1]} from {s0:.0f} s, fade in {fi} s / out {fo} s', label))

# ------------------------------------------------------------------ effects: on picture events
FILES = {'series_sting': 'series_sting.flac', 'whoosh': 'whoosh.wav', 'camera_shutter': 'camera_shutter.wav', 'typewriter_key': 'typewriter_key.wav',
         'coin': 'coin.wav', 'door': 'door.wav', 'paper_tear': 'paper_tear.mp3', 'gavel': 'gavel.mp3', 'bell': 'bell.wav'}
sfx = np.zeros((N, 2), np.float32)
VO_PEAK = np.abs(vo).max()
used = {}
for t, name, gain, label in sorted(SC.SFX):
    x = load(os.path.join(EP, 'audio', 'sfx', FILES[name]))
    if name == 'whoosh':
        x = x[: int(1.6 * SR)]
        x[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
    i = int(t * SR)
    g = VO_PEAK * db(gain) / (np.abs(x).max() + 1e-9)
    n = min(len(x), N - i)
    sfx[i:i + n] += x[:n] * g
    used[name] = used.get(name, 0) + 1
    CUES.append(('sfx', t, t + len(x) / SR, f'{FILES[name]} ({gain:+d} dB re voice peak)', label))
assert used.get('gavel', 0) == 1, 'the gavel is used exactly once (court beat)'
print('effects used:', used)

# beds tuck under the voice: presence dip on music, extra duck on effects
sos_dip = sg.butter(2, [1500 / (SR / 2), 4000 / (SR / 2)], 'bandpass', output='sos')
band = np.stack([sg.sosfilt(sos_dip, music[:, c]) for c in range(2)], 1).astype(np.float32)
music = music - band * (1 - db(-7)) * voact[:, None]
sfx = sfx * (1 - voact * (1 - db(-16)))[:, None]

# margin keeper: wherever the voice sounds, music + effects stay >= 12 dB under it in the speech band
sos_sp = sg.butter(4, [200 / (SR / 2), 5000 / (SR / 2)], 'bandpass', output='sos')
F = int(0.02 * SR)


def frames_db(x):
    y = sg.sosfilt(sos_sp, x[:, 0] + x[:, 1]) / 2
    n = len(y) // F
    return 20 * np.log10(np.sqrt((y[: n * F].reshape(n, F) ** 2).mean(1)) + 1e-9)


vr = frames_db(vo)
for _ in range(3):
    br = frames_db(music + sfx)
    need = np.where(vr > -45, np.minimum(0.0, (vr - 12.0) - br), 0.0)
    need = -maximum_filter1d(-need, size=9)
    g = np.zeros_like(need)
    for j in range(1, len(need)):
        a = 0.37 if need[j] < g[j - 1] else 0.92
        g[j] = a * g[j - 1] + (1 - a) * need[j]
    gl = np.interp(np.arange(N), np.arange(len(g)) * F + F / 2, db(g)).astype(np.float32)[:, None]
    music, sfx = music * gl, sfx * gl
mix = vo + music + sfx

# word safety: every voiced 20 ms frame, voice vs everything else in the speech band
vr, br = frames_db(vo), frames_db(music + sfx)
live = vr > -40
ms = (vr - br)[live]
safety = {'voiced_frames': int(live.sum()), 'min_db': float(ms.min()), 'p1_db': float(np.percentile(ms, 1)), 'median_db': float(np.median(ms))}
print('word safety:', safety)

wf.write(os.path.join(BUILD, 'mix.wav'), SR, mix.astype(np.float32))
pre = lufs(mix)
print(f'1x pre-master mix: {pre:.1f} LUFS, sample peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS, {N / SR:.2f} s')
json.dump({'vo_lufs_untouched': VO_LUFS, 'premaster_1x_lufs': pre, 'bleep': BLEEP, 'word_safety': safety, 'effects_used': used,
           'under_db_re_voice': -23.0, 'gap_db_re_voice': -11.0}, open(os.path.join(BUILD, 'mix.json'), 'w'), indent=1)
json.dump(CUES, open(os.path.join(BUILD, 'cues.json'), 'w'), indent=1)
