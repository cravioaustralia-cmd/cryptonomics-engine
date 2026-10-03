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

# speech activity with 150 ms look-ahead: beds and effects are already down before a word starts
from scipy import signal as _sig
from scipy.ndimage import maximum_filter1d
HOP = 64
win = int(0.03 * SR)
env = np.sqrt(np.convolve((vo ** 2).mean(1), np.ones(win) / win, mode='same'))[::HOP]
act_ds = (env > db(-52)).astype(np.float32)
la = int(0.15 * SR / HOP)
act_ds = maximum_filter1d(act_ds, size=2 * la + 1, origin=-la + 0)  # covers [i-la, i+la] -> look-ahead + hold
a_up, a_dn = np.exp(-1 / (0.06 * SR / HOP)), np.exp(-1 / (0.45 * SR / HOP))
sm = np.zeros_like(act_ds)
for i in range(1, len(act_ds)):
    a = a_up if act_ds[i] > sm[i - 1] else a_dn
    sm[i] = a * sm[i - 1] + (1 - a) * act_ds[i]
voact = np.interp(np.arange(N), np.arange(len(sm)) * HOP, sm).astype(np.float32)


def Ae(k, w, occ=0):
    n = 0
    for x in CH[k]['words']:
        if norm(x['w']).startswith(norm(w)):
            if n == occ:
                return x['e']
            n += 1
    raise KeyError((k, w, occ))


# ------------------------------------------------------------------ music: one cue per emotional section
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


UNDER = VO_LUFS - 23.0   # under narration: a bed that is felt more than noticed
GAP = VO_LUFS - 11.0     # pauses, cold open, atmosphere beats: heard at a normal level, never full
music = np.zeros((N, 2), np.float32)
CUESHEET = []


def music_cue(key, t0, t1, src0, fin, fout, label='', beat='', lift=None, gap_adj=0.0):
    x = track(key)
    i0, i1 = int(t0 * SR), int(t1 * SR)
    s0 = int(src0 * SR)
    n = i1 - i0
    seg = x[s0:s0 + n]
    if len(seg) < n:
        seg = np.pad(seg, ((0, n - len(seg)), (0, 0)))
    ref = lufs(x[s0:s0 + max(n, SR * 3)])
    base = db(GAP + gap_adj - ref)
    duck = db(UNDER - (GAP + gap_adj))
    g = base * (1 - voact[i0:i1] * (1 - duck))
    if lift is not None:
        g = g * np.array([db(lift(i0 / SR + j / SR)) for j in range(0, n, 480)]).repeat(480)[:n]
    t = np.arange(n) / SR
    f = np.minimum(1, t / max(fin, 0.01)) * np.minimum(1, (n / SR - t) / max(fout, 0.01))
    music[i0:i1] += seg * (g * f)[:, None]
    CUESHEET.append(('music', t0, t1, f'{TRACKS[key][1]} from {src0:.1f}s; fade in {fin}s / out {fout}s', label, beat))


SFXD = os.path.join(EP, 'audio', 'sfx')
sfx = np.zeros((N, 2), np.float32)   # spot effects
amb = np.zeros((N, 2), np.float32)   # environment under B-roll shots
hits = np.zeros((N, 2), np.float32)  # word hits + short risers (picture-sync accents on hard words)


def sfx_cue(name, t, gain_db, label, beat, dur=None, fout=0.0, bus=None, path=None, fin=0.0):
    x = load(path or os.path.join(SFXD, name + '.flac'))
    if dur:
        x = x[: int(dur * SR)].copy()
    x = x.copy()
    if fin:
        k = min(len(x), int(fin * SR))
        x[:k] *= np.linspace(0, 1, k)[:, None]
    if fout:
        k = min(len(x), int(fout * SR))
        x[-k:] *= np.linspace(1, 0, k)[:, None]
    i = int(t * SR)
    pk = np.abs(x).max()
    g = db(VO_LUFS + 14 + gain_db) / pk   # peak sits gain_db relative to the VO's peak level
    {'amb': amb, 'hits': hits}.get(bus, sfx)[i:i + len(x)] += x[: N - i] * g
    src = os.path.basename(path) if path else f'{name}.flac'
    CUESHEET.append(({'amb': 'amb', 'hits': 'sync'}.get(bus, 'sfx'), t, t + len(x) / SR, f'{src} ({gain_db:+.0f} dB)', label, beat))


