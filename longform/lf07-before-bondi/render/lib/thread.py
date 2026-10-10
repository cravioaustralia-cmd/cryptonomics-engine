"""thread.py - M1 The Thread: dark globe, amber line Bondi -> Gaza, branches, node rail.
Looks identical every time it returns (same camera, colours, rail)."""
import math
import numpy as np
import skia
from .core import *
from .geo import Ortho, globe, arc_points, P, pin

CAM = dict(cx=760, cy=548, R=430, lat0=-2.0, lon0=93.0)
NODES = [("THE FIRE", "Melbourne"), ("TWO MEMORIES", "Jerusalem"), ("CANBERRA", "Canberra"),
         ("LIVES", "Deir al-Balah"), ("BONDI", "Bondi")]
RAIL_X, RAIL_Y0, RAIL_DY = 1430, 330, 92
BRANCHES = [(0.16, "1917", 1), (0.32, "1947", -1), (0.52, "OCT 2023", 1), (0.70, "OCT 2024", -1), (0.86, "AUG 2025", 1)]


def cam_at(k_rise=1.0):
    """k_rise 0 = right above Bondi (close), 1 = standard globe framing."""
    if k_rise >= 1:
        return Ortho(**CAM)
    e = ease_io(k_rise)
    R = math.exp(mix(math.log(26000), math.log(CAM["R"]), e))
    lat0 = mix(P["Bondi"][0], CAM["lat0"], e)
    lon0 = mix(P["Bondi"][1], CAM["lon0"], e)
    o = Ortho(CAM["cx"], CAM["cy"], R, lat0, lon0)
    # keep Bondi near the frame centre early in the rise
    bx, by, _ = o.pt(*P["Bondi"])
    sx, sy = mix(W / 2 - bx, 0, e), mix(H / 2 - by, 0, e)
    o.cx += sx
    o.cy += sy
    return o


