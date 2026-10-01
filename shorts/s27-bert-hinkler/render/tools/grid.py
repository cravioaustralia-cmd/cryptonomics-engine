#!/usr/bin/env python3
"""Quick review grid of preview PNGs: python3 grid.py <dir> <out.jpg> [cols]"""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
fs = sorted(glob.glob(os.path.join(sys.argv[1], 'f_*.png'))); cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
tw, th = 360, 640; rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (cols * tw, rows * th)); d = ImageDraw.Draw(sh)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: font = None
for i, f in enumerate(fs):
    x, y = (i % cols) * tw, (i // cols) * th
    sh.paste(Image.open(f).convert('RGB').resize((tw, th)), (x, y))
    d.text((x + 6, y + 4), os.path.basename(f)[2:-4], fill=(255, 210, 63), font=font)
sh.save(sys.argv[2], quality=85)
