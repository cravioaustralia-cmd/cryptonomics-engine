#!/usr/bin/env python3
"""
vo_qa.py - quality gate for the raw Grok narration takes of lf07 'Before Bondi'.

For every raw take (default /workspace/lf07-vo/raw/S##.mp3, 24 kHz mono) it measures
  1. whisper word alignment + WER vs the reference text (mismatches, spelled-out letters,
     missing/extra words, repeats, spoken stage directions such as "pause")
  2. articulation rate (words/s of SPEAKING time, silences > 200 ms removed), per-sentence
     rates, and stretched / rushed 3-word windows
  3. pause map (every gap > 250 ms, with position and whether the text has a beat there)
  4. pitch (f0 median, std in semitones, contour flatness) + spectral-flux / energy variation
  5. loudness (integrated LUFS, sample + true peak)
then compares each take with the median of its voice (Atlas = odd segments, Ara = even)
and writes QA_REPORT.md + QA_REPORT.json.

Rerunnable and incremental: per-take analyses are cached (keyed by mp3 hash, reference text
hash, analysis version and whisper model) in <out>/qa_cache, so a rerun only transcribes new
or changed takes, then rebuilds the voice medians, verdicts and both reports from everything
present.

Run with the venv that has whisper + parselmouth + pyloudnorm + num2words:
    /workspace/lf07-vo/.venv/bin/python vo_qa.py            # all takes present
    /workspace/lf07-vo/.venv/bin/python vo_qa.py --segments S01 S02 --force
"""
import argparse, difflib, hashlib, json, os, re, subprocess, sys, tempfile, time
from pathlib import Path

import numpy as np

ANALYSIS_VERSION = 8

# ----------------------------------------------------------------------------- paths
FILM = Path(os.environ.get("LF07_FILM", "/workspace/cryptonomics-engine-lf07/longform/lf07-before-bondi"))
RAW_DIR = Path(os.environ.get("LF07_RAW", "/workspace/lf07-vo/raw"))
OUT_DIR = Path(os.environ.get("LF07_QA_OUT", "/workspace/lf07-vo"))
TEXT_DIR = FILM / "audio" / "vo-text"
GROK_DIR = FILM / "audio" / "vo-grok"
N_SEGMENTS = 46

# ----------------------------------------------------------------------------- thresholds
SIL_RATE_MS = 200          # silences longer than this are excluded from speaking time
PAUSE_MIN_MS = 250         # pause-map threshold
PAUSE_LONG_S = 1.2         # internal gap WARN
PAUSE_VLONG_S = 2.0        # internal gap FAIL
PAUSE_NOBEAT_FAIL_S = 0.8  # mid-phrase gap (no punctuation) FAIL
WIN_LOW, WIN_HIGH = 0.70, 1.40         # 3-word window vs segment median
RATE_WARN, RATE_FAIL = 0.08, 0.10      # |articulation rate - voice median| (8% = correctable limit)
F0_WARN_ST, F0_FAIL_ST = 1.5, 2.5      # |f0 median - voice median| in semitones
PITCHVAR_RATIO_FAIL = 0.60             # pitch std < 60% of voice median = robotic
PITCHVAR_ABS_WARN_ST = 1.5             # absolute floor, any voice
DYN_RATIO_WARN = 0.60
WER_WARN, WER_FAIL = 0.03, 0.08
SENT_RATIO_WARN = 1.6                  # max/min sentence rate inside a segment (sentences >= 4 words)
SENT_SLOW_WARN = 0.75                  # a sentence slower than 75% of the segment's median sentence rate
MIN_TAKES_FOR_OUTLIERS = 3
RATE_BASIS = "sps"   # 'sps' = syllables per second of speaking time (content-normalised); 'wps' = words/s.
                     # words/s is reported too, but it swings +/-20% with word length alone (short words = 'fast').
WHISPER_MODEL = "small.en"             # medium.en is not installed here

INSTRUCTION_WORDS = {
    "pause", "pauses", "beat", "breathe", "breath", "silence", "silent", "paragraph", "newline",
    "period", "comma", "parenthesis", "bracket", "brackets", "stage", "direction", "narrator",
    "voiceover", "segment", "section", "insert", "sfx", "sound", "effect", "music", "cue",
    "take", "retake", "slow", "fast", "louder", "quieter", "whisper", "emphasis", "emphasise",
    "emphasize", "speaker", "atlas", "ara", "scene", "transition", "hold", "stop",
}


# ----------------------------------------------------------------------------- audio helpers
def decode(path, sr, out_wav):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", str(sr),
                    "-c:a", "pcm_f32le", str(out_wav)], check=True)
    import soundfile as sf
    x, r = sf.read(str(out_wav), dtype="float32")
    return np.asarray(x, dtype=np.float64), r


def load_audio(path, sr=24000):
    with tempfile.TemporaryDirectory() as td:
        return decode(path, sr, Path(td) / "a.wav")[0]


def file_sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


HOP = 0.010


def frame_db(x, sr, win=0.025, hop=HOP):
    n, h = int(win * sr), int(hop * sr)
    if len(x) < n:
        x = np.pad(x, (0, n - len(x)))
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::h]
    rms = np.sqrt(np.mean(fr ** 2, axis=1))
    return 20 * np.log10(rms + 1e-9)


def speech_mask(db):
    """Boolean per 10 ms frame. Adaptive threshold: 35 dB under the 95th percentile, floor -65 dBFS."""
    thr = max(np.percentile(db, 95) - 35.0, -65.0)
    m = db > thr
    # drop clicks (<40 ms active) so they cannot split a silence
    m = _filter_runs(m, True, 4)
    return m, thr


def _runs(m):
    """yield (value, start, end) runs of a bool array."""
    if len(m) == 0:
        return []
    idx = np.flatnonzero(np.diff(m.astype(np.int8))) + 1
    starts = np.r_[0, idx]
    ends = np.r_[idx, len(m)]
    return [(bool(m[s]), int(s), int(e)) for s, e in zip(starts, ends)]


def _filter_runs(m, value, min_len):
    m = m.copy()
    for v, s, e in _runs(m):
        if v == value and (e - s) < min_len:
            m[s:e] = not value
    return m


def find_silences(mask, min_ms=100):
    """Inactive runs of >= min_ms, with leading/trailing flagged."""
    n = len(mask)
    out = []
    act = np.flatnonzero(mask)
    if len(act) == 0:
        return out, None, None
    first, last = int(act[0]), int(act[-1]) + 1
    for v, s, e in _runs(mask):
        if not v and (e - s) * HOP * 1000 >= min_ms:
            out.append({"start": s * HOP, "end": e * HOP, "dur": (e - s) * HOP,
                        "kind": "lead" if s == 0 else ("trail" if e == n else "internal")})
    return out, first * HOP, last * HOP


# ----------------------------------------------------------------------------- text helpers
ABBREV = {"mr", "mrs", "ms", "dr", "st", "no", "vs", "prof", "sen", "gen", "col", "lt", "gov", "jr", "sr", "mt"}

try:
    from num2words import num2words
except Exception:  # pragma: no cover
    num2words = None


def _num_candidates(tok):
    t = tok.replace(",", "").strip(".,'")
    cands = []
    if num2words is None:
        return [[tok]]
    try:
        if re.fullmatch(r"\d+(st|nd|rd|th)", t):
            cands.append(num2words(int(t[:-2]), to="ordinal"))
        elif re.fullmatch(r"\d{4}", t) and 1100 <= int(t) <= 2099:
            cands += [num2words(int(t), to="year"), num2words(int(t))]
        elif re.fullmatch(r"\d+", t):
            cands.append(num2words(int(t)))
        elif re.fullmatch(r"\d+\.\d+", t):
            cands.append(num2words(float(t)))
    except Exception:
        pass
    cands = [re.sub(r"[-,]", " ", re.sub(r" and ", " ", c)).split() for c in cands] or [[tok]]
    return cands


