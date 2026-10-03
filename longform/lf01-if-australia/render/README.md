# lf01 render rig

SVG + `renderFrame(t)` + Playwright + ffmpeg. No Remotion. 1920×1080, 30 fps. Rebuild everything with `./build-all.sh`.

| File | Job |
|---|---|
| `frame.html`, `runtime.js` | 1920×1080 page. Tile layer (pooled `<img>`, decode before capture), looks (night / desaturate / warm / dim via CSS filters), SVG overlay. |
| `map.js` | Web Mercator maths, Pacific-centred wrap, van Wijk fly-to camera, scalar tracks. Pure; runs in Node too. |
| `icons.js` | War-map graphics kit: pins, campaign arrows, rail, ships, planes, subs, unit symbols, stamps, tags, cards, treaty, numerals. |
| `score.js` | The whole film: camera, looks, overlays, zoom-throughs, SFX and music cues, beat by beat from Part 2. Every in-beat event is anchored to a word Whisper heard in the take. |
| `beats.json` | Part 2 transcribed: script clocks, edit gaps, pre-gaps, B-roll per beat. |
| `timeline.mjs` | Places V01–V34 on the film timeline from the real file lengths (silence padding trimmed) plus the script's edit gaps. |
| `check-score.mjs` | Runs the score in Node: anchor report, frame sanity, zoom-through collisions. Writes `out/score.json`. |
| `render.mjs` | Parallel frame capture through `shorts/shared/render/capture.mjs` (16:9 override). |
| `composite.mjs` | ffmpeg: B-roll through iris masks at the pins, corner badge, B01 label, mix → `out/master.mp4` and `final/lf01-if-australia.mp4`. |
| `tools/build-tiles.py` | Parchment terrain pyramid from AWS Terrain Tiles + Natural Earth (`tiles/`, 19 MB, committed). |
| `tools/retune.py` | faster-whisper word timings → `../transcripts/`. |
| `tools/build-sfx.py` | Synthesised SFX and the series sting → `sfx/`. |
| `tools/mix.py` | Voice static gain, looped ducked bed, SFX, two-pass loudnorm on the master → `../LOUDNORM_REPORT.md`. |
| `tools/make-overlays.py`, `tools/contact-sheet.py`, `tools/docs.mjs` | Overlays and masks, contact sheet and chapter stills, cue sheet and timing note. |

The shared capture change is small: optional `width`, `height`, `roots`, `dirs`, `frameRange`, three extra content types, and `PW_CHROMIUM`. Shorts keep the 1080×1920 defaults.
