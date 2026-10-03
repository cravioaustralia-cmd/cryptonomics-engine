#!/usr/bin/env python3
"""Composite overlays (1920×1080 RGBA) and zoom-through iris masks.
  out/overlay/badge.png       "IF AUSTRALIA" corner badge, on top of everything, whole film incl. end screen
  out/overlay/dramatised.png  "Dramatised reconstruction" label, B01 only
  out/overlay/iris_<ID>.mkv   per-clip alpha mask: opens from the pin (0.3 s), holds, shrinks back into the pin
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

EP = os.path.abspath(sys.argv[1])
R = os.path.join(EP, 'render')
O = os.path.join(EP, 'out', 'overlay')
os.makedirs(O, exist_ok=True)
F = lambda n, s: ImageFont.truetype(os.path.join(R, 'fonts', n), s)
W, H = 1920, 1080

# ---------------- badge
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
x0, y0, bw, bh = 40, 34, 318, 70
ImageDraw.Draw(sh).rounded_rectangle([x0 + 4, y0 + 6, x0 + bw + 4, y0 + bh + 6], 8, fill=(30, 18, 6, 110))
sh = sh.filter(ImageFilter.GaussianBlur(5))
img.alpha_composite(sh)
d = ImageDraw.Draw(img)
d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], 8, fill=(241, 230, 203, 238), outline=(51, 38, 26, 255), width=3)
d.rounded_rectangle([x0 + 7, y0 + 7, x0 + bw - 7, y0 + bh - 7], 5, outline=(176, 38, 28, 255), width=2)
f = F('Oswald.ttf', 40)
f.set_variation_by_axes([700])
tw = d.textlength('IF ', font=f) + 2 + d.textlength('AUSTRALIA', font=f)
tx = x0 + (bw - tw) / 2
d.text((tx, y0 + 9), 'IF', font=f, fill=(176, 38, 28, 255))
d.text((tx + d.textlength('IF ', font=f) + 2, y0 + 9), 'AUSTRALIA', font=f, fill=(51, 38, 26, 255))
img.save(os.path.join(O, 'badge.png'))

# ---------------- dramatised label (B01)
lab = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(lab)
f = F('IMFellItalic.ttf', 30)
txt = 'Dramatised reconstruction'
tw = d.textlength(txt, font=f)
d.rounded_rectangle([44, 996, 44 + tw + 36, 1040], 6, fill=(12, 10, 8, 150))
d.text((62, 1000), txt, font=f, fill=(241, 230, 203, 235))
lab.save(os.path.join(O, 'dramatised.png'))

# ---------------- iris masks
SC = json.load(open(os.path.join(EP, 'out', 'score.json')))
FPS = 30
yy, xx = np.mgrid[0:H // 2, 0:W // 2].astype(np.float32) * 2
rr = np.hypot(xx - W / 2, yy - H / 2)
RMAX = np.hypot(W / 2, H / 2) + 40
for b in SC['broll']:
    n = int(round(b['dur'] * FPS))
    path = os.path.join(O, f"iris_{b['id']}.mkv")
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W // 2}x{H // 2}', '-r', str(FPS), '-i', '-',
                          '-vf', f'scale={W}:{H}:flags=bicubic', '-c:v', 'ffv1', '-pix_fmt', 'gray', path], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / FPS
        if t < 0.3:
            k = (t + 1 / FPS) / 0.3; r = RMAX * (1 - (1 - k) ** 3); soft = 60
        elif t > b['dur'] - 0.35:
            k = (b['dur'] - t) / 0.35; r = RMAX * (k ** 1.6); soft = 50
        else:
            r, soft = RMAX * 2, 1
        m = np.clip((r - rr) / soft + 0.5, 0, 1)
        p.stdin.write((m * 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    print('iris', b['id'], n, 'frames')
