#!/usr/bin/env python3
"""ASR pass on the FINAL master narration (music and SFX included) vs the vo-paste text.

usage: asr_final.py <final.mp4> <speed> <out.json>
Each of the 45 takes is cut from the final file at its placed time (scaled by speed) and transcribed
with Whisper large-v3 (no name hints, so mispronunciations are not masked).
"""
import json, os, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from asr_check import toks, script_text  # noqa: E402
import difflib  # noqa: E402

final, speed, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
plan = json.load(open(os.path.join(HERE, "out", "plan.json")))
b = subprocess.run(["ffmpeg", "-v", "error", "-i", final, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(b, np.int16).astype(np.float32) / 32768.0
m = WhisperModel("large-v3", device="cpu", compute_type="int8", cpu_threads=4)
# phonetic spellings Whisper uses for correctly pronounced names
ALIASES = {"goff": "gough", "drury": "druery", "reinhart": "rinehart", "kuyong": "kooyong", "mckellar": "mackellar", "accourt": "à court",
           "organization": "organisation", "organizing": "organising", "organizers": "organisers", "minimize": "minimise", "microparties": "micro parties", "90s": "nineties"}
res = {}
total = errs = 0
for v in plan["vo"]:
    a = (v["t"]) / speed
    d = (v["src_out"] - v["src_in"]) / speed
    seg = audio[int(max(0, a - 0.15) * 16000): int((a + d + 0.15) * 16000)]
    segs, _ = m.transcribe(seg, language="en", beam_size=5, temperature=0, vad_filter=False)
    hyp = " ".join(x.text.strip() for x in segs)
    for k, val in ALIASES.items():
        hyp = hyp.replace(k, val).replace(k.capitalize(), val.capitalize())
    hyp = hyp.replace("Holmes-à court", "Holmes à Court").replace("Holmes-à Court", "Holmes à Court")
    ref_t, hyp_t = toks(script_text(v["seg"])), toks(hyp)
    sm = difflib.SequenceMatcher(a=ref_t, b=hyp_t, autojunk=False)
    diffs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != "equal":
            diffs.append(f"{op}: '{' '.join(ref_t[i1:i2])}' -> '{' '.join(hyp_t[j1:j2])}'")
            errs += max(i2 - i1, j2 - j1)
    total += len(ref_t)
    res[v["seg"]] = dict(text=hyp, diffs=diffs)
    print(v["seg"], "OK" if not diffs else diffs, flush=True)
json.dump(dict(speed=speed, words=total, word_diffs=errs, segs=res), open(out, "w"), indent=1)
print(f"TOTAL {total} words, {errs} word differences ({100 * errs / total:.2f}%)")
