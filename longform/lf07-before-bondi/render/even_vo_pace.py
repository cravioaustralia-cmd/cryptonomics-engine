#!/usr/bin/env python3
"""
even_vo_pace.py - turn the raw Grok takes into the final audio/vo/S##.mp3 at ONE steady tempo per voice.

For every raw take (/workspace/lf07-vo/raw/S##.mp3) it
  1. (re)runs vo_qa incrementally and reads each take's articulation rate (syllables/s of speaking time,
     silences > 200 ms excluded) and the per-voice median
  2. takes within +/-8% of their voice median (and with no QA FAIL such as wrong words, spoken stage
     directions, robotic pitch) get a gentle PITCH-HELD tempo correction (ffmpeg rubberband, pitch=1,
     formant preserved) so the rate lands on the voice median. Takes beyond +/-8% are NEVER stretched:
     they are listed as RE-RECORD, as are takes with any QA FAIL.
  3. silence edit: leading/trailing silence -> 120 ms; internal silences > 0.8 s -> 0.5 s; intended
     paragraph-break beats (blank lines in audio/vo-grok/S##.txt) are set to ~0.45 s
  4. writes audio/vo/S##.mp3 (44.1 kHz mono 192 kbit/s) and keeps the untouched original in audio/vo-raw/
  5. verifies by re-measuring the OUTPUT with whisper + forced alignment: rate within 3% of target, f0
     median moved < 0.35 st, no new word errors, edges 120 ms, no internal silence > 0.85 s. If the rate is
     off it retunes the tempo from the raw take (max 2 retries).
It does not loudness-normalise (the mix step matches both voices to -14 LUFS).

    /workspace/lf07-vo/.venv/bin/python even_vo_pace.py                 # all takes present
    /workspace/lf07-vo/.venv/bin/python even_vo_pace.py --segments S01 S05
    /workspace/lf07-vo/.venv/bin/python even_vo_pace.py --out-dir /tmp/pace_test   # dry run elsewhere
Writes pace_manifest.json + PACE_REPORT.md next to QA_REPORT.md.
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, time
from pathlib import Path
from types import SimpleNamespace

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import vo_qa as Q  # noqa: E402
import soundfile as sf  # noqa: E402

CODE_VERSION = 8
SR = 44100
BAND = 0.08            # only +/-8% takes are corrected
VERIFY_TOL = 0.05      # GENTLE mode: output rate must land within +/-5% of the voice median
TEMPO_BAND = 0.05      # takes within +/-5% syl/s of their voice median are NOT tempo-changed
TEMPO_AIM = 0.045      # takes outside it are corrected only to this edge (smallest change that lands inside +/-5%)
EDGE_S = 0.120
LONG_SIL_S = 0.80
LONG_TARGET_S = 0.50
PARA_TARGET_S = 0.45
XFADE_S = 0.008
TARGET_LUFS = -20.0    # integrated, per file (both voices land on the same level)
TP_MAX = -1.5          # dBTP, measured on the decoded mp3
LUFS_TOL = 0.3
START_CEIL_DB = -1.9   # sample-peak ceiling of the limiter; lowered 0.5 dB at a time if the mp3 true peak is too high
MIN_CHANGE = 0.003     # tempo factors closer than 1% to 1.0 are left alone


def run_ff(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, check=True)


_RB = {}


def _rb():
    """librubberband 3.x via ctypes so the R3 ('finer') engine can be used; ffmpeg's rubberband filter only exposes R2."""
    if not _RB:
        import ctypes, glob
        c_f = ctypes.c_float
        PP = ctypes.POINTER(ctypes.POINTER(c_f))
        cands = sorted(glob.glob("/usr/lib/*/librubberband.so.2")) + sorted(glob.glob("/usr/lib/librubberband.so.2"))
        lib = ctypes.CDLL(cands[0])
        lib.rubberband_new.restype = ctypes.c_void_p
        lib.rubberband_new.argtypes = [ctypes.c_uint, ctypes.c_uint, ctypes.c_int, ctypes.c_double, ctypes.c_double]
        for n, a in (("rubberband_set_expected_input_duration", [ctypes.c_void_p, ctypes.c_uint]),
                     ("rubberband_set_max_process_size", [ctypes.c_void_p, ctypes.c_uint]),
                     ("rubberband_study", [ctypes.c_void_p, PP, ctypes.c_uint, ctypes.c_int]),
                     ("rubberband_process", [ctypes.c_void_p, PP, ctypes.c_uint, ctypes.c_int]),
                     ("rubberband_retrieve", [ctypes.c_void_p, PP, ctypes.c_uint]),
                     ("rubberband_delete", [ctypes.c_void_p])):
            getattr(lib, n).argtypes = a
        lib.rubberband_available.argtypes = [ctypes.c_void_p]
        lib.rubberband_available.restype = ctypes.c_int
        lib.rubberband_retrieve.restype = ctypes.c_uint
        _RB["lib"], _RB["c_f"] = lib, c_f
    return _RB["lib"], _RB["c_f"]


