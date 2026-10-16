#!/usr/bin/env python3
"""Mix + master the soundtrack for a cut from its timing JSON.

  python3 tools/mix_audio.py hero     -> build/hero_master.wav  (+ loudness report)
  python3 tools/mix_audio.py social   -> build/social_master.wav

Pipeline
  1. VO: gentle clean only (80 Hz high-pass, de-ess, light 2.5:1 compression).
     Each phrase is a contiguous slice placed at its outStart. No stretch/pitch.
  2. Music: whole-bar slices of Digital Lemonade (120 BPM) spliced with short
     crossfades exactly on downbeats, per the "music" map.
  3. Ducking: music is keyed down ~12 dB while VO speaks (60 ms attack,
     350 ms release) and comes back up in the gaps, on the drop and the CTA.
  4. SFX: sparse cues from sfx/, plus four built cues (conveyor_clack, stamp,
     machining_whirr, lock_clunk) made by layering/trimming/re-pitching them.
  5. Master: two-pass ffmpeg loudnorm to -14 LUFS integrated, -1.5 dBTP.
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SR = 48000
BUILD = os.path.join(ROOT, "build")


def ff_decode(path, af=None, ch=2):
    cmd = ["ffmpeg", "-v", "error", "-i", path]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).copy()


def write_wav(path, x):
    x = np.clip(x, -1.0, 1.0).astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(x.shape[1]),
                    "-i", "-", "-c:a", "pcm_f32le", path], input=x.tobytes(), check=True)


def lufs(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    lra = float(re.findall(r"LRA:\s+(-?[\d.]+) LU", out)[-1])
    return i, tp, lra


def db(g):
    return 10 ** (g / 20)


def fades(x, fin, fout):
    n = len(x)
    a = int(fin * SR)
    b = int(fout * SR)
    if a > 0:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    if b > 0:
        x[n - b:] *= np.linspace(1, 0, b)[:, None]
    return x


def resample_rate(x, rate):
    """Play back at `rate` (pitch + speed change together; SFX only)."""
    if abs(rate - 1) < 1e-6:
        return x
    n = int(len(x) / rate)
    src = np.arange(n) * rate
    return np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(x.shape[1])], 1).astype(np.float32)


def place(buf, x, t, gain=1.0):
    i = int(round(t * SR))
    if i < 0:
        x = x[-i:]
        i = 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i] * gain


_sfx_cache = {}


def sfx(name):
    if name not in _sfx_cache:
        _sfx_cache[name] = ff_decode(os.path.join(ROOT, "sfx", f"{name}.mp3"))
    return _sfx_cache[name]


# Where the audible hit sits inside each file: a cue time means "hit lands here".
HIT = {"whoosh_fast": 0.62, "whoosh_fast_transition": 0.95, "impact_whoosh_deep": 0.38,
       "ui_click_scifi": 0.1, "whoosh_simple_pixabay": 0.08, "conveyor_clack": 0.2, "stamp": 0.08,
       "lock_clunk": 0.15}


def impact_hit(dur, rate=1.0):
    x = resample_rate(sfx("impact_whoosh_deep")[int(0.3 * SR):].copy(), rate)
    return fades(x[: int(dur * SR)].copy(), 0.002, dur * 0.7)


def built(name):
    """Cues built from the licensed set (no new sources)."""
    if name == "conveyor_clack":
        a = resample_rate(sfx("ui_click_scifi"), 0.72)[: int(0.35 * SR)]
        b = impact_hit(0.18, 1.4) * 0.45
        out = np.zeros((max(len(a), len(b)), 2), np.float32)
        out[: len(a)] += a
        out[: len(b)] += b
        return fades(out, 0.001, 0.12)
    if name == "stamp":
        a = impact_hit(0.3, 1.25)
        b = resample_rate(sfx("ui_select_modern"), 0.85)[: int(0.3 * SR)] * 0.6
        out = np.zeros((max(len(a), len(b)), 2), np.float32)
        out[: len(a)] += a
        out[: len(b)] += b
        return out
    if name == "machining_whirr":
        r = sfx("riser_synth")
        a = resample_rate(r[int(3.0 * SR): int(4.6 * SR)].copy(), 1.6)
        return fades(a, 0.08, 0.25)
    if name == "lock_clunk":
        a = impact_hit(0.45, 0.9)
        b = resample_rate(sfx("ui_click_scifi"), 0.6)[: int(0.3 * SR)] * 0.7
        out = np.zeros((max(len(a), len(b)), 2), np.float32)
        out[: len(a)] += a
        out[: len(b)] += b
        return out
    raise KeyError(name)


def smooth_env(mask, attack, release):
    """One-pole follower on a 0/1 mask (block-wise for speed)."""
    hop = 240  # 5 ms blocks
    m = mask[::hop].astype(np.float64)
    out = np.zeros_like(m)
    aa = np.exp(-hop / (attack * SR))
    ar = np.exp(-hop / (release * SR))
    v = 0.0
    for i, x in enumerate(m):
        c = aa if x > v else ar
        v = c * v + (1 - c) * x
        out[i] = v
    return np.repeat(out, hop)[: len(mask)]


def main(name):
    os.makedirs(BUILD, exist_ok=True)
    tm = json.load(open(os.path.join(ROOT, "remotion", "src", "timing", f"{name}.json")))
    dur = tm["duration"]
    n = int(round(dur * SR))

    # ---- VO ------------------------------------------------------------
    vo_src = os.path.join(ROOT, "vo", f"{name}_vo.mp3")
    vo_clean = os.path.join(BUILD, f"{name}_vo_clean.wav")
    write_wav(vo_clean, ff_decode(vo_src, "highpass=f=80:poles=2,deesser=i=0.35:m=0.5:f=0.5,"
                                          "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=2",
                                  ch=1))
    vo_i, _, _ = lufs(vo_clean)
    vo_all = ff_decode(vo_clean, ch=1)[:, 0] * db(-18 - vo_i)  # VO stem at -18 LUFS
    vo = np.zeros((n, 2), np.float32)
    mask = np.zeros(n, np.float32)
    for seg in tm["vo"]:
        a = int((seg["srcStart"] - 0.02) * SR)
        b = int((seg["srcEnd"] + 0.06) * SR)
        x = vo_all[max(0, a): b].copy()[:, None].repeat(2, 1)
        x = fades(x, 0.015, 0.04)
        place(vo, x, seg["outStart"] - 0.02)
        i0 = int(seg["outStart"] * SR)
        i1 = min(n, int(seg["outEnd"] * SR))
        mask[i0:i1] = 1

    # ---- Music edit ------------------------------------------------------
    trk = ff_decode(os.path.join(ROOT, "music", "kmacleod-digital-lemonade.mp3"))
    trk_i, _, _ = lufs(os.path.join(ROOT, "music", "kmacleod-digital-lemonade.mp3"))
    trk *= db(-20 - trk_i)  # unducked music at about -20 LUFS
    music = np.zeros((n, 2), np.float32)
    X = 0.012  # splice crossfade half-width
    for k, m in enumerate(tm["music"]):
        last = k == len(tm["music"]) - 1
        a = int((m["trackStart"] - X) * SR)
        b = int((m["trackEnd"] + (0 if last else X)) * SR)
        x = trk[max(0, a): min(len(trk), b)].copy()
        x = fades(x, 2 * X if k else 0.03, 0 if last else 2 * X)
        place(music, x, m["outStart"] - X)
    # end: let the final chord ring, then fade under the last frames
    if name == "hero":
        end_fade_from, end_at = 82.6, 84.0
    else:
        end_fade_from, end_at = 16.9, 18.15
    i0, i1 = int(end_fade_from * SR), int(end_at * SR)
    music[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 1.5
    music[i1:] = 0
    if tm.get("stab"):
        s = tm["stab"]
        x = trk[int(s["track"] * SR): int((s["track"] + s["dur"]) * SR)].copy()
        x *= np.exp(-np.linspace(0, 5, len(x)))[:, None]
        place(music, fades(x, 0.002, 0.05), s["out"], db(-1))

    if tm.get("pad"):
        pd = tm["pad"]
        x = trk[int(pd["track"] * SR): int((pd["track"] + pd["dur"] + 1.0) * SR)].copy()
        tmp = os.path.join(BUILD, f"{name}_pad_in.wav")
        write_wav(tmp, x)
        x = ff_decode(tmp, "lowpass=f=1500,aecho=0.8:0.75:180|360|540:0.45|0.32|0.22,lowpass=f=2200")
        x = x[: int(pd["dur"] * SR)]
        x *= (np.linspace(1, 0, len(x)) ** 1.6)[:, None]
        place(music, fades(x, 0.12, 0.05), pd["out"], db(pd["gainDb"]))

    # ---- Ducking -----------------------------------------------------------
    env = smooth_env(mask, 0.06, 0.35)
    duck_db = -12.0
    gain = db(duck_db * env)
    music *= gain[:, None].astype(np.float32)

    # ---- SFX -------------------------------------------------------------
    fx = np.zeros((n, 2), np.float32)
    for c in tm["sfx"]:
        try:
            x = built(c["file"])
        except KeyError:
            x = sfx(c["file"])
        x = resample_rate(x, c.get("rate", 1.0))
        st = int(c.get("start", 0) * SR)
        x = x[st:]
        if "dur" in c:
            x = x[: int(c["dur"] * SR)]
        x = fades(x.copy(), 0.003, c.get("fade", 0.03))
        lead = max(0.0, HIT.get(c["file"], 0.0) - c.get("start", 0.0)) / c.get("rate", 1.0)
        place(fx, x, c["t"] - lead, db(c["gainDb"]))

    mix = vo + music + fx
    raw = os.path.join(BUILD, f"{name}_mix.wav")
    write_wav(raw, mix)
    np.save(os.path.join(BUILD, f"{name}_stems.npy"), np.stack([vo[:, 0], music[:, 0], fx[:, 0]]))

    # ---- Master: two-pass loudnorm ----------------------------------------
    # transparent safety limiter (-4 dBFS ceiling) so pass 2 can stay linear
    lim = os.path.join(BUILD, f"{name}_mix_lim.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                    "alimiter=limit=0.63:attack=3:release=60:level=false", "-c:a", "pcm_f32le", lim], check=True)
    raw = lim
    p1 = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af",
                         "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    st = json.loads(p1[p1.rindex("{"): p1.rindex("}") + 1])
    master = os.path.join(BUILD, f"{name}_master.wav")
    af = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
          f"measured_I={st['input_i']}:measured_TP={st['input_tp']}:measured_LRA={st['input_lra']}:"
          f"measured_thresh={st['input_thresh']}:offset={st['target_offset']}:print_format=summary")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", master],
                   check=True)
    i, tp, lra = lufs(master)
    report = {"cut": name, "integrated_lufs": i, "true_peak_dbtp": tp, "lra_lu": lra,
              "pass1_input_i": st["input_i"], "pass1_input_tp": st["input_tp"]}
    json.dump(report, open(os.path.join(BUILD, f"{name}_loudness.json"), "w"), indent=1)
    print(json.dumps(report))


if __name__ == "__main__":
    main(sys.argv[1])
