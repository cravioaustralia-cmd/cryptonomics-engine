# lf02 render pipeline

Long-form 16:9, 1920×1080, 30 fps. **SVG + `renderFrame(t)` + Playwright + ffmpeg.** No Remotion, no video framework. Adapted from lf01 (`longform/lf01-if-australia/render/`, branch `claude/model-opus-bdipl6`).

## Shared renderer reuse

`shorts/shared/render/capture.mjs` and `engine.js` are reused. The only shared change is lf01's **optional size override** in `capture.mjs` (`width`/`height`, `frameHtml`, `startFrame`/`endFrame`, an `/ep/*` route serving `<episode>/render/*`, `PLAYWRIGHT_CHROMIUM`, an `EPISODE_READY` wait). Defaults are unchanged, so every Short still renders 1080×1920. `frame.html`, `engine.js` and `mix-audio.mjs` are untouched; this film does not use `mix-audio.mjs` (it runs one-pass loudnorm on the voice).

## Steps

```bash
cd longform/lf02-gallipoli/render
pip install faster-whisper numpy scipy pillow pyloudnorm shapely
ln -sf ../../../shorts/shared/render/node_modules node_modules    # Playwright (npm ci in shorts/shared/render)
python3 whisper_vo.py            # Whisper the 37 seated takes -> whisper-raw.json (takes read only)
python3 build_timeline.py        # Part 3 gaps + Whisper -> timeline.json, ../transcript.json; B-roll and photo windows
python3 fetch_tiles.py           # AWS Terrain Tiles -> $TILES (not committed)
python3 make_basemap.py          # Mercator parchment terrain layers -> assets/*.jpg|webp + layers.json
python3 make_geo.py              # Natural Earth vectors -> assets/geo.js
python3 make_paper.py            # screen-space paper texture
python3 make_photos.py           # sepia / grain / vignette grades of images/ -> photos/ (IMG19 as a faint texture)
python3 make_oars.py             # the one effect made for lf02 -> ../audio/sfx/oars.flac
node make_overlays.mjs           # corner badge + "Dramatised reconstruction" label PNGs
node preview.mjs --cues cues.json   # export the picture's pin / click / tick times for the mix
python3 mix.py                   # 1x mix: untouched VO + music + effects -> ../build/mix.wav
python3 speed_master.py 1.28     # 1.28x pitch-held stretch of the whole mix + two-pass loudnorm -> ../build/master_speed.wav
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node render_map.mjs 4   # map plate -> ../build/map.mp4
python3 compose.py --speed 1.28 --vbr 1350 --preset slow              # B-roll, badge, label, mux -> ../final/lf02-gallipoli.mp4
python3 gen_docs.py              # ../CUE_SHEET.md, ../final/loudnorm-report.md, chapters
python3 make_sheets.py           # ../final/contact-sheet.jpg, ../final/chapters/*.jpg
node preview.mjs <dir> 12.5 60 … # plate stills at any 1x time
```

`$TILES`, `$NE` and `$BMNG` point at the downloaded Terrain Tiles, Natural Earth geojson and Blue Marble plate (defaults under `/tmp/claude-0/geo`).

## Files

- `scenes.js` holds the whole choreography. Every beat is keyed to a Whisper word (`A('V16b', 'dig')`), never to a script clock. It also draws the map cards, PIPs and full-screen Ken Burns photos (HTML layer over the map) and exports `window.CUES` for the mix.
- `build_timeline.py` holds the B-roll plan (Part 3 order, anchor word, length never over Part 3, entry/exit, pin) and the two edit-level VO skips (V27, V31).
- `compose.py` lays the 33 muted clips over the plate: iris out of the pin head at frame centre (where the camera parks each pin), soft dissolves where Part 3 puts a clip next to a photo or another clip, iris back into the pin.
- Colour lock in `scenes.js`: blue Allied, red Ottoman / Central Powers, gold dotted lines only for what-if. The M34 Australia–Türkiye line is real, so it is solid and soft.
