#!/usr/bin/env python3
"""
lf01 IF AUSTRALIA — parchment terrain tile pyramid (Web Mercator, 512 px tiles).

Sources (both free/open, fetched over HTTPS):
  * Elevation: AWS Terrain Tiles, "terrarium" encoding
      https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png
      (Mapzen / Open Data on AWS; mixed SRTM, GMTED2010, ETOPO1, etc. — see SOURCES.md)
  * Land / lakes / rivers: Natural Earth (public domain) GeoJSON from
      https://github.com/nvkelso/natural-earth-vector

Level L means a world that is 512 * 2**L pixels wide. Each L tile is built from
terrarium zoom L+1 (256 px tiles), with a one-tile ring of padding so hillshade,
coast ink and water lining are seamless across tile edges.

Look lock: soft mid-contrast parchment. Hillshade is clamped so relief never
blows out to white. Pure-sea tiles are not written (the renderer paints sea).

Usage:  python3 build-tiles.py <out_dir> <cache_dir> [levels…]
"""
import io, json, math, os, sys, threading, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

OUT = sys.argv[1]
CACHE = sys.argv[2]
LEVELS = [int(x) for x in sys.argv[3:]] or list(range(2, 11))
HERE = os.path.dirname(os.path.abspath(__file__))
GEO = os.environ.get('NE_DIR', os.path.join(CACHE, 'ne'))
TS = 512
PAD = 256  # one terrarium tile at z=L+1 == 256 px of L space

# ---------------------------------------------------------------- coverage
# Boxes are (lon_w, lat_s, lon_e, lat_n). lon may be < -180 / > 180 is not used;
# boxes that cross the antimeridian are split by hand.
WORLD = [(-180, -85, 180, 85)]
COVER = {
    2: WORLD,
    3: WORLD,
    4: [(-180, -60, 180, 72)],
    5: [(85, -50, 180, 50), (-180, -50, -110, 50), (25, 0, 60, 45), (-12, 35, 25, 60)],
    6: [(95, -48, 180, 42), (-180, -25, -150, 32), (-125, 30, -115, 40)],
    7: [(108, -47, 180, 5), (128, 30, 146, 42), (98, -2, 108, 8), (110, 18, 118, 26),
        (-180, -20, -168, -10), (-178.5, 27.5, -176, 29), (-160.5, 18.5, -154.5, 22.5)],
    8: [(128, -17.5, 137, -10), (131.5, -25, 136, -17), (132.5, -25, 135, -23),
        (149, -35.5, 154, -26.5), (144, -38.6, 146, -37.4),
        (145, -11.5, 152, -6), (138.5, 34.5, 141, 36.5), (102.5, 0.5, 105, 2.5),
        (-178, 27.8, -176.6, 28.6), (-158.5, 21, -157.5, 21.8)],
    9: [(129.8, -12.9, 131.8, -11.0), (150.9, -34.2, 151.9, -32.7), (146.8, -9.9, 148.4, -8.5),
        (139.4, 35.3, 140.2, 35.9), (103.5, 1.1, 104.2, 1.6), (-177.6, 28.1, -177.2, 28.35),
        (-158.2, 21.2, -157.8, 21.5), (133.0, -20.5, 134.5, -18.5)],
    10: [(151.1, -33.95, 151.35, -33.75), (130.75, -12.55, 130.98, -12.36),
         (147.55, -9.05, 147.95, -8.75), (-177.45, 28.18, -177.3, 28.27),
         (139.6, 35.6, 139.85, 35.75), (103.75, 1.22, 103.95, 1.35), (130.3, -11.5, 130.8, -11.25)],
}

def lon2x(lon, W):
    return (lon + 180.0) / 360.0 * W

def lat2y(lat, W):
    lat = max(-85.05, min(85.05, lat))
    s = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return (1 - s / math.pi) / 2 * W

