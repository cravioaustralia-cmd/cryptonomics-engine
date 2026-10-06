"""lf05 design system: palette, fonts, overlay elements and card builders.

Documentary graphics for *94 Seats vs 30%: Can Albanese Stop Pauline Hanson?*
Every card is drawn with Pillow onto a transparent 1920x1080 layer. Base engine (El, compose, Ken Burns
helpers) is carried over from the lf04 pipeline; the cards are new for lf05.

Wording on cards must match the spoken words in audio/vo-text (see cut.py). Numbers on screen are the
spoken numbers only. Evidence labels: FACT (white), CLAIM (orange outline), ANALYSIS (blue #3A7BD5),
SPECULATION (grey, dashed; ending only).
"""
import math
import os
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
FONT_DIR = os.path.join(HERE, "fonts")

# Palette. Series threads: gold = Albanese, orange-red = Hanson.
INK = (11, 14, 20)
INK2 = (22, 28, 38)
PAPER = (240, 236, 226)
MUTED = (160, 164, 170)
GOLD = (212, 160, 23)        # #D4A017
ORANGE = (232, 85, 42)       # #E8552A
BLUE = (58, 123, 213)        # #3A7BD5 ANALYSIS
GREY = (150, 154, 160)       # SPECULATION
STEEL = (122, 140, 166)      # Coalition / others in data graphics (neutral)
DIM = (70, 76, 86)
WHITE = (250, 248, 242)


@lru_cache(None)
def font(name, size):
    files = {
        "head": "BigShoulders-Bold.ttf",
        "headr": "BigShoulders-Regular.ttf",
        "body": "InstrumentSans-Regular.ttf",
        "bodyb": "InstrumentSans-Bold.ttf",
        "bodyi": "InstrumentSans-Italic.ttf",
        "mono": "IBMPlexMono-Regular.ttf",
        "monob": "IBMPlexMono-Bold.ttf",
        "quote": "IBMPlexSerif-Italic.ttf",
        "quoteb": "IBMPlexSerif-BoldItalic.ttf",
    }
    return ImageFont.truetype(os.path.join(FONT_DIR, files[name]), size)


def ease_out(p):
    p = max(0.0, min(1.0, p))
    return 1 - (1 - p) ** 3


def ease_io(p):
    p = max(0.0, min(1.0, p))
    return 3 * p * p - 2 * p * p * p


def A(c, a):
    return tuple(c[:3]) + (int(max(0, min(255, a))),)


# ---------------------------------------------------------------- text utils

def tw(s, f, tracking=0):
    if not s:
        return 0
    if tracking == 0:
        return f.getlength(s)
    return sum(f.getlength(c) for c in s) + tracking * (len(s) - 1)


def text(d, xy, s, f, fill, tracking=0, anchor="la"):
    """Draw text with optional letter spacing. anchor: la / ma / ra (left/mid/right, ascender)."""
    x, y = xy
    w = tw(s, f, tracking)
    if anchor[0] == "m":
        x -= w / 2
    elif anchor[0] == "r":
        x -= w
    if tracking == 0:
        d.text((x, y), s, font=f, fill=fill, anchor="la")
        return w
    for c in s:
        d.text((x, y), c, font=f, fill=fill, anchor="la")
        x += f.getlength(c) + tracking
    return w


def wrap(s, f, maxw):
    out = []
    for para in s.split("\n"):
        words = para.split()
        cur = ""
        for w_ in words:
            t = (cur + " " + w_).strip()
            if f.getlength(t) <= maxw or not cur:
                cur = t
            else:
                out.append(cur)
                cur = w_
        out.append(cur)
    return out


def lh(f):
    a, d_ = f.getmetrics()
    return a + d_


def blank(w=W, h=H):
    return Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0))


def shadowed(img, radius=14, opacity=0.55, spread=0):
    """Soft drop shadow behind an RGBA layer so text reads over busy footage."""
    a = img.getchannel("A")
    if spread:
        a = a.filter(ImageFilter.MaxFilter(spread * 2 + 1))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh.putalpha(a.point(lambda v: int(v * opacity)).filter(ImageFilter.GaussianBlur(radius)))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(sh)
    out.alpha_composite(img)
    return out


def fade_img(img, a):
    if a >= 0.997:
        return img
    arr = np.array(img)
    arr[..., 3] = (arr[..., 3].astype(np.float32) * max(0.0, a)).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def arrow(d, x0, y0, x1, y1, fill, width=6, head=22):
    d.line([(x0, y0), (x1, y1)], fill=fill, width=width)
    ang = math.atan2(y1 - y0, x1 - x0)
    pts = [
        (x1 + 4 * math.cos(ang), y1 + 4 * math.sin(ang)),
        (x1 - head * math.cos(ang - 0.45), y1 - head * math.sin(ang - 0.45)),
        (x1 - head * math.cos(ang + 0.45), y1 - head * math.sin(ang + 0.45)),
    ]
    d.polygon(pts, fill=fill)


