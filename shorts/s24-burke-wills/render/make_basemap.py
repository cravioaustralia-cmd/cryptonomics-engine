"""Build the graded map canvas for s24 from the NASA/JPL/NIMA topo (PD).
Input : images/s24_12_australia_topo.jpg (1920x1794, Mercator)
Output: render/assets/basemap.jpg (2x, graded land, deep ocean, soft white coast glow)
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import os

HERE = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(HERE, '..', 'images', 's24_12_australia_topo.jpg')).convert('RGB')
S = 2
big = src.resize((src.width * S, src.height * S), Image.LANCZOS)
big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=90, threshold=2))
a = np.asarray(big).astype(np.float32) / 255.0

ocean_ref = np.array([74, 142, 181]) / 255.0
d = np.abs(a - ocean_ref).sum(2)
land = d > 60 / 255.0
land = ndi.binary_opening(land, iterations=1)
land = ndi.binary_fill_holes(land)
lf = ndi.gaussian_filter(land.astype(np.float32), 1.2)

# --- land grade: pull NASA greens toward outback ochre / olive, keep relief shading
lum = (a * [0.3, 0.59, 0.11]).sum(2, keepdims=True)
sat = a - lum
graded = lum + sat * 0.55
# warm tint: ochre shadows, sand highlights
ochre = np.array([0.72, 0.46, 0.26])
olive = np.array([0.40, 0.44, 0.24])
green_amt = np.clip((a[..., 1] - a[..., 0]) * 3.0, 0, 1)[..., None] * 0.6
tint = olive * green_amt + ochre * (1 - green_amt)
graded = graded * 0.55 + tint * lum * 1.05 + 0.02
# relief contrast
graded = np.clip((graded - 0.42) * 1.25 + 0.42, 0, 1)

# --- ocean: deep navy/teal with depth gradient from coast
dist = ndi.distance_transform_edt(~land) / S
depth = np.clip(dist / 120.0, 0, 1)[..., None]
shallow = np.array([0.10, 0.27, 0.34])
deep = np.array([0.03, 0.07, 0.12])
oceanc = shallow * (1 - depth) + deep * depth

out = graded * lf[..., None] + oceanc * (1 - lf[..., None])

# --- coast glow (outer, on ocean side) + thin bright rim
edge_d = dist
glow = np.exp(-(edge_d / 6.0) ** 2) * (~land)
rim = np.exp(-(edge_d / 1.2) ** 2) * (~land)
out = out + glow[..., None] * 0.22 + rim[..., None] * 0.35
out = np.clip(out, 0, 1)

img = Image.fromarray((out * 255).astype(np.uint8))
os.makedirs(os.path.join(HERE, 'assets'), exist_ok=True)
img.save(os.path.join(HERE, 'assets', 'basemap.jpg'), quality=90)
print(img.size)
