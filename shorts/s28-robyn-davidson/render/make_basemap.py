"""s28 basemap builder — GeoGlobeTales-grade satellite canvas, built from open data only.

Colour : NASA Blue Marble Next Generation w/ topography (public domain), the 5400x2700 copy shipped
         in the PyPI package `basemap-data` (mpl_toolkits/basemap_data/bmng.jpg).
Relief : AWS Open Data Terrain Tiles (Terrarium PNG; SRTM / GMTED / ETOPO1 — see images/SOURCES.md).
Coast  : Natural Earth 10m land + minor islands (public domain), rasterised with 3x supersampling.

Projection (shared with scenes.js): equirectangular with standard parallel 25°S
    X = (lon - LON0) * K * cos(25°)      Y = (LAT0 - lat) * K        (K = px per degree latitude)
Every layer is graded by the same functions of (lon, lat, elevation), so the higher-resolution
patches (route corridor, Uluru, Shark Bay) sit seamlessly on the base when feathered in.

Look locks: rich natural land colour, deep navy ocean with subtle bathymetry, soft balanced lighting,
NO blown white relief (highlight shoulder + capped hillshade lift), salt lakes tamed to pale ochre.

Usage:  TILES=/path/to/terrarium/cache BMNG=/path/to/bmng.jpg python3 make_basemap.py
        (fetch tiles first with fetch_tiles.py; the cache is not committed)
"""
import json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
TILES = os.environ.get('TILES', '/tmp/claude-0/tiles')
BMNG = os.environ.get('BMNG', '/tmp/claude-0/bm/mpl_toolkits/basemap_data/bmng.jpg')
NE = os.environ.get('NE', '/tmp/claude-0/ne')  # Natural Earth 10m geojson (public domain)
OUT = os.path.join(HERE, 'assets')
os.makedirs(OUT, exist_ok=True)
COS = math.cos(math.radians(25.0))

# name: (lon0, lon1, lat_top, lat_bottom, K px/deg-lat, terrarium zoom)
LAYERS = {
    'base':     (96.0, 162.0, 6.0, -48.0, 72, 7),
    'corridor': (111.6, 135.9, -20.1, -29.4, 300, 9),
    'uluru':    (130.62, 131.58, -24.97, -25.73, 1500, 11),
    'sharkbay': (112.95, 115.15, -24.65, -27.55, 760, 10),
    'opening':  (128.6, 131.6, -24.2, -26.2, 900, 11),
    'alice':    (133.3, 134.4, -23.3, -24.1, 1000, 11),
    'hamelin':  (113.9, 114.45, -26.2, -26.6, 2400, 12),
}
# draw order (low → high) used by scenes.js
ORDER = ['base', 'corridor', 'sharkbay', 'opening', 'uluru', 'alice', 'hamelin']


# ---------------------------------------------------------------- elevation (terrarium mosaic)
def _tx(lon, z):
    return (lon + 180.0) / 360.0 * 2 ** z


def _ty(lat, z):
    r = np.radians(lat)
    return (1 - np.log(np.tan(r) + 1 / np.cos(r)) / math.pi) / 2 * 2 ** z


def elevation(z, lon, lat):
    gx = _tx(lon, z) * 256 - 0.5
    gy = _ty(lat, z) * 256 - 0.5
    x0, x1 = int(gx.min() // 256), int(gx.max() // 256)
    y0, y1 = int(gy.min() // 256), int(gy.max() // 256)
    mos = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), np.float32)
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            p = os.path.join(TILES, f'{z}_{tx}_{ty}.png')
            if not os.path.exists(p):
                raise SystemExit('missing tile ' + p)
            a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
            mos[(ty - y0) * 256:(ty - y0 + 1) * 256, (tx - x0) * 256:(tx - x0 + 1) * 256] = \
                a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    return ndi.map_coordinates(mos, [gy - y0 * 256, gx - x0 * 256], order=1, mode='nearest')


# ---------------------------------------------------------------- Blue Marble colour
_bm = None