def tiles_for(L):
    W = TS * 2 ** L
    n = 2 ** L
    out = set()
    for (w, s, e, nn) in COVER[L]:
        x0 = int(lon2x(w, W) // TS); x1 = int(min(lon2x(e, W), W - 1) // TS)
        y0 = int(lat2y(nn, W) // TS); y1 = int(min(lat2y(s, W), W - 1) // TS)
        for x in range(max(0, x0), min(n - 1, x1) + 1):
            for y in range(max(0, y0), min(n - 1, y1) + 1):
                out.add((x, y))
    return sorted(out)

# ---------------------------------------------------------------- vectors
def load_polys(name):
    d = json.load(open(os.path.join(GEO, name + '.geojson')))
    polys = []
    for f in d['features']:
        g = f['geometry']
        if g is None:
            continue
        parts = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']] if g['type'] == 'Polygon' else []
        for p in parts:
            arr = [np.asarray(r, dtype=np.float64) for r in p]
            bb = (arr[0][:, 0].min(), arr[0][:, 1].min(), arr[0][:, 0].max(), arr[0][:, 1].max())
            polys.append((bb, arr, f['properties']))
    return polys

def load_lines(name):
    d = json.load(open(os.path.join(GEO, name + '.geojson')))
    lines = []
    for f in d['features']:
        g = f['geometry']
        if g is None:
            continue
        parts = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for p in parts:
            a = np.asarray(p, dtype=np.float64)
            bb = (a[:, 0].min(), a[:, 1].min(), a[:, 0].max(), a[:, 1].max())
            lines.append((bb, a, f['properties']))
    return lines

LAND = {}
def land_for(L):
    key = 'ne_110m_land' if L <= 2 else 'ne_50m_land' if L <= 4 else 'ne_10m_land'
    if key not in LAND:
        LAND[key] = load_polys(key)
        if key == 'ne_10m_land':
            LAND[key] += load_polys('ne_10m_minor_islands')
    return LAND[key]

LAKES = load_polys('ne_50m_lakes')
RIVERS = load_lines('ne_50m_rivers_lake_centerlines')

def tile_bbox_lonlat(L, x0px, y0px, size):
    W = TS * 2 ** L
    def x2lon(x): return x / W * 360 - 180
    def y2lat(y): return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / W))))
    return x2lon(x0px), y2lat(y0px + size), x2lon(x0px + size), y2lat(y0px)

def raster_polys(polys, L, x0px, y0px, size, scale=1):
    """Rasterise polygons (holes honoured) into a size×size mask in L pixel space."""
    W = TS * 2 ** L
    w, s, e, n = tile_bbox_lonlat(L, x0px, y0px, size)
    m = Image.new('L', (size * scale, size * scale), 0)
    dr = ImageDraw.Draw(m)
    hit = False
    for bb, rings, props in polys:
        if bb[2] < w - 0.5 or bb[0] > e + 0.5 or bb[3] < s - 0.5 or bb[1] > n + 0.5:
            continue
        hit = True
        for i, r in enumerate(rings):
            xs = (r[:, 0] + 180.0) / 360.0 * W - x0px
            lat = np.clip(r[:, 1], -85.05, 85.05)
            ys = (1 - np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) / np.pi) / 2 * W - y0px
            pts = list(zip((xs * scale).tolist(), (ys * scale).tolist()))
            if len(pts) >= 3:
                dr.polygon(pts, fill=255 if i == 0 else 0)
    if not hit:
        return None
    if scale > 1:
        m = m.resize((size, size), Image.BOX)
    return np.asarray(m, dtype=np.float32) / 255.0

# ---------------------------------------------------------------- elevation
_lock = threading.Lock()
def terrarium(z, x, y):
    n = 2 ** z
    x %= n
    if y < 0 or y >= n:
        return np.full((256, 256), -4000.0, np.float32)
    p = os.path.join(CACHE, 'terrarium', str(z), f'{x}_{y}.png')
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        url = f'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
        for attempt in range(4):
            try:
                data = urllib.request.urlopen(url, timeout=60).read()
                Image.open(io.BytesIO(data)).verify()
                break
            except Exception as ex:  # noqa
                if attempt == 3:
                    raise
        Image.open(io.BytesIO(data)).verify()
        tmp = f'{p}.{threading.get_ident()}.tmp'
        with open(tmp, 'wb') as fh:
            fh.write(data)
        os.replace(tmp, p)
    a = np.asarray(Image.open(p).convert('RGB'), dtype=np.float32)
    return a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768

