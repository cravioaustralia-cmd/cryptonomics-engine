#!/usr/bin/env python3
"""static_check.py - golden rule: something reacts every 1-2 s, except quiet moments and BREATHE holds.
Flags stretches longer than 2 s where the picture barely changes (mean abs frame difference at 192x108)
and where no planned event (cue, tick, tag, sfx) starts, outside quiet segments and scripted holds.

  python3 render/static_check.py VIDEO.mp4
"""
import subprocess, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import film

QUIET = {"S01", "S15", "S24", "S36", "S37", "S45", "S38", "S39", "S40", "S41"}


def main():
    v = sys.argv[1]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf", "scale=192:108,format=gray", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, 108, 192).astype(np.int16)
    d = np.abs(np.diff(a, axis=0)).mean(axis=(1, 2))
    film.ensure()
    T = film.T
    ev = sorted(e.t for e in film.EV.EVENTS)
    # word onsets also count as "reactions" only when something on screen changes, so not included here
    holds = []
    for s in T.segs:
        if s.sid in QUIET:
            holds.append((s.start, s.end))
        if getattr(s, "chapter_hold", None):
            holds.append(tuple(s.chapter_hold))
        holds.append((s.vo_end, s.end))           # post holds
        holds.append((s.start, s.vo_start))       # pre holds
    still = d < 0.35
    out = []
    i = 0
    n = len(d)
    while i < n:
        if still[i]:
            j = i
            while j < n and still[j]:
                j += 1
            t0, t1 = i / 30, j / 30
            if t1 - t0 > 2.0:
                inside = any(h0 - 0.2 <= t0 and t1 <= h1 + 0.2 for h0, h1 in holds)
                evs = [e for e in ev if t0 + 0.3 < e < t1 - 0.3]
                if not inside and len(evs) < (t1 - t0) / 2.0:
                    out.append((round(t0, 2), round(t1, 2), round(t1 - t0, 2), T.at((t0 + t1) / 2).sid, len(evs)))
            i = j
        else:
            i += 1
    print("static stretches > 2 s outside quiet moments and holds (t0, t1, dur, seg, planned events inside):")
    for o in out:
        print(o)
    print("count", len(out))


if __name__ == "__main__":
    main()
