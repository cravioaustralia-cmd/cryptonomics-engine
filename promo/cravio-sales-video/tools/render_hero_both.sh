#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../remotion"
BE=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion render Hero ../build/hero_silent_1080.mp4 --browser-executable=$BE --codec=h264 --crf=10 --pixel-format=yuv420p --concurrency=4 --muted --gl=swangle > ../build/render_hero.log 2>&1
echo HERO1080_DONE
npx remotion render Hero ../build/hero_silent_4k.mp4 --scale=2 --browser-executable=$BE --codec=h264 --crf=12 --pixel-format=yuv420p --concurrency=4 --muted --gl=swangle > ../build/render_hero4k.log 2>&1
echo HERO4K_DONE
