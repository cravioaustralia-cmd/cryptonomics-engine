# Render — s07 Wider Than the Moon

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).

- `scenes.js` — one master scene compositing eight beats with real crossfades; the shared engine draws
  the captions (lower-middle, ~70%). Every beat and hit is anchored to a word in `../transcript.json`
  via `cue()`, so a retimed transcript retimes the cut.
- `config.json` — duration, SFX cues (synced to each file's measured peak) and the mix block.
- `../transcript.json` — faster-whisper `small.en` word timings on the held VO; digit groups merged
  (`3,500`, `4,000`) and spellings aligned to `script.md`.

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s07-wider-than-the-moon --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s07-wider-than-the-moon
```

Output lands in `out/` (git-ignored); the reviewed cut is copied to `../deliverables/`.

## Beats

| # | Time (s) | Underlay | Motion graphics |
|---|---:|---|---|
| 1 | 0–6.9 | Apollo 13 Moon (starfield) | Frame-1 hook `WIDER THAN / THE MOON` (unspoken); underline + flash + frame bump on "Literally"; hook lifts, dashed limb ring + diameter measure; `3,500 KM` counter |
| 2 | 6.9–12.9 | Blue Marble Australia | `W` / `E` pin drops, west→east dimension line; `4,000 KM` counter; Apollo Moon disk dropped on the continent **to scale** (3,474 : 4,000) with the overhangs lit; `MOON 3,500 KM` compare row |
| 3 | 12.9–16.6 | CC0 outline, recoloured to a night chart | Fixed graticule; continent lurches north on "moving" with onion-skin trails, then glides; compass; chevrons on "drifting north" |
| 4 | 16.6–24.6 | USGS tectonic plates | World → Australian Plate push-in; pulsing plate ring; flowing north vector; `7 CM / YEAR` stamp; fingernail icon (free edge grows) + `≈ FINGERNAILS`; 7 cm blocks stack into a column on "it adds up" |
| 5 | 24.6–31.3 | GPS.gov constellation, re-inked for dark | Slow constellation rotation, satellite→Earth signal beams; `2010s`; `GPS` chip; map card with where-the-map-says (hollow) vs real (solid) pins and a `1.5 M` dimension stamp |
| 6 | 31.3–41.3 | UTM grid, cropped to AU zones 49–56 (US "17T" callout never in frame) | Zone meridians draw on; crisp zone chips 49–56; `2017` stamp; `GDA2020` chip; west→east zone sweep on "updated"; old-map outline (red, south) snaps north onto the land on "corrected" with flash + reticles; old position blinks on "wasn't where the maps said" |
| 7 | 41.3–46.8 | Indo-Australian plate (~68–69 mm/yr vectors) | Vectors overdrawn and flowing north; route line to Asia; `NORTH → ASIA`; deep-time dial on "tens of millions of years"; outline glides north and hits the Indonesian arc (flash, shock ring, particles, shake) |
| 8 | 46.8–49.56 | Galileo Moon | Australia outline slides over the Moon at true scale; limb ticks; hook returns and eases into the exact frame-1 layout; last 0.5 s crosses to the frame-1 Apollo composition for a seamless loop |

## Mix

VO: held `audio/vo.mp3` read as-is (never rewritten) → HPF 80 Hz, −2 dB at 250 Hz, 2.5:1 glue compression.
Music: Vastness from 0 s at 0.18, sidechain-ducked by the VO (threshold 0.015, 8:1, 30/450 ms) —
~15 dB median VO-over-music under speech, bed breathes in the gaps; 0.6 s fade in, 1.4 s fade out.
SFX: 37 cues placed so each file's peak (impact ≈0.7 s, whooshes 0.65/1.0 s, riser end) lands on the
visual hit. Master: −14.0 LUFS integrated, true peak ≈ −1.3 dBTP after AAC.
