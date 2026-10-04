"""Vector geography for scenes.js -> assets/geo.js (window.GEO). Natural Earth (public domain), Mercator UV.

coast     inked coastline (finer around the Aegean / Dardanelles and Australia, coarser elsewhere)
ottoman   1915 Ottoman Empire, approximated as modern Türkiye + Syria + Iraq + Lebanon + Israel/Palestine +
          Jordan + a hand-drawn Hejaz strip along the Red Sea (a motion-graphic outline, not a survey map)
bulgaria  Bulgaria (modern outline)          turkey  Türkiye (modern outline, for 1923)
meborders land borders drawn across the Middle East after the war (modern lines between Türkiye, Syria, Iraq,
          Lebanon, Israel/Palestine, Jordan, Saudi Arabia, Kuwait)
aus, nz   Australia (mainland + Tasmania) and New Zealand outlines
"""
import json, math, os
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon, LineString, MultiLineString
from shapely.ops import unary_union
from layers import LON0, Y0

NE = os.environ.get('NE', '/tmp/claude-0/geo/ne')
HERE = os.path.dirname(os.path.abspath(__file__))


def U(lon): return lon - LON0
def V(lat): return Y0 - math.degrees(math.log(math.tan(math.radians(45 + max(-85, min(85, lat)) / 2))))


def ring_d(coords, eps):
    ls = LineString(coords).simplify(eps, preserve_topology=False)
    c = list(ls.coords)
    if len(c) < 3:
        return ''
    return 'M' + 'L'.join(f'{U(x):.4f},{V(y):.4f}' for x, y in c) + 'Z'


def line_d(coords, eps):
    ls = LineString(coords).simplify(eps)
    return 'M' + 'L'.join(f'{U(x):.4f},{V(y):.4f}' for x, y in ls.coords)


def geom_d(g, eps, holes=False):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    out = []
    for p in polys:
        out.append(ring_d(p.exterior.coords, eps))
        if holes:
            out += [ring_d(r.coords, eps) for r in p.interiors]
    return ''.join(out)


coast = []
for fn in ('ne_10m_land.geojson', 'ne_10m_minor_islands.geojson'):
    for ft in json.load(open(os.path.join(NE, fn)))['features']:
        g = shape(ft['geometry'])
        for p in (g.geoms if isinstance(g, MultiPolygon) else [g]):
            x0, y0, x1, y1 = p.bounds
            if x1 < -16 or x0 > 183 or y0 > 73 or y1 < -50:
                continue
            fine = (19 < x0 and x1 < 45 and 34 < y0 and y1 < 47) or (110 < x0 and x1 < 180 and y1 < -8)
            if p.area < (0.0004 if fine else 0.05):
                continue
            coast.append(ring_d(p.exterior.coords, 0.004 if fine else 0.05))

C = {f['properties']['ADM0_A3']: shape(f['geometry']) for f in json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))['features']}
hejaz = Polygon([(34.95, 29.35), (36.6, 29.1), (38.4, 27.6), (40.2, 25.0), (41.2, 22.8), (41.4, 21.0), (40.6, 20.0),
                 (39.6, 20.6), (39.0, 21.6), (38.0, 24.0), (37.0, 25.6), (35.6, 27.6), (34.95, 28.4)])
ott = unary_union([C[k] for k in ('TUR', 'SYR', 'IRQ', 'LBN', 'ISR', 'PSX', 'JOR')] + [hejaz.intersection(C['SAU']).buffer(0)])
ott = ott.buffer(0.02).buffer(-0.02)
# drop tiny islands
if isinstance(ott, MultiPolygon):
    ott = MultiPolygon([p for p in ott.geoms if p.area > 0.05])

me = ['TUR', 'SYR', 'IRQ', 'LBN', 'ISR', 'PSX', 'JOR', 'SAU', 'KWT']
borders = []
for i, a in enumerate(me):
    for b in me[i + 1:]:
        x = C[a].boundary.intersection(C[b].boundary)
        if x.is_empty:
            continue
        from shapely.ops import linemerge
        if x.geom_type in ('MultiLineString', 'LineString'):
            m = linemerge(x) if x.geom_type == 'MultiLineString' else x
            for ls in (m.geoms if m.geom_type == 'MultiLineString' else [m]):
                if ls.length > 0.3:
                    borders.append({'a': a, 'b': b, 'd': line_d(ls.coords, 0.03), 'pts': [[round(U(x_), 3), round(V(y_), 3)] for x_, y_ in ls.simplify(0.08).coords]})

aus = unary_union([p for p in C['AUS'].geoms if p.area > 5])
geo = {
    'coast': ''.join(coast),
    'ottoman': geom_d(ott, 0.03),
    'bulgaria': geom_d(C['BGR'], 0.01),
    'turkey': geom_d(C['TUR'], 0.02),
    'aus': geom_d(aus, 0.03),
    'nz': geom_d(MultiPolygon([p for p in C['NZL'].geoms if p.area > 0.5 and p.bounds[0] > 160]), 0.03),
    'meborders': borders,
}
js = 'window.GEO = ' + json.dumps(geo, separators=(',', ':')) + ';\n'
open(os.path.join(HERE, 'assets', 'geo.js'), 'w').write(js)
print(len(coast), 'coast rings;', len(borders), 'ME border lines;', len(js) // 1024, 'KB')
