#!/usr/bin/env bash
# Downscale stills to render copies (long side <= 2400 px) in images/_render (git-ignored).
set -euo pipefail
cd "$(dirname "$0")/../images"
mkdir -p _render
for f in *.jpg; do
  [ -f "_render/$f" ] && continue
  ffmpeg -v error -y -i "$f" -vf "scale='if(gt(iw,ih),min(2400,iw),-2)':'if(gt(iw,ih),-2,min(2400,ih))'" -q:v 3 "_render/$f"
done
echo "prepped $(ls _render | wc -l) images"
