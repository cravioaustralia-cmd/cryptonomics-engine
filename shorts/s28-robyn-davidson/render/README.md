# Render — s28-robyn-davidson (MAP EXPLAINER · Impossible Journeys ep.4)

This build uses **SVG + `renderFrame(t)` + Playwright + ffmpeg** through `shorts/shared/render/`. There is no Remotion. Maps carry the story, and the only photo is the brief Rick Smolan insert.

## Files
- `scenes.js` — the whole Short, built on one continuous camera with keyframed longitude, latitude, zoom, tilt and bearing.
  - **Basemap:** satellite layers are placed with a CSS `matrix3d`, which is the exact projective map of a tilted ground plane. That gives the 3D terrain look while staying sharp.
  - **Overlays:** the route, labels, icons and gags are screen-space SVG projected through the same matrix.
  - **Camera tracking:** the camera tracks the route's leading edge during the walking beats.
- `make_basemap.py` — builds `assets/map_*.jpg` and `map_layers.json`, the GeoGlobeTales-grade satellite canvas, from open data. See `../images/SOURCES.md`.
- `fetch_tiles.py` — fetches the AWS Terrarium tiles into a local cache. The cache is not committed.
- `make_geo.py` — builds `assets/geo.js` from Natural Earth: coastline, state borders and the Gibson Desert outline.
- `whisper_align.py` writes `whisper-raw.json` from the held VO, and `snap_transcript.py` writes `../transcript.json`. Timing is Whisper's and spelling follows `script.md`. Five zero-length Whisper hallucination tokens inside the elder line were dropped, and all 250 words aligned.
- `mix.mjs` — the locked mix path, which writes `out/loudnorm-report.txt`.
- `build.mjs` runs the mix, a parallel capture (4 Chromium workers on the shared episode page), concat, mux, `final/` MP4 and contact sheet.
- `preview.mjs` renders chosen timestamps through the same page and tiles them into a sheet.
- `fonts/` holds Anton and Montserrat 800/900 (SIL OFL, same kit as s25). `assets/grain.png` is shared with s23 and s25.

## Rebuild
```bash
cd shorts/shared/render && npm ci
cd ../../s28-robyn-davidson/render
# basemap (only if regenerating): tiles + Natural Earth + bmng.jpg, then
#   python3 fetch_tiles.py 7 96 162 -48 6   (and the zooms listed in make_basemap.py LAYERS)
#   TILES=… NE=… BMNG=… python3 make_basemap.py && python3 make_geo.py
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs --workers 4
node build.mjs --remux     # audio-only rebuild onto the existing silent video
```