def dashed_rect(d, box, fill, width=3, dash=16, gap=10):
    x0, y0, x1, y1 = box
    for (ax, ay, bx, by) in ((x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)):
        L = math.hypot(bx - ax, by - ay)
        n = int(L // (dash + gap)) + 1
        for i in range(n):
            s = i * (dash + gap)
            e = min(L, s + dash)
            if s >= L:
                break
            d.line([(ax + (bx - ax) * s / L, ay + (by - ay) * s / L), (ax + (bx - ax) * e / L, ay + (by - ay) * e / L)],
                   fill=fill, width=width)


def padlock(size, colour, open_=False, fill_alpha=0):
    """Simple padlock icon drawn with shapes (no font glyphs)."""
    s = size
    im = blank(s, int(s * 1.25))
    d = ImageDraw.Draw(im)
    lw = max(3, s // 12)
    bx0, by0, bx1, by1 = s * 0.12, s * 0.52, s * 0.88, s * 1.2
    sx0, sx1 = s * 0.27, s * 0.73
    lift = s * 0.16 if open_ else 0
    d.arc([sx0, s * 0.12 - lift, sx1, s * 0.82 - lift], 180, 360, fill=colour, width=lw)
    d.line([(sx0 + lw / 2 - 1, s * 0.47 - lift), (sx0 + lw / 2 - 1, by0)], fill=colour, width=lw)
    if not open_:
        d.line([(sx1 - lw / 2, s * 0.47), (sx1 - lw / 2, by0)], fill=colour, width=lw)
    if fill_alpha:
        d.rounded_rectangle([bx0, by0, bx1, by1], radius=s * 0.08, fill=colour[:3] + (fill_alpha,))
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=s * 0.08, outline=colour, width=lw)
    cx = s * 0.5
    d.ellipse([cx - s * 0.07, by0 + s * 0.17, cx + s * 0.07, by0 + s * 0.31], fill=INK + (255,) if fill_alpha else colour)
    return im


# ---------------------------------------------------------------- elements

class El:
    """An overlay element on the absolute (1x) timeline.

    make(p) returns an RGBA image; p is build progress 0..1 over `build` seconds.
    Static elements (build=None) are rendered once.
    """

    def __init__(self, t0, t1, make, x=0, y=0, anim="fade", ain=0.4, aout=0.3, slide=26, build=None,
                 z=0, name=""):
        self.t0, self.t1 = t0, t1
        self.make, self.x, self.y = make, x, y
        self.anim, self.ain, self.aout, self.slide = anim, ain, aout, slide
        self.build = build
        self.z = z
        self.name = name
        self._static = None
        self._cache = {}

    def active(self, T):
        return self.t0 - 1e-6 <= T < self.t1

    def image(self, T):
        if self.build is None:
            if self._static is None:
                self._static = self.make(1.0)
            return self._static
        p = (T - self.t0) / self.build
        if p >= 1:
            if self._static is None:
                self._static = self.make(1.0)
            return self._static
        key = round(p * 600)
        if key not in self._cache:
            if len(self._cache) > 64:
                self._cache.clear()
            self._cache[key] = self.make(max(0.0, key / 600))
        return self._cache[key]

    def state(self, T):
        a_in = ease_out((T - self.t0) / self.ain) if self.ain > 0 else 1.0
        a_out = ease_io((self.t1 - T) / self.aout) if self.aout > 0 else 1.0
        a = min(a_in, a_out)
        dx = dy = 0
        if self.anim == "up":
            dy = (1 - a_in) * self.slide
        elif self.anim == "left":
            dx = -(1 - a_in) * self.slide
        elif self.anim == "right":
            dx = (1 - a_in) * self.slide
        return a, dx, dy


def dyn(t0, t1, frame, z=20, ain=0.4, aout=0.4, name="dyn"):
    """Element whose image is a function of absolute time T (charts that build on spoken cues)."""
    e = El(t0, t1, None, anim="fade", ain=ain, aout=aout, z=z, name=name)
    e.image = lambda T: frame(T)
    return e


def compose(elements, T, base=None):
    canvas = base if base is not None else blank()
    act = sorted([e for e in elements if e.active(T)], key=lambda e: e.z)
    for e in act:
        a, dx, dy = e.state(T)
        if a <= 0.003:
            continue
        img = fade_img(e.image(T), a)
        canvas.alpha_composite(img, (int(round(e.x + dx)), int(round(e.y + dy))))
    return canvas


def at(T, t, dur=0.45):
    """Reveal progress (0..1) of something that starts at absolute time t."""
    if t is None:
        return 1.0
    return ease_out((T - t) / dur) if T >= t else 0.0


# ---------------------------------------------------------------- evidence labels

LABEL_STYLE = {
    "FACT": dict(fill=WHITE, text=INK, outline=None, dashed=False),
    "FACT · REPORTED": dict(fill=WHITE, text=INK, outline=None, dashed=False),
    "CLAIM": dict(fill=None, text=ORANGE, outline=ORANGE, dashed=False),
    "ANALYSIS": dict(fill=BLUE, text=WHITE, outline=None, dashed=False),
    "SPECULATION": dict(fill=None, text=GREY, outline=GREY, dashed=True),
}


def label_img(kind, size=24):
    st = LABEL_STYLE[kind]
    f = font("monob", size)
    w_ = int(tw(kind, f, 3) + size * 1.6)
    h_ = int(size * 1.75)
    im = blank(w_ + 8, h_ + 8)
    d = ImageDraw.Draw(im)
    box = [4, 4, 4 + w_, 4 + h_]
    if st["fill"]:
        d.rectangle(box, fill=st["fill"] + (255,))
    elif not st["dashed"]:
        d.rectangle(box, fill=INK + (200,))
        d.rectangle(box, outline=st["outline"] + (255,), width=3)
    else:
        d.rectangle(box, fill=INK + (200,))
        dashed_rect(d, box, st["outline"] + (255,), width=3, dash=10, gap=6)
    text(d, (4 + w_ / 2, 4 + (h_ - size * 1.18) / 2), kind, f, st["text"] + (255,), 3, anchor="ma")
    return im


def label_colour(kind):
    return {"FACT": WHITE, "FACT · REPORTED": WHITE, "CLAIM": ORANGE, "ANALYSIS": BLUE, "SPECULATION": GREY}[kind]


def ev_label(t0, t1, kind, x=None, y=None, size=26, z=55):
    """Standalone evidence label (default top-right)."""
    im = label_img(kind, size)
    xx = W - im.size[0] - 56 if x is None else x
    yy = 40 if y is None else y
    e = El(t0, t1, lambda _: im, x=xx, y=yy, anim="fade", ain=0.3, aout=0.3, z=z, name="ev")
    return e


# ---------------------------------------------------------------- persistent furniture

def chapter_tag(t0, t1, kicker, title, colours=(GOLD,)):
    """Small top-left tag, e.g. PART ONE · HOW STRONG IS ANTHONY ALBANESE?, with thread colour chips."""
    def mk(_):
        fk = font("monob", 21)
        ft = font("mono", 21)
        w_ = int(tw(kicker, fk, 3) + tw(title, ft, 2) + 90 + 16 * len(colours))
        im = blank(w_ + 40, 70)
        d = ImageDraw.Draw(im)
        x = 20
        for c in colours:
            d.rectangle([x, 22, x + 10, 36], fill=c)
            x += 16
        x += 12
        x += text(d, (x, 16), kicker, fk, PAPER, 3) + 18
        d.line([(x, 18), (x, 40)], fill=PAPER + (140,), width=2)
        text(d, (x + 18, 16), title, ft, PAPER + (225,), 2)
        return shadowed(im, 8, 0.75)
    return El(t0, t1, mk, x=40, y=30, anim="fade", ain=0.5, aout=0.4, z=50, name="tag")


def section_label(t0, t1, kind):
    """Top-left ANALYSIS (blue) or SPECULATION (grey, dashed) section box."""
    st = LABEL_STYLE[kind]

    def mk(p):
        f = font("head", 40)
        w_ = int(tw(kind, f, 6) + 56)
        im = blank(w_ + 30, 90)
        d = ImageDraw.Draw(im)
        reveal = int(w_ * ease_out(p))
        box = [10, 14, 10 + reveal, 74]
        if st["dashed"]:
            d.rectangle(box, fill=INK + (190,))
            if reveal > 20:
                dashed_rect(d, box, GREY + (255,), width=4, dash=14, gap=8)
            col = GREY
        else:
            d.rectangle(box, fill=st["fill"] + (255,))
            col = WHITE
        if p > 0.35:
            sub = blank(w_ + 30, 90)
            sd = ImageDraw.Draw(sub)
            text(sd, (38, 22), kind, f, col, 6)
            m = Image.new("L", sub.size, 0)
            ImageDraw.Draw(m).rectangle(box, fill=255)
            im.paste(sub, (0, 0), Image.composite(sub.getchannel("A"), Image.new("L", sub.size, 0), m))
        return shadowed(im, 10, 0.5)
    return El(t0, t1, mk, x=30, y=88, anim="fade", ain=0.2, aout=0.4, build=0.6, z=51, name="section")


def ai_label(t0, t1):
    def mk(_):
        f = font("mono", 20)
        s = "DRAMATISED RECONSTRUCTION"
        w_ = int(tw(s, f, 2) + 36)
        im = blank(w_ + 20, 60)
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([10, 10, 10 + w_, 48], radius=6, fill=INK + (190,), outline=PAPER + (90,), width=1)
        text(d, (28, 17), s, f, PAPER + (230,), 2)
        return im
    return El(t0, t1, mk, x=W - 420, y=H - 92, anim="fade", ain=0.3, aout=0.3, z=60, name="ai")


def thread_bar(t0, t1, colours, y=H - 14, build=1.2):
    """Thin thread(s) across the very bottom of frame: gold = Albanese, orange-red = Hanson."""
    def mk(p):
        im = blank(W, 14)
        d = ImageDraw.Draw(im)
        n = len(colours)
        for i, c in enumerate(colours):
            yy = 3 + i * 6 if n > 1 else 5
            d.line([(0, yy), (W * ease_out(p), yy)], fill=c + (230,), width=4)
        return im
    return El(t0, t1, mk, x=0, y=y - 7, anim="fade", ain=0.3, aout=0.4, build=build, z=49, name="thread")


# ---------------------------------------------------------------- lower-thirds & tags

def lower_third(t0, t1, name, role, colour=GOLD):
    def mk(_):
        fn = font("head", 62)
        fr = font("body", 32)
        w_ = int(max(tw(name.upper(), fn, 3), tw(role, fr)) + 80)
        im = blank(w_ + 40, 190)
        d = ImageDraw.Draw(im)
        d.rectangle([20, 30, 30, 160], fill=colour)
        text(d, (52, 30), name.upper(), fn, PAPER, 3)
        text(d, (54, 112), role, fr, PAPER + (230,))
        return shadowed(im, 16, 0.8, spread=4)
    return El(t0, t1, mk, x=70, y=H - 270, anim="left", ain=0.5, aout=0.4, slide=40, z=40, name="l3")


def date_lt(t0, t1, line):
    """Plain date lower-third (no animation over the picture beyond a fade)."""
    def mk(_):
        f = font("monob", 30)
        w_ = int(tw(line, f, 3) + 60)
        im = blank(w_ + 40, 100)
        d = ImageDraw.Draw(im)
        d.rectangle([20, 20, 20 + w_, 80], fill=INK + (215,))
        text(d, (50, 33), line, f, PAPER, 3)
        return im
    return El(t0, t1, mk, x=50, y=H - 170, anim="fade", ain=0.4, aout=0.4, z=40, name="date")


def card(t0, t1, kind, head, body, source=None, pos="bl", width=1000, size=40, accent=None, x=None, y=None,
         z=30, quote=False):
    """Evidence card: label pill + kicker + body (+ source line) on an ink panel."""
    acc = accent or label_colour(kind)
    lab = label_img(kind, 22) if kind else None

    def mk(_):
        fh = font("monob", 22)
        fb = font("quote" if quote else "body", size)
        fs = font("mono", 20)
        lines = wrap(body, fb, width - 70)
        slines = wrap(source, fs, width - 70) if source else []
        h_ = 64 + len(lines) * int(lh(fb) * 1.06) + (len(slines) * lh(fs) + 18 if slines else 0) + 30
        hw = tw(head, fh, 3) + (lab.size[0] + 24 if lab else 0)
        w_ = int(max(max(tw(l_, fb) for l_ in lines), hw, max([tw(s, fs) for s in slines] or [0])) + 76)
        im = blank(w_ + 40, h_ + 40)
        d = ImageDraw.Draw(im)
        d.rectangle([20, 20, 20 + w_, 20 + h_], fill=INK + (222,))
        d.rectangle([20, 20, 28, 20 + h_], fill=acc)
        xh = 52
        if lab:
            im.alpha_composite(lab, (xh - 4, 32))
            xh += lab.size[0] + 16
        text(d, (xh, 40), head, fh, PAPER + (215,), 3)
        yy = 84
        for l_ in lines:
            d.text((52, yy), l_, font=fb, fill=PAPER)
            yy += int(lh(fb) * 1.06)
        if slines:
            yy += 12
            for s in slines:
                d.text((52, yy), s, font=fs, fill=MUTED)
                yy += lh(fs)
        return shadowed(im, 14, 0.55)

    im = mk(1)
    e = El(t0, t1, mk, anim="up", ain=0.45, aout=0.35, z=z, name="card")
    e._static = im
    if x is not None:
        e.x, e.y = x, y
    elif pos == "bl":
        e.x, e.y = 40, H - im.size[1] - 50
    elif pos == "br":
        e.x, e.y = W - im.size[0] - 40, H - im.size[1] - 50
    elif pos == "tl":
        e.x, e.y = 40, 150
    elif pos == "tr":
        e.x, e.y = W - im.size[0] - 40, 150
    elif pos == "c":
        e.x, e.y = (W - im.size[0]) / 2, (H - im.size[1]) / 2
    elif pos == "bc":
        e.x, e.y = (W - im.size[0]) / 2, H - im.size[1] - 50
    return e


# ---------------------------------------------------------------- full-frame cards

def scrim(t0, t1, alpha=150, z=1):
    def mk(_):
        return Image.new("RGBA", (W, H), INK + (alpha,))
    return El(t0, t1, mk, anim="fade", ain=0.35, aout=0.3, z=z, name="scrim")


def vignette_img():
    y, x = np.ogrid[0:H, 0:W]
    r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
    a = np.clip((r - 0.55) / 0.9, 0, 1) ** 1.6 * 200
    arr = np.zeros((H, W, 4), np.uint8)
    arr[..., 3] = a.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def big_number(t0, t1, number, caption, kicker=None, source=None, count=None, colour=PAPER, y=300,
               size=230, build=None, kind=None, z=20):
    """Big centred number. count=(start,end,fmt) animates digits up to the spoken figure."""
    lab = label_img(kind, 24) if kind else None

    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        fn = font("head", size)
        yy = y
        if kicker:
            fk = font("monob", 28)
            text(d, (W / 2, yy - 70), kicker, fk, PAPER + (220,), 5, anchor="ma")
        if lab:
            im.alpha_composite(lab, (int(W / 2 - lab.size[0] / 2), int(yy - 140)))
        s = number
        if count and p < 1:
            a, b, fmt = count
            s = fmt(a + (b - a) * ease_out(p))
        text(d, (W / 2, yy), s, fn, colour, 2, anchor="ma")
        fc = font("body", 44)
        cy = yy + size * 1.08
        for l_ in wrap(caption, fc, 1400):
            text(d, (W / 2, cy), l_, fc, PAPER, anchor="ma")
            cy += lh(fc) * 1.05
        if source:
            fs = font("mono", 24)
            text(d, (W / 2, cy + 24), source, fs, MUTED, 2, anchor="ma")
        return shadowed(im, 18, 0.6)
    return El(t0, t1, mk, anim="up", ain=0.5, aout=0.35, build=build if count else None, z=z, name="bignum")


def headline(t0, t1, lines, kicker=None, y=None, size=110, colour=PAPER, sub=None, align="m", x=None,
             maxw=1600, z=20, anim="up", kind=None, kcol=None):
    lab = label_img(kind, 24) if kind else None

    def mk(_):
        im = blank()
        d = ImageDraw.Draw(im)
        fh = font("head", size)
        L = []
        for l_ in lines:
            L += wrap(l_, fh, maxw)
        fsub = font("body", 44)
        subl = wrap(sub, fsub, maxw) if sub else []
        total = len(L) * lh(fh) * 0.95 + (len(subl) * lh(fsub) * 1.08 + 30 if subl else 0)
        yy = y if y is not None else (H - total) / 2
        xx = W / 2 if align == "m" else (x if x is not None else 140)
        anc = "ma" if align == "m" else "la"
        if kicker:
            fk = font("monob", 28)
            text(d, (xx, yy - 64), kicker, fk, kcol or (PAPER + (220,)), 5, anchor=anc)
        if lab:
            lx = int(xx - lab.size[0] / 2) if align == "m" else int(xx)
            im.alpha_composite(lab, (lx, int(yy - (130 if kicker else 74))))
        for l_ in L:
            text(d, (xx, yy), l_, fh, colour, 2, anchor=anc)
            yy += lh(fh) * 0.95
        yy += 30
        for l_ in subl:
            text(d, (xx, yy), l_, fsub, PAPER + (235,), anchor=anc)
            yy += lh(fsub) * 1.08
        return shadowed(im, 18, 0.65)
    return El(t0, t1, mk, anim=anim, ain=0.5, aout=0.35, z=z, name="headline")


def quote_card(t0, t1, quote, intro=None, who=None, kind="CLAIM", size=84, maxw=1500, colour=PAPER, z=22, cx=W / 2):
    lab = label_img(kind, 24) if kind else None

    def mk(_):
        im = blank()
        d = ImageDraw.Draw(im)
        fq = font("quote", size)
        fi = font("body", 38)
        il = wrap(intro, fi, 1400) if intro else []
        ql = wrap(quote, fq, maxw)
        total = len(il) * lh(fi) * 1.05 + (30 if il else 0) + len(ql) * lh(fq) * 1.05 + 110
        yy = (H - total) / 2
        if lab:
            im.alpha_composite(lab, (int(cx - lab.size[0] / 2), int(yy - 80)))
        for l_ in il:
            text(d, (cx, yy), l_, fi, PAPER + (215,), anchor="ma")
            yy += lh(fi) * 1.05
        yy += 30 if il else 0
        for l_ in ql:
            text(d, (cx, yy), l_, fq, colour, anchor="ma")
            yy += lh(fq) * 1.05
        if who:
            fw = font("monob", 30)
            text(d, (cx, yy + 36), who, fw, label_colour(kind) if kind else PAPER, 4, anchor="ma")
        return shadowed(im, 22, 0.7)
    return El(t0, t1, mk, anim="up", ain=0.6, aout=0.4, z=z, name="quote")


def stack(t0, steps, t1, rows, title=None, x=150, y=250, size=48, numbered=True, width=1500, colours=None,
          kicker=None, kind=None, z=21):
    """Vertical list; each row appears at its time."""
    els = []
    fb = font("body", size)
    yy = y
    if title or kicker or kind:
        lab = label_img(kind, 24) if kind else None

        def mkt(_):
            im = blank(W, 190)
            d = ImageDraw.Draw(im)
            ty = 60
            xk = 0
            if lab:
                im.alpha_composite(lab, (0, 0))
                xk = lab.size[0] + 20
            if kicker:
                text(d, (xk, 6), kicker, font("monob", 26), PAPER + (220,), 5)
            if title:
                text(d, (0, ty), title.upper(), font("head", 84), PAPER, 2)
            return shadowed(im, 14, 0.6)
        els.append(El(t0, t1, mkt, x=x, y=y - 180, anim="up", z=z - 1))
    for i, r in enumerate(rows):
        lines = wrap(r, fb, width - 130)
        rh = int(len(lines) * lh(fb) * 1.08 + 34)

        def mk(_, lines=lines, i=i, rh=rh):
            im = blank(width + 40, rh + 40)
            d = ImageDraw.Draw(im)
            d.rectangle([20, 20, 20 + width, 20 + rh - 10], fill=INK + (215,))
            col = (colours[i] if colours else GOLD)
            if numbered:
                d.rectangle([20, 20, 96, 20 + rh - 10], fill=col)
                text(d, (58, 20 + (rh - 10) / 2 - 38), str(i + 1), font("head", 64), INK, anchor="ma")
            else:
                d.rectangle([20, 20, 30, 20 + rh - 10], fill=col)
            yy2 = 20 + 14
            for ln in lines:
                d.text((122 if numbered else 56, yy2), ln, font=fb, fill=PAPER)
                yy2 += lh(fb) * 1.08
            return shadowed(im, 12, 0.55)
        els.append(El(steps[i], t1, mk, x=x - 20, y=yy - 20, anim="left", ain=0.45, aout=0.35, slide=40, z=z))
        yy += rh + 8
    return els


def flow(t0, steps, t1, labels, y=430, size=44, kicker=None, heads=None, colours=None, kind=None):
    """Horizontal chain; each box appears at its own time."""
    n = len(labels)
    gap = 90
    bw = int((W - 220 - gap * (n - 1)) / n)
    els = []
    fb = font("body", size)
    heights = [len(wrap(l_, fb, bw - 50)) for l_ in labels]
    bh = int(max(heights) * lh(fb) * 1.08 + 70 + (40 if heads else 0))
    x0 = (W - (n * bw + (n - 1) * gap)) / 2
    if kicker:
        els.append(headline(t0, t1, [kicker], size=44, y=y - 110, colour=PAPER, z=19, kind=kind))
    for i, l_ in enumerate(labels):
        def mk(_, l_=l_, i=i):
            im = blank(bw + 40, bh + 40)
            d = ImageDraw.Draw(im)
            d.rectangle([20, 20, 20 + bw, 20 + bh], fill=INK + (225,), outline=PAPER + (110,), width=2)
            d.rectangle([20, 20, 20 + bw, 28], fill=(colours[i] if colours else GOLD))
            yy = 48
            if heads:
                text(d, (45, yy), heads[i], font("monob", 22), PAPER + (210,), 3)
                yy += 40
            for ln in wrap(l_, fb, bw - 50):
                d.text((45, yy), ln, font=fb, fill=PAPER)
                yy += lh(fb) * 1.08
            return shadowed(im, 14, 0.6)
        xx = x0 + i * (bw + gap) - 20
        els.append(El(steps[i], t1, mk, x=xx, y=y - 20, anim="up", ain=0.45, aout=0.35, z=21))
        if i > 0:
            def mka(_):
                im = blank(gap + 20, 60)
                d = ImageDraw.Draw(im)
                arrow(d, 14, 30, gap - 4, 30, PAPER + (230,), 6, 20)
                return im
            els.append(El(steps[i] - 0.05, t1, mka, x=xx - gap + 10, y=y + bh / 2 - 30, anim="right", ain=0.3,
                          aout=0.35, z=22))
    return els


# ---------------------------------------------------------------- titles & chapter cards

def title_card(t0, t1):
    """94 SEATS vs 30% · CAN ALBANESE STOP PAULINE HANSON?"""
    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        fb = font("head", 230)
        fv = font("headr", 110)
        a = "94 SEATS"
        b = "30%"
        wa, wv, wb = tw(a, fb, 4), tw("vs", fv, 4), tw(b, fb, 4)
        gap = 60
        x0 = W / 2 - (wa + wv + wb + 2 * gap) / 2
        y0 = 250
        text(d, (x0, y0), a, fb, GOLD, 4)
        text(d, (x0 + wa + gap, y0 + 92), "vs", fv, PAPER, 4)
        text(d, (x0 + wa + wv + 2 * gap, y0), b, fb, ORANGE, 4)
        yy = y0 + lh(fb) * 0.95
        rw = 1400 * ease_out(p)
        d.rectangle([W / 2 - rw / 2, yy, W / 2, yy + 5], fill=GOLD)
        d.rectangle([W / 2, yy, W / 2 + rw / 2, yy + 5], fill=ORANGE)
        text(d, (W / 2, yy + 40), "CAN ALBANESE STOP PAULINE HANSON?", font("head", 96), PAPER, 4, anchor="ma")
        text(d, (W / 2, yy + 170), "AN INDEPENDENT DOCUMENTARY", font("monob", 28), PAPER + (190,), 8, anchor="ma")
        return shadowed(im, 24, 0.75)
    return El(t0, t1, mk, anim="up", ain=0.8, aout=0.5, slide=30, build=1.4, z=25, name="title")


def chapter_card(t0, t1, kicker, title_lines, colours=(GOLD,), sub=None, cx=None):
    """Chapter-hold title: PART n + title, with the thread(s) drawing across beneath."""
    def mk(p):
        CX = W / 2 if cx is None else cx
        im = blank()
        d = ImageDraw.Draw(im)
        fk = font("monob", 34)
        big = max(len(l_) for l_ in title_lines)
        ft = font("head", 150 if big < 16 else (126 if big < 22 else 104))
        total_h = 80 + len(title_lines) * lh(ft) * 0.92 + (70 if sub else 0)
        y0 = (H - total_h) / 2
        text(d, (CX, y0), kicker, fk, colours[0], 14, anchor="ma")
        yy = y0 + 72
        for l_ in title_lines:
            text(d, (CX, yy), l_, ft, PAPER, 3, anchor="ma")
            yy += lh(ft) * 0.92
        ty = yy + 26
        n = len(colours)
        for i, c in enumerate(colours):
            q = ease_out(p * 1.2 - i * 0.15)
            w_ = 1100 * q
            if i == 0:
                d.rectangle([CX - 550, ty + i * 12, CX - 550 + w_, ty + i * 12 + 5], fill=c)
            else:
                d.rectangle([CX + 550 - w_, ty + i * 12, CX + 550, ty + i * 12 + 5], fill=c)
        if sub:
            text(d, (CX, ty + 12 * n + 30), sub, font("mono", 30), PAPER + (220,), 3, anchor="ma")
        return shadowed(im, 22, 0.75)
    return El(t0, t1, mk, anim="up", ain=0.5, aout=0.35, slide=30, build=1.0, z=25, name="chapter")


# ---------------------------------------------------------------- data graphics

def hemicycle_pts(n=150, rows=8, r0=250, r1=520, cx=W / 2, cy=860):
    """Seat positions for a 150-seat hemicycle, ordered left to right."""
    radii = [r0 + (r1 - r0) * i / (rows - 1) for i in range(rows)]
    tot = sum(radii)
    counts = [round(n * r / tot) for r in radii]
    counts[-1] += n - sum(counts)
    pts = []
    for r, c in zip(radii, counts):
        for k in range(c):
            ang = math.pi * (1 - (k + 0.5) / c)
            pts.append((ang, cx + r * math.cos(ang), cy - r * math.sin(ang)))
    pts.sort(key=lambda t: -t[0])
    return [(x, y) for _, x, y in pts]


def chamber(t0, t1, steps, title=None, kind="FACT", source=None, y_c=880, scale=1.0, z=20, ain=0.4):
    """150-seat House of Representatives graphic.

    steps: list of (t, dict) where dict can hold gold=n (from left), orange=n (from right), line=76,
    big='94', big_col=GOLD, cap='...'. Later steps override earlier ones; counts animate.
    """
    pts = hemicycle_pts(cy=y_c, r0=230 * scale, r1=500 * scale)
    lab = label_img(kind, 24) if kind else None

    def state(T):
        cur = dict(gold=0, orange=0)
        prev = dict(cur)
        tstart = None
        for t, s in steps:
            if T >= t:
                prev = dict(cur)
                cur.update(s)
                tstart = t
        return cur, prev, tstart

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        cur, prev, ts = state(T)
        q = ease_out((T - ts) / 0.9) if ts is not None else 1
        g = int(round(prev.get("gold", 0) + (cur.get("gold", 0) - prev.get("gold", 0)) * q))
        o = int(round(prev.get("orange", 0) + (cur.get("orange", 0) - prev.get("orange", 0)) * q))
        rr = 13 * scale
        for i, (x, y) in enumerate(pts):
            if i < g:
                c = GOLD + (255,)
            elif i >= 150 - o:
                c = ORANGE + (255,)
            else:
                c = DIM + (230,)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=c)
        if cur.get("line"):
            # majority marker: line from centre through the 76th seat boundary (vertical at centre)
            d.line([(W / 2, y_c - 540 * scale), (W / 2, y_c + 20)], fill=PAPER + (220,), width=3)
            text(d, (W / 2, y_c - 600 * scale), f"{cur['line']} TO GOVERN", font("monob", 30), PAPER, 4, anchor="ma")
        if cur.get("big"):
            text(d, (W / 2, y_c - 190 * scale), cur["big"], font("head", int(170 * scale)), cur.get("big_col", GOLD),
                 2, anchor="ma")
        if cur.get("cap"):
            text(d, (W / 2, y_c + 40), cur["cap"], font("body", 40), PAPER, anchor="ma")
        if title:
            text(d, (W / 2, 120), title, font("monob", 30), PAPER + (220,), 6, anchor="ma")
            if lab:
                im.alpha_composite(lab, (int(W / 2 - lab.size[0] / 2), 60))
        if source:
            text(d, (W / 2, H - 60), source, font("mono", 22), MUTED, 2, anchor="ma")
        return shadowed(im, 14, 0.6)
    return dyn(t0, t1, frame, z=z, ain=ain, name="chamber")


