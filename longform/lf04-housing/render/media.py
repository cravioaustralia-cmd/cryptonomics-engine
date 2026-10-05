"""Source media helpers: photo loading, Ken Burns framing, chart backgrounds, thumbnails."""
import os
import subprocess
from functools import lru_cache

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from design import EP, H, INK, INK2, W

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


def video_frame(name, t):
    os.makedirs(BUILD, exist_ok=True)
    out = os.path.join(BUILD, f"frame_{name}_{t:.2f}.png")
    if not os.path.exists(out):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", src_path(name), "-frames:v", "1",
                        "-vf", "scale=1920:-2", out], check=True)
    return Image.open(out).convert("RGB")


@lru_cache(None)
def load(name, box=None, max_w=3200):
    if name == "F24frame":
        im = video_frame("F24", 15.5)
    else:
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
    if kind == "in":
        c = kb[3] if len(kb) > 3 else (0.5, 0.5)
        return z0, z1, c, c
    if kind == "out":
        c = kb[3] if len(kb) > 3 else (0.5, 0.5)
        return z0, z1, c, c
    if kind == "up":
        return z0, z1, (0.5, 0.62), (0.5, 0.38)
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
        # pre-scale so the most zoomed-in view is ~1.15x output resolution (sharp, fast)
        pre = min(1.0, s0 * zmax * 1.15)
        if pre < 1.0:
            im = im.resize((max(W, int(im.width * pre)), max(H, int(im.height * pre))), Image.LANCZOS)
        self.im = treat_img(im, treat)
        self.s0 = max(W / self.im.width, H / self.im.height)

    def frame(self, p):
        from design import ease_io
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


class Portrait:
    """Framed portrait inset (official photos) over a blurred, darkened background."""

    def __init__(self, name, bg=None, side="right"):
        im = load(name)
        bgim = load(bg) if bg else im
        s = max(W * 1.1 / bgim.width, H * 1.1 / bgim.height)
        b = bgim.resize((int(bgim.width * s) + 1, int(bgim.height * s) + 1), Image.LANCZOS)
        b = b.filter(ImageFilter.GaussianBlur(26))
        b = ImageEnhance.Brightness(b).enhance(0.38)
        self.bg = b
        ph = 760
        pw = int(im.width * ph / im.height)
        if pw > 900:
            pw = 900
            ph = int(im.height * pw / im.width)
        self.ph = im.resize((pw, ph), Image.LANCZOS)
        fr_ = Image.new("RGB", (pw + 24, ph + 24), (238, 231, 216))
        fr_.paste(self.ph, (12, 12))
        self.card = fr_
        self.side = side

    def frame(self, p):
        bw, bh = self.bg.size
        dx = (bw - W) * (0.3 + 0.4 * p)
        dy = (bh - H) * 0.5
        out = self.bg.crop((int(dx), int(dy), int(dx) + W, int(dy) + H))
        z = 1.0 + 0.035 * p
        cw, ch = self.card.size
        c = self.card.resize((int(cw * z), int(ch * z)), Image.BICUBIC)
        x = int(W - 140 - c.width) if self.side == "right" else 140
        y = int((H - c.height) / 2)
        sh = Image.new("RGBA", (c.width + 80, c.height + 80), (0, 0, 0, 0))
        m = Image.new("L", sh.size, 0)
        m.paste(170, (40, 40, 40 + c.width, 40 + c.height))
        m = m.filter(ImageFilter.GaussianBlur(22))
        out.paste((0, 0, 0), (x - 40 + 10, y - 40 + 16), m)
        out.paste(c, (x, y))
        return out


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


def _thumb(name, box=None, dark=False):
    im = load(name, box)
    tw_, th_ = 300, 170
    s = max(tw_ / im.width, th_ / im.height)
    im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    x = (im.width - tw_) // 2
    y = (im.height - th_) // 2
    im = im.crop((x, y, x + tw_, y + th_))
    if dark:
        im = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.0)).enhance(0.35)
    return im


def thumbs_board():
    return [_thumb("IMG-02"), _thumb("IMG-16"), _thumb("IMG-15"), _thumb("F24frame"), _thumb("IMG-10")]


def thumbs_unknown():
    return [_thumb(n, dark=True) for n in ("IMG-02", "IMG-16", "IMG-15", "F24frame", "IMG-10")]
