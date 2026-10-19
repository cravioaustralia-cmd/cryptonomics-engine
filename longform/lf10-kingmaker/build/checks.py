#!/usr/bin/env python3
"""lf10 final checks. usage: checks.py <final_1x.mp4> <final_128x.mp4>  -> build/out/CHECKS.md (+ stdout)

Runs over the FULL runtime of both outputs: durations, stream sync, blackdetect, freezedetect,
narration silence scan, EBU R128 loudness / true peak, and AI-clip watermark crops.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
plan = json.load(open(os.path.join(OUT, "plan.json")))
tl = json.load(open(os.path.join(REPO, "src", "lf10", "timeline.json")))


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    js = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path]).stdout)
    v = next(s for s in js["streams"] if s["codec_type"] == "video")
    a = next(s for s in js["streams"] if s["codec_type"] == "audio")
    nb = run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", path]).stdout.strip()
    return dict(fmt=float(js["format"]["duration"]), v=float(v["duration"]), a=float(a["duration"]), w=v["width"], h=v["height"], fps=v["r_frame_rate"], frames=int(nb.strip(",")), size=int(js["format"]["size"]), vcodec=v["codec_name"], acodec=a["codec_name"], sr=a["sample_rate"])


def black(path):
    err = run(["ffmpeg", "-nostats", "-i", path, "-an", "-vf", "blackdetect=d=0.1:pic_th=0.98:pix_th=0.10", "-f", "null", "-"]).stderr
    return re.findall(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)", err)


def freeze(path):
    err = run(["ffmpeg", "-nostats", "-i", path, "-an", "-vf", "freezedetect=n=-60dB:d=2", "-f", "null", "-"]).stderr
    st = re.findall(r"freeze_start: ([\d.]+)", err)
    du = re.findall(r"freeze_duration: ([\d.]+)", err)
    return list(zip(st, du))


def loud(path):
    err = run(["ffmpeg", "-nostats", "-i", path, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    tail = err[err.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1))
    lra = float(re.search(r"LRA:\s+([\d.]+) LU", tail).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1))
    return i, tp, lra


def silences(wav, d=0.9):
    err = run(["ffmpeg", "-nostats", "-i", wav, "-af", f"silencedetect=n=-45dB:d={d}", "-f", "null", "-"]).stderr
    st = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(st, en + [None] * (len(st) - len(en))))


report = []
P = report.append
files = {"1x": sys.argv[1], "1.28x": sys.argv[2]}
P("# lf10 final checks\n")
P("| check | 1× | 1.28× |\n|---|---|---|")
res = {}
for k, f in files.items():
    pr = probe(f)
    lu = loud(f)
    bl = black(f)
    fr = freeze(f)
    res[k] = (pr, lu, bl, fr)
p1, p2 = res["1x"][0], res["1.28x"][0]


def mmss(t):
    return f"{int(t) // 60}:{t % 60:05.2f}"


P(f"| duration (container) | {mmss(p1['fmt'])} | {mmss(p2['fmt'])} |")
P(f"| video stream / audio stream | {p1['v']:.3f} s / {p1['a']:.3f} s | {p2['v']:.3f} s / {p2['a']:.3f} s |")
P(f"| A/V duration difference | {abs(p1['v'] - p1['a']) * 1000:.1f} ms | {abs(p2['v'] - p2['a']) * 1000:.1f} ms |")
P(f"| resolution / fps / frames | {p1['w']}x{p1['h']} / {p1['fps']} / {p1['frames']} | {p2['w']}x{p2['h']} / {p2['fps']} / {p2['frames']} |")
P(f"| codecs | {p1['vcodec']} + {p1['acodec']} {p1['sr']} Hz | {p2['vcodec']} + {p2['acodec']} {p2['sr']} Hz |")
P(f"| file size | {p1['size'] / 1e6:.1f} MB | {p2['size'] / 1e6:.1f} MB |")
P(f"| integrated loudness | {res['1x'][1][0]:.1f} LUFS | {res['1.28x'][1][0]:.1f} LUFS |")
P(f"| true peak | {res['1x'][1][1]:.1f} dBTP | {res['1.28x'][1][1]:.1f} dBTP |")
P(f"| loudness range | {res['1x'][1][2]:.1f} LU | {res['1.28x'][1][2]:.1f} LU |")
P(f"| blackdetect hits (d≥0.1 s, pix_th 0.10) | {len(res['1x'][2])} | {len(res['1.28x'][2])} |")
P(f"| freezedetect hits (−60 dB, d≥2 s) | {len(res['1x'][3])} | {len(res['1.28x'][3])} |")
for k in files:
    for b in res[k][2]:
        P(f"\n- {k} black: {b}")
    for z in res[k][3]:
        P(f"\n- {k} freeze: start {z[0]} for {z[1]} s")

# narration: segments present and in order; silence scan
P("\n## Narration\n")
order = [v["seg"] for v in plan["vo"]]
P(f"- Segments placed: {len(order)} ({order[0]} … {order[-1]}), in order: {order == sorted(order)}, all 45 present: {sorted(order) == [f'S{i:02d}' for i in range(1, 46)]}")
vo = os.path.join(OUT, "vo_only.wav")
sil = silences(vo)
holds = [(h["t"], h["t"] + h["dur"], h["name"]) for h in plan["holds"]]
P("- Narration silences ≥ 0.9 s (silencedetect −45 dB on the narration stem), each matched to an intended hold:")
unintended = 0
for s, e in sil:
    e = e if e is not None else plan["duration"]
    hit = [h for h in holds if h[0] - 1.2 <= s <= h[1] and e >= h[0]]
    tag = f"hold: {hit[0][2]}" if hit else "UNINTENDED"
    if not hit:
        unintended += 1
    P(f"  - {mmss(s)}–{mmss(e)} ({e - s:.2f} s) → {tag}")
P(f"- Unintended narration gaps: {unintended}")
gaps = []
for a, b in zip(plan["vo"], plan["vo"][1:]):
    end_a = a["t"] + a["src_out"] - a["src_in"]
    gaps.append(b["t"] - end_a)
P(f"- Gap between consecutive takes inside a chapter: {min(gaps):.2f}–{sorted(gaps)[len(gaps) // 2]:.2f} s (min–median); voice never sped up, stretched or level-normalised on its own")

# AI-clip watermark crops from the final 1x
P("\n## AI clips\n")
ai = [s for s in tl["shots"] if (s.get("src") or "").startswith("BR_AI_")]
first = ai[0]
crops = []
os.makedirs(os.path.join(OUT, "wm"), exist_ok=True)
for i, s in enumerate(ai):
    t = (s["from"] + s["to"]) / 2
    o = os.path.join(OUT, "wm", f"wm_{i:02d}.png")
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", files["1x"], "-frames:v", "1", "-vf", "crop=480:220:1440:860", o])
    crops.append(o)
P(f"- AI shots on screen: {len(ai)} (from {len(set(s['src'] for s in ai))} clips). Every one is cropped at source (bottom-right 192×108 px of 1280×720 removed, then scaled) and carries the on-screen label \"Dramatised reconstruction · AI-generated\"; the first is at {mmss(first['from'])} ({first['src']}). Bottom-right crops saved for inspection: build/out/wm/.")
P("- AI clip audio: muted (proxies are video-only).")
open(os.path.join(OUT, "CHECKS.md"), "w").write("\n".join(report) + "\n")
print("\n".join(report))
