"""geo.py - Natural Earth / OSM loading, the Thread globe (MAP01) and flat maps."""
import json, math
from functools import lru_cache
import numpy as np
import skia
from .core import *

DATA = EP / "data"
COORD = json.loads((DATA / "coordinates.json").read_text())
P = {  # (lat, lon)
    "Bondi": (-33.8915, 151.2767), "Sydney": (-33.8688, 151.2093), "Melbourne": (-37.8136, 144.9631),
    "Ripponlea": (-37.875, 144.999), "Canberra": (-35.2809, 149.13), "Gaza": (31.5017, 34.4668),
    "Jerusalem": (31.7683, 35.2137), "Beersheba": (31.2518, 34.7913), "Tehran": (35.6892, 51.389),
    "Tel Aviv": (32.0853, 34.7818), "Jaffa": (32.0504, 34.7522), "Haifa": (32.794, 34.9896),
    "New York": (40.7458, -73.8467), "London": (51.5072, -0.1276), "Ottawa": (45.4215, -75.6972),
    "Washington": (38.9072, -77.0369), "Beirut": (33.8938, 35.5018), "Athens": (37.9838, 23.7275),
    "Rome": (41.9028, 12.4964), "Lakemba": (-33.92, 151.076), "Deir al-Balah": (31.4167, 34.35),
    "Khan Younis": (31.3462, 34.3063), "Rafah": (31.2969, 34.2436), "Kfar Aza": (31.4806, 34.5328),
    "Be'eri": (31.4258, 34.4936), "Station Pier": (-37.8441, 144.9327), "Paris": (48.8566, 2.3522),
}


def _rings(geom):
    t = geom["type"]
    if t == "Polygon":
        return [np.array(geom["coordinates"][0], float)] + [np.array(r, float) for r in geom["coordinates"][1:]]
    if t == "MultiPolygon":
        out = []
        for poly in geom["coordinates"]:
            out += [np.array(r, float) for r in poly]
        return out
    if t == "LineString":
        return [np.array(geom["coordinates"], float)]
    if t == "MultiLineString":
        return [np.array(r, float) for r in geom["coordinates"]]
    return []


@lru_cache(maxsize=None)
def countries(res="110m"):
    d = json.loads((DATA / f"ne_{res}_admin_0_countries.geojson").read_text())
    out = []
    for f in d["features"]:
        a3 = f["properties"]["ADM0_A3"]
        out.append((a3, _rings(f["geometry"])))
    return out


@lru_cache(maxsize=None)
def lakes(res="50m"):
    d = json.loads((DATA / f"ne_{res}_lakes.geojson").read_text())
    return [r for f in d["features"] for r in _rings(f["geometry"])]


@lru_cache(maxsize=None)
def geojson(name):
    d = json.loads((DATA / name).read_text())
    return [(f["properties"], _rings(f["geometry"])) for f in d["features"]]

# ======================================================================== orthographic globe
def _xyz(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)


class Ortho:
    def __init__(self, cx, cy, R, lat0, lon0):
        self.cx, self.cy, self.R = cx, cy, R
        la, lo = math.radians(lat0), math.radians(lon0)
        # basis: centre direction c, east e, north n
        self.c = np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
        self.e = np.array([-math.sin(lo), math.cos(lo), 0.0])
        self.n = np.cross(self.c, self.e)

    def proj_xyz(self, v, clamp_limb=True):
        z = v @ self.c
        x = v @ self.e
        y = v @ self.n
        if clamp_limb:
            back = z < 0
            if np.any(back):
                nrm = np.sqrt(x[back] ** 2 + y[back] ** 2) + 1e-9
                x = x.copy(); y = y.copy()
                x[back] /= nrm
                y[back] /= nrm
        return self.cx + x * self.R, self.cy - y * self.R, z

    def pt(self, lat, lon):
        x, y, z = self.proj_xyz(_xyz(np.array([lat]), np.array([lon])), False)
        return float(x[0]), float(y[0]), float(z[0])


def great_circle(a, b, n=160):
    va, vb = _xyz(np.array(a[0]), np.array(a[1])), _xyz(np.array(b[0]), np.array(b[1]))
    om = math.acos(float(np.clip(va @ vb, -1, 1)))
    ts = np.linspace(0, 1, n)
    v = (np.sin((1 - ts) * om)[:, None] * va + np.sin(ts * om)[:, None] * vb) / math.sin(om)
    return v


