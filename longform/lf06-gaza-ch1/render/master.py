#!/usr/bin/env python3
"""Master and deliver.

1x review cut  : final/lf06-gaza-ch1-1x.mp4  (static gain to about -14 LUFS-I + peak limiter; no loudnorm)
1.28x master   : final/lf06-gaza-ch1.mp4     (whole chapter through rubberband, pitch held, then
                 two-pass loudnorm I=-14, TP=-1.5, linear) -- the house delivery
Both: H.264 1920x1080 30 fps, AAC 48 kHz stereo, each under 95 MB (2-pass x264 at a computed bitrate).
Writes final/loudnorm-report.md.
"""
import json, os, subprocess, re

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
B = os.path.join(HERE, "build")
F = os.path.join(EP, "final")
os.makedirs(F, exist_ok=True)
PIC = os.path.join(B, "picture.mp4")
MIX = os.path.join(B, "mix_1x.wav")
SPEED = 1.28
MAX_MB = 88.0
A_KBPS = 192


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def dur(p):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout)


def loudnorm_measure(wav):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    return json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])


def ebur(wav):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    s = r.stderr[r.stderr.rfind("Summary:"):]
    get = lambda k: float(re.search(k + r":\s+(-?[\d.]+)", s).group(1))
    return {"I": get("I"), "LRA": get("LRA"), "TP": get("Peak")}


def encode(video_filter, audio_wav, out, seconds):
    vbr = int((MAX_MB * 8 * 1024 * 1024 / seconds) / 1000 - A_KBPS - 64)  # kbps, with mux headroom
    vbr = min(vbr, 9000)
    common = ["-i", PIC, "-i", audio_wav, "-map", "0:v", "-map", "1:a", "-vf", video_filter, "-r", "30",
              "-c:v", "libx264", "-preset", "slow", "-b:v", f"{vbr}k", "-pix_fmt", "yuv420p", "-profile:v", "high",
              "-x264-params", "aq-mode=3", "-g", "60"]
    pl = os.path.join(B, "x264pass")
    run(["ffmpeg", "-y", "-v", "error", *common, "-pass", "1", "-passlogfile", pl, "-an", "-f", "null", "/dev/null"])
    run(["ffmpeg", "-y", "-v", "error", *common, "-pass", "2", "-passlogfile", pl, "-c:a", "aac", "-b:a", f"{A_KBPS}k",
         "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-shortest", out])
    return vbr


rep = ["# lf06 Ch1: loudness report", ""]

# ---------------- 1x review cut ----------------
LIM = "alimiter=limit=0.7244:attack=3:release=60:level=disabled"  # -2.8 dBFS sample ceiling (true-peak margin for AAC)
pre = ebur(MIX)
gain = -14.0 - pre["I"]
m1 = os.path.join(B, "master_1x.wav")
for _ in range(3):  # static gain, then limiter; re-trim so the limited result lands on about -14 LUFS-I
    run(["ffmpeg", "-y", "-v", "error", "-i", MIX, "-af", f"volume={gain:.2f}dB,{LIM},aresample=48000", "-c:a", "pcm_s24le", m1])
    post1 = ebur(m1)
    if abs(post1["I"] + 14.0) < 0.15:
        break
    gain += -14.0 - post1["I"]
d1 = dur(PIC)
out1 = os.path.join(F, "lf06-gaza-ch1-1x.mp4")
vbr1 = encode("null", m1, out1, d1)

# ---------------- 1.28x master ----------------
raw = os.path.join(B, "stretched_raw.wav")
run(["ffmpeg", "-y", "-v", "error", "-i", MIX, "-af", f"rubberband=tempo={SPEED}:pitch=1:pitchq=quality:formant=preserved:transients=mixed",
     "-c:a", "pcm_f32le", raw])
st = os.path.join(B, "stretched.wav")
g2 = -14.0 - ebur(raw)["I"]
for _ in range(3):  # pre-level + limiter so the loudnorm pass can stay linear under the -1.5 dBTP ceiling
    run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", f"volume={g2:.2f}dB,{LIM}", "-c:a", "pcm_s24le", st])
    lv = ebur(st)["I"]
    if abs(lv + 14.2) < 0.15:
        break
    g2 += -14.2 - lv
meas = loudnorm_measure(st)
m2 = os.path.join(B, "master_128.wav")
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
      f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true:print_format=json")
r = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-i", st, "-af", ln + ",aresample=48000", "-c:a", "pcm_s24le", m2], capture_output=True, text=True)
pass2 = json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])
post2 = ebur(m2)
d2 = dur(m2)
out2 = os.path.join(F, "lf06-gaza-ch1.mp4")
vbr2 = encode(f"setpts=PTS/{SPEED}", m2, out2, d2)

# ---------------- report ----------------
def mb(p): return os.path.getsize(p) / 1024 / 1024
def final_measure(mp4):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", mp4, "-map", "0:a", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    return json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])
f1, f2 = final_measure(out1), final_measure(out2)
rep += [
    "Measured with ffmpeg `ebur128` (true peak, 4x oversampled) and `loudnorm` analysis on the decoded AAC of each delivered file.",
    "",
    "## 1x review cut: `final/lf06-gaza-ch1-1x.mp4`",
    "",
    f"- Duration {d1:.2f} s, video {vbr1} kbps 2-pass H.264, AAC {A_KBPS} kbps 48 kHz stereo, {mb(out1):.1f} MB.",
    f"- Pre-master mix: {pre['I']:.1f} LUFS-I, LRA {pre['LRA']:.1f} LU, true peak {pre['TP']:+.1f} dBTP.",
    f"- Processing: static gain {gain:+.2f} dB, then a peak limiter at -2.8 dBFS (sample peak). No loudnorm (the brief puts loudnorm on the 1.28x master only).",
    f"- Delivered file: **{float(f1['input_i']):.1f} LUFS-I**, true peak **{float(f1['input_tp']):.1f} dBTP**, LRA {float(f1['input_lra']):.1f} LU.",
    "",
    "## 1.28x master (pitch held): `final/lf06-gaza-ch1.mp4`",
    "",
    f"- Duration {d2:.2f} s, video {vbr2} kbps 2-pass H.264 (`setpts=PTS/1.28`, 30 fps), AAC {A_KBPS} kbps 48 kHz stereo, {mb(out2):.1f} MB.",
    "- Audio chain: the whole 1x pre-master mix through `rubberband` (tempo 1.28, pitch 1.0, quality pitch mode, formants preserved), "
    f"pre-levelled with a static gain of {g2:+.2f} dB and a -2.8 dBFS peak limiter, then two-pass `loudnorm` I=-14, TP=-1.5, LRA=11, linear=true.",
    f"- Pass 1 measured: {meas['input_i']} LUFS-I, {meas['input_tp']} dBTP, LRA {meas['input_lra']} LU, threshold {meas['input_thresh']}, offset {meas['target_offset']}.",
    f"- Pass 2 output: {pass2['output_i']} LUFS-I, {pass2['output_tp']} dBTP, LRA {pass2['output_lra']} LU, normalisation type: {pass2['normalization_type']}.",
    f"- Delivered file: **{float(f2['input_i']):.1f} LUFS-I**, true peak **{float(f2['input_tp']):.1f} dBTP**, LRA {float(f2['input_lra']):.1f} LU.",
    "",
    "## Mix levels (1x, from `render/mix.py`)",
    "",
]
mr = json.load(open(os.path.join(B, "mix_report.json")))
rep += ["| Segment | Narration (median momentary LUFS) | Bed under speech (music + SFX) | Spacing |", "|---|---|---|---|"]
for s in ["S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13"]:
    c = mr["level_check"][s]
    rep.append(f"| {s} | {c['vo_momentary_median']} | {c['bed_median_under_speech']} | {c['spacing_dB']} dB |")
rep += ["", "| Music-only hold | Bed (median momentary LUFS) |", "|---|---|"]
for k in ["opening", "S07 hold", "S09 hold", "S10 same-event hold", "end hold"]:
    rep.append(f"| {k} | {mr['level_check'][k]['bed_momentary_median']} |")
rep += ["", f"S10 bed under memory 1: {mr['level_check']['S10 bed under memory 1 (median LUFS-M)']} LUFS-M; under memory 2: {mr['level_check']['S10 bed under memory 2 (median LUFS-M)']} LUFS-M.",
        "", "Voice clip gains (one static gain per file; the files on disk are untouched):", "",
        "| File | File loudness | Clip gain |", "|---|---|---|"]
for s, v in mr["vo"].items():
    rep.append(f"| audio/vo/{s}.mp3 | {v['file_LUFS']} LUFS | {v['clip_gain_dB']:+.2f} dB |")
open(os.path.join(F, "loudnorm-report.md"), "w").write("\n".join(rep) + "\n")
print("\n".join(rep))
