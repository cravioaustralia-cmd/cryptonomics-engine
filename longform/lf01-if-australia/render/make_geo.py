"""Vector geography for scenes.js -> assets/geo.js (window.GEO). Natural Earth (public domain).

coast : inked coastline path in map units (finer in the Asia-Pacific theatre, coarser elsewhere)
aus   : Australian mainland + Tasmania (for pale / dim / brighten / warm effects)
usa   : contiguous United States outline at TRUE relative size, in map units centred on (0,0),
        scaled for Australia's latitude so the V24 overlay compares real areas.
"""
import json, math, os
import numpy as np
from layers import LON0, LAT0, COS

NE = os.environ.get('NE', '/tmp/claude-0/geo/ne')
HERE = os.path.dirname(os.path.abspath(__file__))


def dp(pts, eps):
    if len(pts) < 3:
        return pts
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i0, i1 = stack.pop()
        if i1 <= i0 + 1:
            continue
        a, b = pts[i0], pts[i1]
        ab = b - a
        L = math.hypot(*ab)
        v = pts[i0 + 1:i1] - a
        d = np.abs(ab[0] * v[:, 1] - ab[1] * v[:, 0]) / L if L > 1e-12 else np.hypot(v[:, 0], v[:, 1])
        k = int(d.argmax())
        if d[k] > eps:
            m = i0 + 1 + k
            keep[m] = True
            stack += [(i0, m), (m, i1)]
    return pts[keep]


def to_uv(r):
    return np.stack([(r[:, 0] - LON0) * COS, LAT0 - r[:, 1]], 1)


def d_of(rings):
    out = []
    for r in rings:
        if len(r) < 3:
            continue
        out.append('M' + 'L'.join(f'{x:.3f},{y:.3f}' for x, y in r) + 'Z')
    return ''.join(out)


def area(r):
    x, y = r[:, 0], r[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


coast = []
aus = []
for fn in ('ne_10m_land.geojson', 'ne_10m_minor_islands.geojson'):
    for ft in json.load(open(os.path.join(NE, fn)))['features']:
        g = ft['geometry']
        for poly in (g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]):
            r = np.asarray(poly[0], np.float64)
            if r[:, 0].max() < -15:
                r = r + [360, 0]
            if r[:, 0].max() < -15 or r[:, 0].min() > 255 or r[:, 1].min() > 62 or r[:, 1].max() < -52:
                continue
            a = area(r)
            theatre = (r[:, 0].min() > 90 and r[:, 0].max() < 215 and r[:, 1].max() < 48)
            if a < (0.0015 if theatre else 0.08):
                continue
            eps = 0.012 if theatre else 0.06
            s = dp(r, eps)
            coast.append(to_uv(s))
            cx, cy = r[:, 0].mean(), r[:, 1].mean()
            if 112 < cx < 155 and -44 < cy < -10 and a > 5:  # mainland + Tasmania
                aus.append(to_uv(dp(r, 0.01)))

# contiguous USA at true size for Australia's latitude
usa = None
for ft in json.load(open(os.path.join(NE, 'ne_50m_admin_0_countries.geojson')))['features']:
    if ft['properties'].get('ADM0_A3') == 'USA':
        g = ft['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        best = max((np.asarray(p[0]) for p in polys), key=lambda r: area(r) if (r[:, 0].max() < -60 and r[:, 1].min() > 24 and r[:, 0].min() > -130) else 0)
        r = dp(best, 0.05)
        lat_c = 39.0
        kmx = (r[:, 0] - r[:, 0].mean()) * 111.32 * math.cos(math.radians(lat_c))
        kmy = (r[:, 1] - r[:, 1].mean()) * 111.32
        # map units at Australia (lat ~ -25, the projection's standard parallel): 1 unit = 111.32 km
        usa = np.stack([kmx / 111.32, -kmy / 111.32], 1)
        cx = (usa[:, 0].max() + usa[:, 0].min()) / 2
        cy = (usa[:, 1].max() + usa[:, 1].min()) / 2
        usa = usa - [cx, cy]

geo = {'coast': d_of(coast), 'aus': d_of(aus), 'usa': d_of([usa])}
js = 'window.GEO = ' + json.dumps(geo, separators=(',', ':')) + ';\n'
open(os.path.join(HERE, 'assets', 'geo.js'), 'w').write(js)
print(len(coast), 'coast rings', len(aus), 'aus rings', len(js) // 1024, 'KB')
