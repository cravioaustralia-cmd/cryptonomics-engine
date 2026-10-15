#!/usr/bin/env python3
"""Resize photos for the renderer and apply the house grade (slight warmth only; never alters faces)."""
import os
from PIL import Image, ImageEnhance
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(EP, 'render', 'cache', 'photos'); os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(os.path.join(EP, 'images'))):
    im = Image.open(os.path.join(EP, 'images', f)).convert('RGB')
    s = min(1.0, 2000 / max(im.size)); im = im.resize((round(im.width*s), round(im.height*s)), Image.LANCZOS)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v*1.03+2))); b = b.point(lambda v: int(v*0.97))
    im = Image.merge('RGB', (r, g, b)); im = ImageEnhance.Contrast(im).enhance(1.03)
    im.save(os.path.join(out, os.path.splitext(f)[0] + '.jpg'), quality=92)
    print(f, im.size)