def bm_colour(lon, lat):
    """Bicubic Blue Marble sample with ocean pixels in-painted from the nearest land colour, so the
    coast mask (from the DEM) never picks up blue fringes."""
    global _bm
    if _bm is None:
        im = np.asarray(Image.open(BMNG).convert('RGB')).astype(np.float32) / 255
        H, W = im.shape[:2]
        # crop generously around the region
        cx0, cx1 = int((90 + 180) / 360 * W), int((170 + 180) / 360 * W)
        cy0, cy1 = int((90 - 12) / 180 * H), int((90 + 52) / 180 * H)
        c = im[cy0:cy1, cx0:cx1]
        r, g, b = c[..., 0], c[..., 1], c[..., 2]
        water = (b > r + 0.04) & (b > g - 0.02)
        water = ndi.binary_opening(water, iterations=1)
        idx = ndi.distance_transform_edt(water, return_distances=False, return_indices=True)
        land = c[idx[0], idx[1]]
        land = ndi.gaussian_filter(land, (0.6, 0.6, 0))
        _bm = (land, (~water).astype(np.float32), cx0, cy0, W, H)
    land, isl, cx0, cy0, W, H = _bm
    px = (lon + 180) / 360 * W - 0.5 - cx0
    py = (90 - lat) / 180 * H - 0.5 - cy0
    col = np.stack([ndi.map_coordinates(land[..., k], [py, px], order=3, mode='nearest') for k in range(3)], -1)
    return col, ndi.map_coordinates(isl, [py, px], order=1, mode='nearest')


# ---------------------------------------------------------------- geo-anchored procedural texture
RNG = np.random.default_rng(28)
LAT = RNG.standard_normal((512, 512)).astype(np.float32)
LAT = (LAT - LAT.mean()) / LAT.std()


def vnoise(lon, lat, f, px_per_deg, seed=0):
    """Smooth value noise anchored to geography; octave dropped when finer than ~3 px (no aliasing)."""
    if px_per_deg / f < 3.0:
        return np.zeros_like(lon)
    o = seed * 97.13
    return ndi.map_coordinates(LAT, [lat * f + o, lon * f * COS + o * 0.7], order=3, mode='wrap')


def fbm(lon, lat, ppd, base_f, octs, seed):
    s = np.zeros_like(lon)
    amp, tot = 1.0, 0.0
    for i in range(octs):
        s += amp * vnoise(lon, lat, base_f * 2 ** i, ppd, seed + i)
        tot += amp
        amp *= 0.55
    return s / tot


def dunes(lon, lat, ppd):
    """Linear dune ridges (roughly E–W / WNW–ESE in the western deserts), wavy, stylised ~5.5 km spacing
    so they read at map scale. Returns (height-ish profile, north-lit shading)."""
    lam = 1 / 20.0
    if ppd * lam < 6.0:
        z = np.zeros_like(lon)
        return z, z
    warp = fbm(lon, lat, ppd, 1.2, 3, 50) * 0.10 + fbm(lon, lat, ppd, 6, 2, 60) * 0.02
    ang = math.radians(-9)
    v = -math.sin(ang) * lon * COS + math.cos(ang) * lat + warp
    ph = 2 * math.pi * v / lam
    ridge = (1 - np.abs(np.sin(ph * 0.5))) ** 2.0  # sharp crests, wide swales
    slope = np.sin(ph) * (1 - np.abs(np.sin(ph * 0.5)))  # +: north-facing (lit) flank
    gate = np.clip(fbm(lon, lat, ppd, 9, 2, 70) * 1.5 + 0.55, 0, 1)  # dunes break up / bifurcate
    return (ridge - 0.30) * gate, slope * gate


# ---------------------------------------------------------------- Natural Earth land mask
_ne = None


