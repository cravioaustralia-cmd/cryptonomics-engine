"""s31 basemap builder — GeoGlobeTales-grade satellite canvas for Antarctica, from open data only.

Projection (shared with scenes.js): ORTHOGRAPHIC centred on (LON0, LAT0) = (146 E, 52 S), in kilometres.
    x = R cos(lat) sin(lon - LON0)
    y = R (cos(LAT0) sin(lat) - sin(LAT0) cos(lat) cos(lon - LON0))
    plane X = x (east), plane Y = -y (south is down on screen). R = 6371 km.
George V Land sits ~16 degrees from the centre, so the ice is not stretched the way an equirectangular map
stretches it at 67 S, and the same plane pulls back to Australia for the series master map.

Colour : NASA Blue Marble Next Generation (public domain), 5400x2700 copy in the PyPI package `basemap-data`
         (used for every land mass except Antarctica, which is graded procedurally as ice).
Relief : AWS Open Data Terrain Tiles (Terrarium PNG; SRTM / GMTED / ETOPO1), fetched with fetch_tiles.py.
Coast  : Natural Earth 10m land + minor islands + Antarctic ice shelves (public domain), 3x supersampled.

Ice look locks: pale blue-grey ice, never white; highlight shoulder caps luminance well under 1.0; shadows go
blue, not black; sastrugi streaks along the katabatic wind; glacier flow bands with transverse crevasse
shadow on the Mertz and Ninnis glaciers; smooth flat ice shelves with a lit cliff edge; deep navy ocean with
subtle bathymetry; scattered small bergs near the coast.

Usage: TILES=/tmp/claude-0/tiles NE=/tmp/claude-0/ne BMNG=.../bmng.jpg python3 make_basemap.py [layer ...]
"""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
TILES = os.environ.get('TILES', '/tmp/claude-0/tiles')
NE = os.environ.get('NE', '/tmp/claude-0/ne')
BMNG = os.environ.get('BMNG', '/usr/local/lib/python3.11/dist-packages/mpl_toolkits/basemap_data/bmng.jpg')
OUT = os.path.join(HERE, '..', 'assets')
os.makedirs(OUT, exist_ok=True)

R = 6371.0
LON0, LAT0 = 146.0, -52.0
S0, C0 = math.sin(math.radians(LAT0)), math.cos(math.radians(LAT0))


def fwd(lon, lat):
    lo = np.radians(np.asarray(lon, np.float64) - LON0)
    la = np.radians(np.asarray(lat, np.float64))
    x = R * np.cos(la) * np.sin(lo)
    y = R * (C0 * np.sin(la) - S0 * np.cos(la) * np.cos(lo))
    vis = S0 * np.sin(la) + C0 * np.cos(la) * np.cos(lo)
    return x, -y, vis


def inv(X, Y):
    x, y = X, -Y
    rho = np.sqrt(x * x + y * y)
    c = np.arcsin(np.clip(rho / R, 0, 1))
    sc, cc = np.sin(c), np.cos(c)
    rs = np.where(rho < 1e-9, 1e-9, rho)
    lat = np.degrees(np.arcsin(np.clip(cc * S0 + y * sc * C0 / rs, -1, 1)))
    lon = LON0 + np.degrees(np.arctan2(x * sc, rho * cc * C0 - y * sc * S0))
    lon = (lon + 180) % 360 - 180
    return lon, lat, rho <= R


# name: (bbox in lon/lat used to size the plane rectangle, K px/km, terrarium zoom)
LAYERS = {
    'globe':   (None, 0.30, 4),
    'region':  ((134.0, 160.0, -62.8, -71.8), 2.0, 8),
    'route':   ((140.6, 154.2, -66.15, -69.85), 5.0, 9),
    'denison': ((141.5, 143.9, -66.5, -67.4), 15.0, 10),
    'fall':    ((151.55, 153.05, -68.8, -69.25), 14.0, 10),   # Ninnis's crevasse close-up
    'mcrev':   ((144.35, 145.6, -67.62, -68.05), 14.0, 10),   # Mawson's crevasse close-up (Mertz Glacier)
}
ORDER = ['globe', 'region', 'route', 'denison', 'fall', 'mcrev']


