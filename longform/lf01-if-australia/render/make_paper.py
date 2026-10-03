"""Screen-space parchment overlay (multiply): fine grain, faint fibres, soft edge burn.
Kept light so the terrain stays readable (no glare, no heavy vignette)."""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1920, 1080
rng = np.random.default_rng(7)
g = rng.standard_normal((H, W)).astype(np.float32)
grain = ndi.gaussian_filter(g, 0.6) * 0.022
blot = ndi.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 40)
blot = blot / np.abs(blot).max() * 0.035
fib = ndi.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), (0.5, 9))
fib = fib / np.abs(fib).max() * 0.02
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
dx = (x - W / 2) / (W / 2)
dy = (y - H / 2) / (H / 2)
r = np.sqrt(dx ** 2 * 0.85 + dy ** 2 * 1.0)
burn = np.clip((r - 0.78) / 0.6, 0, 1) ** 1.6 * 0.20
v = 1.0 - burn + grain + blot - np.abs(fib)
rgb = np.stack([v * 1.0, v * 0.985, v * 0.955], -1)
rgb = np.clip(rgb, 0, 1)
Image.fromarray((rgb * 255).astype(np.uint8)).save(os.path.join(HERE, 'assets', 'paper.jpg'), quality=92)
print('paper ok')
