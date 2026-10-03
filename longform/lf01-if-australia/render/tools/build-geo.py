#!/usr/bin/env python3
"""Vector extracts from Natural Earth (public domain) → render/geo/geo.json
  aus      Australian mainland + Tasmania (50m), for pale / dim / brighten washes
  usa      contiguous United States (50m), for the V24 size comparison
  borders  simplified modern country outlines (110m) for the Act 5 modern map
"""
import json, os, sys
from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.ops import unary_union

NE = sys.argv[1]
OUT = sys.argv[2]

def rings(geom, tol, min_area=0.0):
    out = []
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    for p in polys:
        if p.area < min_area:
            continue
        p = p.simplify(tol, preserve_topology=True)
        out.append([[round(x, 3), round(y, 3)] for x, y in p.exterior.coords])
    return out

land = json.load(open(os.path.join(NE, 'ne_50m_land.geojson')))
aus_parts = []
for f in land['features']:
    g = shape(f['geometry'])
    for p in (g.geoms if isinstance(g, MultiPolygon) else [g]):
        c = p.centroid
        if 112 < c.x < 155 and -44.5 < c.y < -10 and p.area > 5:
            aus_parts.append(p)
aus = unary_union(aus_parts)

c50 = json.load(open(os.path.join(NE, 'ne_50m_admin_0_countries.geojson')))
usa = None
for f in c50['features']:
    if f['properties'].get('ADM0_A3') == 'USA':
        g = shape(f['geometry'])
        usa = max(g.geoms, key=lambda p: p.area)  # contiguous 48 states
c110 = json.load(open(os.path.join(NE, 'ne_110m_admin_0_countries.geojson')))
borders = []
for f in c110['features']:
    g = shape(f['geometry'])
    borders += rings(g, 0.15, 0.3)

geo = {
    'aus': rings(aus, 0.04),
    'usa': rings(MultiPolygon([usa]), 0.05),
    'borders': borders,
    'note': 'Natural Earth 1:50m / 1:110m (public domain), simplified',
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(geo, open(OUT, 'w'), separators=(',', ':'))
print('aus rings', len(geo['aus']), sum(len(r) for r in geo['aus']), 'pts; usa', sum(len(r) for r in geo['usa']), '; borders', len(borders), sum(len(r) for r in borders))
