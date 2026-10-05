"""Render lf04 picture at 1x: one H.264 intermediate per shot, then a stream-copy concat.

usage:
  python3 render.py preview T [T ...]      # composite stills at absolute 1x times -> build/preview/
  python3 render.py shots [--jobs N] [--only a-b]
  python3 render.py concat
"""
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image

import design as D
import media as M
from design import EP, FPS, H, W

BUILD = os.path.join(EP, "build")
SHOTS = os.path.join(BUILD, "shots")
_CUT = None
_BASES = {}


def cut():
    global _CUT
    if _CUT is None:
        import cut as C
        _CUT = C.build()
    return _CUT


def base_layer(treat):
    """Vignette on every shot; plus an ink scrim on 'dark'/'blur' shots so cards read."""
    if treat not in _BASES:
        v = D.vignette(0, 1).make(1)
        if treat in ("dark", "blur"):
            s = Image.new("RGBA", (W, H), D.INK + (128 if treat == "dark" else 120,))
            s.alpha_composite(v)
            v = s
        _BASES[treat] = v
    return _BASES[treat]


def shot_elements(sh):
    t0, t1 = sh["t0"], sh["t1"]
    return [e for e in cut().els if e.t1 > t0 and e.t0 < t1]


def overlay_frame(els, T, treat):
    base = base_layer(treat).copy()
    return D.compose(els, T, base=base)


def src_duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                          "csv=p=0", path]).decode())


def bg_maker(sh):
    k = sh["kind"]
    if k == "i":
        kb = M.KB(sh["src"], sh["kb"], box=sh.get("box"), treat="blur" if sh.get("treat") == "blur" else None)
        return lambda p: kb.frame(p)
    if k == "p":
        bgname = {"IMG-04": "IMG-06", "IMG-05": "IMG-10"}.get(sh["src"])
        pt = M.Portrait(sh["src"], bg=bgname)
        return lambda p: pt.frame(p)
    if k == "c":
        ch = M.Chart(sh.get("src"))
        return lambda p: ch.frame(p)
    return None


def video_filter(sh, nf):
    path = M.src_path(sh["src"])
    dur = src_duration(path)
    ss = sh.get("ss", 0.0)
    need = nf / FPS + 0.15
    if ss + need > dur:
        ss = max(0.0, dur - need)
    avail = dur - ss
    k = need / avail if avail < need else 1.0
    chain = []
    if k > 1.0:
        chain.append(f"setpts=(PTS-STARTPTS)*{k:.4f}")
    chain.append(f"fps={FPS}")
    if "crop_y" in sh:
        chain.append("scale=1920:-2:flags=lanczos")
        chain.append(f"crop=1920:1080:0:(ih-1080)*{sh['crop_y']}")
    else:
        chain.append("scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos")
        chain.append("crop=1920:1080")
    if sh.get("treat") == "blur":
        chain.append("gblur=sigma=14")
    chain.append("setsar=1")
    return path, ss, ",".join(chain), k


ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS), "-g", "60",
       "-threads", "2", "-an"]


def render_shot(i):
    sh = cut().shots[i]
    out = os.path.join(SHOTS, f"{i:03d}.mp4")
    nf = sh["nf"]
    els = shot_elements(sh)
    treat = sh.get("treat")
    if sh["kind"] == "v":
        path, ss, chain, _ = video_filter(sh, nf)
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{ss:.3f}", "-i", path,
               "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "pipe:0",
               "-filter_complex", f"[0:v]{chain}[bg];[bg][1:v]overlay=0:0:format=auto,format=yuv420p[v]",
               "-map", "[v]", "-frames:v", str(nf)] + ENC + [out]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        last_sig, last = None, None
        for f in range(nf):
            T = (sh["f0"] + f) / FPS
            sig = []
            dynamic = False
            for e in els:
                if e.active(T):
                    a, dx, dy = e.state(T)
                    building = bool(e.make is None or (e.build and T - e.t0 < e.build))
                    sig.append((id(e), round(a, 3), round(dx, 1), round(dy, 1), building))
                    if building:
                        dynamic = True
            sig = tuple(sig)
            if dynamic or sig != last_sig:
                last = overlay_frame(els, T, treat).tobytes()
                last_sig = sig
            try:
                p.stdin.write(last)
            except BrokenPipeError:
                break
        p.stdin.close()
        rc = p.wait()
    else:
        mk = bg_maker(sh)
        cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
               "-framerate", str(FPS), "-i", "pipe:0", "-frames:v", str(nf)] + ENC + [out]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for f in range(nf):
            T = (sh["f0"] + f) / FPS
            bg = mk(f / max(1, nf - 1)).convert("RGBA")
            ov = overlay_frame(els, T, treat)
            bg.alpha_composite(ov)
            p.stdin.write(bg.convert("RGB").tobytes())
        p.stdin.close()
        rc = p.wait()
    if rc != 0:
        raise RuntimeError(f"shot {i} failed")
    return i


def preview(times):
    os.makedirs(os.path.join(BUILD, "preview"), exist_ok=True)
    c = cut()
    for T in times:
        f = int(round(T * FPS))
        sh = next(s for s in c.shots if s["f0"] <= f < s["f0"] + s["nf"])
        p = (f - sh["f0"]) / max(1, sh["nf"] - 1)
        if sh["kind"] == "v":
            path, ss, chain, k = video_filter(sh, sh["nf"])
            st = ss + (f - sh["f0"]) / FPS / k
            raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", f"{st:.3f}", "-i", path, "-frames:v", "1",
                                           "-vf", chain.replace(f"fps={FPS},", ""), "-f", "rawvideo", "-pix_fmt",
                                           "rgb24", "-"])
            bg = Image.frombytes("RGB", (W, H), raw[:W * H * 3])
        else:
            bg = bg_maker(sh)(p)
        bg = bg.convert("RGBA")
        bg.alpha_composite(overlay_frame(shot_elements(sh), T, sh.get("treat")))
        out = os.path.join(BUILD, "preview", f"{sh['block']}_{T:07.2f}.jpg")
        bg.convert("RGB").save(out, quality=88)
        print(out)


def main():
    a = sys.argv[1:]
    if a[0] == "preview":
        preview([float(x) for x in a[1:]])
    elif a[0] == "shots":
        os.makedirs(SHOTS, exist_ok=True)
        jobs = int(a[a.index("--jobs") + 1]) if "--jobs" in a else 3
        n = len(cut().shots)
        idx = list(range(n))
        if "--only" in a:
            lo, hi = a[a.index("--only") + 1].split("-")
            idx = list(range(int(lo), int(hi) + 1))
        if "--missing" in a:
            idx = [i for i in idx if not os.path.exists(os.path.join(SHOTS, f"{i:03d}.mp4"))]
        with Pool(jobs) as pool:
            for i in pool.imap_unordered(render_shot, idx):
                print("done", i, flush=True)
    elif a[0] == "concat":
        n = len(cut().shots)
        lst = os.path.join(BUILD, "shots.txt")
        with open(lst, "w") as fh:
            for i in range(n):
                fh.write(f"file '{os.path.join(SHOTS, f'{i:03d}.mp4')}'\n")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
                        os.path.join(BUILD, "cut1x.mp4")], check=True)
        print("frames expected", sum(s["nf"] for s in cut().shots))


if __name__ == "__main__":
    main()
