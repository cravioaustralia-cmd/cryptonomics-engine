#!/usr/bin/env python3
"""whisper_vo.py - word timestamps for lf07 'Before Bondi'.

Forced-alignment style pass: faster-whisper small.en, word_timestamps=True, the segment's
own spoken text as initial_prompt. Audio is decoded by ffmpeg to 16 kHz mono float32
(this box's PyAV is too new for faster-whisper's decoder), and the files are only read.

Usage:
  python3 render/whisper_vo.py vo                    # audio/vo/S01..S46.mp3 -> render/vo_words.json
  python3 render/whisper_vo.py window MIX.wav T0 T1 SEG   # print words in a window of any file
Library: align(path_or_array, text, offset=0.0) -> list of {w, s, e, p}
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

EP = Path(__file__).resolve().parents[1]
_MODEL = None


def model():
    global _MODEL
    if _MODEL is None:
        from faster_whisper import WhisperModel
        _MODEL = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
    return _MODEL


def load(path, t0=None, t1=None):
    cmd = ["ffmpeg", "-v", "error"]
    if t0 is not None:
        cmd += ["-ss", f"{t0:.3f}"]
    if t1 is not None:
        cmd += ["-t", f"{t1 - (t0 or 0):.3f}"]
    cmd += ["-i", str(path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def align(audio, text, offset=0.0):
    if not isinstance(audio, np.ndarray):
        audio = load(audio)
    segs, _ = model().transcribe(audio, language="en", word_timestamps=True, beam_size=5,
                                 initial_prompt=text, condition_on_previous_text=False,
                                 vad_filter=False, temperature=0.0)
    out = []
    for s in segs:
        for w in s.words:
            out.append({"w": w.word.strip(), "n": norm(w.word), "s": round(w.start + offset, 3),
                        "e": round(w.end + offset, 3), "p": round(w.probability, 3)})
    return out


def wer(ref, hyp):
    import difflib
    r = [norm(x) for x in ref.split() if norm(x)]
    h = [x["n"] for x in hyp if x["n"]]
    sm = difflib.SequenceMatcher(a=r, b=h, autojunk=False)
    errs = []
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op != "equal":
            errs.append({"op": op, "ref": " ".join(r[a0:a1]), "hyp": " ".join(h[b0:b1])})
    return errs


def main():
    if sys.argv[1] == "vo":
        out = {}
        for i in range(1, 47):
            sid = f"S{i:02d}"
            text = (EP / "audio/vo-text" / f"{sid}.txt").read_text().strip()
            words = align(EP / "audio/vo" / f"{sid}.mp3", text)
            out[sid] = {"text": text, "words": words, "diff": wer(text, words)}
            print(sid, len(words), "words", "diff:", out[sid]["diff"], flush=True)
        (EP / "render/vo_words.json").write_text(json.dumps(out, indent=1))
    elif sys.argv[1] == "window":
        path, t0, t1, sid = sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
        text = (EP / "audio/vo-text" / f"{sid}.txt").read_text().strip()
        for w in align(load(path, t0, t1), text, t0):
            print(w)


if __name__ == "__main__":
    main()
