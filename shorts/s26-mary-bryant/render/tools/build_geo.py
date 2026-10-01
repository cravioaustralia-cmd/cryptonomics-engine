#!/usr/bin/env python3
"""
s26 — vector data for the map (Natural Earth 1:10m, public domain) + hand-placed
sea routes, validated so no densified route point sits on land.

Writes render/geo.json:
  coast.*   simplified outlines [[lon,lat],...] for glow borders / highlights
  reefs     Great Barrier Reef lines
  routes.*  waypoint lists [[lon,lat],...]
"""
import json, math, os, sys
import numpy as np

SP = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sp'
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def load(name):
    return json.load(open(f'{SP}/ne/{name}.geojson'))['features']

def polys_of(geom):
    if geom['type'] == 'Polygon': return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon': return geom['coordinates']
    return []

def rdp(pts, eps):
    pts = np.asarray(pts, float)
    if len(pts) > 3 and np.allclose(pts[0], pts[-1]):  # closed ring: split at the far point
        k = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
        a, b = rdp(pts[:k + 1], eps), rdp(pts[k:], eps)
        return np.vstack([a, b[1:]])
    if len(pts) < 3: return pts
    keep = np.zeros(len(pts), bool); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        p, q = pts[a], pts[b]
        d = q - p; n = math.hypot(*d) or 1e-12
        seg = pts[a + 1:b]
        dist = np.abs(d[0] * (seg[:, 1] - p[1]) - d[1] * (seg[:, 0] - p[0])) / n
        i = int(np.argmax(dist))
        if dist[i] > eps:
            keep[a + 1 + i] = True
            stack += [(a, a + 1 + i), (a + 1 + i, b)]
    return pts[keep]

LAND = []
for f in ('ne_10m_land', 'ne_10m_minor_islands'):
    for ft in load(f):
        for p in polys_of(ft['geometry']):
            LAND.append(np.asarray(p[0], float))

def rings_in(lon0, lon1, lat0, lat1, min_pts=0, min_extent=0.0):
    out = []
    for r in LAND:  # ring bbox must sit inside the requested bbox
        if r[:, 0].min() < lon0 or r[:, 0].max() > lon1 or r[:, 1].min() < lat1 or r[:, 1].max() > lat0: continue
        ext = max(np.ptp(r[:, 0]), np.ptp(r[:, 1]))
        if len(r) >= min_pts and ext >= min_extent: out.append(r)
    return out

from PIL import Image, ImageDraw
RES = 0.02
_mask = Image.new('L', (int(360 / RES), int(180 / RES)), 0)
_d = ImageDraw.Draw(_mask)
for r in LAND:
    _d.polygon([((x + 180) / RES, (90 - y) / RES) for x, y in r], fill=1)
MASK = np.asarray(_mask)

def on_land(lon, lat):
    i, j = int((90 - lat) / RES), int((lon + 180) / RES)
    if not MASK[max(0, i - 1):i + 2, max(0, j - 1):j + 2].any(): return False
    return on_land_exact(lon, lat)

def on_land_exact(lon, lat):
    for r in LAND:
        if not (r[:, 0].min() <= lon <= r[:, 0].max() and r[:, 1].min() <= lat <= r[:, 1].max()): continue
        x, y = r[:, 0], r[:, 1]
        x2, y2 = np.roll(x, -1), np.roll(y, -1)
        c = ((y > lat) != (y2 > lat)) & (lon < (x2 - x) * (lat - y) / (y2 - y + 1e-15) + x)
        if c.sum() % 2: return True
    return False

def densify(wp, step_km=4):
    out = []
    for (a, b) in zip(wp[:-1], wp[1:]):
        d = hav(a, b); n = max(1, int(d / step_km))
        for i in range(n):
            t = i / n; out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    out.append(tuple(wp[-1])); return out

def hav(a, b):
    R = 6371.0
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dl = math.radians(b[0] - a[0])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

