"""Build the locked-style Nullarbor map layers for s16 (WA–SA / Eucla corridor only).

Basemap = real topo + real satellite colour, georeferenced (equirectangular, lon 122–134°E, lat 27–39.5°S):
  * relief + land/sea mask + bathymetry: AWS Terrain Tiles (terrarium, zoom 9; SRTM/GMTED/ETOPO1, public domain)
  * land colour: NASA satellite still s16_02 (public domain), fitted to the terrain coastline
    (least-squares IoU fit of its sea mask: lon = 121.697 + 0.01055·x, lat = −26.413 − 0.011722·y; IoU 0.92)
Outputs (images/):
  s16_15_map_basemap.jpg     shaded relief × satellite colour, bathymetric sea
  s16_16_map_parch_wa.png    weathered parchment fill, WA land west of 129°E (alpha; terrain shows through)
  s16_17_map_parch_sa.png    same for SA land east of 129°E
  s16_18_map_glow.png        soft offset shadow + thick white outer glow on the coast
  s16_19_map_border_glow.png thick white glow along the WA–SA border (129°E) on land
Run: python3 shorts/s16-nullarbor-845/render/build-map-layers.py   (needs numpy, scipy, pillow, curl)
"""
import math, os, subprocess, json
import concurrent.futures as cf
import numpy as np
from PIL import Image
from scipy import ndimage as nd

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'images')
CACHE = os.environ.get('TILE_CACHE', '/tmp/s16-tiles')
os.makedirs(CACHE, exist_ok=True)

LON0, LON1, LAT0, LAT1 = 122.0, 134.0, -27.0, -39.5
PPX = 180.0                                   # px per degree of longitude
PPY = PPX / math.cos(math.radians(31.7))      # keeps shapes true at the corridor latitude
W, H = int((LON1 - LON0) * PPX), int((LAT0 - LAT1) * PPY)
BORDER = 129.0                                # WA–SA border (southern section)
Z = 9

def tx(lon): return (lon + 180) / 360 * 2 ** Z
def ty(lat):
    r = math.radians(lat)
    return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** Z

xs = range(int(tx(LON0)), int(tx(LON1)) + 1)
ys = range(int(ty(LAT0)), int(ty(LAT1)) + 1)

