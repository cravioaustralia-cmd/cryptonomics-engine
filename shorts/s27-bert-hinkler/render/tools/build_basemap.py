#!/usr/bin/env python3
"""
s27 Bert Hinkler — satellite basemap builder (layers + space-dive globe) (GeoGlobeTales look, no blown white relief).

Inputs (fetched once into a scratch dir, not committed):
  * NASA Blue Marble Next Generation colour (bmng.jpg, 5400x2700, public domain)
    — shipped in the `basemap-data` wheel on PyPI (matplotlib basemap).
  * Tilezen / Mapzen "terrarium" elevation + bathymetry tiles (AWS Open Data,
    s3://elevation-tiles-prod) — SRTM / ETOPO1 / GMTED / GEBCO derived.
  * Natural Earth 1:10m land + minor islands (public domain) for crisp land masks.

Output: Web-Mercator layers + orthographic globe in shorts/s27-bert-hinkler/images/ + basemap.json
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
RIVERS = []
for f in ('ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe'):
    for ft in json.load(open(f'{SP}/ne/{f}.geojson'))['features']:
        g = ft['geometry']
        if not g: continue
        for ln in (g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]):
            RIVERS.append(np.array(ln, float))
CITIES = [(-0.12, 51.5, 22), (11.25, 43.77, 5), (11.88, 43.46, 2.5), (130.85, -12.43, 4), (152.35, -24.87, 3.5)]

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
bm_fill = bm_fill * (1 - 0.74 * k) + np.array([0.42, 0.48, 0.56]) * 0.74 * k * bl
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
    sys.stdout.flush()
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
    # towns: soft warm-grey urban tint with block noise (London, Florence, Arezzo, Darwin, Bundaberg)
    if synth:
        rng3 = np.random.default_rng(5)
        blk = ndimage.gaussian_filter(rng3.standard_normal((H, W)).astype(np.float32), 1.4)
        blk = blk / (blk.std() + 1e-6)
        for clon, clat, rkm in CITIES:
            dkm = np.hypot((LON - clon) * 111.3 * np.cos(np.radians(clat)), (LAT - clat) * 111.3)
            w = np.clip(1 - dkm / rkm, 0, 1) ** 0.7
            w = (w * np.clip(0.75 + 0.35 * blk, 0, 1))[..., None]
            land_rgb = land_rgb * (1 - 0.7 * w) + np.array([0.47, 0.44, 0.41]) * 0.7 * w
    # rivers (Natural Earth centrelines), drawn on detail layers only
    if (feather and z >= 7) or synth:
        rimg = Image.new('L', (W, H), 0); rd = ImageDraw.Draw(rimg)
        rw = max(1, int(round(2 ** (z - 7) * 0.9)))
        for ln in RIVERS:
            if ln[:, 0].max() < lon0 or ln[:, 0].min() > lon1 or ln[:, 1].max() < lat1 or ln[:, 1].min() > lat0: continue
            u = (ln[:, 0] + 180) / 360; r = np.radians(ln[:, 1])
            v = (1 - np.log(np.tan(r) + 1 / np.cos(r)) / np.pi) / 2
            pts = list(zip((u * n - (x0 * 256 + cx0)).tolist(), (v * n - (y0 * 256 + cy0)).tolist()))
            rd.line(pts, fill=255, width=rw, joint='curve')
        rm = ndimage.gaussian_filter(np.asarray(rimg).astype(np.float32) / 255, 0.6)[..., None] * 0.85
        land_rgb = land_rgb * (1 - rm) + np.array([0.09, 0.27, 0.40]) * rm
    # elevation: slight warm/dry tint on high ground, never white
    land_rgb = soft_knee(land_rgb, 0.72, 0.86)
    # ---- ocean
    depth = np.maximum(-ndimage.median_filter(el, 3), 0)  # median kills single-row tile seams
    if land_from_elev or synth:  # close-up tiles carry little near-shore bathymetry: deepen with distance offshore
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


sys.path.insert(0, os.path.dirname(__file__))
from layers import LAYERS
os.makedirs(IMG, exist_ok=True)
only = sys.argv[2:]  # optional subset of layer names (or 'globe')
bm_json = f'{EP}/render/basemap.json'
layers = json.load(open(bm_json)) if os.path.exists(bm_json) else {}
for name, (z, lon0, lon1, la0, la1, o) in LAYERS.items():
    if only and name not in only: continue
    layers[name] = build(name, z, lon0, lon1, la0, la1, **o)
    json.dump(layers, open(bm_json, 'w'), indent=1)

# ---------- orthographic globe for the frame-1 space dive -------------------
GLOBES = {'globe': (14.0, 39.0),   # space dive: London up-left, the route heads SE over the limb
          'globe-over': (85.0, 10.0)}  # overview: London, Darwin, Florence and Bundaberg all on the near side
for gname, GLOBE_C in GLOBES.items():
  if only and gname not in only: continue
  if True:
    print('globe…')
    # equirect elevation from z4 terrarium mosaic (Mercator -> lat/lon resample)
    el4 = load_tiles(4, 0, 15, 0, 15)            # 4096 x 4096 mercator
    EW, EH = 4096, 2048
    lon_e = (np.arange(EW) + 0.5) / EW * 360 - 180
    lat_e = 90 - (np.arange(EH) + 0.5) / EH * 180
    vv = np.array([v_of(float(np.clip(l, -85, 85))) for l in lat_e]) * 4096
    uu = (lon_e + 180) / 360 * 4096
    VV, UU = np.meshgrid(vv, uu, indexing='ij')
    el_e = ndimage.map_coordinates(el4, [VV - 0.5, UU - 0.5], order=1, mode='nearest')
    mpp_e = 40075016.0 / EW * np.cos(np.radians(np.clip(lat_e, -85, 85)))[:, None]
    hs_e = hillshade(ndimage.gaussian_filter(el_e, 0.8), mpp_e, 1.0)
    land_e = raster_mask(EW, EH, lambda lo, la: ((lo + 180) / 360 * EW, (90 - la) / 180 * EH), (-180, 180, 90, -90))
    land_e = ndimage.gaussian_filter(land_e, 0.7)
    D = 2400; R = D / 2
    yy, xx = np.mgrid[0:D, 0:D].astype(np.float32)
    X = (xx + 0.5 - R) / R; Y = (R - yy - 0.5) / R
    rho2 = X * X + Y * Y
    inside = rho2 <= 1
    Z = np.sqrt(np.clip(1 - rho2, 0, 1))
    lam0, phi0 = map(math.radians, GLOBE_C)
    phi = np.arcsin(np.clip(Z * math.sin(phi0) + Y * math.cos(phi0), -1, 1))
    lam = lam0 + np.arctan2(X, Z * math.cos(phi0) - Y * math.sin(phi0))
    LON = (np.degrees(lam) + 540) % 360 - 180; LAT = np.degrees(phi)
    px = (LON + 180) / 360 * EW - 0.5; py = (90 - LAT) / 180 * EH - 0.5
    smp = lambda a: ndimage.map_coordinates(a, [py, px], order=1, mode='wrap')
    col = sample_bm(LON, LAT)
    a = smp(land_e)[..., None]
    hs = smp(hs_e)[..., None]
    land_rgb = soft_knee(col * np.clip(1 + 0.5 * hs * 1.6, 0.6, 1.15), 0.6, 0.74)
    oc = ocean_colour(np.maximum(-smp(el_e), 0))
    rgb = land_rgb * a + oc * (1 - a)
    # soft sun from the upper left + limb darkening (no hard terminator)
    sun = np.array([-0.55, 0.55, 0.63]); sun /= np.linalg.norm(sun)
    ndl = X * sun[0] + Y * sun[1] + Z * sun[2]
    light = 0.55 + 0.5 * np.clip(ndl, -0.3, 1)
    limb = 0.75 + 0.25 * np.power(Z, 0.5)
    rgb = rgb * (light * limb)[..., None]
    # thin atmospheric haze toward the limb
    haze = np.power(1 - Z, 3)[..., None] * 0.55
    rgb = rgb * (1 - haze) + np.array([0.35, 0.6, 0.95]) * haze
    rgb = np.clip(rgb, 0, 1)
    alpha = np.clip((1 - np.sqrt(rho2)) * R / 1.5, 0, 1)
    img = Image.fromarray(np.dstack([(rgb * 255 + .5).astype(np.uint8), (alpha * 255).astype(np.uint8)]), 'RGBA')
    img.save(f'{IMG}/map-{gname}.webp', quality=90, method=5)
    layers[gname] = dict(file=f'map-{gname}.webp', w=D, h=D, lon0=GLOBE_C[0], lat0=GLOBE_C[1], ortho=True)
    json.dump(layers, open(bm_json, 'w'), indent=1)
    print(' ->', gname, os.path.getsize(f'{IMG}/map-{gname}.webp') // 1024, 'KB')
print('ok')
