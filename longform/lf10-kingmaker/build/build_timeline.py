#!/usr/bin/env python3
"""lf10 timeline builder.

Places the 45 raw Atlas takes (trimmed only at head/tail, never sped up or stretched),
resolves word anchors from the Whisper word timestamps, and writes:
  - src/lf10/timeline.json   (shots, overlays, explain intervals for Remotion)
  - build/out/plan.json      (VO placement, music, SFX, chapters for the audio mix)
"""
import json, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(EP))
ASR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out", "asr")
sys.path.insert(0, HERE)
from credits import CRED, HONEST, AI_LABEL  # noqa: E402

# soften clips whose own printed text would otherwise be readable (no readable unrelated text, no party logos)
SOFT = {"BR_STOCK_newspaper_flipping_pov": 4.0, "BR_STOCK_newspaper_press_running": 2.5, "BR_STOCK_book_pages_turning": 3.5,
        "IMG_senate_ballot_vic_folded": 2.5, "BR_STOCK_cricket_ground_waca": 1.5, "BR_STOCK_sydney_aerial_skyscrapers": 1.2}
# reframe clips to keep burned-in timestamps / billboards out of frame
VFRAME = {"BR_STOCK_crowd_street_crossing": ([0.5, 0.88], [1.3, 1.34]), "BR_STOCK_gas_flare": ([0.5, 0.3], [1.18, 1.22]),
          "BR_STOCK_cricket_ground_waca": ([0.5, 0.1], [1.6, 1.64])}
GAP = 0.45  # silence added between takes (each take keeps ~0.1 s of its own tail)
LEAD = 0.12  # cuts land this far before the anchor word


# ---------------------------------------------------------------- VO analysis
def load_pcm(path, sr=16000):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.int16).astype(np.float32) / 32768.0


def speech_bounds(path):
    x = load_pcm(path)
    sr = 16000
    hop = 160
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    on = np.where(db > -42)[0]
    first, last = on[0] * hop / sr, (on[-1] + 1) * hop / sr
    # silent stretches (>= 0.15 s below -40 dB), in source seconds
    quiet = db < -40
    sil, k = [], 0
    while k < n:
        if quiet[k]:
            j = k
            while j < n and quiet[j]:
                j += 1
            if (j - k) * hop / sr >= 0.15:
                sil.append((k * hop / sr, j * hop / sr))
            k = j
        else:
            k += 1
    return first, last, len(x) / sr, sil


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


SEGS = {}
for i in range(1, 46):
    sid = f"S{i:02d}"
    path = os.path.join(EP, "audio", "vo-raw", f"{sid}.mp3")
    first, last, dur, sil = speech_bounds(path)
    src_in = max(0.0, first - 0.06)
    src_out = min(dur, last + 0.10)
    words = json.load(open(os.path.join(ASR, f"{sid}.json")))["words"]
    SEGS[sid] = dict(path=path, src_in=src_in, src_out=src_out, words=words, sil=sil)


# ---------------------------------------------------------------- DSL
class Seg:
    def __init__(self, sid):
        self.sid = sid
        self.shots = []
        self.ovs = []


PROGRAM = []  # ("hold", dur, shots, ovs, music) | ("seg", Seg)


def anchor(sid, a, start):
    """Resolve 'word', 'word#2', 'word+0.4', 'start', 'end', or a float offset (s from VO start)."""
    s = SEGS[sid]
    if isinstance(a, (int, float)):
        return start + a
    off = 0.0
    m = re.match(r"^(.*?)([+-]\d+(\.\d+)?)$", a)
    if m and m.group(1):
        a, off = m.group(1), float(m.group(2))
    if a == "start":
        return start + off
    if a == "end":
        return start + (s["src_out"] - s["src_in"]) + off
    want, nth = (a.split("#") + ["1"])[:2]
    nth = int(nth)
    k = 0
    for idx, w in enumerate(s["words"]):
        if norm(w["w"]) == norm(want):
            k += 1
            if k == nth:
                return start + (w["s"] - s["src_in"]) + off
    raise KeyError(f"{sid}: anchor '{a}' not found in: {' '.join(norm(w['w']) for w in s['words'])}")