def shot_amb(bid, name, gain_db, label, path=None):
    bb = BR[bid]
    sfx_cue(name, bb['tIn'] - 0.25, gain_db, label, f"{bid} ({bb['note']})", dur=bb['dur'] + 0.9, fin=0.35, fout=0.8, bus='amb', path=path)


b = BR
rej = A('V02', 'rejected')
JUNGLE = os.path.abspath(os.path.join(EP, '..', '..', 'shorts', 's11-cassowary', 'sfx', 'birds_jungle_ambience.mp3'))

# ===== COLD OPEN: tense intrigue =====
sfx_cue('drone', 0.0, -16, 'Low drone from frame 1', 'V01 frame 1', dur=rej + 0.05, fout=0.05)
music_cue('SD', 0.0, rej + 0.03, 0.0, 0.4, 0.03, label='Tense cold-open bed; cuts out completely on "rejected"', beat='V01-V02')
sfx_cue('boom', Ae('V01', 'australia') + 0.04, 0, 'Deep boom right after "invade Australia"; rings through the 1 s gap', 'V01 / gap 1 s')
music_cue('SD', E('V03'), S('V05') - 0.4, 58.0, 0.9, 0.8, label='Swells back in as the arrow re-extends; carries V04 and the title', beat='V03 gap -> V04 gap')
sfx_cue('series_sting', E('V04') + 0.1, -3, 'IF AUSTRALIA... series sting as the title builds', 'V04 gap 2.5 s')
# ===== ACT 1 =====
music_cue('DD', S('V05') - 0.1, E('V05') + 0.3, 20.0, 0.8, 0.8, label='War: Japan sweeps across Asia (dark, heavy)', beat='V05')
for w in ('hong', 'malaya', 'singapore'):
    sfx_cue('pin_thunk', A('V05', w) + 0.13, -14, f'Pin thunk ({w}), soft under the voice', 'V05')