# ---------------- routes (lon, lat) ----------------
ESCAPE = [  # Sydney Cove → Port Jackson heads → inside the reef → Cape York → Arafura → Kupang
    (151.211, -33.856), (151.232, -33.851), (151.258, -33.846), (151.272, -33.838), (151.288, -33.830),
    (151.33, -33.83), (151.45, -33.62), (151.68, -33.18), (152.0, -32.98), (152.35, -32.78),
    (152.75, -32.2), (153.15, -31.4), (153.32, -30.6), (153.5, -29.6), (153.82, -28.62),
    (153.72, -27.8), (153.6, -27.0), (153.42, -26.2), (153.42, -25.3), (153.35, -24.62),
    (152.4, -24.0), (151.6, -23.4), (151.2, -22.6), (150.65, -21.9), (149.9, -21.1),
    (149.3, -20.32), (148.45, -19.6), (147.45, -19.0), (146.6, -18.3), (146.35, -17.3),
    (145.98, -16.6), (145.6, -15.6), (145.55, -14.9), (144.9, -14.05), (144.05, -13.25),
    (143.7, -12.4), (143.25, -11.6), (142.9, -11.0), (142.72, -10.55), (142.47, -10.61),
    (142.37, -10.72), (142.29, -10.81), (141.95, -10.86), (141.1, -10.92), (140.0, -11.0), (138.5, -10.95),
    (137.0, -10.8), (136.0, -10.6), (134.5, -10.6), (133.0, -10.55), (131.5, -10.5),
    (130.0, -10.55), (128.5, -10.65), (127.0, -10.6), (125.8, -10.45), (125.0, -10.4),
    (124.3, -10.55), (123.85, -10.45), (123.44, -10.36), (123.455, -10.30),
    (123.465, -10.24), (123.51, -10.20), (123.535, -10.17), (123.565, -10.163),
]
FIRST_FLEET = [  # Portsmouth → Tenerife → Rio → Cape → Southern Ocean → Botany Bay/Port Jackson (soft arc)
    (-1.1, 50.78), (-0.95, 50.62), (-3.5, 49.6), (-9.5, 45.5), (-13.5, 37.0), (-16.05, 28.3), (-21.5, 15.0),
    (-27.0, 2.0), (-33.0, -10.0), (-38.5, -18.5), (-40.0, -23.3), (-43.15, -23.05), (-36.0, -29.5),
    (-15.0, -34.5), (5.0, -35.5), (17.9, -33.9), (18.38, -33.88), (17.9, -34.3), (18.4, -34.6), (20.0, -35.2), (35.0, -38.0), (60.0, -41.0), (90.0, -42.5),
    (115.0, -42.0), (135.0, -43.5), (147.5, -44.2), (150.5, -40.0), (151.4, -36.0), (151.33, -33.83),
    (151.288, -33.830), (151.272, -33.838), (151.258, -33.846), (151.232, -33.851), (151.211, -33.856),
]
RETURN = [  # Kupang → (Dutch ship) Batavia → Sunda Strait → Cape Town → Atlantic → England → London
    (123.565, -10.163), (123.535, -10.17), (123.51, -10.20), (123.465, -10.24),
    (123.455, -10.30), (123.44, -10.36), (123.3, -10.42), (122.5, -10.7), (119.0, -10.3), (115.5, -9.2),
    (111.0, -8.9), (107.5, -8.2), (105.0, -7.0), (105.05, -6.3), (105.25, -6.18), (105.42, -6.2), (105.62, -6.0), (105.9, -5.85), (106.3, -5.88),
    (106.6, -5.95), (106.80, -6.07), (106.6, -5.95), (106.3, -5.88), (105.9, -5.85), (105.62, -6.0), (105.42, -6.2), (105.25, -6.18),
    (105.05, -6.3), (104.9, -7.2), (100.0, -12.0), (85.0, -22.0),
    (60.0, -32.0), (40.0, -36.5), (25.0, -37.0), (20.0, -35.2), (18.4, -34.6), (17.9, -34.3), (18.38, -33.88), (17.9, -33.7),
    (12.0, -26.0), (4.0, -17.0), (-6.0, -6.0), (-15.5, 6.0), (-21.0, 20.0), (-21.5, 32.0),
    (-13.0, 45.5), (-6.5, 49.2), (-2.0, 50.2), (1.4, 50.9), (1.45, 51.42), (0.6, 51.48), (-0.1, 51.505),
]
PANDORA = [  # Pandora wreck (Pandora Entrance, GBR) → boats through Torres Strait → Kupang
    (143.94, -11.38), (143.4, -11.05), (142.95, -10.7), (142.72, -10.55), (142.47, -10.61),
    (142.37, -10.72), (142.29, -10.81), (141.95, -10.86), (140.5, -10.6), (138.0, -10.3), (135.0, -10.0),
    (131.5, -10.0), (128.5, -10.4), (126.5, -10.6), (125.0, -10.42), (124.3, -10.57), (123.85, -10.47),
    (123.44, -10.37), (123.455, -10.30), (123.465, -10.24), (123.51, -10.20), (123.535, -10.17), (123.565, -10.163),
]
NEXT_TEASE = [(-60.0, -15.0), (-48.0, -2.0), (-30.0, 8.0)]