def gap_before(sid, a, start):
    """Time in the pause before the anchor word (for cuts that carry a hit/SFX)."""
    s = SEGS[sid]
    want, nth = (a.split("#") + ["1"])[:2]
    nth = int(nth)
    k = 0
    for idx, w in enumerate(s["words"]):
        if norm(w["w"]) == norm(want):
            k += 1
            if k == nth:
                # the real pause before this word: the silent stretch whose end is nearest the word onset
                cands = [x for x in s["sil"] if w["s"] - 0.5 <= x[1] <= w["s"] + 0.7]
                if not cands:
                    raise KeyError(f"{sid}: no pause before '{a}' for a hit")
                ss_, se_ = max(cands, key=lambda x: x[1] - x[0])
                g = max(ss_ + 0.06, se_ - 0.30)
                return start + (g - s["src_in"])
    raise KeyError(a)


def mk_shot(kind, src, at, **kw):
    return dict(kind=kind, src=src, at=at, **kw)


def P(src, at=None, **kw):
    return mk_shot("photo", src, at, **kw)


def V(src, at=None, ss=0.0, **kw):
    return mk_shot("video", src, at, ss=ss, **kw)


def D(src, at=None, **kw):
    return mk_shot("doc", src, at, **kw)


def K(name, at=None, role=None, note=None, **kw):
    return mk_shot("card", None, at, card=dict(name=name, role=role, note=note), **kw)


def O(type_, frm, to, explain=False, **props):
    return dict(type=type_, frm=frm, to=to, explain=explain, props=props)


def seg(sid, shots, ovs=()):
    sg = Seg(sid)
    sg.shots = shots
    sg.ovs = list(ovs)
    PROGRAM.append(("seg", sg))


def hold(dur, shots, ovs=(), name=None, music=None, chapter=None):
    PROGRAM.append(("hold", dict(dur=dur, shots=shots, ovs=list(ovs), name=name, music=music, chapter=chapter)))


# ================================================================ SPEC
from spec import build_spec  # noqa: E402

build_spec(globals())

# ================================================================ RESOLVE
t = 0.0
shots_out, ovs_out, explain = [], [], []
vo_place, sfx, chapters, music_marks, holds = [], [], [], [], []
pending = []  # shots of current block awaiting their 'to'


def resolve_props(v, sid, start):
    if isinstance(v, str) and v.startswith("@"):
        return round(anchor(sid, v[1:], start), 3)
    if isinstance(v, dict):
        return {k: resolve_props(x, sid, start) for k, x in v.items()}
    if isinstance(v, list):
        return [resolve_props(x, sid, start) for x in v]
    return v


def time_of(a, sid, start, block_start, block_end):
    if a is None:
        return block_start
    if sid is None:
        return block_start + float(a) if isinstance(a, (int, float)) else block_end + float(a[3:]) if str(a).startswith("end") else block_start
    return anchor(sid, a, start)


def push_shots(shot_specs, sid, start, block_start, block_end):
    for sh in shot_specs:
        sh = dict(sh)
        at = sh.pop("at")
        sfx_name = sh.pop("sfx", None)
        sfx_gain = sh.pop("sfx_gain", 1.0)
        if at is None:
            tt = block_start
        elif sid is None:
            tt = block_start + float(at)
        elif str(at).startswith(("start", "end")):
            tt = anchor(sid, at, start)
        elif sh.pop("in_gap", False) or sfx_name:
            tt = gap_before(sid, at, start)
        else:
            tt = anchor(sid, at, start) - LEAD
        tt = max(block_start - GAP, tt)
        if sfx_name:
            sfx.append(dict(name=sfx_name, t=round(tt, 3), gain=sfx_gain))
        # label times
        if "label" in sh and sh["label"] is not None:
            lb = dict(sh["label"])
            for k in ("at", "to"):
                if k in lb and lb[k] is not None:
                    lb[k] = round(anchor(sid, lb[k], start) - 0.1, 3) if sid else round(block_start + lb[k], 3)
            sh["label"] = lb
        src = sh.get("src")
        if src in SOFT and "soft" not in sh:
            sh["soft"] = SOFT[src]
        if src in VFRAME and "focus" not in sh:
            sh["focus"], sh["zoom"] = VFRAME[src]
        if src and "credit" not in sh and src in CRED:
            sh["credit"] = CRED[src]
        if src and "honest" not in sh:
            if src.startswith("BR_AI_"):
                sh["honest"] = AI_LABEL
                sh["credit"] = "AI-generated (Grok Imagine) · dramatised"
            elif src in HONEST:
                sh["honest"] = HONEST[src]
        if sh["kind"] == "photo" or sh["kind"] == "doc":
            sh["src"] = src + (".png" if os.path.exists(os.path.join(REPO, "public/lf10/img", src + ".png")) else ".jpg")
            if sh.get("tall"):
                sh["src"] = src + "_tall.png"
                sh.pop("tall")
        sh["from"] = round(tt, 3)
        shots_out.append(sh)


