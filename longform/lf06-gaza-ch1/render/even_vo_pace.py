#!/usr/bin/env python3
"""Even VO pace for lf05 Atlas segments.

Reads audio/vo-raw/S##.mp3 + spoken word counts from vo-paste/S##.txt
(narration after "Speak only the narration below:"), targets the median
words-per-second across existing segments, tempo-corrects outliers with
pitch held (ffmpeg rubberband, atempo fallback), and trims long internal
silences. Writes audio/vo/S##.mp3. Does NOT loudnorm or apply 1.28x
(master-only later). Raw files in vo-raw are left untouched.

Usage:
  python3 even_vo_pace.py              # process every vo-raw/S##.mp3 that exists
  python3 even_vo_pace.py --dry-run    # print table only, do not write
  python3 even_vo_pace.py --only 1-5   # limit to S01..S05
  python3 even_vo_pace.py --only 1,2,7
"""

from __future__ import annotations

import argparse
import math
import shutil
import statistics
import subprocess
import sys
import tempfile
from pathlib import Path

EPISODE = Path(__file__).resolve().parent.parent
VO_RAW = EPISODE / "audio" / "vo-raw"
VO_OUT = EPISODE / "audio" / "vo"
VO_PASTE = EPISODE / "vo-paste"

MARKER = "Speak only the narration below:"
MAX_SEG = 13

# Prefer ±6% tempo adjust; skip tempo when already within this band of median.
MAX_TEMPO_DELTA = 0.06
SKIP_BAND = 0.02  # ±2% of median WPS → factor 1.0 (silence trim only)

# Compress internal silences longer than STOP_DURATION down to KEEP_SILENCE.
SILENCE_THRESHOLD_DB = -40
STOP_DURATION = 0.45
KEEP_SILENCE = 0.28


def ensure_ffmpeg() -> None:
    if shutil.which("ffprobe") and shutil.which("ffmpeg"):
        return
    print("ffmpeg/ffprobe missing — installing via apt…", file=sys.stderr)
    subprocess.check_call(
        ["sudo", "apt-get", "update", "-qq"],
        stdout=subprocess.DEVNULL,
    )
    subprocess.check_call(
        ["sudo", "apt-get", "install", "-y", "-qq", "ffmpeg"],
        stdout=subprocess.DEVNULL,
    )
    if not (shutil.which("ffprobe") and shutil.which("ffmpeg")):
        sys.exit("ffmpeg install failed")


def has_rubberband() -> bool:
    try:
        out = subprocess.check_output(
            ["ffmpeg", "-hide_banner", "-filters"],
            stderr=subprocess.STDOUT,
            text=True,
        )
        return "rubberband" in out
    except subprocess.CalledProcessError:
        return False


def parse_only(spec: str | None) -> set[int] | None:
    if not spec:
        return None
    segs: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            lo, hi = int(a), int(b)
            segs.update(range(lo, hi + 1))
        else:
            segs.add(int(part))
    return segs


