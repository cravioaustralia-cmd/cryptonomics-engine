#!/bin/bash
# lf10 master: picture (Remotion, muted) + premaster mix -> 1x and 1.28x masters.
# Loudness is set on the master only: bus compressor + limiter, then two-pass loudnorm (-14 LUFS, TP -1.5 dBTP).
set -euo pipefail
B=$(cd "$(dirname "$0")" && pwd)
OUT=$B/out
VIDEO=${1:-$OUT/video_1x.mp4}
FINAL=$(dirname "$B")/final
mkdir -p "$FINAL"

bus="acompressor=threshold=-30dB:ratio=3:attack=5:release=140:makeup=1,volume=16.5dB,alimiter=limit=0.75:attack=2:release=50:level=false:asc=1"

master() { # in.wav out.m4a
  local in=$1 out=$2
  ffmpeg -v error -y -i "$in" -af "$bus" -c:a pcm_f32le "$OUT/_bus.wav"
  local js
  js=$(ffmpeg -hide_banner -nostats -i "$OUT/_bus.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  local mi mtp mlra mth off
  mi=$(echo "$js" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_i"])')
  mtp=$(echo "$js" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_tp"])')
  mlra=$(echo "$js" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_lra"])')
  mth=$(echo "$js" | python3 -c 'import json,sys;print(json.load(sys.stdin)["input_thresh"])')
  off=$(echo "$js" | python3 -c 'import json,sys;print(json.load(sys.stdin)["target_offset"])')
  echo "  pass1: I=$mi TP=$mtp LRA=$mlra thresh=$mth offset=$off"
  ffmpeg -hide_banner -nostats -y -i "$OUT/_bus.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true:print_format=json,aresample=48000" \
    -c:a aac -b:a 256k "$out" 2>&1 | grep -E '"normalization_type"|"output_i"|"output_tp"' | tr -d '\n '; echo
  rm -f "$OUT/_bus.wav"
}

echo "== 1x audio master"
master "$OUT/mix_premaster.wav" "$OUT/audio_1x.m4a"
echo "== 1x mux"
ffmpeg -v error -y -i "$VIDEO" -i "$OUT/audio_1x.m4a" -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "$FINAL/lf10_1x.mp4"

echo "== 1.28x picture"
ffmpeg -v error -y -i "$VIDEO" -an -vf "setpts=PTS/1.28,fps=30" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -threads 4 "$OUT/video_128x.mp4"
echo "== 1.28x audio (atempo keeps pitch)"
ffmpeg -v error -y -i "$OUT/mix_premaster.wav" -af "atempo=1.28" -c:a pcm_f32le "$OUT/mix_premaster_128x.wav"
master "$OUT/mix_premaster_128x.wav" "$OUT/audio_128x.m4a"
ffmpeg -v error -y -i "$OUT/video_128x.mp4" -i "$OUT/audio_128x.m4a" -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "$FINAL/lf10_128x.mp4"
ls -la "$FINAL"