def polaroid(t0, t1, pollster, dates, rows, x, y, rot=-2.5, note=None, kind="FACT", width=600, build=0.8, z=24,
             snap=True):
    """Poll Polaroid: white frame, bar 'photo', handwritten-style caption with pollster + fieldwork dates.

    rows: list of (party, value, display, colour). Every Polaroid carries the snapshot reminder.
    """
    wv = width
    hv = int(width * 0.62)
    vmax = max(v for _, v, _, _ in rows) * 1.18

    def mk(p):
        pad = 26
        ph = hv
        fw, fh = wv + pad * 2, ph + pad + 200
        im = Image.new("RGBA", (fw, fh), WHITE + (255,))
        d = ImageDraw.Draw(im)
        d.rectangle([pad, pad, pad + wv, pad + ph], fill=INK2 + (255,))
        n = len(rows)
        bh = min(76, (ph - 40) / n - 16)
        fl = font("bodyb", 30)
        fv = font("head", 64)
        yy = pad + (ph - n * (bh + 16)) / 2
        for party, v, disp, col in rows:
            text(d, (pad + 22, yy + bh / 2 - 20), party, fl, PAPER)
            bx0 = pad + 220
            bw = (wv - 220 - 130) * v / vmax * ease_out(p)
            d.rectangle([bx0, yy, bx0 + bw, yy + bh], fill=col)
            if p > 0.5:
                text(d, (bx0 + bw + 14, yy + bh / 2 - 38), disp, fv, PAPER)
            yy += bh + 16
        cy = pad + ph + 16
        text(d, (pad, cy), pollster, font("head", 46), INK, 2)
        text(d, (pad, cy + 56), dates, font("mono", 22), (60, 60, 60), 1)
        if note:
            text(d, (pad, cy + 88), note, font("mono", 22), (60, 60, 60), 1)
        text(d, (pad, fh - 46), "One poll is a snapshot, not a verdict.", font("bodyi", 25), (90, 90, 90))
        if kind:
            lab = label_img(kind, 20)
            im.alpha_composite(lab, (fw - lab.size[0] - pad + 4, cy + 4))
        out = im.rotate(rot, resample=Image.BICUBIC, expand=True)
        if snap and p < 0.25:
            fl_ = Image.new("RGBA", out.size, (255, 255, 255, int(200 * (1 - p / 0.25))))
            out.alpha_composite(Image.composite(fl_, Image.new("RGBA", out.size, (0, 0, 0, 0)), out.getchannel("A")))
        return shadowed(out, 20, 0.6)
    return El(t0, t1, mk, x=x, y=y, anim="up", ain=0.35, aout=0.35, slide=50, build=build, z=z, name="polaroid")