def plane_bbox(name):
    bb = LAYERS[name][0]
    if bb is None:
        return -R, R, -R, R
    lo = np.linspace(bb[0], bb[1], 60)
    la = np.linspace(bb[2], bb[3], 60)
    LO, LA = np.meshgrid(lo, la)
    X, Y, _ = fwd(LO, LA)
    return X.min(), X.max(), Y.min(), Y.max()


# ---------------------------------------------------------------- elevation
def _tx(lon, z):
    return (lon + 180.0) / 360.0 * 2 ** z


def _ty(lat, z):
    r = np.radians(np.clip(lat, -85.0, 85.0))
    return (1 - np.log(np.tan(r) + 1 / np.cos(r)) / math.pi) / 2 * 2 ** z


_mos = {}


def fetch_tile(z, x, y, p):
    """AWS Open Data Terrain Tiles (Terrarium). Cached under TILES; the cache is not committed."""
    import urllib.request
    u = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    err = None
    for _ in range(4):
        try:
            urllib.request.urlretrieve(u, p)
            return
        except Exception as e:  # noqa: BLE001
            err = e
    raise SystemExit(f'tile fetch failed {u}: {err}')


def elevation(z, lon, lat, wrap=False):
    gx = _tx(lon, z) * 256 - 0.5
    gy = _ty(lat, z) * 256 - 0.5
    n = 2 ** z
    if wrap:
        key = ('w', z)
        if key not in _mos:
            mos = np.zeros((n * 256, n * 256), np.float32)
            for ty in range(n):
                for tx in range(n):
                    a = np.asarray(Image.open(os.path.join(TILES, f'{z}_{tx}_{ty}.png')).convert('RGB')).astype(np.float32)
                    mos[ty * 256:(ty + 1) * 256, tx * 256:(tx + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
            _mos[key] = mos
        mos = _mos[key]
        return ndi.map_coordinates(mos, [gy, gx % (n * 256)], order=1, mode='grid-wrap')
    x0, x1 = int(gx.min() // 256), int(gx.max() // 256)
    y0, y1 = int(gy.min() // 256), int(gy.max() // 256)
    mos = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), np.float32)
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            p = os.path.join(TILES, f'{z}_{tx}_{ty}.png')
            if not os.path.exists(p):
                fetch_tile(z, tx, ty, p)
            a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
            mos[(ty - y0) * 256:(ty - y0 + 1) * 256, (tx - x0) * 256:(tx - x0 + 1) * 256] = \
                a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    return ndi.map_coordinates(mos, [gy - y0 * 256, gx - x0 * 256], order=1, mode='nearest')


# ---------------------------------------------------------------- Blue Marble colour (non-Antarctic land)
_bm = None


def bm_colour(lon, lat):
    global _bm
    if _bm is None:
        im = np.asarray(Image.open(BMNG).convert('RGB')).astype(np.float32) / 255
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        water = (b > r + 0.04) & (b > g - 0.02)
        water = ndi.binary_opening(water, iterations=1)
        idx = ndi.distance_transform_edt(water, return_distances=False, return_indices=True)
        land = im[idx[0], idx[1]]
        _bm = ndi.gaussian_filter(land, (0.6, 0.6, 0))
    land = _bm
    H, W = land.shape[:2]
    px = (lon + 180) / 360 * W - 0.5
    py = (90 - lat) / 180 * H - 0.5
    return np.stack([ndi.map_coordinates(land[..., k], [py, px], order=3, mode='grid-wrap') for k in range(3)], -1)


# ---------------------------------------------------------------- plane-anchored procedural texture
RNG = np.random.default_rng(31)
NZ = RNG.standard_normal((512, 512)).astype(np.float32)
NZ = (NZ - NZ.mean()) / NZ.std()


def vnoise(X, Y, f, K, seed=0, sx=1.0, sy=1.0):
    """Smooth value noise in plane km; f = cycles per 100 km. Octave dropped below ~3 px (no aliasing)."""
    if K * 100.0 / (f * max(sx, sy)) < 3.0:
        return np.zeros_like(X)
    o = seed * 97.13
    return ndi.map_coordinates(NZ, [Y * f * sy / 100 + o, X * f * sx / 100 + o * 0.7], order=3, mode='grid-wrap')


def fbm(X, Y, K, f, octs, seed, sx=1.0, sy=1.0):
    s = np.zeros_like(X)
    amp, tot = 1.0, 0.0
    for i in range(octs):
        s += amp * vnoise(X, Y, f * 2 ** i, K, seed + i, sx, sy)
        tot += amp
        amp *= 0.55
    return s / tot


def rot(X, Y, deg):
    a = math.radians(deg)
    return X * math.cos(a) - Y * math.sin(a), X * math.sin(a) + Y * math.cos(a)


# ---------------------------------------------------------------- Natural Earth masks
_ne = {}


def ne_polys(f):
    if f not in _ne:
        out = []
        for ft in json.load(open(os.path.join(NE, f + '.geojson')))['features']:
            g = ft['geometry']
            polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
            for poly in polys:
                out.append([np.asarray(r, np.float64) for r in poly])
        _ne[f] = out
    return _ne[f]


def ne_mask(files, x0, y0, K, W, H, SS=3, south_only=None):
    im = Image.new('L', (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    for f in files:
        for rings in ne_polys(f):
            ext = rings[0]
            if south_only is not None and ext[:, 1].min() > south_only:
                continue
            for k, r in enumerate(rings):
                X, Y, vis = fwd(r[:, 0], r[:, 1])
                if vis.max() <= 0:
                    continue
                # hidden vertices are pulled radially onto the limb
                rr = np.hypot(X, Y)
                fac = np.where(vis > 0, 1.0, R / np.maximum(rr, 1e-6))
                X, Y = X * fac, Y * fac
                px = (X - x0) * K * SS
                py = (Y - y0) * K * SS
                if px.max() < -50 or px.min() > (W + 50) * SS or py.max() < -50 or py.min() > (H + 50) * SS:
                    continue
                px = np.clip(px, -SS * 400, (W + 400) * SS)
                py = np.clip(py, -SS * 400, (H + 400) * SS)
                d.polygon(list(zip(px.tolist(), py.tolist())), fill=255 if k == 0 else 0)
    im = im.resize((W, H), Image.BOX)
    return np.asarray(im).astype(np.float32) / 255


# ---------------------------------------------------------------- glaciers (approximate flow lines, lon/lat)
GLACIERS = {
    # Mertz Glacier: drains north to its tongue east of Commonwealth Bay (Wikipedia ~67°30'S 144°45'E)
    'mertz': ([(146.3, -69.6), (145.9, -69.0), (145.45, -68.45), (145.05, -67.95), (144.85, -67.5), (144.95, -67.1), (145.15, -66.75)], 26.0),
    # Ninnis Glacier: drains north to the coast (Wikipedia ~68°22'S 147°00'E)
    'ninnis': ([(148.9, -70.0), (148.4, -69.45), (147.8, -68.95), (147.3, -68.55), (147.05, -68.25), (147.1, -67.95)], 22.0),
}


def glacier_fields(X, Y, K):
    """Per-pixel (weight, along-flow s km, across n km) for the strongest glacier at that pixel."""
    best_w = np.zeros_like(X)
    best_s = np.zeros_like(X)
    best_n = np.zeros_like(X)
    pts = np.stack([X.ravel(), Y.ravel()], -1)
    for name, (ll, width) in GLACIERS.items():
        lo = np.array([p[0] for p in ll])
        la = np.array([p[1] for p in ll])
        # dense Catmull-Rom-ish resample via linear interpolation of a smoothed polyline
        t = np.linspace(0, len(ll) - 1, 900)
        lo_d = np.interp(t, np.arange(len(ll)), lo)
        la_d = np.interp(t, np.arange(len(ll)), la)
        lo_d = ndi.gaussian_filter1d(lo_d, 30, mode='nearest')
        la_d = ndi.gaussian_filter1d(la_d, 30, mode='nearest')
        px, py, _ = fwd(lo_d, la_d)
        seg = np.hypot(np.diff(px), np.diff(py))
        s_cum = np.concatenate([[0], np.cumsum(seg)])
        tree = cKDTree(np.stack([px, py], -1))
        dist, idx = tree.query(pts, k=1, distance_upper_bound=width * 2.6)
        ok = np.isfinite(dist)
        idx = np.where(ok, idx, 0)
        tx = np.gradient(px)[idx]
        ty = np.gradient(py)[idx]
        tl = np.hypot(tx, ty) + 1e-9
        dx = pts[:, 0] - px[idx]
        dy = pts[:, 1] - py[idx]
        n = (dx * ty - dy * tx) / tl
        # width tapers upstream (glacier catchment widens into the plateau, flow fades)
        frac = s_cum[idx] / s_cum[-1]
        wloc = width * (0.55 + 0.45 * frac) * (1 + 0.22 * np.sin(s_cum[idx] / 23.0 + len(name)))
        w = np.where(ok, np.clip(1.25 - np.abs(n) / wloc, 0, 1), 0)
        w = w * np.clip(frac * 3.0, 0, 1)
        w = w.reshape(X.shape)
        m = w > best_w
        best_w = np.where(m, w, best_w)
        best_s = np.where(m, s_cum[idx].reshape(X.shape), best_s)
        best_n = np.where(m, n.reshape(X.shape), best_n)
    return best_w, best_s, best_n


# ---------------------------------------------------------------- grading
def hillshade(e, km_px, az=315, alt=38, exag=1.0):
    g_row, g_col = np.gradient(e * exag, km_px * 1000, km_px * 1000)
    gx, gy = g_col, -g_row
    n = np.sqrt(gx * gx + gy * gy + 1)
    azr, altr = math.radians(az), math.radians(alt)
    lx, ly, lz = math.sin(azr) * math.cos(altr), math.cos(azr) * math.cos(altr), math.sin(altr)
    return (-gx * lx - gy * ly + lz) / n - lz


def ocean_colour(depth):
    d = np.clip(depth, 0, 7000)
    t = np.log1p(d / 6.0) / np.log1p(7000 / 6.0)
    stops = [
        (0.00, (0.16, 0.36, 0.46)),
        (0.30, (0.085, 0.225, 0.36)),
        (0.52, (0.055, 0.15, 0.29)),   # Antarctic shelf: cold mid navy
        (0.70, (0.035, 0.10, 0.225)),
        (0.86, (0.025, 0.07, 0.175)),  # deep navy
        (1.00, (0.018, 0.05, 0.14)),
    ]
    out = np.zeros(depth.shape + (3,), np.float32)
    for (t0, c0), (t1, c1) in zip(stops[:-1], stops[1:]):
        m = (t >= t0) & (t <= t1)
        u = ((t - t0) / (t1 - t0))[m][:, None]
        out[m] = np.array(c0) * (1 - u) + np.array(c1) * u
    return out


def soft_shoulder(x, knee=0.62, ceil=0.83):
    over = np.maximum(x - knee, 0)
    return np.where(x > knee, knee + (ceil - knee) * (1 - np.exp(-over / (ceil - knee))), x)


def grade_land(col, e, K, km_px):
    lum = (col * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
    sat = col - lum
    g = lum + sat * 1.18
    hs = hillshade(ndi.gaussian_filter(e, 1.0), km_px, exag=2.2) * 0.6 + hillshade(ndi.gaussian_filter(e, 4.0), km_px, exag=3.5) * 0.4
    shade = np.where(hs > 0, 0.10 * np.tanh(hs / 0.07), 0.45 * np.tanh(hs / 0.11))
    g = g * (1 + shade[..., None])
    L = (g * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
    g = g * (soft_shoulder(L, 0.55, 0.78) / np.maximum(L, 1e-4))
    return np.clip(g, 0, 1)


def grade_ice(X, Y, e, K, km_px, shelf, gw, gs, gn, coastd):
    """Antarctic ice: pale blue-grey, soft relief, sastrugi, glacier flow + crevasse shadow. Never white."""
    U, V = rot(X, Y, -18)  # U across the katabatic wind, V along it (wind runs downslope, SSE -> NNW)
    # broad tone: coastal slope ice greyer-bluer, high plateau paler; slow 'satellite' variation on top
    hn = np.clip(e / 2000.0, 0, 1)
    base = np.array([0.585, 0.665, 0.755]) * (1 - hn[..., None]) + np.array([0.70, 0.75, 0.815]) * hn[..., None]
    broad = fbm(X, Y, K, 0.9, 4, 3) * 0.05
    # wind-glaze vs packed snow: long soft streaks along the wind, plus fine sastrugi grain
    glaze = fbm(U, V, K, 2.2, 4, 13, sx=2.2, sy=0.8) * 0.035
    sast = fbm(U, V, K, 35, 3, 17, sx=3.0, sy=0.9) * 0.009 + fbm(U, V, K, 160, 2, 23, sx=3.0, sy=0.8) * 0.006
    grain = fbm(X, Y, K, 400, 2, 29) * 0.012
    col = base * (1 + (broad + glaze + sast + grain)[..., None])
    # blue-ice streaks: thin, elongated with the wind, only on the lower coastal slope
    bi = np.clip((fbm(U, V, K, 4.0, 4, 41, sx=3.5, sy=0.7) - 0.75) * 2.0, 0, 1) * np.clip(1 - e / 700.0, 0, 1) * (1 - shelf)
    col = col * (1 - 0.35 * bi[..., None]) + np.array([0.45, 0.60, 0.76]) * 0.35 * bi[..., None]
    # relief from the ice-sheet DEM: km-scale smoothing (no blocky ETOPO steps), soft light from the north-west
    sig = max(1.0, 6.0 * K)
    es = ndi.gaussian_filter(e, sig)
    # synthetic megadune undulation across the wind (very low amplitude) so flat plateau still reads as terrain
    es = es + 6.0 * np.sin(U / 2.6 * 2 * np.pi + fbm(X, Y, K, 3, 3, 47) * 3.0) * np.clip(hn * 2, 0, 1)
    hs = hillshade(es, km_px, az=320, alt=32, exag=10.0)
    lit = 0.05 * np.tanh(np.maximum(hs, 0) / 0.05)
    shd = 0.17 * np.tanh(np.maximum(-hs, 0) / 0.08)
    col = col * (1 + lit[..., None]) * (1 - shd[..., None] * np.array([0.85, 0.6, 0.36]))
    # coastal ice: within ~25 km of the coast, rougher (coastal crevassing) and a little darker
    if coastd is not None:
        cz = np.exp(-(coastd / 14.0) ** 2) * (1 - shelf)
        rough = fbm(X, Y, K, 140, 3, 37) * np.clip(K / 3.0, 0.3, 1.0)
        col = col * (1 - (cz * (0.05 + 0.06 * np.abs(rough)))[..., None])
    # glaciers: a cooler, smoother channel; soft flow bands; crevassed shear margins; transverse crevasse rows
    if gw.max() > 0:
        w = np.clip(gw * 1.6, 0, 1)
        wn = w[..., None]
        col = col * (1 - 0.07 * wn) + np.array([0.56, 0.66, 0.77]) * 0.07 * wn
        band = fbm(gn * 2.2, gs * 0.06, K, 18, 3, 51)
        col = col * (1 + 0.045 * wn * band[..., None])
        # shear margins: rough crevasse texture where |n| is near the channel edge
        marg = np.exp(-((gw - 0.30) / 0.16) ** 2) * (gw > 0.02)
        marg = marg * np.clip(fbm(X, Y, K, 12, 3, 55) * 1.2 + 0.7, 0, 1)
        tex = np.clip(fbm(X, Y, K, 90, 3, 57) * 0.8 + 0.5, 0, 1)
        col = col * (1 - (marg * (0.05 + 0.10 * tex))[..., None] * np.array([0.9, 0.75, 0.55]))
        lam = 2.0  # km between crevasse rows (stylised so they read at map scale)
        if K * lam >= 7.0:
            wob = fbm(gn, gs, K, 14, 3, 61) * 0.28
            arc = 0.0022 * gn * gn  # arcuate rows, bowed downstream like real transverse crevasses
            ph = (gs / lam + wob + arc) % 1.0
            thin = max(0.045, 1.3 / (K * lam))
            crev = np.clip(1 - np.abs(ph - 0.5) / thin, 0, 1) ** 1.3
            soft = np.clip(1 - np.abs(ph - 0.5 + thin) / (thin * 2.5), 0, 1) ** 2  # blue shadow up-sun
            lip = np.clip(1 - np.abs(ph - 0.5 - thin * 1.6) / thin, 0, 1) ** 2
            brk = np.clip(fbm(gn * 0.6, gs, K, 9, 3, 71) * 2.4 - 0.05, 0, 1)
            reach = np.clip((gs - 60.0) / 70.0, 0, 1)
            cw = w * brk * reach
            col = col * (1 - (0.16 * soft * cw)[..., None] * np.array([0.8, 0.55, 0.3]))
            col = col * (1 - 0.42 * (crev * cw)[..., None] * np.array([0.95, 0.80, 0.58]))
            col = col * (1 + 0.06 * (lip * cw)[..., None])
    # ice shelves / glacier tongues: flatter, smoother, slightly bluer, with faint flow striping
    sh = shelf[..., None]
    stripe = fbm(U, V, K, 25, 2, 77, sx=0.5, sy=5.0)[..., None]
    col = col * (1 - 0.12 * sh) + np.array([0.60, 0.70, 0.80]) * 0.12 * sh
    col = col * (1 + 0.03 * sh * stripe)
    # ice-cliff rim: thin lit edge just inside the coast
    if coastd is not None:
        rim = np.exp(-(coastd / max(0.25, 1.4 / K)) ** 2)
        col = col * (1 + 0.07 * rim[..., None])
    col = np.clip(col, 0, None)
    L = (col * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
    col = col * (soft_shoulder(L) / np.maximum(L, 1e-4))
    return np.clip(col, 0, 1)


def bergs(X, Y, K, coastd_w, land):
    """Small tabular bergs near the coast (deterministic). Returns (mask, shadow)."""
    rng = np.random.default_rng(311)
    m = np.zeros_like(X, dtype=np.float32)
    shd = np.zeros_like(X, dtype=np.float32)
    if K < 0.8:
        return m, shd
    x0, x1, y0, y1 = X.min(), X.max(), Y.min(), Y.max()
    area = (x1 - x0) * (y1 - y0)
    n = int(area / 900)
    cx = rng.uniform(x0, x1, n)
    cy = rng.uniform(y0, y1, n)
    sz = rng.lognormal(math.log(0.9), 0.6, n)
    H, W = X.shape
    for i in range(n):
        ix = int((cx[i] - x0) * K)
        iy = int((cy[i] - y0) * K)
        if not (0 <= ix < W and 0 <= iy < H):
            continue
        cd = coastd_w[iy, ix]
        if land[iy, ix] > 0.1 or cd > 70 or cd < 2.5:
            continue
        if rng.random() > math.exp(-cd / 22):
            continue
        r = sz[i] * (1.0 if cd > 6 else 0.7)
        rp = max(1, int(r * K * 1.8) + 3)
        ya, yb, xa, xb = max(0, iy - rp), min(H, iy + rp), max(0, ix - rp), min(W, ix + rp)
        if yb <= ya or xb <= xa:
            continue
        dx = X[ya:yb, xa:xb] - cx[i]
        dy = Y[ya:yb, xa:xb] - cy[i]
        a = rng.uniform(0, math.pi)
        u = dx * math.cos(a) + dy * math.sin(a)
        v = -dx * math.sin(a) + dy * math.cos(a)
        el = rng.uniform(0.45, 0.85)
        dd = np.maximum(np.abs(u) / r, np.abs(v) / (r * el)) ** 1.0 * 0.6 + np.hypot(u / r, v / (r * el)) * 0.4
        aa = 1.0 / (r * K)
        mm = np.clip((1 - dd) / max(aa, 0.02) * 0.5 + 0.5, 0, 1)
        m[ya:yb, xa:xb] = np.maximum(m[ya:yb, xa:xb], mm)
        dd2 = np.hypot((u - r * 0.25) / r, (v + r * 0.25) / (r * el))
        shd[ya:yb, xa:xb] = np.maximum(shd[ya:yb, xa:xb], np.clip(1.2 - dd2, 0, 1) * 0.6)
    return m, shd


def build(name):
    _, K, z = LAYERS[name]
    x0, x1, y0, y1 = plane_bbox(name)
    W = int(round((x1 - x0) * K))
    H = int(round((y1 - y0) * K))
    km_px = 1.0 / K
    print(name, W, 'x', H, f'K={K} px/km zoom', z, f'plane x {x0:.0f}..{x1:.0f} y {y0:.0f}..{y1:.0f}')
    xs = x0 + (np.arange(W) + 0.5) / K
    ys = y0 + (np.arange(H) + 0.5) / K
    XX, YY = np.meshgrid(xs, ys)
    LON, LAT, DISK = inv(XX, YY)
    glob = name == 'globe'
    E = elevation(z, LON, LAT, wrap=glob).astype(np.float32)
    if glob:
        pole = np.clip((-LAT - 82.0) / 3.0, 0, 1).astype(np.float32)
        E = E * (1 - pole) + 2900.0 * pole
    LANDM = ne_mask(['ne_10m_land', 'ne_10m_minor_islands'], x0, y0, K, W, H)
    SHELF = ne_mask(['ne_10m_antarctic_ice_shelves_polys'], x0, y0, K, W, H)
    M = np.clip(LANDM + SHELF, 0, 1)
    if K >= 1.5:
        # close views: break Natural Earth's straight facets into an organic ice-cliff line
        wob = fbm(XX, YY, K, 18, 4, 81) * 0.14 + fbm(XX, YY, K, 90, 3, 83) * 0.06
        Mb = ndi.gaussian_filter(M, max(1.0, K * 0.45)) + wob
        M = np.clip((Mb - 0.44) / 0.10, 0, 1).astype(np.float32)
        SHELF = np.clip(ndi.gaussian_filter(SHELF, max(1.0, K * 0.45)) * 1.6 - 0.3, 0, 1) * M
    LAND = M > 0.5
    ANT = (LAT < -60.0).astype(np.float32)
    CDw = (ndi.distance_transform_edt(~LAND) * km_px).astype(np.float32)   # km from coast, water side
    CDl = (ndi.distance_transform_edt(LAND) * km_px).astype(np.float32)    # km from coast, land side
    Ew = np.where(LAND, 0, E)
    DEP = ndi.gaussian_filter(np.maximum(-Ew, 0) + np.where(Ew > 0, 350, 0), max(1.5, K * 4.0)).astype(np.float32)
    DEP = np.minimum(DEP, 120 + CDw * 40.0)
    El = np.where(LAND, np.maximum(E, 5.0), 0).astype(np.float32)
    # inside close layers the DEM coast and NE coast disagree: blend elevation to rise from the NE coast
    El = El * np.clip(CDl / 6.0, 0.15, 1.0) + np.where(LAND, 30, 0)
    if glob:
        gw = gs = gn = np.zeros_like(XX)
    else:
        gw, gs, gn = glacier_fields(XX, YY, K)
    rows = []
    STRIP = 600
    for r0 in range(0, H, STRIP):
        pad = 40
        ra, rb = max(0, r0 - pad), min(H, r0 + STRIP + pad)
        sl = slice(ra, rb)
        X, Y = XX[sl], YY[sl]
        lon, lat = LON[sl], LAT[sl]
        e = El[sl].astype(np.float64)
        ice = grade_ice(X, Y, e, K, km_px, SHELF[sl], gw[sl], gs[sl], gn[sl], CDl[sl] if K >= 1.5 else None)
        if glob:
            col = bm_colour(lon, lat)
            land = grade_land(col, e, K, km_px)
            a = ANT[sl][..., None]
            g = land * (1 - a) + ice * 0.92 * a
        else:
            g = ice
        oc = ocean_colour(DEP[sl])
        eb = ndi.gaussian_filter(np.minimum(np.where(LAND[sl], 0, E[sl]), 0), max(3.0, K * 6))
        bhs = hillshade(eb, km_px, exag=1.0)
        oc = oc * (1 + 0.16 * np.tanh(bhs / 0.04)[..., None])
        oc = oc * (1 + 0.05 * fbm(X, Y, K, 0.6, 4, 31)[..., None] + 0.035 * fbm(X, Y, K, 30, 4, 33)[..., None])
        m = M[sl][..., None]
        cd = CDw[sl][..., None]
        # cold shallow halo off the ice cliffs + a dark cliff shadow line on the water (close layers)
        oc = oc + np.exp(-(cd / 6.0) ** 2) * (1 - m) * np.array([0.02, 0.045, 0.06])
        if K >= 1.5:
            oc = oc * (1 - 0.30 * np.exp(-(cd / max(0.18, 1.0 / K)) ** 2))
            bm_, bs_ = bergs(X, Y, K, CDw[sl], M[sl])
            oc = oc * (1 - 0.35 * bs_[..., None])
            bcol = np.array([0.70, 0.78, 0.85]) * (1 + 0.04 * fbm(X, Y, K, 200, 2, 91))[..., None]
            oc = oc * (1 - bm_[..., None]) + bcol * bm_[..., None]
        out = g * m + oc * (1 - m)
        if glob:
            # space outside the disk (masked by the overlay limb glow in scenes.js)
            d = DISK[sl][..., None]
            out = out * d + np.array([0.012, 0.02, 0.05]) * (1 - d)
        rows.append(out[r0 - ra: r0 - ra + min(STRIP, H - r0)])
        print('  rows', r0, '→', min(H, r0 + STRIP))
    img = np.concatenate(rows, 0)
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(
        os.path.join(OUT, f'map_{name}.jpg'), quality=88, subsampling=0, optimize=True)
    return dict(x0=float(x0), y0=float(y0), K=K, w=W, h=H, src=f'assets/map_{name}.jpg')


if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or list(ORDER)
    meta_p = os.path.join(OUT, 'map_layers.json')
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for n in names:
        meta[n] = build(n)
    meta = {k: meta[k] for k in ORDER if k in meta}
    json.dump(meta, open(meta_p, 'w'), indent=1)