music_cue('EC', S('V06') - 0.3, S('V07') - 0.4, 40.0, 1.0, 0.8, label='Loss: the prisoners (sad, low)', beat='V06 / B02 / gap 2 s')
sfx_cue('low_note', S('V06') - 0.3, -16, 'Single low note under the prisoner line and B02', 'V06 / B02', dur=b['B02']['tOut'] - S('V06') + 2.0, fout=1.6)
shot_amb('B02', 'rain', -15, 'Tropical rain under the marching column')
music_cue('SD', S('V07') - 0.2, A('V08', 'japanese') - 0.3, 75.0, 1.0, 0.6, label='Tense and building: Australia exposed', beat='V07-V08')
music_cue('BT', A('V08', 'japanese') - 0.1, S('V09') - 0.3, 40.0, 0.6, 1.0, label='War: the bombing of Darwin (heavy, insistent)', beat='V08 / B03 / gap 2.5 s')
sfx_cue('siren', b['B03']['tIn'] - 2.6, -12, 'Air-raid siren: rises in the pause before "It\'s the first time", ducks under the words, fades on the pull-back', 'V08 / B03 / gap 2.5 s')
sfx_cue('explosions_distant', b['B03']['tIn'] + 0.2, -9, 'Distant explosions, no screams', 'V08 / B03')
shot_amb('B03', 'fire_crackle', -20, 'Distant fire over the harbour')
music_cue('FA', S('V09') - 0.2, E('V11') + 0.1, 40.0, 1.2, 0.2, label='Plans and argument: Curtin, Tokyo, the decision (mysterious)', beat='V09-V11')
sfx_cue('stamp_thud', Ae('V11', 'march') + 0.02, -12, 'Soft thud as "4 MARCH 1942" stamps onto Tokyo', 'V11')
sfx_cue('cliff_sting', E('V11') + 0.05, -7, 'Cliffhanger sting (short); then 1.5 s hold (mid-roll 1)', 'V11', dur=2.2, fout=0.9)
# ===== ACT 2 =====
sfx_cue('whoosh', MK['slam1'] - 0.55, -7, 'Whoosh into the big "1"', 'Act 2 open')
sfx_cue('drum_1', MK['slam1'] + 0.12, -2, 'Drum hit as "1" slams onto the map', 'Act 2 open')
music_cue('DD', S('V12') - 0.3, A('V13', 'geography') - 0.1, 100.0, 1.0, 0.8, label='War: landings in the north (dark, heavy)', beat='V12-V13')
shot_amb('B04', 'sea', -15, 'Surf on the mangrove shore')
shot_amb('B04', 'engine_low', -19, 'Low landing-craft engine')
music_cue('CU', A('V13', 'geography') + 0.2, A('V15', 'that', 1) + 0.2, 10.0, 1.4, 0.45, label='Geography takes over (lighter, curious); drops out for the deadpan beat', beat='V13-V15')
sfx_cue('desert_wind', Ae('V15', 'nowhere') + 0.05, -8, 'Single gust of desert wind after "road to nowhere" (the comic beat)', 'V15 / B05 / gap')
music_cue('CU', b['B05']['tOut'] + 0.2, E('V18') + 1.2, 40.0, 1.0, 0.9, label='Curious bed resumes for the rest of scenario one', beat='V16-V18')
# ===== ACT 3 =====
sfx_cue('whoosh', MK['slam2'] - 0.55, -6, 'Whoosh into the big "2"', 'Act 3 open')
sfx_cue('drum_2', MK['slam2'] + 0.12, -1, 'Heavier drum hit as "2" slams on', 'Act 3 open')
music_cue('DD', S('V19') - 0.2, S('V23') - 0.6, 200.0, 0.8, 1.0, label='War: the full invasion (darkest, heaviest section)', beat='V19-V22')
shot_amb('B06', 'sea', -15, 'Open sea under the fleet')
shot_amb('B06', 'war_ambience', -16, 'Distant war rumble')
shot_amb('B07', 'sea', -17, 'Choppy sea through the periscope')
sfx_cue('sonar_ping', Ae('V20', 'aircraft') + 0.05, -9, 'Sonar ping 1 (periscope), in the pause after "aircraft"', 'V20 / B07')
sfx_cue('sonar_ping', E('V20') + 0.7, -11, 'Sonar ping 2 (submarine icons strike), in the 1 s gap', 'V20 gap')
shot_amb('B08', 'war_ambience', -15, 'Distant war rumble around the burning carrier')
shot_amb('B08', 'sea', -19, 'Calm sea at Midway')
sfx_cue('strings_pad', S('V23') - 0.6, -8, 'Loss: strings only under V23 and B09', 'V23 / B09 / gap 1.5 s', dur=E('V23') + 1.5 - S('V23') + 1.2, fout=1.4)
music_cue('FA', S('V24') + 0.3, E('V24') + 0.1, 130.0, 1.5, 0.2, label='Serious, then sly', beat='V24')
sfx_cue('cliff_sting', E('V24') + 0.05, -7, 'Cliffhanger sting (short); then 1.5 s hold (mid-roll 2)', 'V24', dur=2.2, fout=0.9)
# ===== ACT 4 =====
sfx_cue('whoosh', MK['slam3'] - 0.55, -5, 'Whoosh into the big "3"', 'Act 4 open')
sfx_cue('drum_3', MK['slam3'] + 0.12, 0, 'Heaviest hit of the three as "3" slams on', 'Act 4 open')
snap = Ae('V26', 'supplies') + 0.04
music_cue('BT', S('V25') - 0.2, snap + 0.02, 80.0, 0.8, 0.05, label='War threat: the plan to cut Australia off (heavy, insistent); cuts on the snap', beat='V25-V26')
sfx_cue('cable_snap', snap - 0.5, -3, 'Snapping cable in the pause after "fewer supplies"', 'V26')
sfx_cue('low_wind', snap + 0.1, -17, 'Near silence with a low wind tone (Australia alone)', 'V26 -> gap 2 s', dur=S('V27') + 1.0 - snap, fout=1.2)
music_cue('EC', S('V27') - 0.3, A('V27', 'japanese') - 0.4, 100.0, 1.5, 0.8, label='Loss: Australia cut off and alone (sad, low)', beat='V27')
music_cue('DD', A('V27', 'japanese') - 0.2, E('V28') + 0.9, 120.0, 0.6, 0.9, label='War: midget submarines, shelling, Kokoda (dark, heavy)', beat='V27-V28')
shot_amb('B10', 'underwater', -15, 'Underwater rumble in Sydney Harbour')
sfx_cue('explosions_distant', Ae('V28', 'shelled') + 0.02, -15, 'Distant shell bursts, soft under the voice', 'V28')
shot_amb('B11', 'rain', -15, 'Heavy rain on the mountain track')
shot_amb('B11', 'war_ambience', -20, 'Distant war rumble')
shot_amb('B11', 'jungle_birds', -24, 'Jungle birds (repo file)', path=JUNGLE)
for w in ('coral', 'midway', 'kokoda', 'millan'):
    sfx_cue('pin_thunk', A('V29', w) + 0.23, -14, f'Pin thunk ({w}), soft under the voice', 'V29')