def staircase(t0, t1, steps_t, final_t, title="RBA CASH RATE", kind="FACT", z=20):
    """Four rises in 2026 as a rising staircase; only the spoken figure (4.60%) is labelled."""
    gx0, gx1, gy0, gy1 = 200, 1300, 320, 860
    n = 4

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img(kind, 24)
        im.alpha_composite(lab, (gx0, 150))
        text(d, (gx0 + lab.size[0] + 22, 152), title, font("monob", 30), PAPER, 5)
        text(d, (gx0, 200), "FOUR RISES IN 2026", font("head", 84), PAPER, 3)
        d.line([(gx0, gy1), (gx1, gy1)], fill=PAPER + (120,), width=2)
        stw = (gx1 - gx0) / (n + 0.6)
        for i in range(n):
            if T < steps_t[i]:
                continue
            a = ease_out((T - steps_t[i]) / 0.5)
            x0 = gx0 + i * stw
            top = gy1 - (i + 1) * (gy1 - gy0) / (n + 0.5) * a
            d.rectangle([x0 + 8, top, x0 + stw - 8, gy1], fill=GOLD + (int(70 + 40 * i),),
                        outline=GOLD + (255,), width=3)
            text(d, (x0 + stw / 2, gy1 + 18), f"RISE {i + 1}", font("monob", 24), PAPER + (int(220 * a),), 3,
                 anchor="ma")
        if T >= final_t:
            a = ease_out((T - final_t) / 0.5)
            x = gx0 + n * stw + 40
            text(d, (x, gy0 - 30), "4.60%", font("head", 180), ORANGE + (int(255 * a),), 2)
            text(d, (x + 6, gy0 + 170), "HIGHEST SINCE 2011", font("monob", 30), PAPER + (int(255 * a),), 4)
        return shadowed(im, 16, 0.6)
    return dyn(t0, t1, frame, z=z, name="stairs")


