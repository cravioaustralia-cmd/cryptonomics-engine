#!/usr/bin/env python3
"""sheet.py - tile PNG/JPG stills into a labelled contact sheet: sheet.py OUT.jpg COLS img1 img2 ..."""
import sys, subprocess
out, cols, imgs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
args = []
for p in imgs:
    args += ["-i", p]
n = len(imgs)
rows = (n + cols - 1) // cols
fl = "".join(f"[{i}]scale=640:360,drawtext=text='{p.split('/')[-1][:-4]}':fontcolor=yellow:fontsize=18:x=6:y=6:box=1:boxcolor=black@0.6[v{i}];" for i, p in enumerate(imgs))
lay = "|".join(f"{(i % cols) * 640}_{(i // cols) * 360}" for i in range(n))
fl += "".join(f"[v{i}]" for i in range(n)) + f"xstack=inputs={n}:layout={lay}:fill=black"
if n == 1:
    fl = f"[0]scale=640:360[o]"; 
subprocess.run(["ffmpeg", "-v", "error", "-y"] + args + ["-filter_complex", fl, "-frames:v", "1", out], check=True)
