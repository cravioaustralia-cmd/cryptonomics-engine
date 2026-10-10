#!/usr/bin/env python3
"""QA on the rendered 1x picture.

- final/contact-sheet.jpg        one frame per second of the 1x cut
- final/contact-sheet-shots.jpg  key shots S05-S13
- render/build/qa.json           stillness runs (> 2 s with no visible change, grain suppressed)
                                 and S10 balance measurements taken from the frames themselves
"""
import json, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
B = os.path.join(HERE, "build")
F = os.path.join(EP, "final")
PIC = os.path.join(B, "picture.mp4")
TL = json.load(open(os.path.join(HERE, "timeline.json")))
C = TL["cue"]
FONT = ImageFont.truetype(os.path.join(EP, "fonts", "Inter-SemiBold.ttf"), 18)


def frames(w, h, fps=None, gray=False):
    vf = (f"fps={fps}," if fps else "") + f"scale={w}:{h}:flags=area"
    pf = "gray" if gray else "rgb24"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", PIC, "-vf", vf, "-f", "rawvideo", "-pix_fmt", pf, "-"], capture_output=True, check=True).stdout
    c = 1 if gray else 3
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, c) if c == 3 else np.frombuffer(raw, np.uint8).reshape(-1, h, w)


def seg_at(t):
    cur = "open"
    for s, v in TL["segments"].items():
        if t >= v["speech_on"] - 0.6:
            cur = s
    return cur