def globe(c, o, alpha=1.0, res="110m", land=LAND, sea=SEA, highlight=None, grid=True, rim=True):
    """Draw the dark globe. highlight: {ADM0_A3: (color, alpha)}."""
    R = o.R
    if alpha <= 0.003:
        return
    layer(c, alpha)
    if R < 4000:
        p = skia.Paint(AntiAlias=True)
        p.setShader(skia.GradientShader.MakeRadial(skia.Point(o.cx - R * 0.3, o.cy - R * 0.35), R * 1.5,
                                                   [rgb("#13233A"), rgb(sea)], [0.0, 1.0]))
        c.drawCircle(o.cx, o.cy, R, p)
        c.save()
        clip = skia.Path(); clip.addCircle(o.cx, o.cy, R)
        c.clipPath(clip, doAntiAlias=True)
    else:
        rect(c, 0, 0, W, H, sea, 1)
        c.save()
    if grid and R < 4000:
        gp = paint("#3A5070", 0.22, stroke=1.0)
        for lat in range(-60, 90, 30):
            v = _xyz(np.full(181, float(lat)), np.linspace(-180, 180, 181))
            _path_vis(c, o, v, gp)
        for lon in range(-180, 180, 30):
            v = _xyz(np.linspace(-89, 89, 120), np.full(120, float(lon)))
            _path_vis(c, o, v, gp)
    lp = paint(land, 1)
    bp = paint("#3B5273", 0.7, stroke=0.9)
    for a3, rings in countries(res):
        col = None
        if highlight and a3 in highlight:
            col = highlight[a3]
        for r in rings:
            v = _xyz(r[:, 1], r[:, 0])
            x, y, z = o.proj_xyz(v)
            if np.all(z < 0):
                continue
            path = skia.Path()
            path.addPoly([skia.Point(float(a), float(b)) for a, b in zip(x, y)], True)
            c.drawPath(path, lp)
            if col:
                c.drawPath(path, paint(col[0], col[1]))
            c.drawPath(path, bp)
    c.restore()
    if rim and R < 4000:
        c.drawCircle(o.cx, o.cy, R, paint("#6F8BB0", 0.35, stroke=1.5))
        c.drawCircle(o.cx, o.cy, R + 4, paint("#5D7AA3", 0.18, stroke=8, blur=8))
    c.restore()


def _path_vis(c, o, v, p):
    x, y, z = o.proj_xyz(v, False)
    path = skia.Path()
    pen = False
    for a, b, zz in zip(x, y, z):
        if zz > 0:
            if pen:
                path.lineTo(float(a), float(b))
            else:
                path.moveTo(float(a), float(b)); pen = True
        else:
            pen = False
    c.drawPath(path, p)


def arc_points(o, a, b, n=160, lift=0.0):
    """Projected points of the great circle a->b (lat,lon); lift raises the arc off the surface (fraction of R)."""
    v = great_circle(a, b, n)
    if lift:
        h = 1 + lift * np.sin(np.linspace(0, math.pi, n))
        v = v * h[:, None]
    x, y, z = o.proj_xyz(v, False)
    return [(float(p), float(q)) for p, q in zip(x, y)], z


def pin(c, x, y, t, t_in, label=None, color=AMBER, r=7, alpha=1.0, label_side="right", size=22, pulse=False,
        label_color=OFFW, sub=None):
    k = eo(t, t_in, 0.3)
    a = alpha * k
    if a <= 0.003:
        return
    if pulse:
        ph = ((t - t_in) % 2.0) / 2.0
        circle(c, x, y, r + 22 * ph, color, a * (1 - ph) * 0.6, stroke=2)
    circle(c, x, y, r * 2.2, color, a * 0.25, blur=6)
    circle(c, x, y, r * mix(1.8, 1.0, k), color, a)
    circle(c, x, y, r * 0.42, NAVY, a)
    if label:
        tw = text_w(label, SANS, size, 600, 0.8)
        lx = x + r + 12 if label_side == "right" else x - r - 12 - tw
        rect(c, lx - 8, y - size * 0.95, tw + 16, size * 1.5, NAVY, 0.72 * a, r=3)
        draw_text(c, label, lx, y + size * 0.36, SANS, size, 600, label_color, a, 900, tracking=0.8, anchor="baseline")
        if sub:
            draw_text(c, sub, lx, y + size * 0.36 + size * 1.25, SANS, size * 0.78, 400, "#BFC5CE", a, 900, anchor="baseline")