def narration_words(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    idx = text.find(MARKER)
    if idx < 0:
        # Fallback: whole file (should not happen for lf05 paste pack)
        narr = text
    else:
        narr = text[idx + len(MARKER) :]
    narr = narr.strip()
    return [w for w in narr.split() if w]


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def clamp_tempo(raw_wps: float, median_wps: float) -> float:
    """Tempo factor (>1 = faster). Clamp to ±MAX_TEMPO_DELTA; 1.0 inside SKIP_BAND."""
    if raw_wps <= 0 or median_wps <= 0:
        return 1.0
    ratio = abs(raw_wps - median_wps) / median_wps
    if ratio <= SKIP_BAND:
        return 1.0
    # Speeding up when raw_wps is below median (too slow).
    factor = median_wps / raw_wps
    lo = 1.0 - MAX_TEMPO_DELTA
    hi = 1.0 + MAX_TEMPO_DELTA
    return max(lo, min(hi, factor))


def build_af(tempo: float, use_rb: bool) -> str:
    silence = (
        f"silenceremove=start_periods=0:stop_periods=-1:"
        f"stop_duration={STOP_DURATION}:stop_threshold={SILENCE_THRESHOLD_DB}dB:"
        f"stop_silence={KEEP_SILENCE}"
    )
    parts = [silence]
    if abs(tempo - 1.0) >= 1e-4:
        if use_rb:
            parts.append(f"rubberband=tempo={tempo:.6f}:pitch=1:pitchq=quality")
        else:
            # atempo holds pitch (WSOLA); range 0.5–2.0 covers ±6%.
            parts.append(f"atempo={tempo:.6f}")
    return ",".join(parts)


def process_one(
    src: Path,
    dst: Path,
    tempo: float,
    use_rb: bool,
    dry_run: bool,
) -> float:
    """Apply silence trim + tempo; return output duration. dry_run still measures via temp."""
    af = build_af(tempo, use_rb)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        cmd = [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(src),
            "-af",
            af,
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "2",
            str(tmp_path),
        ]
        subprocess.check_call(cmd)
        out_dur = probe_duration(tmp_path)
        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(tmp_path), str(dst))
        else:
            tmp_path.unlink(missing_ok=True)
        return out_dur
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="Print table only; do not write audio/vo/")
    ap.add_argument("--only", type=str, default=None, help="Segment filter, e.g. 1-5 or 1,2,7")
    ap.add_argument("--episode", type=Path, default=EPISODE, help="Episode root (default: script dir)")
    args = ap.parse_args()

    global VO_RAW, VO_OUT, VO_PASTE
    episode = args.episode.resolve()
    VO_RAW = episode / "audio" / "vo-raw"
    VO_OUT = episode / "audio" / "vo"
    VO_PASTE = episode / "vo-paste"

    ensure_ffmpeg()
    use_rb = has_rubberband()
    engine = "rubberband" if use_rb else "atempo"
    print(f"Episode: {episode}")
    print(f"Engine:  {engine} (pitch held) + silenceremove")
    print(f"Limits:  tempo ±{MAX_TEMPO_DELTA*100:.0f}% max; skip band ±{SKIP_BAND*100:.0f}%")
    print(f"Write:   {'NO (--dry-run)' if args.dry_run else VO_OUT}")
    print()

    only = parse_only(args.only)
    rows = []
    for n in range(5, MAX_SEG + 1):
        if only is not None and n not in only:
            continue
        seg = f"S{n:02d}"
        raw = VO_RAW / f"{seg}.mp3"
        _g = sorted(VO_PASTE.glob(f"{seg}_*.txt")); paste = _g[0] if _g else VO_PASTE / f"{seg}.txt"
        if not raw.exists():
            continue
        if not paste.exists():
            print(f"WARN: {paste} missing — skip {seg}", file=sys.stderr)
            continue
        words = narration_words(paste)
        dur = probe_duration(raw)
        wps = len(words) / dur if dur > 0 else 0.0
        rows.append({"seg": seg, "n": n, "words": len(words), "dur": dur, "wps": wps, "raw": raw})

    if not rows:
        print("No vo-raw/S##.mp3 files found to process.")
        return 1

    median_wps = statistics.median(r["wps"] for r in rows)
    print(f"Segments: {len(rows)}  |  median raw WPS: {median_wps:.4f}")
    print()

    header = f"{'seg':<5} {'words':>5} {'dur':>7} {'wps':>6} {'factor':>7} {'out_dur':>8} {'out_wps':>7}"
    print(header)
    print("-" * len(header))

    for r in rows:
        factor = clamp_tempo(r["wps"], median_wps)
        dst = VO_OUT / f"{r['seg']}.mp3"
        out_dur = process_one(r["raw"], dst, factor, use_rb, args.dry_run)
        out_wps = r["words"] / out_dur if out_dur > 0 else 0.0
        print(
            f"{r['seg']:<5} {r['words']:>5} {r['dur']:>7.3f} {r['wps']:>6.3f} "
            f"{factor:>7.4f} {out_dur:>8.3f} {out_wps:>7.3f}"
        )

    print()
    print("Done. Raw backups untouched in audio/vo-raw/.")
    if not args.dry_run:
        print(f"Evened copies written to {VO_OUT}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