def tokenize_ref(text):
    """-> list of dict(w=normalised word, punct='', ',', '.', '?'...) preserving trailing punctuation class."""
    text = text.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    text = re.sub(r"\s*[\u2014\u2013]\s*", " \u2014 ", text)
    toks = text.split()
    out = []
    for i, tk in enumerate(toks):
        if tk == "\u2014":
            if out:
                out[-1]["punct"] += "\u2014"
            continue
        m = re.match(r"^[\"'(\[]*(.*?)([\"')\]]*[.,;:!?\u2026]*[\"')\]]*[.,;:!?\u2026]*)$", tk)
        core, trail = m.group(1), m.group(2)
        core = core.replace("$", "")
        punct = re.sub(r"[\"')\]]", "", trail)
        pieces = [p for p in re.split(r"[-/]", core) if p]
        words = []
        for p in pieces:
            if re.search(r"\d", p):
                words += _num_candidates(re.sub(r"[^\w.,']", "", p))[0]
            else:
                w = re.sub(r"[^\w']", "", p).lower()
                if w:
                    words.append(w)
        if "%" in tk:
            words.append("percent")
        for j, w in enumerate(words):
            out.append({"w": w, "punct": punct if j == len(words) - 1 else "", "raw": tk})
        # sentence end decision filled later
    # sentence ids
    sid = 0
    for i, t in enumerate(out):
        t["sent"] = sid
        p = t["punct"]
        if re.search(r"[.?!\u2026]", p):
            nxt = out[i + 1]["raw"] if i + 1 < len(out) else "A"
            if re.search(r"\.", p) and not re.search(r"[?!]", p) and (t["w"] in ABBREV or re.match(r"^[a-z]", nxt)):
                continue
            sid += 1
    return out


def punct_class(p):
    if re.search(r"[.?!\u2026]", p):
        return "sentence"
    if re.search(r"[,;:\u2014]", p):
        return "clause"
    return "none"


def load_reference(seg):
    """Reference tokens for a segment with sentence ids, punctuation class and paragraph-break flags."""
    ttext = (TEXT_DIR / f"{seg}.txt").read_text().strip()
    gtext_p = (GROK_DIR / f"{seg}.txt")
    gtext = gtext_p.read_text().strip() if gtext_p.exists() else ttext
    toks = tokenize_ref(ttext)
    for t in toks:
        t["para_end"] = False
    paras = [p for p in re.split(r"\n\s*\n", gtext) if p.strip()]
    gwords = []
    for pi, p in enumerate(paras):
        pt = tokenize_ref(p)
        for t in pt:
            gwords.append({"w": t["w"], "para_last": False})
        if pt:
            gwords[-1]["para_last"] = (pi < len(paras) - 1)
    note = None
    a = [t["w"] for t in toks]
    b = [g["w"] for g in gwords]
    if a != b:
        note = "vo-text and vo-grok differ in wording"
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    toks[i1 + k]["para_end"] = gwords[j1 + k]["para_last"]
    else:
        for t, g in zip(toks, gwords):
            t["para_end"] = g["para_last"]
    return toks, note, hashlib.sha1((ttext + "\n##\n" + gtext).encode()).hexdigest()


def norm_hyp_word(w):
    w = w.replace("\u2019", "'").strip()
    return re.sub(r"[^\w']", "", w.lower())


def syllables(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w:
        return 1
    g = re.findall(r"[aeiouy]+", w)
    n = len(g)
    if w.endswith("e") and not w.endswith(("le", "ee", "ie", "ye")) and n > 1:
        n -= 1
    if re.search(r"(ed)$", w) and not re.search(r"(ted|ded)$", w) and n > 1:
        n -= 1
    if w.endswith("es") and not re.search(r"(ses|zes|ches|shes|xes|ges|ces)$", w) and n > 1:
        n -= 1
    return max(n, 1)


# ----------------------------------------------------------------------------- whisper
_MODEL = {}


def get_model(name):
    if name not in _MODEL:
        import whisper
        _MODEL[name] = whisper.load_model(name, device="cpu")
    return _MODEL[name]


def transcribe(wav16_path, model_name):
    m = get_model(model_name)
    r = m.transcribe(str(wav16_path), language="en", word_timestamps=True, temperature=0.0,
                     condition_on_previous_text=False, fp16=False, beam_size=5, verbose=None,
                     no_speech_threshold=0.9, compression_ratio_threshold=99.0, logprob_threshold=None)
    words = []
    for s in r["segments"]:
        for w in s.get("words", []):
            words.append({"text": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"]),
                          "prob": float(w.get("probability", 0))})
    return {"text": r["text"].strip(), "words": words}


def cached_transcribe(path, sha, model_name, cache_dir, wav16=None):
    cache_dir.mkdir(parents=True, exist_ok=True)
    cp = cache_dir / f"whisper_{sha[:16]}_{model_name}.json"
    if cp.exists():
        return json.loads(cp.read_text())
    with tempfile.TemporaryDirectory() as td:
        w16 = Path(td) / "a16.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ac", "1", "-ar", "16000", str(w16)], check=True)
        res = transcribe(w16, model_name)
    cp.write_text(json.dumps(res))
    return res


# ----------------------------------------------------------------------------- forced alignment (word timing)
_W2V = {}
W2V_NAME = "facebook/wav2vec2-base-960h"


def _w2v():
    if not _W2V:
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
        _W2V["p"] = Wav2Vec2Processor.from_pretrained(W2V_NAME)
        _W2V["m"] = Wav2Vec2ForCTC.from_pretrained(W2V_NAME).eval()
    return _W2V["p"], _W2V["m"]


def ctc_word_times(x16, words):
    """CTC forced alignment of `words` (list of str) to 16 kHz audio with wav2vec2. Whisper's own word
    timestamps jitter by ~100 ms, which makes 3-word windows useless; this is accurate to ~20-30 ms.
    Returns list of (start, end) per word, or None if alignment fails. CTC is peaky, so use word STARTS
    for durations (start-to-next-start) and treat ends as approximate."""
    import torch
    proc, model = _w2v()
    vocab = proc.tokenizer.get_vocab()
    chars, owner = [], []
    for wi, w in enumerate(words):
        cs = [c for c in re.sub(r"[^a-z']", "", w.lower()).upper() if c in vocab]
        if not cs:
            return None
        if chars:
            chars.append("|"); owner.append(-1)
        chars += cs; owner += [wi] * len(cs)
    ids = [vocab[c] for c in chars]
    inp = proc(x16.astype(np.float32), sampling_rate=16000, return_tensors="pt")
    with torch.no_grad():
        lp = torch.log_softmax(model(inp.input_values).logits[0], dim=-1).numpy()
    T, L = lp.shape[0], len(ids)
    if T < L:
        return None
    S = 2 * L + 1
    NEG = -1e30
    ext = np.zeros(S, dtype=int)            # blank=0 (<pad>) between tokens
    ext[1::2] = ids
    dp = np.full((T, S), NEG)
    bp = np.zeros((T, S), dtype=np.int8)
    dp[0, 0] = lp[0, 0]
    dp[0, 1] = lp[0, ext[1]]
    for t in range(1, T):
        prev = dp[t - 1]
        c0 = prev
        c1 = np.r_[NEG, prev[:-1]]
        c2 = np.r_[NEG, NEG, prev[:-2]]
        allow2 = np.zeros(S, dtype=bool)
        allow2[3::2] = ext[3::2] != ext[1:-2:2]   # may skip the blank only between different tokens
        c2 = np.where(allow2, c2, NEG)
        stack = np.stack([c0, c1, c2])
        arg = stack.argmax(axis=0)
        dp[t] = stack[arg, np.arange(S)] + lp[t, ext]
        bp[t] = arg
    s = S - 1 if dp[T - 1, S - 1] >= dp[T - 1, S - 2] else S - 2
    path = np.zeros(T, dtype=int)
    for t in range(T - 1, -1, -1):
        path[t] = s
        s -= int(bp[t, s])
    stride = len(x16) / 16000 / T
    first, last = {}, {}
    for t in range(T):
        st = path[t]
        if st % 2 == 1:
            li = st // 2
            if owner[li] >= 0:
                first.setdefault(owner[li], t)
                last[owner[li]] = t
    if len(first) != len(words):
        return None
    return [(first[i] * stride, (last[i] + 1) * stride) for i in range(len(words))]


