"""lf01 mix: VO (untouched, one static gain) + designed music cues + sparse SFX -> build/mix.wav.
Then two-pass loudnorm on the MASTER only (-14 LUFS, true peak <= -1.5 dBTP) -> build/master.wav.
Every cue below is also written to CUE_SHEET.md, so the sheet and the mix cannot drift apart.
"""
import json, os, subprocess, sys
import numpy as np
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
BUILD = os.path.join(EP, 'build')
os.makedirs(BUILD, exist_ok=True)
SR = 48000
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
CH = TL['chunks']
BR = {b['id']: b for b in TL['broll']}
MK = TL['marks']
DUR = TL['duration']
N = int(DUR * SR) + SR


def norm(x):
    import re
    return re.sub(r'[^a-z0-9]', '', x.lower())


def A(k, w, occ=0, off=0.0):
    n = 0
    for x in CH[k]['words']:
        if norm(x['w']).startswith(norm(w)):
            if n == occ:
                return x['s'] + off
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


# ------------------------------------------------------------------ VO (one static gain only)
vo = np.zeros((N, 2), np.float32)
for k, c in CH.items():
    x = load(os.path.join(EP, 'audio', 'vo', k + '.mp3'))
    i = int(round(c['start'] * SR))
    vo[i:i + len(x)] += x
VO_LUFS = lufs(vo[: int(E('V34') * SR)])
print(f'VO integrated (assembled, untouched): {VO_LUFS:.1f} LUFS')

# speech activity (for gentle music ducking, not voice processing)
win = int(0.05 * SR)
env = np.sqrt(np.convolve((vo ** 2).mean(1), np.ones(win) / win, mode='same'))
act = (env > db(-42)).astype(np.float32)
# attack 0.12 s / release 0.6 s smoothing
a_up, a_dn = np.exp(-1 / (0.12 * SR / 64)), np.exp(-1 / (0.6 * SR / 64))
act_ds = act[::64]
sm = np.zeros_like(act_ds)
for i in range(1, len(act_ds)):
    a = a_up if act_ds[i] > sm[i - 1] else a_dn
    sm[i] = a * sm[i - 1] + (1 - a) * act_ds[i]
voact = np.interp(np.arange(N), np.arange(len(sm)) * 64, sm).astype(np.float32)

# ------------------------------------------------------------------ music cues
MUS = os.path.join(EP, 'audio', 'music')
TRACKS = {
    'SD': ('silent-descent-614.mp3', 'Silent Descent — Eugenio Mininni (Mixkit 614)'),
    'DD': ('dark-drama-605.mp3', 'Dark Drama — Eugenio Mininni (Mixkit 605)'),
    'CU': ('curiosity-480.mp3', 'Curiosity — Diego Nava (Mixkit 480)'),
    'FA': ('fallen-asper-565.mp3', 'Fallen (Asper) — Eugenio Mininni (Mixkit 565)'),
    'VA': ('vastness-184.mp3', 'Vastness — Andrew Ev (Mixkit 184)'),
}
_cache = {}


def track(k):
    if k not in _cache:
        _cache[k] = load(os.path.join(MUS, TRACKS[k][0]))
    return _cache[k]


UNDER = VO_LUFS - 17.0   # bed under narration
GAP = VO_LUFS - 7.5     # bed in edit gaps
music = np.zeros((N, 2), np.float32)
CUESHEET = []


def music_cue(key, t0, t1, src0, fin, fout, level_under=UNDER, level_gap=GAP, label='', beat='', lift=None):
    """Place a music segment with fades; level follows the narration (under VO vs in gaps)."""
    x = track(key)
    i0, i1 = int(t0 * SR), int(t1 * SR)
    s0 = int(src0 * SR)
    n = i1 - i0
    seg = x[s0:s0 + n]
    if len(seg) < n:
        seg = np.pad(seg, ((0, n - len(seg)), (0, 0)))
    ref = lufs(x[s0:s0 + max(n, SR * 3)])
    base = db(level_gap - ref)
    duck = db(level_under - level_gap)
    g = base * (1 - voact[i0:i1] * (1 - duck))
    if lift is not None:
        g = g * np.array([db(lift(i0 / SR + j / SR)) for j in range(0, n, 480)]).repeat(480)[:n]
    t = np.arange(n) / SR
    f = np.minimum(1, t / max(fin, 0.01)) * np.minimum(1, (n / SR - t) / max(fout, 0.01))
    music[i0:i1] += seg * (g * f)[:, None]
    CUESHEET.append(('music', t0, t1, f'{TRACKS[key][1]} from {src0:.1f}s; fade in {fin}s / out {fout}s', label, beat))


sfx = np.zeros((N, 2), np.float32)
SFXD = os.path.join(EP, 'audio', 'sfx')