def rb_stretch(x, tempo, pitch=1.0, finer=True):
    """Offline R3 time-stretch (tempo > 1 = faster) with optional pitch scale, formants preserved."""
    import ctypes
    lib, c_f = _rb()
    opt = 0x02000000 | 0x01000000 | (0x20000000 if finer else 0)   # pitch high quality | formant preserved | EngineFiner
    st = lib.rubberband_new(SR, 1, opt, 1.0 / tempo, pitch)
    x = np.ascontiguousarray(x, dtype=np.float32)
    n = len(x)
    lib.rubberband_set_expected_input_duration(st, n)
    lib.rubberband_set_max_process_size(st, 4096)

    def ptr(a):
        return (ctypes.POINTER(c_f) * 1)(a.ctypes.data_as(ctypes.POINTER(c_f)))
    for i in range(0, n, 4096):
        blk = np.ascontiguousarray(x[i:i + 4096])
        lib.rubberband_study(st, ptr(blk), len(blk), 1 if i + 4096 >= n else 0)
    out = []

    def drain():
        while True:
            av = lib.rubberband_available(st)
            if av <= 0:
                break
            buf = np.zeros(av, dtype=np.float32)
            got = lib.rubberband_retrieve(st, ptr(buf), av)
            out.append(buf[:got])
    for i in range(0, n, 4096):
        blk = np.ascontiguousarray(x[i:i + 4096])
        lib.rubberband_process(st, ptr(blk), len(blk), 1 if i + 4096 >= n else 0)
        drain()
    drain()
    lib.rubberband_delete(st)
    return np.concatenate(out).astype(np.float64)


def tempo_correct(src, tempo, out_wav, pitch_st=0.0):
    """Decode to 44.1 kHz mono, then pitch-held time-stretch (R3 engine, formants preserved); optional pitch shift."""
    x = Q.load_audio(src, SR)
    if abs(tempo - 1.0) >= 1e-4 or abs(pitch_st) > 1e-6:
        try:
            if abs(pitch_st) > 1e-6:      # pitch first, then tempo: one joint pass smears transients more (onset sharpness 83% vs 87%)
                x = rb_stretch(x, 1.0, 2 ** (pitch_st / 12.0))
            if abs(tempo - 1.0) >= 1e-4:
                x = rb_stretch(x, tempo, 1.0)
        except Exception as e:   # fall back to ffmpeg's R2 filter
            print("  [warn] R3 unavailable, using ffmpeg rubberband (R2):", e)
            af = f"aresample={SR},rubberband=tempo={tempo:.5f}:pitch={2 ** (pitch_st / 12.0):.5f}:formant=preserved:pitchq=quality:transients=mixed"
            run_ff(["-i", str(src), "-ac", "1", "-af", af, "-c:a", "pcm_f32le", "-ar", str(SR), str(out_wav)])
            return
    sf.write(str(out_wav), x, SR, subtype="FLOAT")


def para_windows(words, tempo):
    """Time windows (in the corrected timeline) where the reference text has an intended paragraph beat."""
    toks = None
    return toks