def dial(t0, t1, needle_t, value=-27, title="ALBANESE NET APPROVAL", sub=None, kind="FACT", z=20):
    """Semicircle approval dial from -50 to +50, needle swings to the spoken figure."""
    cx, cy, R = W / 2, 760, 420

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img(kind, 24)
        im.alpha_composite(lab, (int(cx - lab.size[0] / 2), 110))
        text(d, (cx, 170), title, font("monob", 32), PAPER, 6, anchor="ma")
        for k in range(100):
            v = -50 + k
            a0 = math.pi * (1 - (k) / 100)
            a1 = math.pi * (1 - (k + 1) / 100)
            col = ORANGE if v < 0 else GOLD
            alpha = 120 + int(100 * abs(v) / 50)
            d.pieslice([cx - R, cy - R, cx + R, cy + R], math.degrees(-a0), math.degrees(-a1), fill=col + (alpha,))
        d.pieslice([cx - R + 70, cy - R + 70, cx + R - 70, cy + R - 70], 180, 360, fill=INK + (255,))
        text(d, (cx - R, cy + 16), "−50", font("mono", 28), MUTED, anchor="ma")
        text(d, (cx, cy - R - 46), "0", font("mono", 28), MUTED, anchor="ma")
        text(d, (cx + R, cy + 16), "+50", font("mono", 28), MUTED, anchor="ma")
        p = ease_out((T - needle_t) / 1.2) if T >= needle_t else 0
        v = 0 + (value - 0) * p
        ang = math.pi * (1 - (v + 50) / 100)
        d.line([(cx, cy), (cx + (R - 30) * math.cos(ang), cy - (R - 30) * math.sin(ang))], fill=WHITE, width=10)
        d.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], fill=WHITE)
        if p > 0.6:
            a = int(255 * min(1, (p - 0.6) / 0.3))
            text(d, (cx, cy - 250), "−27", font("head", 190), ORANGE + (a,), 2, anchor="ma")
            if sub:
                text(d, (cx, cy + 60), sub, font("body", 38), PAPER + (a,), anchor="ma")
        return shadowed(im, 16, 0.6)
    return dyn(t0, t1, frame, z=z, name="dial")


