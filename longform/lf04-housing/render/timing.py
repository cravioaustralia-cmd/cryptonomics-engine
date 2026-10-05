"""VO timing: durations, speech intervals, and phrase anchors inside each VO file.

Phrase anchors map a phrase's character position to time, counting only spoken
letters/digits and only the non-silent stretches of the file (ffmpeg silencedetect).
Accurate to roughly a third of a second, which is enough to land a card on a line.
"""
import json
import os
import re
import subprocess

from design import EP

VO = os.path.join(EP, "audio", "vo")
VOT = os.path.join(EP, "audio", "vo-text")
CACHE = os.path.join(EP, "build", "vo_timing.json")

# Measured onsets (ffmpeg silencedetect -32 dB / 70 ms) where clauses sit too close for the estimator.
OVERRIDES = {
    ("S11", "Then again in March"): 13.95,
    ("S11", "Again in May"): 15.79,
    ("S11", "And again in September"): 16.94,
}

TAGS = re.compile(r"\[pause\]|\[long-pause\]|</?slow>|</?soft>")


def clean(s):
    return re.sub(r"\s+", " ", TAGS.sub(" ", s)).strip()


def norm(s):
    return s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').lower()


def probe(seg):
    p = os.path.join(VO, seg + ".mp3")
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af", "silencedetect=n=-38dB:d=0.15", "-f", "null",
                          "-"], capture_output=True, text=True).stderr
    sil = []
    st = None
    for line in err.splitlines():
        m = re.search(r"silence_start: ([\d.]+)", line)
        if m:
            st = float(m.group(1))
        m = re.search(r"silence_end: ([\d.]+)", line)
        if m and st is not None:
            sil.append((st, float(m.group(1))))
            st = None
    if st is not None:
        sil.append((st, dur))
    # speech intervals = complement
    sp, cur = [], 0.0
    for a, b in sil:
        if a > cur + 0.01:
            sp.append((cur, a))
        cur = max(cur, b)
    if cur < dur - 0.01:
        sp.append((cur, dur))
    return {"dur": dur, "speech": sp}


def load():
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    data = {}
    if os.path.exists(CACHE):
        data = json.load(open(CACHE))
    changed = False
    for i in range(1, 41):
        seg = f"S{i:02d}"
        if seg not in data:
            data[seg] = probe(seg)
            changed = True
        data[seg]["text"] = clean(open(os.path.join(VOT, seg + ".txt"), encoding="utf-8").read())
    if changed:
        json.dump(data, open(CACHE, "w"), indent=1)
    return data


class Anchor:
    def __init__(self, info, seg=None):
        self.seg = seg
        self.info = info
        self.text = info["text"]
        self.dur = info["dur"]
        sp = info["speech"]
        self.speech = sp
        self.total_sp = sum(b - a for a, b in sp)
        self.spoken = [c for c in self.text if c.isalnum()]

    def frac_time(self, f):
        target = f * self.total_sp
        acc = 0.0
        for a, b in self.speech:
            if acc + (b - a) >= target:
                return a + (target - acc)
            acc += b - a
        return self.speech[-1][1] if self.speech else self.dur * f

    def at(self, phrase, nth=0):
        if (self.seg, phrase) in OVERRIDES:
            return OVERRIDES[(self.seg, phrase)]
        t = norm(self.text)
        p = norm(phrase)
        idx = -1
        start = 0
        for _ in range(nth + 1):
            idx = t.find(p, start)
            if idx < 0:
                raise KeyError(f"phrase not found: {phrase!r} in {self.text[:60]!r}")
            start = idx + 1
        n_before = sum(1 for c in self.text[:idx] if c.isalnum())
        est = self.frac_time(n_before / max(1, len(self.spoken)))
        # Snap clause/sentence starts to the nearest detected speech onset.
        prev = self.text[:idx].rstrip()[-1:] if idx > 0 else "."
        if prev in ".,:;?!”“\"" and len(self.speech) > 1:
            starts = [a for a, _ in self.speech]
            best = min(starts, key=lambda s: abs(s - est))
            if abs(best - est) <= 0.8:
                return best
        return est

    def end_of(self, phrase, nth=0):
        t = norm(self.text)
        p = norm(phrase)
        idx = t.find(p)
        n_before = sum(1 for c in self.text[:idx + len(p)] if c.isalnum())
        return self.frac_time(n_before / max(1, len(self.spoken)))
