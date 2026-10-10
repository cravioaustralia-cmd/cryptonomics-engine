"""media.py - video frame readers, photos, grades, grain, vignette."""
import subprocess
from functools import lru_cache
import numpy as np
import skia
from .core import EP, W, H, FPS, arr_to_image, rgb, clamp

CLIP_DIRS = [EP / "footage", EP / "broll"]


def clip_path(cid):
    for d in CLIP_DIRS:
        for p in d.glob(cid + "_*.mp4"):
            return p
    raise FileNotFoundError(cid)


@lru_cache(maxsize=None)
def clip_duration(cid):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          str(clip_path(cid))], capture_output=True, text=True).stdout
    return float(out.strip())


class VideoReader:
    """Sequential 30 fps reader of one clip at a given output size. frame(i) returns a skia.Image.
    Forward jumps read through; backward jumps restart ffmpeg at the new position."""

    def __init__(self, cid, w=W, h=H):
        self.cid, self.w, self.h = cid, w, h
        self.path = clip_path(cid)
        self.dur = clip_duration(cid)
        self.nframes = max(1, int(self.dur * FPS) - 1)
        self.proc = None
        self.pos = None   # index of the next frame the pipe will deliver
        self.last = None
        self.last_i = None

    def _start(self, i):
        if self.proc:
            self.proc.kill()
            self.proc.wait()
        vf = f"fps={FPS},scale={self.w}:{self.h}:force_original_aspect_ratio=increase:flags=bicubic,crop={self.w}:{self.h}"
        self.proc = subprocess.Popen(["ffmpeg", "-v", "quiet", "-ss", f"{i / FPS:.4f}", "-i", str(self.path),
                                      "-vf", vf, "-an", "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
                                     stdout=subprocess.PIPE, bufsize=self.w * self.h * 4 * 2)
        self.pos = i

    def _read(self):
        n = self.w * self.h * 4
        buf = self.proc.stdout.read(n)
        if len(buf) < n:
            return None
        self.pos += 1
        return np.frombuffer(buf, np.uint8).reshape(self.h, self.w, 4)

    def frame(self, i):
        i = int(max(0, min(i, self.nframes)))
        if i == self.last_i:
            return self.last
        if self.proc is None or i < self.pos or i > self.pos + 90:
            self._start(i)
        a = None
        while self.pos <= i:
            a2 = self._read()
            if a2 is None:
                break
            a = a2
        if a is None:
            return self.last
        self.last = skia.Image.fromarray(np.ascontiguousarray(a), colorType=skia.kRGBA_8888_ColorType)
        self.last_i = i
        return self.last

    def at(self, t, speed=1.0, start=0.0):
        """Frame at clip-local time t (seconds since the shot began), playing from `start` in the file."""
        return self.frame(round((start + max(0.0, t) * speed) * FPS))


_READERS = {}


def reader(cid, w=W, h=H, key=""):
    k = (cid, w, h, key)
    if k not in _READERS:
        _READERS[k] = VideoReader(cid, w, h)
    return _READERS[k]


def close_readers():
    for r in _READERS.values():
        if r.proc:
            r.proc.kill()
    _READERS.clear()


IMG_DIRS = [EP / "images", EP / "docs", EP / "data"]


@lru_cache(maxsize=64)
def photo(name, max_side=2600):
    """Load an image by file name (searched in images/, docs/, data/)."""
    for d in IMG_DIRS:
        p = d / name
        if p.exists():
            img = skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(str(p)))
            s = max(img.width(), img.height())
            if s > max_side:
                k = max_side / s
                img = img.resize(int(img.width() * k), int(img.height() * k),
                                 skia.SamplingOptions(skia.CubicResampler.Mitchell()))
            return img
    raise FileNotFoundError(name)


SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)


def draw_cover(c, img, x, y, w, h, zoom=1.0, fx=0.5, fy=0.5, paint=None, contain=False):
    """Draw img covering the rect (x,y,w,h), zoomed about focus (fx,fy) in image fraction."""
    iw, ih = img.width(), img.height()
    k = (min if contain else max)(w / iw, h / ih) * zoom
    sw, sh = w / k, h / k
    sx = clamp(fx * iw - sw / 2, min(0, iw - sw), max(0, iw - sw))
    sy = clamp(fy * ih - sh / 2, min(0, ih - sh), max(0, ih - sh))
    c.save()
    c.clipRect(skia.Rect.MakeXYWH(x, y, w, h))
    c.drawImageRect(img, skia.Rect.MakeXYWH(sx, sy, sw, sh), skia.Rect.MakeXYWH(x, y, w, h), SAMP, paint)
    c.restore()


