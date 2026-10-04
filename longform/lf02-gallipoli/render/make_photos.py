"""Grade the seated real photos for the film (images/ is read only; outputs go to render/photos/).

Every photo: warm sepia from its own luminance (never colourised; IMG20's autochrome colour is discarded the
same way), a little grain, a soft vignette. Crops only remove scan margins / archive footer strips, and frame
IMG16 on Atatürk alone (his wife Latife is outside the crop). Low-resolution files keep their native size:
nothing is upscaled or sharpened here.
IMG19 is a modern public-domain map with Spanish labels: it becomes a faint, softened texture with the legend
cropped out, never a readable map.
"""
import os
import numpy as np
from PIL import Image, ImageOps, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'images')
OUT = os.path.join(HERE, 'photos')
os.makedirs(OUT, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None

# crop boxes as fractions (left, top, right, bottom)
CROP = {
    'IMG02': (0.035, 0.0, 0.965, 0.935),
    'IMG05': (0.02, 0.03, 0.98, 0.865),
    'IMG10': (0.0, 0.0, 1.0, 0.955),
    'IMG11': (0.0, 0.0, 1.0, 0.955),
    'IMG16': (0.385, 0.06, 0.862, 0.965),
    'IMG20': (0.025, 0.012, 0.975, 0.945),
}
MAXSIDE = {'IMG13': 4000}


def grade(im, seed, grain=0.030, vig=0.26):
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=0.6)
    a = np.asarray(g, np.float32) / 255
    a = 0.06 + 0.88 * a                      # lift blacks, cap whites: soft mid-contrast, no glare
    h, w = a.shape
    rng = np.random.default_rng(seed)
    a = a + rng.standard_normal((h, w)).astype(np.float32) * grain
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    a = a * (1 - vig * np.clip((r - 0.35) / 0.65, 0, 1) ** 1.7)
    a = np.clip(a, 0, 1)
    dark, mid, light = np.array([34, 24, 15]), np.array([146, 114, 76]), np.array([238, 224, 194])
    lo = a[..., None] < 0.5
    t = np.where(lo, a[..., None] * 2, (a[..., None] - 0.5) * 2)
    rgb = np.where(lo, dark + (mid - dark) * t, mid + (light - mid) * t)
    return Image.fromarray(rgb.astype(np.uint8))


for i, f in enumerate(sorted(os.listdir(SRC))):
    if not f.startswith('IMG'):
        continue
    k = f.split('.')[0]
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    if k in CROP:
        l, t, r, b = CROP[k]
        W, H = im.size
        im = im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
    if k == 'IMG19':
        W, H = im.size
        im = im.crop((0, 0, W, int(H * 0.75)))      # legend (Spanish) cut away
        im.thumbnail((1600, 1600), Image.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(2.2))  # labels soften past reading at film size
        g = ImageOps.grayscale(im)
        a = np.asarray(g, np.float32) / 255
        rgb = np.stack([a * 0.92 + 0.06, a * 0.86 + 0.07, a * 0.74 + 0.08], -1)
        Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'IMG19_tex.jpg'), quality=86)
        print(k, im.size, 'texture')
        continue
    ms = MAXSIDE.get(k, 2400)
    if max(im.size) > ms:
        im.thumbnail((ms, ms), Image.LANCZOS)
    out = grade(im, 1915 + i)
    out.save(os.path.join(OUT, k + '.jpg'), quality=88)
    print(k, out.size)