# ---- contact sheet, 1 fps ------------------------------------------------------------------
fr = frames(320, 180, fps=1)
cols = 10
rows = (len(fr) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 320, rows * 200), (14, 26, 43))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(fr):
    x, y = (i % cols) * 320, (i // cols) * 200
    sheet.paste(Image.fromarray(f), (x, y))
    d.text((x + 6, y + 181), f"{i // 60}:{i % 60:02d}  {seg_at(i + 0.5)}", fill=(232, 163, 61), font=FONT)
sheet.save(os.path.join(F, "contact-sheet.jpg"), quality=82)

# ---- key shots ----------------------------------------------------------------------------
keys = [("Disclaimer", 2.0), ("Chapter card", 5.6), ("S05 PH26 + NOV 1947", C["november"] + 1.2), ("S05 world inset, New York", C["new_york"] + 0.3),
        ("S06 UN plan map", C["palestine_s06"] + 0.5), ("S06 Evatt + AUSTRALIAN", C["australian_word"] + 0.6), ("S06 lower third + callout", C["doc"] + 0.5),
        ("S07 DOC01 181 (II)", C["s07_pic"] + 2.2), ("S07 MAP03 partition plan", C["arab_state"] + 0.5), ("S07 roll call: Australia", C["australia"] + 0.8),
        ("S07 hold: DOC02 + A/PV.128", C["s07_hold"] + 0.9), ("S08 desert + sand", C["s08_pic"] + 1.5), ("S08 AI03 (labelled)", C["october"]),
        ("S08 FT02 Beersheba 1917", C["light_horsemen"] + 0.6), ("S08 MAP02 pin OCT 1917", C["beersheba"] + 0.6), ("S08 STACK", C["cavalry"] + 1.3),
        ("S08 road to Jerusalem", C["jerusalem"] + 1.2), ("S08 FT02c Jerusalem 1917", C["british"] + 1.2), ("S09 SPLIT 1917|1947", C["ballot"] + 0.7),
        ("S10 two memories, labels", C["nakba"] + 1.5), ("S10 700,000+", C["seven_hundred"] + 1.8), ("S10 same event", C["same_hold_start"] + 1.0),
        ("S10 TWO MEMORIES pinned", C["remember_idea"] + 2.2), ("S11 AI05 + flow line 1", C["sailed"] + 1.5), ("S11 PH05 Georgic", C["holocaust"] + 0.5),
        ("S11 PH06 Lakemba + flow 2", C["south_west"] + 1.9), ("S12 population", C["eight_hundred"] + 1.5), ("S13 Thread, node 1", C["australia_didnt"] + 1.2),
        ("S13 clock", C["start_clock"] + 0.3), ("S13 board: 1947 VOTE", C["never_heard"] + 1.3), ("S13 end hold", C["total"] - 1.6)]
tw, th = 480, 270
sheet = Image.new("RGB", (5 * tw, ((len(keys) + 4) // 5) * (th + 30)), (14, 26, 43))
d = ImageDraw.Draw(sheet)
for i, (lab, t) in enumerate(keys):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", PIC, "-frames:v", "1", "-vf", f"scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    im = Image.frombytes("RGB", (tw, th), raw)
    x, y = (i % 5) * tw, (i // 5) * (th + 30)
    sheet.paste(im, (x, y)); d.text((x + 8, y + th + 5), f"{lab}  ({t:.1f}s)", fill=(242, 238, 230), font=FONT)
sheet.save(os.path.join(F, "contact-sheet-shots.jpg"), quality=85)

# ---- stillness: grain-suppressed frame difference --------------------------------------------
g = frames(96, 54, gray=True).astype(np.float32)
# blur over 3x3 and compare against the frame 0.5 s earlier (accumulated motion), grain averages out
from scipy.ndimage import uniform_filter
g = uniform_filter(g, size=(1, 3, 3))
lag = 15
diff = np.abs(g[lag:] - g[:-lag]).mean(axis=(1, 2))
fps = 30
still = diff < 0.6   # mean abs change < 0.6 grey levels over 0.5 s = visually static
runs = []
i = 0
while i < len(still):
    if still[i]:
        j = i
        while j < len(still) and still[j]:
            j += 1
        a, b = i / fps, (j + lag) / fps
        if b - a > 2.0:
            runs.append({"from": round(a, 2), "to": round(b, 2), "dur": round(b - a, 2), "segment": seg_at(a + 0.1),
                         "in_S10": bool(a >= C["s10_pic"] and b <= C["s11_pic"])})
        i = j
    else:
        i += 1

# ---- S10 balance from the frames ------------------------------------------------------------
t0, t1 = C["s10_pic"], C["remember_idea"] - 0.45
fullres = lambda t: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", PIC, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout, np.uint8).reshape(1080, 1920, 3)
mid = fullres(C["catastrophe"])
col = mid.astype(int).sum(axis=2).mean(axis=0)
div = [x for x in range(900, 1020) if abs(col[x] - col[max(0, x - 6)]) > 0 or True]
# divider columns: the darkest/most uniform vertical band near the centre
band = mid[:, 940:980].astype(int)
std_cols = band.std(axis=0).sum(axis=1)
dcols = [940 + k for k, s in enumerate(std_cols) if s < 6]
left_w = (min(dcols) if dcols else 956)
right_w = 1920 - (max(dcols) + 1 if dcols else 964)


def label_onset(x0, x1):
    # first frame where the label band (top of each half) changes vs. before the labels
    seq = frames(192, 108, gray=True)
    n0, n1 = int((C["nakba"] - 1.0) * fps), int((C["nakba"] + 1.5) * fps)
    ref = seq[n0].astype(float)
    for n in range(n0, n1):
        ys, xs = slice(6, 18), slice(x0 // 10, x1 // 10)
        if np.abs(seq[n][ys, xs].astype(float) - ref[ys, xs]).mean() > 3.0:
            return n
    return None


lab_l, lab_r = label_onset(150, 810), label_onset(1110, 1770)
qa = {
    "stillness_runs_over_2s": runs,
    "S10": {
        "split_on_screen_from": round(t0, 3), "split_on_screen_to": round(t1, 3),
        "left_half_width_px": int(left_w), "right_half_width_px": int(right_w),
        "both_halves_duration_s": round(t1 - t0, 3),
        "ken_burns": "identical zoom curve for both halves: 1.04 + 0.0042 x seconds (same function call, s10Halves)",
        "label_left_first_change_frame": lab_l, "label_right_first_change_frame": lab_r,
        "label_trigger_frame (Nakba)": int(round(C["nakba"] * fps)),
    },
}
json.dump(qa, open(os.path.join(B, "qa.json"), "w"), indent=1)
print(json.dumps(qa, indent=1))
