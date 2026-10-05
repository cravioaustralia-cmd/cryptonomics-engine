"""Shared geography + grading for the s32 basemap tools (open data only).

Colour : NASA Blue Marble Next Generation (public domain), the 5400x2700 copy shipped in the PyPI package
         `basemap-data` (mpl_toolkits/basemap_data/bmng.jpg).
Relief : AWS Open Data Terrain Tiles (Terrarium PNG; SRTM / GMTED / ETOPO1). Cached under $TILES, not committed.
Coast  : Natural Earth 10m land + minor islands (public domain), from github.com/nvkelso/natural-earth-vector.

Projection (shared with scenes.js and spin renders): ORTHOGRAPHIC centred on a plane centre (lon0, lat0), km.
    x = R cos(lat) sin(lon - lon0)
    y = R (cos(lat0) sin(lat) - sin(lat0) cos(lat) cos(lon - lon0))
    plane X = x (east), plane Y = -y (south is down on screen). R = 6371 km.

Look locks (GeoGlobeTales): rich natural land colour, deep navy ocean with subtle bathymetry, soft balanced light,
NO blown-out white relief (luminance shoulder caps highlights well under 1.0; snow is toned to soft grey-blue).
"""
import json, math, os, concurrent.futures as cf
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
TILES = os.environ.get('TILES', '/tmp/claude-0/tiles')
NE = os.environ.get('NE', '/tmp/claude-0/ne')
BMNG = os.environ.get('BMNG', '/usr/local/lib/python3.11/dist-packages/mpl_toolkits/basemap_data/bmng.jpg')
R = 6371.0
os.makedirs(TILES, exist_ok=True)

# plane centres (must match scenes.js PLANES)
PLANES = {
    'A': (160.0, -37.0),    # Tasman: south-east Australia + New Zealand
    'B': (-118.0, 33.0),    # California + Baja California
    'M': (-172.0, -6.0),    # master map: Australia + the whole Pacific crossing
}


def fwd(lon, lat, c):
    lon0, lat0 = c
    s0, c0 = math.sin(math.radians(lat0)), math.cos(math.radians(lat0))
    lo = np.radians(np.asarray(lon, np.float64) - lon0)
    la = np.radians(np.asarray(lat, np.float64))
    x = R * np.cos(la) * np.sin(lo)
    y = R * (c0 * np.sin(la) - s0 * np.cos(la) * np.cos(lo))
    vis = s0 * np.sin(la) + c0 * np.cos(la) * np.cos(lo)
    return x, -y, vis


def inv(X, Y, c):
    lon0, lat0 = c
    s0, c0 = math.sin(math.radians(lat0)), math.cos(math.radians(lat0))
    x, y = X, -Y
    rho = np.sqrt(x * x + y * y)
    cc_ = np.arcsin(np.clip(rho / R, 0, 1))
    sc, cc = np.sin(cc_), np.cos(cc_)
    rs = np.where(rho < 1e-9, 1e-9, rho)
    lat = np.degrees(np.arcsin(np.clip(cc * s0 + y * sc * c0 / rs, -1, 1)))
    lon = lon0 + np.degrees(np.arctan2(x * sc, rho * cc * c0 - y * sc * s0))
    lon = (lon + 180) % 360 - 180
    return lon, lat, rho <= R


# ---------------------------------------------------------------- Terrarium elevation
def _tx(lon, z):
    return (lon + 180.0) / 360.0 * 2 ** z


def _ty(lat, z):
    r = np.radians(np.clip(lat, -85.0, 85.0))
    return (1 - np.log(np.tan(r) + 1 / np.cos(r)) / math.pi) / 2 * 2 ** z


def fetch_tile(z, x, y):
    import urllib.request
    p = os.path.join(TILES, f'{z}_{x}_{y}.png')
    if os.path.exists(p) and os.path.getsize(p) > 0:
        return p
    u = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    err = None
    for _ in range(5):
        try:
            urllib.request.urlretrieve(u, p + '.part')
            os.replace(p + '.part', p)
            return p
        except Exception as e:  # noqa: BLE001
            err = e
    raise SystemExit(f'tile fetch failed {u}: {err}')


def fetch_many(keys):
    with cf.ThreadPoolExecutor(16) as ex:
        list(ex.map(lambda k: fetch_tile(*k), keys))


