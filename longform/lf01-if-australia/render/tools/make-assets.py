#!/usr/bin/env python3
"""Procedural textures for lf01 (no third-party images):
  assets/paper.jpg   screen-space parchment grain (multiply layer, near-white)
  assets/clouds.png  soft cloud sheet with alpha, for the cold-open dive from altitude
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1942)
W, H = 1920, 1080

def fbm(w, h, scales):
    acc = np.zeros((h, w), np.float32)
    for sc, amp in scales:
        small = rng.standard_normal((h // sc + 3, w // sc + 3)).astype(np.float32)
        up = np.asarray(Image.fromarray(small).resize(((w // sc + 3) * sc, (h // sc + 3) * sc), Image.BICUBIC))
        acc += amp * up[:h, :w]
    return acc / np.abs(acc).max()

# --- paper: blotches + fibres + fine tooth, all darkening only (multiply)
blot = fbm(W, H, [(240, 1.0), (90, 0.5), (30, 0.25)])
tooth = rng.standard_normal((H, W)).astype(np.float32)
from scipy import ndimage
tooth = ndimage.gaussian_filter(tooth, 0.6)
fib = Image.new('L', (W, H), 0)
from PIL import ImageDraw
d = ImageDraw.Draw(fib)
for _ in range(2600):
    x, y = rng.uniform(0, W), rng.uniform(0, H)
    ang = rng.uniform(0, np.pi)
    ln = rng.uniform(6, 26)
    d.line([(x, y), (x + np.cos(ang) * ln, y + np.sin(ang) * ln)], fill=int(rng.uniform(20, 70)), width=1)
fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.5)), np.float32) / 255
v = 248 - 10 * (blot * 0.5 + 0.5) - 5 * tooth - 22 * fib
v = np.clip(v, 205, 255)
paper = np.stack([v, v * 0.985, v * 0.955], -1)
Image.fromarray(paper.astype(np.uint8)).save(os.path.join(OUT, 'paper.jpg'), quality=90)

# --- clouds: billowy alpha sheet, tileable enough for scaling passes
CW, CH = 2400, 1600
n = fbm(CW, CH, [(400, 1.0), (160, 0.6), (64, 0.35), (24, 0.18), (8, 0.08)])
a = np.clip((n - 0.05) * 2.2, 0, 1) ** 1.4
yy, xx = np.mgrid[0:CH, 0:CW]
r = np.hypot((xx - CW / 2) / (CW / 2), (yy - CH / 2) / (CH / 2))
a *= np.clip(1.25 - r, 0, 1)
shade = 225 + 25 * np.clip(n, -1, 1)
rgba = np.stack([shade * 0.96, shade * 0.97, shade, a * 235], -1)
Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'clouds.png'), optimize=True)
print('ok', OUT)