def lock75(t0, t1, open_t=None, kind="FACT", z=20):
    """GFX_75_lock: padlock + 75% counter on the gold thread."""
    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        lk = padlock(250, GOLD + (255,), fill_alpha=60)
        im.alpha_composite(lk, (300, 330))
        d.rectangle([0, 560, 300, 566], fill=GOLD)
        d.rectangle([550, 560, W, 566], fill=GOLD)
        v = int(round(75 * ease_out(p)))
        text(d, (650, 300), f"{v}%", font("head", 260), GOLD, 2)
        fb = font("body", 46)
        yy = 600
        for l_ in wrap("of Labor’s MPs and senators needed to remove a sitting Labor prime minister", fb, 1100):
            text(d, (660, yy), l_, fb, PAPER)
            yy += lh(fb) * 1.06
        lab = label_img(kind, 24)
        im.alpha_composite(lab, (660, 250))
        text(d, (660 + lab.size[0] + 20, 252), "UNDER LABOR’S OWN RULES", font("monob", 28), PAPER, 4)
        return shadowed(im, 16, 0.6)
    return El(t0, t1, mk, anim="up", ain=0.5, aout=0.4, build=1.4, z=z, name="lock75")


def pm_ladder(t0, t1, steps, z=20):
    """GFX_PM_ladder: name tiles only (no portraits). steps: times for tiles bottom->top."""
    tiles = [("PAUL KEATING", "time in office passed · August 2026", DIM),
             ("ANTHONY ALBANESE", "now the longest-serving prime minister since…", GOLD),
             ("JOHN HOWARD", "", STEEL)]

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img("FACT", 24)
        im.alpha_composite(lab, (380, 120))
        text(d, (380 + lab.size[0] + 20, 122), "TIME IN OFFICE", font("monob", 30), PAPER, 5)
        # rails
        d.line([(360, 200), (360, 960)], fill=PAPER + (90,), width=4)
        d.line([(1560, 200), (1560, 960)], fill=PAPER + (90,), width=4)
        ys = [800, 560, 320]
        for i, (nm, sub, col) in enumerate(tiles):
            if T < steps[i]:
                continue
            a = ease_out((T - steps[i]) / 0.5)
            y = ys[i] + (1 - a) * 40
            d.rectangle([380, y, 1540, y + 170], fill=INK + (int(225 * a),), outline=col + (int(255 * a),), width=4)
            d.rectangle([380, y, 400, y + 170], fill=col + (int(255 * a),))
            text(d, (440, y + 22), nm, font("head", 84), PAPER + (int(255 * a),), 3)
            if sub:
                text(d, (444, y + 114), sub, font("body", 34), PAPER + (int(220 * a),))
        return shadowed(im, 16, 0.6)
    return dyn(t0, t1, frame, z=z, name="ladder")


def stamp_quashed(t0, t1, z=26):
    """2003 conviction, always shown with 'overturned on appeal' in the same frame.

    The struck word, the QUASHED stamp and the caption appear together from the first frame (one image,
    one fade), so the word GUILTY is never on screen alone.
    """
    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        fg = font("head", 170)
        w_ = tw("GUILTY", fg, 10)
        x0 = W / 2 - w_ / 2
        text(d, (x0, 250), "GUILTY", fg, PAPER + (150,), 10)
        d.line([(x0 - 30, 340), (x0 + w_ + 30, 330)], fill=ORANGE, width=16)
        st = blank(1000, 230)
        sd = ImageDraw.Draw(st)
        sd.rectangle([10, 10, 990, 220], outline=ORANGE, width=12)
        text(sd, (500, 36), "QUASHED", font("head", 160), ORANGE, 12, anchor="ma")
        st = st.rotate(-6, resample=Image.BICUBIC, expand=True)
        sc = 1.25 - 0.25 * ease_out(p)
        st = st.resize((int(st.size[0] * sc), int(st.size[1] * sc)), Image.BICUBIC)
        im.alpha_composite(st, (int(W / 2 - st.size[0] / 2), int(430 - st.size[1] / 2 + 40)))
        fb = font("body", 50)
        text(d, (W / 2, 690), "2003 · Convicted of electoral fraud and jailed", fb, PAPER, anchor="ma")
        text(d, (W / 2, 760), "The conviction was overturned on appeal", font("bodyb", 56), ORANGE, anchor="ma")
        lab = label_img("FACT", 24)
        im.alpha_composite(lab, (int(W / 2 - lab.size[0] / 2), 170))
        return shadowed(im, 18, 0.7)
    return El(t0, t1, mk, anim="fade", ain=0.35, aout=0.35, build=0.5, z=z, name="quashed")


def timeline(t0, t1, items, title=None, colour=ORANGE, kind="FACT", y=560, z=20):
    """Horizontal dated timeline. items: (t_reveal, date, line)."""
    n = len(items)
    x0, x1 = 170, 1750
    xs = [x0 + (x1 - x0) * (i / max(1, n - 1)) for i in range(n)]

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        if title:
            lab = label_img(kind, 24) if kind else None
            if lab:
                im.alpha_composite(lab, (x0 - 20, 150))
            text(d, (x0 - 20 + (lab.size[0] + 20 if lab else 0), 152), title, font("monob", 30), PAPER, 5)
        last = None
        for i, (tr, date, line) in enumerate(items):
            if T >= tr:
                last = i
        if last is not None:
            tr = items[last][0]
            q = ease_out((T - tr) / 0.6)
            xa = xs[max(0, last - 1)] if last > 0 else x0
            xe = xa + (xs[last] - xa) * q if last > 0 else xs[0]
            d.line([(x0, y), (xe, y)], fill=colour + (255,), width=8)
        fb = font("body", 34)
        for i, (tr, date, line) in enumerate(items):
            if T < tr:
                continue
            a = ease_out((T - tr) / 0.45)
            x = xs[i]
            d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=colour + (int(255 * a),), outline=WHITE + (int(255 * a),),
                      width=4)
            up = i % 2 == 0
            text(d, (x, y - 120 if up else y + 40), date, font("head", 64), PAPER + (int(255 * a),), 2, anchor="ma")
            ll = wrap(line, fb, 300)
            ly = y - 120 - len(ll) * lh(fb) - 8 if up else y + 120
            for l_ in ll:
                text(d, (x, ly), l_, fb, PAPER + (int(225 * a),), anchor="ma")
                ly += lh(fb)
        return shadowed(im, 14, 0.6)
    return dyn(t0, t1, frame, z=z, name="timeline")


