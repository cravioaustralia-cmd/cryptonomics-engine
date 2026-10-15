#!/usr/bin/env python3
"""lf09 mix. Narration -14 LUFS / -1 dBTP; SFX ~12 dB under; music ~20 dB under speech with 150/600 ms ducking.
Outputs cache/mix/narration_1x.wav, mix_1x.wav, mix_master.wav (1.28x, pitch held, counter ticks on viewer time)."""
import json, os, re, subprocess, numpy as np
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R = os.path.join(EP, 'render')
SR = 48000; SPEED = 1.28
TL = json.load(open(os.path.join(R, 'data', 'timeline.json'))); CUES = json.load(open(os.path.join(R, 'data', 'cues.json')))
DUR = TL['duration']; N = int(round(DUR * SR))
OUT = os.path.join(R, 'cache', 'mix'); os.makedirs(OUT, exist_ok=True)
def load(p, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
def save(p, x):
    tmp = p + '.f32'; x.astype(np.float32).tofile(tmp)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(x.shape[1]), '-i', tmp, '-c:a', 'pcm_s24le', p], check=True); os.remove(tmp)
def lufs(p):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]); tp = re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS', e); return I, float(tp[-1]) if tp else None
def place(buf, x, t, gain_db=0.0):
    i = int(round(t * SR)); g = 10 ** (gain_db / 20)
    if i >= len(buf): return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n] * g
def db(x): return 20 * np.log10(max(x, 1e-12))

blocks = TL['blocks']; B = {b['id']: b for b in blocks}
# ---------------- narration ----------------
narr = np.zeros((N, 2), np.float32)
for sid, s in TL['segments'].items():
    v = load(os.path.join(R, 'cache', 'vo', sid + '.wav'), 1); place(narr, np.repeat(v, 2, 1), s['vo_start'])
# room tone bed under everything (no digital silence anywhere), ~ -52 LUFS
rt = load(os.path.join(R, 'cache', 'sfx', 'room_tone.wav'))
rt_loop = np.tile(rt, (int(np.ceil(N / len(rt))) + 1, 1))[:N]
save(os.path.join(OUT, '_rt.wav'), rt_loop[:SR * 30]); I_rt, _ = lufs(os.path.join(OUT, '_rt.wav'))
rt_loop *= 10 ** ((-52 - I_rt) / 20)
save(os.path.join(OUT, '_narr_raw.wav'), narr); I_n, _ = lufs(os.path.join(OUT, '_narr_raw.wav'))
narr *= 10 ** ((-14.0 - I_n) / 20)
narr_stem = narr + rt_loop
# speech envelope for ducking (10 ms frames)
hop = 480; nf = N // hop
env = np.sqrt((narr[:nf * hop, 0].reshape(nf, hop) ** 2).mean(1) + 1e-12); envdb = 20 * np.log10(env)
speech = (envdb > -45).astype(np.float32)
# hold speech flag across short word gaps (250 ms) so the music doesn't pump between words
k = 25; sp2 = speech.copy()
for i in range(1, k + 1): sp2[:-i] = np.maximum(sp2[:-i], speech[i:]); sp2[i:] = np.maximum(sp2[i:], speech[:-i])
target = np.where(sp2 > 0, -8.0, 0.0)
duck = np.zeros(nf, np.float32); g = 0.0; aA = np.exp(-0.01 / 0.150); aR = np.exp(-0.01 / 0.600)
for i in range(nf):
    a = aA if target[i] < g else aR; g = a * g + (1 - a) * target[i]; duck[i] = g
duck_s = np.repeat(10 ** (duck / 20), hop); duck_s = np.concatenate([duck_s, np.full(N - len(duck_s), duck_s[-1])])[:, None]

# ---------------- music ----------------
MUS = os.path.join(EP, 'audio', 'music')
def mfile(n): return os.path.join(MUS, [f for f in os.listdir(MUS) if f.startswith(n)][0])
mI = {}
def mload(n):
    p = mfile(n)
    if n not in mI: mI[n] = lufs(p)[0]
    return load(p) * 10 ** ((-26 - mI[n]) / 20)