## Beats (Whisper-timed, 95.4 s)
| Time | Beat | On the map |
|---|---|---|
| 0.00–2.7 | One woman. Four camels. | **Frame 1:** a tilted 3D red-centre terrain with sky and horizon. Four camels and Robyn march west over dunes while the Indian Ocean glows at the far edge. The hook `2,700 km, FOUR camels` slams on frame 1 and clears by 1.4 s. It is never spoken. |
| 2.7–5.8 | 2,700 kilometres of desert | The camera pulls up to north-up. A white dashed intent route draws Alice to coast with a yellow `2,700 KM` counter on a dimension line along the route. |
| 5.8–9.5 | 1977. Robyn Davidson. | A big extruded `1977`. Robyn's person icon walks in under a `ROBYN DAVIDSON` chip. There is no portrait, because no free-licence photo exists. |
| 9.6–17.3 | Alice Springs / very middle / walk west to the ocean | Pin drop `ALICE SPRINGS`. A continent pull-out with crosshair and rings shows "the very middle". A dashed arrow runs west to the coast, then `INDIAN OCEAN` appears with a glow. |
| 17.8–22.0 | no camels / no idea | Four dashed ghost camel slots with red crosses, then question-mark bubbles. |
| 22.6–26.3 | bite, kick, spit… have opinions | A wild camel lunges, kicks and spits, each with an impact burst on the spoken word. **Gag 1:** a camel bust turns to camera, lids drop and the pupils slide into a slow side-eye. |
| 25.5–31.1 | about two years / handlers / wild camels | A two-lap year dial with `~2 YEARS`. Two handler icons stand by, then four wild camels trot in, get saddled and line up. |
| 31.7–38.8 | money / National Geographic / photographer | An empty purse with a moth, the `NATIONAL GEOGRAPHIC` chip, coins on "pay" and a "!" on "one condition". The Rick Smolan 2009 portrait card shows for about 1.6 s. |
| 39.2–44.0 | alone / keeps turning up / in the desert | A spotlight on "alone". **Gag 2:** a camera pops from holes along the dashed route five times, each with a "click!" flash. The last one is beside her, with a screen flash. |
| 44.5–50.4 | walks west / past Uluru / deep desert | The solid yellow-orange route self-draws with a soft shadow and glowing head. A `~335 KM` Alice–Uluru dimension appears, then a dive to the Uluru hero layer with ring and `ULURU`. A `GIBSON DESERT` region highlight follows. The dog trots alongside, and the **series camel** with its red saddle walks at the back. |
| 50.9–57.4 | language / elder walks part of the way | Quiet "…" speech bubbles. A plain companion person icon joins near Docker River and walks with her to Warburton, then stops and fades. A white bracket marks "part of the way". There is no costume, symbol, art or name. |
| 57.4–61.0 | rumours lost / journalists hunting | A continent view with rumour ripples from the cities and red "?" bubbles around her. Magnifiers sweep in. |
| 61.4–66.3 | search party of reporters | **Gag 3:** forty little `PRESS` cars swarm across the map toward her while her caravan edges away west along the route. |
| 66.3–72.5 | Then disaster / dog / poison bait | **Gag 4:** a hard cut where the cars vanish, the map desaturates and **the music drops out**. A soft ring marks the dog, which then fades to an outline while a small light rises. No gun, no act and no body are shown. |
| 72.5–78.8 | nine months / ocean / west coast | Colour returns with a `9 MONTHS` callout. The route races to the coast and the music returns. `INDIAN OCEAN`, a glowing `WEST COAST` coastline and a sourced `HAMELIN POOL` pin appear. Hamelin Pool is not spoken. |
| 79.0–84.0 | wade into the sea / never seen that much water | **Gag 5:** the camera swoops down to the Hamelin Pool shore, the camels step into the turquoise water with a big splash, and the camera pulls back to the vast water with "!" reactions. |
| 84.5–89.3 | give those camels a like / long way | A thumbs-up pops with floating hearts, then a pull-out to the whole route with the `2,700 KM` dimension. |
| 89.8–94.2 | episode four of Impossible Journeys / next one | **Gag 6:** a pull-out to the master map. The episode 1 and 2 routes draw in, this route turns **red** and joins with `EP. 1`, `EP. 2` and `EP. 4` tags. The series camel walks onto the `IMPOSSIBLE JOURNEYS` chip, and a red dashed "next" line runs off to a "?". |
| 94.3–95.4 | All of it, for | The **incomplete loop**: the camera swoops back to the exact frame-1 composition, the caravan resumes its opening march and the hook re-slams. The last frame matches frame 1. |

## Mix (`mix.mjs`, locked path)
1. VO measured −23 LUFS, so static +5 dB plus `apad`. There is no VO loudnorm.
2. Skyline (Mixkit 601) is set static at bed target −36.2 LUFS, which is s18's −32.2 minus 4 LU. It gets +3 dB only in VO gaps of 0.45 s or more. It **drops out at 66.32 s ("Then disaster") and returns from 74.9 s** as the coast approaches.
3. There are 10 sparse SFX cue types: hook slam, reveal whoosh, side-eye scratch, 5 shutter clicks, walk whoosh, press swarm, a soft thud at the disaster, splash, master-map whoosh and loop whoosh. There is no gunshot and no text-pop chatter.
4. Float `amix` (normalize=0) feeds a peak-safety limiter, then a **two-pass loudnorm on the master only** at −14 LUFS and −1.5 dBTP. See `final/loudnorm-report.txt`.