held = A('V29', 'lifeline')
lift = lambda tt: 3.0 * min(1, max(0, (tt - held) / 1.2))
music_cue('VA', S('V29') - 0.4, E('V30') + 1.9, 0.0, 1.5, 1.2, label='Relief: the music lifts as the pins light and the lifeline redraws; resolves and holds', beat='V29-V30 + gap 2 s', lift=lift)
# ===== ACT 5: the twist, warm =====
music_cue('JO', S('V31') - 0.2, DUR, 0.0, 1.5, 3.0, label='Warm and hopeful: ANZUS, migration, the end screen outro', beat='V31-V34 + end screen', gap_adj=2.5)
shot_amb('B12', 'sea', -17, 'Harbour water under the arriving ship')

# ===== PICTURE SYNC: small sounds that hit with the picture =====
def hard_word(k, w, occ, label):
    t = A(k, w, occ)
    sfx_cue('riser_short', t - 0.85, -9, f'Short rise into {label}', k, bus='hits')
    sfx_cue('word_hit', t - 0.01, 1, f'Hit right on {label}', k, bus='hits')


hard_word('V02', 'rejected', 0, '"rejected" (REJECTED stamp)')
hard_word('V11', 'no', 0, '"No invasion" (the arrow vanishes)')
hard_word('V18', 'stuck', 0, '"stuck" (STUCK stamp)')
hard_word('V25', 'cut', 0, '"Cut it off"')
hard_word('V32', 'populate', 0, '"populate, or perish"')


def tick(t, label, beat, n=1, span=0.0, gain=-18, name='tick'):
    for j in range(n):
        u = j / max(1, n - 1)
        tj = t + span * (1 - (1 - u) ** 1.6) if n > 1 else t   # counters: fast then settling
        sfx_cue(name, tj, gain - (2 if j and j < n - 1 else 0), label, beat)


def click(t, label, beat, gain=-17):
    sfx_cue('click', t, gain, label, beat)


def draw(t0, t1, label, beat, gain=-24):
    sfx_cue('pen_draw', t0, gain, label, beat, dur=max(0.3, min(1.6, t1 - t0)), fout=0.15)


# labels landing
for t, nm, beat in [
    (A('V01', 'tokyo') + 0.3, 'TOKYO', 'V01'), (A('V05', 'pearl') + 0.2, 'PEARL HARBOR', 'V05'),
    (A('V07', 'australia'), 'AUSTRALIA', 'V07'), (A('V07', 'other') + 0.3, 'MIDDLE EAST', 'V07'),
    (A('V08', 'darwin') - 0.4, 'DARWIN', 'V08'), (A('V09', 'look') + 1.5, 'UNITED STATES', 'V09'),
    (A('V10', 'locked') + 0.2, 'Tied down in China', 'V10'), (A('V12', 'idea'), 'DARWIN', 'V12'),
    (A('V14', 'bird'), 'BIRDUM', 'V14'), (A('V14', 'alice'), 'ALICE SPRINGS', 'V14'),
    (A('V16', 'stewart'), 'Stuart Highway', 'V16'), (A('V17', 'melville'), 'MELVILLE ISLAND', 'V17'),
    (A('V17', 'captured'), 'Ulungura label', 'V17'),
    (A('V20', 'brisbane') + 0.15, 'BRISBANE', 'V20'), (A('V20', 'sydney') + 0.15, 'SYDNEY', 'V20'), (A('V20', 'melbourne') + 0.15, 'MELBOURNE', 'V20'),
    (A('V21', 'coral'), 'Coral Sea', 'V21'), (A('V21', 'port'), 'PORT MORESBY', 'V21'), (A('V21', 'midway') - 0.1, 'MIDWAY', 'V21'),
    (A('V22', 'might'), 'Early wins?', 'V22'), (A('V22', 'collapse') - 0.4, 'Faster collapse?', 'V22'), (A('V22', 'troops') - 0.3, 'MIDDLE EAST', 'V22'),
    (A('V25', 'fiji'), 'FIJI', 'V25'), (A('V25', 'samoa'), 'SAMOA', 'V25'), (A('V25', 'new'), 'NEW CALEDONIA', 'V25'),
    (A('V25', 'port') + 0.1, 'PORT MORESBY', 'V25'), (A('V25', 'queensland'), 'QUEENSLAND', 'V25'),
    (A('V27', 'japanese') + 0.4, 'SYDNEY HARBOUR', 'V27'), (A('V28', 'shelled') - 0.2, 'SYDNEY', 'V28'), (A('V28', 'shelled') + 0.15, 'NEWCASTLE', 'V28'),
    (b['B11']['tOut'] + 0.2, 'PORT MORESBY', 'V28'), (b['B11']['tOut'] + 0.3, 'KOKODA', 'V28'),
    (A('V31', 'anzus'), 'AUSTRALIA / NEW ZEALAND / USA', 'V31'), (A('V31', 'anzus') + 0.6, 'ANZUS 1951', 'V31'),
    (A('V34', 'one'), '1942 / TODAY split', 'V34'),
]:
    click(t, f'Label click: {nm}', beat)

