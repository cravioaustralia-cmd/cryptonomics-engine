"""Landscape name-card crops of the two public-domain stills (images/, see images/SOURCES.md)
-> render/assets/card_*.jpg. Crop + gentle sepia tone only; no retouching, no face edits."""
import os
from PIL import Image, ImageOps, ImageEnhance
HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.join(HERE, '..', '..')
CROPS = {
    # Phar Lap with Jim Pike, Flemington c.1930 (Commons File:Phar_Lap.jpg), whole horse
    'pharlap': ('s32_phar_lap.jpg', (180, 30, 3060, 2190)),
    # Phar Lap winning the 1930 Melbourne Cup (Commons File:Pharlap1930melbournecup.jpg)
    'cup1930': ('s32_phar_lap_melbourne_cup_1930.jpg', (10, 14, 590, 449)),
}
for k, (f, box) in CROPS.items():
    im = Image.open(os.path.join(EP, 'images', f)).convert('L').crop(box).resize((480, 360), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=0.5)
    im = ImageOps.colorize(im, black=(22, 18, 14), white=(246, 240, 228), mid=(140, 128, 112))
    im = ImageEnhance.Sharpness(im).enhance(1.1)
    im.save(os.path.join(EP, 'render', 'assets', f'card_{k}.jpg'), quality=90)
    print(k, im.size)
