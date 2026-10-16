#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../remotion"
BE=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion render Hero ../build/hero_silent_1080.mp4 --browser-executable=$BE --codec=h264 --crf=14 --pixel-format=yuv420p --concurrency=4 --muted --gl=swangle > ../build/render_hero.log 2>&1
npx remotion render Social ../build/social_silent_1080x1920.mp4 --browser-executable=$BE --codec=h264 --crf=14 --pixel-format=yuv420p --concurrency=4 --muted --gl=swangle > ../build/render_social.log 2>&1
echo RENDERS_DONE