routes = {'escape': ESCAPE, 'firstFleet': FIRST_FLEET, 'return': RETURN, 'pandora': PANDORA}
bad = 0
for name, wp in routes.items():
    pts = densify(wp, 3)
    tail = 60 if name == 'return' else 3  # last leg of the return goes up the Thames to London
    land = [p for p in pts[3:-tail] if on_land(*p)]  # endpoints are ports
    km = sum(hav(a, b) for a, b in zip(wp[:-1], wp[1:]))
    print(f'{name}: {km:,.0f} km, {len(land)} on-land pts', ('first ' + str(land[:4])) if land else '')
    bad += len(land)

# ---------------- coastlines ----------------
def simplify_rings(rings, eps):
    out = []
    for r in rings:
        s = rdp(r, eps)
        if len(s) >= 4: out.append([[round(x, 4), round(y, 4)] for x, y in s])
    return out

aus = rings_in(112, 154.5, -10.0, -44.5, min_extent=0.25)
aus_main = [r for r in aus if np.ptp(r[:, 0]) > 3]  # mainland + Tasmania
timor = [r for r in rings_in(123.3, 127.4, -8.2, -10.6) if np.ptp(r[:, 0]) > 2.5]
gb = [r for r in rings_in(-7, 2, 59, 49.8) if np.ptp(r[:, 1]) > 5]
reefs = []
for ft in load('ne_10m_reefs'):
    g = ft['geometry']
    lines = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
    for ln in lines:
        a = np.asarray(ln, float)
        if a[:, 0].min() > 141.5 and a[:, 0].max() < 155 and a[:, 1].max() < -8.5 and a[:, 1].min() > -25.5:
            s = rdp(a, 0.01)
            reefs.append([[round(x, 4), round(y, 4)] for x, y in s])

geo = {
    'coast': {
        'australia': simplify_rings(aus_main, 0.02),
        'australiaLo': simplify_rings(aus_main, 0.12),
        'timor': simplify_rings(timor, 0.01),
        'greatBritain': simplify_rings(gb, 0.02),
    },
    'reefs': reefs,
    'routes': {k: [[round(x, 4), round(y, 4)] for x, y in v] for k, v in routes.items()},
    'nextTease': NEXT_TEASE,
}
json.dump(geo, open(f'{EP}/render/geo.json', 'w'), separators=(',', ':'))
print('coast pts', {k: sum(len(r) for r in v) for k, v in geo['coast'].items()}, 'reef lines', len(reefs),
      'size', os.path.getsize(f'{EP}/render/geo.json') // 1024, 'KB')
sys.exit(1 if bad else 0)
