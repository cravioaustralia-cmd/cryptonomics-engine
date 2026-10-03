#!/usr/bin/env bash
# lf01 IF AUSTRALIA — full rebuild from the seated VO, B-roll, Curtin photo and bed.
# Needs: node 22, ffmpeg, python3 (numpy scipy pillow shapely faster-whisper pyloudnorm),
# Playwright in shorts/shared/render (npm ci there). Optional: PW_CHROMIUM=/path/to/chromium.
set -euo pipefail
cd "$(dirname "$0")"
EP=..
[ -f tiles/manifest.json ] || python3 tools/build-tiles.py tiles "${CACHE:-/tmp/lf01-cache}"   # needs NE_DIR + network to S3
[ -f assets/paper.jpg ] || python3 tools/make-assets.py assets
python3 tools/retune.py "$EP"            # Whisper every VO file (skips ones already in transcripts/)
node timeline.mjs                        # lock the cut to the real takes + script edit gaps
node check-score.mjs                     # anchors, frame sanity, out/score.json
python3 tools/build-sfx.py sfx           # in-house SFX + series sting
python3 tools/mix.py "$EP"               # VO static gain, ducked bed, SFX, two-pass loudnorm (master only)
python3 tools/make-overlays.py "$EP"     # badge, B01 label, iris masks
TILES=tiles node render.mjs --workers "${WORKERS:-3}" --out "$EP/out/map.mp4"
node composite.mjs                       # B-roll zoom-throughs, badge, label, mux → out/master.mp4, final/*.mp4
python3 tools/contact-sheet.py "$EP"
node tools/docs.mjs                      # CUE_SHEET.md, TIMING.md