def sfx_cue(name, t, gain_db, label, beat, dur=None, fout=0.0):
    x = load(os.path.join(SFXD, name + '.flac'))
    if dur:
        x = x[: int(dur * SR)].copy()
        if fout:
            k = int(fout * SR)
            x[-k:] *= np.linspace(1, 0, k)[:, None]
    i = int(t * SR)
    pk = np.abs(x).max()
    # gain is relative to the VO's loudness: the SFX peak sits gain_db below (or above) VO peak level
    g = db(VO_LUFS + 14 + gain_db) / pk
    sfx[i:i + len(x)] += x[: N - i] * g
    CUESHEET.append(('sfx', t, t + len(x) / SR, f'{name}.flac ({gain_db:+.0f} dB)', label, beat))


b = BR
rej = A('V02', 'rejected')

# ===== COLD OPEN =====
sfx_cue('drone', 0.0, -15, 'Low drone from frame 1', 'V01 frame 1', dur=rej + 0.05 - 0.0, fout=0.05)
music_cue('SD', 0.0, rej + 0.03, 0.0, 0.4, 0.03, level_under=UNDER + 1, level_gap=GAP - 2, label='Tense bed under the cold open; cuts out completely on "rejected"', beat='V01-V02')
sfx_cue('boom', A('V01', 'invade') - 0.05, 0, 'Deep boom on "invade Australia"; rings through the 1 s gap', 'V01')
sfx_cue('stamp_thud', rej + 0.18, -2, 'Stamp thud as REJECTED slams', 'V02')
music_cue('SD', E('V03'), S('V06') - 0.1, 58.0, 1.5, 0.6, label='Music swells back in as the arrow re-extends; carries Act 1 opening', beat='V03 gap 1.5 s -> V05')
sfx_cue('series_sting', E('V04') + 0.1, -2, 'IF AUSTRALIA... series sting as the title builds', 'V04 gap 2.5 s')
# ===== ACT 1 =====
for w in ('hong', 'malaya', 'singapore'):
    sfx_cue('pin_thunk', A('V05', w) - 0.25 + 0.38, -10, f'Pin thunk ({w})', 'V05')
sfx_cue('low_note', S('V06') - 0.3, -13, 'Music drops to a single low note under the prisoner line and B02', 'V06 / B02', dur=b['B02']['tOut'] - S('V06') + 2.0, fout=1.6)
music_cue('SD', S('V07') - 0.2, A('V08', 'japanese') + 1.0, 75.0, 1.2, 1.0, label='Bed returns, tense and building', beat='V07')
sfx_cue('siren', b['B03']['tIn'] - 2.6, -12, 'Air-raid siren fades in, peaks over B03, fades on the pull-back', 'V08 / B03 / gap 2.5 s')
sfx_cue('explosions_distant', b['B03']['tIn'] + 0.2, -8, 'Distant explosions, no screams', 'V08 / B03')
music_cue('SD', b['B03']['tOut'] + 1.6, E('V11') + 0.15, 88.0, 2.0, 0.2, label='Bed under Curtin, Tokyo argument and the decision', beat='V09-V11')
sfx_cue('stamp_thud', A('V11', 'march') + 0.32, -12, 'Soft thud as "4 MARCH 1942" stamps onto Tokyo', 'V11')
sfx_cue('cliff_sting', E('V11') + 0.05, -1, 'Cliffhanger sting; then 1.5 s hold (mid-roll 1)', 'V11')
# ===== ACT 2 =====
sfx_cue('whoosh', MK['slam1'] - 0.55, -6, 'Whoosh into the big "1"', 'Act 2 open')
sfx_cue('drum_1', MK['slam1'] + 0.12, -1, 'Drum hit as "1" slams onto the map', 'Act 2 open')
music_cue('DD', S('V12') - 0.3, A('V13', 'geography') + 0.4, 0.0, 1.0, 1.2, label='Storytelling, then tense', beat='V12-V13')
gust = A('V15', 'that', 1, 1.25)
music_cue('CU', A('V13', 'geography') - 0.6, gust - 0.25, 10.0, 1.4, 0.35, label='Music shifts lighter and curious on "geography"', beat='V13-V15')
sfx_cue('desert_wind', gust - 0.4, -6, 'Single gust of desert wind (the comic beat) over B05', 'V15 / B05')
music_cue('CU', b['B05']['tOut'] + 0.2, E('V18') + 1.2, 40.0, 1.0, 0.9, label='Curious bed resumes for Act 2', beat='V16-V18')
sfx_cue('stamp_thud', A('V18', 'stuck') + 0.12, -10, 'Soft thud as STUCK stamps the verdict card', 'V18')
# ===== ACT 3 =====
sfx_cue('whoosh', MK['slam2'] - 0.55, -5, 'Whoosh into the big "2"', 'Act 3 open')
sfx_cue('drum_2', MK['slam2'] + 0.12, 0, 'Heavier drum hit as "2" slams on', 'Act 3 open')
music_cue('DD', S('V19') - 0.2, S('V23') - 0.3, 40.0, 0.8, 1.0, label='Dramatic bed for the full invasion', beat='V19-V22')
sfx_cue('sonar_ping', b['B07']['tIn'] + 0.05, -8, 'Sonar ping 1 (B07 periscope)', 'V20 / B07')
sfx_cue('sonar_ping', b['B07']['tOut'] + 0.3, -8, 'Sonar ping 2 (submarine icons strike)', 'V20 after B07')
sfx_cue('strings_pad', S('V23') - 0.6, -8, 'Strings only under V23 and B09', 'V23 / B09 / gap 1.5 s', dur=E('V23') + 1.5 - S('V23') + 1.2, fout=1.4)
music_cue('DD', S('V24') + 0.3, E('V24') + 0.15, 130.0, 1.5, 0.2, label='Serious, then sly', beat='V24')
sfx_cue('cliff_sting', E('V24') + 0.05, -1, 'Cliffhanger sting; then 1.5 s hold (mid-roll 2)', 'V24')
# ===== ACT 4 =====
sfx_cue('whoosh', MK['slam3'] - 0.55, -4, 'Whoosh into the big "3"', 'Act 4 open')
sfx_cue('drum_3', MK['slam3'] + 0.12, 1, 'Heaviest hit of the three as "3" slams on', 'Act 4 open')
snap = A('V26', 'supplies') + 0.25
music_cue('FA', S('V25') - 0.2, snap + 0.02, 40.0, 0.8, 0.05, level_under=UNDER + 1, label='Tense bed: the plan to cut Australia off', beat='V25-V26')
sfx_cue('cable_snap', snap - 0.5, -2, 'Snapping cable as the lifeline breaks', 'V26')
sfx_cue('low_wind', snap + 0.1, -17, 'Near silence with a low wind tone (Australia alone)', 'V26 -> gap 2 s -> V27', dur=A('V27', 'and') + 1.5 - snap, fout=1.5)
music_cue('FA', A('V27', 'and') - 0.2, A('V29', 'coral') + 1.0, 130.0, 2.0, 1.6, label='Tense turn: midget submarines, shelling, Kokoda', beat='V27-V28')
for w in ('coral', 'midway', 'kokoda', 'millan'):
    sfx_cue('pin_thunk', A('V29', w) - 0.15 + 0.38, -9, f'Pin thunk ({w}) as the four pins light up', 'V29')
