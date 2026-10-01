#!/usr/bin/env python3
"""
s27 — vector data for the map (Natural Earth, public domain) + hand-placed flight routes.

Writes render/geo.json:
  coast.*    simplified outlines [[[lon,lat],...], ...] for glow borders / region highlights
  routes.*   waypoint lists [[lon,lat],...]
  stops.*    named stops of the 1928 flight (lon, lat, day of February 1928)
  mary.*     Impossible Journeys ep.1 routes (copied from s26 geo.json) for the master map

1928 stops (Croydon 7 Feb → Darwin 22 Feb): Rome, Malta, Benghazi, Ramleh, Basra, Jask,
Karachi, Cawnpore, Calcutta, Rangoon, Victoria Point, Singapore, Batavia, Bima, Darwin.
1919 Ross & Keith Smith crew route (the 28-day record) for the comparison beat.
"""
import json, math, os, sys
import numpy as np

SP = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sp'
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def rdp(pts, eps):
    pts = np.asarray(pts, float)
    if len(pts) < 3: return pts
    if np.allclose(pts[0], pts[-1]) and len(pts) > 4:
        k = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
        a, b = rdp(pts[:k + 1], eps), rdp(pts[k:], eps)
        return np.vstack([a, b[1:]])
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


def polys(geom):
    if geom['type'] == 'Polygon': return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon': return geom['coordinates']
    return []


COUNTRIES = json.load(open(f'{SP}/ne/ne_50m_admin_0_countries.geojson'))['features']
COUNTRIES10 = json.load(open(f'{SP}/ne/ne_10m_admin_0_countries.geojson'))['features']


def country(names, eps, min_extent=0.0, src=COUNTRIES):
    out = []
    for ft in src:
        if ft['properties']['ADMIN'] not in names: continue
        for p in polys(ft['geometry']):
            r = np.asarray(p[0], float)
            if max(np.ptp(r[:, 0]), np.ptp(r[:, 1])) < min_extent: continue
            s = rdp(r, eps)
            if len(s) >= 4: out.append([[round(x, 3), round(y, 3)] for x, y in s])
    return out


coast = {
    'uk': country({'United Kingdom'}, 0.02, 0.3),
    'italy': country({'Italy'}, 0.02, 0.15),
    'nafrica': country({'Libya', 'Egypt'}, 0.04),
    'india': country({'India'}, 0.04, 0.3),
    'burma': country({'Myanmar'}, 0.03, 0.3),
    'indonesia': country({'Indonesia'}, 0.03, 0.25),
    'australia': country({'Australia'}, 0.02, 0.5),
    'australiaLo': country({'Australia'}, 0.12, 2.0),
    'tuscany': [],
}

# 1928 — Croydon → Darwin (dates: day of February 1928 on arrival)
STOPS = [
    ('London', -0.117, 51.357, 7), ('Rome', 12.5, 41.9, 8), ('Malta', 14.5, 35.9, 9),
    ('Benghazi', 20.07, 32.1, 10), ('Ramleh', 34.87, 31.93, 11), ('Basra', 47.8, 30.5, 12),
    ('Jask', 57.77, 25.65, 13), ('Karachi', 67.0, 24.86, 14), ('Cawnpore', 80.33, 26.45, 15),
    ('Calcutta', 88.36, 22.57, 16), ('Rangoon', 96.15, 16.8, 17), ('Victoria Point', 98.55, 9.98, 18),
    ('Singapore', 103.82, 1.35, 19), ('Batavia', 106.8, -6.2, 20), ('Bima', 118.73, -8.46, 21),
    ('Darwin', 130.85, -12.43, 22),
]
flight = []
for i, (n, lo, la, d) in enumerate(STOPS):
    if i:
        lo0, la0 = flight[-1]
        # gentle bow on each leg so the line reads as a flown path, not a ruler
        steps = 24
        dx, dy = lo - lo0, la - la0
        L = math.hypot(dx, dy)
        bow = 0.035 * L * (1 if i % 2 else -1)
        for k in range(1, steps + 1):
            f = k / steps
            off = math.sin(f * math.pi) * bow
            flight.append([round(lo0 + dx * f - dy / L * off, 4), round(la0 + dy * f + dx / L * off, 4)])
    else:
        flight.append([lo, la])

CREW1919 = [(-0.37, 51.47), (4.85, 45.75), (12.5, 41.9), (17.24, 40.47), (24.1, 35.5), (31.24, 30.04),
            (36.29, 33.51), (43.3, 33.42), (47.8, 30.5), (56.27, 27.18), (67.0, 24.86), (77.2, 28.6),
            (81.85, 25.43), (88.36, 22.57), (92.9, 20.15), (96.15, 16.8), (100.5, 13.75), (100.6, 7.2),
            (103.82, 1.35), (106.8, -6.2), (112.75, -7.25), (118.73, -8.46), (124.9, -9.1), (130.85, -12.43)]

# 1933 — London → over France and the Alps → Pratomagno (Tuscany)
PRATOMAGNO = (11.62, 43.68)
FLORENCE = (11.236, 43.745)
F1933 = [(-0.117, 51.357), (1.0, 50.3), (2.6, 48.7), (4.5, 47.0), (6.2, 45.9), (7.6, 45.1),
         (9.3, 44.4), (10.6, 44.0), PRATOMAGNO]


def great_circle(a, b, n=120):
    lo1, la1, lo2, la2 = map(math.radians, (*a, *b))
    p1 = np.array([math.cos(la1) * math.cos(lo1), math.cos(la1) * math.sin(lo1), math.sin(la1)])
    p2 = np.array([math.cos(la2) * math.cos(lo2), math.cos(la2) * math.sin(lo2), math.sin(la2)])
    om = math.acos(np.clip(p1 @ p2, -1, 1))
    out = []
    for k in range(n + 1):
        f = k / n
        p = (math.sin((1 - f) * om) * p1 + math.sin(f * om) * p2) / math.sin(om)
        out.append([round(math.degrees(math.atan2(p[1], p[0])), 3), round(math.degrees(math.asin(p[2])), 3)])
    return out


BUNDABERG = (152.349, -24.866)
mary = json.load(open(f'{SP}/mary_routes.json'))
geo = dict(
    coast=coast,
    routes=dict(flight=flight, crew1919=[list(p) for p in CREW1919], f1933=[list(p) for p in F1933],
                home=great_circle(FLORENCE, BUNDABERG)),
    stops=[dict(name=n, lon=lo, lat=la, day=d) for n, lo, la, d in STOPS],
    places=dict(london=[-0.117, 51.357], bundaberg=list(BUNDABERG), monRepos=[152.437, -24.802],
                darwin=[130.85, -12.43], pratomagno=list(PRATOMAGNO), florence=list(FLORENCE)),
    mary=mary,
)
json.dump(geo, open(f'{EP}/render/geo.json', 'w'), separators=(',', ':'))
print({k: len(v) for k, v in coast.items()}, len(flight), 'flight pts',
      os.path.getsize(f'{EP}/render/geo.json') // 1024, 'KB')
