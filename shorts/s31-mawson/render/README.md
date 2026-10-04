# Render — s31-mawson (MAP ANIMATION · Impossible Journeys ep.6)

This build uses **SVG + `renderFrame(t)` + Playwright + ffmpeg** through `shorts/shared/render/`. There is no Remotion. Kinetic cartography is the picture. The route, both crevasses, the sledge split and the ship leaving all happen on the map. The three public-domain portraits appear only as small name cards.

The held Atlas VO at `audio/vo.mp3` (**79.584 s**, md5 `e0337d21afde356decba37d9604a7581`) was not re-recorded, overwritten or modified.

## Files
- `scenes.js` — the whole Short on one continuous camera with keyframed longitude, latitude, zoom, tilt and bearing. The camera and matrix3d engine come from s28/s30, re-based on an **orthographic globe plane** centred on 146°E 52°S in kilometres. That keeps George V Land unstretched, and the same plane pulls back to Australia for the master map.
- `mix.mjs` — the locked mix path. It writes `out/final-mix.wav`, `out/final-mix.m4a` and `out/loudnorm-report.txt`.
- `build.mjs` — runs the mix, a 4-worker capture, concat and mux. The audio in the master is the measured AAC, stream-copied. It then measures the AAC true peak inside the MP4 and builds the contact sheet.
- `tools/make_basemap.py` — builds `assets/map_*.jpg` and `map_layers.json` from open data. The layers are globe, region, route, denison, fall and mcrev. See `../images/SOURCES.md`.
- `tools/make_geo.py` — writes `assets/geo.js` with the Natural Earth Antarctic coast, ice-shelf fronts, Australian coast and the glacier flow lines the basemap grades.
- `tools/make_ij_routes.py` — writes `assets/ij_routes.js` by `git show` of the prior episodes' real polylines. Nothing is retyped.
- `tools/make_cards.py` — writes square name-card crops of the three PD portraits to `assets/card_*.jpg`.
- `tools/whisper_align.py` and `tools/snap_transcript.py` — faster-whisper medium.en word timings, snapped to `script.md` spelling, written to `../transcript.json`. All 204 words matched. Only "kilometers" and "6" were respelled to "kilometres" and "six".
- `tools/preview.mjs` and `tools/frame.mjs` — review sheets and full-resolution frames through the exact capture page.

## Rebuild
```bash
cd shorts/shared/render && npm ci
cd ../../s31-mawson
python3 render/tools/whisper_align.py && python3 render/tools/snap_transcript.py   # only to re-time
cd render/tools
TILES=/tmp/claude-0/tiles NE=/tmp/claude-0/ne python3 make_basemap.py   # fetches Terrarium tiles it needs
python3 make_geo.py && python3 make_cards.py
git fetch origin claude/model-opus-8eaepb claude/s28-robyn-davidson-map-gwcpin claude/model-opus-v3027k
python3 make_ij_routes.py
cd .. && PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs --workers 4
```

