#!/usr/bin/env python3
"""Contact sheet: tile PNG/JPG frames with timestamps.  sheet.py out.jpg cols w f1 f2 ..."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
h = int(w * 16 / 9)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols + 1) * 8, rows * (h + 34) + 8), (18, 18, 22))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype(os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts', 'Montserrat.ttf'), 22)
except Exception:
    font = None
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x = 8 + (i % cols) * (w + 8)
    y = 8 + (i // cols) * (h + 34)
    sheet.paste(im, (x, y))
    label = os.path.basename(f).rsplit('.', 1)[0].replace('t_', 't=').replace('f_', 'f')
    d.text((x + 4, y + h + 4), label, fill=(230, 230, 230), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
