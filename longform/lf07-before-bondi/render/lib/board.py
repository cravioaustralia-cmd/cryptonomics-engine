"""board.py - M1b the evidence board, MG02 the cast board, clip stills."""
import subprocess
from functools import lru_cache
import skia
from .core import *
from .media import clip_path, SAMP, draw_cover, photo

BUILD = EP / "build"


@lru_cache(maxsize=64)
def still_of(cid, t=1.0):
    """A frame of a clip as a skia.Image (cached png in build/clipstills)."""
    d = BUILD / "clipstills"
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"{cid}_{t:.2f}.png"
    if not p.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t}", "-i", str(clip_path(cid)), "-frames:v", "1",
                        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080", str(p)], check=True)
    return skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(str(p)))


# ------------------------------------------------------------------ evidence board (M1b)
# fixed positions so every return looks identical; cards are small paper notes
BOARD_CARDS = [
    # key, title, sub, x, y
    ("fire", "THE FIRE", "Bondi · Melbourne · 2024", 300, 300),
    ("ley", "“neighbour against neighbour”", "Sussan Ley · Hansard · 26 Aug 2025", 760, 230),
    ("memories", "TWO MEMORIES", "1948 · Independence · Nakba", 1240, 300),
    ("canberra", "CANBERRA", "Jet parts · recognition · visas", 420, 640),
    ("lives", "LIVES", "Australians grieving on both sides", 960, 700),
    ("strain", "A COUNTRY UNDER STRAIN", "Courts · phones · streets", 1460, 640),
    ("bondi", "BONDI", "14 Dec 2025", 960, 470),
]
STRINGS = [("fire", "ley"), ("ley", "memories"), ("memories", "canberra"), ("canberra", "lives"), ("lives", "strain"),
           ("fire", "canberra"), ("memories", "strain")]


def board_bg(c, alpha=1.0):
    rect(c, 0, 0, W, H, "#0B1524", alpha)
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.7,
                                               [rgb("#1B2C45", 0.8 * alpha), rgb("#0B1524", 0)], [0, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    # faint cork texture lines
    for k in range(0, H, 6):
        rect(c, 0, k, W, 1, "#FFFFFF", 0.012 * alpha)


def board_card(c, key, t, t_in, alpha=1.0, bright=0.0, scale=1.0, pos=None, glow=0.0):
    d = {k: (ti, s, x, y) for k, ti, s, x, y in BOARD_CARDS}[key]
    title, sub, x, y = d
    if pos:
        x, y = pos
    k = eo(t, t_in, 0.3)
    a = alpha * k
    if a <= 0.003:
        return
    w, h = 380, 132
    c.save()
    c.translate(x, y)
    c.scale(scale * mix(1.25, 1.0, k), scale * mix(1.25, 1.0, k))
    c.rotate(((hash(key) % 7) - 3) * 0.6)
    layer(c, a)
    shadow(c, -w / 2, -h / 2, w, h, 0.6, 18, 10, 3)
    rect(c, -w / 2, -h / 2, w, h, PAPER, 1, r=3)
    if glow:
        rect(c, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, AMBER, 0.6 * glow, r=5, stroke=3, blur=4)
    tsz = 30 if len(title) < 18 else 24
    draw_text(c, title, -w / 2 + 22, -h / 2 + 40 + (tsz - 24) * 0.4, SERIF, tsz, 600, INK, 1, w - 44, anchor="baseline")
    draw_text(c, sub, -w / 2 + 22, h / 2 - 26, SANS, 17, 500, "#5B6372", 1, w - 44, anchor="baseline")
    # pin
    circle(c, 0, -h / 2 + 4, 9 + 3 * bright, AMBER, 1)
    if bright:
        circle(c, 0, -h / 2 + 4, 22, AMBER, 0.5 * bright, blur=8)
    circle(c, -2, -h / 2 + 2, 3, "#FFF4DD", 0.9)
    c.restore()
    c.restore()


def board_pos(key):
    for k, ti, s, x, y in BOARD_CARDS:
        if k == key:
            return x, y


def board_strings(c, t, pairs, t_in, alpha=1.0, pull_to=None, pull=0.0):
    for i, (a, b) in enumerate(pairs):
        (x0, y0), (x1, y1) = board_pos(a), board_pos(b)
        if pull_to:
            bx, by = board_pos(pull_to)
            x1, y1 = mix(x1, bx, pull), mix(y1, by, pull)
        k = clamp((t - t_in - i * 0.12) / 0.7)
        if k > 0:
            glow_line(c, [(x0, y0 - 62), (x1, y1 - 62)], k, AMBER, 2.0, alpha * 0.9, 5)


# ------------------------------------------------------------------ cast board (MG02)
CAST = ["ALBANESE", "NETANYAHU", "LEY", "FRANKCOM", "AHMED AL AHMED"]


def cast_board(c, t, lit_times, alpha=1.0, active=None):
    """Five identical name chips, top centre. Chips light (amber) from their first appearance; `active`
    is the chip being introduced now (brighter)."""
    if alpha <= 0.003:
        return
    sz = 16
    ws = [text_w(n, SANS, sz, 600, 2.2) + 34 for n in CAST]
    total = sum(ws) + 10 * (len(ws) - 1)
    x = W / 2 - total / 2
    layer(c, alpha)
    for n, w in zip(CAST, ws):
        lt = lit_times.get(n)
        lit = 0.0 if lt is None or t < lt else eo(t, lt, 0.35)
        act = 1.0 if (active == n) else 0.0
        rect(c, x, 44, w, 34, NAVY, 0.86, r=17)
        col = "#5A6A82" if lit <= 0 else AMBER
        rect(c, x, 44, w, 34, col, 0.6 + 0.4 * lit, r=17, stroke=1.4)
        if act and lit:
            rect(c, x, 44, w, 34, AMBER, 0.35 * lit, r=17, blur=8)
        draw_text(c, n, x, 67, SANS, sz, 600, OFFW if lit else "#8995A8", 1, w, "center", tracking=2.2, anchor="baseline")
        x += w + 10
    c.restore()