def fetch(j):
    x, y = j
    f = os.path.join(CACHE, f'{Z}_{x}_{y}.png')
    if not os.path.exists(f):
        subprocess.run(['curl', '-sf', '-o', f, f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png'], check=True)
    return f
with cf.ThreadPoolExecutor(16) as ex:
    list(ex.map(fetch, [(x, y) for x in xs for y in ys]))

T = 256
mos = np.zeros((len(ys) * T, len(xs) * T), np.float32)
for i, x in enumerate(xs):
    for j, y in enumerate(ys):
        a = np.asarray(Image.open(os.path.join(CACHE, f'{Z}_{x}_{y}.png')).convert('RGB')).astype(np.float32)
        mos[j * T:(j + 1) * T, i * T:(i + 1) * T] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

lon = LON0 + (np.arange(W) + 0.5) / PPX
lat = LAT0 - (np.arange(H) + 0.5) / PPY
PX, PY = np.meshgrid((np.vectorize(tx)(lon) - xs[0]) * T, (np.vectorize(ty)(lat) - ys[0]) * T)
dem = nd.map_coordinates(mos, [PY, PX], order=1)
LONS = np.broadcast_to(lon, (H, W))

land = dem > 0
land = nd.binary_opening(land, iterations=1)
lab, n = nd.label(land)
sizes = nd.sum(land, lab, range(1, n + 1))
land = np.isin(lab, 1 + np.where(sizes > 400)[0])      # mainland + larger islands only
m = nd.gaussian_filter(land.astype(float), 0.8)

# --- relief (hillshade, NW light, exaggerated: the Nullarbor is very flat) ---
e = nd.gaussian_filter(np.where(land, dem, 0), 1.0)
gy, gx = np.gradient(e * 26.0, 1000 / PPY * 111, 1000 / PPX * 111 * math.cos(math.radians(31.7)))
slope = np.arctan(np.hypot(gx, gy))
aspect = np.arctan2(-gx, gy)
az, alt = math.radians(315), math.radians(40)
shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
shade = np.clip(shade / np.sin(alt), 0.35, 1.6)
hp = e - nd.gaussian_filter(e, 25)                       # local relief (dunes, dolines, escarpments)
shade = np.clip(shade * (1 + np.clip(hp / 40.0, -0.25, 0.25)), 0.3, 1.7)

# --- satellite colour, fitted to this grid ---
S = np.asarray(Image.open(os.path.join(IMG, 's16_02_nullarbor_satellite.jpg')).convert('RGB')).astype(float)
sx, sy, slon, slat = 0.01055, 0.011722, 121.69658, -26.41328
LX, LY = np.meshgrid(lon, lat)
ix = (LX - slon) / sx
iy = (slat - LY) / sy
col = np.dstack([nd.map_coordinates(S[..., c], [iy, ix], order=1, mode='nearest') for c in range(3)])
swater = (col[..., 2] > col[..., 0] + 15) & (col.sum(-1) < 260)
inset = (ix < 290) & (iy < 225)
good = land & ~swater & ~inset & (ix >= 0) & (ix < S.shape[1]) & (iy >= 0) & (iy < S.shape[0])
# fill misregistered / missing land colour from nearby good land colour
wgt = nd.gaussian_filter(good.astype(float), 12)
fill = np.dstack([nd.gaussian_filter(col[..., c] * good, 12) for c in range(3)]) / np.maximum(wgt, 1e-3)[..., None]
far = nd.gaussian_filter(good.astype(float), 60)
fill2 = np.dstack([nd.gaussian_filter(col[..., c] * good, 60) for c in range(3)]) / np.maximum(far, 1e-3)[..., None]
fill = np.where((wgt > 0.02)[..., None], fill, fill2)
lc = np.where(good[..., None], col, fill)
lc = lc * 1.12 + 6
landrgb = np.clip(lc * shade[..., None], 0, 255)

# --- sea: bathymetric tint (continental shelf lighter) ---
depth = np.clip(-dem, 0, 5500)
t = np.sqrt(depth / 5500)[..., None]
shallow = np.array([38, 96, 126.0]); deep = np.array([5, 16, 38.0])
sea = shallow * (1 - t) + deep * t
seashade = np.clip(0.85 + (shade - 1) * 0.25, 0.7, 1.15)[..., None]
sea = sea * seashade
base = sea * (1 - m[..., None]) + landrgb * m[..., None]
Image.fromarray(base.astype(np.uint8)).save(os.path.join(IMG, 's16_15_map_basemap.jpg'), quality=88)

rng = np.random.default_rng(16)
def noise(scale, amp):
    return nd.gaussian_filter(rng.standard_normal((H, W)), scale) * amp

# --- parchment fills (WA warm ochre, SA pale), weathered, burnt toward the coast ---
tone = 0.5 + noise(40, 9) + noise(12, 4) + noise(3, 1.2)
fib = nd.gaussian_filter(rng.standard_normal((H, W)), (1.2, 10)) * 2.0
tone = np.clip(tone + fib * 0.35, 0, 1)
dist = nd.distance_transform_edt(land)
burn = np.clip(1 - dist / 34.0, 0, 1) ** 1.6
def parch(sel, base_c, dark_c, name):
    k = np.clip(0.28 * (1 - tone) + 0.6 * burn, 0, 1)[..., None]
    rgb = np.array(base_c, float) * (1 - k) + np.array(dark_c, float) * k
    edge = nd.gaussian_filter(sel.astype(float), 0.8)
    a = m * edge * np.clip(0.34 + 0.22 * burn + noise(20, 0.6) * 0.1, 0.22, 0.62)
    Image.fromarray(np.dstack([rgb, a[..., None] * 255]).astype(np.uint8), 'RGBA').save(os.path.join(IMG, name), optimize=True)
wa = LONS < BORDER
parch(wa, [238, 208, 150], [128, 76, 34], 's16_16_map_parch_wa.png')
parch(~wa, [240, 226, 190], [120, 92, 52], 's16_17_map_parch_sa.png')

# --- shadow + thick white outer glow on the coast ---
outside = 1 - m
shadow = nd.shift(nd.gaussian_filter(m, 14), (16, 9), order=1) * outside * 0.7
core = nd.gaussian_filter(nd.binary_dilation(land, iterations=9).astype(float), 1.2)
halo = nd.gaussian_filter(nd.binary_dilation(land, iterations=18).astype(float), 10)
glow = np.clip(core * 0.95 + halo * 0.5, 0, 1) * outside
ga = np.clip(glow + shadow * (1 - glow), 0, 1)
white = glow / np.maximum(ga, 1e-6)
Image.fromarray(np.dstack([np.dstack([white * 255] * 3), ga * 255]).astype(np.uint8), 'RGBA').save(
    os.path.join(IMG, 's16_18_map_glow.png'), optimize=True)

# --- WA–SA border glow (on land only) ---
bx = (BORDER - LON0) * PPX
dx = np.abs(np.arange(W) - bx)[None, :]
line = np.clip(1.3 - dx / 4.0, 0, 1) + 0.55 * np.exp(-(dx / 16.0) ** 2)
bl = np.clip(line * m, 0, 1)
Image.fromarray(np.dstack([np.full((H, W, 3), 255, np.uint8), (bl * 255).astype(np.uint8)]), 'RGBA').save(
    os.path.join(IMG, 's16_19_map_border_glow.png'), optimize=True)

# coastline latitude per longitude (for checking pin placement)
meta = {'lon0': LON0, 'lat0': LAT0, 'ppx': PPX, 'ppy': PPY, 'w': W, 'h': H}
json.dump(meta, open(os.path.join(HERE, 'map-meta.json'), 'w'), indent=1)
np.save('/tmp/s16-land.npy', land)
print('map', W, H)