def state_tiles(t0, t1, tiles, title, source, kind="FACT", z=20):
    """State heat tiles (not a map). tiles: (t_reveal, state, line, heat 0..1, display)."""
    n = len(tiles)
    tw_, th_ = 330, 330
    gap = 30
    x0 = (W - (n * tw_ + (n - 1) * gap)) / 2

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img(kind, 24)
        im.alpha_composite(lab, (int(x0), 150))
        text(d, (x0 + lab.size[0] + 20, 152), title, font("monob", 30), PAPER, 5)
        for i, (tr, st, line, heat, disp) in enumerate(tiles):
            if T < tr:
                continue
            a = ease_out((T - tr) / 0.45)
            x = x0 + i * (tw_ + gap)
            y = 300 + (1 - a) * 30
            col = tuple(int(DIM[k] + (ORANGE[k] - DIM[k]) * heat) for k in range(3))
            d.rectangle([x, y, x + tw_, y + th_], fill=col + (int(235 * a),))
            text(d, (x + 24, y + 18), st, font("head", 76), WHITE + (int(255 * a),), 3)
            text(d, (x + 24, y + 116), disp, font("head", 92), WHITE + (int(255 * a),), 1)
            fb = font("body", 28)
            ly = y + 230
            for l_ in wrap(line, fb, tw_ - 40):
                text(d, (x + 24, ly), l_, fb, WHITE + (int(235 * a),))
                ly += lh(fb)
        text(d, (W / 2, 690), "Heat = One Nation share. State samples are smaller than the national poll.",
             font("body", 30), PAPER + (200,), anchor="ma")
        text(d, (W / 2, 740), source, font("mono", 24), MUTED, 2, anchor="ma")
        return shadowed(im, 14, 0.6)
    return dyn(t0, t1, frame, z=z, name="states")


def three_stamps(t0, t1, steps, z=22):
    """S19: FACT / CLAIM / ANALYSIS stamps, each with its spoken line."""
    rows = [("FACT", "One Nation’s polling has risen sharply."),
            ("CLAIM", "The party is on track to govern. (One Nation and some commentators)"),
            ("ANALYSIS", "The ABC: the fastest polling surge in modern Australian politics.")]

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        for i, (k, line) in enumerate(rows):
            if T < steps[i]:
                continue
            a = ease_out((T - steps[i]) / 0.35)
            y = 230 + i * 230
            lab = label_img(k, 48)
            sc = 1.3 - 0.3 * a
            lab = lab.resize((int(lab.size[0] * sc), int(lab.size[1] * sc)), Image.BICUBIC)
            im.alpha_composite(fade_img(lab, a), (int(200 - (lab.size[0] - lab.size[0] / sc) / 2), int(y)))
            fb = font("body", 46)
            ly = y + 8
            for l_ in wrap(line, fb, 1050):
                text(d, (700, ly), l_, fb, PAPER + (int(255 * a),))
                ly += lh(fb) * 1.05
        return shadowed(im, 14, 0.6)
    return dyn(t0, t1, frame, z=z, name="stamps")


def columns(t0, t1, left, right, heads, cols=(GOLD, ORANGE), kinds=("FACT", "FACT"), title=None, size=34,
            row_kinds=None, z=21, dashed_right=False):
    """Two parallel columns; items appear on their spoken cue.

    left/right: lists of (t_reveal, text). heads: (left_head, right_head). row_kinds: optional dict
    mapping (side, index) -> label kind for rows that are not the column's own kind (e.g. a CLAIM tile).
    """
    cw = 820
    xs = [120, W - 120 - cw]
    row_kinds = row_kinds or {}

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        if title:
            text(d, (W / 2, 66), title, font("monob", 30), PAPER + (220,), 6, anchor="ma")
        fb = font("body", size)
        for side, (items, head, col, kind) in enumerate(zip((left, right), heads, cols, kinds)):
            x = xs[side]
            box = [x, 130, x + cw, 150 + 96]
            if side == 1 and dashed_right:
                d.rectangle(box, fill=INK + (220,))
                dashed_rect(d, box, col + (255,), width=4, dash=16, gap=10)
            else:
                d.rectangle(box, fill=col + (235,))
            text(d, (x + 24, 146), head, font("head", 66), INK if not (side == 1 and dashed_right) else GREY, 3)
            lab = label_img(kind, 22)
            im.alpha_composite(lab, (int(x + cw - lab.size[0] - 16), 160))
            y = 262
            for i, (tr, line) in enumerate(items):
                if line.startswith("§"):
                    if T >= tr:
                        a = ease_out((T - tr) / 0.4)
                        text(d, (x + 4, y + 6), line[1:], font("monob", 24), col + (int(255 * a),), 5)
                    y += 40
                    continue
                ll = wrap(line, fb, cw - 80)
                rh = len(ll) * lh(fb) * 1.04 + 16
                if T >= tr:
                    a = ease_out((T - tr) / 0.4)
                    rk = row_kinds.get((side, i))
                    d.rectangle([x, y, x + cw, y + rh], fill=INK + (int(205 * a),))
                    d.rectangle([x, y, x + 8, y + rh], fill=(label_colour(rk) if rk else col) + (int(255 * a),))
                    yy = y + 8
                    for l_ in ll:
                        text(d, (x + 30, yy), l_, fb, PAPER + (int(255 * a),))
                        yy += lh(fb) * 1.04
                    if rk:
                        lb = fade_img(label_img(rk, 18), a)
                        im.alpha_composite(lb, (int(x + cw - lb.size[0] - 10), int(y + 6)))
                y += rh + 6
        return shadowed(im, 12, 0.6)
    return dyn(t0, t1, frame, z=z, name="columns")


def counters(t0, t1, items, title, kind="CLAIM", note=None, z=21):
    """Row of big counters (e.g. One Nation's fundraising claims). items: (t, final, fmt, start, caption)."""
    n = len(items)
    cw = 600
    x0 = (W - n * cw) / 2

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img(kind, 26)
        im.alpha_composite(lab, (int(W / 2 - lab.size[0] / 2), 200))
        text(d, (W / 2, 260), title, font("monob", 32), PAPER, 5, anchor="ma")
        for i, (tr, final, fmt, start, cap) in enumerate(items):
            if T < tr:
                continue
            p = ease_out((T - tr) / 1.1)
            v = start + (final - start) * p
            x = x0 + i * cw + cw / 2
            text(d, (x, 390), fmt(v) if p < 1 else fmt(final), font("head", 150), ORANGE, 2, anchor="ma")
            text(d, (x, 590), cap, font("body", 38), PAPER, anchor="ma")
        if note:
            text(d, (W / 2, 720), note, font("bodyi", 36), PAPER + (220,), anchor="ma")
        return shadowed(im, 16, 0.6)
    return dyn(t0, t1, frame, z=z, name="counters")


def share_bar(t0, t1, value, display, caption, colour=ORANGE, kind="FACT", source=None, rest_col=DIM, y=470,
              z=21, split=None):
    """Single 100% bar with a highlighted share. split=[(v, col, label)] for stacked segments."""
    x0, x1 = 200, 1720

    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img(kind, 24)
        im.alpha_composite(lab, (x0, y - 240))
        text(d, (x0, y - 190), display, font("head", 150), colour, 2)
        d.rectangle([x0, y, x1, y + 90], fill=rest_col + (200,))
        if split:
            xx = x0
            for v, col, lb in split:
                w_ = (x1 - x0) * v / 100 * ease_out(p)
                d.rectangle([xx, y, xx + w_, y + 90], fill=col)
                if p > 0.7:
                    text(d, (xx + 16, y + 20), lb, font("bodyb", 36), INK)
                xx += w_
        else:
            d.rectangle([x0, y, x0 + (x1 - x0) * value / 100 * ease_out(p), y + 90], fill=colour)
        fb = font("body", 42)
        yy = y + 130
        for l_ in wrap(caption, fb, x1 - x0):
            text(d, (x0, yy), l_, fb, PAPER)
            yy += lh(fb) * 1.06
        if source:
            text(d, (x0, yy + 20), source, font("mono", 22), MUTED, 2)
        return shadowed(im, 16, 0.6)
    return El(t0, t1, mk, anim="up", ain=0.5, aout=0.4, build=1.2, z=z, name="share")