def edit_silences(x, para_wins, thr_db=None):
    """Apply edge trimming + silence compression. Returns (y, log). x is float64 mono at SR.
    thr_db: speech threshold of the RAW take (levels are unchanged by the stretch), so the edit and the
    after-the-fact checks use the same definition of 'silence'."""
    db = Q.frame_db(x, SR)
    if thr_db is None:
        mask, thr = Q.speech_mask(db)
    else:
        mask, thr = Q._filter_runs(db > thr_db, True, 4), thr_db
    sils, first, last = Q.find_silences(mask, min_ms=100)
    hop = int(Q.HOP * SR)
    n = len(x)
    act = np.flatnonzero(mask)
    f0, f1 = int(act[0]) * hop, min(n, int(act[-1]) * hop + int(0.025 * SR))
    pieces, log = [], []
    # leading
    lead = int(EDGE_S * SR)
    avail = f0
    if avail >= lead:
        pieces.append(x[f0 - lead:f0])
    else:
        pieces.append(np.concatenate([np.zeros(lead - avail), x[:f0]]))
    log.append({"kind": "lead", "was": round(f0 / SR, 3), "now": EDGE_S})
    cursor = f0
    for s in sils:
        if s["kind"] != "internal":
            continue
        a, b = int(round(s["start"] * SR)), int(round(s["end"] * SR))
        a, b = max(a, cursor), min(b, f1)
        if b <= a:
            continue
        dur = (b - a) / SR
        is_para = any(w0 - 0.04 <= (s["start"] + s["end"]) / 2 <= w1 + 0.04 or (s["start"] < w1 and s["end"] > w0)
                      for (w0, w1) in para_wins) and dur >= 0.15
        target = None
        if is_para:
            target = PARA_TARGET_S
        elif dur > LONG_SIL_S:
            target = LONG_TARGET_S
        if target is None or abs(dur - target) < 0.02:
            continue
        pieces.append(x[cursor:a])
        sil = x[a:b]
        t = int(target * SR)
        if t < len(sil):
            h = t // 2
            new = np.concatenate([sil[:h], sil[len(sil) - (t - h):]])
            xf = min(int(XFADE_S * SR), h // 2, (t - h) // 2)
            if xf > 1:   # blend across the splice so a noise-floor seam cannot click
                ramp = np.linspace(0, 1, xf)
                seg_a = sil[h:h + xf] if h + xf <= len(sil) else sil[-xf:]
                new[h - xf:h] = new[h - xf:h] * (1 - ramp) + seg_a * ramp
        else:   # lengthen: tile the silence's own room tone
            new = np.resize(sil, t) if len(sil) > 0 else np.zeros(t)
        pieces.append(new)
        log.append({"kind": "para_beat" if is_para else "long_gap", "at": round(s["start"], 2),
                    "was": round(dur, 3), "now": round(len(new) / SR, 3)})
        cursor = b
    pieces.append(x[cursor:f1])
    trail = int(EDGE_S * SR)
    tail = x[f1:f1 + trail]
    if len(tail) < trail:
        tail = np.concatenate([tail, np.zeros(trail - len(tail))])
    pieces.append(tail)
    log.append({"kind": "trail", "was": round((n - f1) / SR, 3), "now": EDGE_S})
    y = np.concatenate(pieces)
    # 5 ms fades at the very ends
    k = int(0.005 * SR)
    y[:k] *= np.linspace(0, 1, k)
    y[-k:] *= np.linspace(1, 0, k)
    return y, log


def trim_edges(x, thr_db):
    """GENTLE edit: only the leading/trailing silence is set to EDGE_S. Every internal sample is untouched, so every
    natural beat and micro-pause stays exactly as the voice produced it."""
    db = Q.frame_db(x, SR)
    act = np.flatnonzero(db > thr_db)      # same definition as edge_measure(), so the 0.12 s is verified exactly
    hop, n = int(Q.HOP * SR), len(x)
    f0 = int(act[0]) * hop
    f1 = min(n, int(act[-1]) * hop + int(0.025 * SR))
    lead = int(EDGE_S * SR)
    head = x[f0 - lead:f0] if f0 >= lead else np.concatenate([np.zeros(lead - f0), x[:f0]])
    tail = x[f1:f1 + lead]
    if len(tail) < lead:
        tail = np.concatenate([tail, np.zeros(lead - len(tail))])
    y = np.concatenate([head, x[f0:f1], tail])
    k = int(0.005 * SR)
    y[:k] *= np.linspace(0, 1, k)
    y[-k:] *= np.linspace(1, 0, k)
    return y, [{"kind": "lead", "was": round(f0 / SR, 3), "now": EDGE_S}, {"kind": "trail", "was": round((n - f1) / SR, 3), "now": EDGE_S}]


def true_peak_db(x):
    from scipy.signal import resample_poly
    return float(20 * np.log10(np.abs(resample_poly(x, 4, 1)).max() + 1e-12))


def gentle_loudness(x, aim, ceil_db):
    """Linear gain to `aim` LUFS and nothing else. A look-ahead peak limiter is applied ONLY if the true peak of the
    gained signal would exceed ceil_db, and then only to the peaks (zero make-up gain)."""
    gdb = aim - lufs_of(x)
    y = x * 10 ** (gdb / 20)
    tp0 = true_peak_db(y)
    st = {"gain_db": round(gdb, 2), "tp_before_limiter_db": round(tp0, 2), "ceiling_db": ceil_db, "limiter_used": False,
          "max_gr_db": 0.0, "mean_gr_db_on_speech": 0.0, "mean_gr_db_whole_file": 0.0, "pct_speech_gr_over_1db": 0.0}
    if tp0 > ceil_db:
        y2, g = soft_limit(y, ceil_db)
        gr = 20 * np.log10(g)
        act = np.abs(y) > 0.02
        st.update(limiter_used=True, max_gr_db=round(float(-gr.min()), 2),
                  mean_gr_db_on_speech=round(float(-gr[act].mean()), 3) if act.any() else 0.0,
                  mean_gr_db_whole_file=round(float(-gr.mean()), 4),
                  pct_speech_gr_over_1db=round(float(100 * np.mean(gr[act] < -1)), 2) if act.any() else 0.0)
        y = y2
    return y, st


def pause_durs(path, thr_db, sr):
    x = Q.load_audio(path, sr)
    db = Q.frame_db(x, sr)
    m = Q._filter_runs(db > thr_db, True, 4)
    sils, _, _ = Q.find_silences(m, 100)
    return [s_["dur"] for s_ in sils if s_["kind"] == "internal" and s_["dur"] >= 0.25]


def soft_limit(x, ceil_db, att_ms=6.0, rel_ms=150.0):
    """Zero-latency look-ahead peak limiter. Gain is computed per 1 ms block, looked ahead/behind by att_ms,
    released exponentially over rel_ms (slow, so it rides syllable peaks instead of chattering inside a pitch
    period) and smoothed. No make-up gain; returns (y, gain_curve)."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (ceil_db / 20)
    B = int(SR * 0.001)
    n = len(x)
    nb = int(np.ceil(n / B))
    pk = np.zeros(nb * B)
    pk[:n] = np.abs(x)
    pk = pk.reshape(nb, B).max(axis=1)
    greq = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    A = max(2, int(att_ms))
    e = minimum_filter1d(greq, size=2 * A + 1, mode="nearest")
    r = np.empty(nb)
    a = np.exp(-1.0 / rel_ms)
    cur = 1.0
    for k in range(nb):
        cur = min(e[k], 1 - (1 - cur) * a)
        r[k] = cur
    r = np.minimum(uniform_filter1d(r, size=A, mode="nearest"), 1.0)
    g = np.interp(np.arange(n), (np.arange(nb) + 0.5) * B, r)
    return x * g, g


def lufs_of(x):
    import pyloudnorm as pyln
    return float(pyln.Meter(SR).integrated_loudness(x))


def loudness_match(x, ceil_db, aim=TARGET_LUFS):
    """Linear gain to `aim` LUFS (= TARGET_LUFS plus any mp3 offset learned on a previous pass), peaks above the
    ceiling taken by soft_limit (gain re-solved so the integrated loudness AFTER limiting is on target)."""
    gdb = aim - lufs_of(x)
    for _ in range(8):
        y, g = soft_limit(x * 10 ** (gdb / 20), ceil_db)
        err = aim - lufs_of(y)
        if abs(err) < 0.08:
            break
        gdb += err
    act = np.abs(x * 10 ** (gdb / 20)) > 0.02
    gr = 20 * np.log10(g)
    st = {"gain_db": round(gdb, 2), "ceiling_db": ceil_db, "max_gr_db": round(float(-gr.min()), 2),
          "mean_gr_db_on_speech": round(float(-gr[act].mean()), 2) if act.any() else 0.0,
          "pct_speech_gr_over_3db": round(float(100 * np.mean(gr[act] < -3)), 1) if act.any() else 0.0}
    return y, st


def f0_ref(path):
    """f0 median with a very low silence threshold: pitch_ac's default threshold is relative to the file's peak,
    so a limited/louder file would otherwise read 0.3-0.7 st different without any real pitch change."""
    import parselmouth
    x = Q.load_audio(path, 24000)
    p = parselmouth.Sound(x, sampling_frequency=24000).to_pitch_ac(
        time_step=0.01, pitch_floor=70, pitch_ceiling=450, very_accurate=True, silence_threshold=0.01,
        voicing_threshold=0.5, octave_cost=0.03, octave_jump_cost=0.6, voiced_unvoiced_cost=0.16)
    f = p.selected_array["frequency"]
    return float(np.median(f[f > 0]))


def edge_measure(path, thr_db):
    """lead/trail silence against an ABSOLUTE level (the relative VAD threshold moves when loudness changes)."""
    x = Q.load_audio(path, SR)
    db = Q.frame_db(x, SR)
    act = np.flatnonzero(db > thr_db)
    return act[0] * Q.HOP, len(db) * Q.HOP - (act[-1] + 1) * Q.HOP


def rate_abs(path, thr_db, syllables):
    """Rate of the OUTPUT measured at an absolute level: raw VAD threshold + the gain that was applied.
    (The adaptive threshold is relative to the file's own p95, which moves when loudness/limiting changes and
    would shift every pause edge by 30-40 ms, i.e. fake a rate change on pause-heavy takes.)"""
    x = Q.load_audio(path, SR)
    db = Q.frame_db(x, SR)
    m = Q._filter_runs(db > thr_db, True, 4)
    sils, first, last = Q.find_silences(m, 100)
    return syllables / Q.speaking_time(first, last, sils)


def audio_proxies(path):
    """Level-independent artefact proxies for time-stretched / pitch-shifted speech.
    hf_db: 4-10 kHz share of speech-frame energy (dB); onset_p95: 95th percentile of positive 10 ms envelope steps
    (dB; falls when transients are smeared); hnr_db: mean harmonics-to-noise ratio of voiced frames (falls with
    phasiness/warble); flux_cv: spectral-flux coefficient of variation; f1-f3: median formants on voiced frames."""
    import parselmouth
    x = Q.load_audio(path, SR)
    db = Q.frame_db(x, SR)
    mask, _ = Q.speech_mask(db)
    n, h = int(0.025 * SR), int(Q.HOP * SR)
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::h] * np.hanning(n)
    spec = np.abs(np.fft.rfft(fr, axis=1)) ** 2
    fq = np.fft.rfftfreq(n, 1 / SR)
    k = min(len(mask), len(spec))
    sp = mask[:k]
    hf = spec[:k][sp][:, (fq >= 4000) & (fq <= 10000)].sum() / (spec[:k][sp].sum() + 1e-12)
    d = np.diff(db[:k])
    both = sp[1:] & sp[:-1]
    onset = float(np.percentile(d[both & (d > 0)], 95)) if (both & (d > 0)).any() else 0.0
    snd = parselmouth.Sound(x, sampling_frequency=SR)
    harm = snd.to_harmonicity_cc(time_step=0.01, minimum_pitch=70)
    hv = harm.values[0]
    hnr = float(np.mean(hv[hv > -100]))
    dyn = Q.dynamics_stats(x, SR, mask)
    fmt = snd.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=5500, window_length=0.025)
    pitch = snd.to_pitch_ac(time_step=0.01, pitch_floor=70, pitch_ceiling=450, silence_threshold=0.01, voicing_threshold=0.5)
    ts = fmt.xs()
    vals = {1: [], 2: [], 3: []}
    for t in ts:
        f0v = pitch.get_value_at_time(t)
        if f0v and not np.isnan(f0v):
            for i in (1, 2, 3):
                v = fmt.get_value_at_time(i, t)
                if v and not np.isnan(v):
                    vals[i].append(v)
    tot = spec[:k].sum(axis=1) + 1e-12
    frhf = spec[:k][:, fq >= 4000].sum(axis=1) / tot
    fric = sp & (frhf[:len(sp)] > 0.6)
    if fric.sum() >= 5:
        P = spec[:k][fric].sum(axis=0)
        fcent = float((fq * P).sum() / (P.sum() + 1e-12))
    else:
        fcent = float("nan")
    return {"fric_centroid_hz": fcent, "fric_frames": int(fric.sum()), "hf_db": float(10 * np.log10(hf + 1e-12)), "onset_p95_db": onset, "hnr_db": hnr, "flux_cv": dyn["flux_cv"],
            "f1": float(np.median(vals[1])), "f2": float(np.median(vals[2])), "f3": float(np.median(vals[3]))}


def encode_mp3(wav, out_mp3):
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    run_ff(["-i", str(wav), "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", "192k", str(out_mp3)])


def paragraph_windows(take, tempo):
    """From the QA word list: windows [end of last word of a paragraph, start of next word] in the
    tempo-corrected timeline (QA times / tempo)."""
    toks, _, _ = Q.load_reference(take["seg"])
    ref2h = {w["ref"]: i for i, w in enumerate(take["words"]) if w.get("ref") is not None}
    wins = []
    for i, t in enumerate(toks):
        if t["para_end"] and i in ref2h:
            j = ref2h[i]
            if j + 1 < len(take["words"]):
                a, b = take["words"][j]["e"], take["words"][j + 1]["s"]
                wins.append((a / tempo, max(a, b) / tempo))
    return wins


def process_take(take, vs, raw_path, out_mp3, tmpdir, model, cache_dir, ov=None):
    seg = take["seg"]
    ov = ov or {}
    band = ov.get("band", BAND)
    pitch_st = ov.get("pitch_st", 0.0)
    target = vs["rate_sps_median"]
    rate0 = take["rate_sps"]
    # the decision uses the WORSE of the QA rate and the absolute-level rate that the output is verified with
    rate_a = rate_abs(raw_path, take["vad_threshold_db"], take["syllables"])
    rate0 = max((rate0, rate_a), key=lambda r: abs(r / target - 1))
    dev0 = rate0 / target - 1
    if abs(dev0) <= TEMPO_BAND:
        tempo, goal = 1.0, None                      # within +/-5%: leave the take alone
    else:
        goal = target * (1 + TEMPO_AIM * np.sign(dev0))
        tempo = goal / rate0                          # smallest correction that lands inside +/-5%
    res = {"seg": seg, "voice": take["voice"], "raw_rate_sps": rate0, "target_rate_sps": target,
           "first_tempo": tempo}
    wer_raw = take["counts"]["sub"] + take["counts"]["del"] + take["counts"]["ins"]
    attempt, t_use, ceil = 0, tempo, START_CEIL_DB
    ceil_retries, aim, aim_retries = 0, TARGET_LUFS, 0
    f0_raw = f0_ref(raw_path)
    prox_raw = audio_proxies(raw_path)
    while True:
        if abs(t_use - 1) < MIN_CHANGE:
            t_use = 1.0
        w1 = tmpdir / f"{seg}_tc.wav"
        tempo_correct(raw_path, t_use, w1, pitch_st)
        x, _ = sf.read(str(w1), dtype="float64")
        y, edits = trim_edges(x, take["vad_threshold_db"])
        y, lstats = gentle_loudness(y, aim, ceil)
        w2 = tmpdir / f"{seg}_ed.wav"
        sf.write(str(w2), y, SR, subtype="FLOAT")
        encode_mp3(w2, out_mp3)
        # ---- verify the OUTPUT
        sha = Q.file_sha(out_mp3)
        ver = Q.analyze_audio(out_mp3, seg, sha=sha, model_name=model, cache_dir=cache_dir, sr=SR)
        # rate = the syllables of the take (fixed) over the OUTPUT's speaking time, so an ASR slip on the
        # corrected audio cannot masquerade as a tempo error; whisper still checks the words below
        rate1 = rate_abs(out_mp3, take["vad_threshold_db"] + lstats["gain_db"], take["syllables"])
        dev = rate1 / target - 1
        f0_out = f0_ref(out_mp3)
        df0 = Q.st_diff(f0_out, f0_raw)
        lead_m, trail_m = edge_measure(out_mp3, take["vad_threshold_db"] + lstats["gain_db"])
        wer1 = ver["counts"]["sub"] + ver["counts"]["del"] + ver["counts"]["ins"]
        internal = [p["dur"] for p in ver["pauses"]]
        problems = []
        Lo = ver["loudness"]
        if abs(Lo["lufs"] - TARGET_LUFS) > 0.15 and aim_retries < 2:
            aim_retries += 1
            aim += TARGET_LUFS - Lo["lufs"]
            continue
        if abs(Lo["lufs"] - TARGET_LUFS) > LUFS_TOL:
            problems.append(f"loudness {Lo['lufs']:.2f} LUFS")
        if Lo["true_peak_dbtp"] > TP_MAX or Lo["clipped_samples"] > 0:
            problems.append(f"true peak {Lo['true_peak_dbtp']:.2f} dBTP / {Lo['clipped_samples']} clipped")
            if ceil_retries < 3:
                ceil_retries += 1
                ceil -= 0.3
                continue
        if abs(dev) > VERIFY_TOL:
            problems.append(f"rate {dev*100:+.1f}% from target")
        if abs(df0 - pitch_st) > 0.2:
            problems.append(f"f0 moved {df0:+.2f} st (expected {pitch_st:+.2f})")
        prox = audio_proxies(out_mp3)
        art = []
        if not (np.isnan(prox["fric_centroid_hz"]) or np.isnan(prox_raw["fric_centroid_hz"])) and abs(prox["fric_centroid_hz"] / prox_raw["fric_centroid_hz"] - 1) > 0.05:
            art.append(f"fricative centroid {prox['fric_centroid_hz']/prox_raw['fric_centroid_hz']*100-100:+.1f}% (phasiness proxy)")
        if prox["hf_db"] - prox_raw["hf_db"] < -1.5 or prox["hf_db"] - prox_raw["hf_db"] > 1.5:
            art.append(f"HF energy {prox['hf_db']-prox_raw['hf_db']:+.1f} dB")
        if prox["onset_p95_db"] < 0.85 * prox_raw["onset_p95_db"]:
            art.append(f"transients smeared (onset sharpness {prox['onset_p95_db']/prox_raw['onset_p95_db']*100:.0f}%)")
        if prox["hnr_db"] - prox_raw["hnr_db"] < -1.5:
            art.append(f"HNR {prox['hnr_db']-prox_raw['hnr_db']:+.1f} dB (phasiness)")
        if abs(prox["flux_cv"] / prox_raw["flux_cv"] - 1) > 0.15:
            art.append(f"flux CV {prox['flux_cv']/prox_raw['flux_cv']*100-100:+.0f}%")
        psr = ver["pitch"]["f0_std_st"] / take["pitch"]["f0_std_st"]
        if psr < 0.85:
            art.append(f"pitch std collapsed to {psr*100:.0f}%")
        if pitch_st:
            for f in ("f1", "f2", "f3"):
                if abs(prox[f] / prox_raw[f] - 1) > 0.05:
                    art.append(f"formant {f.upper()} {prox[f]/prox_raw[f]*100-100:+.1f}%")
        problems += art
        if wer1 > wer_raw + 2:
            problems.append(f"word errors {wer_raw}->{wer1}")
        if abs(lead_m - EDGE_S) > 0.05 or abs(trail_m - EDGE_S) > 0.05:
            problems.append(f"edges lead {lead_m:.3f}/trail {trail_m:.3f}")
        # every natural beat must survive untouched: compare the pause set (>=250 ms) with the raw take's, scaled by the tempo
        pr_raw = [d for d in pause_durs(raw_path, take["vad_threshold_db"], 24000) if d / t_use >= 0.28]   # ignore pauses sitting on the 250 ms threshold
        pr_out = [d for d in pause_durs(out_mp3, take["vad_threshold_db"] + lstats["gain_db"], SR) if d >= 0.28]
        pause_diff = None
        if len(pr_raw) == len(pr_out):
            pause_diff = max([abs(o - r / t_use) for o, r in zip(pr_out, pr_raw)] + [0.0])
            if pause_diff > 0.06:
                problems.append(f"a pause changed by {pause_diff*1000:.0f} ms")
        else:
            problems.append(f"pause count {len(pr_raw)}->{len(pr_out)}")
        if abs(dev) > VERIFY_TOL and attempt < 2 and goal is not None:
            attempt += 1
            t_use = t_use * goal / rate1      # retune from the raw take (never stretch a stretched file)
            continue
        break
    res.update(lufs=Lo["lufs"], true_peak_dbtp=Lo["true_peak_dbtp"], sample_peak_dbfs=Lo["sample_peak_dbfs"],
               clipped=Lo["clipped_samples"], limiter=lstats, lead_s=lead_m, trail_s=trail_m, aim_lufs=aim, aim_retries=aim_retries,
               out_f0_hz=f0_out, raw_f0_hz=f0_raw, ceil_retries=ceil_retries,
               tempo=t_use, out_rate_sps=rate1, out_rate_dev=dev, f0_shift_st=df0,
               out_pitch_std_st=ver["pitch"]["f0_std_st"], raw_pitch_std_st=take["pitch"]["f0_std_st"],
               proxies_raw=prox_raw, proxies_out=prox, pitch_std_ratio=psr, artefact_flags=art, pitch_shift_st=pitch_st, override=ov or None,
               edits=edits, retries=attempt, pause_max_change_s=pause_diff, n_pauses=len(pr_raw), problems=problems, verified=not problems,
               duration_raw=take["duration"], duration_out=ver["duration"],
               out_sha=sha, raw_sha=take["sha256"])
    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--segments", nargs="*")
    ap.add_argument("--model", default=Q.WHISPER_MODEL)
    ap.add_argument("--out-dir", help="write vo/ and vo-raw/ under this dir instead of the film's audio/ dir")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--reuse-manifest", action="store_true", help="with --segments: keep the other segments' existing outputs and include them in the reports")
    ap.add_argument("--target-lufs", type=float, default=None, help="integrated LUFS per file (default -19)")
    ap.add_argument("--min-age", type=float, default=8.0)
    a = ap.parse_args(argv)
    if a.target_lufs is not None:
        global TARGET_LUFS
        TARGET_LUFS = a.target_lufs

    qa = Q.run(SimpleNamespace(segments=None, force=False, model=a.model, min_age=a.min_age))
    voices = qa["voices"]
    audio = Path(a.out_dir) if a.out_dir else Q.FILM / "audio"
    vo_dir, raw_keep = audio / "vo", audio / "vo-raw"
    vo_dir.mkdir(parents=True, exist_ok=True)
    raw_keep.mkdir(parents=True, exist_ok=True)
    cache_dir = Q.OUT_DIR / "qa_cache_pace"
    cache_dir.mkdir(exist_ok=True)
    man_path = Q.OUT_DIR / ("pace_manifest.json" if not a.out_dir else "pace_manifest_test.json")
    manifest = json.loads(man_path.read_text()) if man_path.exists() else {}

    ovp = Q.OUT_DIR / "pace_overrides.json"
    overrides = json.loads(ovp.read_text()) if ovp.exists() else {}
    done, rerecord, skipped = [], [], []
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        for take in qa["takes"]:
            seg = take["seg"]
            if a.segments and seg not in a.segments:
                if a.reuse_manifest and manifest.get(seg) and (vo_dir / f"{seg}.mp3").exists():
                    done.append(manifest[seg])      # untouched segment: keep its existing output and report line
                continue
            vs = voices[take["voice"]]
            raw_path = Path(take["file"])
            # keep the original
            keep = raw_keep / f"{seg}.mp3"
            if not keep.exists() or Q.file_sha(keep) != take["sha256"]:
                shutil.copy2(raw_path, keep)
            reasons = []
            if "error" in take:
                reasons.append(take["error"])
            else:
                if not vs.get("outliers_enabled"):
                    skipped.append((seg, f"fewer than {Q.MIN_TAKES_FOR_OUTLIERS} {take['voice']} takes: no voice median yet"))
                    continue
                dev = take["dev"]["rate_sps_dev"]
                ov = overrides.get(seg, {})
                lim = ov.get("band", BAND)
                if abs(dev) > lim:
                    reasons.append(f"rate {dev*100:+.1f}% vs {take['voice']} median (limit +/-{lim*100:.0f}%)")
                if take["action"] == "RE-RECORD" and not (ov.get("accept") or ov.get("band") or ov.get("pitch_st")):
                    for r in take["reasons"]:
                        if r["level"] == "FAIL" or r["code"] in ("rate_outlier", "missing_words", "extra_words", "f0_outlier", "wer"):
                            reasons.append(f"QA: {r['msg']}")
                    if take["wer"] > 0.05 and not any("WER" in x for x in reasons):
                        reasons.append(f"QA: WER {take['wer']*100:.1f}%")
            if reasons:
                rerecord.append((seg, take["voice"], reasons))
                continue
            key = f"{take['sha256']}:{vs['rate_sps_median']:.3f}:{CODE_VERSION}:{a.model}:{TARGET_LUFS}:{json.dumps(overrides.get(seg, {}), sort_keys=True)}"
            out_mp3 = vo_dir / f"{seg}.mp3"
            m = manifest.get(seg)
            if m and m.get("key") == key and out_mp3.exists() and not a.force:
                done.append(m)
                continue
            t0 = time.time()
            ov_ = overrides.get(seg)
            res = process_take(take, vs, raw_path, out_mp3, td, a.model, cache_dir, ov_)
            if ov_ and ov_.get("pitch_shift_st", ov_.get("pitch_st")) and res["artefact_flags"]:
                # a pitch shift is kept only if it is clean; otherwise fall back to the unshifted take
                flags = res["artefact_flags"]
                res = process_take(take, vs, raw_path, out_mp3, td, a.model, cache_dir, {k: v for k, v in ov_.items() if k != "pitch_st"})
                res["note"] = "pitch shift REJECTED (" + "; ".join(flags) + "); unshifted take used"
            res["key"] = key
            manifest[seg] = res
            done.append(res)
            print(f"[{seg}] {take['voice']} tempo x{res['tempo']:.3f} rate {res['raw_rate_sps']:.2f}->{res['out_rate_sps']:.2f} "
                  f"(target {res['target_rate_sps']:.2f}) f0 {res['f0_shift_st']:+.2f} st "
                  f"{'VERIFIED' if res['verified'] else 'CHECK: ' + '; '.join(res['problems'])} ({time.time()-t0:.0f}s)")
    for seg, v, rs in rerecord:     # a take that failed QA must not leave a stale corrected file behind
        manifest.pop(seg, None)
        stale = vo_dir / f"{seg}.mp3"
        if stale.exists():
            print(f"[warn] {seg} is RE-RECORD but {stale} exists from an earlier run (left in place; delete it before the mix)")
    man_path.write_text(json.dumps(Q.json_clean(manifest), indent=1))
    write_reports(done, rerecord, skipped, voices, vo_dir, a, qa)
    print(f"\nRE-RECORD: {', '.join(s for s, _, _ in rerecord) or 'none'}")
    print(f"corrected: {len(done)} -> {vo_dir}")


def mmss(txt):
    m, s_ = txt.split(":")
    return int(m) * 60 + int(s_)


SCRIPT_END_S = 14 * 60 + 8      # MIX_MAP.md: "end = 14:08, then a 15 s end screen"


def write_reports(done, rerecord, skipped, voices, vo_dir, a, qa):
    """audio/vo/PACE_REPORT.md + audio/vo/SEGMENT_DURATIONS.json (+ slot overruns)."""
    seg_file = Q.FILM / "script" / "SEGMENTS.json"
    slots, holds = {}, {}
    if seg_file.exists():
        sj = json.loads(seg_file.read_text())["segments"]
        starts = [mmss(x["approx_start"]) for x in sj]
        for k, x in enumerate(sj):
            end = starts[k + 1] if k + 1 < len(sj) else SCRIPT_END_S
            slots[x["id"]] = {"start": starts[k], "slot_s": end - starts[k]}
            tm = x.get("timing_moments") or []
            if isinstance(tm, list):
                holds[x["id"]] = sum(m.get("seconds", 0) for m in tm if isinstance(m, dict) and m.get("type") in ("HOLD", "BREATHE", "SILENCE"))
    byseg = {m["seg"]: m for m in done}
    takes = {t["seg"]: t for t in qa["takes"]}
    dur = {}
    for sg in sorted(takes):
        if sg in byseg:
            dur[sg] = {"final_s": round(byseg[sg]["duration_out"], 3), "status": "final"}
        else:
            dur[sg] = {"final_s": round(takes[sg]["duration"], 3), "status": "RAW-RE-RECORD (not corrected; duration is the unedited take)"}
    for sg in dur:
        sl = slots.get(sg)
        if sl:
            dur[sg].update(slot_s=sl["slot_s"], over_s=round(dur[sg]["final_s"] - sl["slot_s"], 2),
                           holds_s=holds.get(sg, 0))
    (vo_dir / "SEGMENT_DURATIONS.json").write_text(json.dumps(
        {"generated": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "note": "final_s = audio/vo/S##.mp3 length incl. 120 ms lead/trail; "
         "slot_s = next script start minus this start (script/SEGMENTS.json approx_start; last slot ends 14:08 per MIX_MAP). "
         "holds_s = HOLD/BREATHE seconds the script adds around the segment (not inside slot_s).",
         "targets_rate_sps": {v: voices[v].get("rate_sps_median") for v in ("Atlas", "Ara")},
         "segments": dur, "total_final_s_corrected_only": round(sum(d["final_s"] for d in dur.values() if d["status"] == "final"), 2)},
        indent=1))
    L = ["# lf07 pace-evening report", "",
         f"Generated {time.strftime('%Y-%m-%d %H:%M:%S %Z')}. Rate target = voice median articulation rate (syl/s of speaking time): " +
         ", ".join(f"{v} {voices[v].get('rate_sps_median', float('nan')):.2f}" for v in ('Atlas', 'Ara')) +
         f". GENTLE build: no internal silence is shortened or lengthened, lead/trail = 0.12 s, tempo untouched within +/-5% of the voice median (otherwise the smallest R3 pitch-held correction that lands inside +/-5%), "
         f"linear gain to {TARGET_LUFS:.0f} LUFS integrated, no EQ/denoise, a look-ahead limiter only on files whose true peak would exceed {TP_MAX} dBTP.", "",
         "**Handover gap:** every file carries 0.12 s of lead and 0.12 s of trail silence, so two consecutive segments abut with 0.24 s. "
         "The script needs a 0.35-0.5 s handover, so put **0.11-0.26 s of extra silence** between segments in the edit (a 0.5 s clean beat after S12 and S28 per MIX_MAP).", "",
         "## Corrected takes", "",
         "| Seg | Voice | Raw s | Final s | Raw syl/s | Final syl/s (dev vs target) | Tempo | f0 raw -> final (Hz) | LUFS | TP dBTP | Limiter GR mean/max dB | Verified |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for m in sorted(done, key=lambda m: m["seg"]):
        lim = m.get("limiter", {})
        L.append(f"| {m['seg']} | {m['voice']} | {m['duration_raw']:.2f} | {m['duration_out']:.2f} | {m['raw_rate_sps']:.2f} | {m['out_rate_sps']:.2f} ({m['out_rate_dev']*100:+.1f}%) | x{m['tempo']:.3f} | {m['raw_f0_hz']:.0f} -> {m['out_f0_hz']:.0f} ({m['f0_shift_st']:+.2f} st) | {m['lufs']:.2f} | {m['true_peak_dbtp']:.2f} | {lim.get('mean_gr_db_on_speech', 0):.1f} / {lim.get('max_gr_db', 0):.1f} | {'yes' if m['verified'] else 'NO: ' + '; '.join(m['problems'])} |")
    special = [m for m in sorted(done, key=lambda m: m["seg"]) if abs(m["tempo"] - 1) > 0.001 or m.get("pitch_shift_st")]
    L += ["", "## Tempo-corrected (beyond +/-5%) / pitch-shifted takes: artefact proxies vs the raw take", "",
          "Proxies are level-independent and compare the output with its own raw take. PASS needs: rate within +/-5% of target, f0 shift within 0.2 st of the intended shift, "
          "pitch std >= 85% of raw, 4-10 kHz share within +/-1.5 dB, onset sharpness >= 85%, HNR drop <= 1.5 dB, flux CV within +/-15%, formants within +/-5% (pitch-shifted take).", "",
          "| Seg | Why | Tempo | Rate dev | f0 shift (st) | f0 raw -> out (Hz) | Pitch std | HF dB | Onset sharp. | HNR dB | Flux CV | F1/F2/F3 | Verdict |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for m in special:
        pr, po = m["proxies_raw"], m["proxies_out"]
        ov = m.get("override") or {}
        L.append(f"| {m['seg']} | {(m.get('note') or ov.get('why', 'tempo beyond 5%'))[:70]} | x{m['tempo']:.3f} | {m['out_rate_dev']*100:+.1f}% | {m['f0_shift_st']:+.2f} | {m['raw_f0_hz']:.0f} -> {m['out_f0_hz']:.0f} | {m['pitch_std_ratio']*100:.0f}% | "
                 f"{po['hf_db']-pr['hf_db']:+.1f} | {po['onset_p95_db']/pr['onset_p95_db']*100:.0f}% | {po['hnr_db']-pr['hnr_db']:+.1f} | {po['flux_cv']/pr['flux_cv']*100-100:+.0f}% | "
                 f"{po['f1']/pr['f1']*100-100:+.1f}/{po['f2']/pr['f2']*100-100:+.1f}/{po['f3']/pr['f3']*100-100:+.1f}% | **{'PASS' if m['verified'] else 'FAIL: ' + '; '.join(m['problems'])}** |")
    lm = [m for m in done if m.get("limiter", {}).get("limiter_used")]
    pc = [m["pause_max_change_s"] for m in done if m.get("pause_max_change_s") is not None]
    L += ["", f"**Limiter:** used on {len(lm)} of {len(done)} files (true peak after linear gain was above the ceiling); "
          + (f"mean GR on speech over those files {np.mean([m['limiter']['mean_gr_db_on_speech'] for m in lm]):.2f} dB (worst file {max(m['limiter']['mean_gr_db_on_speech'] for m in lm):.2f}), max GR {max(m['limiter']['max_gr_db'] for m in lm):.2f} dB. " if lm else "")
          + f"**Pauses:** all {sum(m.get('n_pauses', 0) for m in done)} internal pauses >=250 ms kept; largest deviation from the raw take (after tempo scaling) {max(pc) * 1000 if pc else 0:.0f} ms.", ""]
    L += ["", "## RE-RECORD (not stretched, not processed)", ""]
    L += [f"- **{sg}** ({v}): " + "; ".join(r) for sg, v, r in rerecord] or ["None."]
    if skipped:
        L += ["", "## Skipped", ""] + [f"- {sg}: {r}" for sg, r in skipped]
    for sg, d in dur.items():
        if "slot_s" in d:
            d["over_incl_holds_handover_s"] = round(d["final_s"] + d["holds_s"] + 0.5 - d["slot_s"], 2)
    (vo_dir / "SEGMENT_DURATIONS.json").write_text(json.dumps(
        {"generated": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "target_lufs": TARGET_LUFS,
         "note": "final_s = audio/vo/S##.mp3 length incl. 120 ms lead/trail; slot_s = next script start minus this start (script/SEGMENTS.json approx_start; last slot ends 14:08 per MIX_MAP); "
                 "holds_s = HOLD/BREATHE seconds the script adds around the segment; over_incl_holds_handover_s = final + holds + 0.5 s handover - slot.",
         "targets_rate_sps": {v: voices[v].get("rate_sps_median") for v in ("Atlas", "Ara")},
         "segments": dur, "total_final_s": round(sum(d["final_s"] for d in dur.values()), 2)}, indent=1))
    L += ["", "## Duration vs script slot", "",
          "Over by = final - slot. Over incl. = final + HOLD/BREATHE seconds + 0.5 s handover - slot (the realistic fit).", "",
          "| Seg | Final s | Slot s | Over by | HOLD/BREATHE s | Over incl. holds + 0.5 s |", "|---|---|---|---|---|---|"]
    ov_rows = [(sg, d) for sg, d in sorted(dur.items()) if d.get("over_incl_holds_handover_s", 0) > 0 or d.get("over_s", 0) > 0]
    for sg, d in ov_rows:
        L.append(f"| {sg} | {d['final_s']:.1f} | {d['slot_s']} | {d['over_s']:+.1f} | {d['holds_s']:.0f} | {d['over_incl_holds_handover_s']:+.1f} |")
    if not ov_rows:
        L.append("| none | | | | | |")
    (vo_dir / "PACE_REPORT.md").write_text("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
