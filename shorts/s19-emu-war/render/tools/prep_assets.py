#!/usr/bin/env python3
"""s19 asset prep: vertical 9:16 underlays from images/ → render/assets/.

  modern WA stills  → <id>.jpg        1188×2112 crop (10 % headroom for drift/parallax)
  period 1932 stills → <id>_bg.jpg     blurred, toned 9:16 fill (the print sits on top)
                     → <id>_print.jpg  2× Lanczos upscale, warm monochrome (framed archival print)
  grain.png         → film-grain tile (animated offset in scenes.js)

Run from the episode dir:  python3 render/tools/prep_assets.py
"""
import os
import random
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(EP, 'images')
OUT = os.path.join(EP, 'render', 'assets')
os.makedirs(OUT, exist_ok=True)
VW, VH = 1188, 2112

# id: (file, centre-x frac, centre-y frac, crop-height frac of source)
MODERN = {
    'wheatbelt': ('s19_06_wheatbelt_merredin.jpg', 0.50, 0.50, 1.00),
    'aerial': ('s19_07_merredin_aerial.jpg', 0.52, 0.50, 1.00),
    'run': ('s19_08_emu_running_monkey_mia_wa.jpg', 0.551, 0.524, 0.26),
    'stokes': ('s19_09_emus_stokes_np_wa.jpg', 0.50, 0.50, 1.00),
    'cape': ('s19_10_emu_cape_range_wa.jpg', 0.585, 0.56, 0.78),
    'bibb': ('s19_11_emu_bibbulmun_wa.jpg', 0.50, 0.50, 1.00),
    'mob': ('s19_12_emu_mob.jpg', 0.40, 0.50, 1.00),
}
PERIOD = {
    'resting': 's19_01_soldiers_resting_emu_war.jpg',
    'lewis': 's19_02_lewis_gun_emu_war.jpg',
    'gunners': 's19_03_mcmurray_ohalloran_lewis.jpg',
    'drink': 's19_04_emus_coming_to_drink.jpg',
    'fallow': 's19_05_fallow_caused_by_emus.jpg',
}


def crop916(im, cx, cy, hf):
    w, h = im.size
    ch = h * hf
    cw = ch * 9 / 16
    if cw > w:
        cw = w
        ch = cw * 16 / 9
    x0 = min(max(cx * w - cw / 2, 0), w - cw)
    y0 = min(max(cy * h - ch / 2, 0), h - ch)
    return im.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch)))


def tone(im, warm=(28, 20, 10)):
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=1)
    return ImageOps.colorize(g, black=warm, white=(246, 236, 214), mid=(138, 118, 92))


for k, (f, cx, cy, hf) in MODERN.items():
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    c = crop916(im, cx, cy, hf).resize((VW, VH), Image.LANCZOS)
    c.save(os.path.join(OUT, k + '.jpg'), quality=88)
    print(k, im.size, '→', c.size)

for k, f in PERIOD.items():
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    bg = crop916(im, 0.5, 0.5, 1.0).resize((270, 480), Image.LANCZOS)
    bg = tone(bg).filter(ImageFilter.GaussianBlur(9)).resize((1080, 1920), Image.BICUBIC)
    bg = ImageEnhance.Brightness(bg).enhance(0.72)
    bg.save(os.path.join(OUT, k + '_bg.jpg'), quality=84)
    p = tone(im).resize((im.width * 2, im.height * 2), Image.LANCZOS)
    p = p.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    p.save(os.path.join(OUT, k + '_print.jpg'), quality=90)
    print(k, im.size, '→ print', p.size)

# film grain tile (alpha noise)
random.seed(19)
g = Image.new('LA', (540, 960))
px = g.load()
for y in range(960):
    for x in range(540):
        v = random.randint(0, 255)
        px[x, y] = (v, 34 if random.random() < 0.5 else 18)
g.save(os.path.join(OUT, 'grain.png'))
print('grain ok')

# Problem-1 pan plate: the two WA emus drifting apart (Stokes NP) as one wide band, full screen height
im = Image.open(os.path.join(SRC, 's19_09_emus_stokes_np_wa.jpg')).convert('RGB')
band = im.crop((0, 1500, im.width, im.height))
band = band.resize((round(band.width * 1920 / band.height), 1920), Image.LANCZOS)
band.save(os.path.join(OUT, 'stokes_wide.jpg'), quality=86)
print('stokes_wide', band.size)