def push_ovs(ov_specs, sid, start, block_start, block_end):
    for o in ov_specs:
        frm = block_start if o["frm"] is None else (block_start + o["frm"] if sid is None else anchor(sid, o["frm"], start) - 0.08)
        if o["to"] is None:
            to = block_end
        elif sid is None:
            to = block_start + o["to"] if o["to"] >= 0 else block_end + o["to"]
        else:
            to = anchor(sid, o["to"], start)
        props = resolve_props(o["props"], sid, start) if sid else o["props"]
        frm, to = round(frm, 3), round(to, 3)
        ovs_out.append(dict(type=o["type"], **{"from": frm, "to": to}, props=props))
        if o["explain"]:
            explain.append([frm, to])


for kind, item in PROGRAM:
    if kind == "hold":
        start = t
        end = t + item["dur"]
        push_shots(item["shots"], None, start, start, end)
        push_ovs(item["ovs"], None, start, start, end)
        if item.get("music"):
            music_marks.append(dict(t=round(start, 3), track=item["music"]))
        holds.append(dict(name=item.get("name") or item.get("chapter"), t=round(start, 3), dur=item["dur"]))
        if item.get("chapter"):
            chapters.append(dict(t=round(start, 3), title=item["chapter"]))
        t = end
    else:
        sg = item
        s = SEGS[sg.sid]
        start = t
        vlen = s["src_out"] - s["src_in"]
        vo_place.append(dict(seg=sg.sid, path=s["path"], src_in=round(s["src_in"], 3), src_out=round(s["src_out"], 3), t=round(start, 3)))
        end = start + vlen + GAP
        push_shots(sg.shots, sg.sid, start, start, end)
        # overlay 'end' refers to VO end + gap
        for o in sg.ovs:
            if o["to"] == "END":
                o["to"] = None
        push_ovs(sg.ovs, sg.sid, start, start, end)
        t = end

TOTAL = round(t + 0.0, 3)

# shots: sort, assign 'to' = next shot from (+ dissolve overlap), ids
shots_out.sort(key=lambda s: s["from"])
for i, sh in enumerate(shots_out):
    nxt = shots_out[i + 1]["from"] if i + 1 < len(shots_out) else TOTAL
    fade_next = shots_out[i + 1].get("fadeIn", 0) if i + 1 < len(shots_out) else 0
    sh["to"] = round(nxt + fade_next, 3)
    sh["id"] = f"sh{i:03d}_{sh.get('src') or 'card'}"

ovs_out.sort(key=lambda o: o["from"])

timeline = dict(duration=TOTAL, shots=shots_out, overlays=ovs_out, explain=explain)
json.dump(timeline, open(os.path.join(REPO, "src/lf10/timeline.json"), "w"), indent=1)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
plan = dict(duration=TOTAL, vo=vo_place, sfx=sfx, chapters=chapters, music=music_marks, holds=holds, title_t=next(h['t'] for h in holds if h['name'] == 'title'))
json.dump(plan, open(os.path.join(HERE, "out", "plan.json"), "w"), indent=1)

# ---------------------------------------------------------------- validation
problems = []
for i, sh in enumerate(shots_out):
    d = sh["to"] - sh["from"]
    if d > 6.05:
        problems.append(f"LONG {d:.2f}s {sh['id']} @ {sh['from']:.2f}")
    if d < 0.6:
        problems.append(f"SHORT {d:.2f}s {sh['id']} @ {sh['from']:.2f}")
    if i > 0 and shots_out[i - 1].get("src") == sh.get("src") and sh.get("src"):
        run = shots_out[i - 1]["to"] - shots_out[i - 1]["from"] + d
        if run > 6.05:
            problems.append(f"SAME-ASSET RUN {run:.2f}s {sh['src']} @ {sh['from']:.2f}")
    if sh["kind"] == "video":
        vd = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(REPO, "public/lf10/v", sh["src"] + ".mp4")], capture_output=True, text=True).stdout)
        need = sh.get("ss", 0) + d * sh.get("rate", 1)
        if need > vd - 0.05:
            problems.append(f"VIDEO-SHORT {sh['src']} needs {need:.2f}s of {vd:.2f}s @ {sh['from']:.2f}")
print(f"duration {TOTAL:.2f}s  shots {len(shots_out)}  overlays {len(ovs_out)}  explain {len(explain)}  sfx {len(sfx)}")
for p in problems:
    print(p)