def refine_times(x16, hyp):
    try:
        tm = ctc_word_times(x16, [h["w"] for h in hyp])
    except Exception as e:  # pragma: no cover
        print("  [warn] forced alignment failed:", e)
        tm = None
    if tm is None:
        for h in hyp:
            h["aligned"] = False
        return hyp
    for h, (a, b) in zip(hyp, tm):
        h["wstart"], h["wend"] = h["start"], h["end"]
        h["start"], h["end"], h["aligned"] = a, b, True
    return hyp


# ----------------------------------------------------------------------------- alignment
def expand_hyp(words, ref_wordset):
    """whisper words -> normalised tokens (digits spelled out) each tied to its whisper word/time."""
    out = []
    merged = []
    for w in words:     # whisper emits "700", ",000" as two words
        if merged and re.fullmatch(r",\d{3}", w["text"]) and re.search(r"\d$", merged[-1]["text"]):
            merged[-1] = dict(merged[-1], text=merged[-1]["text"] + w["text"], end=w["end"])
        else:
            merged.append(dict(w))
    for w in merged:
        raw = w["text"]
        pieces = re.split(r"(?<=\w)-(?=\w)", raw) if re.search(r"\w-\w", raw) else [raw]
        dotted = bool(re.fullmatch(r"(?:[A-Za-z]\.){2,}[,.?!]*", raw))
        hy_spell = bool(re.fullmatch(r"(?:[A-Za-z]-){2,}[A-Za-z][,.?!]*", raw)) or dotted
        n = len(pieces)
        for k, p in enumerate(pieces):
            t0 = w["start"] + (w["end"] - w["start"]) * k / n
            t1 = w["start"] + (w["end"] - w["start"]) * (k + 1) / n
            if re.search(r"\d", p):
                cands = _num_candidates(re.sub(r"[^\w.,']", "", p))
                pick = cands[0]
                for c in cands:
                    if " ".join(c) in " ".join(ref_wordset):
                        pick = c
                        break
                m = len(pick)
                for j, cw in enumerate(pick):
                    out.append({"w": cw, "start": t0 + (t1 - t0) * j / m, "end": t0 + (t1 - t0) * (j + 1) / m,
                                "src": raw, "spell": False, "prob": w["prob"]})
                if "%" in p:
                    out.append({"w": "percent", "start": t1, "end": t1, "src": raw, "spell": False, "prob": w["prob"]})
            else:
                nw = norm_hyp_word(p)
                if dotted:
                    for j, ch in enumerate(re.sub(r"[^A-Za-z]", "", p)):
                        out.append({"w": ch.lower(), "start": t0, "end": t1, "src": raw, "spell": True, "prob": w["prob"]})
                    continue
                if nw:
                    out.append({"w": nw, "start": t0, "end": t1, "src": raw, "spell": hy_spell, "prob": w["prob"]})
    return out


ACRONYMS = set()


def _sim(a, b):
    if a == b:
        return 0.0
    if a in ACRONYMS and a[:1] == b[:1] and abs(len(a) - len(b)) <= 2 and len(b) >= 3:
        return 0.35   # acronym said as a word, ASR spells it phonetically (ASIO -> aseo)
    if len(a) >= 4 and len(b) >= 4 and (a.startswith(b) or b.startswith(a)):
        return 0.3
    if a.rstrip("s") == b.rstrip("s") and min(len(a), len(b)) > 2:
        return 0.3
    r = difflib.SequenceMatcher(None, a, b).ratio()
    return 0.35 if (r >= 0.8 and min(len(a), len(b)) >= 4) else 1.0


def fix_compounds(hyp, ref_words):
    """south-west vs southwest, cut-outs vs cutouts: split/merge hypothesis words to the reference's form."""
    pairs = {ref_words[i] + ref_words[i + 1]: (ref_words[i], ref_words[i + 1]) for i in range(len(ref_words) - 1)}
    refset = set(ref_words)
    out, j = [], 0
    while j < len(hyp):
        h = hyp[j]
        if h["w"] in pairs and h["w"] not in refset:
            a, b = pairs[h["w"]]
            mid = (h["start"] + h["end"]) / 2
            out.append(dict(h, w=a, end=mid)); out.append(dict(h, w=b, start=mid))
            j += 1
        elif j + 1 < len(hyp) and (h["w"] + hyp[j + 1]["w"]) in refset and h["w"] not in refset:
            out.append(dict(h, w=h["w"] + hyp[j + 1]["w"], end=hyp[j + 1]["end"]))
            j += 2
        else:
            out.append(h); j += 1
    return out


def align(ref, hyp):
    """Levenshtein alignment -> list of (op, ref_idx|None, hyp_idx|None); op in ok/near/sub/del/ins."""
    n, m = len(ref), len(hyp)
    D = np.zeros((n + 1, m + 1))
    D[:, 0] = np.arange(n + 1)
    D[0, :] = np.arange(m + 1)
    S = np.zeros((n, m))
    for i in range(n):
        for j in range(m):
            S[i, j] = _sim(ref[i], hyp[j])
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i, j] = min(D[i - 1, j - 1] + S[i - 1, j - 1], D[i - 1, j] + 1, D[i, j - 1] + 1)
    i, j, ops = n, m, []
    while i > 0 or j > 0:
        if i > 0 and j > 0 and abs(D[i, j] - (D[i - 1, j - 1] + S[i - 1, j - 1])) < 1e-9:
            s = S[i - 1, j - 1]
            ops.append(("ok" if s == 0 else "near" if s < 1 else "sub", i - 1, j - 1))
            i -= 1; j -= 1
        elif i > 0 and abs(D[i, j] - (D[i - 1, j] + 1)) < 1e-9:
            ops.append(("del", i - 1, None)); i -= 1
        else:
            ops.append(("ins", None, j - 1)); j -= 1
    return ops[::-1]


# ----------------------------------------------------------------------------- analysis pieces
def pitch_stats(x, sr):
    import parselmouth
    snd = parselmouth.Sound(x, sampling_frequency=sr)
    p = snd.to_pitch_ac(time_step=0.01, pitch_floor=70, pitch_ceiling=450, very_accurate=True,
                        silence_threshold=0.05, voicing_threshold=0.5, octave_cost=0.03, octave_jump_cost=0.6,
                        voiced_unvoiced_cost=0.16)
    f0 = p.selected_array["frequency"]
    t = p.xs()
    v = f0 > 0
    if v.sum() < 30:
        return {"voiced_frames": int(v.sum())}
    med = float(np.median(f0[v]))
    st = 12 * np.log2(np.where(v, f0, med) / med)
    ok = v & (np.abs(st) < 10)           # drop octave errors
    med = float(np.median(f0[ok]))
    st = 12 * np.log2(np.where(ok, f0, med) / med)
    s = st[ok]
    # contour movement: mean |d st/dt| inside voiced runs (median filtered)
    mov = []
    for val, a, b in _runs(ok):
        if val and b - a >= 6:
            seg = st[a:b]
            k = 3
            seg = np.convolve(np.pad(seg, (k, k), mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), mode="valid")
            mov.append(np.abs(np.diff(seg)) / 0.01)
    mov = np.concatenate(mov) if mov else np.array([0.0])
    return {"f0_median_hz": med, "f0_mean_hz": float(np.mean(f0[ok])), "f0_std_st": float(np.std(s)),
            "f0_range_st": float(np.percentile(s, 95) - np.percentile(s, 5)),
            "f0_p10_hz": float(np.percentile(f0[ok], 10)), "f0_p90_hz": float(np.percentile(f0[ok], 90)),
            "f0_move_st_per_s": float(np.mean(mov)), "voiced_frames": int(ok.sum()),
            "voiced_fraction": float(ok.mean())}


