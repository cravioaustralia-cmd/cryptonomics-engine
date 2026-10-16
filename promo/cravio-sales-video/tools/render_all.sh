#!/usr/bin/env bash
# Rebuild every deliverable from source.
#   tools/render_all.sh            # 1080p hero + social
#   tools/render_all.sh --4k       # also the 3840x2160 hero
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD
BE=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
mkdir -p build final

python3 tools/build_timing.py          # VO placement, scene cuts, music map, SFX -> timing JSON
node tools/gen_assets.mjs              # brand SVG geometry -> TS module
python3 tools/mix_audio.py hero        # -> build/hero_master.wav  (-14 LUFS, <= -1.5 dBTP)
python3 tools/mix_audio.py social      # -> build/social_master.wav

R="npx remotion render --browser-executable=$BE --codec=h264 --pixel-format=yuv420p --concurrency=4 --muted --gl=swangle"
( cd remotion && $R Hero   ../build/hero_silent_1080.mp4   --crf=14 )
( cd remotion && $R Social ../build/social_silent_1080x1920.mp4 --crf=14 )

mux () { # video audio out
  ffmpeg -v error -y -i "$1" -i "$2" -map 0:v:0 -map 1:a:0 -c:v copy \
    -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -shortest "$3"
}
mux build/hero_silent_1080.mp4         build/hero_master.wav   final/cravio_hero_16x9_1080p.mp4
mux build/social_silent_1080x1920.mp4  build/social_master.wav final/cravio_social_9x16_1080x1920.mp4

if [[ "${1:-}" == "--4k" ]]; then
  ( cd remotion && $R Hero ../build/hero_silent_4k.mp4 --scale=2 --crf=20 --x264-preset=slow )
  mux build/hero_silent_4k.mp4 build/hero_master.wav final/cravio_hero_16x9_4k.mp4
fi
echo "done"
