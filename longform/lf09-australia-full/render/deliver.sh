#!/bin/sh
# Mux picture + finished audio into the two deliverables (H.264 CRF 18 slow, AAC 320k, faststart).
# Re-rendered fix ranges (out/patch_<start>.mp4) are spliced over the 1x picture frame-accurately.
set -e
cd "$(dirname "$0")"
ffmpeg -v error -y -i out/video_1x.mp4 -i out/patch_52.mp4 -i out/patch_253.mp4 -i out/patch_620.mp4 -i cache/mix/mix_1x.wav \
  -filter_complex "[1:v]setpts=PTS+52/TB[p1];[2:v]setpts=PTS+253/TB[p2];[3:v]setpts=PTS+620/TB[p3];[0:v][p1]overlay=eof_action=pass:enable='between(t,52,58.99)'[a];[a][p2]overlay=eof_action=pass:enable='between(t,253,258.99)'[b];[b][p3]overlay=eof_action=pass:enable='between(t,620,630.99)'[v]" \
  -map "[v]" -map 4:a -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/lf09_1x.mp4
if [ -f out/video_master.mp4 ]; then
ffmpeg -v error -y -i out/video_master.mp4 -i cache/mix/mix_master.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/lf09_master_1.28x.mp4
fi
ls -la out/*.mp4
