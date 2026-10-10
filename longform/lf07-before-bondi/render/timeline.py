#!/usr/bin/env python3
"""timeline.py - place the 46 final voice files (never altered) on a timeline built from their real
durations plus every scripted hold, chapter hold, silence and mid-roll beat.

Writes render/timeline.json. Library: load() -> Timeline with .seg('S01').w('phrase').
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

EP = Path(__file__).resolve().parents[1]
FPS = 30
TARGET_GAP = 0.43   # audible (energy, -50 dBFS) handover target; added silence clamped to 0.11-0.26 s
EDGE = 0.12

# scripted holds (seconds of picture without voice). pre = before the first word block, post = after the file
PRE = {"S01": 3.0, "S10": 1.0, "S30": 1.5, "S34": 8.0, "S38": 2.0, "S44": 1.0, "S45": 5.0}
POST = {"S01": 2.0, "S07": 7.0, "S13": 1.5, "S14": 1.5, "S15": 2.0, "S20": 1.5, "S22": 1.0, "S24": 3.0,
        "S25": 2.0, "S29": 1.0, "S30": 1.5, "S32": 1.0, "S36": 2.0, "S37": 3.0, "S38": 2.0, "S40": 3.0,
        "S44": 2.0, "S45": 2.0, "S46": 15.0}
# chapter holds (music + picture, no voice) before each chapter's first segment
CHAPTERS = [("S01", "COLD OPEN: How Did This Happen Here?", 0.0),
            ("S08", "CHAPTER 1: The Fire", 3.5),
            ("S13", "CHAPTER 2: Two Memories", 4.5),
            ("S18", "CHAPTER 3: Canberra's Choices", 4.0),
            ("S24", "CHAPTER 4: Australian Lives", 4.5),
            ("S29", "CHAPTER 5: A Country Under Strain", 4.5),
            ("S36", "CHAPTER 6: Bondi", 3.5),
            ("S43", "CLOSING", 4.0)]
MIDROLL_AFTER = ("S12", "S28")
MIDROLL_BEAT = 0.5
S35_SILENCE = 2.0


def edges(path):
    """Energy edges at -50 dBFS (5 ms windows): (lead_s, trail_s, file_len_s)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    n = 240
    r = 20 * np.log10(np.sqrt(np.mean(a[: len(a) // n * n].reshape(-1, n) ** 2, axis=1)) + 1e-9)
    idx = np.where(r > -50)[0]
    return idx[0] * n / 48000, len(a) / 48000 - (idx[-1] + 1) * n / 48000, len(a) / 48000


def onset(path):
    """First 10 ms window above -45 dBFS RMS (speech onset after the 0.12 s lead)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    n = 480
    rms = np.sqrt(np.mean(a[: len(a) // n * n].reshape(-1, n) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    i = int(np.argmax(db > -45))
    return i * n / 48000, len(a) / 48000


def build():
    words = json.loads((EP / "render/vo_words.json").read_text())
    durs = json.loads((EP / "audio/vo/SEGMENT_DURATIONS.json").read_text())["segments"]
    chap = {c[0]: c for c in CHAPTERS}
    t = 0.0
    segs, chapters, midrolls = [], [], []
    E = {f"S{i:02d}": edges(EP / "audio/vo" / f"S{i:02d}.mp3") for i in range(1, 47)}
    for i in range(1, 47):
        sid = f"S{i:02d}"
        path = EP / "audio/vo" / f"{sid}.mp3"
        on, flen = onset(path)
        dur = flen
        seg = {"sid": sid, "voice": "Atlas" if i % 2 else "Ara", "start": round(t, 3),
               "edge_lead": round(E[sid][0], 3), "edge_trail": round(E[sid][1], 3)}
        if sid in chap:
            chapters.append({"sid": sid, "name": chap[sid][1], "t": round(t, 3), "hold": chap[sid][2]})
            seg["chapter_hold"] = [round(t, 3), round(t + chap[sid][2], 3)]
            t += chap[sid][2]
        t += PRE.get(sid, 0.0)
        seg["vo_start"] = round(t, 3)
        seg["vo_dur"] = round(dur, 3)
        seg["vo_end"] = round(t + dur, 3)
        ws = []
        for k, w in enumerate(words[sid]["words"]):
            s, e = w["s"], w["e"]
            if k == 0 and s < on:
                s = on
            ws.append({"w": w["w"], "n": w["n"], "s": round(seg["vo_start"] + s, 3), "e": round(seg["vo_start"] + e, 3)})
        seg["words"] = ws
        seg["first_word"] = ws[0]["s"]
        seg["last_word_end"] = ws[-1]["e"]
        t = seg["vo_end"]
        if sid == "S35":
            wasnt = [w for w in ws if w["n"] == "wasn't"][-1]
            seg["silence"] = [wasnt["e"], round(wasnt["e"] + S35_SILENCE, 3)]
            t = seg["silence"][1]
        else:
            t += POST.get(sid, 0.0)
        if sid in MIDROLL_AFTER:
            m = round(max(t, seg["last_word_end"] + MIDROLL_BEAT), 3)
            midrolls.append({"after": sid, "t": m})
            seg["midroll"] = m
            t = m
        seg["end"] = round(t, 3)
        if sid == "S10":
            seg["silence"] = [round(seg["vo_start"] - 1.0, 3), seg["vo_start"]]
        segs.append(seg)
        if sid != "S35" and sid not in MIDROLL_AFTER and sid != "S46":
            nxt = f"S{i + 1:02d}"
            add = min(0.26, max(0.11, TARGET_GAP - (E[sid][1] + E[nxt][0])))
            seg["gap_added"] = round(add, 3)
            t += add
            seg["end"] = round(t, 3)
    total = round(t, 3)
    # handover gaps (audible: last word end -> next first word)
    for a, b in zip(segs, segs[1:]):
        a["gap_to_next"] = round(b["first_word"] - a["last_word_end"], 3)          # whisper words
        a["gap_audible"] = round((b["vo_start"] + b["edge_lead"]) - (a["vo_end"] - a["edge_trail"]), 3)  # energy
    tl = {"fps": FPS, "total": total, "target_gap": TARGET_GAP, "segments": segs, "chapters": chapters, "midrolls": midrolls}
    (EP / "render/timeline.json").write_text(json.dumps(tl, indent=1))
    return tl


def _norm(s):
    return [re.sub(r"[^a-z0-9']", "", x.lower().replace("’", "'")) for x in re.split(r"[\s\-]+", s) if x.strip()]


class Seg:
    def __init__(self, d):
        self.__dict__.update(d)
        self.toks = []   # flattened tokens with times (whisper splits 'forty-eight' into 'forty', '-eight')
        for w in self.words:
            for part in _norm(w["w"]):
                if part:
                    self.toks.append((part, w["s"], w["e"]))

    def _find(self, phrase, occ=1):
        p = _norm(phrase)
        n = 0
        for i in range(len(self.toks) - len(p) + 1):
            if all(self.toks[i + k][0] == p[k] for k in range(len(p))):
                n += 1
                if n == occ:
                    return i, i + len(p) - 1
        raise KeyError(f"{self.sid}: phrase not found: {phrase!r}")

    def w(self, phrase, occ=1):
        """Global time of the first word of phrase."""
        return self.toks[self._find(phrase, occ)[0]][1]

    def we(self, phrase, occ=1):
        """Global end time of the last word of phrase."""
        return self.toks[self._find(phrase, occ)[1]][2]


class Timeline:
    def __init__(self, d):
        self.d = d
        self.total = d["total"]
        self.segs = [Seg(s) for s in d["segments"]]
        self.by = {s.sid: s for s in self.segs}

    def seg(self, sid):
        return self.by[sid]

    def at(self, t):
        for s in self.segs:
            if s.start <= t < s.end:
                return s
        return self.segs[-1]


def load():
    return Timeline(json.loads((EP / "render/timeline.json").read_text()))


if __name__ == "__main__":
    tl = build()
    print("total", tl["total"], "=", f"{int(tl['total'] // 60)}:{tl['total'] % 60:05.2f}")
    for s in tl["segments"]:
        print(s["sid"], s["start"], s["vo_start"], s["vo_end"], s["end"], "gap whisper", s.get("gap_to_next"), "audible", s.get("gap_audible"), "added", s.get("gap_added"))
    print(tl["chapters"]); print(tl["midrolls"])