def dynamics_stats(x, sr, mask):
    """Energy variation (std of frame level in dB over speaking frames) and spectral flux."""
    n, h = int(0.025 * sr), int(HOP * sr)
    if len(x) < n:
        x = np.pad(x, (0, n - len(x)))
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::h] * np.hanning(n)
    spec = np.abs(np.fft.rfft(fr, axis=1))
    edges = np.geomspace(100, min(8000, sr / 2 - 1), 41)
    freqs = np.fft.rfftfreq(n, 1 / sr)
    bands = np.stack([spec[:, (freqs >= a) & (freqs < b)].sum(axis=1) for a, b in zip(edges[:-1], edges[1:])], axis=1)
    lb = np.log1p(bands * 50)
    lb = lb / (np.linalg.norm(lb, axis=1, keepdims=True) + 1e-9)
    flux = np.r_[0, np.linalg.norm(np.diff(lb, axis=0), axis=1)]
    db = frame_db(x, sr)
    k = min(len(db), len(mask), len(flux))
    sp = mask[:k]
    sp2 = sp & np.r_[sp[1:], False] & np.r_[False, sp[:-1]]
    e = db[:k][sp2]
    f = flux[:k][sp2]
    return {"energy_std_db": float(np.std(e)), "energy_p10_p90_db": float(np.percentile(e, 90) - np.percentile(e, 10)),
            "flux_mean": float(np.mean(f)), "flux_cv": float(np.std(f) / (np.mean(f) + 1e-9))}


def loudness_stats(x, sr):
    import pyloudnorm as pyln
    from scipy.signal import resample_poly
    meter = pyln.Meter(sr)
    lufs = float(meter.integrated_loudness(x))
    sp = float(np.max(np.abs(x)) + 1e-12)
    tp = float(np.max(np.abs(resample_poly(x, 4, 1))) + 1e-12)
    clipped = int(np.sum(np.abs(x) >= 0.999))
    return {"lufs": lufs, "sample_peak_dbfs": 20 * np.log10(sp), "true_peak_dbtp": 20 * np.log10(tp),
            "clipped_samples": clipped}


def _sil_weight(dur, min_ms):
    """1 for silences clearly longer than min_ms. The cut is softened over min_ms-50..min_ms+50 ms so that a
    190 ms vs 210 ms gap (which a tempo change moves across the threshold) cannot swing the rate by 3-4%."""
    if min_ms < 150:
        return 1.0 if dur * 1000 > min_ms else 0.0
    return float(np.clip((dur * 1000 - (min_ms - 50)) / 100.0, 0.0, 1.0))


def speaking_time(first, last, silences):
    """(last-first) minus every internal silence longer than ~SIL_RATE_MS (soft edge, see _sil_weight)."""
    sil = sum(s["dur"] * _sil_weight(s["dur"], SIL_RATE_MS) for s in silences if s["kind"] == "internal")
    return (last - first) - sil


def span_speaking(a, b, silences, min_ms=SIL_RATE_MS):
    t = b - a
    for s in silences:
        if s["kind"] == "internal":
            w = _sil_weight(s["dur"], min_ms)
            if w:
                t -= w * max(0.0, min(b, s["end"]) - max(a, s["start"]))
    return max(t, 1e-3)


def snap_words(words, silences):
    sil = [s for s in silences if s["dur"] >= 0.10]
    # CTC ends are peaky/early: stretch a word's end to the silence that follows it when nothing else is between
    for k, w in enumerate(words):
        nxt = words[k + 1]["start"] if k + 1 < len(words) else 1e9
        for s in sil:
            if w["end"] - 0.06 <= s["start"] <= w["end"] + 0.30 and s["start"] <= nxt + 0.02:
                w["end"] = max(w["end"], s["start"])
                break
    for w in words:
        for s in sil:
            if s["start"] < w["end"] < s["end"] + 1e-9 and w["end"] - s["start"] < 0.8:
                w["end"] = max(s["start"], w["start"] + 0.02)
            if s["start"] - 1e-9 < w["start"] < s["end"] and s["end"] - w["start"] < 0.8:
                w["start"] = min(s["end"], w["end"] - 0.02)
    return words