held = A('V29', 'lifeline')
lift = lambda tt: 3.0 * min(1, max(0, (tt - held) / 1.2))
music_cue('VA', A('V29', 'coral') - 0.6, DUR, 0.0, 2.0, 3.5, label='Music lifts as the pins light and the lifeline redraws; resolves and holds through V30; warm under Act 5; outro under the end screen', beat='V29-V34 + end screen', lift=lift)

# ------------------------------------------------------------------ sum, master
mix = vo + music + sfx
mix = mix[: int(DUR * SR)]
import scipy.io.wavfile as wf
wf.write(os.path.join(BUILD, 'mix.wav'), SR, mix.astype(np.float32))
pre = lufs(mix)
print(f'pre-master mix: {pre:.1f} LUFS, sample peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')


def loudnorm_pass(inp, extra=''):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', inp, '-af', f'{extra}loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = out[out.rindex('{'):out.rindex('}') + 1]
    return json.loads(j)


# master chain: static make-up gain -> transparent peak limiter -> two-pass LINEAR loudnorm
gain = -14.0 - pre
CEIL = float(os.environ.get('CEIL', '-3.0'))
PRE = f'volume={gain:.2f}dB,aresample=192000,alimiter=limit={db(CEIL):.4f}:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,'
m1 = loudnorm_pass(os.path.join(BUILD, 'mix.wav'), PRE)
af = PRE + (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m1['input_i']}:measured_TP={m1['input_tp']}:"
      f"measured_LRA={m1['input_lra']}:measured_thresh={m1['input_thresh']}:offset={m1['target_offset']}:linear=true:print_format=json")
p2 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', os.path.join(BUILD, 'mix.wav'), '-af', af + ',aresample=48000:resampler=soxr:precision=28', '-c:a', 'pcm_s24le', os.path.join(BUILD, 'master.wav')], capture_output=True, text=True).stderr
m2 = json.loads(p2[p2.rindex('{'):p2.rindex('}') + 1])
check = loudnorm_pass(os.path.join(BUILD, 'master.wav'))
eb = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', os.path.join(BUILD, 'master.wav'), '-af', 'ebur128=peak=true+sample', '-f', 'null', '-'], capture_output=True, text=True).stderr
check['ebur128_summary'] = eb[eb.rindex('Summary:'):].strip()
json.dump({'vo_lufs_untouched': VO_LUFS, 'premaster_lufs': pre, 'master_chain': PRE + 'loudnorm(two-pass, linear)', 'pass1': m1, 'pass2': m2, 'verify_master': check}, open(os.path.join(BUILD, 'loudnorm.json'), 'w'), indent=1)
print('pass2 type:', m2.get('normalization_type'), '| master I', check['input_i'], 'TP', check['input_tp'], 'LRA', check['input_lra'])
json.dump(CUESHEET, open(os.path.join(BUILD, 'cuesheet.json'), 'w'), indent=1)