def _dec(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def elevation(z, lon, lat):
    """Bilinear Terrarium elevation (m) at lon/lat arrays; handles the antimeridian by tile wrap."""
    n = 2 ** z
    gx = _tx(lon, z) * 256 - 0.5
    gy = _ty(lat, z) * 256 - 0.5
    txs = np.unique((np.floor(gx / 256).astype(int)) % n)
    tys = np.unique(np.clip(np.floor(gy / 256).astype(int), 0, n - 1))
    # include neighbours for interpolation
    txs = np.unique(np.concatenate([txs, (txs + 1) % n, (txs - 1) % n]))
    tys = np.unique(np.clip(np.concatenate([tys, tys + 1, tys - 1]), 0, n - 1))
    fetch_many([(z, int(x), int(y)) for x in txs for y in tys])
    # sample per tile via a dict mosaic (sparse)
    out = np.zeros(np.shape(lon), np.float32)
    ix = np.floor(gx).astype(np.int64)
    iy = np.floor(gy).astype(np.int64)
    fx = (gx - ix).astype(np.float32)
    fy = (gy - iy).astype(np.float32)
    cache = {}

    def val(px, py):
        px = px % (n * 256)
        py = np.clip(py, 0, n * 256 - 1)
        tx, ty = px // 256, py // 256
        res = np.zeros(px.shape, np.float32)
        keys = tx * 100000 + ty
        for k in np.unique(keys):
            m = keys == k
            kx, ky = int(k // 100000), int(k % 100000)
            if (kx, ky) not in cache:
                cache[(kx, ky)] = _dec(fetch_tile(z, kx, ky))
            res[m] = cache[(kx, ky)][py[m] % 256, px[m] % 256]
        return res

    v00 = val(ix, iy)
    v10 = val(ix + 1, iy)
    v01 = val(ix, iy + 1)
    v11 = val(ix + 1, iy + 1)
    out = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy
    return out


# ---------------------------------------------------------------- Blue Marble colour
_bm = None


def bm_colour(lon, lat):
    """BMNG land colour with water pixels filled from the nearest land (so coasts never bleed blue)."""
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


# ---------------------------------------------------------------- procedural detail (deterministic)
RNG = np.random.default_rng(32)
NZ = RNG.standard_normal((512, 512)).astype(np.float32)
NZ = (NZ - NZ.mean()) / NZ.std()


def vnoise(X, Y, f, K, seed=0):
    """Smooth value noise in km; f = cycles per 100 km; octaves under ~3 px are dropped (no aliasing)."""
    if K * 100.0 / f < 3.0:
        return np.zeros_like(X)
    o = seed * 97.13
    return ndi.map_coordinates(NZ, [Y * f / 100 + o, X * f / 100 + o * 0.7], order=3, mode='grid-wrap')


def fbm(X, Y, K, f, octs, seed):
    s = np.zeros_like(X)
    amp, tot = 1.0, 0.0
    for i in range(octs):
        s += amp * vnoise(X, Y, f * 2 ** i, K, seed + i)
        tot += amp
        amp *= 0.55
    return s / tot


# ---------------------------------------------------------------- Natural Earth
_ne = {}


def ne_polys(f):
    if f not in _ne:
        out = []
        for ft in json.load(open(os.path.join(NE, f + '.geojson')))['features']:
            g = ft['geometry']
            if g is None:
                continue
            polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
            for poly in polys:
                out.append([np.asarray(r, np.float64) for r in poly])
        _ne[f] = out
    return _ne[f]


def ne_mask_plane(files, c, x0, y0, K, W, H, SS=3):
    im = Image.new('L', (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    for f in files:
        for rings in ne_polys(f):
            for k, r in enumerate(rings):
                X, Y, vis = fwd(r[:, 0], r[:, 1], c)
                if vis.max() <= 0:
                    continue
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


def ne_mask_equi(files, W, H, SS=2):
    """Land mask on an equirectangular grid (lon -180..180, lat 90..-90)."""
    im = Image.new('L', (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    for f in files:
        for rings in ne_polys(f):
            for k, r in enumerate(rings):
                px = (r[:, 0] + 180) / 360 * W * SS
                py = (90 - r[:, 1]) / 180 * H * SS
                d.polygon(list(zip(px.tolist(), py.tolist())), fill=255 if k == 0 else 0)
    im = im.resize((W, H), Image.BOX)
    return np.asarray(im).astype(np.float32) / 255


# ---------------------------------------------------------------- grading
def hillshade(e, km_px_x, km_px_y=None, az=315, alt=40, exag=1.0):
    km_px_y = km_px_x if km_px_y is None else km_px_y
    g_row, g_col = np.gradient(e * exag, 1000 * np.mean(km_px_y), 1000 * np.mean(km_px_x))
    gx, gy = g_col, -g_row
    n = np.sqrt(gx * gx + gy * gy + 1)
    azr, altr = math.radians(az), math.radians(alt)
    lx, ly, lz = math.sin(azr) * math.cos(altr), math.cos(azr) * math.cos(altr), math.sin(altr)
    return (-gx * lx - gy * ly + lz) / n - lz


def ocean_colour(depth):
    d = np.clip(depth, 0, 7000)
    t = np.log1p(d / 6.0) / np.log1p(7000 / 6.0)
    stops = [
        (0.00, (0.13, 0.36, 0.45)),     # shallow coastal teal (first few metres only)
        (0.22, (0.075, 0.22, 0.37)),
        (0.45, (0.05, 0.15, 0.31)),     # continental shelf: blue, already darkening
        (0.62, (0.035, 0.105, 0.25)),   # shelf edge / slope
        (0.80, (0.026, 0.078, 0.205)),  # deep navy
        (1.00, (0.02, 0.058, 0.165)),
    ]
    out = np.zeros(depth.shape + (3,), np.float32)
    for (t0, c0), (t1, c1) in zip(stops[:-1], stops[1:]):
        m = (t >= t0) & (t <= t1)
        u = ((t - t0) / (t1 - t0))[m][:, None]
        out[m] = np.array(c0) * (1 - u) + np.array(c1) * u
    return out


def soft_shoulder(x, knee=0.52, ceil=0.72):
    over = np.maximum(x - knee, 0)
    return np.where(x > knee, knee + (ceil - knee) * (1 - np.exp(-over / (ceil - knee))), x)


def grade_land(col, e, hs_fine, hs_broad, detail=None):
    """Rich natural land, soft balanced light, never blown white (snow -> soft blue-grey)."""
    lum = (col * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
    # tame snow / salt / cloud remnants in BMNG: bright, low-saturation pixels pulled down and cooled
    sat_amt = (col.max(-1, keepdims=True) - col.min(-1, keepdims=True))
    snow = np.clip((lum - 0.34) / 0.16, 0, 1) * np.clip(1 - sat_amt / 0.18, 0, 1)
    col = col * (1 - 0.78 * snow) + np.array([0.40, 0.39, 0.36]) * 0.78 * snow
    lum = (col * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
    sat = col - lum
    # BMNG is dark and flat: lift mid-tones (gamma), then rich but natural saturation (GeoGlobeTales)
    lum2 = np.power(np.clip(lum, 0, 1), 0.80) * 1.06
    g = lum2 + sat * 1.45 * (lum2 / np.maximum(lum, 1e-3)) ** 0.5
    # vegetation reads a touch greener, dry country a touch warmer
    veg = np.clip((col[..., 1:2] - col[..., 0:1]) * 8 + 0.3, 0, 1)
    g = g * (np.array([0.97, 1.04, 0.96]) * veg + np.array([1.04, 1.0, 0.94]) * (1 - veg))
    hs = hs_fine * 0.6 + hs_broad * 0.4
    shade = np.where(hs > 0, 0.07 * np.tanh(hs / 0.07), 0.30 * np.tanh(hs / 0.13))
    g = g * (1 + shade[..., None])
    # shadows lean cool, not black
    sh = np.clip(-shade, 0, 1)[..., None]
    g = g + sh * np.array([-0.01, 0.0, 0.025])
    if detail is not None:
        g = g * (1 + detail[..., None])
    L = (g * [0.30, 0.59, 0.11]).sum(-1, keepdims=True)
    g = g * (soft_shoulder(L) / np.maximum(L, 1e-4))
    return np.clip(g, 0, 1)
