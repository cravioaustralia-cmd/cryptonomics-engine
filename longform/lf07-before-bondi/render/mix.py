#!/usr/bin/env python3
"""mix.py - the 'Before Bondi' mix. Voice files are placed whole with linear gain only (the voice bus);
music and effects come from the shared event registry and the music plan below.

  python3 render/mix.py [T_END]     -> build/mix_raw.wav, build/stem_vo.wav, build/stem_music.wav, build/mix_1x.wav
Levels: voice bus +6 dB (files are -20 LUFS -> about -14). Music beds about -26 dB in holds, ducked 9 dB
under speech (150 ms attack, 600 ms release); montages about -16; SFX one-shots about -28 dBFS RMS.
"""
import json, math, subprocess, sys
from functools import lru_cache
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import film
import timeline as TL
from lib import events as EV

EP = film.EP
SR = 48000
T = TL.load()
BUILD = EP / "build"
VO_GAIN_DB = 6.0
BED_FREE, BED_DUCK = -26.0, -9.0
SFX_ONE, SFX_AMB = -28.0, -26.0


def db(x):
    return 10 ** (x / 20)


@lru_cache(maxsize=None)
def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def rms_db(a):
    m = np.abs(a).mean(1)
    act = a[m > 10 ** (-50 / 20)]
    if len(act) == 0:
        return -90.0
    return 20 * math.log10(math.sqrt(np.mean(act ** 2)) + 1e-12)


def sfx_path(name):
    p = EP / "audio/sfx" / (name + ".mp3")
    if not p.exists():
        p = next((EP / "audio/sfx").glob(name + "*.mp3"))
    return p


def mus_path(mid):
    return next((EP / "audio/music").glob(mid + "_*.mp3"))


class Bus:
    def __init__(self, n):
        self.a = np.zeros((n, 2), np.float32)

    def add(self, x, t0, gain=1.0):
        i0 = int(round(t0 * SR))
        if i0 < 0:
            x = x[-i0:]
            i0 = 0
        i1 = min(len(self.a), i0 + len(x))
        if i1 > i0:
            self.a[i0:i1] += x[: i1 - i0] * gain


def env(n, fin, fout):
    e = np.ones(n, np.float32)
    a, b = int(fin * SR), int(fout * SR)
    if a > 0:
        e[:a] = np.sin(np.linspace(0, math.pi / 2, a)) ** 2
    if b > 0:
        e[-b:] = np.minimum(e[-b:], np.cos(np.linspace(0, math.pi / 2, b)) ** 2)
    return e[:, None]


# ------------------------------------------------------------------ music plan
def C(k):
    return EV.CUES[k]


def s(x):
    return T.seg(x)


