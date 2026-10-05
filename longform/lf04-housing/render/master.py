"""lf04 master: whole film at 1.28x with pitch held, two-pass loudnorm on the master only.

Audio: build/mix1x.wav -> rubberband tempo 1.28 (pitch held) -> gentle bus compression + limiter
       -> loudnorm pass 1 (measure) -> loudnorm pass 2 (linear) at -14 LUFS / -1.5 dBTP.
Video: build/cut1x.mp4 -> setpts/1.28, 30 fps -> two-pass encode sized under GitHub's 100 MB file cap.
Writes final/lf04-housing.mp4 and final/loudnorm-report.md.
"""
import json
import os
import re
import subprocess
import sys

from design import EP

BUILD = os.path.join(EP, "build")
FINAL = os.path.join(EP, "final")
SPEED = 1.28
TARGET_I, TARGET_TP, TARGET_LRA = -14.0, -1.5, 11.0
SIZE_BYTES = 95_000_000
AUDIO_KBPS = 160


def run(cmd, **kw):
    print("+", " ".join(cmd)[:300], flush=True)
    return subprocess.run(cmd, check=True, **kw)


def loudnorm_measure(path, extra=""):
    af = (extra + "," if extra else "") + f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json"
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", af, "-f", "null", "-"], capture_output=True,
                         text=True).stderr
    js = err[err.rindex("{"):err.rindex("}") + 1]
    return json.loads(js)


def ebur128(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f",
                          "null", "-"], capture_output=True, text=True).stderr
    summ = err[err.rindex("Summary:"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    LRA = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))
    TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
    return I, LRA, TP


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                          "csv=p=0", path]).decode())


def audio():
    mix = os.path.join(BUILD, "mix1x.wav")
    fast = os.path.join(BUILD, "fast.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", mix, "-af", f"rubberband=tempo={SPEED}:pitch=1:pitchq=quality",
         "-ar", "48000", "-c:a", "pcm_f32le", fast])
    m0 = loudnorm_measure(fast)
    pre_I = float(m0["input_i"])
    gain = TARGET_I - pre_I
    # Bus dynamics so the linear loudnorm pass can hit -14 LUFS without breaking the true-peak ceiling.
    # The make-up gain is found iteratively until the shaped mix sits just under the target.
    shaped = os.path.join(BUILD, "fast_shaped.wav")

    def shape(g):
        dyn = (f"acompressor=threshold=-30dB:ratio=2.5:attack=6:release=140:knee=8,"
               f"volume={g:.2f}dB,"
               f"alimiter=limit={10 ** (-2.4 / 20):.4f}:attack=2:release=50:level=disabled")
        run(["ffmpeg", "-v", "error", "-y", "-i", fast, "-af", dyn, "-ar", "48000", "-c:a", "pcm_f32le", shaped])
        return dyn, float(loudnorm_measure(shaped)["input_i"])

    g = gain + 3.0
    for _ in range(5):
        dyn, got = shape(g)
        print(f"make-up {g:.2f} dB -> {got:.2f} LUFS", flush=True)
        if -14.45 <= got <= -14.05:
            break
        g += (TARGET_I - 0.25 - got) * 1.15
    m1 = loudnorm_measure(shaped)
    lra = max(TARGET_LRA, float(m1["input_lra"]) + 1)
    p2 = (f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={lra}:measured_I={m1['input_i']}:"
          f"measured_TP={m1['input_tp']}:measured_LRA={m1['input_lra']}:measured_thresh={m1['input_thresh']}:"
          f"offset={m1['target_offset']}:linear=true:print_format=json")
    final_wav = os.path.join(BUILD, "master_audio.wav")
    err = subprocess.run(["ffmpeg", "-hide_banner", "-y", "-i", shaped, "-af", p2, "-ar", "48000", "-c:a",
                          "pcm_f32le", final_wav], capture_output=True, text=True).stderr
    m2 = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
    json.dump(dict(pre=m0, pass1=m1, pass2=m2, dyn=dyn, pass2_filter=p2),
              open(os.path.join(BUILD, "loudnorm.json"), "w"), indent=1)
    print("pass2 normalization_type:", m2.get("normalization_type"))


