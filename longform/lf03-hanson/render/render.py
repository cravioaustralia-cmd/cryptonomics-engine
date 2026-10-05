"""lf03 picture: Python + OpenCV + Pillow, raw frames piped to ffmpeg. 1920x1080, 30 fps.
The cut lives on the 1x clock (scenes.py). Output frame f shows 1x time f * SPEED / FPS, so the picture is the 1x cut at SPEED.

  python3 render.py frames <first> <last> <out.mp4>    # a slice of the master (parallel workers)
  python3 render.py stills <outdir> <t1x> [<t1x> ...]   # PNG stills at 1x times (review)
"""
import os, subprocess, sys
import cv2
import numpy as np
from PIL import Image, ImageOps
import scenes as SC
import gfx as G

W, H, FPS = 1920, 1080, 30
SPEED = float(os.environ.get('SPEED', '1.28'))
EP = SC.EP if hasattr(SC, 'EP') else os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
EP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
NF = int(SC.DUR / SPEED * FPS)


def ease(u):
    u = min(1.0, max(0.0, u))
    return 0.5 - 0.5 * np.cos(np.pi * u)


# ------------------------------------------------------------------ static plates
def _bg():
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    top, bot = np.array([26, 31, 40], np.float32), np.array([9, 11, 15], np.float32)
    g = top[None, None] * (1 - y[..., None]) + bot[None, None] * y[..., None]
    glow = np.exp(-(((x - 0.28) / 0.55) ** 2 + ((y - 0.35) / 0.6) ** 2))[..., None] * np.array([10, 12, 16], np.float32)
    return np.clip(g + glow, 0, 255).astype(np.float32) * np.ones((H, W, 1), np.float32)


BG = _bg()
_xx = np.linspace(0, 1, W)[None, :]
_yy = np.linspace(0, 1, H)[:, None]
SCRIM = {
    'left': (0.70 * np.clip(1 - _xx / 0.68, 0, 1) ** 1.4 + 0 * _yy)[..., None].astype(np.float32),
    'bottom': (0.72 * np.clip((_yy - 0.45) / 0.55, 0, 1) ** 1.3 + 0 * _xx)[..., None].astype(np.float32),
    'none': None,
}
VIG = (1 - 0.28 * np.clip(((_xx - 0.5) ** 2 + (_yy - 0.5) ** 2) * 2.2, 0, 1))[..., None].astype(np.float32)

_photo = {}


def photo_src(name):
    if name not in _photo:
        im = ImageOps.exif_transpose(Image.open(os.path.join(EP, 'images', f'IMG-{name}.jpg'))).convert('RGB')
        cover = max(W / im.width, H / im.height)
        if cover < 1 / 1.5:   # far bigger than needed: keep ~1.5x the output resolution for the Ken Burns move
            f = cover * 1.5
            im = im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS)
        _photo[name] = np.asarray(im).astype(np.float32)
    return _photo[name]


_portrait = {}


