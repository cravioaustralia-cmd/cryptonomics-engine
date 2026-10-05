"""Simplified Natural Earth 10m outlines (public domain) for the region highlights -> render/assets/geo.js (window.GEO).
Australia, New Zealand, Mexico (admin-0) and California (admin-1). Only rings large enough to read are kept."""
import json, os
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
NE = os.environ.get('NE', '/tmp/claude-0/ne')


def dp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    ab = b - a
    L = np.hypot(*ab)
    v = pts - a
    d = np.abs(ab[0] * v[:, 1] - ab[1] * v[:, 0]) / L if L > 1e-9 else np.hypot(v[:, 0], v[:, 1])
    i = int(d.argmax())
    if d[i] > eps:
        return np.vstack([dp(pts[:i + 1], eps)[:-1], dp(pts[i:], eps)])
    return np.vstack([a, b])


def rings(f, key, names, min_area, eps):
    out = {}
    for ft in json.load(open(os.path.join(NE, f + '.geojson')))['features']:
        nm = ft['properties'].get(key)
        if nm not in names or ft['geometry'] is None:
            continue
        g = ft['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            r = np.asarray(poly[0], np.float64)
            r = r[(r[:, 0] > 0) | (names[nm] != 'nz')] if False else r
            if (r[:, 0].max() - r[:, 0].min()) * (r[:, 1].max() - r[:, 1].min()) < min_area:
                continue
            if names[nm] == 'nz' and r[:, 0].min() < 160:  # mainland NZ only (no sub-Antarctic / Chathams detail)
                continue
            out.setdefault(names[nm], []).append(np.round(dp(r, eps), 3).tolist())
    return out


geo = {}
geo.update(rings('ne_10m_admin_0_countries', 'ADMIN', {'Australia': 'aus', 'New Zealand': 'nz', 'Mexico': 'mex'}, 0.15, 0.02))
geo.update(rings('ne_10m_admin_1_states_provinces', 'name', {'California': 'cal'}, 0.2, 0.01))
open(os.path.join(HERE, '..', 'assets', 'geo.js'), 'w').write('window.GEO = ' + json.dumps(geo, separators=(',', ':')) + ';\n')
print({k: (len(v), sum(len(r) for r in v)) for k, v in geo.items()})
