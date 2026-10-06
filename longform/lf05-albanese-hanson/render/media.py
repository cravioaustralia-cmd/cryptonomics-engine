"""Source media helpers: photo loading, Ken Burns framing, portrait insets, Polaroids, chart backgrounds."""
import os
import subprocess
from functools import lru_cache

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from design import EP, GOLD, H, INK, INK2, ORANGE, PAPER, W, WHITE, ease_io

BUILD = os.path.join(EP, "build")


def src_path(name):
    if name.startswith("IMG-"):
        for ext in (".jpg", ".png"):
            p = os.path.join(EP, "images", name + ext)
            if os.path.exists(p):
                return p
        raise FileNotFoundError(name)
    if name.startswith("F"):
        return os.path.join(EP, "footage", name + ".mp4")
    if name.startswith("B"):
        return os.path.join(EP, "broll", name + ".mp4")
    raise ValueError(name)


# Portrait crops (normalised l,t,r,b) so each named person fills the frame without bystanders.
CROPS = {
    "IMG-hanson-2016": (0.43, 0.02, 0.82, 1.0),
    "IMG-albanese-dfat": (0.0, 0.02, 1.0, 0.72),
    "IMG-abbott-official": (0.0, 0.0, 1.0, 0.80),
    "IMG-ley-official": (0.0, 0.0, 1.0, 0.85),
    "IMG-taylor-official": (0.0, 0.0, 1.0, 0.85),
    "IMG-hanson-2006": (0.25, 0.0, 0.85, 0.72),
}


@lru_cache(None)
def load(name, box=None, max_w=3200):
    im = Image.open(src_path(name))
    im = ImageOps.exif_transpose(im).convert("RGB")
    if box:
        l, t, r, b = box
        im = im.crop((int(l * im.width), int(t * im.height), int(r * im.width), int(b * im.height)))
    if im.width > max_w:
        im = im.resize((max_w, int(im.height * max_w / im.width)), Image.LANCZOS)
    return im


