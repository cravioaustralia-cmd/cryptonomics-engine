#!/usr/bin/env python3
"""master.py - deliverables for 'Before Bondi'.

  python3 render/master.py PICTURE.mp4        (PICTURE = full-length intermediate from film.py range 0 END)

1x  : final/lf07-before-bondi-1x.mp4 - picture + build/mix_1x.wav (-14 LUFS, TP <= -1.5 dBTP), AAC 48 kHz
1.28: final/lf07-before-bondi.mp4    - whole film through rubberband (pitch held), two-pass loudnorm on that master only
Both two-pass x264 sized to stay under 95 MB. Also writes final/loudnorm-report.md and final/CHAPTERS.txt.
"""
import json, math, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import timeline as TL
import mix as MX

EP = Path(__file__).resolve().parents[1]
FIN = EP / "final"
B = EP / "build"
SPEED = 1.28
# picture_1x.mp4 intermediates rendered before the encoder fix carry R and B swapped (skia BGRA piped as RGBA);
# this exact channel swap restores them. Set FIX_SWAP = False for intermediates rendered after the fix.
FIX_SWAP = True
SWAP = "colorchannelmixer=rr=0:rb=1:br=1:bb=0"
MAX_MB = 87.0      # MiB, so each file stays under 95 MB (decimal) with two-pass overshoot
A_KBPS = 128


def run(cmd):
    print(" ".join(map(str, cmd))[:300], flush=True)
    subprocess.run(cmd, check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def x264_2pass(src_v, src_a, out, seconds, vf=None, af=None, extra_in=()):
    kbps = int((MAX_MB * 8 * 1024 / seconds) - A_KBPS - 12)
    log = B / f"x264_{out.stem}"
    base = ["ffmpeg", "-v", "error", "-y", "-i", str(src_v)]
    vfs = ([SWAP] if FIX_SWAP else []) + ([vf] if vf else [])
    vfa = ["-vf", ",".join(vfs)] if vfs else []
    run(base + vfa + ["-an", "-c:v", "libx264", "-preset", "slow", "-tune", "film", "-b:v", f"{kbps}k", "-pass", "1",
                      "-passlogfile", str(log), "-pix_fmt", "yuv420p", "-r", "30", "-f", "mp4", "/dev/null"])
    run(base + ["-i", str(src_a)] + vfa + ["-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-tune", "film",
                                           "-b:v", f"{kbps}k", "-maxrate", f"{int(kbps * 2.2)}k", "-bufsize", f"{kbps * 4}k",
                                           "-pass", "2", "-passlogfile", str(log), "-pix_fmt", "yuv420p", "-r", "30",
                                           "-c:a", "aac", "-b:a", f"{A_KBPS}k", "-ar", "48000", "-movflags", "+faststart",
                                           "-shortest", str(out)])
    return kbps


def loudnorm_2pass(src, dst, I=-14.0, TP=-1.5, LRA=11.0):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(out[out.rfind("{"): out.rfind("}") + 1])
    af = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
          f"aresample=48000")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", af, "-ar", "48000", "-c:a", "pcm_f32le", str(dst)])
    return m


def fmt(t):
    t = int(round(t))
    return f"{t // 60}:{t % 60:02d}"


def main():
    pic = Path(sys.argv[1])
    FIN.mkdir(exist_ok=True)
    T = TL.load()
    global END_FADE_VF
    END_FADE_VF = f"fade=t=out:st={T.total - MX.END_FADE:.3f}:d={MX.END_FADE}"   # picture fades with the music
    rep = {}
    # ---------------- 1x
    r1 = MX.loudness(B / "mix_1x.wav")
    out1 = FIN / "lf07-before-bondi-1x.mp4"
    k1 = x264_2pass(pic, B / "mix_1x.wav", out1, T.total, vf=END_FADE_VF)
    a1 = MX.loudness(out1)
    rep["1x"] = dict(file=out1.name, wav=r1, mp4=a1, kbps=k1, size_mb=out1.stat().st_size / 2 ** 20, duration=dur(out1))
    # ---------------- 1.28x, pitch held
    rb = B / "mix_128_rb.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(B / "mix_1x.wav"), "-af",
         f"rubberband=tempo={SPEED}:pitch=1:pitchq=quality:transients=smooth:formant=preserved", "-c:a", "pcm_f32le", str(rb)])
    m = loudnorm_2pass(rb, B / "mix_128.wav", TP=-2.4)   # headroom so the AAC file stays at or under -1.5 dBTP
    secs = T.total / SPEED
    out2 = FIN / "lf07-before-bondi.mp4"
    k2 = x264_2pass(pic, B / "mix_128.wav", out2, secs, vf=f"{END_FADE_VF},setpts=PTS/{SPEED},fps=30")
    a2 = MX.loudness(out2)
    rep["1.28x"] = dict(file=out2.name, loudnorm_first_pass=m, mp4=a2, kbps=k2, size_mb=out2.stat().st_size / 2 ** 20,
                        duration=dur(out2))
    (B / "master_report.json").write_text(json.dumps(rep, indent=1))
    # ---------------- chapters (master times; 1x beside them in BUILD_NOTES)
    lines = []
    mids = {m["after"]: m["t"] for m in T.d["midrolls"]}
    order = []
    for ch in T.d["chapters"]:
        order.append((ch["t"], f"{fmt(ch['t'] / SPEED)} {ch['name']}"))
    for sid, t in mids.items():
        order.append((t, f"# MID-ROLL AD BREAK after {sid} at {fmt(t / SPEED)}"))
    order.sort()
    (FIN / "CHAPTERS.txt").write_text("\n".join(x[1] for x in order) + "\n")
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
