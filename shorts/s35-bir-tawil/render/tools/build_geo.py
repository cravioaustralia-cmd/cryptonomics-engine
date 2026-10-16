"""Build render/geo.json from Natural Earth 10m (public domain).
Usage: python3 build_geo.py <dir with Natural Earth ne_10m_*.geojson> render/geo.json
Source: https://github.com/nvkelso/natural-earth-vector (public domain)
"""
import json, sys, os
from shapely.geometry import shape, box, mapping, LineString, MultiLineString
from shapely.ops import unary_union, linemerge

src, out = sys.argv[1], sys.argv[2]
L = lambda f: json.load(open(os.path.join(src, f)))
BB = box(18, 4, 46, 36)
C = {f['properties']['ADMIN']: shape(f['geometry']) for f in L('ne_10m_admin_0_countries.geojson')['features']}
D = {f['properties']['NAME']: shape(f['geometry']) for f in L('ne_10m_admin_0_disputed_areas.geojson')['features']}
bt, ha = D['Bir Tawil'], D['Halayib Triangle']
eg = C['Egypt'].difference(ha)
su = C['Sudan']

def rings(g, tol=0.01, minarea=0.002):
    g = g.intersection(BB).simplify(tol, preserve_topology=True)
    polys = [g] if g.geom_type == 'Polygon' else list(getattr(g, 'geoms', []))
    res = []
    for p in polys:
        if p.geom_type != 'Polygon' or p.area < minarea: continue
        res.append([[round(x, 3), round(y, 3)] for x, y in p.exterior.coords])
        for h in p.interiors:
            res.append([[round(x, 3), round(y, 3)] for x, y in h.coords])
    return res

others = ['Libya', 'Chad', 'Saudi Arabia', 'Eritrea', 'Ethiopia', 'South Sudan', 'Central African Republic',
          'Israel', 'Jordan', 'Palestine', 'Yemen', 'Djibouti', 'Somaliland', 'Somalia', 'Iraq', 'Kenya', 'Uganda',
          'Democratic Republic of the Congo', 'Cameroon', 'Niger', 'Nigeria', 'Syria', 'Lebanon', 'Cyprus']
geo = {
    'egypt': rings(eg), 'sudan': rings(su), 'halaib': rings(ha, 0.003), 'birtawil': rings(bt, 0.002),
    'others': [r for n in others if n in C for r in rings(C[n], 0.02)],
}
lakes = [shape(f['geometry']) for f in L('ne_10m_lakes.geojson')['features'] if f['properties'].get('name') == 'Lake Nasser']
geo['nasser'] = rings(unary_union(lakes), 0.005, 0.0005)
nile = [shape(f['geometry']) for f in L('ne_10m_rivers_lake_centerlines.geojson')['features']
        if f['properties'].get('name') in ('Nile', 'El Bahr el Abyad', 'Rosetta Branch', 'Damietta Branch', 'El Bahr el Azraq', 'Atbara')]
nl = unary_union(nile).intersection(BB).simplify(0.01)
geo['rivers'] = [[[round(x, 3), round(y, 3)] for x, y in ls.coords] for ls in getattr(nl, 'geoms', [nl])]

# 1899 political boundary: straight 22N from the Libya tripoint to the Red Sea coast
geo['line1899'] = [[25.0, 22.0], [36.884, 22.0]]
# 1902 administrative boundary: 22N, Wadi Halfa salient, south round Bir Tawil, north round Halaib to the coast
sal = su.boundary.intersection(box(31.2, 22.0004, 31.6, 22.4))
sal = linemerge(sal) if sal.geom_type == 'MultiLineString' else sal
sal_pts = sorted([list(c) for c in (sal.coords if sal.geom_type == 'LineString' else max(sal.geoms, key=lambda g: g.length).coords)])
btc = [list(c) for c in bt.exterior.coords]
bt_south = [c for c in btc if c[1] < 21.99]
bt_south.sort(key=lambda c: c[0])
hac = [list(c) for c in max(ha.geoms, key=lambda g: g.area).exterior.coords]
i0 = next(i for i, c in enumerate(hac) if abs(c[0] - 34.084) < 1e-3 and c[1] < 22.0)
i1 = next(i for i, c in enumerate(hac) if abs(c[0] - 35.621) < 2e-3 and abs(c[1] - 23.139) < 2e-3)
ha_north = hac[i0:i1 + 1]
# salient: keep order west->east by walking the boundary piece
sl = list(sal.coords) if sal.geom_type == 'LineString' else list(max(sal.geoms, key=lambda g: g.length).coords)
if sl[0][0] > sl[-1][0]: sl = sl[::-1]
line1902 = [[25.0, 22.0], [sl[0][0], 22.0]] + [list(c) for c in LineString(sl).simplify(0.003).coords] + [[sl[-1][0], 22.0],
            [33.181, 21.995]] + bt_south + [[34.084, 21.995]] + ha_north
geo['line1902'] = [[round(x, 3), round(y, 3)] for x, y in line1902]

act = next(shape(f['geometry']) for f in L('ne_10m_admin_1_states_provinces.geojson')['features']
           if f['properties'].get('name') == 'Australian Capital Territory')
act = max(getattr(act, 'geoms', [act]), key=lambda g: g.area).simplify(0.002)
geo['act'] = [[round(x, 4), round(y, 4)] for x, y in act.exterior.coords]
geo['birtawil_fine'] = [[round(x, 4), round(y, 4)] for x, y in bt.exterior.coords]

# Area check (km2, local equal-area-ish)
import math
def km2(pts):
    lat0 = sum(p[1] for p in pts) / len(pts)
    xy = [((p[0]) * 111.32 * math.cos(math.radians(lat0)), p[1] * 110.57) for p in pts]
    return abs(sum(xy[i][0] * xy[i - 1][1] - xy[i - 1][0] * xy[i][1] for i in range(len(xy)))) / 2
print('BT km2', round(km2(geo['birtawil_fine'])), 'ACT km2', round(km2(geo['act'])), 'Halaib km2', round(km2(hac)))
print('points', {k: (sum(len(r) for r in v) if v and isinstance(v[0][0], list) else len(v)) for k, v in geo.items()})
with open(out, 'w') as f:
    json.dump(geo, f, separators=(',', ':'))