def quota(t0, t1, hi_t, z=21):
    """Senate quota: a state's vote split into seven blocks; one block = about 14%."""
    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img("FACT", 24)
        im.alpha_composite(lab, (220, 200))
        text(d, (220 + lab.size[0] + 20, 202), "NORMAL HALF-SENATE ELECTION · ONE STATE", font("monob", 28), PAPER, 4)
        bw = 200
        h = at(T, hi_t, 0.5)
        for i in range(7):
            x = 220 + i * (bw + 20)
            col = tuple(int(DIM[k] + (ORANGE[k] - DIM[k]) * h) for k in range(3)) if i == 0 else DIM
            d.rectangle([x, 330, x + bw, 560], fill=col + (235,))
        if h > 0:
            text(d, (220, 600), "ONE-SEVENTH ≈ 14%", font("head", 120), ORANGE + (int(255 * h),), 2)
            text(d, (226, 760), "of a state’s vote to win a seat", font("body", 44), PAPER + (int(255 * h),))
        return shadowed(im, 16, 0.6)
    return dyn(t0, t1, frame, z=z, name="quota")


def ages(t0, t1, steps, z=21):
    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img("FACT", 24)
        im.alpha_composite(lab, (int(W / 2 - lab.size[0] / 2), 140))
        text(d, (W / 2, 196), "TWO LEADERS, TWO TIMELINES", font("monob", 32), PAPER, 6, anchor="ma")
        for i, (nm, age, line, col) in enumerate([
                ("ANTHONY ALBANESE", "63", "Election due by 2028", GOLD),
                ("PAULINE HANSON", "72", "Leads One Nation until she chooses to step down", ORANGE)]):
            if T < steps[i]:
                continue
            a = ease_out((T - steps[i]) / 0.45)
            x = 260 + i * 760
            d.rectangle([x, 300, x + 640, 820], fill=INK + (int(215 * a),), outline=col + (int(255 * a),), width=5)
            text(d, (x + 320, 330), nm, font("head", 60), col + (int(255 * a),), 3, anchor="ma")
            text(d, (x + 320, 410), age, font("head", 260), PAPER + (int(255 * a),), 2, anchor="ma")
            fb = font("body", 36)
            yy = 700
            for l_ in wrap(line, fb, 560):
                text(d, (x + 320, yy), l_, fb, PAPER + (int(230 * a),), anchor="ma")
                yy += lh(fb)
        return shadowed(im, 14, 0.6)
    return dyn(t0, t1, frame, z=z, name="ages")


def end_card(t0, t1, line):
    def mk(_):
        im = blank()
        d = ImageDraw.Draw(im)
        fh = font("head", 86)
        yy = 300
        for l_ in wrap(line, fh, 1500):
            text(d, (W / 2, yy), l_, fh, PAPER, 2, anchor="ma")
            yy += lh(fh) * 0.95
        d.rectangle([W / 2 - 500, yy + 30, W / 2, yy + 35], fill=GOLD)
        d.rectangle([W / 2, yy + 30, W / 2 + 500, yy + 35], fill=ORANGE)
        bw, bh = 420, 110
        bx, by = W / 2 - bw / 2, yy + 90
        d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=14, fill=GOLD)
        text(d, (W / 2, by + 18), "FOLLOW", font("head", 72), INK, 10, anchor="ma")
        text(d, (W / 2, by + bh + 50), "EVERY SOURCE IS IN THE DESCRIPTION", font("monob", 28), MUTED, 4,
             anchor="ma")
        return shadowed(im, 20, 0.7)
    return El(t0, t1, mk, anim="up", ain=0.6, aout=0.5, z=25, name="end")


def ev_board(t0, t1, rows, title=None, size=40, z=21, y0=230):
    """Rows of evidence, each with its own label pill. rows: (t_reveal, kind, text)."""
    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        if title:
            text(d, (150, y0 - 90), title, font("head", 76), PAPER, 3)
        fb = font("body", size)
        y = y0 + 20
        for tr, kind, line in rows:
            ll = wrap(line, fb, 1200)
            rh = len(ll) * lh(fb) * 1.05 + 30
            if T >= tr:
                a = ease_out((T - tr) / 0.45)
                d.rectangle([150, y, 1770, y + rh], fill=INK + (int(215 * a),))
                d.rectangle([150, y, 158, y + rh], fill=label_colour(kind) + (int(255 * a),))
                lb = fade_img(label_img(kind, 22), a)
                im.alpha_composite(lb, (180, int(y + 14)))
                yy = y + 14
                for l_ in ll:
                    text(d, (500, yy), l_, fb, PAPER + (int(255 * a),))
                    yy += lh(fb) * 1.05
            y += rh + 14
        return shadowed(im, 12, 0.6)
    return dyn(t0, t1, frame, z=z, name="evboard")


def spread_vs_conc(t0, t1, t_even, t_conc, z=21):
    """Same 30% share, two ways: spread evenly (no seats) vs concentrated (several seats)."""
    n = 10
    even = [0.30] * n
    conc = [0.62, 0.58, 0.55, 0.52, 0.0, 0.05, 0.10, 0.0, 0.08, 0.50]  # averages 0.30

    def row(d, y, vals, a, label, won_lbl):
        text(d, (150, y - 70), label, font("monob", 30), PAPER + (int(255 * a),), 5)
        bw = 140
        won = 0
        for i, v in enumerate(vals):
            x = 150 + i * (bw + 22)
            d.rectangle([x, y, x + bw, y + 200], fill=DIM + (int(220 * a),))
            d.rectangle([x, y + 200 - 200 * v, x + bw, y + 200], fill=ORANGE + (int(235 * a),))
            if v > 0.5:
                won += 1
                d.rectangle([x, y - 10, x + bw, y - 2], fill=WHITE + (int(255 * a),))
        text(d, (150, y + 220), won_lbl, font("body", 36), PAPER + (int(230 * a),))

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        lab = label_img("FACT", 24)
        im.alpha_composite(lab, (150, 150))
        text(d, (150 + lab.size[0] + 20, 152), "THE SAME 30% NATIONALLY · TEN EXAMPLE SEATS", font("monob", 28), PAPER, 4)
        if T >= t_even:
            row(d, 320, even, at(T, t_even), "SPREAD EVENLY", "Very few seats: under half the vote everywhere")
        if T >= t_conc:
            row(d, 700, conc, at(T, t_conc), "CONCENTRATED", "Many seats: more than half the vote where it is strongest")
        return shadowed(im, 12, 0.6)
    return dyn(t0, t1, frame, z=z, name="spread")


def pills(t0, t1, steps, kinds=("FACT", "CLAIM", "ANALYSIS"), y=760, z=23):
    """Row of big evidence labels revealed on cue (S04)."""
    def frame(T):
        im = blank()
        imgs = [label_img(k, 40) for k in kinds]
        tot = sum(i.size[0] for i in imgs) + 60 * (len(imgs) - 1)
        x = (W - tot) / 2
        for k, (lb, t) in enumerate(zip(imgs, steps)):
            a = at(T, t, 0.35)
            if a > 0:
                im.alpha_composite(fade_img(lb, a), (int(x), int(y + (1 - a) * 20)))
            x += lb.size[0] + 60
        return shadowed(im, 12, 0.6)
    return dyn(t0, t1, frame, z=z, name="pills")