# dates and counters: typewriter ticks; climbing / falling numbers get a short run of ticks
tick(A('V05', 'december'), 'Date tick: DECEMBER 1941', 'V05', n=2, span=0.12)
tick(A('V05', 'february'), 'Date tick: FEBRUARY 1942', 'V05', n=2, span=0.12)
tick(A('V07', 'seven') - 0.2, 'Counter: Population ~7 million', 'V07', n=2, span=0.15)
tick(A('V07', 'coastline'), 'Counter: Coastline 30,000+ km', 'V07', n=2, span=0.15)
tick(A('V10', '10') - 0.1, 'Counter: Divisions needed 10–12', 'V10', n=2, span=0.15)
tick(A('V10', '2') - 0.1, 'Counter: Shipping needed', 'V10', n=2, span=0.15)
tick(A('V14', 'thousand', 1) - 0.2, 'Counter: ~1,000 km of NO railway', 'V14', n=2, span=0.15)
tick(A('V20', '2') - 0.2, 'Counter climbs: shipping to 2,000,000 tons', 'V20', n=8, span=1.5)
tick(b['B11']['tOut'] + 0.25, 'Counter falls: distance to Port Moresby, stops at ~40 km', 'V28', n=7, span=1.5)
for w, yr in (('invasion', '1942'), ('forever', '1945'), ('1951', '1951')):
    tick(A('V31', w), f'Year ticks to {yr}', 'V31', n=1, gain=-15)
tick(A('V33', 'millions') - 0.2, 'Counter climbs: population', 'V33', n=6, span=2.4)

# lines drawing on the map: quiet pencil scratch for the length of the draw
for t0, t1, nm, beat in [
    (A('V02', 'idea'), A('V02', 'weeks') + 0.3, 'Red arrow draws Tokyo to northern Australia', 'V02'),
    (S('V03') + 0.2, A('V03', 'been') + 0.5, 'Arrow re-extends', 'V03'),
    (A('V04', 'three'), A('V04', 'three') + 1.2, 'Arrow splits into dotted 1, 2, 3', 'V04'),
    (A('V09', 'look'), A('V09', 'look') + 1.9, 'Blue line to the United States', 'V09'),
    (A('V14', 'railway'), A('V14', 'bird') + 0.2, 'Railway draws to Birdum', 'V14'),
    (A('V14', 'line'), A('V14', 'alice') + 0.3, 'Railway draws up to Alice Springs', 'V14'),
    (A('V16', 'push'), A('V16', 'gap') + 0.4, 'Road draws through the gap', 'V16'),
    (A('V16', 'supply'), A('V16', 'supply') + 1.6, 'Supply line draws back to Japan', 'V16'),
    (A('V20', 'then'), A('V20', 'then') + 1.2, 'Supply route draws', 'V20'),
    (A('V22', 'troops') - 0.3, A('V22', 'troops') + 1.3, 'Troop arrow from the Middle East', 'V22'),
    (A('V22', 'american'), A('V22', 'american') + 1.5, 'Arrow from the United States', 'V22'),
    (A('V25', 'lifeline'), A('V25', 'lifeline') + 2.2, 'Lifeline draws across the Pacific', 'V25'),
    (b['B11']['tOut'] + 0.25, b['B11']['tOut'] + 1.75, 'Red line crawls toward Port Moresby', 'V28'),
    (A('V29', 'lifeline'), A('V29', 'lifeline') + 1.3, 'Lifeline redraws solid', 'V29'),
    (A('V31', 'anzus') - 0.3, A('V31', 'anzus') + 0.8, 'ANZUS triangle draws', 'V31'),
    (A('V33', 'first') + 0.1, A('V33', 'first') + 1.5, 'Migration arrows from Britain and Europe', 'V33'),
    (A('V33', 'later') - 0.1, A('V33', 'later') + 1.3, 'Migration arrows from everywhere', 'V33'),
]:
    draw(t0, t1, nm, beat)