# ======================================================================== flat maps (equirectangular, cos-corrected)
class Flat:
    def __init__(self, lon0, lon1, lat0, lat1, x=0, y=0, w=W, h=H):
        self.x, self.y, self.w, self.h = x, y, w, h
        latc = math.radians((lat0 + lat1) / 2)
        self.kx = math.cos(latc)
        # fit bbox into rect keeping aspect, centred
        bw = (lon1 - lon0) * self.kx
        bh = (lat1 - lat0)
        s = min(w / bw, h / bh)
        self.s = s
        self.lonc, self.latc = (lon0 + lon1) / 2, (lat0 + lat1) / 2

    def xy(self, lat, lon):
        return (self.x + self.w / 2 + (lon - self.lonc) * self.kx * self.s,
                self.y + self.h / 2 - (lat - self.latc) * self.s)

    def arr(self, ring):
        x = self.x + self.w / 2 + (ring[:, 0] - self.lonc) * self.kx * self.s
        y = self.y + self.h / 2 - (ring[:, 1] - self.latc) * self.s
        return x, y

    def path(self, ring, close=True):
        x, y = self.arr(ring)
        p = skia.Path()
        p.addPoly([skia.Point(float(a), float(b)) for a, b in zip(x, y)], close)
        return p


def flat_map(c, m, res="50m", land=LAND, sea=SEA, highlight=None, borders=True, alpha=1.0, lakes_on=True,
             dim_others=None):
    if alpha <= 0.003:
        return
    layer(c, alpha)
    c.save()
    c.clipRect(skia.Rect.MakeXYWH(m.x, m.y, m.w, m.h))
    rect(c, m.x, m.y, m.w, m.h, sea, 1)
    lp = paint(land, 1)
    bp = paint("#3B5273", 0.8, stroke=1.0)
    for a3, rings in countries(res):
        for r in rings:
            if r[:, 0].max() < m.lonc - 200 or r[:, 0].min() > m.lonc + 200:
                continue
            path = m.path(r)
            if not path.getBounds().intersects(skia.Rect.MakeXYWH(m.x - 50, m.y - 50, m.w + 100, m.h + 100)):
                continue
            c.drawPath(path, lp)
            if highlight and a3 in highlight:
                col, a = highlight[a3]
                c.drawPath(path, paint(col, a))
            if borders:
                c.drawPath(path, bp)
            else:
                c.drawPath(path, paint("#4E6890", 0.55, stroke=1.2))
    if lakes_on:
        for r in lakes(res if res in ("50m", "110m") else "50m"):
            path = m.path(r)
            if path.getBounds().intersects(skia.Rect.MakeXYWH(m.x, m.y, m.w, m.h)):
                c.drawPath(path, paint(sea, 1))
    c.restore()
    c.restore()


def curve_pts(p0, p1, bend=0.2, n=80):
    """Quadratic bezier from p0 to p1 bowed by bend (fraction of length, + = left)."""
    (x0, y0), (x1, y1) = p0, p1
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = x1 - x0, y1 - y0
    cx, cy = mx - dy * bend, my + dx * bend
    out = []
    for k in range(n + 1):
        u = k / n
        out.append(((1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1))
    return out


def arrow_head(c, pts, color=AMBER, alpha=1.0, size=16):
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    ang = math.atan2(y1 - y0, x1 - x0)
    path = skia.Path()
    path.moveTo(x1, y1)
    path.lineTo(x1 - size * math.cos(ang - 0.42), y1 - size * math.sin(ang - 0.42))
    path.lineTo(x1 - size * math.cos(ang + 0.42), y1 - size * math.sin(ang + 0.42))
    path.close()
    c.drawPath(path, paint(color, alpha))


def dashed(c, pts, prog, color=AMBER, w=3, alpha=1.0, dash=(14, 10)):
    if prog <= 0:
        return
    path = skia.Path()
    path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    meas = skia.PathMeasure(path, False)
    L = meas.getLength()
    dst = skia.Path()
    meas.getSegment(0, L * clamp(prog), dst, True)
    p = paint(color, alpha, stroke=w)
    p.setPathEffect(skia.DashPathEffect.Make(list(dash), 0))
    c.drawPath(dst, p)