def treat_img(im, treat):
    if treat == "blur":
        im = im.filter(ImageFilter.GaussianBlur(max(6, im.width // 160)))
    if treat == "ghost":
        im = im.filter(ImageFilter.GaussianBlur(max(4, im.width // 300)))
        im = ImageEnhance.Color(im).enhance(0.35)
        im = ImageEnhance.Brightness(im).enhance(0.32)
    return im


def kb_params(kb):
    kind = kb[0]
    z0 = kb[1] if len(kb) > 1 else 1.0
    z1 = kb[2] if len(kb) > 2 else 1.1
    if kind in ("in", "out"):
        c = kb[3] if len(kb) > 3 else (0.5, 0.5)
        return z0, z1, c, c
    if kind == "up":
        return z0, z1, (0.5, 0.62), (0.5, 0.38)
    if kind == "down":
        return z0, z1, (0.5, 0.38), (0.5, 0.62)
    if kind == "left":
        return z0, z1, (0.62, 0.5), (0.38, 0.5)
    if kind == "right":
        return z0, z1, (0.38, 0.5), (0.62, 0.5)
    if kind == "pan":
        return z0, z1, kb[3], kb[4]
    raise ValueError(kb)


class KB:
    """Sub-pixel Ken Burns: crop a float rectangle and resample to 1920x1080 each frame."""

    def __init__(self, name, kb=("in",), box=None, treat=None):
        im = load(name, box)
        z0, z1, c0, c1 = kb_params(kb)
        self.z0, self.z1, self.c0, self.c1 = z0, z1, c0, c1
        zmax = max(z0, z1)
        s0 = max(W / im.width, H / im.height)
        pre = min(1.0, s0 * zmax * 1.15)
        if pre < 1.0:
            im = im.resize((max(W, int(im.width * pre)), max(H, int(im.height * pre))), Image.LANCZOS)
        self.im = treat_img(im, treat)
        self.s0 = max(W / self.im.width, H / self.im.height)

    def frame(self, p):
        q = ease_io(p) * 0.85 + p * 0.15
        z = self.z0 + (self.z1 - self.z0) * q
        cx = self.c0[0] + (self.c1[0] - self.c0[0]) * q
        cy = self.c0[1] + (self.c1[1] - self.c0[1]) * q
        iw, ih = self.im.size
        w = W / (self.s0 * z)
        h = H / (self.s0 * z)
        x0 = min(max(cx * iw - w / 2, 0), iw - w)
        y0 = min(max(cy * ih - h / 2, 0), ih - h)
        return self.im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + w, y0 + h))


def _bg(bgname, blur=26, bright=0.38, box=None):
    bgim = load(bgname, box)
    s = max(W * 1.12 / bgim.width, H * 1.12 / bgim.height)
    b = bgim.resize((int(bgim.width * s) + 1, int(bgim.height * s) + 1), Image.LANCZOS)
    if blur:
        b = b.filter(ImageFilter.GaussianBlur(blur))
    return ImageEnhance.Brightness(b).enhance(bright)


def _framed(name, ph=760, maxw=900, colour=PAPER, box=None):
    im = load(name, box if box is not None else CROPS.get(name))
    pw = int(im.width * ph / im.height)
    if pw > maxw:
        pw = maxw
        ph = int(im.height * pw / im.width)
    ph_ = im.resize((pw, ph), Image.LANCZOS)
    fr_ = Image.new("RGB", (pw + 24, ph + 24), colour)
    fr_.paste(ph_, (12, 12))
    return fr_


def _paste_shadow(out, c, x, y, op=170):
    sh = Image.new("L", (c.width + 80, c.height + 80), 0)
    sh.paste(op, (40, 40, 40 + c.width, 40 + c.height))
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    out.paste((0, 0, 0), (x - 40 + 10, y - 40 + 16), sh)
    out.paste(c, (x, y))


class Portrait:
    """Framed portrait inset (official photos) over a blurred, darkened background that drifts."""

    def __init__(self, name, bg=None, side="right", colour=PAPER, blur=26, bright=0.38, ph=760):
        self.bg = _bg(bg or name, blur, bright, None if bg else CROPS.get(name))
        self.card = _framed(name, ph=ph, colour=colour)
        self.side = side

    def frame(self, p):
        bw, bh = self.bg.size
        dx = (bw - W) * (0.3 + 0.4 * p)
        dy = (bh - H) * 0.5
        out = self.bg.crop((int(dx), int(dy), int(dx) + W, int(dy) + H))
        z = 1.0 + 0.035 * p
        cw, ch = self.card.size
        c = self.card.resize((int(cw * z), int(ch * z)), Image.BICUBIC)
        if self.side == "right":
            x = int(W - 140 - c.width)
        elif self.side == "left":
            x = 140
        else:
            x = int((W - c.width) / 2)
        y = int((H - c.height) / 2)
        _paste_shadow(out, c, x, y)
        return out


class Duo:
    """Albanese (gold frame, left) and Hanson (orange-red frame, right) over a blurred background."""

    def __init__(self, left="IMG-albanese-dfat", right="IMG-hanson-2016", bg="IMG-parliament-house-canberra",
                 ph=640, slide_right=0.0):
        self.bg = _bg(bg, 18, 0.42)
        self.l = _framed(left, ph=ph, maxw=620, colour=GOLD)
        self.r = _framed(right, ph=ph, maxw=620, colour=ORANGE)
        self.slide_right = slide_right

    def frame(self, p):
        bw, bh = self.bg.size
        dx = (bw - W) * (0.35 + 0.3 * p)
        out = self.bg.crop((int(dx), int((bh - H) / 2), int(dx) + W, int((bh - H) / 2) + H))
        z = 1.0 + 0.03 * p
        L = self.l.resize((int(self.l.width * z), int(self.l.height * z)), Image.BICUBIC)
        R = self.r.resize((int(self.r.width * z), int(self.r.height * z)), Image.BICUBIC)
        _paste_shadow(out, L, int(W / 2 - 90 - L.width), int((H - L.height) / 2))
        q = 1.0
        if self.slide_right:
            q = min(1.0, max(0.0, (p - self.slide_right) / 0.18))
            q = 1 - (1 - q) ** 3
        if q > 0:
            x = int(W / 2 + 90 + (1 - q) * (W / 2))
            _paste_shadow(out, R, x, int((H - R.height) / 2))
        return out


class Polaroids:
    """Real photos as tilted Polaroids over a darkened background photo (S14 wilderness years)."""

    def __init__(self, names, bg, rots=(-6, 5), xs=(300, 1000), ys=(190, 240)):
        self.bg = _bg(bg, 10, 0.32)
        self.cards = []
        for n, r in zip(names, rots):
            im = load(n, CROPS.get(n))
            ph = 520
            pw = int(im.width * ph / im.height)
            if pw > 640:
                pw = 640
                ph = int(im.height * pw / im.width)
            im = im.resize((pw, ph), Image.LANCZOS)
            fr_ = Image.new("RGBA", (pw + 40, ph + 120), WHITE + (255,))
            fr_.paste(im, (20, 20))
            self.cards.append(fr_.rotate(r, resample=Image.BICUBIC, expand=True))
        self.xs, self.ys = xs, ys

    def frame(self, p):
        bw, bh = self.bg.size
        dx = (bw - W) * (0.3 + 0.4 * p)
        out = self.bg.crop((int(dx), int((bh - H) / 2), int(dx) + W, int((bh - H) / 2) + H)).convert("RGBA")
        for i, c in enumerate(self.cards):
            q = min(1.0, max(0.0, (p - i * 0.12) / 0.2))
            if q <= 0:
                continue
            a = np.array(c)
            a[..., 3] = (a[..., 3] * q).astype(np.uint8)
            cc = Image.fromarray(a)
            sh = Image.new("RGBA", cc.size, (0, 0, 0, 0))
            sh.putalpha(cc.getchannel("A").point(lambda v: int(v * 0.5)).filter(ImageFilter.GaussianBlur(16)))
            x = int(self.xs[i] + 20 * p)
            y = int(self.ys[i] - 10 * p)
            out.alpha_composite(sh, (x + 12, y + 18))
            out.alpha_composite(cc, (x, y))
        return out.convert("RGB")


class Chart:
    """Ink background with a faint drifting photo for full-frame graphics."""

    def __init__(self, bg=None):
        base = Image.new("RGB", (W, H), INK)
        y = np.linspace(0, 1, H)[:, None]
        x = np.linspace(0, 1, W)[None, :]
        g = 1 - 0.55 * np.sqrt((x - 0.45) ** 2 + (y - 0.35) ** 2)
        arr = np.zeros((H, W, 3), np.float32)
        for i, (a, b_) in enumerate(zip(INK, INK2)):
            arr[..., i] = a + (b_ - a) * np.clip(g, 0, 1) * 1.4
        self.base = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        self.kb = KB(bg, ("in", 1.05, 1.12), treat="ghost") if bg else None

    def frame(self, p):
        if not self.kb:
            return self.base.copy()
        ph = self.kb.frame(p)
        return Image.blend(self.base, ph, 0.55)
