"""Export simplified vector geography for scenes.js overlays → assets/geo.js (window.GEO).
Natural Earth 10m (public domain): Australian mainland + Tasmania coastline, internal state borders
(drawn unlabelled as thin context lines), the Gibson Desert outline (geography_regions_polys), plus the coast of Timor / Java / New Guinea for the master map."""
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
rings = []
for ft in land:
    g = ft['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        r = np.asarray(poly[0])
        x0, x1, y0, y1 = r[:, 0].min(), r[:, 0].max(), r[:, 1].min(), r[:, 1].max()
        if x1 < 100 or x0 > 158 or y0 > 2 or y1 < -46:
            continue
        area = (x1 - x0) * (y1 - y0)
        if area < 0.6:
            continue
        rings.append(np.round(dp(r, 0.03), 3).tolist())
lines = []
for ft in json.load(open(os.path.join(NE, 'ne_10m_admin_1_states_provinces_lines.geojson')))['features']:
    if ft['properties'].get('ADM0_NAME') != 'Australia':
        continue
    g = ft['geometry']
    parts = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
    for p in parts:
        p = np.asarray(p)
        # keep the long desert borders only (WA | NT | SA | QLD), not the tiny ACT / Jervis Bay ones
        if np.hypot(*(p[-1] - p[0])) < 3:
            continue
        lines.append(np.round(dp(p, 0.01), 3).tolist())
regions = {}
for ft in json.load(open(os.path.join(NE, 'regions.geojson')))['features']:
    nm = ft['properties'].get('NAME') or ft['properties'].get('name')
    if nm in ('Gibson Desert',):
        g = ft['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        regions[nm] = [np.round(dp(np.asarray(pl[0]), 0.02), 3).tolist() for pl in polys]
js = 'window.GEO = ' + json.dumps({'coast': rings, 'borders': lines, 'regions': regions}, separators=(',', ':')) + ';\n'
open(os.path.join(HERE, 'assets', 'geo.js'), 'w').write(js)
print(len(rings), 'coast rings,', sum(len(r) for r in rings), 'pts;', len(lines), 'border lines;', len(js) // 1024, 'KB')