def music_plan():
    """List of dict(mid, t0, off, t1, fin, fout, mode, gain). mode: bed | motif | montage."""
    P = []
    add = lambda **k: P.append(dict(dict(fin=3.0, fout=3.0, mode="bed", gain=0.0, off=0.0), **k))
    # COLD OPEN
    add(mid="MUS10", t0=C("S01.lives"), t1=s("S03").start + 1.5)
    add(mid="MUS01", t0=s("S03").start - 1.5, t1=C("S07.title") + 0.6)
    add(mid="MUS12", t0=C("S07.title"), t1=s("S08").start, fin=0.02, fout=1.0, mode="motif")
    # CH1
    ch = s("S08").chapter_hold
    add(mid="MUS12", t0=ch[0] + 0.1, t1=ch[0] + 10.5, fin=0.02, fout=1.5, mode="motif")
    add(mid="MUS04", t0=ch[0] + 2.0, t1=s("S10").silence[0], fout=1.0)
    pos = s("S10").silence[0] - (ch[0] + 2.0)
    add(mid="MUS04", t0=s("S10").vo_start, off=pos, t1=s("S12").midroll, fout=2.0)
    # CH2
    ch = s("S13").chapter_hold
    add(mid="MUS12", t0=ch[0] + 0.1, t1=ch[0] + 10.5, fin=0.02, fout=1.5, mode="motif")
    add(mid="MUS02", t0=ch[0] + 2.0, t1=s("S15").start + 1.5)
    add(mid="MUS06", t0=s("S15").start - 1.5, t1=s("S16").start + 1.5)          # QUIET S15: one level under both halves
    add(mid="MUS02", t0=s("S16").start - 1.5, off=66.5, t1=C("S17.ticker_roll") + 1.5)
    # CH3
    add(mid="MUS07", t0=C("S17.ticker_roll") - 1.5, t1=C("S23.candle") + 1.5)
    ch = s("S18").chapter_hold
    add(mid="MUS12", t0=ch[0] + 0.1, t1=ch[0] + 10.5, fin=0.02, fout=1.5, mode="motif")
    # CH4 (no MUS12 on this quiet chapter card)
    add(mid="MUS06", t0=C("S23.candle") - 1.5, off=30.0, t1=s("S28").start + 2.0, fout=4.0)
    # CH5: MUS09 drone; its +10 dB step (file 91.5 s) must land exactly on the S34 montage start
    t9 = s("S28").start - 2.0
    step = s("S34").start
    L = (step - t9) - MUS09_STEP
    P.append(dict(mid="MUS09", t0=t9, off=0.0, t1=step, fin=4.0, fout=0.05, mode="bed", gain=0.0,
                  loop=(MUS09_LOOP_AT, L) if L > 0 else None))
    P.append(dict(mid="MUS09", t0=step, off=MUS09_STEP, t1=s("S35").silence[0] + 0.08, fin=0.05, fout=0.08,
                  mode="montage", gain=0.0))
    # CH6: MUS10 begins on the candle hold (after the S35 silence and the waves-only chapter hold)
    t11 = s("S45").start - 50.0                     # MUS11's lift at file 0:50 lands on the S45 montage start
    add(mid="MUS10", t0=s("S36").vo_end, t1=t11 + 4.0, fout=4.0)
    # CLOSING
    add(mid="MUS11", t0=t11, t1=s("S45").start + 0.5, fin=4.0, fout=0.5)
    add(mid="MUS11", t0=s("S45").start, off=50.0, t1=s("S45").vo_start + 0.5, fin=0.5, fout=0.5, mode="montage")
    add(mid="MUS11", t0=s("S45").vo_start, off=50.0 + (s("S45").vo_start - s("S45").start), t1=s("S46").vo_end + 0.5,
        fin=0.5, fout=2.5)
    add(mid="MUS11", t0=s("S46").vo_end, off=135.0, t1=s("S46").end, fin=2.0, fout=0.05)   # natural ending fills the end screen
    ch = s("S43").chapter_hold
    add(mid="MUS12", t0=ch[0] + 0.1, t1=ch[0] + 10.5, fin=0.02, fout=1.5, mode="motif")
    add(mid="MUS12", t0=C("S45.sun_flare"), t1=C("S45.sun_flare") + 10.5, fin=0.02, fout=1.5, mode="motif")
    add(mid="MUS12", t0=s("S46").vo_end + 0.2, t1=s("S46").vo_end + 10.7, fin=0.02, fout=1.5, mode="motif")
    return P


MUS09_STEP = 91.5
MUS09_LOOP_AT = 85.0


def looped(a, off, A, L, n, xf=3.0):
    """Play from off; at file A jump back by L seconds with an equal-power crossfade of xf seconds."""
    h = int(xf / 2 * SR)
    ia = int(A * SR)
    first = a[int(off * SR): ia + h]
    second = a[ia - int(L * SR) - h:]
    ramp = np.linspace(0, math.pi / 2, 2 * h)[:, None]
    mixz = first[-2 * h:] * np.cos(ramp) + second[: 2 * h] * np.sin(ramp)
    out = np.concatenate([first[:-2 * h], mixz, second[2 * h:]])
    return out[:n]


