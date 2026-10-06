"""Measure the music bus under the voice vs in holds (1x stems from `STEMS=1 python3 mix.py`)."""
import json
import os
import subprocess

import numpy as np

from design import EP

BUILD = os.path.join(EP, "build")
SR = 48000


def load(p):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32)


def rms_db(x):
    return 10 * np.log10(np.mean(x.astype(np.float64) ** 2) + 1e-12)


def measure():
    import cut as C
    c = C.build()
    mus = load(os.path.join(BUILD, "stem_mus.wav"))
    info = c.info
    under = []
    for seg, t in c.vo:
        a, b = t + 0.5, t + info[seg]["dur"] - 0.5
        for w in np.arange(a, b - 1.0, 1.0):
            under.append(rms_db(mus[int(w * SR):int((w + 1.0) * SR)]))
    holds = {}
    for blk in c.blocks:
        if blk["kind"] in ("hold", "mid") and blk["name"] not in ("H0", "END"):
            a, b = blk["t0"] + 0.3, blk["t1"] - 0.1
            holds[blk["name"]] = rms_db(mus[int(a * SR):int(b * SR)])
    med_under = float(np.median(under))
    hold_vals = [v for k, v in holds.items() if k.startswith("H")]
    med_hold = float(np.median(hold_vals))
    out = dict(under_median=med_under, hold_median=med_hold, dip=med_hold - med_under,
               hold_min=min(hold_vals), hold_max=max(hold_vals), holds=holds)
    json.dump(out, open(os.path.join(BUILD, "musicdip.json"), "w"), indent=1)
    return out


if __name__ == "__main__":
    print(json.dumps(measure(), indent=1))
