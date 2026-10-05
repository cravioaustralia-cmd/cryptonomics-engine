"""lf04 1x audio mix: VO (untouched files, one fixed gain) + ducked music beds + hold SFX.

Writes build/mix1x.wav (48 kHz stereo float). The VO files themselves are never modified.
Music sits as a quiet bed under the voice and rises (not full) in the no-VO chapter holds.
"""
import json
import os
import re
import subprocess

import numpy as np

from design import EP, FPS

SR = 48000
BUILD = os.path.join(EP, "build")
VO_GAIN_DB = 6.0        # one global gain for every VO file (-24 LUFS files -> about -18 in the mix)
MUSIC_REF_LUFS = -18.0  # each music track normalised to this as "full"
BED_DB = -13.0          # music under the voice
HOLD_DB = -3.5          # music in holds / pauses: up, not full
SFX_TRIM_DB = 0.0

# Music leveller (short fix, 5 Oct 2026): hold the music at two steady levels instead of riding
# each track's own dynamics. Targets are music-bus RMS in dBFS on the 1x mix.
LEVEL_MUSIC = True
BED_RMS_DB = -36.3      # under the voice: about 3 dB quieter than the first delivery
HOLD_RMS_DB = -23.2     # every no-VO stretch: matches the louder holds of the first delivery (H3, H4, H7, H8, H9)
LEVEL_WIN = 2.0         # seconds, centred RMS window (offline, so no lag)
LEVEL_SMOOTH = 0.8      # seconds, gain smoothing so nothing pumps
LEVEL_MAX_BOOST = 9.0   # dB, never lift fades/near-silence more than this


def level_music(mus, lvl, cr, dur, c):
    """Gain curve (linear, at control rate cr) that sets the music bus to steady target levels.

    lvl is the smoothed duck curve (BED_DB..HOLD_DB); it is mapped to BED_RMS_DB..HOLD_RMS_DB targets.
    The open titles (H0) and the END tail keep the original fixed duck so their designed fades stay.
    """
    hop = SR // cr
    mono = mus.mean(axis=1)
    n = len(lvl)
    p = np.zeros(n, np.float64)
    sq = np.concatenate([[0.0], np.cumsum(mono.astype(np.float64) ** 2)])
    w = int(LEVEL_WIN * SR / 2)
    idx = np.clip(np.arange(n) * hop, 0, len(mono))
    lo, hi = np.clip(idx - w, 0, len(mono)), np.clip(idx + w, 0, len(mono))
    p = (sq[hi] - sq[lo]) / np.maximum(hi - lo, 1)
    raw_db = 10 * np.log10(p + 1e-12)
    frac = (lvl - BED_DB) / (HOLD_DB - BED_DB)
    target = BED_RMS_DB + frac * (HOLD_RMS_DB - BED_RMS_DB)
    gain_db = np.clip(target - raw_db, -30.0, LEVEL_MAX_BOOST)
    fixed_db = lvl
    k = int(LEVEL_SMOOTH * cr)
    gain_db = np.convolve(np.pad(gain_db, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    # keep the designed open-titles and end-tail fades: blend to the fixed duck outside S01..S40
    t = np.arange(n) / cr
    a0 = c.blk("H0")["t1"]
    a1 = c.blk("END")["t0"]
    wgt = np.clip((t - (a0 - 0.5)) / 0.5, 0, 1) * np.clip(((a1 + 0.5) - t) / 0.5, 0, 1)
    out_db = wgt * gain_db + (1 - wgt) * fixed_db
    return (10 ** (out_db / 20)).astype(np.float32)


def decode(path, mono_to_stereo=True):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR),
                                   "-"])
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def lufs(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)
    return float(m[-1])


def db(x):
    return 10 ** (x / 20)


def place(bus, sig, t, gain=1.0):
    i = int(round(t * SR))
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), len(bus) - i)
    if n > 0:
        bus[i:i + n] += sig[:n] * gain