def portrait_plate(name, caption, side):
    key = (name, side)
    if key not in _portrait:
        im = ImageOps.exif_transpose(Image.open(os.path.join(EP, 'images', f'IMG-{name}.jpg'))).convert('RGB')
        th = min(730, int(im.height * 2.2))
        im = im.resize((int(im.width * th / im.height), th), Image.LANCZOS)   # whole file, uniform scale: nothing cropped, faces untouched
        bw = 12
        framed = Image.new('RGBA', (im.width + bw * 2, im.height + bw * 2), (236, 232, 222, 255))
        framed.paste(im, (bw, bw))
        sh, pad = G.shadowed(framed, radius=26, alpha=190, off=(0, 16))
        plate = Image.fromarray(BG.astype(np.uint8)).convert('RGBA')
        cx = 1400 if side == 'right' else 520
        x, y = cx - framed.width // 2, 600 - framed.height // 2
        plate.alpha_composite(sh, (x - pad, y - pad))
        cap = G.credit(caption)
        plate.alpha_composite(cap, (cx - cap.width // 2, y + framed.height + 18))
        _portrait[key] = (np.asarray(plate.convert('RGB')).astype(np.float32), (cx, 600))
    return _portrait[key]


class Clip:
    def __init__(self, bid):
        self.cap = cv2.VideoCapture(os.path.join(EP, 'footage' if bid[0] == 'F' else 'broll', bid + '.mp4'))
        self.w, self.h = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.n = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 24
        self.pos, self.frame = -1, None

    def get(self, i):
        i = max(0, min(self.n - 1, i))
        if i < self.pos or i > self.pos + 60:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            self.pos = i - 1
        while self.pos < i:
            ok, f = self.cap.read()
            if not ok:
                break
            self.pos += 1
            self.frame = f
        return self.frame


_clips = {}


def clip(bid):
    if bid not in _clips:
        _clips[bid] = Clip(bid)
    return _clips[bid]


def warp(src, sc, px, py):
    M = np.array([[sc, 0, W / 2 - sc * px], [0, sc, H / 2 - sc * py]], np.float32)
    return cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def base(s, t):
    u = (t - s['t0']) / max(0.01, s['t1'] - s['t0'])
    k = s['kind']
    if k == 'bg':
        return BG.copy()
    if k == 'photo':
        img = photo_src(s['img'])
        ih, iw = img.shape[:2]
        z0, x0, y0, z1, x1, y1 = s['kb']
        e = ease(u) * 0.85 + u * 0.15
        z, cx, cy = z0 + (z1 - z0) * e, x0 + (x1 - x0) * e, y0 + (y1 - y0) * e
        sc = max(W / iw, H / ih) * z
        hw, hh = W / (2 * sc), H / (2 * sc)
        px, py = min(max(cx * iw, hw), iw - hw), min(max(cy * ih, hh), ih - hh)
        out = warp(img, sc, px, py) * VIG
        out *= s.get('dim', 1.0)
    elif k == 'portrait':
        plate, (cx, cy) = portrait_plate(s['img'], s['caption'], s['side'])
        z = 1.0 + 0.035 * (ease(u) * 0.7 + u * 0.3)
        M = np.array([[z, 0, cx - z * cx], [0, z, cy - z * cy]], np.float32)
        return cv2.warpAffine(plate, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    elif k == 'broll':
        c = clip(s['bid'])
        st = s['src'] + (t - s['t0']) * s['rate']
        f = c.get(int(st * c.fps))
        f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB).astype(np.float32)
        z = max(W / c.w, H / c.h) * (1.0 + 0.045 * u)   # any source size -> 1920x1080 (cover), with a slow push
        out = warp(f, z, c.w / 2, c.h / 2) * VIG * s.get('dim', 1.0)
    sm = SCRIM.get(s.get('scrim', 'none'))
    if sm is not None:
        out = out * (1 - sm)
    return out


# ------------------------------------------------------------------ overlays
_ovc = {}


def ov_rgba(o, lt):
    if o['dyn'] or id(o) not in _ovc:
        r = o['make'](lt)
        img, pad = (r if isinstance(r, tuple) else (r, 0))
        a = np.asarray(img).astype(np.float32) / 255.0
        val = (a[..., :3] * 255.0, a[..., 3:4], pad)
        if o['dyn']:
            return val
        _ovc[id(o)] = val
    return _ovc[id(o)]


def place(o, w, h, pad):
    p = o['pos']
    ww, hh = w - 2 * pad, h - 2 * pad
    if p[0] == 'abs':
        return p[1], p[2]
    if p[0] == 'l':
        return 110 - pad, int(p[1] - hh / 2) - pad
    if p[0] == 'lb':
        return 110 - pad, p[1] - hh - pad
    if p[0] == 'tl':
        return p[1] - pad, p[2] - pad
    if p[0] == 'c':
        return int((W - ww) / 2) - pad, int((H - hh) / 2) - pad
    if p[0] == 'br':
        return p[1] - ww - pad, p[2] - hh - pad
    if p[0] == 'bl':
        return p[1] - pad, p[2] - hh - pad
    raise ValueError(p)


def blend(frame, rgb, a, x, y, alpha):
    h, w = a.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0 or alpha <= 0.003:
        return
    sa = a[y0 - y:y1 - y, x0 - x:x1 - x] * alpha
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - sa) + rgb[y0 - y:y1 - y, x0 - x:x1 - x] * sa


def draw_overlay(frame, o, t):
    lt = t - o['t0']
    rgb, a, pad = ov_rgba(o, lt)
    h, w = a.shape[:2]
    x, y = place(o, w, h, pad)
    fin, fout = o['fin'], o['fout']
    ain = 1.0 if fin <= 0 else ease(lt / fin)
    aout = 1.0 if fout <= 0 else ease((o['t1'] - t) / fout)
    alpha = min(ain, aout)
    an = o['anim']
    if an == 'rise':
        y += int(round(26 * (1 - ain)))
    elif an == 'slide':
        x += int(round(80 * (1 - ain)))
    elif an == 'stamp':
        q = min(1.0, lt / 0.16)
        if q < 1:
            s = 1.35 - 0.35 * (1 - (1 - q) ** 2)
            rgb = cv2.resize(rgb, None, fx=s, fy=s, interpolation=cv2.INTER_LINEAR)
            a = cv2.resize(a[..., 0], None, fx=s, fy=s, interpolation=cv2.INTER_LINEAR)[..., None]
            x, y = int(x - (a.shape[1] - w) / 2), int(y - (a.shape[0] - h) / 2)
        alpha = min(aout, min(1.0, lt / 0.06))
    blend(frame, rgb, a, x, y, alpha)


def frame_at(t):
    i = max(j for j, s in enumerate(SC.SHOTS) if s['t0'] <= t + 1e-9) if t >= SC.SHOTS[0]['t0'] else 0
    s = SC.SHOTS[i]
    out = base(s, t)
    xf = s.get('xf', 0)
    if i > 0 and xf > 0 and t < s['t0'] + xf:
        k = ease((t - s['t0']) / xf)
        out = base(SC.SHOTS[i - 1], t) * (1 - k) + out * k
    for o in SC.OVR:
        if o['t0'] <= t < o['t1']:
            draw_overlay(out, o, t)
    if t < 0.6:                       # fade up from black at the very top
        out *= ease(t / 0.6)
    if t > SC.DUR - 1.2:              # fade to black at the end
        out *= ease((SC.DUR - t) / 1.2)
    return np.clip(out, 0, 255).astype(np.uint8)


def frames(first, last, out):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    import time
    t0 = time.time()
    for f in range(first, last):
        p.stdin.write(frame_at(f * SPEED / FPS).tobytes())
        if (f - first) % 500 == 0:
            print(f'[{first}-{last}] frame {f} ({(f - first) / max(1e-6, time.time() - t0):.1f} fps)', flush=True)
    p.stdin.close()
    p.wait()


if __name__ == '__main__':
    if sys.argv[1] == 'frames':
        frames(int(sys.argv[2]), min(NF, int(sys.argv[3])), sys.argv[4])
    elif sys.argv[1] == 'stills':
        os.makedirs(sys.argv[2], exist_ok=True)
        for tt in sys.argv[3:]:
            Image.fromarray(frame_at(float(tt))).save(os.path.join(sys.argv[2], f'{float(tt):07.2f}.png'))
    elif sys.argv[1] == 'nf':
        print(NF)
