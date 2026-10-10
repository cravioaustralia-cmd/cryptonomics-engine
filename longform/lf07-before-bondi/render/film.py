#!/usr/bin/env python3
"""film.py - render 'Before Bondi' picture with skia.

  python3 render/film.py still T [T ...]             -> build/stills/t_<T>.png
  python3 render/film.py chunk F0 F1 OUT.mp4         -> frames [F0, F1) as an intermediate H.264 file
  python3 render/film.py range T0 T1 OUT.mp4 [-j 4]  -> parallel chunks for [T0, T1) seconds, concatenated
  python3 render/film.py events                      -> dump the event registry to render/events.json
"""
import json, os, subprocess, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import skia
from lib.core import *
from lib import events as EV
from lib.comps import corner_tag, source_tag, ai_label, caption, ticker
from lib.media import close_readers
import timeline as TL

BUILD = EP / "build"
T = TL.load()
from lib.scene import SCENES, Scene


def load_scenes():
    import scenes  # noqa: registers via scene()
    objs = {}
    for s in T.segs:
        cls = SCENES.get(s.sid, Scene)
        objs[s.sid] = cls(s)
    EV.reset()
    for o in objs.values():
        o.plan()
    return objs


OBJ = None


def ensure():
    global OBJ
    if OBJ is None:
        OBJ = load_scenes()
    return OBJ

# ------------------------------------------------------------------ overlays
def _fa(t, t0, t1, d=0.3):
    return eo(t, t0, d) * (1 - smooth(t, t1 - d, t1))


def ticker_state(t):
    ticks = [e for e in EV.EVENTS if e.kind == "tick" and e.t <= t + 1e-6]
    if not ticks:
        return None
    cur = ticks[-1]
    prev = ticks[-2].text if len(ticks) > 1 else ""
    k = lin(t, cur.t, cur.t + cur.extra.get("flip", 0.45))
    pulse = 0.0
    if cur.extra.get("pulse"):
        dt = t - cur.t
        pulse = max(0.0, 0.5 + 0.5 * math.cos(dt * math.pi * 1.1)) * (0.6 if dt > 1.5 else 1.0)
    for e in ticks[::-1]:
        if e.extra.get("pulse_once") and t - e.t < 1.4:
            pulse = max(pulse, 1 - (t - e.t) / 1.4)
            break
    return cur.text, prev, k, pulse


def ticker_alpha(t):
    a = 0.0
    for e in EV.EVENTS:
        if e.kind == "tag" and e.name == "ticker" and e.t - 0.3 <= t <= e.t1 + 0.3:
            a = max(a, _fa(t, e.t, e.t1, 0.3))
    return a


def overlays(c, t, fi):
    ta = ticker_alpha(t)
    st = ticker_state(t)
    if st and ta > 0:
        ticker(c, st[0], st[1], st[2], ta, st[3], fi)
    src_y = H - 52
    lab = []
    caps = []
    for e in EV.EVENTS:
        if e.kind != "tag" or not (e.t - 0.35 <= t <= e.t1 + 0.35):
            continue
        a = _fa(t, e.t, e.t1, e.extra.get("fade", 0.3))
        if a <= 0:
            continue
        if e.name == "corner":
            corner_tag(c, e.text, a)
        elif e.name == "ai":
            ai_label(c, a)
        elif e.name in ("source", "label"):
            lab.append((e, a))
        elif e.name == "caption":
            caps.append((e, a))
    ai_on = any(x.kind == "tag" and x.name == "ai" and x.t <= t <= x.t1 for x in EV.EVENTS)
    yb = (900 if ta >= 0.05 else 1010) - (44 if ai_on and ta < 0.05 else 0)
    for e, a in sorted(caps, key=lambda x: -x[0].t):
        caption(c, e.text, yb, a)
        yb -= 52 * a
    from scenes.common import extra_overlays
    extra_overlays(c, t, fi)
    for e, a in sorted(lab, key=lambda x: (x[0].name != "source", x[0].t)):
        h = source_tag(c, e.text.split("\n"), src_y, a, e.name)
        src_y -= (h + 10) * a


