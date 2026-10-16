#!/usr/bin/env bash
# finalize.sh <silent_video> <master_wav> <out.mp4> <crf>
# H.264 High, yuv420p (TV range), 30 fps; AAC-LC 48 kHz 320k; faststart.
set -euo pipefail
ffmpeg -v error -y -i "$1" -i "$2" -map 0:v:0 -map 1:a:0 \
  -vf "scale=in_range=full:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -profile:v high -preset slow -crf "$4" -r 30 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -shortest "$3"