# beds and effects tuck under the voice: presence dip on music, extra duck on effects and ambience
b0, a0 = _sig.iirpeak(2500 / (SR / 2), 0.7)  # used only to shape a gentle presence dip below
sos_dip = _sig.butter(2, [1500 / (SR / 2), 4000 / (SR / 2)], 'bandpass', output='sos')
band = np.stack([_sig.sosfilt(sos_dip, music[:, c]) for c in range(2)], 1).astype(np.float32)
music = music - band * (1 - db(-7)) * voact[:, None]          # about -7 dB at 1.5-4 kHz while Atlas speaks
sfx = sfx * (1 - voact * (1 - db(-16)))[:, None]
amb = amb * (1 - voact * (1 - db(-12)))[:, None]
hits = hits * (1 - voact * (1 - db(-4)))[:, None]   # hits land on the word: light duck only, mostly sub-speech band

# ------------------------------------------------------------------ sum, master
# margin keeper: wherever Atlas is sounding, keep music+SFX+ambience >= 12 dB under the voice
# (speech band, 20 ms frames, look-ahead/hold 80 ms, smoothed) — a sidechain on the beds only, never on the voice
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
    need = -maximum_filter1d(-need, size=9)                     # hold the deepest cut +-80 ms
    g = np.zeros_like(need)
    for i in range(1, len(need)):                                 # fast down (20 ms), slow up (250 ms)
        a = 0.37 if need[i] < g[i - 1] else 0.92
        g[i] = a * g[i - 1] + (1 - a) * need[i]
    gl = np.interp(np.arange(N), np.arange(len(g)) * F + F / 2, db(g)).astype(np.float32)[:, None]
    music, sfx, amb, hits = music * gl, sfx * gl, amb * gl, hits * gl
mix = vo + music + sfx + amb + hits

# word-safety check: every Whisper word, voice vs everything else, in the speech band (200 Hz-5 kHz)
sos_sp = _sig.butter(4, [200 / (SR / 2), 5000 / (SR / 2)], 'bandpass', output='sos')
def band_rms(x, a, z):
    seg = x[int(a * SR):int(z * SR)].mean(1)
    if len(seg) < 64:
        return 1e-9
    return np.sqrt((_sig.sosfilt(sos_sp, seg) ** 2).mean()) + 1e-9
bed = music + sfx + amb + hits
# frame-level: every 20 ms frame where the voice is actually sounding (speech band above -40 dBFS)
F = int(0.02 * SR)
vb = _sig.sosfilt(sos_sp, vo[:, 0] + vo[:, 1]) / 2
bb = _sig.sosfilt(sos_sp, bed[:, 0] + bed[:, 1]) / 2
nf = len(vb) // F
vr = 20 * np.log10(np.sqrt((vb[: nf * F].reshape(nf, F) ** 2).mean(1)) + 1e-9)
br = 20 * np.log10(np.sqrt((bb[: nf * F].reshape(nf, F) ** 2).mean(1)) + 1e-9)
live = vr > -40
ms = (vr - br)[live]
order = np.argsort(vr - br + np.where(live, 0, 1e9))[:15]
margins = [(float(vr[i] - br[i]), round(i * 0.02, 2), float(vr[i]), float(br[i])) for i in order]
print(f'word safety: {live.sum()} voiced frames, voice above music+SFX by min {ms.min():.1f} dB, 0.1st pct {np.percentile(ms, 0.1):.1f} dB, 1st pct {np.percentile(ms, 1):.1f} dB, median {np.median(ms):.1f} dB')
print('closest frames (margin, t, voice, bed):', [(round(m, 1), t, round(v, 1), round(b_, 1)) for m, t, v, b_ in margins[:6]])
json.dump({'voiced_frames': int(live.sum()), 'min_db': float(ms.min()), 'p01_db': float(np.percentile(ms, 0.1)), 'p1_db': float(np.percentile(ms, 1)), 'median_db': float(np.median(ms)),
           'closest': margins}, open(os.path.join(BUILD, 'word_safety.json'), 'w'), indent=1)
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
