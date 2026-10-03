#!/usr/bin/env python3
"""
s29 Darwin Stuck — GeoGlobeTales-style satellite basemap builder.

Sources (both free / public):
  * Elevation + bathymetry: AWS Terrain Tiles (Mapzen "terrarium" encoding;
    SRTM / GMTED / ETOPO1 etc.) — https://registry.opendata.aws/terrain-tiles/
  * Land colour: NASA Blue Marble Next Generation (public domain), 4096x2048
    equirectangular copy shipped in the `three-globe` npm package (example/img).

Look (locked): rich natural land colour, deep navy ocean with subtle bathymetry,
soft balanced lighting, NO blown white relief (highlights are soft-clipped and
the hillshade can only lift a pixel ~8%).

Outputs (Web Mercator, tile-zoom-aligned) into ../images/map/:
  asia5.jpg  aus6.webp  aus7.webp  nt8.webp   (mip chain; camera zoom capped ~z8.4)
  nt_fill.webp  desert.webp                              (soft overlays, aus6 grid)
  meta.json                                              (placement + border points)

Run:  python3 build_basemap.py   (needs numpy, pillow, scipy; network for tiles)
"""
import io, json, math, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'images', 'map')
CACHE = os.environ.get('TILE_CACHE', '/tmp/claude-0/geo/tiles')
BM_PATH = os.environ.get('BM_PATH', '/tmp/claude-0/geo/package/example/img/earth-blue-marble.jpg')
os.makedirs(OUT, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None

# ---------------------------------------------------------------- projection
def wx(lon, z):
    return (lon + 180.0) / 360.0 * 256 * 2 ** z

def wy(lat, z):
    s = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return (1 - s / math.pi) / 2 * 256 * 2 ** z

def inv(X, Y, z):
    n = 256 * 2 ** z
    lon = X / n * 360.0 - 180.0
    lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * Y / n))))
    return lon, lat

# ---------------------------------------------------------------- tiles
def fetch_tile(z, x, y):
    p = os.path.join(CACHE, str(z), str(x), f'{y}.png')
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        for attempt in range(4):
            try:
                data = urllib.request.urlopen(url, timeout=30).read()
                break
            except Exception as e:  # noqa
                if attempt == 3:
                    raise
        with open(p, 'wb') as f:
            f.write(data)
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

def elevation(z, X0, Y0, w, h):
    tx0, ty0 = X0 // 256, Y0 // 256
    tx1, ty1 = (X0 + w - 1) // 256, (Y0 + h - 1) // 256
    jobs = [(z, x, y) for x in range(tx0, tx1 + 1) for y in range(ty0, ty1 + 1)]
    with ThreadPoolExecutor(16) as ex:
        tiles = list(ex.map(lambda j: fetch_tile(*j), jobs))
    big = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    for (zz, x, y), t in zip(jobs, tiles):
        big[(y - ty0) * 256:(y - ty0 + 1) * 256, (x - tx0) * 256:(x - tx0 + 1) * 256] = t
    ox, oy = X0 - tx0 * 256, Y0 - ty0 * 256
    return big[oy:oy + h, ox:ox + w]

# ---------------------------------------------------------------- colour helpers
def hex3(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)

