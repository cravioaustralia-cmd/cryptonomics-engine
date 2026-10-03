#!/usr/bin/env python3
"""Contact sheet + chapter stills from the finished film.
  final/contact-sheet.jpg   one frame per voice chunk (mid-chunk), each B-roll (mid-clip) and the end screen
  final/chapters/NN-*.jpg   one still per chapter (2 s after the chapter starts)
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

EP = os.path.abspath(sys.argv[1])
video = sys.argv[2] if len(sys.argv) > 2 else os.path.join(EP, 'out', 'master.mp4')
SC = json.load(open(os.path.join(EP, 'out', 'score.json')))
FIN = os.path.join(EP, 'final')
os.makedirs(os.path.join(FIN, 'chapters'), exist_ok=True)
font = ImageFont.truetype(os.path.join(EP, 'render', 'fonts', 'Oswald.ttf'), 22)

def grab(t, w=None):
    vf = ['-vf', f'scale={w}:-2'] if w else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1', *vf, '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    from io import BytesIO
    return Image.open(BytesIO(raw)).convert('RGB')

fmt = lambda t: f'{int(t // 60)}:{t % 60:04.1f}'
items = []
for s in SC['segments']:
    items.append((s['start'] + s['dur'] * 0.55, f"{s['id']}  {fmt(s['start'] + s['dur'] * 0.55)}"))
for b in SC['broll']:
    items.append((b['t'] + b['dur'] / 2, f"{b['id']} ({b['beat']})  {fmt(b['t'] + b['dur'] / 2)}"))
items.append((SC['endScreen']['start'] + 5, f"End screen  {fmt(SC['endScreen']['start'] + 5)}"))
items.sort()
TW, TH, COLS = 384, 216, 6
rows = (len(items) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * TW, rows * (TH + 30) + 50), (24, 20, 16))
d = ImageDraw.Draw(sheet)
d.text((12, 10), f"lf01 IF AUSTRALIA — contact sheet ({len(items)} frames, runtime {fmt(SC['duration'])})", font=font, fill=(241, 230, 203))
for i, (t, lab) in enumerate(items):
    x, y = (i % COLS) * TW, 50 + (i // COLS) * (TH + 30)
    sheet.paste(grab(t, TW), (x, y))
    d.text((x + 6, y + TH + 2), lab, font=font, fill=(230, 190, 120) if lab.startswith('B') else (241, 230, 203))
sheet.save(os.path.join(FIN, 'contact-sheet.jpg'), quality=86)
for i, c in enumerate(SC['chapters']):
    name = ''.join(ch if ch.isalnum() else '-' for ch in c['title'].lower()).strip('-')
    while '--' in name: name = name.replace('--', '-')
    grab(c['t'] + 2.0).save(os.path.join(FIN, 'chapters', f'{i + 1:02d}-{name}.jpg'), quality=88)
print('contact sheet + chapter stills written')