s = lambda bid: B[bid]['start']; e = lambda bid: B[bid]['end']
# (track, film start, film end, track offset)
plan = [('MUS_01', 0.0, s('CH_S06') + 0.6, 0), ('MUS_02', s('CH_S06'), s('CH_S12') + 0.6, 0), ('MUS_03', s('CH_S12'), s('MR_S15'), 0),
        ('MUS_04', s('CH_S16'), s('CH_S20') + 0.6, 0), ('MUS_01', s('CH_S20'), s('MR_S27'), 40), ('MUS_02', s('CH_S28'), s('CH_S33') + 0.6, 60),
        ('MUS_05', s('CH_S33'), s('MR_S36'), 0), ('MUS_06', s('CH_S37'), s('CH_S41') + 1.5, 0)]
mus = np.zeros((N, 2), np.float32)
def lay(name, t0, t1, off, fin=1.0, fout=1.2):
    x = mload(name); a = int(off * SR); L = int((t1 - t0) * SR)
    seg = x[a:a + L]
    if len(seg) < L: seg = np.concatenate([seg, np.tile(x, (int(np.ceil(L / len(x))) + 1, 1))[:L - len(seg)]])
    seg = seg.copy(); fi = int(fin * SR); fo = int(fout * SR)
    seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
    place(mus, seg, t0)
for (n, t0, t1, off) in plan: lay(n, t0, t1, off)
# closing: MUS_06 positioned so the track's own ending lands on the end of the end screen (resolve)
x6 = mload('MUS_06'); L6 = len(x6) / SR; t_start = DUR - L6
seg = x6.copy(); fi = int(1.5 * SR); xs = s('CH_S41') - 0.0
cut = int((xs - t_start) * SR); seg = seg[cut:]; seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-int(2.0 * SR):] *= np.linspace(1, 0, int(2.0 * SR))[:, None]
place(mus, seg, xs)
# quiet moments: music drops lower (S12 single sustained feel, S43)
for bid, extra in [('S12', -8), ('S43', -4)]:
    a, b = int(B[bid]['start'] * SR), int(B[bid]['end'] * SR); r = int(0.8 * SR)
    gcurve = np.ones(N, np.float32); gcurve[a:b] = 10 ** (extra / 20)
    gcurve[a:a + r] = np.linspace(1, 10 ** (extra / 20), r); gcurve[b - r:b] = np.linspace(10 ** (extra / 20), 1, r); mus *= gcurve[:, None]
# mid-rolls: music fully out
for bid in ['MR_S15', 'MR_S27', 'MR_S36']:
    a, b = int(B[bid]['start'] * SR), int(B[bid]['end'] * SR); mus[a:b] = 0
mus *= duck_s

# ---------------- SFX ----------------
def sfx_bus(include_ticks_at=None):
    bus = np.zeros((N, 2), np.float32); cache = {}
    for c in CUES['sfx']:
        if c['name'] not in cache: cache[c['name']] = load(os.path.join(R, 'cache', 'sfx', c['name'] + '.wav'))
        place(bus, cache[c['name']], c['t'], c['gain'] - 6)
    return bus
sfx = sfx_bus()
def tick_times(viewer_speed):
    cs, ce, hid = CUES['counter']['start'], CUES['counter']['end'], CUES['counter']['hidden']
    out = []; k = 1
    while True:
        tv = k * 108; tf = tv * viewer_speed
        if tf >= ce: break
        if tf >= cs and not any(a <= tf < b for a, b in hid): out.append((tv, tf))
        k += 1
    return out
click = load(os.path.join(R, 'cache', 'sfx', 'click.wav'))
ticks1 = tick_times(1.0)
tick_bus1 = np.zeros((N, 2), np.float32)
for tv, tf in ticks1: place(tick_bus1, click, tf, -10)

full = narr_stem + mus + sfx + tick_bus1
save(os.path.join(OUT, 'narration_1x.wav'), narr_stem)
save(os.path.join(OUT, '_premaster_1x.wav'), full)
save(os.path.join(OUT, '_premaster_noticks.wav'), narr_stem + mus + sfx)
json.dump({'ticks_1x': ticks1, 'ticks_master': tick_times(SPEED), 'music_I': mI}, open(os.path.join(R, 'data', 'mix_info.json'), 'w'), indent=1)
print('built premix; ticks 1x', len(ticks1), 'master', len(tick_times(SPEED)))
