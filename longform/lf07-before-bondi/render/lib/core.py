"""core.py - canvas, tokens, fonts, text, easing for lf07 'Before Bondi' (skia raster)."""
import math
from functools import lru_cache
from pathlib import Path
import numpy as np
import skia

EP = Path(__file__).resolve().parents[2]
W, H, FPS = 1920, 1080, 30

# ---------------------------------------------------------------- design tokens
def rgb(h, a=1.0):
    h = h.lstrip("#")
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(round(255 * max(0, min(1, a)))))

NAVY = "#0E1A2B"
PAPER = "#F2EEE6"
AMBER = "#E8A33D"
GREY = "#8A8A8A"
LAND = "#22324A"
SEA = "#0A1422"
INK = "#1B2433"      # text on paper
OFFW = "#F2EEE6"     # off-white text on navy
NAVY2 = "#16263D"    # raised navy

# ---------------------------------------------------------------- fonts
FONT_DIR = EP / "fonts"
_FILES = {
    "Source Serif 4": ["SourceSerif4-Regular.ttf", "SourceSerif4-Semibold.ttf", "SourceSerif4-Bold.ttf", "SourceSerif4-It.ttf"],
    "Inter": ["Inter-Regular.ttf", "Inter-Medium.ttf", "Inter-SemiBold.ttf", "Inter-Bold.ttf", "Inter-Italic.ttf"],
    "IBM Plex Mono": ["IBMPlexMono-Regular.ttf", "IBMPlexMono-Medium.ttf", "IBMPlexMono-SemiBold.ttf", "IBMPlexMono-Bold.ttf"],
}
_PROVIDER = skia.textlayout.TypefaceFontProvider()
_TF = {}
for fam, files in _FILES.items():
    for f in files:
        tf = skia.Typeface.MakeFromFile(str(FONT_DIR / f))
        _PROVIDER.registerTypeface(tf)
        _TF[f] = tf
_COLL = skia.textlayout.FontCollection()
_COLL.setDefaultFontManager(_PROVIDER)

SERIF, SANS, MONO = "Source Serif 4", "Inter", "IBM Plex Mono"


def typeface(fam, weight=400, italic=False):
    m = {SERIF: {400: "SourceSerif4-Regular.ttf", 600: "SourceSerif4-Semibold.ttf", 700: "SourceSerif4-Bold.ttf"},
         SANS: {400: "Inter-Regular.ttf", 500: "Inter-Medium.ttf", 600: "Inter-SemiBold.ttf", 700: "Inter-Bold.ttf"},
         MONO: {400: "IBMPlexMono-Regular.ttf", 500: "IBMPlexMono-Medium.ttf", 600: "IBMPlexMono-SemiBold.ttf", 700: "IBMPlexMono-Bold.ttf"}}
    if italic and fam == SERIF:
        return _TF["SourceSerif4-It.ttf"]
    if italic and fam == SANS:
        return _TF["Inter-Italic.ttf"]
    return _TF[m[fam][weight]]


@lru_cache(maxsize=4096)
def _para(text, fam, size, weight, italic, color, width, align, tracking, lh):
    tl = skia.textlayout
    ps = tl.ParagraphStyle()
    ps.setTextAlign({"left": tl.TextAlign.kLeft, "center": tl.TextAlign.kCenter, "right": tl.TextAlign.kRight}[align])
    ts = tl.TextStyle()
    ts.setFontFamilies([fam])
    ts.setFontSize(size)
    ts.setFontStyle(skia.FontStyle(weight, skia.FontStyle.kNormal_Width,
                                   skia.FontStyle.kItalic_Slant if italic else skia.FontStyle.kUpright_Slant))
    ts.setColor(color)
    if tracking:
        ts.setLetterSpacing(tracking)
    ps.setTextStyle(ts)
    b = tl.ParagraphBuilder(ps, _COLL, skia.Unicode())
    b.pushStyle(ts)
    b.addText(text)
    p = b.Build()
    p.layout(width)
    return p


def para(text, fam=SANS, size=32, weight=400, color=OFFW, alpha=1.0, width=1800, align="left",
         tracking=0.0, italic=False, lh=None):
    """Return a laid-out paragraph (cached). color is a hex token."""
    return _para(text, fam, float(size), int(weight), bool(italic), rgb(color, alpha), float(width), align,
                 float(tracking), lh)


def draw_text(c, text, x, y, fam=SANS, size=32, weight=400, color=OFFW, alpha=1.0, width=1800, align="left",
              tracking=0.0, italic=False, lh=None, anchor="top"):
    """Draw text; x is the left edge of the box (align applies inside width). y = top of the box
    (anchor='top') or baseline of the first line (anchor='baseline'). Returns (paragraph, height)."""
    if alpha <= 0.003 or not text:
        return None, 0
    p = para(text, fam, size, weight, color, alpha, width, align, tracking, italic, lh)
    yy = y - p.AlphabeticBaseline if anchor == "baseline" else y
    p.paint(c, x, yy)
    return p, p.Height