# ---------------------------------------------------------------- grades (colour matrices)
def _cf(m):
    return skia.ColorFilters.Matrix(m)


def grade_matrix(kind, amount=1.0, bright=1.0):
    I = np.array([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0], float)
    if kind == "archival":   # warm sepia
        m = np.array([0.393, 0.769, 0.189, 0, 0.02,
                      0.349, 0.686, 0.168, 0, 0.01,
                      0.272, 0.534, 0.131, 0, -0.01,
                      0, 0, 0, 1, 0], float)
        m[:15] *= 0.9
    elif kind == "modern":   # slightly desaturated, cool
        s = 0.82
        lr, lg, lb = 0.2126, 0.7152, 0.0722
        m = np.array([lr * (1 - s) + s, lg * (1 - s), lb * (1 - s), 0, -0.005,
                      lr * (1 - s), lg * (1 - s) + s, lb * (1 - s), 0, 0.0,
                      lr * (1 - s), lg * (1 - s), lb * (1 - s) + s, 0, 0.012,
                      0, 0, 0, 1, 0], float)
        m[0:3] *= 0.97
        m[10:13] *= 1.03
    elif kind == "mono":
        lr, lg, lb = 0.2126, 0.7152, 0.0722
        m = np.array([lr, lg, lb, 0, 0, lr, lg, lb, 0, 0, lr, lg, lb, 0, 0, 0, 0, 0, 1, 0], float)
    elif kind == "warm":
        m = I.copy()
        m[0] = 1.06; m[6] = 1.0; m[12] = 0.88
    else:
        m = I.copy()
    m = I + (m - I) * amount
    for r in range(3):
        m[r * 5:r * 5 + 3] *= bright
        m[r * 5 + 4] *= bright
    return [float(x) for x in m]


def gpaint(kind="modern", amount=1.0, bright=1.0, alpha=1.0):
    p = skia.Paint(AntiAlias=True)
    p.setColorFilter(_cf(grade_matrix(kind, amount, bright)))
    if alpha < 1:
        p.setAlphaf(clamp(alpha))
    return p


# ---------------------------------------------------------------- grain + vignette
_GRAIN = []


def _grain_tiles():
    if not _GRAIN:
        rng = np.random.default_rng(7)
        for _ in range(6):
            n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
            v = np.clip(128 + n * 40, 0, 255).astype(np.uint8)
            a = np.dstack([v, v, v, np.full_like(v, 255)])
            _GRAIN.append(arr_to_image(a))
    return _GRAIN


def grain(c, frame_i, amount=0.05):
    """Light film grain (changes every 3 frames to stay friendly to the encoder)."""
    if amount <= 0:
        return
    tiles = _grain_tiles()
    img = tiles[(frame_i // 3) % len(tiles)]
    p = skia.Paint()
    p.setBlendMode(skia.BlendMode.kOverlay)
    p.setAlphaf(amount)
    c.drawImageRect(img, skia.Rect.MakeWH(W, H), SAMP, p)


def vignette(c, amount=0.45, inner=0.55):
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(
        skia.Point(W / 2, H / 2), W * 0.62,
        [rgb("#000000", 0), rgb("#000000", 0), rgb("#000000", amount)], [0.0, inner, 1.0]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)


def cover_map(img, x, y, w, h, zoom=1.0, fx=0.5, fy=0.5, contain=False):
    """Same maths as draw_cover; returns f(px, py) -> screen (X, Y) and the scale k."""
    iw, ih = img.width(), img.height()
    k = (min if contain else max)(w / iw, h / ih) * zoom
    sw, sh = w / k, h / k
    sx = clamp(fx * iw - sw / 2, min(0, iw - sw), max(0, iw - sw))
    sy = clamp(fy * ih - sh / 2, min(0, ih - sh), max(0, ih - sh))
    return (lambda px, py: (x + (px - sx) * k, y + (py - sy) * k)), k
