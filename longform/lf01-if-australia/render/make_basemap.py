"""lf01 parchment terrain war map, built from open data only.

Colour  : NASA Blue Marble Next Generation (public domain; 5400x2700 copy from the PyPI package
          `basemap-data`), desaturated and pulled into a parchment / ochre war-map palette.
Relief  : AWS Open Data Terrain Tiles (Terrarium; SRTM / GMTED / ETOPO1), soft multi-direction
          hillshade with a capped highlight shoulder: NO blown white relief, mid contrast.
Coast   : Natural Earth 10m land + minor islands (public domain), 3x supersampled mask.
Ocean   : muted blue-grey parchment with gentle bathymetry and old-map coastal ripple lines.

Writes render/assets/<layer>.jpg (base) or .webp (detail layers, feathered alpha) + layers.json.
Usage: TILES=... BMNG=... NE=... python3 make_basemap.py [layer ...]
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from layers import LAYERS, ORDER, LON0, LAT0, COS

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
TILES = os.environ.get('TILES', '/tmp/claude-0/geo/tiles')
BMNG = os.environ.get('BMNG', '/tmp/claude-0/geo/bmx/mpl_toolkits/basemap_data/bmng.jpg')
NE = os.environ.get('NE', '/tmp/claude-0/geo/ne')
OUT = os.path.join(HERE, 'assets')
os.makedirs(OUT, exist_ok=True)

PAPER = np.array([0.905, 0.855, 0.735], np.float32)
OCEAN_SHALLOW = np.array([0.675, 0.735, 0.705], np.float32)
OCEAN_DEEP = np.array([0.545, 0.625, 0.625], np.float32)
INK = np.array([0.33, 0.25, 0.17], np.float32)


# ------------------------------------------------------------------ elevation
def _tx(lon, z):
    return (lon + 180.0) / 360.0 * 2 ** z


def _ty(lat, z):
    r = np.radians(lat)
    return (1 - np.log(np.tan(r) + 1 / np.cos(r)) / math.pi) / 2 * 2 ** z


def elevation(z, lon, lat):
    """lon may run past 180 (Pacific); tile x is wrapped when read."""
    gx = _tx(lon, z) * 256 - 0.5
    gy = _ty(lat, z) * 256 - 0.5
    x0, x1 = int(gx.min() // 256), int(gx.max() // 256)
    y0, y1 = int(gy.min() // 256), int(gy.max() // 256)
    mos = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), np.float32)
    n = 2 ** z
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            p = os.path.join(TILES, f'{z}_{tx % n}_{ty}.png')
            a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
            mos[(ty - y0) * 256:(ty - y0 + 1) * 256, (tx - x0) * 256:(tx - x0 + 1) * 256] = \
                a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    return ndi.map_coordinates(mos, [gy - y0 * 256, gx - x0 * 256], order=1, mode='nearest')


# ------------------------------------------------------------------ Blue Marble colour (ocean in-painted)
_bm = None


def bm_colour(lon, lat):
    global _bm
    if _bm is None:
        im = np.asarray(Image.open(BMNG).convert('RGB')).astype(np.float32) / 255
        im = np.concatenate([im, im], axis=1)  # wrap: lon -180..540
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        water = (b > r + 0.04) & (b > g - 0.02)
        water = ndi.binary_opening(water, iterations=1)
        idx = ndi.distance_transform_edt(water, return_distances=False, return_indices=True)
        land = im[idx[0], idx[1]]
        _bm = ndi.gaussian_filter(land, (0.7, 0.7, 0))
    H, W2 = _bm.shape[:2]
    W = W2 // 2
    px = ((lon + 180) % 360) / 360 * W - 0.5
    py = (90 - lat) / 180 * H - 0.5
    return np.stack([ndi.map_coordinates(_bm[..., k], [py, px], order=3, mode='nearest') for k in range(3)], -1)


# ------------------------------------------------------------------ geo-anchored noise
RNG = np.random.default_rng(1942)
NZ = RNG.standard_normal((512, 512)).astype(np.float32)


def fbm(lon, lat, ppd, base_f, octs, seed):
    s = np.zeros_like(lon)
    amp = 1.0
    tot = 0.0
    for i in range(octs):
        f = base_f * 2 ** i
        if ppd / f >= 3.0:
            o = (seed + i) * 37.7
            s += amp * ndi.map_coordinates(NZ, [lat * f + o, lon * f * COS + o * 0.6], order=3, mode='wrap')
        tot += amp
        amp *= 0.55
    return s / tot


# ------------------------------------------------------------------ land mask
_polys = None


def land_polys():
    global _polys
    if _polys is None:
        _polys = []
        for fn in ('ne_10m_land.geojson', 'ne_10m_minor_islands.geojson'):
            for ft in json.load(open(os.path.join(NE, fn)))['features']:
                g = ft['geometry']
                for poly in (g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]):
                    rings = [np.asarray(r, np.float64) for r in poly]
                    if rings[0][:, 0].max() < -15:
                        rings = [r + [360, 0] for r in rings]
                    _polys.append(rings)
    return _polys


def land_mask(lon0, lon1, lat0, lat1, W, H, ss=3):
    im = Image.new('L', (W * ss, H * ss), 0)
    d = ImageDraw.Draw(im)
    sx = W * ss / (lon1 - lon0)
    sy = H * ss / (lat0 - lat1)
    for rings in land_polys():
        o = rings[0]
        if o[:, 0].max() < lon0 - 1 or o[:, 0].min() > lon1 + 1 or o[:, 1].min() > lat0 + 1 or o[:, 1].max() < lat1 - 1:
            continue
        for k, r in enumerate(rings):
            pts = list(zip((r[:, 0] - lon0) * sx, (lat0 - r[:, 1]) * sy))
            if len(pts) > 2:
                d.polygon(pts, fill=255 if k == 0 else 0)
    m = np.asarray(im, np.float32) / 255
    return m.reshape(H, ss, W, ss).mean(axis=(1, 3))


# ------------------------------------------------------------------ build one layer
def build(name):
    lon0, lon1, lat0, lat1, ppd, z = LAYERS[name]
    W = int(round((lon1 - lon0) * COS * ppd))
    H = int(round((lat0 - lat1) * ppd))
    print(name, W, 'x', H, flush=True)
    lon = lon0 + (np.arange(W, dtype=np.float32) + 0.5) / W * (lon1 - lon0)
    lat = lat0 - (np.arange(H, dtype=np.float32) + 0.5) / H * (lat0 - lat1)
    LON, LAT = np.meshgrid(lon, lat)

    el = elevation(z, LON, LAT).astype(np.float32)
    land = land_mask(lon0, lon1, lat0, lat1, W, H)

    # ---- hillshade (physical spacing, soft, multi-direction)
    e = ndi.gaussian_filter(np.maximum(el, 0), 0.8)
    dy_m = 111320.0 / ppd
    dx_m = 111320.0 * np.cos(np.radians(LAT)) / (ppd * COS)
    gy, gx = np.gradient(e)
    zf = 2.2 * (ppd / 80.0) ** -0.35
    sx = gx / dx_m * zf
    sy = gy / dy_m * zf
    norm = np.sqrt(sx * sx + sy * sy + 1)
    shade = np.zeros_like(e)
    for az, w in ((315, 0.6), (270, 0.25), (0, 0.15)):
        a = math.radians(az)
        alt = math.radians(42)
        lx, ly, lz = math.cos(alt) * math.sin(a), -math.cos(alt) * math.cos(a), math.sin(alt)
        shade += w * ((-sx * lx - sy * ly + lz) / norm)
    flat = math.sin(math.radians(42))
    sh = shade - flat  # 0 on flat ground
    # soft mid-contrast: shadows deepen, highlights capped low (no white glare)
    relief = np.where(sh < 0, 1 + 0.80 * np.tanh(sh * 1.6), 1 + 0.08 * np.tanh(sh * 2.0))

    # ---- land colour: Blue Marble -> desaturated -> parchment ochre
    c = bm_colour(LON, LAT)
    lum = (c * [0.3, 0.55, 0.15]).sum(-1, keepdims=True)
    c = lum + (c - lum) * 0.62
    c = np.clip((c - 0.03) * 1.75, 0, 1)
    # soft luminance shoulder: salt pans / bright deserts never glare
    L = (c * [0.3, 0.55, 0.15]).sum(-1, keepdims=True)
    Lc = np.where(L < 0.5, L, 0.5 + (L - 0.5) * 0.3)
    c = c * (Lc / np.maximum(L, 1e-4))
    c = c * [1.12, 0.97, 0.74]
    landc = PAPER * 0.50 + np.clip(c, 0, 1) * 0.50
    # gentle elevation browning
    hi = np.clip(el / 2500.0, 0, 1)[..., None]
    landc = landc * (1 - 0.18 * hi) + np.array([0.55, 0.42, 0.30]) * 0.18 * hi
    mott = fbm(LON, LAT, ppd, 0.8, 5, 3)[..., None]
    landc = landc * (1 + 0.035 * mott)
    landc = landc * relief[..., None]
    # highlight shoulder: never above parchment white
    landc = np.minimum(landc, 0.90 - 0.10 * np.exp(-np.maximum(0, 0.90 - landc) * 8))

    # ---- ocean: depth tint + ripple lines
    depth = np.clip(-el / 5000.0, 0, 1)[..., None]
    oc = OCEAN_SHALLOW * (1 - depth) + OCEAN_DEEP * depth
    oc = oc * (1 + 0.03 * fbm(LON, LAT, ppd, 0.5, 4, 9)[..., None])
    hard = land > 0.5
    lab, nl = ndi.label(hard)
    if nl:
        sizes = ndi.sum(hard, lab, index=np.arange(1, nl + 1)) / (ppd * ppd)  # deg^2
        keep = np.concatenate([[False], sizes > 0.12])
        big = keep[lab]
    else:
        big = hard
    dist = ndi.distance_transform_edt(~big) / ppd  # degrees from (larger) coast
    rip = np.zeros_like(dist)
    for r0, a in ((0.20, 0.13), (0.50, 0.08), (0.95, 0.05)):
        w = max(0.018, 0.9 / ppd)
        rip += a * np.exp(-((dist - r0) / w) ** 2)
    coastglow = 0.10 * np.exp(-dist / 0.12)
    oc = oc * (1 - rip[..., None] * 0.9) * (1 - coastglow[..., None]) + INK * rip[..., None] * 0.25

    a = land[..., None]
    out = oc * (1 - a) + landc * a
    # thin ink coast in raster (vector coast is drawn crisp on top in scenes.js)
    edge = np.clip(ndi.gaussian_filter(land, 0.7) * (1 - ndi.gaussian_filter(land, 0.7)) * 4, 0, 1)
    out = out * (1 - 0.35 * edge[..., None]) + INK * 0.35 * edge[..., None]
    out = np.clip(out, 0, 1)
    rgb = (out * 255 + 0.5).astype(np.uint8)

    rect = {'x': (lon0 - LON0) * COS, 'y': LAT0 - lat0, 'w': (lon1 - lon0) * COS, 'h': lat0 - lat1}
    if name == 'base':
        Image.fromarray(rgb).save(os.path.join(OUT, 'base.jpg'), quality=90, subsampling=0)
        rect['file'] = 'base.jpg'
    else:
        fw = max(8, int(min(W, H) * 0.08))
        ax = np.minimum(np.arange(W), np.arange(W)[::-1]) / fw
        ay = np.minimum(np.arange(H), np.arange(H)[::-1]) / fw
        al = np.clip(np.minimum(ay[:, None], ax[None, :]), 0, 1)
        al = al * al * (3 - 2 * al)
        rgba = np.dstack([rgb, (al * 255).astype(np.uint8)])
        Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, name + '.webp'), quality=88, method=4)
        rect['file'] = name + '.webp'
    rect['ppd'] = ppd
    return rect


if __name__ == '__main__':
    names = sys.argv[1:] or ORDER
    meta_p = os.path.join(OUT, 'layers.json')
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for n in names:
        meta[n] = build(n)
        json.dump({k: meta[k] for k in ORDER if k in meta}, open(meta_p, 'w'), indent=1)
    print('ok')
