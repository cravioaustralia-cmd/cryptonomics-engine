# lf01 render pipeline

Long-form 16:9, 1920×1080, 30 fps. **SVG + `renderFrame(t)` + Playwright + ffmpeg.** No Remotion, no video framework.

## Shared renderer reuse

`shorts/shared/render/capture.mjs` and `engine.js` are reused. The only shared change is an **optional size override** in `capture.mjs`: `width`/`height` (viewport), `frameHtml` (an episode page instead of the shared 1080×1920 `frame.html`), `startFrame`/`endFrame` (parallel slices), an `/ep/*` route that serves `<episode>/render/*`, `PLAYWRIGHT_CHROMIUM` for the browser path, and an `EPISODE_READY` wait. Defaults are unchanged, so every Short still renders 1080×1920. `frame.html`, `engine.js` and `mix-audio.mjs` are untouched. This film does not use `mix-audio.mjs`, which runs one-pass loudnorm on the voice.

## Steps

```bash
cd longform/lf01-if-australia/render
pip install faster-whisper numpy scipy pillow pyloudnorm
python3 whisper_vo.py            # Whisper every take -> whisper-raw.json (VO read-only)
python3 build_timeline.py        # script gaps + Whisper -> timeline.json, ../transcript.json, B-roll times
python3 fetch_tiles.py           # AWS Terrain Tiles -> $TILES (not committed)
python3 make_basemap.py          # parchment terrain layers -> assets/*.jpg|webp + layers.json
python3 make_geo.py              # Natural Earth vectors -> assets/geo.js
python3 make_paper.py            # screen-space paper texture
python3 make_sfx.py              # in-house SFX + series sting -> ../audio/sfx/
node make_overlays.mjs           # corner badge + "Dramatised reconstruction" label PNGs
python3 mix.py                   # VO + music + SFX, two-pass loudnorm on the master -> ../build/master.wav
python3 gen_cuesheet.py          # ../CUE_SHEET.md from the cues the mix used
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node render_map.mjs 4   # map plate -> ../build/map.mp4
python3 compose.py --vbr 1000 --preset slow                           # B-roll zoom-throughs, badge, mux
node preview.mjs <dir> 12.5 60 ...                                    # stills at any times
```

`$TILES`, `$NE` and `$BMNG` point at the downloaded Terrain Tiles, Natural Earth geojson and Blue Marble plate. The defaults are under `/tmp/claude-0/geo`. `node_modules` resolves to `shorts/shared/render/node_modules` (Playwright).

## Files

- `scenes.js` holds the whole choreography. Every beat is keyed to a Whisper word (`A('V05','pearl')`), never to a script clock.
- `broll_plan.json` holds the 12 zoom-throughs: chunk, word or offset, the Part 2 length, and the pin. `compose.py` opens an iris from the pin head (frame centre, where the camera parks each pin) over 0.3 s and closes it back into the pin over 0.35 s.
- `archive/curtin.jpg` is optional. If present, `scenes.js` puts it in the V09 card with the State Library of NSW credit. It is absent in this render (see `../SOURCES.md`).