def music_segment(p):
    a = load(mus_path(p["mid"]))
    i0 = int(p["off"] * SR)
    n = int((p["t1"] - p["t0"]) * SR)
    if p.get("loop"):
        x = looped(a, p["off"], p["loop"][0], p["loop"][1], n)
    else:
        x = a[i0:i0 + n]
    if len(x) < n:
        x = np.concatenate([x, np.zeros((n - len(x), 2), np.float32)])
    lvl = rms_db(x) if np.any(x) else -60
    return x * env(len(x), p["fin"], p["fout"]), lvl


def speech_mask(vo, n):
    """1 where the voice is speaking (50 ms RMS above -45 dBFS), smoothed into a duck gain curve."""
    hop = 480
    m = np.abs(vo).mean(1)
    k = len(m) // hop
    r = np.sqrt((m[: k * hop].reshape(k, hop) ** 2).mean(1))
    sp = (20 * np.log10(r + 1e-9) > -45).astype(np.float32)
    # hold through short gaps (< 350 ms) so the bed does not pump between words
    out = sp.copy()
    last = -999
    for i in range(k):
        if sp[i]:
            if 0 < i - last <= 35:
                out[last:i] = 1
            last = i
    # one-pole in dB: attack 150 ms, release 600 ms (per 10 ms hop)
    g = np.zeros(k, np.float32)
    cur = 0.0
    aa, ar = math.exp(-10 / 150), math.exp(-10 / 600)
    for i in range(k):
        tgt = BED_DUCK * out[i]
        coef = aa if tgt < cur else ar
        cur = tgt + (cur - tgt) * coef
        g[i] = cur
    gs = np.repeat(g, hop)
    if len(gs) < n:
        gs = np.concatenate([gs, np.full(n - len(gs), gs[-1] if len(gs) else 0)])
    return gs[:n], np.repeat(out, hop)[:n]


def build(t_end=None):
    film.ensure()
    total = t_end or T.total
    n = int(total * SR) + SR
    vo, mus, sfx = Bus(n), Bus(n), Bus(n)
    # 1. voice: files placed whole, linear gain only
    for sg in T.segs:
        x = load(EP / "audio/vo" / f"{sg.sid}.mp3")
        vo.add(x, sg.vo_start, db(VO_GAIN_DB))
    duck, speaking = speech_mask(vo.a, n)
    # 2. music
    for p in music_plan():
        if p["t0"] >= total:
            continue
        x, lvl = music_segment(p)
        i0 = int(p["t0"] * SR)
        if p["mode"] == "bed":
            g = db(BED_FREE - lvl + p["gain"]) * db(duck[i0:i0 + len(x)])[:, None]
        elif p["mode"] == "motif":
            g = db(-23.0 - lvl + p["gain"]) * db(0.5 * duck[i0:i0 + len(x)])[:, None]
        else:  # montage
            g = db(-16.0 - lvl + p["gain"]) * db(0.4 * duck[i0:i0 + len(x)])[:, None]
        if len(g) < len(x):
            g = np.concatenate([g, np.ones((len(x) - len(g), 1), np.float32) * g[-1]])
        mus.add(x * g[: len(x)], p["t0"])
    # 3. effects
    for e in EV.EVENTS:
        if e.kind != "sfx" or e.t >= total:
            continue
        a = load(sfx_path(e.file))
        dur = e.extra.get("dur")
        if dur:
            a = a[: int(dur * SR)]
        if e.extra.get("short"):      # S35 race: cut each tick short so they do not smear into one rumble
            a = a[: int(0.14 * SR)] * env(int(0.14 * SR), 0.0, 0.03)[: len(a[: int(0.14 * SR)])]
        long_ = len(a) > 5 * SR
        base = (SFX_AMB if long_ else SFX_ONE) - rms_db(a)
        pk = 20 * math.log10(float(np.abs(a).max()) + 1e-9)
        base = min(base, -12.0 - pk - e.gain)      # no effect peaks above -12 dBFS (12 dB under the voice)
        x = a * env(len(a), e.extra.get("fin", 0.0), e.extra.get("fout", 0.01 if not long_ else 1.0))
        if long_:   # ambiences (waves, crowd, rain, machining) also dip 6 dB under speech
            i0 = int(e.t * SR)
            d = duck[i0:i0 + len(x)]
            if len(d) < len(x):
                d = np.concatenate([d, np.zeros(len(x) - len(d), np.float32)])
            x = x * db(d * (6.0 / 9.0))[:, None]
        sfx.add(x, e.t, db(base + e.gain))
    mixd = vo.a + mus.a + sfx.a
    # 4. total silences (digital zero)
    for sg in T.segs:
        if getattr(sg, "silence", None):
            a0, a1 = sg.silence
            i0, i1 = int(a0 * SR), int(a1 * SR)
            if i0 >= n - SR:
                continue
            if sg.sid == "S35":
                f = int(0.08 * SR)   # MUS09 cut with an 80 ms fade at the end of "wasn't"
                ramp = np.linspace(1, 0, f)[:, None].astype(np.float32)
                mixd[i0:i0 + f] = vo.a[i0:i0 + f] + (mus.a[i0:i0 + f] + sfx.a[i0:i0 + f]) * ramp
                mixd[i0 + f:i1] = 0
                vo.a[i0 + f:i1] = 0
            else:
                mixd[i0:i1] = 0
    n2 = int(total * SR)
    BUILD.mkdir(exist_ok=True)
    write(BUILD / "mix_raw.wav", mixd[:n2])
    write(BUILD / "stem_vo.wav", vo.a[:n2])
    write(BUILD / "stem_music.wav", (mus.a + sfx.a)[:n2])
    return mixd[:n2]