# ----------------------------------------------------------------------------- the per-take analysis
def analyze_audio(path, seg, ref=None, whisper_res=None, sha=None, model_name=WHISPER_MODEL, cache_dir=None, sr=24000):
    """Full per-take measurement. `ref` = load_reference(seg) tuple (or None to load)."""
    path = Path(path)
    sha = sha or file_sha(path)
    cache_dir = cache_dir or (OUT_DIR / "qa_cache")
    toks, ref_note, ref_hash = ref or load_reference(seg)
    wres = whisper_res or cached_transcribe(path, sha, model_name, cache_dir)
    with tempfile.TemporaryDirectory() as td:
        x, sr = decode(path, sr, Path(td) / "a.wav")
    dur = len(x) / sr
    db = frame_db(x, sr)
    mask, thr = speech_mask(db)
    silences, first, last = find_silences(mask, min_ms=100)
    if first is None:
        return {"seg": seg, "error": "no speech detected", "duration": dur}
    speak_t = speaking_time(first, last, silences)

    # ---- words
    ref_words = [t["w"] for t in toks]
    ACRONYMS.clear()
    ACRONYMS.update(t["w"] for t in toks if re.fullmatch(r"[A-Z]{2,}(\'s)?", re.sub(r"[^\w']", "", t["raw"])))
    hyp = expand_hyp(wres["words"], ref_words)
    hyp = fix_compounds(hyp, ref_words)
    with tempfile.TemporaryDirectory() as td:
        x16, _ = decode(path, 16000, Path(td) / "a16.wav")
    hyp = refine_times(x16, hyp)
    hyp = snap_words(hyp, silences)
    hyp_words = [h["w"] for h in hyp]
    ops = align(ref_words, hyp_words)
    n_ref = len(ref_words)
    c = {k: 0 for k in ("ok", "near", "sub", "del", "ins")}
    for op, _, _ in ops:
        c[op] += 1
    wer_strict = (c["near"] + c["sub"] + c["del"] + c["ins"]) / max(n_ref, 1)
    wer = (c["sub"] + c["del"] + c["ins"]) / max(n_ref, 1)

    # hyp index -> ref index
    h2r = {}
    for op, i, j in ops:
        if j is not None and i is not None:
            h2r[j] = i
    sent_of = []
    last_s = toks[0]["sent"] if toks else 0
    nxt = None
    for j in range(len(hyp)):
        if j in h2r:
            last_s = toks[h2r[j]]["sent"]
        sent_of.append(last_s)
    # leading inserts before first mapped word take the first mapped sentence
    first_mapped = next((j for j in range(len(hyp)) if j in h2r), None)
    if first_mapped:
        for j in range(first_mapped):
            sent_of[j] = toks[h2r[first_mapped]]["sent"]

    # ---- diffs / defects
    diffs, defects = [], []
    def ctx_words(i=None, j=None):
        return " ".join(ref_words[max(0, (i or 0) - 3):(i or 0) + 4]) if i is not None else ""
    pend_ins, pend_del = [], []
    for k, (op, i, j) in enumerate(ops):
        if op in ("near", "sub", "del", "ins"):
            diffs.append({"op": op, "ref": ref_words[i] if i is not None else None,
                          "hyp": hyp_words[j] if j is not None else None,
                          "t": round(hyp[j]["start"], 2) if j is not None else None,
                          "ref_idx": i, "hyp_idx": j})
    ins_runs, run = [], []
    for op, i, j in ops + [("end", None, None)]:
        if op == "ins":
            run.append(j)
        else:
            if run:
                ins_runs.append(run)
            run = []
    # spoken instructions: inserted/substituted word from INSTRUCTION_WORDS
    instr = sorted({hyp_words[d["hyp_idx"]] for d in diffs if d["hyp"] in INSTRUCTION_WORDS and d["op"] in ("ins", "sub")})
    if instr:
        defects.append({"code": "spoken_instruction", "level": "FAIL", "msg": "spoken stage direction(s): " + ", ".join(instr)})
    # spelled-out letters
    spell = [j for j, h in enumerate(hyp) if h["spell"]]
    letters = []
    j = 0
    while j < len(hyp):
        if len(hyp[j]["w"]) == 1 and hyp[j]["w"] not in ("a", "i") or hyp[j]["spell"]:
            k = j
            while k < len(hyp) and len(hyp[k]["w"]) == 1:
                k += 1
            if k - j >= 2 or hyp[j]["spell"]:
                letters.append((j, k))
            j = max(k, j + 1)
        else:
            j += 1
    ref_has_letters = bool(re.search(r"\b(?:[A-Za-z][.\-]){2,}", (TEXT_DIR / f"{seg}.txt").read_text()))
    if letters and not ref_has_letters:
        defects.append({"code": "spelled_out", "level": "FAIL", "msg": "spelled-out letters: " +
                        "; ".join(" ".join(hyp_words[a:b]) + f" @{hyp[a]['start']:.1f}s" for a, b in letters[:5])})
    # repeats: adjacent duplicate words / n-grams that are inserted material
    ins_set = {d["hyp_idx"] for d in diffs if d["op"] == "ins"}
    rep = []
    for n in (4, 3, 2, 1):
        j = 0
        while j + 2 * n <= len(hyp_words):
            if hyp_words[j:j + n] == hyp_words[j + n:j + 2 * n] and any(q in ins_set for q in range(j, j + 2 * n)):
                rep.append((j, n))
                j += 2 * n
            else:
                j += 1
    seen = set()
    for j, n in rep:
        key = " ".join(hyp_words[j:j + n])
        if key in seen:
            continue
        seen.add(key)
        defects.append({"code": "repeat", "level": "FAIL", "msg": f"repeated \"{key}\" @{hyp[j]['start']:.1f}s"})
    for run in ins_runs:
        if len(run) >= 3 and any(" ".join(hyp_words[run[0]:run[0] + 3]) in " ".join(ref_words) for _ in [0]):
            defects.append({"code": "reread", "level": "FAIL", "msg": "inserted re-read: \"" + " ".join(hyp_words[q] for q in run) + f"\" @{hyp[run[0]]['start']:.1f}s"})
    n_del = c["del"]
    if n_del:
        miss = [d["ref"] for d in diffs if d["op"] == "del"]
        defects.append({"code": "missing_words", "level": "WARN" if n_del <= 2 else "FAIL", "msg": f"{n_del} missing: " + " ".join(miss[:8])})
    n_ins = c["ins"]
    if n_ins:
        extra = [d["hyp"] for d in diffs if d["op"] == "ins"]
        defects.append({"code": "extra_words", "level": "WARN" if n_ins <= 2 else "FAIL", "msg": f"{n_ins} extra: " + " ".join(extra[:8])})
    if c["sub"]:
        subs = [f"{d['ref']}->{d['hyp']}" for d in diffs if d["op"] == "sub"]
        defects.append({"code": "substituted", "level": "WARN", "msg": f"{c['sub']} substituted: " + ", ".join(subs[:8])})
    if c["near"]:
        nr = [f"{d['ref']}->{d['hyp']}" for d in diffs if d["op"] == "near"]
        defects.append({"code": "near_match", "level": "INFO", "msg": f"{c['near']} near-matches (likely ASR spelling): " + ", ".join(nr[:8])})

    # ---- rates
    n_hyp = len(hyp)
    # rate counts the REFERENCE words that were actually spoken (matched ok/near/sub), so an ASR spelling such as
    # "km" for "kilometres" cannot change the syllable count and move the rate between raw and corrected audio
    matched = [i for op, i, j in ops if i is not None and j is not None]
    n_rate_words = len(matched)
    syl_total = sum(syllables(ref_words[i]) for i in matched)
    rate_wps = n_rate_words / speak_t
    rate_sps = syl_total / speak_t
    sentences = []
    sids = sorted(set(sent_of))
    for sid in sids:
        idx = [j for j in range(len(hyp)) if sent_of[j] == sid]
        if not idx:
            continue
        a, b = hyp[idx[0]]["start"], hyp[idx[-1]]["end"]
        st = span_speaking(a, b, silences)
        syl = sum(syllables(hyp_words[j]) for j in idx)
        sentences.append({"sent": sid, "n_words": len(idx), "start": a, "end": b, "speak_s": st,
                          "wps": len(idx) / st, "sps": syl / st,
                          "text": " ".join(hyp_words[j] for j in idx)})
    big = [s for s in sentences if s["n_words"] >= 4]
    sent_ratio = (max(s["sps"] for s in big) / min(s["sps"] for s in big)) if len(big) >= 2 else None
    sent_med = float(np.median([s["sps"] for s in big])) if big else None
    slow_sent = [s for s in big if sent_med and s["sps"] < SENT_SLOW_WARN * sent_med]
    fast_sent = [s for s in big if sent_med and s["sps"] > 1.0 / SENT_SLOW_WARN * sent_med]

    # 3-word windows (syllable-weighted so short function words do not look rushed)
    wins = []
    for j in range(len(hyp) - 2):
        if len({sent_of[j], sent_of[j + 1], sent_of[j + 2]}) != 1:
            continue
        # a clause break / paragraph break inside the window (comma, dash, beat) is not tempo: skip it
        if any((h2r.get(q) is not None and (toks[h2r[q]]["punct"] or toks[h2r[q]]["para_end"])) for q in (j, j + 1)):
            continue
        a = hyp[j]["start"]
        b = hyp[j + 3]["start"] if j + 3 < len(hyp) else hyp[j + 2]["end"]
        st = span_speaking(a, b, silences, 100)
        syl = sum(syllables(hyp_words[q]) for q in range(j, j + 3))
        wins.append({"j": j, "start": a, "end": b, "sps": syl / st, "wps": 3 / st})
    stretches = []
    win_med = None
    if wins:
        win_med = float(np.median([w["sps"] for w in wins]))
        def wide_ratio(w):
            """rate of the 5-word neighbourhood (same sentence) vs median: a 3-word window only counts as
            stretched/rushed if its neighbourhood agrees, which cancels whisper word-boundary jitter."""
            j = w["j"]
            lo, hi = j, j + 2
            while hi - lo < 4 and (lo > 0 or hi < len(hyp) - 1):
                if lo > 0 and sent_of[lo - 1] == sent_of[j]:
                    lo -= 1
                if hi - lo < 4 and hi < len(hyp) - 1 and sent_of[hi + 1] == sent_of[j]:
                    hi += 1
                if (lo == 0 or sent_of[lo - 1] != sent_of[j]) and (hi == len(hyp) - 1 or sent_of[hi + 1] != sent_of[j]):
                    break
            st_ = span_speaking(hyp[lo]["start"], hyp[hi + 1]["start"] if hi + 1 < len(hyp) else hyp[hi]["end"], silences, 100)
            return (sum(syllables(hyp_words[q]) for q in range(lo, hi + 1)) / st_) / win_med
        bad = []
        for w in wins:
            r = w["sps"] / win_med
            if r < WIN_LOW or r > WIN_HIGH:
                wr = wide_ratio(w)
                if (r < 1 and wr < 0.88) or (r > 1 and wr > 1.15):
                    bad.append((w, r))
        cur = None
        for w, r in bad:
            kind = "stretched" if r < 1 else "rushed"
            if cur and cur["kind"] == kind and w["j"] <= cur["j1"] + 1:
                cur["j1"] = w["j"] + 2
                cur["ratio"] = min(cur["ratio"], r) if kind == "stretched" else max(cur["ratio"], r)
                cur["end"] = w["end"]
            else:
                if cur:
                    stretches.append(cur)
                cur = {"kind": kind, "j0": w["j"], "j1": w["j"] + 2, "start": w["start"], "end": w["end"], "ratio": r}
        if cur:
            stretches.append(cur)
        for s in stretches:
            s["text"] = " ".join(hyp_words[s["j0"]:s["j1"] + 1])
            s["start"], s["end"] = round(s["start"], 2), round(s["end"], 2)
            s["ratio"] = round(s["ratio"], 2)

    # ---- pauses
    pauses = []
    centers = np.array([(h["start"] + h["end"]) / 2 for h in hyp]) if hyp else np.array([])
    for s in silences:
        if s["kind"] != "internal" or s["dur"] * 1000 < PAUSE_MIN_MS:
            continue
        mid = (s["start"] + s["end"]) / 2
        k = int(np.searchsorted(centers, mid)) - 1  # previous word index
        k = max(0, min(k, len(hyp) - 2))
        ri = h2r.get(k)
        rj = h2r.get(k + 1)
        context = "extra-material"
        para = False
        if ri is not None:
            context = punct_class(toks[ri]["punct"])
            para = bool(toks[ri]["para_end"])
        elif rj is not None and rj > 0:
            context = punct_class(toks[rj - 1]["punct"])
            para = bool(toks[rj - 1]["para_end"])
        pauses.append({"start": round(s["start"], 3), "end": round(s["end"], 3), "dur": round(s["dur"], 3),
                       "after_word": hyp_words[k], "before_word": hyp_words[k + 1], "after_hyp_idx": k,
                       "ref_context": context, "paragraph_break": para,
                       "no_beat_in_text": context == "none" and not para})
    # paragraph breaks with no audible beat
    missing_beats = []
    pause_after = {p["after_hyp_idx"] for p in pauses}
    ref2h = {i: j for j, i in h2r.items()}
    for i, t in enumerate(toks):
        if t["para_end"] and i in ref2h and ref2h[i] < len(hyp) - 1:
            # any silence >= 120ms right at the boundary?
            j = ref2h[i]
            gap = hyp[j + 1]["start"] - hyp[j]["end"]
            if j not in pause_after and gap < 0.15:
                missing_beats.append({"after_word": ref_words[i], "gap_s": round(gap, 3), "t": round(hyp[j]["end"], 2)})
    ins_pauses = [p for p in pauses if p["dur"] > PAUSE_LONG_S]
    for p in pauses:
        flags = []
        if p["dur"] > PAUSE_VLONG_S:
            flags.append("very_long_gap")
        elif p["dur"] > PAUSE_LONG_S:
            flags.append("long_gap")
        if p["no_beat_in_text"]:
            flags.append("no_beat_in_text")
        p["flags"] = flags

    # ---- pitch, dynamics, loudness
    pst = pitch_stats(x, sr)
    dyn = dynamics_stats(x, sr, mask)
    loud = loudness_stats(x, sr)

    return {
        "seg": seg, "file": str(path), "sha256": sha, "ref_hash": ref_hash, "ref_note": ref_note,
        "version": ANALYSIS_VERSION, "model": model_name, "sr": sr,
        "duration": dur, "lead_silence": first, "trail_silence": dur - last,
        "vad_threshold_db": thr, "speaking_time": speak_t,
        "n_ref_words": n_ref, "n_hyp_words": n_hyp, "n_rate_words": n_rate_words, "syllables": syl_total,
        "rate_wps": rate_wps, "rate_sps": rate_sps,
        "wer": wer, "wer_strict": wer_strict, "counts": c,
        "transcript": " ".join(hyp_words),
        "diffs": diffs, "defects": defects,
        "sentences": sentences, "sent_rate_ratio": sent_ratio, "sent_rate_median_sps": sent_med,
        "slow_sentences": [s["text"] for s in slow_sent], "fast_sentences": [s["text"] for s in fast_sent],
        "window_median_sps": win_med, "stretches": stretches,
        "pauses": pauses, "missing_beats": missing_beats,
        "pitch": pst, "dynamics": dyn, "loudness": loud,
        "words": [{"w": h["w"], "s": round(h["start"], 3), "e": round(h["end"], 3), "sent": sent_of[j],
                   "ref": h2r.get(j)} for j, h in enumerate(hyp)],
    }


