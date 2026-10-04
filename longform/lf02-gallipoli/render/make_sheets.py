"""Contact sheet + chapter stills from the delivered master (final/lf02-gallipoli.mp4), at master timecodes."""
import json, os, subprocess, re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
MP4 = os.path.join(EP, 'final', 'lf02-gallipoli.mp4')
OUT = os.path.join(EP, 'final')
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', MP4]))


def grab(t, path, w=None):
    vf = ['-vf', f'scale={w}:-2'] if w else []
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', MP4, '-frames:v', '1'] + vf + ['-q:v', '3', path], check=True)


os.makedirs(os.path.join(OUT, 'chapters'), exist_ok=True)
for i, c in enumerate(json.load(open(os.path.join(EP, 'build', 'chapters.json')))):
    slug = re.sub(r'[^a-z0-9]+', '-', c['title'].lower().replace('’', '')).strip('-')
    grab(c['master'] + 2.0, os.path.join(OUT, 'chapters', f'{i:02d}-{slug}.jpg'))
grab(json.load(open(os.path.join(HERE, 'timeline.json')))['marks']['endScreen'] / 1.28 + 3, os.path.join(OUT, 'chapters', '05-end-screen.jpg'))

cols, rows = 8, 8
tw, th = 320, 180
sheet = Image.new('RGB', (cols * tw, rows * (th + 20)), (16, 14, 12))
d = ImageDraw.Draw(sheet)
n = cols * rows
tmp = '/tmp/lf02_cs.jpg'
for i in range(n):
    t = (i + 0.5) * dur / n
    grab(t, tmp, tw)
    im = Image.open(tmp)
    x, y = (i % cols) * tw, (i // cols) * (th + 20)
    sheet.paste(im, (x, y + 20))
    d.text((x + 5, y + 4), f'{int(t // 60)}:{t % 60:04.1f}', fill=(240, 220, 160))
sheet.save(os.path.join(OUT, 'contact-sheet.jpg'), quality=85)
print('contact sheet + chapter stills written')
