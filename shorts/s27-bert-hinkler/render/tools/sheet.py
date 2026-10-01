#!/usr/bin/env python3
"""Tile preview PNGs into contact sheets (6 per row), labelled with timestamps."""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
per = int(sys.argv[3]) if len(sys.argv) > 3 else 12
fs = sorted(glob.glob(os.path.join(src, 'f_*.png')))
tw, th = 300, 533
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: font = None
pages = [fs[i:i + per] for i in range(0, len(fs), per)]
for pi, page in enumerate(pages):
    cols = 6; rows = (len(page) + cols - 1) // cols
    sh = Image.new('RGB', (cols * tw, rows * (th + 30)), (12, 12, 18))
    d = ImageDraw.Draw(sh)
    for i, f in enumerate(page):
        im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
        x, y = (i % cols) * tw, (i // cols) * (th + 30)
        sh.paste(im, (x, y + 30))
        d.text((x + 8, y + 3), os.path.basename(f)[2:-4] + ' s', fill=(255, 210, 63), font=font)
    sh.save(out.replace('.jpg', f'-{pi + 1}.jpg') if len(pages) > 1 else out, quality=86)
print(len(pages), 'pages')