def ref_and_cache_key(seg, sha, model_name):
    ref = load_reference(seg)
    return ref, f"{sha}:{ref[2]}:{ANALYSIS_VERSION}:{model_name}"


def analyze_take_cached(path, seg, model_name, cache_dir, force=False):
    sha = file_sha(path)
    ref, key = ref_and_cache_key(seg, sha, model_name)
    cp = cache_dir / f"{seg}.analysis.json"
    if cp.exists() and not force:
        d = json.loads(cp.read_text())
        if d.get("_key") == key:
            return d, False
    d = analyze_audio(path, seg, ref=ref, sha=sha, model_name=model_name, cache_dir=cache_dir)
    d["_key"] = key
    cp.write_text(json.dumps(d))
    return d, True


# ----------------------------------------------------------------------------- voices & verdicts
def voice_of(seg):
    n = int(seg[1:])
    return "Atlas" if n % 2 == 1 else "Ara"


def st_diff(a, b):
    return 12 * np.log2(a / b)


def compute_voice_stats(takes):
    out = {}
    for v in ("Atlas", "Ara"):
        ts = [t for t in takes if t["voice"] == v and "error" not in t]
        if not ts:
            out[v] = {"n": 0}
            continue
        out[v] = {
            "n": len(ts), "segments": [t["seg"] for t in ts],
            "rate_wps_median": float(np.median([t["rate_wps"] for t in ts])),
            "rate_sps_median": float(np.median([t["rate_sps"] for t in ts])),
            "f0_median_hz": float(np.median([t["pitch"]["f0_median_hz"] for t in ts])),
            "f0_std_st_median": float(np.median([t["pitch"]["f0_std_st"] for t in ts])),
            "f0_move_median": float(np.median([t["pitch"]["f0_move_st_per_s"] for t in ts])),
            "energy_std_db_median": float(np.median([t["dynamics"]["energy_std_db"] for t in ts])),
            "flux_cv_median": float(np.median([t["dynamics"]["flux_cv"] for t in ts])),
            "lufs_median": float(np.median([t["loudness"]["lufs"] for t in ts])),
            "outliers_enabled": len(ts) >= MIN_TAKES_FOR_OUTLIERS,
        }
    return out


