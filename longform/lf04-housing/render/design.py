"""lf04 design system: palette, fonts, overlay elements and card builders.

Every card here is drawn with Pillow onto a transparent 1920x1080 layer.
Wording on cards must match the spoken words in audio/vo-text (see cut.py).
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

# Palette: ink, paper, evidence red, amber highlight.
INK = (12, 15, 20)
INK2 = (24, 29, 37)
PAPER = (238, 231, 216)
MUTED = (170, 165, 154)
RED = (206, 58, 46)
AMBER = (232, 170, 62)
TEAL = (88, 168, 170)


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
    words = s.split()
    lines, cur = [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if f.getlength(t) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


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


def arrow(d, x0, y0, x1, y1, fill, width=6, head=22):
    d.line([(x0, y0), (x1, y1)], fill=fill, width=width)
    ang = math.atan2(y1 - y0, x1 - x0)
    pts = [
        (x1 + 4 * math.cos(ang), y1 + 4 * math.sin(ang)),
        (x1 - head * math.cos(ang - 0.45), y1 - head * math.sin(ang - 0.45)),
        (x1 - head * math.cos(ang + 0.45), y1 - head * math.sin(ang + 0.45)),
    ]
    d.polygon(pts, fill=fill)


def padlock(size, colour, open_=False, crack=False, fill_alpha=0):
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
    d.ellipse([cx - s * 0.07, by0 + s * 0.17, cx + s * 0.07, by0 + s * 0.31], fill=colour)
    d.line([(cx, by0 + s * 0.28), (cx, by0 + s * 0.45)], fill=colour, width=max(2, lw - 1))
    if crack:
        pts = [(bx0 + s * 0.12, by0), (bx0 + s * 0.3, by0 + s * 0.2), (bx0 + s * 0.2, by0 + s * 0.36),
               (bx0 + s * 0.42, by0 + s * 0.68)]
        d.line(pts, fill=INK + (255,), width=max(2, lw - 1))
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


def compose(elements, T, base=None):
    canvas = base if base is not None else blank()
    act = sorted([e for e in elements if e.active(T)], key=lambda e: e.z)
    for e in act:
        a, dx, dy = e.state(T)
        if a <= 0.003:
            continue
        img = e.image(T)
        if a < 0.997:
            arr = np.array(img)
            arr[..., 3] = (arr[..., 3].astype(np.float32) * a).astype(np.uint8)
            img = Image.fromarray(arr, "RGBA")
        canvas.alpha_composite(img, (int(round(e.x + dx)), int(round(e.y + dy))))
    return canvas


# ---------------------------------------------------------------- persistent furniture

def chapter_tag(t0, t1, kicker, title):
    """Small top-left case-file tag, e.g. SUSPECT 1 · THE RESERVE BANK."""
    def mk(_):
        fk = font("monob", 22)
        ft = font("mono", 22)
        w_ = int(tw(kicker, fk, 3) + tw(title, ft, 2) + 90)
        im = blank(w_ + 40, 70)
        d = ImageDraw.Draw(im)
        d.rectangle([20, 22, 32, 34], fill=RED)
        x = 46
        x += text(d, (x, 16), kicker, fk, PAPER, 3) + 18
        d.line([(x, 18), (x, 40)], fill=PAPER + (140,), width=2)
        text(d, (x + 18, 16), title, ft, PAPER + (225,), 2)
        return shadowed(im, 8, 0.7)
    return El(t0, t1, mk, x=52, y=34, anim="fade", ain=0.5, aout=0.4, z=50, name="tag")


def section_label(t0, t1, label):
    """Red ANALYSIS / WHAT COULD HAPPEN label box, top-left."""
    def mk(p):
        f = font("head", 40)
        w_ = int(tw(label, f, 6) + 56)
        im = blank(w_ + 30, 90)
        d = ImageDraw.Draw(im)
        reveal = int(w_ * ease_out(p))
        d.rectangle([10, 14, 10 + reveal, 74], fill=RED)
        if p > 0.35:
            sub = blank(w_ + 30, 90)
            sd = ImageDraw.Draw(sub)
            text(sd, (38, 22), label, f, PAPER, 6)
            m = Image.new("L", sub.size, 0)
            ImageDraw.Draw(m).rectangle([10, 14, 10 + reveal, 74], fill=255)
            im.paste(sub, (0, 0), Image.composite(sub.getchannel("A"), Image.new("L", sub.size, 0), m))
        return shadowed(im, 10, 0.5)
    return El(t0, t1, mk, x=50, y=26, anim="fade", ain=0.2, aout=0.4, build=0.6, z=51, name="label")


LOCKS = ["DEPOSIT", "LOAN", "HOME"]


def lock_hud(t0, t1, hot=(), past=(), build=0.0):
    """Top-right three-lock HUD. hot = cracked + red now; past = dim red from earlier suspects."""
    def mk(p):
        im = blank(420, 120)
        d = ImageDraw.Draw(im)
        fl = font("monob", 17)
        for i, name in enumerate(LOCKS):
            cx = 70 + i * 130
            if name in hot:
                col = RED + (255,)
                lk = padlock(46, col, crack=p > 0.5, fill_alpha=int(90 * ease_out(p)))
            elif name in past:
                col = (150, 70, 62, 230)
                lk = padlock(46, col, crack=True)
            else:
                col = PAPER + (200,)
                lk = padlock(46, col)
            im.alpha_composite(lk, (cx - 23, 10))
            text(d, (cx, 78), name, fl, col, 3, anchor="ma")
        return shadowed(im, 8, 0.7)
    return El(t0, t1, mk, x=W - 450, y=22, anim="fade", ain=0.5, aout=0.4, build=build or None, z=52,
              name="locks")


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
    return El(t0, t1, mk, x=W - 420 - 0, y=H - 92, anim="fade", ain=0.3, aout=0.3, z=60, name="ai")


# ---------------------------------------------------------------- lower-thirds & tags

def lower_third(t0, t1, name, role):
    def mk(_):
        fn = font("head", 64)
        fr = font("body", 32)
        w_ = int(max(tw(name.upper(), fn, 3), tw(role, fr)) + 80)
        im = blank(w_ + 40, 190)
        d = ImageDraw.Draw(im)
        d.rectangle([20, 30, 30, 160], fill=RED)
        text(d, (52, 30), name.upper(), fn, PAPER, 3)
        text(d, (54, 114), role, fr, PAPER + (230,))
        return shadowed(im, 16, 0.8, spread=4)
    return El(t0, t1, mk, x=70, y=H - 270, anim="left", ain=0.5, aout=0.4, slide=40, z=40, name="l3")


def tag(t0, t1, head, body, pos="bl", width=980, size=40):
    """Evidence tag: mono kicker + body text on an ink panel."""
    def mk(_):
        fh = font("monob", 22)
        fb = font("body", size)
        lines = wrap(body, fb, width - 70)
        h_ = 60 + len(lines) * int(lh(fb) * 1.05) + 26
        w_ = int(max(max(tw(l_, fb) for l_ in lines), tw(head, fh, 3)) + 72)
        im = blank(w_ + 40, h_ + 40)
        d = ImageDraw.Draw(im)
        d.rectangle([20, 20, 20 + w_, 20 + h_], fill=INK + (215,))
        d.rectangle([20, 20, 28, 20 + h_], fill=RED)
        text(d, (52, 38), head, fh, AMBER, 3)
        y = 76
        for l_ in lines:
            d.text((52, y), l_, font=fb, fill=PAPER)
            y += int(lh(fb) * 1.05)
        return shadowed(im, 14, 0.5)
    img_h = None
    e = El(t0, t1, mk, anim="up", ain=0.45, aout=0.35, z=30, name="tag")
    im = mk(1)
    img_h = im.size[1]
    if pos == "bl":
        e.x, e.y = 50, H - img_h - 60
    elif pos == "br":
        e.x, e.y = W - im.size[0] - 50, H - img_h - 60
    elif pos == "tl":
        e.x, e.y = 50, 130
    e._static = im
    return e


# ---------------------------------------------------------------- full-frame cards

def scrim(t0, t1, alpha=150, z=1):
    def mk(_):
        im = Image.new("RGBA", (W, H), INK + (alpha,))
        return im
    return El(t0, t1, mk, anim="fade", ain=0.35, aout=0.3, z=z, name="scrim")


def vignette(t0, t1, z=0):
    def mk(_):
        y, x = np.ogrid[0:H, 0:W]
        r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
        a = np.clip((r - 0.55) / 0.9, 0, 1) ** 1.6 * 200
        arr = np.zeros((H, W, 4), np.uint8)
        arr[..., 3] = a.astype(np.uint8)
        return Image.fromarray(arr, "RGBA")
    return El(t0, t1, mk, anim="fade", ain=0.0, aout=0.0, z=z, name="vig")


def big_number(t0, t1, number, caption, kicker=None, source=None, count=None, colour=PAPER, y=300,
               size=230, build=None):
    """Big centred number. count=(start,end,fmt) animates digits up to the spoken figure."""
    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        fn = font("head", size)
        yy = y
        if kicker:
            fk = font("monob", 28)
            text(d, (W / 2, yy - 70), kicker, fk, AMBER, 5, anchor="ma")
        s = number
        if count and p < 1:
            a, b, fmt = count
            s = fmt(a + (b - a) * ease_out(p))
        text(d, (W / 2, yy), s, fn, colour, 2, anchor="ma")
        fc = font("body", 46)
        cy = yy + size * 1.08
        for l_ in wrap(caption, fc, 1400):
            text(d, (W / 2, cy), l_, fc, PAPER, anchor="ma")
            cy += lh(fc) * 1.05
        if source:
            fs = font("mono", 24)
            text(d, (W / 2, cy + 26), source, fs, MUTED, 2, anchor="ma")
        return shadowed(im, 18, 0.6)
    return El(t0, t1, mk, anim="up", ain=0.5, aout=0.35, build=build if count else None, z=20,
              name="bignum")


def headline(t0, t1, lines, kicker=None, y=None, size=110, colour=PAPER, sub=None, align="m", x=None,
             maxw=1600, z=20, anim="up"):
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
            text(d, (xx, yy - 64), kicker, fk, AMBER, 5, anchor=anc)
        for l_ in L:
            text(d, (xx, yy), l_, fh, colour, 2, anchor=anc)
            yy += lh(fh) * 0.95
        yy += 30
        for l_ in subl:
            text(d, (xx, yy), l_, fsub, PAPER + (235,), anchor=anc)
            yy += lh(fsub) * 1.08
        return shadowed(im, 18, 0.65)
    return El(t0, t1, mk, anim=anim, ain=0.5, aout=0.35, z=z, name="headline")


def definition(t0, t1, term, body, kicker="PLAIN ENGLISH", y=None, z=20):
    def mk(_):
        im = blank()
        d = ImageDraw.Draw(im)
        ft = font("head", 96)
        fb = font("body", 52)
        lines = wrap(body, fb, 1240)
        h_ = 70 + lh(ft) + 26 + len(lines) * lh(fb) * 1.1 + 40
        yy = y if y is not None else (H - h_) / 2
        x0 = 150
        d.rectangle([x0 - 40, yy - 10, x0 - 32, yy + h_ - 20], fill=RED)
        text(d, (x0, yy), kicker, font("monob", 26), AMBER, 5)
        yy += 56
        text(d, (x0, yy), term.upper(), ft, PAPER, 2)
        yy += lh(ft) + 16
        for l_ in lines:
            d.text((x0, yy), l_, font=fb, fill=PAPER)
            yy += lh(fb) * 1.1
        return shadowed(im, 18, 0.6)
    return El(t0, t1, mk, anim="left", ain=0.55, aout=0.35, slide=50, z=20, name="def")


def quote_card(t0, t1, quote, intro=None, who=None):
    def mk(_):
        im = blank()
        d = ImageDraw.Draw(im)
        fq = font("quote", 130)
        yy = 360
        if intro:
            fi = font("body", 40)
            for l_ in wrap(intro, fi, 1300):
                text(d, (W / 2, yy - 150), l_, fi, PAPER + (220,), anchor="ma")
                yy += lh(fi) * 1.05
            yy = 380 + (len(wrap(intro, fi, 1300)) - 1) * 10
        text(d, (W / 2, yy), quote, fq, PAPER, anchor="ma")
        if who:
            fw = font("monob", 30)
            text(d, (W / 2, yy + 200), who, fw, AMBER, 4, anchor="ma")
        return shadowed(im, 22, 0.7)
    return El(t0, t1, mk, anim="up", ain=0.6, aout=0.4, z=20, name="quote")


def flow(t0, steps, t1, labels, y=430, box_w=None, size=44, kicker=None, heads=None):
    """Horizontal cause-and-effect chain; each box appears at its own time (steps)."""
    n = len(labels)
    gap = 90
    bw = box_w or int((W - 220 - gap * (n - 1)) / n)
    els = []
    fb = font("body", size)
    heights = [len(wrap(l_, fb, bw - 50)) for l_ in labels]
    bh = int(max(heights) * lh(fb) * 1.08 + 70 + (40 if heads else 0))
    x0 = (W - (n * bw + (n - 1) * gap)) / 2
    if kicker:
        els.append(headline(t0, t1, [kicker], size=44, y=y - 110, colour=AMBER, z=19))
    for i, l_ in enumerate(labels):
        def mk(_, l_=l_, i=i):
            im = blank(bw + 40, bh + 40)
            d = ImageDraw.Draw(im)
            d.rectangle([20, 20, 20 + bw, 20 + bh], fill=INK + (225,), outline=PAPER + (110,), width=2)
            d.rectangle([20, 20, 20 + bw, 28], fill=RED if i == n - 1 else AMBER)
            yy = 48
            if heads:
                text(d, (45, yy), heads[i], font("monob", 22), AMBER, 3)
                yy += 40
            for ln in wrap(l_, fb, bw - 50):
                d.text((45, yy), ln, font=fb, fill=PAPER)
                yy += lh(fb) * 1.08
            return shadowed(im, 14, 0.6)
        xx = x0 + i * (bw + gap) - 20
        els.append(El(steps[i], t1, mk, x=xx, y=y - 20, anim="up", ain=0.45, aout=0.35, z=21))
        if i > 0:
            def mka(_, ):
                im = blank(gap + 20, 60)
                d = ImageDraw.Draw(im)
                arrow(d, 14, 30, gap - 4, 30, PAPER + (230,), 6, 20)
                return im
            els.append(El(steps[i] - 0.05, t1, mka, x=xx - gap + 10, y=y + bh / 2 - 30, anim="right", ain=0.3,
                          aout=0.35, z=22))
    return els


def stack(t0, steps, t1, rows, title=None, x=150, y=250, size=50, numbered=True, width=1500, kicker=None,
          colours=None):
    """Vertical list; each row appears at its time."""
    els = []
    fb = font("body", size)
    yy = y
    if kicker:
        els.append(El(t0, t1, lambda _: _kick(kicker), x=x, y=y - 120, anim="fade", z=20))
    if title:
        def mkt(_):
            im = blank(W, 140)
            d = ImageDraw.Draw(im)
            text(d, (0, 10), title.upper(), font("head", 90), PAPER, 2)
            return shadowed(im, 14, 0.6)
        els.append(El(t0, t1, mkt, x=x, y=y - 70, anim="up", z=20))
        yy += 110
    for i, r in enumerate(rows):
        lines = wrap(r, fb, width - 120)
        rh = int(len(lines) * lh(fb) * 1.08 + 34)

        def mk(_, lines=lines, i=i, rh=rh):
            im = blank(width + 40, rh + 40)
            d = ImageDraw.Draw(im)
            d.rectangle([20, 20, 20 + width, 20 + rh - 10], fill=INK + (205,))
            col = (colours[i] if colours else AMBER)
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
        els.append(El(steps[i], t1, mk, x=x - 20, y=yy - 20, anim="left", ain=0.45, aout=0.35, slide=40, z=21))
        yy += rh + 8
    return els


def _kick(s):
    im = blank(W, 60)
    d = ImageDraw.Draw(im)
    text(d, (0, 10), s, font("monob", 28), AMBER, 5)
    return shadowed(im, 10, 0.6)


def suspect_card(t0, t1, n, title_lines, sub=None):
    """Chapter-hold title: SUSPECT n + name, with a stamp-like frame."""
    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        fk = font("monob", 34)
        ft = font("head", 150 if max(len(l_) for l_ in title_lines) < 18 else 118)
        k = f"SUSPECT {n}" if isinstance(n, int) else n
        total_h = 80 + len(title_lines) * lh(ft) * 0.92 + (70 if sub else 0)
        y0 = (H - total_h) / 2
        rule_w = 900 * ease_out(p)
        text(d, (W / 2, y0), k, fk, RED, 14, anchor="ma")
        d.rectangle([W / 2 - rule_w / 2, y0 + 58, W / 2 + rule_w / 2, y0 + 62], fill=RED)
        yy = y0 + 86
        for l_ in title_lines:
            text(d, (W / 2, yy), l_, ft, PAPER, 3, anchor="ma")
            yy += lh(ft) * 0.92
        if sub:
            text(d, (W / 2, yy + 14), sub, font("mono", 30), PAPER + (220,), 3, anchor="ma")
        return shadowed(im, 22, 0.75)
    return El(t0, t1, mk, anim="up", ain=0.5, aout=0.35, slide=30, build=0.9, z=25, name="suspect")


def title_card(t0, t1):
    def mk(p):
        im = blank()
        d = ImageDraw.Draw(im)
        ft = font("head", 168)
        text(d, (W / 2, 330), "WHO KILLED THE", ft, PAPER, 4, anchor="ma")
        text(d, (W / 2, 330 + lh(ft) * 0.9), "AUSSIE DREAM?", ft, RED, 4, anchor="ma")
        rw = 820 * ease_out(p)
        yy = 330 + lh(ft) * 1.85
        d.rectangle([W / 2 - rw / 2, yy, W / 2 + rw / 2, yy + 4], fill=PAPER)
        text(d, (W / 2, yy + 30), "FIVE SUSPECTS BEHIND AUSTRALIA’S HOUSING CRISIS", font("monob", 34), PAPER, 6,
             anchor="ma")
        return shadowed(im, 24, 0.75)
    return El(t0, t1, mk, anim="up", ain=0.8, aout=0.5, slide=30, build=1.2, z=25, name="title")


# ---------------------------------------------------------------- charts

def rate_timeline(t0, t1, marks):
    """RBA cash-rate path. Only 3.6% and 4.6% are labelled (the spoken figures).

    marks: dict of absolute times for each reveal step: cuts, feb, mar, may, sep.
    """
    # Normalised path: three 2025 cuts down to 3.6, then four rises to 4.6 (steps unlabelled).
    pts = [("start", 4.35), ("c1", 4.10), ("c2", 3.85), ("c3", 3.60), ("feb", 3.85), ("mar", 4.10),
           ("may", 4.35), ("sep", 4.60)]
    x_of = {"start": 0.0, "c1": 0.12, "c2": 0.32, "c3": 0.52, "feb": 0.64, "mar": 0.70, "may": 0.80,
            "sep": 0.95}
    order = ["cuts", "feb", "mar", "may", "sep"]
    gx0, gx1, gy0, gy1 = 220, 1700, 300, 820

    def y_of(v):
        return gy1 - (v - 3.3) / (4.9 - 3.3) * (gy1 - gy0)

    def X(k):
        return gx0 + x_of[k] * (gx1 - gx0)

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        fk = font("monob", 26)
        text(d, (gx0, 170), "THE RBA’S CASH RATE", font("head", 70), PAPER, 3)
        # year bands
        yb = gy1 + 30
        d.line([(gx0, gy1), (gx1, gy1)], fill=PAPER + (120,), width=2)
        x26 = gx0 + 0.6 * (gx1 - gx0)
        d.line([(x26, gy0 - 30), (x26, gy1 + 10)], fill=PAPER + (70,), width=2)
        text(d, ((gx0 + x26) / 2, yb), "2025", fk, MUTED, 4, anchor="ma")
        text(d, ((x26 + gx1) / 2, yb), "2026", fk, MUTED, 4, anchor="ma")
        # progressive path
        seq = ["start", "c1", "c2", "c3", "feb", "mar", "may", "sep"]
        vals = dict(pts)
        reveal = {"start": t0, "c1": marks["cuts"], "c2": marks["cuts"] + 0.6, "c3": marks["cuts"] + 1.2,
                  "feb": marks["feb"], "mar": marks["mar"], "may": marks["may"], "sep": marks["sep"]}
        path = [(X("start"), y_of(vals["start"]))]
        for a, b in zip(seq, seq[1:]):
            tb = reveal[b]
            if T < tb:
                break
            p = ease_out((T - tb) / 0.5)
            xa, ya = X(a), y_of(vals[a])
            xb, yb2 = X(b), y_of(vals[b])
            # step chart: horizontal then vertical
            xm = xa + (xb - xa) * min(1, p * 1.6)
            path.append((xm, ya))
            if p * 1.6 > 1:
                q = min(1, (p * 1.6 - 1) / 0.6)
                path.append((xb, ya + (yb2 - ya) * q))
            col = None
        if len(path) > 1:
            d.line(path, fill=AMBER, width=8, joint="curve")
        # labels for spoken numbers only
        if T >= marks["cuts"] + 1.4:
            a = ease_out((T - marks["cuts"] - 1.4) / 0.5)
            text(d, (X("c3"), y_of(3.6) + 24), "3.6%", font("head", 72), PAPER + (int(255 * a),), anchor="ma")
            text(d, ((X("start") + X("c3")) / 2, y_of(4.2) - 120), "THREE CUTS", fk,
                 PAPER + (int(220 * a),), 4, anchor="ma")
        for k, lab in [("feb", "FEB"), ("mar", "MAR"), ("may", "MAY"), ("sep", "SEP")]:
            if T >= marks[k]:
                a = ease_out((T - marks[k]) / 0.4)
                d.ellipse([X(k) - 9, y_of(vals[k]) - 9, X(k) + 9, y_of(vals[k]) + 9],
                          fill=RED + (int(255 * a),))
                text(d, (X(k), gy1 + 72), lab, fk, PAPER + (int(255 * a),), 3, anchor="ma")
        if T >= marks["sep"] + 0.6:
            a = ease_out((T - marks["sep"] - 0.6) / 0.5)
            text(d, (X("sep"), y_of(4.6) - 110), "4.6%", font("head", 96), RED + (int(255 * a),), anchor="ma")
        return shadowed(im, 16, 0.6)

    e = El(t0, t1, None, anim="fade", ain=0.4, aout=0.4, z=20, name="ratechart")
    e.image = lambda T: frame(T)
    return e


def bars(t0, t1, items, title, kicker=None, unit_max=None, y0=290, label_w=520, fmt=None, source=None,
         bar_h=96):
    """Horizontal bar chart. items: list of (label, value, display, colour, t_reveal)."""
    vmax = unit_max or max(v for _, v, _, _, _ in items) * 1.08
    gx0 = 140 + label_w
    gx1 = 1500

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        if kicker:
            text(d, (140, y0 - 140), kicker, font("monob", 26), AMBER, 5)
        text(d, (140, y0 - 100), title, font("head", 72), PAPER, 2)
        fl = font("body", 34)
        yy = y0 + 40
        for lab, v, disp, col, tr in items:
            if T < tr:
                yy += bar_h + 46
                continue
            p = ease_out((T - tr) / 0.9)
            ll = wrap(lab, fl, label_w - 40)
            ly = yy + bar_h / 2 - len(ll) * lh(fl) / 2
            for l_ in ll:
                d.text((140, ly), l_, font=fl, fill=PAPER + (int(255 * min(1, p * 2)),))
                ly += lh(fl)
            bw = (gx1 - gx0) * v / vmax * p
            d.rectangle([gx0, yy, gx0 + bw, yy + bar_h], fill=col)
            if p > 0.6:
                a = int(255 * min(1, (p - 0.6) / 0.3))
                text(d, (gx0 + bw + 24, yy + bar_h / 2 - 40), disp, font("head", 76), PAPER + (a,))
            yy += bar_h + 46
        if source:
            text(d, (140, H - 110), source, font("mono", 24), MUTED, 2)
        return shadowed(im, 14, 0.6)

    e = El(t0, t1, None, anim="fade", ain=0.4, aout=0.4, z=20, name="bars")
    e.image = lambda T: frame(T)
    return e


def locks_big(t0, t1, steps, defs, end_hot=None):
    """Full-frame three locks for S06: each lock + plain-English line appears at its time."""
    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        text(d, (W / 2, 150), "SAM’S PROBLEM HAS THREE PARTS", font("monob", 30), AMBER, 6, anchor="ma")
        for i, name in enumerate(LOCKS):
            if T < steps[i]:
                continue
            a = ease_out((T - steps[i]) / 0.5)
            cx = 360 + i * 600
            hot = end_hot is not None and T >= end_hot
            col = (RED if hot else PAPER) + (int(255 * a),)
            lk = padlock(170, col, fill_alpha=int(60 * a) if hot else 0)
            im.alpha_composite(lk, (int(cx - 85), int(250 - (1 - a) * 30)))
            text(d, (cx, 490), name, font("head", 92), col, 6, anchor="ma")
            fb = font("body", 38)
            yy = 610
            for l_ in wrap(defs[i], fb, 470):
                text(d, (cx, yy), l_, fb, PAPER + (int(235 * a),), anchor="ma")
                yy += lh(fb) * 1.08
        if end_hot is not None and T >= end_hot:
            a = ease_out((T - end_hot) / 0.5)
            text(d, (W / 2, 900), "FIVE SUSPECTS · THREE LOCKS", font("monob", 34), RED + (int(255 * a),), 8,
                 anchor="ma")
        return shadowed(im, 16, 0.65)
    e = El(t0, t1, None, anim="fade", ain=0.4, aout=0.4, z=20, name="locksbig")
    e.image = lambda T: frame(T)
    return e


def board(t0, t1, names, steps, string_t, stamp_t, thumbs, intro_q=False):
    """Five-suspect evidence board. thumbs: list of PIL images (already cropped 16:10)."""
    cw, ch = 330, 360
    xs = [140 + i * 340 for i in range(5)]
    ys = [250, 330, 230, 340, 260]
    tcache = {}

    def card(i):
        if i in tcache:
            return tcache[i]
        im = Image.new("RGBA", (cw, ch), PAPER + (255,))
        d = ImageDraw.Draw(im)
        th = thumbs[i].resize((cw - 30, 170), Image.LANCZOS)
        im.paste(th, (15, 15))
        text(d, (15, 196), f"SUSPECT {i + 1}", font("monob", 22), RED, 3)
        fb = font("head", 46)
        yy = 228
        for l_ in wrap(names[i].upper(), fb, cw - 30):
            d.text((15, yy), l_, font=fb, fill=INK)
            yy += lh(fb) * 0.92
        im = im.rotate([-3, 2, -1.5, 3, -2][i], resample=Image.BICUBIC, expand=True)
        tcache[i] = im
        return im

    def frame(T):
        im = blank()
        d = ImageDraw.Draw(im)
        text(d, (W / 2, 120), "THE BOARD", font("monob", 30), AMBER, 10, anchor="ma")
        centres = []
        for i in range(5):
            cx, cy = xs[i] + cw / 2, ys[i] + 40
            centres.append((cx, cy))
        if T >= string_t:
            p = ease_out((T - string_t) / 1.4)
            segs = [(centres[i], centres[j]) for i in range(5) for j in range(i + 1, 5)]
            for k, (a, b) in enumerate(segs):
                q = max(0, min(1, p * len(segs) - k * 0.6))
                if q > 0:
                    d.line([a, (a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q)], fill=RED + (230,), width=5)
        for i in range(5):
            if T < steps[i]:
                q_alpha = 0.0
            else:
                q_alpha = ease_out((T - steps[i]) / 0.45)
            if q_alpha <= 0 and not intro_q:
                continue
            c = card(i)
            if q_alpha <= 0 and intro_q:
                continue
            cc = c.copy()
            if q_alpha < 1:
                arr = np.array(cc)
                arr[..., 3] = (arr[..., 3] * q_alpha).astype(np.uint8)
                cc = Image.fromarray(arr)
            im.alpha_composite(cc, (int(xs[i] - 10), int(ys[i] - 10 - (1 - q_alpha) * 30)))
            # pin
            d.ellipse([xs[i] + cw / 2 - 12, ys[i] + 28, xs[i] + cw / 2 + 12, ys[i] + 52], fill=RED + (int(255 * q_alpha),))
        if T >= string_t:
            p = ease_out((T - string_t) / 1.4)
            for (cx, cy) in centres:
                d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=RED + (int(255 * p),))
        if T >= stamp_t:
            p = ease_out((T - stamp_t) / 0.35)
            st = blank(1100, 200)
            sd = ImageDraw.Draw(st)
            sd.rectangle([10, 10, 1090, 190], outline=RED, width=10)
            text(sd, (550, 34), "NONE ACTED ALONE", font("head", 128), RED, 8, anchor="ma")
            st = st.rotate(-4, resample=Image.BICUBIC, expand=True)
            sc = 1.6 - 0.6 * p
            st = st.resize((int(st.size[0] * sc), int(st.size[1] * sc)), Image.BICUBIC)
            arr = np.array(st)
            arr[..., 3] = (arr[..., 3] * p).astype(np.uint8)
            st = Image.fromarray(arr)
            im.alpha_composite(st, (int(W / 2 - st.size[0] / 2), int(800 - st.size[1] / 2)))
        return shadowed(im, 16, 0.6)

    e = El(t0, t1, None, anim="fade", ain=0.4, aout=0.4, z=20, name="board")
    e.image = lambda T: frame(T)
    return e


def calendar(t0, steps, t1, rows, title="WHAT COULD HAPPEN NEXT"):
    """rows: (date, line). Appears row by row."""
    els = []

    def mkt(_):
        im = blank(W, 140)
        d = ImageDraw.Draw(im)
        text(d, (0, 10), title, font("head", 84), PAPER, 3)
        return shadowed(im, 14, 0.6)
    els.append(El(t0, t1, mkt, x=150, y=150, anim="up", z=20))
    yy = 320
    for i, (date, line) in enumerate(rows):
        def mk(_, date=date, line=line):
            im = blank(1640, 150)
            d = ImageDraw.Draw(im)
            d.rectangle([20, 20, 1620, 140], fill=INK + (215,))
            d.rectangle([20, 20, 440, 140], fill=RED)
            text(d, (230, 40), date, font("head", 66), PAPER, 2, anchor="ma")
            fb = font("body", 44)
            ll = wrap(line, fb, 1100)
            ly = 80 - len(ll) * lh(fb) / 2 + 2
            for l_ in ll:
                d.text((480, ly), l_, font=fb, fill=PAPER)
                ly += lh(fb)
            return shadowed(im, 12, 0.55)
        els.append(El(steps[i], t1, mk, x=130, y=yy, anim="left", ain=0.45, aout=0.35, slide=40, z=21))
        yy += 150
    return els


def ballot(t0, steps, t1, options, title):
    els = []

    def mkt(_):
        im = blank(W, 140)
        d = ImageDraw.Draw(im)
        text(d, (0, 10), title, font("head", 84), PAPER, 3)
        return shadowed(im, 14, 0.6)
    els.append(El(t0, t1, mkt, x=150, y=120, anim="up", z=20))
    yy = 270
    for i, o in enumerate(options):
        def mk(_, o=o, i=i):
            im = blank(1300, 116)
            d = ImageDraw.Draw(im)
            d.rectangle([20, 14, 1280, 104], fill=INK + (210,))
            d.rectangle([44, 32, 98, 86], outline=PAPER, width=4)
            col = RED if i == len(options) - 1 else PAPER
            d.text((130, 30), o, font=font("head", 58), fill=col)
            return shadowed(im, 10, 0.5)
        els.append(El(steps[i], t1, mk, x=130, y=yy, anim="left", ain=0.4, aout=0.35, slide=40, z=21))
        yy += 112
    return els


def end_card(t0, t1, line):
    def mk(_):
        im = blank()
        d = ImageDraw.Draw(im)
        fh = font("head", 90)
        yy = 330
        for l_ in wrap(line, fh, 1500):
            text(d, (W / 2, yy), l_, fh, PAPER, 2, anchor="ma")
            yy += lh(fh) * 0.95
        bw, bh = 420, 110
        bx, by = W / 2 - bw / 2, yy + 70
        d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=14, fill=RED)
        text(d, (W / 2, by + 18), "FOLLOW", font("head", 72), PAPER, 10, anchor="ma")
        text(d, (W / 2, by + bh + 50), "SOURCES FOR EVERY NUMBER ARE IN THE DESCRIPTION", font("monob", 28), MUTED, 4,
             anchor="ma")
        return shadowed(im, 20, 0.7)
    return El(t0, t1, mk, anim="up", ain=0.6, aout=0.5, z=25, name="end")