def video():
    src = os.path.join(BUILD, "cut1x.mp4")
    aud = os.path.join(BUILD, "master_audio.wav")
    dur = duration(src) / SPEED
    vkbps = int((SIZE_BYTES * 8 / dur - AUDIO_KBPS * 1000) / 1000 * 0.97)
    print(f"master duration {dur:.2f}s video {vkbps} kbps")
    vf = f"setpts=PTS/{SPEED},fps=30,fade=t=in:st=0:d=0.5,fade=t=out:st={dur - 1.4:.3f}:d=1.4,format=yuv420p"
    os.makedirs(FINAL, exist_ok=True)
    out = os.path.join(FINAL, "lf04-housing.mp4")
    stats = os.path.join(BUILD, "x265_2pass.log")
    common = ["-c:v", "libx265", "-preset", "medium", "-b:v", f"{vkbps}k", "-tag:v", "hvc1"]
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", vf] + common +
        ["-x265-params", f"pass=1:stats={stats}:log-level=error", "-an", "-f", "mp4", "/dev/null"])
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-i", aud, "-map", "0:v", "-map", "1:a", "-vf", vf] + common +
        ["-x265-params", f"pass=2:stats={stats}:log-level=error", "-c:a", "aac", "-b:a", f"{AUDIO_KBPS}k",
         "-ar", "48000", "-t", f"{dur:.3f}", "-movflags", "+faststart",
         "-metadata", "title=Who Killed the Aussie Dream? Five Suspects Behind Australia’s Housing Crisis", out])
    print(out, os.path.getsize(out))


def report():
    out = os.path.join(FINAL, "lf04-housing.mp4")
    I, LRA, TP = ebur128(out)
    ln = json.load(open(os.path.join(BUILD, "loudnorm.json")))
    dur = duration(out)
    size = os.path.getsize(out)
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-of", "json", out]))
    v = next(s for s in probe["streams"] if s["codec_type"] == "video")
    a = next(s for s in probe["streams"] if s["codec_type"] == "audio")
    ok_i = abs(I - TARGET_I) <= 0.5
    ok_tp = TP <= TARGET_TP
    md = f"""# lf04 loudnorm report — Who Killed the Aussie Dream?

Master: `final/lf04-housing.mp4` (whole film at **{SPEED}x**, pitch held with ffmpeg `rubberband`).
Loudness normalisation was applied to the **master only**, in two passes. The files in `audio/vo/` were not
retimed, pitch-shifted, loudnormed or overwritten.

## Measured on the delivered file (ffmpeg `ebur128=peak=true`, AAC decoded)

| Measure | Target | Measured | Result |
| --- | --- | --- | --- |
| Integrated loudness | about {TARGET_I:.0f} LUFS | **{I:.1f} LUFS** | {"PASS" if ok_i else "CHECK"} |
| True peak | at or under {TARGET_TP} dBTP | **{TP:.1f} dBTP** | {"PASS" if ok_tp else "CHECK"} |
| Loudness range | — | {LRA:.1f} LU | — |

## Chain

1. 1x mix (`render/mix.py`): VO files at one fixed gain (+6 dB, identical for all 40), music beds ducked
   under the voice and lifted in the no-VO chapter holds, SFX only inside holds.
2. Whole mix at {SPEED}x, pitch held: `rubberband=tempo={SPEED}:pitch=1:pitchq=quality`.
3. Bus dynamics before normalisation: `{ln['dyn']}`.
4. Loudnorm pass 1 (measure): input I {ln['pass1']['input_i']} LUFS, TP {ln['pass1']['input_tp']} dBTP,
   LRA {ln['pass1']['input_lra']} LU, threshold {ln['pass1']['input_thresh']} LUFS, offset {ln['pass1']['target_offset']}.
5. Loudnorm pass 2 (apply): `I={TARGET_I}:TP={TARGET_TP}`, measured values from pass 1, `linear=true`.
   Pass 2 reported normalisation type **{ln['pass2'].get('normalization_type', 'n/a')}**,
   output I {ln['pass2']['output_i']} LUFS, TP {ln['pass2']['output_tp']} dBTP.
6. Encode: AAC {AUDIO_KBPS} kb/s 48 kHz stereo.

Before the speed change and dynamics, the 1.28x mix measured {ln['pre']['input_i']} LUFS integrated and
{ln['pre']['input_tp']} dBTP true peak.

## File

| | |
| --- | --- |
| Duration | {dur:.2f} s ({int(dur // 60)}:{dur % 60:05.2f}) |
| Size | {size / 1e6:.1f} MB (kept under GitHub's 100 MB per-file limit; this repo does not use Git LFS) |
| Video | {v['codec_name'].upper()} ({v.get('profile', '')}) {v['width']}x{v['height']}, {v['r_frame_rate']} fps, tag `{v.get('codec_tag_string')}` |
| Audio | {a['codec_name'].upper()} {a.get('sample_rate')} Hz, {a.get('channels')} ch |
"""
    open(os.path.join(FINAL, "loudnorm-report.md"), "w").write(md)
    print(md)


if __name__ == "__main__":
    steps = sys.argv[1:] or ["audio", "video", "report"]
    for s in steps:
        globals()[s]()
