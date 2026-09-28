#!/usr/bin/env python3
"""s18 map-explainer asset prep.

Builds the projected basemap layers + simplified vector geography used by
render/scenes.js.  Map units: X = lon * K, Y = -lat  (equirectangular with a
standard parallel of 20°S so Top End / Timor Sea shapes read true-ish).

Inputs
  images/s18_01_world_topo_basemap_ref.jpg   NASA Blue Marble topo-bathy (PD)
  images/s18_02_timor_sea_modis.jpg          MODIS Timor Sea (PD)
  images/s18_03_van_diemen_gulf_modis.jpg    MODIS Van Diemen Gulf (PD)
  Natural Earth 10m admin-0 + 50m admin-1 GeoJSON (public domain), path via argv[1]

MODIS bounds were fitted automatically (land-mask IoU vs Natural Earth
coastline: 0.88 Timor Sea, 0.96 Van Diemen Gulf) — see GEOREF below.
"""
import json, math, sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from shapely.geometry import shape, Polygon, MultiPolygon, box
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..', '..'))
IMG = os.path.join(EP, 'images')
OUT = os.path.join(EP, 'render', 'assets')
NE = sys.argv[1] if len(sys.argv) > 1 else '.'
K = math.cos(math.radians(20))

GEOREF = {  # lon_left, lat_top, lon_right, lat_bottom
    'timor': (116.64443, -3.86735, 133.52830, -16.69552),
    'vdg': (129.44030, -10.22146, 133.93098, -13.67905),
}

def grade(im, sat=1.0, con=1.0, bri=1.0):
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(con)
    return ImageEnhance.Brightness(im).enhance(bri)

def feather(im, px):
    w, h = im.size
    a = np.ones((h, w), np.float32)
    ramp = lambda n: np.clip(np.arange(n) / px, 0, 1)
    a *= np.minimum(ramp(w), ramp(w)[::-1])[None, :]
    a *= np.minimum(ramp(h), ramp(h)[::-1])[:, None]
    a = a * a * (3 - 2 * a)
    rgba = im.convert('RGBA')
    rgba.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    return rgba

layers = {}

# 1) world topo crop 90E .. 240E (wraps past antimeridian), 75N .. 80S, 15 px/deg
topo = Image.open(os.path.join(IMG, 's18_01_world_topo_basemap_ref.jpg')).convert('RGB')
ppd = topo.size[0] / 360
def tcrop(l0, l1, t, b):
    return topo.crop((int((l0 + 180) * ppd), int((90 - t) * ppd), int((l1 + 180) * ppd), int((90 - b) * ppd)))
left = tcrop(90, 180, 75, -60)
right = tcrop(-180, -120, 75, -60)
wt = Image.new('RGB', (left.size[0] + right.size[0], left.size[1]))
wt.paste(left, (0, 0)); wt.paste(right, (left.size[0], 0))
wt = grade(wt, sat=0.92, con=1.08, bri=0.9)
# fade the far south (below ~50S) into the stage ocean colour so no Antarctic ice edge shows
arr = np.asarray(wt).astype(np.float32)
lat = 75 - np.arange(arr.shape[0]) / ppd
f = np.clip((lat + 60) / 12.0, 0, 1)[:, None, None]
ocean = np.array([6, 33, 58], np.float32)[None, None, :]
wt = Image.fromarray((arr * f + ocean * (1 - f)).astype(np.uint8))
# upsample 2x with mild sharpening so wide shots don't read as mush
wt = wt.resize((wt.size[0] * 2, wt.size[1] * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
wt.save(os.path.join(OUT, 'topo.jpg'), quality=86)
layers['topo'] = dict(src='assets/topo.jpg', lon0=90, lat0=75, lon1=240, lat1=-60)

# 1b) procedural parchment grain (tiles as an SVG pattern over highlighted land)
rng = np.random.default_rng(18)
n = 512
base = np.zeros((n, n), np.float32)
for octave, amp in [(8, 0.5), (32, 0.3), (128, 0.2)]:
    small = rng.random((octave, octave)).astype(np.float32)
    base += amp * np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)).astype(np.float32) / 255