def judge(t, vs):
    """Fill t['checks'], t['reasons'], t['verdict'], t['action']."""
    reasons = []
    def add(level, code, msg):
        reasons.append({"level": level, "code": code, "msg": msg})
    if "error" in t:
        t.update(verdict="FAIL", action="RE-RECORD", reasons=[{"level": "FAIL", "code": "error", "msg": t["error"]}])
        return t
    # text
    for d in t["defects"]:
        add(d["level"], d["code"], d["msg"])
    n_err = t["counts"]["sub"] + t["counts"]["del"] + t["counts"]["ins"]
    if t["wer"] >= WER_FAIL and n_err >= 3:
        add("FAIL", "wer", f"WER {t['wer']*100:.1f}%")
    elif t["wer"] >= WER_WARN or (t["wer"] >= WER_FAIL):
        add("WARN", "wer", f"WER {t['wer']*100:.1f}%")
    if t["ref_note"]:
        add("INFO", "ref_note", t["ref_note"])
    # rate (voice relative)
    dev = {}
    if vs.get("outliers_enabled"):
        dw = t["rate_wps"] / vs["rate_wps_median"] - 1
        ds = t["rate_sps"] / vs["rate_sps_median"] - 1
        dev["rate_wps_dev"], dev["rate_sps_dev"] = dw, ds
        dr = ds if RATE_BASIS == "sps" else dw
        label = "SLOW (robotic/stretched risk)" if dr < 0 else "FAST (rushed)"
        if abs(dr) > RATE_FAIL:
            add("FAIL", "rate_outlier", f"{label}: {t['rate_sps']:.2f} syl/s ({t['rate_wps']:.2f} w/s) is {dr*100:+.1f}% vs {t['voice']} median {vs['rate_sps_median']:.2f} syl/s (w/s {dw*100:+.1f}%)")
        elif abs(dr) > RATE_WARN:
            add("WARN", "rate_outlier", f"{label}: {dr*100:+.1f}% vs voice median, beyond the +/-8% correctable limit (w/s {dw*100:+.1f}%)")
        df0 = st_diff(t["pitch"]["f0_median_hz"], vs["f0_median_hz"])
        dev["f0_dev_st"] = df0
        if abs(df0) > F0_FAIL_ST:
            add("FAIL", "f0_outlier", f"f0 median {t['pitch']['f0_median_hz']:.0f} Hz is {df0:+.2f} st from voice median {vs['f0_median_hz']:.0f} Hz")
        elif abs(df0) > F0_WARN_ST:
            add("WARN", "f0_outlier", f"f0 median {df0:+.2f} st from voice median")
        pv = t["pitch"]["f0_std_st"] / vs["f0_std_st_median"]
        dev["pitchvar_ratio"] = pv
        if pv < PITCHVAR_RATIO_FAIL:
            add("FAIL", "flat_pitch", f"ROBOTIC: pitch std {t['pitch']['f0_std_st']:.2f} st = {pv*100:.0f}% of voice median {vs['f0_std_st_median']:.2f}")
        dyn_ratio = 0.5 * (t["dynamics"]["energy_std_db"] / vs["energy_std_db_median"] + t["dynamics"]["flux_cv"] / vs["flux_cv_median"])
        dev["dyn_ratio"] = dyn_ratio
        if dyn_ratio < DYN_RATIO_WARN:
            add("WARN", "flat_dynamics", f"low energy/flux variation ({dyn_ratio*100:.0f}% of voice median)")
    if t["pitch"].get("f0_std_st", 9) < PITCHVAR_ABS_WARN_ST:
        add("WARN", "flat_pitch_abs", f"pitch std {t['pitch']['f0_std_st']:.2f} st is very low in absolute terms")
    # local rate
    if t["stretches"]:
        st_ = [s for s in t["stretches"] if s["kind"] == "stretched"]
        ru_ = [s for s in t["stretches"] if s["kind"] == "rushed"]
        lvl = "FAIL" if (len(st_) >= 3 or any(s["ratio"] < 0.5 for s in st_)) else "WARN"
        if st_:
            add(lvl, "stretched", f"{len(st_)} stretched stretch(es): " + "; ".join(f"\"{s['text']}\" {s['ratio']*100:.0f}% @{s['start']}s" for s in st_[:4]))
        if ru_:
            add("WARN", "rushed", f"{len(ru_)} rushed stretch(es): " + "; ".join(f"\"{s['text']}\" {s['ratio']*100:.0f}% @{s['start']}s" for s in ru_[:4]))
    if t["sent_rate_ratio"] and t["sent_rate_ratio"] > SENT_RATIO_WARN:
        add("WARN", "sentence_rate_spread", f"sentence rate max/min {t['sent_rate_ratio']:.2f}")
    if t["slow_sentences"]:
        add("WARN", "slow_sentence", "slow sentence(s): " + " | ".join(s[:50] for s in t["slow_sentences"][:2]))
    # pauses
    for p in t["pauses"]:
        if "very_long_gap" in p["flags"]:
            add("FAIL", "pause_very_long", f"{p['dur']:.2f}s gap after \"{p['after_word']}\" @{p['start']:.1f}s")
        elif "long_gap" in p["flags"]:
            add("WARN", "pause_long", f"{p['dur']:.2f}s gap after \"{p['after_word']}\" @{p['start']:.1f}s")
        if "no_beat_in_text" in p["flags"]:
            add("FAIL" if p["dur"] > PAUSE_NOBEAT_FAIL_S else "WARN", "pause_no_beat",
                f"{p['dur']:.2f}s gap mid-phrase \"{p['after_word']} | {p['before_word']}\" @{p['start']:.1f}s (text has no beat)")
    for mb in t["missing_beats"]:
        add("INFO", "missing_beat", f"no audible beat at paragraph break after \"{mb['after_word']}\" @{mb['t']}s")
    # loudness
    L = t["loudness"]
    if L["clipped_samples"] >= 3:
        add("FAIL", "clipping", f"{L['clipped_samples']} clipped samples")
    elif L["true_peak_dbtp"] > -0.5:
        add("WARN", "peak_hot", f"true peak {L['true_peak_dbtp']:.2f} dBTP (raw; normalisation will move it)")
    if L["lufs"] < -32:
        add("WARN", "quiet", f"very quiet: {L['lufs']:.1f} LUFS")
    # segment edges
    if t["lead_silence"] > 1.0 or t["trail_silence"] > 1.5:
        add("INFO", "edges", f"lead {t['lead_silence']:.2f}s / trail {t['trail_silence']:.2f}s silence")
    level = "PASS"
    if any(r["level"] == "FAIL" for r in reasons):
        level = "FAIL"
    elif any(r["level"] == "WARN" for r in reasons):
        level = "WARN"
    codes = {r["code"] for r in reasons if r["level"] in ("FAIL", "WARN")}
    rr_codes = {"rate_outlier", "f0_outlier", "flat_pitch", "spoken_instruction", "spelled_out", "repeat", "reread",
                "wer", "missing_words", "extra_words", "clipping", "stretched", "pause_very_long", "pause_no_beat", "error"}
    fail_codes = {r["code"] for r in reasons if r["level"] == "FAIL"}
    action = "OK"
    # re-record gate (stricter than the verdict): any missing/extra word, WER > 5%, rate beyond +/-8%, f0 beyond 1.5 st
    if fail_codes or codes & {"rate_outlier", "missing_words", "extra_words", "f0_outlier"} or t["wer"] > 0.05:
        action = "RE-RECORD"
    elif level == "WARN":
        action = "OK-LISTEN"
    t.update(dev=dev, reasons=reasons, verdict=level, action=action)
    return t


# ----------------------------------------------------------------------------- reports
def fmt(x, nd=2, suffix=""):
    return "-" if x is None else f"{x:.{nd}f}{suffix}"