def draw_thread(c, t, o=None, prog=1.0, branches=0.0, branch_dim=0.0, nodes=None, pull=0.0, alpha=1.0,
                counter=None, thread_dim=0.0, rail_alpha=1.0, extremism=0.0, glow_warm=0.0, res="110m",
                labels=True, trail=None):
    """nodes: {name: t_lit}. pull 0..1 pulls every node's leader into Bondi (S34)."""
    o = o or Ortho(**CAM)
    space(c)
    globe(c, o, alpha, res=res if o.R < 3000 else "50m")
    if alpha <= 0.003:
        return o
    layer(c, alpha)
    # the Thread: a bowed amber line between the two projected points (same shape every time)
    from .geo import curve_pts
    bx_, by_, _ = o.pt(*P["Bondi"])
    gx_, gy_, _ = o.pt(*P["Gaza"])
    vis = curve_pts((bx_, by_), (gx_, gy_), -0.22, 180)
    tcol = AMBER
    ta = 1 - 0.75 * thread_dim
    if prog > 0 and len(vis) > 1:
        glow_line(c, vis, prog, tcol, 3.2 + 1.5 * glow_warm, ta, 10 + 12 * glow_warm)
        hx, hy = vis[min(len(vis) - 1, int(prog * (len(vis) - 1)))]
        if prog < 1:
            circle(c, hx, hy, 6, AMBER, ta, blur=2)
    # branches toward dates
    if branches > 0 and len(vis) > 1:
        for k, (f, lab, side) in enumerate(BRANCHES):
            bk = clamp((branches - k * 0.12) / 0.5)
            if bk <= 0:
                continue
            i = int(f * (len(vis) - 1))
            (x0, y0), (x1, y1) = vis[max(0, i - 1)], vis[min(len(vis) - 1, i + 1)]
            ang = math.atan2(y1 - y0, x1 - x0) + side * math.pi / 2
            sx, sy = vis[i]
            L = 120 + 30 * (k % 2)
            ex, ey = sx + math.cos(ang) * L + math.cos(ang - side * 0.9) * 40, sy + math.sin(ang) * L
            bp = [(sx, sy), ((sx + ex) / 2 + math.cos(ang - side * 1.2) * 30, (sy + ey) / 2 + math.sin(ang - side * 1.2) * 30), (ex, ey)]
            # smooth via subdivision
            from .geo import curve_pts
            cp = curve_pts((sx, sy), (ex, ey), 0.18 * side, 30)
            col = mix_col(AMBER, GREY, branch_dim)
            ba = (1 - 0.45 * branch_dim) * ta
            glow_line(c, cp, bk, col, 1.6, ba, 5 * (1 - branch_dim))
            if bk >= 1:
                draw_text(c, lab, ex - 60 + (40 if math.cos(ang) > 0 else -40), ey + (26 if math.sin(ang) > 0 else -12), MONO, 19, 500,
                          col, ba * eo(t, 0, 0.1) * 1.0, 120, "center", anchor="baseline")
    if extremism > 0:
        # one bright line labelled EXTREMISM while the rest dims (S41)
        ex0, ey0, _ = o.pt(*P["Bondi"])
        glow_line(c, [(ex0, ey0), (ex0 + 150, ey0 - 260), (ex0 + 330, ey0 - 330)], extremism, AMBER, 3.0, 1.0, 12)
        if extremism > 0.9:
            draw_text(c, "EXTREMISM", ex0 + 250, ey0 - 345, SANS, 24, 700, AMBER, smooth(extremism, 0.9, 1.0), 300,
                      tracking=3, anchor="baseline")
    if counter:
        draw_text(c, counter, o.cx - 400, o.cy - o.R - 34, SANS, 34, 600, AMBER, 1, 800, "center", tracking=3, anchor="baseline")
    if trail is not None:
        trail(c, o)
    # node rail
    if nodes is not None and rail_alpha > 0:
        bx, by, _ = o.pt(*P["Bondi"])
        for k, (name, place) in enumerate(NODES):
            lit_t = nodes.get(name)
            lit = 0.0 if lit_t is None else eo(t, lit_t, 0.35)
            ry = RAIL_Y0 + k * RAIL_DY
            px, py, pz = o.pt(*P[place])
            col = mix_col("#4A5A72", AMBER, lit)
            # leader
            if lit > 0 and pz > 0:
                tx, ty = (mix(px, bx, pull), mix(py, by, pull))
                from .geo import curve_pts
                cp = curve_pts((RAIL_X - 14, ry), (tx, ty), -0.12, 40)
                glow_line(c, cp, clamp((t - lit_t) / 0.9), AMBER, 1.5, 0.75 * rail_alpha, 4)
                circle(c, tx, ty, 5, AMBER, rail_alpha * lit)
            rect(c, RAIL_X, ry - 24, 330, 48, NAVY, 0.85 * rail_alpha, r=3)
            rect(c, RAIL_X, ry - 24, 330, 48, col, (0.45 + 0.55 * lit) * rail_alpha, r=3, stroke=1.4)
            circle(c, RAIL_X + 22, ry, 7, col, rail_alpha)
            if lit > 0:
                circle(c, RAIL_X + 22, ry, 14, AMBER, 0.35 * lit * rail_alpha, blur=6)
            draw_text(c, name, RAIL_X + 42, ry + 8, SANS, 21, 600, mix_col("#7D8BA0", OFFW, lit), rail_alpha, 300,
                      tracking=2.4, anchor="baseline")
    c.restore()
    return o


def mix_col(a, b, k):
    a, b = a.lstrip("#"), b.lstrip("#")
    ca = [int(a[i:i + 2], 16) for i in (0, 2, 4)]
    cb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{int(round(mix(x, y, clamp(k)))):02X}" for x, y in zip(ca, cb))


def space(c):
    """Navy space behind the globe (no stars: calm)."""
    rect(c, 0, 0, W, H, "#060C16", 1)
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(CAM["cx"], CAM["cy"]), 1100,
                                               [rgb("#15253C", 1), rgb("#0A1320", 1), rgb("#060C16", 1)], [0, 0.45, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