fib = np.asarray(Image.fromarray((rng.random((n, n)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
v = np.clip(0.78 + 0.22 * (base - base.mean()) / (base.std() * 2.5) + 0.06 * (fib - 0.5), 0, 1)
parch = np.stack([236 * v, 214 * v, 166 * v], -1).astype(np.uint8)
Image.fromarray(parch).save(os.path.join(OUT, 'parchment.jpg'), quality=88)

# 2) MODIS Timor Sea (feathered)
tm = Image.open(os.path.join(IMG, 's18_02_timor_sea_modis.jpg')).convert('RGB')
tm = grade(tm, sat=1.12, con=1.05, bri=1.08)
feather(tm, 560).save(os.path.join(OUT, 'timor.webp'), quality=84)
l0, t0, l1, b0 = GEOREF['timor']
layers['timor'] = dict(src='assets/timor.webp', lon0=l0, lat0=t0, lon1=l1, lat1=b0)

# 3) MODIS Van Diemen Gulf (feathered)
vd = Image.open(os.path.join(IMG, 's18_03_van_diemen_gulf_modis.jpg')).convert('RGB')
vd = grade(vd, sat=1.1, con=1.06, bri=1.1)
feather(vd, 180).save(os.path.join(OUT, 'vdg.webp'), quality=86)
l0, t0, l1, b0 = GEOREF['vdg']
layers['vdg'] = dict(src='assets/vdg.webp', lon0=l0, lat0=t0, lon1=l1, lat1=b0)

# ---- vector geography ----
adm0 = json.load(open(os.path.join(NE, 'ne_10m_admin_0_countries.geojson')))
adm1 = json.load(open(os.path.join(NE, 'ne_50m_admin_1_states_provinces.geojson')))

def feat(coll, key, val):
    return unary_union([shape(f['geometry']) for f in coll['features'] if f['properties'].get(key) == val])

def to_path(geom, tol, min_area, clip=None, wrap=0):
    if clip is not None:
        geom = geom.intersection(clip)
    polys = [geom] if isinstance(geom, Polygon) else list(getattr(geom, 'geoms', []))
    out = []
    for p in polys:
        if not isinstance(p, Polygon) or p.area < min_area:
            continue
        p = p.simplify(tol, preserve_topology=True)
        cs = list(p.exterior.coords)
        seg = 'M' + 'L'.join(f'{(x + wrap) * K:.3f},{-y:.3f}' for x, y in cs) + 'Z'
        out.append(seg)
    return ''.join(out)

geo = {}
aus = feat(adm0, 'ADM0_A3', 'AUS')
geo['aus'] = to_path(aus, 0.02, 0.02, clip=box(110, -45, 156, -9))
geo['ausFine'] = to_path(aus, 0.004, 0.002, clip=box(124.5, -21.0, 139.0, -8.5))
geo['nt'] = to_path(feat(adm1, 'name', 'Northern Territory'), 0.02, 0.02)
geo['act'] = to_path(feat(adm1, 'name', 'Australian Capital Territory'), 0.005, 0.0)
geo['tls'] = to_path(feat(adm0, 'ADM0_A3', 'TLS'), 0.01, 0.002)
geo['png'] = to_path(feat(adm0, 'ADM0_A3', 'PNG'), 0.02, 0.05)
geo['idn'] = to_path(feat(adm0, 'ADM0_A3', 'IDN'), 0.02, 0.05)
geo['java'] = to_path(feat(adm0, 'ADM0_A3', 'IDN'), 0.02, 0.05, clip=box(105, -9, 115, -5.5))
usa = feat(adm0, 'ADM0_A3', 'USA')
geo['hawaii'] = to_path(usa, 0.01, 0.005, clip=box(-161, 18.5, -154.5, 22.5), wrap=360)

places = {  # lon, lat (Pearl Harbor wrapped to +360)
    'darwin': (130.8456, -12.4634), 'canberra': (149.1300, -35.2809),
    'dili': (125.5736, -8.5569), 'moresby': (147.1803, -9.4438),
    'jakarta': (106.8456, -6.2088), 'pearl': (360 - 157.9500, 21.3649),
}
js = 'window.S18GEO = ' + json.dumps({'K': K, 'layers': layers, 'paths': geo, 'places': places}) + ';\n'
open(os.path.join(EP, 'render', 'geo.js'), 'w').write(js)
print('geo.js', len(js), 'bytes;', {k: len(v) for k, v in geo.items()})
