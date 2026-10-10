#!/usr/bin/env python3
"""lf06 Ch1 mix (1x). Voice, music beds and SFX placed on the film clock from timeline.json.

Levels (script / MIX_MAP): narration is the reference (master -14 LUFS-I);
music about 20 dB under narration while it speaks, rising in the music-only holds;
SFX about 12 dB under narration. The voice files are read, never written: clip gain only
(one static gain per file so Atlas and Ara sit at the same loudness; S10 1 dB softer by design).

Output: render/build/mix_1x.wav (48 kHz stereo float32, pre-master) and render/build/mix_report.json
"""
import json, os, subprocess
import numpy as np
from scipy.signal import lfilter

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
B = os.path.join(HERE, "build")
SR = 48000
TL = json.load(open(os.path.join(HERE, "timeline.json")))
C = TL["cue"]
TOTAL = TL["total"]
N = int(round(TOTAL * SR))


def dec(path, ch=2, af=None):
    cmd = ["ffmpeg", "-v", "error", "-i", os.path.join(EP, path)]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)
    return x.reshape(-1, ch).copy()


# ---- BS.1770 K-weighting + loudness ------------------------------------------------------
def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def short_term(x, win=3.0, hop=0.1):
    """K-weighted short-term loudness curve (LUFS) sampled every `hop` s."""
    y = kweight(x); p = (y ** 2).sum(axis=1)
    h = int(hop * SR); w = int(win * SR)
    cs = np.concatenate([[0], np.cumsum(p)])
    idx = np.arange(0, len(p), h)
    lo = np.clip(idx - w // 2, 0, len(p)); hi = np.clip(idx + w // 2, 0, len(p))
    ms = (cs[hi] - cs[lo]) / np.maximum(hi - lo, 1)
    return -0.691 + 10 * np.log10(ms + 1e-12)


def integrated(x):
    y = kweight(x); p = (y ** 2).sum(axis=1)
    h = int(0.1 * SR); w = int(0.4 * SR)
    blocks = np.array([p[i:i + w].mean() for i in range(0, len(p) - w, h)])
    l = -0.691 + 10 * np.log10(blocks + 1e-12)
    blocks = blocks[l > -70]
    rel = -0.691 + 10 * np.log10(blocks.mean()) - 10
    l = -0.691 + 10 * np.log10(blocks + 1e-12)
    return -0.691 + 10 * np.log10(blocks[l > rel].mean())


db = lambda v: 10 ** (v / 20)
t_axis = np.arange(N) / SR
out = np.zeros((N, 2), np.float32)
report = {"vo": {}, "music": {}, "sfx": []}

# ---- narration -------------------------------------------------------------------------
VO_TARGET = -14.0
vo_bus = np.zeros((N, 2), np.float32)
speech_mask = np.zeros(N, bool)
for s, seg in TL["segments"].items():
    x = dec(seg["file"], ch=1)
    L = integrated(np.repeat(x, 2, axis=1) * 0.7071)
    trim = (VO_TARGET - L) - (1.0 if s == "S10" else 0.0)
    report["vo"][s] = {"file_LUFS": round(L, 2), "clip_gain_dB": round(trim, 2)}
    for c in [c for c in TL["vo_clips"] if c["seg"] == s]:
        a, b = int(c["in"] * SR), int(c["out"] * SR)
        at = int(round(c["at"] * SR))
        seg_ = x[a:b, 0] * db(trim)
        n = min(len(seg_), N - at)
        vo_bus[at:at + n, 0] += seg_[:n] * 0.7071
        vo_bus[at:at + n, 1] += seg_[:n] * 0.7071
    speech_mask[int(seg["speech_on"] * SR):int(seg["speech_off"] * SR)] = True
out += vo_bus

# ---- music -----------------------------------------------------------------------------
# bed targets (short-term LUFS of the music itself)
UNDER = VO_TARGET - 20.0          # under speech
HOLD = VO_TARGET - 10.0           # music-only holds: bed rises
OPEN = VO_TARGET - 9.0            # disclaimer + chapter card
S10_BED = VO_TARGET - 19.0        # S10: one constant level under both memories

def smooth_step_env(mask, rise=0.35, fall=0.6):
    """0..1 envelope that is 1 where mask is True, with linear ramps (rise before, fall after)."""
    m = mask.astype(np.float32)
    k = int(0.01 * SR)
    m = m[::k]  # 10 ms resolution
    env = m.copy()
    r, f = int(rise / 0.01), int(fall / 0.01)
    # dilate towards earlier (pre-duck) and later (release)
    out_ = np.zeros_like(env)
    on = np.where(np.diff(np.concatenate([[0], m, [0]])) == 1)[0]
    off = np.where(np.diff(np.concatenate([[0], m, [0]])) == -1)[0]
    for a, b in zip(on, off):
        a0 = max(0, a - r); b1 = min(len(env), b + f)
        out_[a:b] = 1
        out_[a0:a] = np.maximum(out_[a0:a], np.linspace(0, 1, a - a0, endpoint=False))
        out_[b:b1] = np.maximum(out_[b:b1], np.linspace(1, 0, b1 - b, endpoint=False))
    return np.repeat(out_, k)[:N] if len(out_) * k >= N else np.pad(np.repeat(out_, k), (0, N - len(out_) * k))


duck = smooth_step_env(speech_mask)
target = HOLD + (UNDER - HOLD) * duck
# opening (no voice) and the end hold run a little higher
target = np.where(t_axis < C["s05_pic"], OPEN, target)
# S10: constant bed under both halves; rises only in the 2.0 s "same event" hold
s10a, s10b = TL["segments"]["S10"]["speech_on"] - 0.3, TL["segments"]["S10"]["speech_off"] + 0.4
in10 = (t_axis >= s10a) & (t_axis < s10b)
hold10 = np.zeros(N, np.float32)
h0, h1 = C["same_hold_start"], C["same_hold_start"] + 2.0
hold10 = np.clip(np.minimum((t_axis - h0 + 0.1) / 0.5, (h1 - t_axis + 0.2) / 0.6), 0, 1)
target = np.where(in10, S10_BED + (HOLD - 2.0 - S10_BED) * hold10, target)
# S07 hold: MUS02 swells about +3 dB (hand-ridden)
sw = np.clip(np.minimum((t_axis - C["australia"] - 0.6) / 0.8, (C["s08_pic"] + 0.6 - t_axis) / 1.0), 0, 1)
target = target + 3.0 * sw
# end hold
target = np.where(t_axis > C["s13_end"] + 0.2, HOLD + 1.0, target)


def place_music(path, t_in, file_in, t_out, fade_in, fade_out, offset_db=0.0, shape="eqp", name="", ride=6.0):
    x = dec(path)
    lst = short_term(x, win=ride, hop=0.1)  # slow ride: follows phrases, keeps dynamics inside them
    a = int(t_in * SR); b = int(min(t_out, TOTAL) * SR)
    fpos = (np.arange(a, b) / SR - t_in + file_in)
    fi = np.clip((fpos * SR).astype(int), 0, len(x) - 1)
    seg = x[fi]
    L = np.interp(fpos, np.arange(len(lst)) * 0.1, lst)
    g = target[a:b] - L + offset_db
    g = np.clip(g, -40, 18)
    tt = np.arange(a, b) / SR
    fin = np.clip((tt - t_in) / max(fade_in, 1e-3), 0, 1)
    fout = np.clip((t_out - tt) / max(fade_out, 1e-3), 0, 1)
    if shape == "eqp":
        fin, fout = np.sin(fin * np.pi / 2), np.sin(fout * np.pi / 2)
    gain = db(g) * fin * fout
    out[a:b] += (seg * gain[:, None]).astype(np.float32)
    report["music"][name or path] = {"in": round(t_in, 2), "out": round(t_out, 2), "file_in": round(file_in, 2),
                                     "median_gain_dB": round(float(np.median(g)), 1)}


x_mo = C["s10_pic"] - 0.2                      # MUS02 -> MUS06 crossfade (S09 hold), 3 s equal-power
x_back = C["s11_pic"] - 0.6                    # MUS06 -> MUS02 warm, 3 s
place_music("audio/music/MUS12_motif.mp3", 0.0, 0.0, 10.5, 0.02, 1.5, 0.0, name="MUS12 motif")
place_music("audio/music/MUS02_history_strings.mp3", 6.0, 0.0, x_mo + 3.0, 3.0, 3.0, name="MUS02 pass 1")
place_music("audio/music/MUS06_sombre_piano.mp3", x_mo, 14.85, x_back + 3.0, 3.0, 3.0, name="MUS06 (S10)", ride=3.0)
place_music("audio/music/MUS02_history_strings.mp3", x_back, 66.5, C["wired"] + 2.0, 3.0, 2.0, name="MUS02 warm")
place_music("audio/music/MUS03_minimal_pulse.mp3", C["wired"], 0.0, TOTAL, 2.5, 1.6, name="MUS03 pulse")

# ---- SFX -------------------------------------------------------------------------------
SFX_REF = VO_TARGET - 12.0  # loudest 400 ms of an effect sits ~12 dB under narration
_cache = {}


def sfx(name, at, off=0.0, af=None, fade_in=0.0, dur=None, fade_out=0.0, label=""):
    key = (name, af)
    if key not in _cache:
        x = dec(f"audio/sfx/{name}.mp3", af=af)
        y = kweight(x); p = (y ** 2).sum(axis=1)
        w = int(0.4 * SR)
        cs = np.concatenate([[0], np.cumsum(p)])
        mx = max(((cs[w:] - cs[:-w]) / w).max() if len(p) > w else p.mean(), 1e-12)
        _cache[key] = (x, -0.691 + 10 * np.log10(mx))
    x, L = _cache[key]
    if dur is not None:
        x = x[:int(dur * SR)]
    g = db(SFX_REF - L + off)
    env = np.ones(len(x), np.float32)
    if fade_in:
        k = min(len(x), int(fade_in * SR)); env[:k] = np.linspace(0, 1, k)
    if fade_out:
        k = min(len(x), int(fade_out * SR)); env[-k:] *= np.linspace(1, 0, k)
    a = int(round(at * SR)); n = min(len(x), N - a)
    if n <= 0:
        return
    out[a:a + n] += (x[:n] * (g * env[:n])[:, None]).astype(np.float32)
    report["sfx"].append({"t": round(at, 3), "sfx": name, "trim_dB": round(SFX_REF - L + off, 1), "cue": label})


def ticks(at, n, step=0.06, off=-4.0, label=""):
    r = np.random.default_rng(7)  # same pattern every call -> identical tick patterns (balance)
    for i in range(n):
        sfx("SFX06_tick", at + i * step, off + float(r.uniform(-2, 2)), label=label)


# open
sfx("SFX07_projector", C["card_in"], -10.0, dur=C["s05_hold"] + 0.9 - C["card_in"], fade_in=0.4, fade_out=1.0, label="projector: card -> S05 hold")
# S05
ticks(C["november"], 8, 0.05, -6, "flap NOV 1947")
sfx("SFX05_whoosh", C["new_york"] - 0.05, -8, label="New York locator")
sfx("SFX18_paper", C["new_york"] + 0.35, -4, label="DOC01 page lands")
# S06
sfx("SFX05_whoosh", C["s06_pic"] - 0.1, -12, label="PAN UN map")
sfx("SFX12_shutter", C["chairing"] - 0.05, -2, label="DROP PH01b")
sfx("SFX12_shutter", C["an_australian"] - 0.12, -2, label="DROP PH01")
sfx("SFX06_tick", C["australian_word"], -2, label="kinetic AUSTRALIAN")
sfx("SFX_pop", C["doc"], -3, label="callout Doc")
# S07
sfx("SFX18_paper", C["s07_pic"], -3, label="ZOOM DOC01")
sfx("SFX18_paper", C["s07_pic"] + 1.25, -9, label="highlighter swipe")
sfx("SFX05_whoosh", C["divide"], -5, label="map splits")
ticks(C["the_first"] - 0.15, 6, 0.06, -7, "roll-call strip scrolls")
for k, dt in enumerate([0.1, 0.55, 1.05]):
    sfx("SFX06_tick", C["first_country"] + dt + 0.12, -3, label=["Afghanistan", "Argentina", "Australia"][k])
sfx("SFX20_marker", C["australia"], -3, af="atempo=0.5", label="CIRCLE Australia (stretched to the draw)")
sfx("SFX18_paper", C["australia"] + 0.95, -7, label="A/PV.128 slides in")
# S08
sfx("SFX16_hooves", C["charged"] - 0.05, -2, fade_in=0.3, dur=2.0, fade_out=0.7, label="charge arrow")
ticks(C["beersheba"], 8, 0.05, -6, "flap OCT 1917")
sfx("SFX21_thunk", C["beersheba"] + 0.24, -2, label="Beersheba pin")
sfx("SFX12_shutter", C["one_of_last"] - 0.1, -2, label="PH02")
sfx("SFX12_shutter", C["one_of_last"] + 0.95, -4, label="STACK PH02b")
sfx("SFX12_shutter", C["cavalry"] + 0.75, -4, label="STACK PH02c")
sfx("SFX05_whoosh", C["road"] - 0.1, -5, label="road to Jerusalem")
# S09
sfx("SFX05_whoosh", C["s09_pic"], -5, label="SPLIT slide")
sfx("SFX06_tick", C["s09_pic"] + 0.72, -3, label="SPLIT lock")
sfx("SFX19_stamp", C["ballot"], -6, label="ballot (stand-in, low)")
# S10 (quiet): no SFX on either half's label; soft ticks on the number; the pin
ticks(C["seven_hundred"], 4, 0.15, -14, "700,000+ roll (soft)")
sfx("SFX21_thunk", C["remember_idea"] + 1.45, -4, label="TWO MEMORIES pins")
# S11
sfx("SFX05_whoosh", C["sailed"], -5, label="flow line 1")
sfx("SFX12_shutter", C["melbourne"] - 0.15, -2, label="DROP PH05")
sfx("SFX12_shutter", C["per_person"] - 0.05, -4, label="DROP PH05 inset")
sfx("SFX12_shutter", C["palestinian"] - 0.25, -2, label="DROP PH06")
sfx("SFX05_whoosh", C["south_west"], -5, label="flow line 2 (same gain)")
# S12: identical tick pattern and gain for both rolls
ticks(C["one_hundred"], 10, 0.09, -6, "roll left")
ticks(C["eight_hundred"], 10, 0.09, -6, "roll right")
# S13
sfx("SFX06_tick", C["start_clock"], -1, label="clock hand")
sfx("SFX21_thunk", C["never_heard"] + 0.1, -2, label="1947 VOTE pins")
# SFX10 hum: enters on "wired", rises to SFX level through the end hold
x10 = dec("audio/sfx/SFX10_machining.mp3")
a = int(C["wired"] * SR); n = N - a
L10 = integrated(x10)
tt = np.arange(n) / SR + C["wired"]
lvl = np.interp(tt, [C["wired"], C["never_heard"], TOTAL - 1.2, TOTAL], [-46, -36, -27, -40])
g10 = db(lvl - L10) * np.clip((TOTAL - tt) / 1.2, 0, 1)
out[a:a + n] += (x10[:n] * g10[:, None]).astype(np.float32)
report["sfx"].append({"t": C["wired"], "sfx": "SFX10_machining", "cue": "hum rises from 'wired' (-46 -> -27 LUFS)"})

# final fade (last 1.5 s) into navy
fe = np.clip((TOTAL - t_axis) / 1.5, 0, 1)
out *= np.sqrt(fe)[:, None].astype(np.float32)

report["mix_integrated_LUFS_pre_master"] = round(integrated(out), 2)
report["vo_bus_integrated_LUFS"] = round(integrated(vo_bus), 2)
report["peak_dBFS"] = round(20 * np.log10(np.abs(out).max()), 2)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                os.path.join(B, "mix_1x.wav")], input=out.astype(np.float32).tobytes(), check=True)
json.dump(report, open(os.path.join(B, "mix_report.json"), "w"), indent=1, default=float)
print(json.dumps({k: v for k, v in report.items() if k != "sfx"}, indent=1, default=float))
print(len(report["sfx"]), "sfx events")

