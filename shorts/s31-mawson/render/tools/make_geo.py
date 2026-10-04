"""Export simplified vector geography for scenes.js overlays → render/assets/geo.js (window.GEO).
Natural Earth 10m (public domain): Antarctic coast + ice-shelf fronts (for the continent glow on wide views),
Australia/NZ/New Guinea coast (master map context). Glacier flow lines are the same approximate lines the
basemap grades (make_basemap.GLACIERS), so the glacier labels and highlights sit on the graded ice."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_basemap import GLACIERS, NE  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


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


def rings(f, keep):
    out = []
    for ft in json.load(open(os.path.join(NE, f + '.geojson')))['features']:
        g = ft['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            r = np.asarray(poly[0], np.float64)
            if keep(r):
                out.append(r)
    return out


ant = rings('ne_10m_land', lambda r: r[:, 1].max() < -60 and (r[:, 0].max() - r[:, 0].min()) * (r[:, 1].max() - r[:, 1].min()) > 0.5)
shelves = rings('ne_10m_antarctic_ice_shelves_polys', lambda r: (r[:, 0].max() - r[:, 0].min()) * (r[:, 1].max() - r[:, 1].min()) > 0.3)
aus = rings('ne_10m_land', lambda r: r[:, 0].min() > 100 and r[:, 0].max() < 180 and r[:, 1].min() > -48 and r[:, 1].max() < 5 and (r[:, 0].max() - r[:, 0].min()) * (r[:, 1].max() - r[:, 1].min()) > 0.4)


def clean(rs, eps):
    out = []
    for r in rs:
        # drop the artificial south-pole closure edges of the Antarctic polygon (lat < -85)
        r = r[r[:, 1] > -85.0]
        if len(r) < 4:
            continue
        out.append(np.round(dp(r, eps), 3).tolist())
    return out


geo = {
    'ant': clean(ant, 0.02),
    'shelves': clean(shelves, 0.02),
    'aus': clean(aus, 0.03),
    'glaciers': {k: v[0] for k, v in GLACIERS.items()},
}
js = 'window.GEO = ' + json.dumps(geo, separators=(',', ':')) + ';\n'
open(os.path.join(HERE, '..', 'assets', 'geo.js'), 'w').write(js)
print({k: len(v) for k, v in geo.items()}, len(js) // 1024, 'KB')