def text_w(text, fam=SANS, size=32, weight=400, tracking=0.0, italic=False):
    p = para(text, fam, size, weight, OFFW, 1.0, 10000, "left", tracking, italic)
    return p.LongestLine


def smallcaps(c, text, x, y, size=20, color=OFFW, alpha=1.0, weight=500, tracking=1.2, fam=SANS, align="left", width=1800):
    """Faux small caps: capitals at full size for initials, the rest at 0.80. Drawn word by word."""
    if alpha <= 0.003:
        return 0
    words = text.split(" ")
    # measure
    def wlen(w):
        return text_w(w.upper(), fam, size * 0.82, weight, tracking)
    sp = size * 0.32
    total = sum(wlen(w) for w in words) + sp * (len(words) - 1)
    if align == "center":
        x = x + (width - total) / 2
    elif align == "right":
        x = x + width - total
    cx = x
    for w in words:
        draw_text(c, w.upper(), cx, y, fam, size * 0.82, weight, color, alpha, 4000, "left", tracking, anchor="baseline")
        cx += wlen(w) + sp
    return total

# ---------------------------------------------------------------- easing / timing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lin(t, t0, t1):
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return clamp((t - t0) / (t1 - t0))


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def ease_io(x):
    x = clamp(x)
    return 3 * x * x - 2 * x * x * x


def smooth(t, t0, t1):
    return ease_io(lin(t, t0, t1))


def eo(t, t0, dur=0.3):
    """ease-out entrance progress (0..1) starting at t0 lasting dur (200-350 ms house rule)."""
    return ease_out(lin(t, t0, t0 + dur))


def fade(t, t_in, t_out=None, d_in=0.3, d_out=0.3):
    a = eo(t, t_in, d_in)
    if t_out is not None:
        a *= 1 - smooth(t, t_out, t_out + d_out)
    return a


def mix(a, b, k):
    return a + (b - a) * k

# ---------------------------------------------------------------- paints / primitives
def paint(color=OFFW, alpha=1.0, stroke=None, aa=True, blur=0.0, cap="round"):
    p = skia.Paint(AntiAlias=aa, Color=rgb(color, alpha))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap({"round": skia.Paint.kRound_Cap, "butt": skia.Paint.kButt_Cap, "square": skia.Paint.kSquare_Cap}[cap])
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


def rect(c, x, y, w, h, color, alpha=1.0, r=0.0, stroke=None, blur=0.0):
    p = paint(color, alpha, stroke, blur=blur)
    rr = skia.Rect.MakeXYWH(x, y, w, h)
    if r:
        c.drawRoundRect(rr, r, r, p)
    else:
        c.drawRect(rr, p)


def shadow(c, x, y, w, h, alpha=0.5, blur=24, dy=10, r=0):
    rect(c, x, y + dy, w, h, "#000000", alpha, r=r, blur=blur)


def line(c, x0, y0, x1, y1, color=AMBER, alpha=1.0, w=3.0, blur=0.0, cap="round"):
    c.drawLine(x0, y0, x1, y1, paint(color, alpha, stroke=w, blur=blur, cap=cap))


def circle(c, x, y, r, color=AMBER, alpha=1.0, stroke=None, blur=0.0):
    c.drawCircle(x, y, r, paint(color, alpha, stroke, blur=blur))


def glow_line(c, pts, prog=1.0, color=AMBER, w=3.0, alpha=1.0, glow=10.0):
    """Polyline drawn to fraction prog of its length, with a soft glow under it."""
    if prog <= 0 or len(pts) < 2:
        return None
    path = skia.Path()
    path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    if prog < 1:
        meas = skia.PathMeasure(path, False)
        L = meas.getLength()
        dst = skia.Path()
        meas.getSegment(0, L * prog, dst, True)
        path = dst
    if glow:
        c.drawPath(path, paint(color, alpha * 0.45, stroke=w * 3.2, blur=glow))
    c.drawPath(path, paint(color, alpha, stroke=w))
    return path


def path_point(pts, prog):
    path = skia.Path()
    path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    meas = skia.PathMeasure(path, False)
    L = meas.getLength()
    pos, _ = meas.getPosTan(L * clamp(prog))
    return pos.x(), pos.y()


def new_surface():
    return skia.Surface(W, H)


def layer(c, alpha=1.0):
    """Save a layer with alpha; pair with c.restore()."""
    p = skia.Paint()
    p.setAlphaf(clamp(alpha))
    c.saveLayer(None, p)


def arr_to_image(a):
    """numpy HxWx3 uint8 (RGB) or HxWx4 -> skia.Image."""
    if a.shape[2] == 3:
        a = np.concatenate([a, np.full(a.shape[:2] + (1,), 255, np.uint8)], axis=2)
    a = np.ascontiguousarray(a)
    return skia.Image.fromarray(a, colorType=skia.kRGBA_8888_ColorType)