# ---- level check: momentary loudness of narration vs bed (music + sfx) per segment ----------
bed = out - vo_bus * np.sqrt(fe)[:, None]
lv, lb = short_term(vo_bus, 0.4, 0.1), short_term(bed, 0.4, 0.1)
chk = {}
for s, seg in TL["segments"].items():
    i0, i1 = int(seg["speech_on"] * 10), int(seg["speech_off"] * 10)
    v = lv[i0:i1]; bb = lb[i0:i1]; m = v > -30
    chk[s] = {"vo_momentary_median": round(float(np.median(v[m])), 1), "bed_median_under_speech": round(float(np.median(bb[m])), 1),
              "spacing_dB": round(float(np.median(v[m] - bb[m])), 1)}
holds = {"opening": (1.0, 7.0), "S07 hold": (C["s07_hold"], C["s08_pic"]), "S09 hold": (C["s09_hold"], C["s10_pic"] + 0.5),
         "S10 same-event hold": (C["same_hold_start"] + 0.3, C["same_hold_start"] + 1.8), "end hold": (C["s13_end"] + 0.3, TOTAL - 1.5)}
for k, (a, b) in holds.items():
    chk[k] = {"bed_momentary_median": round(float(np.median(lb[int(a * 10):int(b * 10)])), 1)}
# S10 balance: bed level under each half
L0, L1 = C["s10_pic"] + 1.5, C["for_palestinians"]
R0, R1 = C["for_palestinians"], C["same_event"]
chk["S10 bed under memory 1 (median LUFS-M)"] = round(float(np.median(lb[int(L0 * 10):int(L1 * 10)])), 2)
chk["S10 bed under memory 2 (median LUFS-M)"] = round(float(np.median(lb[int(R0 * 10):int(R1 * 10)])), 2)
report["level_check"] = chk
json.dump(report, open(os.path.join(B, "mix_report.json"), "w"), indent=1, default=float)
print(json.dumps(chk, indent=1))