def write(path, a):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                          "-c:a", "pcm_f32le", str(path)], stdin=subprocess.PIPE)
    p.stdin.write(np.ascontiguousarray(a, np.float32).tobytes())
    p.stdin.close()
    p.wait()


def loudness(path):
    out = subprocess.run(["ffmpeg", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    tail = out[out.rfind("Summary:"):]
    I = float(tail.split("I:")[1].split("LUFS")[0])
    LRA = float(tail.split("LRA:")[1].split("LU")[0])
    tp = float(tail.split("Peak:")[1].split("dBFS")[0])
    return I, tp, LRA


def master(src, dst, target=-14.0, tp_ceiling=-1.5):
    """Linear gain to the target, then a look-ahead limiter on the rare true peaks above the ceiling."""
    I, tp, _ = loudness(src)
    g = target - I
    lim = 10 ** ((tp_ceiling - 0.4) / 20)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af",
                    f"volume={g:.3f}dB,aresample=192000,alimiter=limit={lim:.5f}:level=disabled:attack=1.5:release=120:asc=1,"
                    f"aresample=48000", "-c:a", "pcm_f32le", str(dst)], check=True)
    I2, tp2, lra = loudness(dst)
    if tp2 > tp_ceiling:
        extra = tp2 - tp_ceiling + 0.1
        lim = lim * 10 ** (-extra / 20)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af",
                        f"volume={g:.3f}dB,aresample=192000,alimiter=limit={lim:.5f}:level=disabled:attack=1.5:release=120:asc=1,aresample=48000",
                        "-c:a", "pcm_f32le", str(dst)], check=True)
        I2, tp2, lra = loudness(dst)
    return dict(I_in=I, TP_in=tp, gain=g, I=I2, TP=tp2, LRA=lra)


if __name__ == "__main__":
    te = float(sys.argv[1]) if len(sys.argv) > 1 else None
    build(te)
    r = master(BUILD / "mix_raw.wav", BUILD / "mix_1x.wav")
    print(json.dumps(r, indent=1))