## Beats (Whisper-timed, 79.584 s)
| Time | VO | On the map |
|---|---|---|
| 0.00–1.6 | Three men set out | **Frame 1:** tilted ice satellite over Commonwealth Bay. Three sledges are already leaving the base pin eastward, the ship is at anchor, and a faint snow-camel drift is hidden in the ice. The hook `A FEW HOURS` shows on frame 1 only, is never spoken, and clears by 1.65 s. |
| 1.1–2.6 | across Antarctica | The camera lifts to the continent with a glowing coast and an `ANTARCTICA` label. |
| 2.7–6.6 | Only one came back… a few hours | The camera swoops back down. Two sledges dim and one stays bright. At the base the ship pulls away with a wake. Nothing is named and no hours are printed. |
| 7.9–13.0 | 1912 · Douglas Mawson · east from his base | An extruded `1912` settles into a chip. The Mawson name card appears. The `CAPE DENISON` pin label and `COMMONWEALTH BAY` water label show, and the gold route starts drawing east. |
| 14.6–20.3 | two friends · Ninnis / Britain · Mertz / Switzerland | **The only gag:** a woolly hat on each sledge, with a British flag pin by Ninnis and a Swiss flag pin by Mertz. The Ninnis and Mertz cards appear. The gag and the snow-camel are gone by 20.3 s. |
| 20.4–23.0 | Five weeks in, about 500 kilometres | The camera pulls out, the route races east and a `~500 KM` dimension line runs along it. |
| 24.0–27.8 | hidden crevasse · gives way · He's gone | A push-in shows a faint dashed snow bridge. The two lead sledges cross it. It opens under Ninnis's sledge, which slips in and is gone. A few snow grains settle and a quiet hollow ring marks the place. There is no figure and no gore. |
| 28.4–32.9 | tent · most of the food · six best dogs | Three labels only. They sink into the crevasse. |
| 33.2–37.0 | turn back · eat their remaining dogs | The two sledges U-turn. The pale return line draws and the **`DISTANCE TO BASE` counter starts at ~500 KM**. The eating is not shown. |
| 37.8–42.0 | husky liver · vitamin A | One serious `VITAMIN A` label. |
| 42.8–47.0 | Mertz weaker · January 1913 · dies | Mertz's sledge dims and falls behind. A `JANUARY 1913` chip shows. His sledge stops and fades to a quiet ring. |
| 48.0–51.0 | alone, about 160 km | The camera pulls out and a `~160 KM` dimension runs from the ring to the base. The counter reads about 160. |
| 51.7–53.8 | saws his sledge in half | A cut flash, then **the sledge icon snaps in two**. The back half is left on the route and fades. |
| 54.4–58.3 | crevasse · dangles on a rope · climbs out | A close-up on the Mertz Glacier. A slit opens ahead, his marker drops in on a dashed rope, sways, then climbs back to the sledge. |
| 59.3–64.7 | sees his base · ship sailing away · hours before | The counter runs to 0 as he reaches the pin. **The ship leaves the bay just as he arrives** and sails north with a wake. |
| 65.6–68.6 | another whole winter | The map darkens. An aurora and a wind-driven snow drift appear, with a warm hut glow at the base pin. |
| 68.9–73.6 | Ninnis Glacier · Mertz Glacier | Daylight returns over the coast. The glaciers glow and are labelled on their words, at their Wikipedia coordinates. |
| 74.2–78.6 | episode six of Impossible Journeys | The camera pulls back to the globe. This route is tagged `EP. 6` in gold, and the **loaded** polylines draw for `EP. 1`, `EP. 2`, `EP. 4` and `EP. 5`, under an `IMPOSSIBLE JOURNEYS` chip. There is no episode 3 and no s29. |
| 78.7–79.58 | Because once, | The **incomplete loop**: the camera swoops back to the frame-1 composition, the three sledges return, and `A FEW HOURS` re-slams into "Three men set out". The snow-camel does not return. |

## Mix (`mix.mjs`, locked path)
1. The VO measured −23.0 LUFS and gets a static +5.0 dB plus `apad`. There is no VO loudnorm.
2. Skyline (Eugenio Mininni, Mixkit 601) is static at −36.2 LUFS, which is s18's −32.2 minus 4 LU. It lifts +3 dB only in VO gaps of 0.45 s or more and dips 2.5 dB under the two deaths.
3. There are 8 SFX events of 6 types, all well under the voice. No record-scratch is used, and nothing is playful after the crevasse.
4. A float `amix` (normalize=0) feeds a 4x-oversampled peak limiter, then a two-pass loudnorm on the master only, which stays linear, at −14 LUFS.
5. The AAC is encoded and **its true peak is measured**, in `final-mix.m4a` and again inside the master MP4. The limiter aim is −2.4 dBTP on the WAV, and the chain re-runs lower if the AAC is over −1.5 dBTP.
