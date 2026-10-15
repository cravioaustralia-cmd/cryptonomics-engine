#!/bin/sh
# Mux picture + finished audio into the two deliverables (H.264 CRF 18 slow, AAC 320k, faststart).
set -e
cd "$(dirname "$0")"
ffmpeg -v error -y -i out/video_1x.mp4 -i cache/mix/mix_1x.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/lf09_1x.mp4
ffmpeg -v error -y -i out/video_master.mp4 -i cache/mix/mix_master.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart out/lf09_master_1.28x.mp4
ls -la out/*.mp4