def ne_mask(lon0, lon1, latT, latB, K, W, H, SS=3):
    global _ne
    from PIL import ImageDraw
    if _ne is None:
        _ne = []
        for f in ('ne_10m_land', 'ne_10m_minor_islands'):
            for ft in json.load(open(os.path.join(NE, f + '.geojson')))['features']:
                g = ft['geometry']
                polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
                for poly in polys:
                    rings = [np.asarray(r, np.float64) for r in poly]
                    ext = rings[0]
                    if ext[:, 0].max() < 90 or ext[:, 0].min() > 175 or ext[:, 1].max() < -55 or ext[:, 1].min() > 15:
                        continue
                    _ne.append(rings)
    im = Image.new('L', (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    for rings in _ne:
        ext = rings[0]
        if ext[:, 0].max() < lon0 - 1 or ext[:, 0].min() > lon1 + 1 or ext[:, 1].max() < latB - 1 or ext[:, 1].min() > latT + 1:
            continue
        for k, r in enumerate(rings):
            # clip coordinates loosely so huge rings stay in a sane pixel range
            x = np.clip((r[:, 0] - lon0) * K * COS * SS, -SS * 50, (W + 50) * SS)
            y = np.clip((latT - r[:, 1]) * K * SS, -SS * 50, (H + 50) * SS)
            d.polygon(list(zip(x.tolist(), y.tolist())), fill=255 if k == 0 else 0)
    im = im.resize((W, H), Image.BOX)
    return np.asarray(im).astype(np.float32) / 255


# ---------------------------------------------------------------- grading
def hillshade(e, ppd_lat, lat, az=315, alt=42, exag=1.0):
    """Lambert shading minus the flat-ground value (0 on flat). Rows run north→south, columns west→east.
    Light from azimuth `az` (degrees clockwise from north), altitude `alt`."""
    d_m = 111320.0 / ppd_lat  # projection keeps squares at 25°S (close enough for shading)
    g_row, g_col = np.gradient(e * exag, d_m, d_m)
    gx, gy = g_col, -g_row  # d/d(east), d/d(north)
    n = np.sqrt(gx * gx + gy * gy + 1)
    azr, altr = math.radians(az), math.radians(alt)
    lx, ly, lz = math.sin(azr) * math.cos(altr), math.cos(azr) * math.cos(altr), math.sin(altr)
    return (-gx * lx - gy * ly + lz) / n - lz


def ocean_colour(depth):
    d = np.clip(depth, 0, 7000)
    t = np.log1p(d / 4.0) / np.log1p(7000 / 4.0)  # 0..1
    stops = [
        (0.00, (0.22, 0.56, 0.62)),  # sun-lit shallows (Shark Bay, Hamelin Pool)
        (0.16, (0.11, 0.35, 0.50)),
        (0.34, (0.065, 0.21, 0.38)),  # shelf
        (0.55, (0.04, 0.13, 0.28)),
        (0.78, (0.03, 0.085, 0.21)),  # deep navy
        (1.00, (0.02, 0.055, 0.15)),
    ]
    out = np.zeros(depth.shape + (3,), np.float32)
    for (t0, c0), (t1, c1) in zip(stops[:-1], stops[1:]):
        m = (t >= t0) & (t <= t1)
        u = ((t - t0) / (t1 - t0))[m][:, None]
        out[m] = np.array(c0) * (1 - u) + np.array(c1) * u
    return out


def soft_shoulder(x, knee=0.58, ceil=0.80):
    """Highlight roll-off: nothing ever reaches white."""
    over = np.maximum(x - knee, 0)
    return np.where(x > knee, knee + (ceil - knee) * (1 - np.exp(-over / (ceil - knee))), x)


def build(name):
    lon0, lon1, latT, latB, K, z = LAYERS[name]
    W = int(round((lon1 - lon0) * K * COS))
    H = int(round((latT - latB) * K))
    print(name, W, 'x', H, 'zoom', z)
    xs = lon0 + (np.arange(W) + 0.5) / (K * COS)
    ys = latT - (np.arange(H) + 0.5) / K
    # whole-layer fields: elevation, NE coast mask, coast distance, smoothed depth
    LON, LATg = np.meshgrid(xs, ys)
    E = elevation(z, LON, LATg).astype(np.float32)
    del LON, LATg
    M = ne_mask(lon0, lon1, latT, latB, K, W, H)
    if K >= 1500:
        # very close views: round off Natural Earth polygon facets into an organic shoreline
        LON, LATg = np.meshgrid(xs, ys)
        wob = fbm(LON, LATg, K, 60, 4, 81) * 0.16
        del LON, LATg
        Mb = ndi.gaussian_filter(M, K * 0.0022) + wob
        M = np.clip((Mb - 0.42) / 0.16, 0, 1).astype(np.float32)
    LAND = M > 0.5
    E = np.where(LAND, np.maximum(E, 1.0), np.minimum(E, -1.0)).astype(np.float32)
    km_px = 111.32 / K
    CD = (ndi.distance_transform_edt(~LAND) * km_px).astype(np.float32)  # km from coast (water side)
    DEP = ndi.gaussian_filter(np.maximum(-E, 0), max(1.5, K * 0.02)).astype(np.float32)
    DEP = np.minimum(DEP, 1.5 + CD * 9.0)  # sunlit coastal shallows grade out from the shore
    rows = []
    STRIP = 700
    for r0 in range(0, H, STRIP):
        pad = 48
        ra, rb = max(0, r0 - pad), min(H, r0 + STRIP + pad)
        lon, lat = np.meshgrid(xs, ys[ra:rb])
        e = E[ra:rb].astype(np.float64)
        col, _ = bm_colour(lon, lat)
        ppd = K
        # --- land grade
        lum = (col * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
        sat = col - lum
        redness = np.clip((col[..., 0] - col[..., 2]) * 3.2, 0, 1)[..., None]
        green = np.clip((col[..., 1] - col[..., 0]) * 6 + 0.25, 0, 1)[..., None]
        g = lum + sat * (1.16 + 0.12 * redness)
        g = g * (1 + np.array([0.04, 0.0, -0.04]) * redness)  # warmer red centre
        g = g * (1 + np.array([-0.03, 0.04, -0.02]) * green)  # richer greens
        # salt pans / bright playas → pale ochre, never white
        bright = np.clip((lum - 0.42) * 4, 0, 1)
        g = g * (1 - 0.35 * bright) + np.array([0.70, 0.52, 0.40]) * 0.35 * bright * lum / 0.55
        # texture (geo-anchored, resolution aware): broad mottling, spinifex patches, fine grain
        tex = (0.045 * fbm(lon, lat, ppd, 3.0, 6, 1) + 0.035 * fbm(lon, lat, ppd, 30, 4, 11)
               + 0.02 * fbm(lon, lat, ppd, 260, 3, 21))[..., None]
        hue = fbm(lon, lat, ppd, 14, 3, 41)[..., None]
        g = g * (1 + tex) * (1 + 0.05 * hue * np.array([0.6, -0.1, -0.9]))
        # dunes, gated to sandy low-relief country
        relief = ndi.gaussian_filter(np.abs(np.gradient(e, axis=0)) + np.abs(np.gradient(e, axis=1)), 2) * K / 111.0
        flat = np.clip(1.6 - relief / 40.0, 0, 1)
        sandy = (redness[..., 0] * np.clip(1 - np.abs(e - 420) / 520, 0, 1) * flat)[..., None]
        dh, dl = dunes(lon, lat, ppd)
        g = g * (1 + sandy * (0.10 * dh[..., None] + 0.17 * dl[..., None]))
        # hillshade: broad + fine, capped lift
        hs_f = hillshade(ndi.gaussian_filter(e, 0.8), K, lat, exag=2.4 if K < 200 else 1.8)
        hs_b = hillshade(ndi.gaussian_filter(e, 5.0), K, lat, exag=4.0)
        shade = 0.6 * hs_f + 0.4 * hs_b
        shade = np.where(shade > 0, 0.11 * np.tanh(shade / 0.07), 0.50 * np.tanh(shade / 0.11))
        # inselbergs (Uluru, Kata Tjuta, range crests): terracotta tint where the ground stands proud
        hrel = e - ndi.gaussian_filter(e, max(4.0, K * 0.03))
        rock = np.clip((hrel - 25) / 80, 0, 1)[..., None] * redness * 0.85
        g = g * (1 - rock) + np.array([0.60, 0.25, 0.12]) * rock * (0.9 + 0.3 * lum / 0.45)
        g = g * (1 + shade[..., None] * (1 + 0.6 * rock))
        g = np.clip(g, 0, None)
        L = (g * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
        Ls = soft_shoulder(L)
        g = g * (Ls / np.maximum(L, 1e-4))
        g = np.clip((g - 0.5) * 1.06 + 0.5, 0, 1) * 0.97  # gentle contrast, a touch below full scale
        # --- ocean
        oc = ocean_colour(DEP[ra:rb])
        eb = ndi.gaussian_filter(np.minimum(e, 0), max(3.0, K * 0.03))
        bhs = hillshade(eb, K, lat, exag=1.0)
        oc = oc * (1 + 0.14 * np.tanh(bhs / 0.05)[..., None])
        oc = oc * (1 + 0.05 * fbm(lon, lat, ppd, 2.0, 4, 31)[..., None] + 0.045 * fbm(lon, lat, ppd, 90, 4, 33)[..., None])
        # --- composite with NE coast + shallow-water halo
        m = M[ra:rb][..., None]
        cd = CD[ra:rb][..., None]
        halo = np.exp(-(cd / 2.2) ** 2) * (1 - m)
        oc = oc + halo * np.array([0.03, 0.06, 0.065])
        # thin tan beach on the land side of the shore (visible only in close views)
        if K >= 600:
            ld = ndi.distance_transform_edt(M[ra:rb] > 0.5) * km_px
            beach = (np.exp(-(ld / 0.09) ** 2) * (M[ra:rb] > 0.5))[..., None]
            g = g * (1 - 0.55 * beach) + np.array([0.66, 0.55, 0.42]) * 0.55 * beach
            oc = oc * (1 + 0.10 * np.exp(-(cd / 0.25) ** 2))
        out = g * m + oc * (1 - m)
        rows.append(out[r0 - ra: r0 - ra + min(STRIP, H - r0)])
        print('  rows', r0, '→', min(H, r0 + STRIP))
    img = np.concatenate(rows, 0)
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(
        os.path.join(OUT, f'map_{name}.jpg'), quality=90, subsampling=0, optimize=True)
    return dict(lon0=lon0, lon1=lon1, latT=latT, latB=latB, K=K, w=W, h=H, src=f'assets/map_{name}.jpg')


if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or list(LAYERS)
    meta_p = os.path.join(OUT, 'map_layers.json')
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for n in names:
        meta[n] = build(n)
    meta = {k: meta[k] for k in ORDER if k in meta}
    json.dump(meta, open(meta_p, 'w'), indent=1)
