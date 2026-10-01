#!/usr/bin/env python3
"""
s26 Mary Bryant — satellite basemap builder (GeoGlobeTales look, no blown white relief).

Inputs (fetched once into a scratch dir, not committed):
  * NASA Blue Marble Next Generation colour (bmng.jpg, 5400x2700, public domain)
    — shipped in the `basemap-data` wheel on PyPI (matplotlib basemap).
  * Tilezen / Mapzen "terrarium" elevation + bathymetry tiles (AWS Open Data,
    s3://elevation-tiles-prod) — SRTM / ETOPO1 / GMTED / GEBCO derived.
  * Natural Earth 1:10m land + minor islands (public domain) for crisp land masks.

Output: Web-Mercator JPEG layers in shorts/s26-mary-bryant/images/ + basemap.json
with each layer's normalised Mercator bounds (u = x / world, v = y / world).

Look locks: rich natural land colour from BMNG, deep navy ocean with subtle
bathymetry, soft multi-directional relief with a highlight knee so ridges and
peaks never blow to white.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SP = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sp'
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IMG = os.path.join(EP, 'images')
Image.MAX_IMAGE_PIXELS = None

# ---------- helpers -------------------------------------------------------
def u_of(lon): return (lon + 180.0) / 360.0
def v_of(lat):
    r = math.radians(lat)
    return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2
def lat_of_v(v): return np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * v))))

def load_tiles(z, x0, x1, y0, y1):
    W = (x1 - x0 + 1) * 256; H = (y1 - y0 + 1) * 256
    el = np.zeros((H, W), np.float32)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            f = f'{SP}/tiles/{z}_{x}_{y}.png'
            a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
            el[(y - y0) * 256:(y - y0 + 1) * 256, (x - x0) * 256:(x - x0 + 1) * 256] = \
                a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    return el

def tile_range(z, lon0, lon1, lat0, lat1):
    n = 2 ** z
    return (int(u_of(lon0) * n), int(u_of(lon1) * n), int(v_of(lat0) * n), int(v_of(lat1) * n))

# Natural Earth land polygons (lon/lat rings)
def land_rings():
    rings = []
    for f in ('ne_10m_land', 'ne_10m_minor_islands'):
        g = json.load(open(f'{SP}/ne/{f}.geojson'))
        for ft in g['features']:
            geom = ft['geometry']
            polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
            for p in polys:
                rings.append((np.array(p[0]), [np.array(h) for h in p[1:]]))
    return rings
RINGS = land_rings()

def raster_mask(W, H, to_px, bbox):
    """Rasterise NE land into a W×H grid. to_px maps (lon,lat arrays)->(x,y)."""
    lon0, lon1, lat0, lat1 = bbox
    img = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(img)
    for outer, holes in RINGS:
        if outer[:, 0].max() < lon0 - 2 or outer[:, 0].min() > lon1 + 2: continue
        if outer[:, 1].max() < lat1 - 2 or outer[:, 1].min() > lat0 + 2: continue
        x, y = to_px(outer[:, 0], outer[:, 1])
        d.polygon(list(zip(x.tolist(), y.tolist())), fill=255)
        for h in holes:
            x, y = to_px(h[:, 0], h[:, 1])
            d.polygon(list(zip(x.tolist(), y.tolist())), fill=0)
    return np.asarray(img).astype(np.float32) / 255.0

# ---------- BMNG colour, ocean-filled so coasts never bleed blue ----------
print('bmng…')
bm = np.asarray(Image.open(f'{SP}/mpl_toolkits/basemap_data/bmng.jpg').convert('RGB')).astype(np.float32) / 255
BH, BW = bm.shape[:2]
bm_land = raster_mask(BW, BH, lambda lo, la: ((lo + 180) / 360 * BW, (90 - la) / 180 * BH), (-180, 180, 90, -90))
_, (iy, ix) = ndimage.distance_transform_edt(bm_land < 0.5, return_indices=True)
bm_fill = bm[iy, ix]
# gentle colour grade: richer greens/browns, lift shadows, keep highlights soft
lum = bm_fill.mean(-1, keepdims=True)
bm_fill = np.clip(lum + (bm_fill - lum) * 1.35, 0, 1)
bm_fill = np.power(bm_fill, 0.92)
# snow / ice / salt pans: compress near-white so nothing reads blown-out
bl = bm_fill.mean(-1, keepdims=True)
k = np.clip((bl - 0.55) / 0.35, 0, 1)
bm_fill = bm_fill * (1 - 0.62 * k) + np.array([0.46, 0.52, 0.60]) * 0.62 * k * bl
bm_fill = ndimage.gaussian_filter(bm_fill, sigma=(0.6, 0.6, 0))

def sample_bm(lon, lat):
    px = (lon + 180) / 360 * BW - 0.5
    py = (90 - lat) / 180 * BH - 0.5
    out = np.empty(lon.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = ndimage.map_coordinates(bm_fill[..., c], [py, px], order=1, mode='wrap')
    return out

# ---------- shading -------------------------------------------------------
def hillshade(el, m_per_px, zf=1.0):
    gy, gx = np.gradient(el)
    gx = gx / m_per_px * zf; gy = gy / m_per_px * zf
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    tot = np.zeros_like(el)
    # multi-directional, NW-weighted, moderate sun altitude
    for az, w in ((315, 0.5), (270, 0.2), (0, 0.2), (225, 0.1)):
        a = math.radians(az); alt = math.radians(42)
        tot += w * (math.sin(alt) * np.cos(slope) + math.cos(alt) * np.sin(slope) * np.cos(a - aspect - math.pi / 2))
    flat = math.sin(math.radians(42))
    return tot - flat  # 0 on flat ground, ± on slopes

def soft_knee(x, knee=0.78, top=0.9):
    """Compress highlights above `knee` so nothing reaches white."""
    over = np.maximum(x - knee, 0)
    return np.where(x > knee, knee + (top - knee) * (1 - np.exp(-over / (top - knee))), x)

OCEAN = [  # depth (m) → colour, deep navy with subtle shelf
    (0, (0.15, 0.42, 0.50)), (10, (0.10, 0.34, 0.46)), (35, (0.07, 0.25, 0.40)),
    (110, (0.050, 0.185, 0.335)), (400, (0.038, 0.14, 0.28)), (1500, (0.030, 0.105, 0.235)),
    (4000, (0.022, 0.075, 0.185)), (8000, (0.016, 0.055, 0.15)),
]
def ocean_colour(depth):
    d = np.clip(depth, 0, 8000)
    xs = np.array([o[0] for o in OCEAN], np.float32)
    lx = np.log1p(d); lxs = np.log1p(xs)
    out = np.empty(d.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(lx, lxs, [o[1][c] for o in OCEAN])
    return out

def build(name, z, lon0, lon1, lat0, lat1, zf=1.0, relief=0.55, max_w=None, synth=False, q=88, land_from_elev=False, feather=0.0):
    x0, x1, y0, y1 = tile_range(z, lon0, lon1, lat0, lat1)
    el = load_tiles(z, x0, x1, y0, y1)
    n = 2 ** z * 256
    H, W = el.shape
    # crop to requested bounds
    cx0 = int(u_of(lon0) * n) - x0 * 256; cx1 = int(u_of(lon1) * n) - x0 * 256
    cy0 = int(v_of(lat0) * n) - y0 * 256; cy1 = int(v_of(lat1) * n) - y0 * 256
    el = el[cy0:cy1, cx0:cx1]
    H, W = el.shape
    gx = (x0 * 256 + cx0 + np.arange(W) + 0.5) / n
    gy = (y0 * 256 + cy0 + np.arange(H) + 0.5) / n
    lon = gx * 360 - 180
    lat = lat_of_v(gy)
    LON, LAT = np.meshgrid(lon, lat)
    print(name, W, H)
    # metres per pixel (varies with latitude in Mercator)
    mpp = 40075016.0 / n * np.cos(np.radians(LAT))
    el_s = ndimage.gaussian_filter(el, 0.7)
    hs = hillshade(el_s, mpp, zf)
    if land_from_elev:
        land = (ndimage.gaussian_filter(el, 0.8) > 0.8).astype(np.float32)
    else:
        def to_px(lo, la):
            u = (np.asarray(lo) + 180) / 360
            r = np.radians(np.clip(la, -85, 85))
            v = (1 - np.log(np.tan(r) + 1 / np.cos(r)) / np.pi) / 2
            return u * n - (x0 * 256 + cx0), v * n - (y0 * 256 + cy0)
        land = raster_mask(W, H, to_px, (lon0, lon1, lat0, lat1))
    land = ndimage.gaussian_filter(land, 0.6)
    # ---- land
    col = sample_bm(LON, LAT)
    if synth:
        # close-up: BMNG is ~9 km/px, so add plausible vegetated sandstone texture by slope/elev
        rng = np.random.default_rng(7)
        nz = ndimage.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 2.2)
        nz2 = ndimage.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 9)
        nz = nz / nz.std() * 0.5 + nz2 / nz2.std() * 0.5
        green = np.array([0.20, 0.33, 0.17]); olive = np.array([0.36, 0.39, 0.22]); sand = np.array([0.62, 0.55, 0.40])
        t = np.clip(0.5 + 0.35 * nz, 0, 1)[..., None]
        base = green * (1 - t) + olive * t
        # sandy foreshore near water
        dist = ndimage.distance_transform_edt(land > 0.5)
        beach = np.clip(1 - dist / 3.0, 0, 1)[..., None] * 0.6
        base = base * (1 - beach) + sand * beach
        col = base * 0.5 + col * 0.5
    # fine land grain so close zooms never look like a blurred photo
    rng2 = np.random.default_rng(11)
    g1 = ndimage.gaussian_filter(rng2.standard_normal((H, W)).astype(np.float32), 1.0)
    g2 = ndimage.gaussian_filter(rng2.standard_normal((H, W)).astype(np.float32), 4.0)
    grain_l = 0.6 * g1 / (g1.std() + 1e-6) + 0.4 * g2 / (g2.std() + 1e-6)
    col = col * (1 + 0.045 * grain_l[..., None])
    shade = 1 + relief * hs[..., None] * 1.6
    land_rgb = col * np.clip(shade, 0.55, 1.18)
    # elevation: slight warm/dry tint on high ground, never white
    land_rgb = soft_knee(land_rgb, 0.72, 0.86)
    # ---- ocean
    depth = np.maximum(-ndimage.median_filter(el, 3), 0)  # median kills single-row tile seams
    if land_from_elev:  # close-up tiles carry little near-shore bathymetry: deepen with distance offshore
        dist_km = ndimage.distance_transform_edt(land < 0.5) * mpp / 1000
        depth = np.maximum(depth, np.minimum(8 + dist_km * 9, 140))
    oc = ocean_colour(depth)
    bhs = hillshade(ndimage.gaussian_filter(el, 3.0), mpp, 1.0)
    oc = oc * np.clip(1 + 0.25 * bhs[..., None], 0.8, 1.15)
    # tiny dither/texture in deep water so it isn't flat
    rng = np.random.default_rng(3)
    grain = ndimage.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.2)
    oc = oc * (1 + 0.03 * grain[..., None] / (grain.std() + 1e-6))
    a = land[..., None]
    rgb = land_rgb * a + oc * (1 - a)
    rgb = np.clip(rgb, 0, 1)
    img = Image.fromarray((rgb * 255 + 0.5).astype(np.uint8))
    if max_w and W > max_w:
        img = img.resize((max_w, int(H * max_w / W)), Image.LANCZOS)
    if feather:
        # detail layers: WebP with a feathered alpha border so they melt into the layer below
        fw = max(8, int(min(img.width, img.height) * feather))
        yy, xx = np.mgrid[0:img.height, 0:img.width]
        dx = np.minimum(xx, img.width - 1 - xx) / fw; dy = np.minimum(yy, img.height - 1 - yy) / fw
        a = np.clip(np.minimum(dx, dy), 0, 1); a = a * a * (3 - 2 * a)
        img = img.convert('RGBA'); img.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
        fname = f'map-{name}.webp'
        img.save(f'{IMG}/{fname}', quality=q, method=5)
    else:
        fname = f'map-{name}.jpg'
        img.save(f'{IMG}/{fname}', quality=q, optimize=True, progressive=True)
    out = f'{IMG}/{fname}'
    b = dict(file=fname, w=img.width, h=img.height,
             u0=float((x0 * 256 + cx0) / n), v0=float((y0 * 256 + cy0) / n),
             u1=float((x0 * 256 + cx0 + W) / n), v1=float((y0 * 256 + cy0 + H) / n))
    print(' ->', out, os.path.getsize(out) // 1024, 'KB', b)
    return b

os.makedirs(IMG, exist_ok=True)
layers = {}
layers['world'] = build('world', 5, -180, 179.99, 74, -68, zf=1.4, relief=0.45, max_w=6144, q=86)
layers['region'] = build('region', 7, 100, 163, 8, -46, zf=2.6, relief=0.8, q=86, max_w=4900, feather=0.06)
layers['uk'] = build('uk', 7, -13, 5, 59, 47, zf=2.6, relief=0.8, q=88, feather=0.08)
layers['torres'] = build('torres', 9, 140.2, 145.8, -8.7, -13.3, zf=2.2, relief=0.75, q=88, feather=0.1)
layers['kupang'] = build('kupang', 10, 122.95, 124.75, -9.45, -10.85, zf=1.8, relief=0.7, q=88, feather=0.12)
layers['sydney'] = build('sydney', 11, 150.6, 151.7, -33.3, -34.2, zf=1.5, relief=0.55, synth=True, q=88, land_from_elev=True, feather=0.12)
json.dump(layers, open(f'{EP}/render/basemap.json', 'w'), indent=1)
print('ok')
