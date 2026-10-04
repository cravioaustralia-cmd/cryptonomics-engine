"""Square head-and-shoulders crops of the three public-domain portraits (images/, see images/SOURCES.md)
for the small name cards in scenes.js → render/assets/card_*.jpg. Crop + gentle tone only; no retouching."""
import os
from PIL import Image, ImageOps, ImageEnhance
HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.join(HERE, '..', '..')
CROPS = {
    'mawson': ('s31_douglas_mawson.jpg', (165, 95, 465, 395)),
    'ninnis': ('s31_belgrave_ninnis.jpg', (128, 8, 348, 228)),
    'mertz': ('s31_xavier_mertz.jpg', (150, 40, 750, 640)),
}
for k, (f, box) in CROPS.items():
    im = Image.open(os.path.join(EP, 'images', f)).convert('L').crop(box).resize((320, 320), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=0.5)
    im = ImageOps.colorize(im, black=(22, 18, 14), white=(246, 240, 228), mid=(140, 128, 112))
    im = ImageEnhance.Sharpness(im).enhance(1.15)
    im.save(os.path.join(EP, 'render', 'assets', f'card_{k}.jpg'), quality=90)
    print(k, im.size)