def build_markdown(takes, voices, missing, args):
    L = []
    L.append("# lf07 'Before Bondi' - narration QA report")
    L.append("")
    L.append(f"Generated {time.strftime('%Y-%m-%d %H:%M:%S %Z')} - whisper `{args.model}` (CPU), {len(takes)}/{N_SEGMENTS} raw takes analysed. "
             f"Atlas = odd segments, Ara = even.")
    if missing:
        L.append(f"Not yet delivered: {', '.join(missing)}")
    L.append("")
    L.append("## Per-voice medians")
    L.append("")
    L.append("| Voice | Takes | Articulation rate (w/s) | syl/s | f0 median (Hz) | pitch std (st) | pitch movement (st/s) | energy std (dB) | LUFS |")
    L.append("|---|---|---|---|---|---|---|---|---|")
    for v in ("Atlas", "Ara"):
        s = voices[v]
        if not s["n"]:
            L.append(f"| {v} | 0 | | | | | | | |")
            continue
        L.append(f"| {v} | {s['n']} ({' '.join(s['segments'])}) | {s['rate_wps_median']:.2f} | {s['rate_sps_median']:.2f} | {s['f0_median_hz']:.0f} | {s['f0_std_st_median']:.2f} | {s['f0_move_median']:.1f} | {s['energy_std_db_median']:.2f} | {s['lufs_median']:.1f} |")
    for v in ("Atlas", "Ara"):
        if voices[v]["n"] and not voices[v]["outliers_enabled"]:
            L.append(f"\n> {v}: fewer than {MIN_TAKES_FOR_OUTLIERS} takes, so voice-relative outlier checks are off for this voice.")
    L.append("")
    L.append("Rules: articulation rate = SPEAKING time only (silences > 200 ms removed). Deviation from the voice median is judged on syllables/s "
             "(words/s is shown too but moves +/-20% with word length alone): >8% WARN (beyond the correctable limit), >10% FAIL. "
             f"f0 median >{F0_WARN_ST} st WARN / >{F0_FAIL_ST} st FAIL; pitch std <60% of voice median FAIL (robotic). "
             "RE-RECORD = any FAIL or rate beyond +/-8%.")
    L.append("")
    L.append("## Verdicts")
    L.append("")
    L.append("| Seg | Voice | Dur (s) | Words | WER | syl/s (vs med) | w/s (vs med) | f0 Hz (st vs med) | pitch std st (% med) | dyn % med | LUFS / TP | Verdict | Action | Why |")
    L.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for t in takes:
        if "error" in t:
            L.append(f"| {t['seg']} | {t['voice']} | | | | | | | | | | FAIL | RE-RECORD | {t['error']} |")
            continue
        d = t["dev"]
        why = "; ".join(f"{r['level']}: {r['msg']}" for r in t["reasons"] if r["level"] in ("FAIL", "WARN")) or "-"
        L.append("| {seg} | {voice} | {dur:.1f} | {nw} | {wer} | {sps:.2f} ({sd}) | {rate:.2f} ({rd}) | {f0:.0f} ({fd}) | {ps:.2f} ({pr}) | {dy} | {lufs:.1f} / {tp:.1f} | **{v}** | {a} | {why} |".format(
            seg=t["seg"], voice=t["voice"], dur=t["duration"], nw=t["n_hyp_words"],
            wer=f"{t['wer']*100:.1f}%", rate=t["rate_wps"], rd=f"{d['rate_wps_dev']*100:+.1f}%" if "rate_wps_dev" in d else "-",
            sd=f"{d['rate_sps_dev']*100:+.1f}%" if "rate_sps_dev" in d else "-",
            sps=t["rate_sps"], f0=t["pitch"]["f0_median_hz"], fd=fmt(d.get("f0_dev_st"), 2) if "f0_dev_st" in d else "-",
            ps=t["pitch"]["f0_std_st"], pr=f"{d['pitchvar_ratio']*100:.0f}%" if "pitchvar_ratio" in d else "-",
            dy=f"{d['dyn_ratio']*100:.0f}%" if "dyn_ratio" in d else "-",
            lufs=t["loudness"]["lufs"], tp=t["loudness"]["true_peak_dbtp"], v=t["verdict"], a=t["action"], why=why.replace("|", "\\|")))
    L.append("")
    rr = [t for t in takes if t["action"] == "RE-RECORD"]
    L.append("## Re-record list")
    L.append("")
    if rr:
        for t in rr:
            top = "; ".join(r["msg"] for r in t["reasons"] if r["level"] == "FAIL" or r["code"] == "rate_outlier")
            L.append(f"- **{t['seg']}** ({t['voice']}): {top}")
    else:
        L.append("None yet.")
    ok_listen = [t["seg"] for t in takes if t["action"] == "OK-LISTEN"]
    if ok_listen:
        L.append("")
        L.append("Listen-check (WARN only, keep unless the ear disagrees): " + ", ".join(ok_listen))
    L.append("")
    L.append("## Detail per take")
    for t in takes:
        if "error" in t:
            continue
        L.append("")
        L.append(f"### {t['seg']} - {t['voice']} - {t['verdict']} ({t['action']})")
        L.append("")
        L.append(f"- Duration {t['duration']:.2f}s, speaking {t['speaking_time']:.2f}s, lead {t['lead_silence']:.2f}s, trail {t['trail_silence']:.2f}s; "
                 f"{t['n_hyp_words']} spoken words vs {t['n_ref_words']} reference; "
                 f"ok/near/sub/del/ins = {'/'.join(str(t['counts'][k]) for k in ('ok','near','sub','del','ins'))}")
        pst = t["pitch"]
        L.append(f"- Pitch: median {pst['f0_median_hz']:.0f} Hz, std {pst['f0_std_st']:.2f} st, range(5-95%) {pst['f0_range_st']:.1f} st, movement {pst['f0_move_st_per_s']:.1f} st/s; "
                 f"energy std {t['dynamics']['energy_std_db']:.2f} dB, flux CV {t['dynamics']['flux_cv']:.2f}")
        L.append(f"- Loudness {t['loudness']['lufs']:.1f} LUFS, sample peak {t['loudness']['sample_peak_dbfs']:.1f} dBFS, true peak {t['loudness']['true_peak_dbtp']:.1f} dBTP")
        L.append("- Sentence rates (syl/s | w/s): " + "; ".join(f"[{s['sps']:.1f}|{s['wps']:.1f}] {s['text'][:38]}" for s in t["sentences"]) +
                 (f"  -> max/min {t['sent_rate_ratio']:.2f}" if t["sent_rate_ratio"] else ""))
        if t["stretches"]:
            L.append("- Local 3-word windows outside 70-140% of segment median: " + "; ".join(f"{s['kind']} \"{s['text']}\" {s['ratio']*100:.0f}% @{s['start']}-{s['end']}s" for s in t["stretches"]))
        else:
            L.append("- No stretched/rushed 3-word windows.")
        if t["pauses"]:
            L.append("- Pause map (>250 ms): " + "; ".join(
                f"{p['dur']:.2f}s after \"{p['after_word']}\" @{p['start']:.2f}s [{('para' if p['paragraph_break'] else p['ref_context'])}]" + (" !" + ",".join(p["flags"]) if p["flags"] else "")
                for p in t["pauses"]))
        else:
            L.append("- Pause map: no gaps >250 ms.")
        if t["diffs"]:
            L.append("- Text diffs: " + "; ".join(f"{d['op']} {d['ref'] or '_'}->{d['hyp'] or '_'}" + (f" @{d['t']}s" if d['t'] is not None else "") for d in t["diffs"][:20]))
        info = [r["msg"] for r in t["reasons"] if r["level"] == "INFO"]
        if info:
            L.append("- Notes: " + " | ".join(info))
    L.append("")
    return "\n".join(L)


def json_clean(o):
    if isinstance(o, dict):
        return {k: json_clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [json_clean(v) for v in o]
    if isinstance(o, (np.floating, np.integer)):
        return o.item()
    if isinstance(o, float):
        return round(o, 5)
    return o


def run(args):
    cache_dir = OUT_DIR / "qa_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    raw = sorted(RAW_DIR.glob("S[0-9][0-9].mp3"))
    now = time.time()
    segs = []
    for p in raw:
        seg = p.stem
        if args.segments and seg not in args.segments:
            continue
        if now - p.stat().st_mtime < args.min_age:
            print(f"[skip] {seg}: modified {now - p.stat().st_mtime:.0f}s ago (still being written?) - rerun shortly")
            continue
        segs.append((seg, p))
    takes = []
    for seg, p in segs:
        if not (TEXT_DIR / f"{seg}.txt").exists():
            print(f"[skip] {seg}: no reference text")
            continue
        t0 = time.time()
        try:
            d, fresh = analyze_take_cached(p, seg, args.model, cache_dir, force=args.force)
        except subprocess.CalledProcessError as e:
            d, fresh = {"seg": seg, "error": f"unreadable audio ({e})", "duration": 0}, True
        d["voice"] = voice_of(seg)
        takes.append(d)
        print(f"[{'new' if fresh else 'cached'}] {seg} ({time.time()-t0:.1f}s)")
    # when --segments limits the run, still report every take present (cached ones are cheap)
    if args.segments:
        have = {t["seg"] for t in takes}
        for p in raw:
            if p.stem not in have and now - p.stat().st_mtime >= args.min_age and (cache_dir / f"{p.stem}.analysis.json").exists():
                d, _ = analyze_take_cached(p, p.stem, args.model, cache_dir)
                d["voice"] = voice_of(p.stem)
                takes.append(d)
    takes.sort(key=lambda t: t["seg"])
    voices = compute_voice_stats(takes)
    for t in takes:
        judge(t, voices[t["voice"]])
    present = {t["seg"] for t in takes}
    missing = [f"S{n:02d}" for n in range(1, N_SEGMENTS + 1) if f"S{n:02d}" not in present]
    md = build_markdown(takes, voices, missing, args)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "QA_REPORT.md").write_text(md)
    summary = {t["seg"]: {"voice": t["voice"], "verdict": t["verdict"], "action": t["action"],
                          "reasons": [r for r in t["reasons"]]} for t in takes}
    out = {"generated": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "model": args.model, "analysis_version": ANALYSIS_VERSION,
           "thresholds": {"rate_warn": RATE_WARN, "rate_fail": RATE_FAIL, "f0_warn_st": F0_WARN_ST, "f0_fail_st": F0_FAIL_ST,
                          "pitchvar_ratio_fail": PITCHVAR_RATIO_FAIL, "window": [WIN_LOW, WIN_HIGH],
                          "pause_min_ms": PAUSE_MIN_MS, "pause_long_s": PAUSE_LONG_S},
           "present": sorted(present), "missing": missing, "voices": voices, "summary": summary,
           "re_record": [t["seg"] for t in takes if t["action"] == "RE-RECORD"],
           "takes": takes}
    for t in out["takes"]:
        t.pop("_key", None)
    (OUT_DIR / "QA_REPORT.json").write_text(json.dumps(json_clean(out), indent=1))
    print(f"wrote {OUT_DIR/'QA_REPORT.md'} and QA_REPORT.json ({len(takes)} takes, {len(missing)} missing)")
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--segments", nargs="*", help="only (re)analyse these, e.g. S01 S02")
    ap.add_argument("--force", action="store_true", help="ignore the analysis cache")
    ap.add_argument("--model", default=WHISPER_MODEL)
    ap.add_argument("--min-age", type=float, default=8.0, help="skip files modified < N s ago (still arriving)")
    return run(ap.parse_args(argv))


if __name__ == "__main__":
    main()
