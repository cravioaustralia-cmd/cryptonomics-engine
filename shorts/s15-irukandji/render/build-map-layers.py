"""Build the locked-style map layers for s15 from the NASA MODIS basemap (s15_04).

Land mask is classified from the satellite pixels themselves (so the coastline is the real
Cape York / north Queensland coast in that image), then used to make:
  s15_12_map_basemap.jpg      crop of s15_04 (portrait-friendly), light grade
  s15_13_map_parchment.png    weathered parchment fill, alpha-masked to land (terrain shows through)
  s15_14_map_glow.png         soft drop shadow + thick white outer glow on the coast
  s15_15_map_waters.png       tropical-north coastal waters band (the Irukandji "waters")
Run: python3 shorts/s15-irukandji/render/build-map-layers.py   (needs numpy, scipy, pillow)
"""
import os
import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage as nd

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'images')
X0, X1 = 600, 3400          # crop of the 4153×3959 source (full height)
HALF = 2                    # overlays at half resolution

src = Image.open(os.path.join(IMG, 's15_04_gbr_northern_aus_modis_satellite.jpg')).convert('RGB')
crop = src.crop((X0, 0, X1, src.height))
crop = ImageEnhance.Contrast(ImageEnhance.Color(crop).enhance(1.15)).enhance(1.08)
crop.save(os.path.join(IMG, 's15_12_map_basemap.jpg'), quality=86)

small = crop.resize((crop.width // HALF, crop.height // HALF), Image.LANCZOS)
a = np.asarray(small).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
land = ((g > b * 1.2) & (r > g * 0.35)) | (((r + g) / 2 > b * 1.12) & (r > 40))   # savanna + dark rainforest; sea/reef b ≥ g; Gulf sediment has r ≪ g
land = nd.binary_opening(land, iterations=2)
land = nd.binary_closing(land, iterations=5)
lab, n = nd.label(land)
land = lab == (np.argmax(nd.sum(land, lab, range(1, n + 1))) + 1)
land = nd.binary_fill_holes(land)
soft = nd.gaussian_filter(land.astype(float), 2.2)
land = soft > 0.5
m = nd.gaussian_filter(land.astype(float), 1.0)          # anti-aliased mask 0..1
h, w = m.shape
rng = np.random.default_rng(15)

def noise(scale, amp):
    return nd.gaussian_filter(rng.standard_normal((h, w)), scale) * amp

# --- parchment: warm base, multi-scale mottling, fibres, burnt inner edge ---
tone = 0.5 + noise(40, 9) + noise(12, 4) + noise(3, 1.2)
fib = nd.gaussian_filter(rng.standard_normal((h, w)), (0.6, 14)) * 3.5   # horizontal fibres
tone = np.clip(tone + fib * 0.35, 0, 1)
dist = nd.distance_transform_edt(land)
burn = np.clip(1 - dist / 38.0, 0, 1) ** 1.6                                  # darker toward coast
base = np.array([236, 214, 168], float)
dark = np.array([122, 82, 42], float)
k = np.clip(0.25 * (1 - tone) + 0.65 * burn, 0, 1)[..., None]
rgb = base * (1 - k) + dark * k
alpha = m * np.clip(0.50 + 0.18 * burn + noise(20, 0.6) * 0.1, 0.35, 0.72)
Image.fromarray(np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8), 'RGBA').save(
    os.path.join(IMG, 's15_13_map_parchment.png'), optimize=True)

# --- soft shadow (offset) + thick white outer glow ---
outside = 1 - m
shadow = nd.shift(nd.gaussian_filter(m, 10), (9, 6), order=1) * outside * 0.55
glow_core = nd.gaussian_filter(nd.binary_dilation(land, iterations=5).astype(float), 1.2)
glow_halo = nd.gaussian_filter(nd.binary_dilation(land, iterations=10).astype(float), 7)
glow = np.clip(glow_core * 0.95 + glow_halo * 0.55, 0, 1) * outside
ga = np.clip(glow + shadow * (1 - glow), 0, 1)
white = glow / np.maximum(ga, 1e-6)
rgb = np.dstack([white * 255] * 3)
Image.fromarray(np.dstack([rgb, ga * 255]).astype(np.uint8), 'RGBA').save(
    os.path.join(IMG, 's15_14_map_glow.png'), optimize=True)

# --- coastal waters band (tropical north waters) with fine diagonal hatch ---
band = nd.binary_dilation(land, iterations=70) & ~land
bandf = nd.gaussian_filter(band.astype(float), 14) * outside
yy, xx = np.mgrid[0:h, 0:w]
hatch = 0.55 + 0.45 * (np.sin((xx + yy) * 0.55) > 0.2)
near = np.clip(1 - nd.distance_transform_edt(~land) / 80.0, 0, 1)
wa = np.clip(bandf * hatch * (0.35 + 0.55 * near), 0, 1)
col = np.array([64, 232, 255], float)
Image.fromarray(np.dstack([np.broadcast_to(col, (h, w, 3)), wa[..., None] * 255]).astype(np.uint8), 'RGBA').save(
    os.path.join(IMG, 's15_15_map_waters.png'), optimize=True)
print('crop', crop.size, 'overlays', (w, h))