def elev_block(L, tx, ty):
    """Elevation (m) for an L tile with 256 px padding: 1024×1024."""
    z = L + 1
    rows = []
    for j in range(-1, 3):
        rows.append(np.concatenate([terrarium(z, 2 * tx + i, 2 * ty + j) for i in range(-1, 3)], axis=1))
    return np.concatenate(rows, axis=0)

# ---------------------------------------------------------------- global low-frequency fields
# Equirectangular 0.25° grids: aridity tint and parchment mottling (world-space, so they
# move with the map like stains on a real sheet).
GRID_RES = 0.25
GW, GH = int(360 / GRID_RES), int(180 / GRID_RES)

def build_fields():
    arid = Image.new('L', (GW, GH), 0)
    d = ImageDraw.Draw(arid)
    def poly(pts, v=255):
        d.polygon([((lo + 180) / GRID_RES, (90 - la) / GRID_RES) for lo, la in pts], fill=v)
    # Australian interior (the script's "vast orange interior")
    poly([(114.5, -21.5), (119, -19.5), (124, -18.5), (128.5, -17.8), (133, -17.2), (137, -17.6), (140.5, -19.5),
          (143.5, -22.5), (145, -26.5), (144, -30), (141, -32), (138.5, -32.5), (135, -31.8), (131, -31.2),
          (126, -31.3), (121, -30.5), (117, -28.5), (114.8, -25)])
    poly([(-17, 14), (10, 16), (35, 14), (45, 12), (55, 16), (60, 24), (62, 30), (50, 33), (36, 31.5),
          (25, 31), (10, 31), (-5, 30), (-15, 27)])  # Sahara / Arabia
    poly([(56, 36), (70, 37), (80, 36), (92, 37), (105, 39), (112, 41), (115, 44), (106, 46), (92, 44), (78, 43),
          (64, 44), (55, 42)], 200)  # Central Asian deserts
    poly([(-120, 33), (-112, 30), (-104, 30), (-103, 37), (-108, 42), (-118, 41)], 170)  # US south-west
    a = np.asarray(arid.filter(ImageFilter.GaussianBlur(10)), dtype=np.float32) / 255
    rng = np.random.default_rng(1942)
    mott = np.zeros((GH, GW), np.float32)
    for sc, amp in ((90, 1.0), (40, 0.55), (16, 0.3), (6, 0.15)):
        small = rng.standard_normal((GH // sc + 2, GW // sc + 2)).astype(np.float32)
        up = np.asarray(Image.fromarray(small).resize((GW + 2 * sc, GH + 2 * sc), Image.BICUBIC))[sc:sc + GH, sc:sc + GW]
        mott += amp * up
    mott /= np.abs(mott).max()
    return a, mott

ARID, MOTT = build_fields()

def sample_field(F, lon, lat):
    gx = (lon + 180) / GRID_RES
    gy = (90 - lat) / GRID_RES
    return ndimage.map_coordinates(F, [gy.ravel(), (gx % GW).ravel()], order=1, mode='nearest').reshape(lon.shape)

# ---------------------------------------------------------------- styling
PAPER = np.array([233, 221, 192], np.float32)
SEA = np.array([181, 190, 173], np.float32)       # muted parchment sea (blue-green-grey)
SEA_LINE = np.array([122, 138, 126], np.float32)
LAND_LOW = np.array([222, 205, 160], np.float32)
LAND_HUMID = np.array([200, 196, 150], np.float32)
LAND_ARID = np.array([222, 168, 108], np.float32)  # orange interior
LAND_HIGH = np.array([176, 146, 104], np.float32)
INK = np.array([84, 66, 48], np.float32)
LAKE = np.array([196, 205, 192], np.float32)
SALT = np.array([214, 200, 168], np.float32)
RIVER = np.array([128, 146, 140], np.float32)

def hillshade(el, mpp, exag):
    gy, gx = np.gradient(el * exag, mpp)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    out = np.zeros_like(el)
    for az, alt, w in ((315, 45, 0.6), (270, 50, 0.2), (360, 50, 0.2)):
        a, z = math.radians(az), math.radians(alt)
        out += w * (np.sin(z) * np.cos(slope) + np.cos(z) * np.sin(slope) * np.cos(a - aspect))
    flat = math.sin(math.radians(46))
    return out - flat  # 0 on flat ground

def style_tile(L, tx, ty):
    W = TS * 2 ** L
    x0, y0 = tx * TS - PAD, ty * TS - PAD
    size = TS + 2 * PAD
    land = raster_polys(land_for(L), L, x0, y0, size, scale=2 if L >= 5 else 1)
    has_land_vec = land is not None and land.max() > 0.01
    use_elev_mask = L >= 8
    if not has_land_vec and not use_elev_mask:
        return None
    el = elev_block(L, tx, ty).astype(np.float32)
    if use_elev_mask:
        m = (ndimage.gaussian_filter(el, 0.8) > 0.5).astype(np.float32)
        m = ndimage.binary_opening(m > 0.5, iterations=1).astype(np.float32)
        land = ndimage.gaussian_filter(m, 0.7)
    if land is None or land.max() < 0.01:
        return None
    # pixel lon/lat
    xs = np.arange(size) + x0 + 0.5
    ys = np.arange(size) + y0 + 0.5
    lon = xs / W * 360 - 180
    lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * ys / W))))
    LON, LAT = np.meshgrid(lon, lat)
    mpp = 40075016.0 * np.cos(np.radians(lat.mean())) / W
    elL = np.where(land > 0.5, np.maximum(el, 0), 0)
    elL = ndimage.gaussian_filter(elL, 1.0)
    exag = {2: 9, 3: 7, 4: 5.5, 5: 4.2, 6: 3.4, 7: 2.8, 8: 2.3, 9: 2.0, 10: 1.8}[L]
    hs = hillshade(elL, mpp, exag)
    shade = np.clip(1 + 0.55 * hs, 0.74, 1.05)  # clamp: no white glare, no black pits

    arid = sample_field(ARID, LON, LAT)
    humid = np.clip(1 - np.abs(LAT) / 22, 0, 1) * (1 - arid)
    mott = sample_field(MOTT, LON, LAT)
    hnorm = np.clip(elL / 2200.0, 0, 1) ** 0.7
    base = LAND_LOW[None, None] * (1 - arid[..., None]) + LAND_ARID[None, None] * arid[..., None]
    base = base * (1 - 0.6 * humid[..., None]) + LAND_HUMID[None, None] * (0.6 * humid[..., None])
    base = base * (1 - hnorm[..., None] * 0.75) + LAND_HIGH[None, None] * (hnorm[..., None] * 0.75)
    landc = base * shade[..., None]

    # sea + water lining (classic engraved offshore lines), widths in px of this level
    seam = land < 0.5
    dist = ndimage.distance_transform_edt(seam).astype(np.float32)
    sea = np.broadcast_to(SEA, landc.shape).copy()
    sea *= (1 - 0.06 * np.clip(dist / 60, 0, 1))[..., None]  # slight deepening offshore
    # suppress lining around specks at small scales (reads as stains otherwise)
    big = ndimage.binary_opening(~seam, iterations=3 if L <= 4 else 1)
    dist_big = ndimage.distance_transform_edt(~big).astype(np.float32) if big.any() else dist + 1e9
    lin_k = 0.8 if L <= 3 else 1.05 if L <= 5 else 1.2
    for d0, wv, a in ((4.5, 1.0, 0.42), (9.0, 0.9, 0.28), (15.0, 0.85, 0.16)):
        ring = np.clip(1 - np.abs(dist_big - d0) / wv, 0, 1) * a * lin_k
        sea = sea * (1 - ring[..., None]) + SEA_LINE * ring[..., None]

    img = sea * (1 - land[..., None]) + landc * land[..., None]

    # inner coastal wash + ink coastline
    dland = ndimage.distance_transform_edt(land >= 0.5).astype(np.float32)
    wash = np.clip(1 - dland / 7.0, 0, 1) * 0.10 * (land > 0.5)
    img *= (1 - wash)[..., None]
    gy_, gx_ = np.gradient(ndimage.gaussian_filter(land, 0.75))
    edge = np.clip(np.hypot(gx_, gy_) * (2.0 if L >= 6 else 1.7), 0, 1)
    img = img * (1 - 0.78 * edge[..., None]) + INK * (0.78 * edge[..., None])

    # lakes and rivers (vector, light touch)
    if L >= 3:
        lk = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        dr = ImageDraw.Draw(lk)
        w, s, e, n = tile_bbox_lonlat(L, x0, y0, size)
        for bb, rings, props in LAKES:
            if bb[2] < w or bb[0] > e or bb[3] < s or bb[1] > n:
                continue
            col = SALT if props.get('featurecla') == 'Alkaline Lake' else LAKE
            for i, r in enumerate(rings):
                px = [(lon2x(a, W) - x0, lat2y(b, W) - y0) for a, b in r]
                if len(px) > 2:
                    dr.polygon(px, fill=tuple(int(c) for c in col) + (255 if i == 0 else 0,),
                               outline=tuple(int(c) for c in INK) + (110,))
        if L >= 4:
            rw = max(1, int(round((L - 2) * 0.5)))
            for bb, a, props in RIVERS:
                if bb[2] < w or bb[0] > e or bb[3] < s or bb[1] > n:
                    continue
                px = [(lon2x(p[0], W) - x0, lat2y(p[1], W) - y0) for p in a]
                dr.line(px, fill=tuple(int(c) for c in RIVER) + (150,), width=rw)
        la = np.asarray(lk, dtype=np.float32)
        al = la[:, :, 3:4] / 255
        img = img * (1 - al) + la[:, :, :3] * al

    # parchment mottling (world-space stains), very gentle
    img *= (1 + 0.035 * mott * np.clip(land * 1.5, 0, 1))[..., None]  # land only: open sea must match the renderer's flat sea
    img = np.clip(img, 0, 238)  # hard ceiling: nothing reaches glare white
    crop = img[PAD:PAD + TS, PAD:PAD + TS]
    return Image.fromarray(crop.astype(np.uint8), 'RGB')

def build_one(L, tx, ty):
    p = os.path.join(OUT, str(L), f'{tx}_{ty}.jpg')
    if os.path.exists(p):
        return (tx, ty, True)
    im = style_tile(L, tx, ty)
    if im is None:
        return (tx, ty, False)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p, quality=84, optimize=True, progressive=False)
    return (tx, ty, True)

def main():
    manifest_p = os.path.join(OUT, 'manifest.json')
    manifest = json.load(open(manifest_p)) if os.path.exists(manifest_p) else {}
    for L in LEVELS:
        tl = tiles_for(L)
        print(f'L{L}: {len(tl)} candidate tiles', flush=True)
        done = []
        with ThreadPoolExecutor(max_workers=int(os.environ.get('JOBS', '6'))) as ex:
            for i, (tx, ty, ok) in enumerate(ex.map(lambda t: build_one(L, *t), tl)):
                if ok:
                    done.append([tx, ty])
                if i % 50 == 0:
                    print(f'  L{L} {i}/{len(tl)}', flush=True)
        manifest[str(L)] = sorted(done)
        print(f'L{L}: wrote {len(done)} land tiles', flush=True)
        json.dump(manifest, open(manifest_p, 'w'))

if __name__ == '__main__':
    main()
