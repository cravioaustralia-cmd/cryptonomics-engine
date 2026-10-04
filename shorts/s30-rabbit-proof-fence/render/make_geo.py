"""Export simplified vector geography for scenes.js overlays → assets/geo.js (window.GEO).
Natural Earth 10m (public domain): coastlines (Australia + the islands north for the master map),
internal state borders, a Western Australia outline (mainland coast west of the 129°E border),
and the WA salt lakes (ne_10m_lakes, 'Alkaline Lake')."""
import json, os
import numpy as np
NE = os.environ.get('NE', '/tmp/claude-0/ne')
HERE = os.path.dirname(os.path.abspath(__file__))


def dp(pts, eps):
    """Douglas–Peucker simplification."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    ab = b - a
    L = np.hypot(*ab) or 1e-12
    v = pts - a
    d = np.abs(ab[0] * v[:, 1] - ab[1] * v[:, 0]) / L if L > 1e-9 else np.hypot(v[:, 0], v[:, 1])
    i = int(d.argmax())
    if d[i] > eps:
        return np.vstack([dp(pts[:i + 1], eps)[:-1], dp(pts[i:], eps)])
    return np.vstack([a, b])


land = json.load(open(os.path.join(NE, 'ne_10m_land.geojson')))['features']
rings, mainland = [], None
for ft in land:
    g = ft['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        r = np.asarray(poly[0])
        x0, x1, y0, y1 = r[:, 0].min(), r[:, 0].max(), r[:, 1].min(), r[:, 1].max()
        if x1 < 95 or x0 > 160 or y0 > 8 or y1 < -46:
            continue
        if (x1 - x0) * (y1 - y0) < 0.6:
            continue
        if x0 < 115 and x1 > 150 and y0 < -35:
            mainland = r
        rings.append(np.round(dp(r, 0.03), 3).tolist())
lines = []
for ft in json.load(open(os.path.join(NE, 'ne_10m_admin_1_states_provinces_lines.geojson')))['features']:
    if ft['properties'].get('ADM0_NAME') != 'Australia':
        continue
    g = ft['geometry']
    parts = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
    for p in parts:
        p = np.asarray(p)
        if np.hypot(*(p[-1] - p[0])) < 3:
            continue
        lines.append(np.round(dp(p, 0.01), 3).tolist())
# Western Australia: mainland coast west of the 129°E border, closed along the border
B = 129.0
m = dp(mainland, 0.012)
inside = m[:, 0] <= B
k = int(np.argmax(~inside))  # rotate so the ring starts outside WA
m = np.roll(m, -k, axis=0)
inside = m[:, 0] <= B
idx = np.where(inside)[0]
seg = m[idx[0]:idx[-1] + 1]
seg = seg[seg[:, 0] <= B]
wa = np.vstack([[B, seg[0][1]], seg, [B, seg[-1][1]]])
lakes = []
for ft in json.load(open(os.path.join(NE, 'ne_10m_lakes.geojson')))['features']:
    g = ft['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        r = np.asarray(poly[0])
        if r[:, 0].min() > 112 and r[:, 0].max() < 129 and r[:, 1].min() > -36 and r[:, 1].max() < -18:
            lakes.append({'name': ft['properties'].get('name'), 'pts': np.round(dp(r, 0.004), 3).tolist()})
js = 'window.GEO = ' + json.dumps({'coast': rings, 'borders': lines, 'wa': np.round(wa, 3).tolist(), 'lakes': lakes}, separators=(',', ':')) + ';\n'
open(os.path.join(HERE, 'assets', 'geo.js'), 'w').write(js)
print(len(rings), 'coast rings;', len(lines), 'borders; WA', len(wa), 'pts; lakes', [l['name'] for l in lakes], len(js) // 1024, 'KB')