def main():
    import cut as C
    c = C.build()
    total_frames = sum(s["nf"] for s in c.shots)
    dur = total_frames / FPS
    N = int(round(dur * SR))
    vo = np.zeros((N, 2), np.float32)
    mus = np.zeros((N, 2), np.float32)
    sfx = np.zeros((N, 2), np.float32)

    # ---------------------------------------------------------------- VO
    vo_iv = []
    for seg, t in c.vo:
        s = decode(os.path.join(EP, "audio", "vo", seg + ".mp3"))
        place(vo, s, t, db(VO_GAIN_DB))
        vo_iv.append((t, t + len(s) / SR))

    # ---------------------------------------------------------------- music
    mdir = os.path.join(EP, "audio", "music")
    cache = {}
    for f, t0, t1, off, fi, fo, g in c.music:
        if f not in cache:
            cache[f] = (decode(os.path.join(mdir, f)), lufs(os.path.join(mdir, f)))
        trk, L = cache[f]
        a = int(off * SR)
        n = int((t1 - t0) * SR)
        seg = trk[a:a + n].copy()
        if len(seg) < n:
            raise ValueError(f"music cue too long for track: {f} off {off} len {t1 - t0:.1f}")
        env = np.ones(len(seg), np.float32)
        ni, no = int(fi * SR), int(fo * SR)
        if ni:
            env[:ni] = np.linspace(0, 1, ni) ** 1.5
        if no:
            env[-no:] = np.minimum(env[-no:], np.linspace(1, 0, no) ** 1.5)
        place(mus, seg * env[:, None], t0, db(MUSIC_REF_LUFS - L + g))

    # duck envelope: bed inside VO stretches (gaps < 1.2 s stay ducked), up in holds
    iv = sorted(vo_iv)
    merged = []
    for a, b in iv:
        if merged and a - merged[-1][1] < 1.2:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    cr = 1000  # control rate
    M = int(dur * cr) + 1
    lvl = np.full(M, HOLD_DB, np.float32)
    for a, b in merged:
        lvl[max(0, int((a - 0.45) * cr)):min(M, int((b + 0.30) * cr))] = BED_DB
    k = int(0.45 * cr)
    lvl = np.convolve(np.pad(lvl, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    g = db(lvl)
    if LEVEL_MUSIC:
        g = level_music(mus, lvl, cr, dur, c)
    gs = np.interp(np.arange(N) / SR, np.arange(len(g)) / cr, g).astype(np.float32)
    mus *= gs[:, None]

    # ---------------------------------------------------------------- sfx (holds only)
    sdir = os.path.join(EP, "audio", "sfx")
    for f, t, gdb in c.sfx:
        s = decode(os.path.join(sdir, f))
        place(sfx, s, t, db(gdb + SFX_TRIM_DB))
        # guard: no SFX on a spoken word
        for a, b in vo_iv:
            if a < t + 0.3 and t < b and f != "series_sting.flac":
                print(f"WARNING sfx {f} at {t:.2f} overlaps VO {a:.2f}-{b:.2f}")

    # end fade
    nf = int(1.5 * SR)
    mix = vo + mus + sfx
    mix[-nf:] *= np.linspace(1, 0, nf)[:, None]
    peak = float(np.abs(mix).max())
    print(f"duration {dur:.3f}s  peak {20 * np.log10(peak):.2f} dBFS")
    if os.environ.get("STEMS"):
        for nm, st in (("vo", vo), ("mus", mus), ("sfx", sfx)):
            q = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                                  "-c:a", "pcm_f32le", os.path.join(BUILD, f"stem_{nm}.wav")], stdin=subprocess.PIPE)
            q.stdin.write(st.astype(np.float32).tobytes())
            q.stdin.close()
            q.wait()
    out = os.path.join(BUILD, "mix1x.wav")
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                          "-c:a", "pcm_f32le", out], stdin=subprocess.PIPE)
    p.stdin.write(mix.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"duration_1x": dur, "vo": c.vo, "music": c.music, "sfx": c.sfx,
               "levels": dict(VO_GAIN_DB=VO_GAIN_DB, MUSIC_REF_LUFS=MUSIC_REF_LUFS, BED_DB=BED_DB,
                              HOLD_DB=HOLD_DB)}, open(os.path.join(BUILD, "mix1x.json"), "w"), indent=1)
    print(out)


if __name__ == "__main__":
    main()
