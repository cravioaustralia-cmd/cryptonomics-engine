"""Build the locked-style map layers for s17 (Australia/Sydney <-> Paraguay/New Australia/Cosme only).

Two georeferenced maps:

V  Voyage map — South Pacific, lon 138°E .. 318°E (−42°), lat 2°S .. 88°S, Pacific-centred equirectangular.
   Basemap: NASA Blue Marble world.topo.bathy Dec 2004 (images/s17_07_world_topo_basemap_ref.jpg, public domain),
   re-cropped across the antimeridian, upsampled x2 and given an extra hillshade from its own relief.
   Overlays from Natural Earth 1:10m countries (public domain):
     s17_20_voy_base.jpg        basemap (topo + bathymetry)
     s17_21_voy_parch_au.png    weathered parchment fill, Australia (alpha — terrain shows through)
     s17_22_voy_parch_py.png    weathered parchment fill, Paraguay
     s17_23_voy_glow.png        soft offset shadow + thick white outer glow on the Australian coast and Paraguay border

P  Colony map — the NASA/MODIS Paraguay still (images/s17_08_paraguay_satellite_2003.jpg, public domain)
   georeferenced by an affine fit to four control points (Asunción, Lago Ypacaraí, Ciudad del Este,
   Paraguay–Paraná confluence; residual < 0.006°):
       lon = −63.08540 + 0.0045642·x + 0.00012597·y
       lat = −19.01254 − 0.0000198·x − 0.0042513·y
     s17_24_col_base.jpg        satellite, colour-graded, neighbours darkened
     s17_25_col_parch.png       parchment fill over Paraguay (terrain shows through)
     s17_26_col_glow.png        thick white outer glow + soft shadow along Paraguay's border

Run: python3 shorts/s17-new-australia-paraguay/render/build-map-layers.py
Needs numpy, scipy, pillow, curl (downloads Natural Earth geojson to $NE_CACHE, default /tmp/s17).
"""
import json, math, os, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'images')
CACHE = os.environ.get('NE_CACHE', '/tmp/s17')
os.makedirs(CACHE, exist_ok=True)
NE = os.path.join(CACHE, 'ne10.geojson')
if not os.path.exists(NE):
    subprocess.run(['curl', '-sf', '-o', NE, 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson'], check=True)
countries = {f['properties']['ADMIN']: f['geometry'] for f in json.load(open(NE))['features']}
rng = np.random.default_rng(17)


def rings(name, wrap=False):
    g = countries[name]
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for P in polys:
        ring = np.array(P[0], float)
        if wrap:
            ring[:, 0] = np.where(ring[:, 0] < 0, ring[:, 0] + 360, ring[:, 0])
        yield ring


def raster(name, to_px, W, H, wrap=False, ss=2, min_area=0):
    im = Image.new('L', (W * ss, H * ss), 0)
    d = ImageDraw.Draw(im)
    for ring in rings(name, wrap):
        pts = [tuple(v * ss for v in to_px(lo, la)) for lo, la in ring]
        if len(pts) < 3:
            continue
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        if (max(xs) - min(xs)) * (max(ys) - min(ys)) < min_area * ss * ss:
            continue
        d.polygon(pts, fill=255)
    return np.asarray(im.resize((W, H), Image.LANCZOS)).astype(float) / 255


def noise(H, W, scale, amp):
    return nd.gaussian_filter(rng.standard_normal((H, W)), scale) * amp


def parchment(sel, base_c, dark_c, burn_px, alpha=(0.36, 0.64)):
    """Weathered parchment RGBA over mask `sel` (0..1): mottled tone, fibres, burnt edges."""
    H, W = sel.shape
    tone = 0.5 + noise(H, W, 40, 9) + noise(H, W, 12, 4) + noise(H, W, 3, 1.2)
    fib = nd.gaussian_filter(rng.standard_normal((H, W)), (1.2, 10)) * 2.0
    tone = np.clip(tone + fib * 0.35, 0, 1)
    dist = nd.distance_transform_edt(sel > 0.5)
    burn = np.clip(1 - dist / burn_px, 0, 1) ** 1.6
    k = np.clip(0.3 * (1 - tone) + 0.6 * burn, 0, 1)[..., None]
    rgb = np.array(base_c, float) * (1 - k) + np.array(dark_c, float) * k
    a = sel * np.clip(alpha[0] + 0.22 * burn + noise(H, W, 20, 0.6) * 0.1, alpha[0] - 0.1, alpha[1])
    rgb = rgb * (a[..., None] > 0.004)  # zero colour under transparent pixels so the PNG compresses
    return Image.fromarray(np.dstack([rgb, a[..., None] * 255]).clip(0, 255).astype(np.uint8), 'RGBA')


def glow_layer(land, core_px, halo_px, shadow_off, inside_too=False):
    """Soft offset shadow + thick white outer glow around mask `land`."""
    lb = land > 0.5
    outside = 1 - land
    shadow = nd.shift(nd.gaussian_filter(land, halo_px * 0.8), shadow_off, order=1) * outside * 0.7
    core = nd.gaussian_filter(nd.binary_dilation(lb, iterations=core_px).astype(float), 1.2)
    halo = nd.gaussian_filter(nd.binary_dilation(lb, iterations=core_px * 2).astype(float), halo_px)
    glow = np.clip(core * 0.95 + halo * 0.5, 0, 1) * outside
    if inside_too:  # thin bright rim just inside the border
        rim = nd.gaussian_filter((lb & ~nd.binary_erosion(lb, iterations=3)).astype(float), 1.0)
        glow = np.clip(glow + rim * 0.8 * land, 0, 1)
    ga = np.clip(glow + shadow * (1 - glow), 0, 1)
    white = glow / np.maximum(ga, 1e-6)
    return Image.fromarray(np.dstack([np.dstack([white * 255] * 3), ga * 255]).astype(np.uint8), 'RGBA')


def hillshade(elev, k=1.0):
    gy, gx = np.gradient(elev)
    slope = np.arctan(np.hypot(gx, gy) * k)
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(315), math.radians(42)
    s = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(s / np.sin(alt), 0.55, 1.4)


meta = {}

# ================= V: voyage map =================
LON0, LON1, LAT0, LAT1 = 138.0, 318.0, -2.0, -88.0
PPX = 30.0
PPY = PPX / math.cos(math.radians(32))
VW, VH = int((LON1 - LON0) * PPX), int((LAT0 - LAT1) * PPY)
BM = np.asarray(Image.open(os.path.join(IMG, 's17_07_world_topo_basemap_ref.jpg')).convert('RGB')).astype(np.float32)
bmW = BM.shape[1]
lon = LON0 + (np.arange(VW) + 0.5) / PPX
lat = LAT0 - (np.arange(VH) + 0.5) / PPY
LX, LY = np.meshgrid(lon, lat)
bx = (((LX + 180) % 360) * 15 - 0.5)
by = (90 - LY) * 15 - 0.5
col = np.dstack([nd.map_coordinates(BM[..., c], [by, bx], order=3, mode='wrap') for c in range(3)])
lum = col.mean(-1)
v_to_px = lambda lo, la: ((lo - LON0) * PPX, (LAT0 - la) * PPY)
au = raster('Australia', v_to_px, VW, VH, min_area=120)
py = raster('Paraguay', v_to_px, VW, VH, wrap=True)
land_all = np.zeros((VH, VW))
for nm in ['Australia', 'New Zealand', 'Argentina', 'Chile', 'Uruguay', 'Brazil', 'Bolivia', 'Paraguay', 'Peru',
           'Indonesia', 'Papua New Guinea', 'Fiji', 'Vanuatu', 'New Caledonia', 'Solomon Islands', 'Falkland Islands']:
    if nm in countries:
        land_all = np.maximum(land_all, raster(nm, v_to_px, VW, VH, wrap=(nm not in ('Australia', 'Indonesia', 'Papua New Guinea', 'New Zealand', 'Solomon Islands', 'Vanuatu', 'New Caledonia', 'Fiji'))))
# extra relief: hillshade the Blue Marble luminance on land (it's a shaded-relief composite), gentle sea swell
sh = hillshade(nd.gaussian_filter(lum, 1.2), 0.06)
base = col * np.where(land_all[..., None] > 0.5, sh[..., None] ** 0.8, 1.0)
base = base * 1.06 + 4
# deepen the ocean a touch so the parchment reads
sea = land_all < 0.5
base[sea] = base[sea] * np.array([0.82, 0.9, 1.0])
Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).save(os.path.join(IMG, 's17_20_voy_base.jpg'), quality=86)
parchment(au, [240, 212, 156], [128, 76, 34], 26, alpha=(0.44, 0.72)).save(os.path.join(IMG, 's17_21_voy_parch_au.png'), optimize=True)
parchment(py, [246, 226, 176], [150, 64, 30], 10, alpha=(0.5, 0.78)).save(os.path.join(IMG, 's17_22_voy_parch_py.png'), optimize=True)
glow_layer(np.maximum(au, py), 7, 9, (12, 7)).save(os.path.join(IMG, 's17_23_voy_glow.png'), optimize=True)
meta['voy'] = {'lon0': LON0, 'lat0': LAT0, 'ppx': PPX, 'ppy': PPY, 'w': VW, 'h': VH}
print('voyage', VW, VH)

# ================= P: colony map =================
S = np.asarray(Image.open(os.path.join(IMG, 's17_08_paraguay_satellite_2003.jpg')).convert('RGB')).astype(np.float32)
PH, PW = S.shape[:2]
cl = [-63.085403461357366, 0.004564232107414275, 0.00012597208278356559]
ca = [-19.01253767185865, -1.9831683551998092e-05, -0.004251305256117307]
M = np.array([[cl[1], cl[2]], [ca[1], ca[2]]])
Mi = np.linalg.inv(M)
def p_to_px(lo, la):
    x, y = Mi @ np.array([lo - cl[0], la - ca[0]])
    return (x, y)
pmask = raster('Paraguay', p_to_px, PW, PH)
# grade: warmer, contrastier; tame cloud highlights; darken outside Paraguay for focus
g = S.copy()
g = (g - 128) * 1.18 + 128
g[..., 0] *= 1.05
g[..., 2] *= 0.92
cloud = np.clip((S.mean(-1) - 170) / 50, 0, 1)
g = g * (1 - cloud[..., None] * 0.35)
g = g * (0.62 + 0.38 * nd.gaussian_filter(pmask, 6))[..., None]
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(os.path.join(IMG, 's17_24_col_base.jpg'), quality=88)
parchment(pmask, [242, 220, 168], [140, 70, 30], 60, alpha=(0.26, 0.5)).save(os.path.join(IMG, 's17_25_col_parch.png'), optimize=True)
glow_layer(pmask, 9, 12, (18, 10), inside_too=True).save(os.path.join(IMG, 's17_26_col_glow.png'), optimize=True)
meta['col'] = {'cl': cl, 'ca': ca, 'w': PW, 'h': PH}
json.dump(meta, open(os.path.join(HERE, 'map-meta.json'), 'w'), indent=1)
print('colony', PW, PH)