def frame(c, fi):
    objs = ensure()
    t = fi / FPS
    seg = T.at(t)
    o = objs[seg.sid]
    c.clear(rgb("#000000"))
    i = T.segs.index(seg)
    if o.xin > 0 and i > 0 and t < seg.start + o.xin:
        objs[T.segs[i - 1].sid].draw(c, t, fi)
        layer(c, smooth(t, seg.start, seg.start + o.xin))
        o.draw(c, t, fi)
        c.restore()
    else:
        o.draw(c, t, fi)
    overlays(c, t, fi)
    for z in silences():
        if z[0] <= t < z[1] and z[2]:
            rect(c, 0, 0, W, H, "#000000")


def silences():
    out = []
    for s in T.segs:
        if hasattr(s, "silence") and s.silence and s.sid == "S35":
            out.append((s.silence[0] + 0.0, s.silence[1], True))   # black during the S35 silence
    return out


def render_frames(f0, f1, out):
    BUILD.mkdir(exist_ok=True)
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "fast", "-crf", "12",
                            "-pix_fmt", "yuv420p", "-g", "60", str(out)], stdin=subprocess.PIPE)
    t0 = time.time()
    for fi in range(f0, f1):
        frame(c, fi)
        img = surf.makeImageSnapshot()
        enc.stdin.write(img.tobytes())
        if (fi - f0) % 300 == 0:
            print(f"[{out.name}] frame {fi} ({fi - f0}/{f1 - f0}) {time.time() - t0:.0f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    close_readers()


def still(ts):
    d = BUILD / "stills"
    d.mkdir(parents=True, exist_ok=True)
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    for t in ts:
        fi = int(round(float(t) * FPS))
        frame(c, fi)
        p = d / f"t_{float(t):07.2f}.png"
        surf.makeImageSnapshot().save(str(p), skia.kPNG)
        print(p)


def run_range(t0, t1, out, jobs=4):
    f0, f1 = int(round(t0 * FPS)), int(round(t1 * FPS))
    n = f1 - f0
    parts, procs = [], []
    tmp = BUILD / "parts"
    tmp.mkdir(parents=True, exist_ok=True)
    for j in range(jobs):
        a = f0 + n * j // jobs
        b = f0 + n * (j + 1) // jobs
        p = tmp / f"{Path(out).stem}_{j}.mp4"
        parts.append(p)
        procs.append(subprocess.Popen([sys.executable, __file__, "chunk", str(a), str(b), str(p)]))
    for p in procs:
        p.wait()
        if p.returncode:
            raise SystemExit("chunk failed")
    lst = tmp / f"{Path(out).stem}.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)],
                   check=True)
    for p in parts:
        p.unlink()


def dump_events():
    ensure()
    out = []
    for e in EV.EVENTS:
        d = dict(kind=e.kind, sid=e.sid, t=round(e.t, 3), name=e.name, trig=e.trig, file=e.file, gain=e.gain,
                 text=e.text, t1=round(e.t1, 3), extra={k: v for k, v in e.extra.items() if isinstance(v, (int, float, str, bool))})
        out.append(d)
    (EP / "render/events.json").write_text(json.dumps(out, indent=1))
    print(len(out), "events")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "still":
        still(sys.argv[2:])
    elif cmd == "chunk":
        render_frames(int(sys.argv[2]), int(sys.argv[3]), Path(sys.argv[4]))
    elif cmd == "range":
        j = int(sys.argv[sys.argv.index("-j") + 1]) if "-j" in sys.argv else 4
        run_range(float(sys.argv[2]), float(sys.argv[3]), Path(sys.argv[4]), j)
    elif cmd == "events":
        dump_events()