def ramp(v, stops):
    """piecewise-linear colour ramp; stops = [(value, '#rrggbb'), ...] ascending."""
    xs = np.array([s[0] for s in stops], np.float32)
    cs = np.stack([hex3(s[1]) for s in stops])
    out = np.empty(v.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(v, xs, cs[:, c])
    return out

def soft_clip(x, knee=0.72, top=0.86):
    """compress highlights so nothing blows to white."""
    over = np.maximum(x - knee, 0)
    span = top - knee
    return np.where(x > knee, knee + span * (1 - np.exp(-over / span)), x)

def fbm(h, w, seed, scales=(6, 14, 32, 80), weights=(0.45, 0.3, 0.15, 0.1)):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    for s, wt in zip(scales, weights):
        n = rng.standard_normal((h // s + 3, w // s + 3)).astype(np.float32)
        up = ndi.zoom(n, s, order=3)[:h, :w]
        acc += wt * up
    return acc / (np.std(acc) + 1e-6)

# ---------------------------------------------------------------- Blue Marble land colour (filled under coasts)
BM = None
BM_LON0, BM_LAT0, BM_LON1, BM_LAT1 = 80.0, 55.0, 175.0, -55.0

def prepare_bm():
    """Blue Marble crop with ocean pixels replaced by inpainted land colour."""
    global BM
    im = np.asarray(Image.open(BM_PATH).convert('RGB')).astype(np.float32) / 255
    H, W = im.shape[:2]
    ppd = W / 360.0
    c0, c1 = int((BM_LON0 + 180) * ppd), int((BM_LON1 + 180) * ppd)
    r0, r1 = int((90 - BM_LAT0) * ppd), int((90 - BM_LAT1) * ppd)
    crop = im[r0:r1, c0:c1]
    h, w = crop.shape[:2]
    # land mask on the BM grid from z5 terrain (3x3 supersample per BM pixel)
    z = 5
    X0, X1 = int(wx(BM_LON0, z)), int(wx(BM_LON1, z)) + 1
    Y0, Y1 = int(wy(BM_LAT0, z)), int(wy(BM_LAT1, z)) + 1
    E = elevation(z, X0, Y0, X1 - X0, Y1 - Y0)
    ocean = ocean_mask(E)
    land_frac = np.zeros((h, w), np.float32)
    for dy in (0.17, 0.5, 0.83):
        for dx in (0.17, 0.5, 0.83):
            lon = BM_LON0 + (np.arange(w) + dx) / ppd
            lat = BM_LAT0 - (np.arange(h) + dy) / ppd
            LON, LAT = np.meshgrid(lon, lat)
            xs = (wx_arr(LON, z) - X0).astype(int).clip(0, E.shape[1] - 1)
            ys = (wy_arr(LAT, z) - Y0).astype(int).clip(0, E.shape[0] - 1)
            land_frac += (~ocean[ys, xs]).astype(np.float32) / 9
    M = ndi.binary_erosion(land_frac > 0.99, iterations=1).astype(np.float32)
    filled = crop * M[..., None]
    have = M > 0
    for sig in (1, 2, 4, 8, 16, 32, 64):
        den = ndi.gaussian_filter(M, sig)
        num = np.stack([ndi.gaussian_filter(crop[..., c] * M, sig) for c in range(3)], -1)
        est = num / np.maximum(den, 1e-6)[..., None]
        take = (~have) & (den > 0.04)
        filled[take] = est[take]
        have |= take
    filled[~have] = np.array([0.45, 0.38, 0.25])
    BM = (filled, ppd)
    print('BM ready', filled.shape)

def wx_arr(lon, z):
    return (lon + 180.0) / 360.0 * 256 * 2 ** z

def wy_arr(lat, z):
    s = np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))
    return (1 - s / np.pi) / 2 * 256 * 2 ** z

def sample_bm(LON, LAT):
    img, ppd = BM
    cols = (LON - BM_LON0) * ppd - 0.5
    rows = (BM_LAT0 - LAT) * ppd - 0.5
    out = np.stack([ndi.map_coordinates(img[..., c], [rows, cols], order=3, mode='nearest')
                    for c in range(3)], -1)
    return out.clip(0, 1)

def ocean_mask(E):
    water = E <= 0.5
    lab, n = ndi.label(water)
    if n == 0:
        return water
    sizes = ndi.sum(np.ones_like(E), lab, index=np.arange(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes > 0.002 * E.size
    return keep[lab]

# ---------------------------------------------------------------- canvas render
def render_canvas(name, z, lon0, lat0, lon1, lat1, relief, feather=0, fmt='webp'):
    X0, Y0 = int(math.floor(wx(lon0, z))), int(math.floor(wy(lat0, z)))
    X1, Y1 = int(math.ceil(wx(lon1, z))), int(math.ceil(wy(lat1, z)))
    w, h = X1 - X0, Y1 - Y0
    print(f'{name}: z{z} {w}x{h}')
    E = elevation(z, X0, Y0, w, h)
    E = ndi.gaussian_filter(E, 0.6)
    ocean = ocean_mask(E)
    land = ~ocean
    Xs = X0 + np.arange(w) + 0.5
    Ys = Y0 + np.arange(h) + 0.5
    LONr, LATc = inv(Xs, Ys, z)
    LON, LAT = np.meshgrid(LONr, LATc)
    mpp = 156543.03 * np.cos(np.radians(LAT)) / 2 ** z  # metres per pixel

    # --- soft hillshade (NW light), relief exaggeration per canvas
    El = np.maximum(E, 0)  # land-only relief: no dark rim from the bathymetric drop at the coast
    gy, gx = np.gradient(El)
    gx = gx / mpp * relief
    gy = gy / mpp * relief
    az, alt = math.radians(315), math.radians(42)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    flat = math.sin(alt)
    shade = 1 + 1.15 * (hs - flat)
    shade = np.where(shade > 1, 1 + 0.08 * np.tanh((shade - 1) / 0.08), shade)  # lift ≤ 8 %
    shade = np.clip(shade, 0.62, 1.08)

    # --- land colour
    col = sample_bm(LON, LAT)
    # grade: richer, warmer, GeoGlobeTales-like
    lum = col @ np.array([0.299, 0.587, 0.114], np.float32)
    sat = 1.42
    col = lum[..., None] + (col - lum[..., None]) * sat
    col = np.clip(col, 0, 1) ** 0.92
    col *= np.array([1.04, 1.02, 0.94], np.float32)
    # valley greening from local relief (drainage corridors read as richer vegetation)
    loc = E - ndi.gaussian_filter(E, 6)
    veg = np.clip(-loc / (18 / max(relief, 1) * 4 + 6), 0, 1) * land
    green = np.array([0.30, 0.36, 0.17], np.float32)
    col = col * (1 - 0.32 * veg[..., None]) + green * (0.32 * veg[..., None])
    # Top End tropical savanna reads greener in real dry-season imagery than the 10 km source shows
    north = np.clip((LAT + 18.5) / 5.5, 0, 1) * land * (LON > 120) * (LON < 146) * (LAT < -10.5)
    north = ndi.gaussian_filter(north.astype(np.float32), 3)[..., None]
    col = col * (1 - 0.28 * north) + np.array([0.33, 0.42, 0.17], np.float32) * (0.28 * north)
    # terrain-coupled albedo: ridges/ranges read rockier + redder, plains carry fine mottling
    ridge = np.clip((El - ndi.gaussian_filter(El, 3)) / 25.0, -1, 1) * land
    rock = np.array([0.55, 0.30, 0.18], np.float32)
    rw = np.clip(ridge, 0, 1)[..., None] * 0.22
    col = col * (1 - rw) + rock * rw
    # satellite grain: fine speckle + savanna mottling (olive <-> tan), low amplitude
    n = fbm(h, w, seed=z * 7 + len(name), scales=(2, 4, 9, 22), weights=(0.35, 0.3, 0.2, 0.15))
    col *= (1 + 0.05 * n)[..., None]
    n2 = fbm(h, w, seed=z * 13 + 3, scales=(12, 30, 70), weights=(0.4, 0.35, 0.25))
    tan = np.array([0.66, 0.50, 0.32], np.float32)
    olive = np.array([0.36, 0.40, 0.20], np.float32)
    mot = np.where(n2[..., None] > 0, tan, olive)
    mw = (np.minimum(np.abs(n2), 1.5) * 0.06)[..., None]
    col = col * (1 - mw) + mot * mw
    # inland water: very dark source pixels on land → lake blue (no black holes)
    lw = np.clip((0.13 - (sample_bm(LON, LAT) @ np.array([0.299, 0.587, 0.114], np.float32))) / 0.05, 0, 1) * land
    lw = ndi.gaussian_filter(lw.astype(np.float32), 1.0)[..., None]
    col = col * (1 - lw) + np.array([0.13, 0.33, 0.48], np.float32) * lw
    # vibrance (rich GeoGlobeTales land colour): lift saturation of muted pixels most
    l2 = col @ np.array([0.299, 0.587, 0.114], np.float32)
    chroma = np.abs(col - l2[..., None]).max(-1)
    vib = 1 + 0.55 * np.clip(1 - chroma / 0.25, 0, 1)
    col = np.clip(l2[..., None] + (col - l2[..., None]) * vib[..., None], 0, 1)
    col = np.clip((col - 0.5) * 1.08 + 0.5, 0, 1)  # gentle contrast
    col *= shade[..., None]
    lumc = col @ np.array([0.299, 0.587, 0.114], np.float32)
    k = soft_clip(lumc) / np.maximum(lumc, 1e-4)
    col *= np.minimum(k, 1)[..., None]

    # --- ocean: depth ramp + faint bathymetric relief
    d = np.clip(-E, 0, 9000)
    dl = np.log10(1 + d)
    oc = ramp(dl, [(0.0, '#286a8e'), (1.0, '#205a83'), (1.7, '#1a4b76'), (2.3, '#15406a'),
                   (2.9, '#11355f'), (3.4, '#0c2a50'), (3.7, '#0a2244'), (4.0, '#081b3a')])
    bgy, bgx = np.gradient(ndi.gaussian_filter(-d, 1.5))
    bhs = np.clip((bgx * -1 + bgy * -1) / (mpp * 0.02 + 1e-3), -1, 1)
    oc *= (1 + 0.06 * bhs)[..., None]
    oc *= (1 + 0.012 * fbm(h, w, seed=99, scales=(20, 60, 160), weights=(0.3, 0.4, 0.3)))[..., None]
    # shallow coastal sheen right at the shore
    dist = ndi.distance_transform_edt(ocean)
    sheen = np.exp(-dist / 2.2) * ocean
    oc = oc * (1 - 0.25 * sheen[..., None]) + np.array([0.33, 0.55, 0.62]) * (0.25 * sheen[..., None])

    lm = ndi.gaussian_filter(land.astype(np.float32), 0.55)[..., None]
    rgb = np.clip(col * lm + oc * (1 - lm), 0, 1)
    img = (rgb * 255 + 0.5).astype(np.uint8)
    path = os.path.join(OUT, f'{name}.{fmt}')
    if feather:
        yy = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None]
        xx = np.minimum(np.arange(w), np.arange(w)[::-1])[None, :]
        a = np.clip(np.minimum(yy, xx) / feather, 0, 1)
        a = a * a * (3 - 2 * a)
        alpha = (a * 255).astype(np.uint8)
        Image.fromarray(np.dstack([img, alpha]), 'RGBA').save(path, quality=90, method=5)
    elif fmt == 'jpg':
        Image.fromarray(img).save(path, quality=92, optimize=True, progressive=True)
    else:
        Image.fromarray(img).save(path, quality=90, method=5)
    print('  wrote', path, os.path.getsize(path) // 1024, 'KB')
    return dict(name=name, file=f'map/{name}.{fmt}', z=z, X0=X0, Y0=Y0, w=w, h=h), (E, land, LON, LAT)

# ---------------------------------------------------------------- overlays on the aus6 grid
def overlays(meta, E, land, LON, LAT):
    h, w = land.shape
    # Northern Territory: west 129°E, south 26°S, east 138°E (to the Gulf coast)
    nt = land & (LON >= 129.0) & (LON <= 138.0) & (LAT >= -26.0) & (LAT <= -10.8)  # excludes New Guinea / Aru
    # keep only mainland-connected + islands north of 26S (Tiwi/Groote are NT; fine)
    a = ndi.gaussian_filter(nt.astype(np.float32), 1.2)
    edge = np.clip(ndi.gaussian_filter(nt.astype(np.float32), 1.0) * (1 - ndi.gaussian_filter(nt.astype(np.float32), 1.0)) * 4, 0, 1)
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 255, 214, 96
    rgba[..., 3] = (np.clip(a * 0.34 + edge * 0.9, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, 'nt_fill.webp'), quality=90)
    # Desert / arid interior from Blue Marble redness (data-driven), mainland only
    col = sample_bm(LON, LAT)
    red = (col[..., 0] - col[..., 1] * 0.92 - col[..., 2] * 0.15)
    # soft geographic weighting (no straight cut-offs), mainland interior only
    wgt = (np.clip((-LAT - 15.5) / 3.5, 0, 1) * np.clip((34.5 + LAT) / 3.5, 0, 1)
           * np.clip((LON - 114.0) / 4.0, 0, 1) * np.clip((150.5 - LON) / 4.0, 0, 1))
    inland = ndi.gaussian_filter(land.astype(np.float32), 6) > 0.97
    m = np.clip((red - 0.02) / 0.10, 0, 1) * wgt * inland
    m = ndi.gaussian_filter(m.astype(np.float32), 9)
    m = np.clip(m * 1.25, 0, 1) ** 1.2
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 255, 128, 40
    rgba[..., 3] = (m * 0.55 * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, 'desert.webp'), quality=88)

def border_points(meta_nt8, E, land, LON, LAT):
    """where 129°E and 138°E meet the north coast (from the same land mask)."""
    res = {}
    for lon in (129.0, 138.0):
        col = np.argmin(np.abs(LON[0] - lon))
        # walk north from 25°S until first ocean pixel
        rows = np.where(LAT[:, 0] <= -12.0)[0]
        start = np.argmin(np.abs(LAT[:, 0] + 25.0))
        r = start
        while r > 0 and land[r, col]:
            r -= 1
        res[str(lon)] = float(LAT[r + 1, 0])
    return res

def main():
    prepare_bm()
    meta = {'canvases': []}
    c, _ = render_canvas('asia5', 5, 86.0, 52.0, 170.0, -66.0, relief=9.0, fmt='jpg')
    meta['canvases'].append(c)
    c, (E6, land6, LON6, LAT6) = render_canvas('aus6', 6, 106.0, -2.0, 160.0, -47.0, relief=7.0, feather=40)
    meta['canvases'].append(c)
    overlays(c, E6, land6, LON6, LAT6)
    meta['overlay_grid'] = c
    c, _ = render_canvas('aus7', 7, 110.0, -6.0, 156.0, -44.5, relief=5.5, feather=56)
    meta['canvases'].append(c)
    c, (E8, land8, LON8, LAT8) = render_canvas('nt8', 8, 123.5, -8.6, 142.0, -29.5, relief=6.0, feather=64)
    meta['canvases'].append(c)
    meta['nt_border_coast_lat'] = border_points(c, E8, land8, LON8, LAT8)
    with open(os.path.join(OUT, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print(json.dumps(meta, indent=1))

if __name__ == '__main__':
    main()
