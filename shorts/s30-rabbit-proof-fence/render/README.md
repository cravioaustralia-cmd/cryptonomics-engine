# Render — s30-rabbit-proof-fence (MAP EXPLAINER · Impossible Journeys ep.5)

This build uses **SVG + `renderFrame(t)` + Playwright + ffmpeg** through `shorts/shared/render/`. There is no Remotion. Maps carry the whole story. There are no photos, portraits, faces, emoji or visual gags.

The held Atlas VO at `audio/vo.mp3` (**94.392 s**) was not re-recorded and was not modified.

## Files
- `scenes.js` — the whole Short on one continuous camera with keyframed longitude, latitude, zoom, tilt and bearing. The camera and projection engine is shared with s28.
  - **Basemap:** satellite layers are placed with a CSS `matrix3d`, the exact projective map of a tilted ground plane.
  - **Overlays:** the fence thread, footprint trails, pins and labels are screen-space SVG projected through the same matrix.
- `make_basemap.py` builds `assets/map_*.jpg` and `map_layers.json` from open data. The layers are base, Western Australia, Moore River close-up and Jigalong close-up. The grade keeps relief soft with no blown white highlights. See `../images/SOURCES.md`.
- `fetch_tiles.py` fetches AWS Terrarium tiles into a local cache, which is not committed.
- `make_geo.py` builds `assets/geo.js` from Natural Earth: coast, state borders, the WA outline and the WA salt lakes.
- `make_ij_routes.py` builds `assets/ij_routes.js` by `git show` of the prior episodes' real polylines. Nothing is retyped. There is no episode 3 and no s29.
- `whisper_align.py` writes `whisper-raw.json` with faster-whisper medium.en. `snap_transcript.py` writes `../transcript.json` with the script's spelling and all 269 words. Whisper folded "mothers." into "their", so that seam is pinned by hand at 24.52–24.93 s, checked with silencedetect.
- `mix.mjs` is the locked mix path and writes `out/loudnorm-report.txt`.
- `build.mjs` runs the mix, a 4-worker capture, concat, mux, the `final/` MP4 and the contact sheet.
- `preview.mjs` renders chosen timestamps into a review sheet.

## Rebuild
```bash
cd shorts/shared/render && npm ci
cd ../../s30-rabbit-proof-fence/render
# basemap (only if regenerating):
#   python3 fetch_tiles.py 7 96 162 -48 6 ; python3 fetch_tiles.py 9 112.5 124.5 -35 -19
#   python3 fetch_tiles.py 11 115.3 117.0 -32.3 -30.3 ; python3 fetch_tiles.py 11 119.9 121.6 -24.3 -22.5
#   TILES=… NE=… BMNG=… python3 make_basemap.py && python3 make_geo.py
# python3 make_ij_routes.py   (needs 3db0f94 and origin/claude/s28-robyn-davidson-map-gwcpin fetched)
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs --workers 4
node build.mjs --remux     # audio-only rebuild onto the existing silent video
```

## Beats (Whisper-timed, 94.392 s)
| Time | VO | On the map |
|---|---|---|
| 0.00–5.4 | Three girls… walked home | **Frame 1:** tilted satellite over Moore River. The fence is already a faint glowing thread to the north-east, and three footprint trails are just starting to move. The hook `1,600 km. NO MAP` shows on frame 1, clears by 1.5 s and is never spoken. A dashed route draws toward home with a `1,600 KM` counter, then the camera lifts to Western Australia and the `JIGALONG` pin glows. |
| 6.0–13.1 | 1931 / Molly / Daisy / Gracie | An extruded `1931` becomes a small chip. Three marked dots at Jigalong pop on each name with `MOLLY · ABOUT 14`, `DAISY · ABOUT 8` and `GRACIE · ABOUT 11`. There are no portraits. |
| 13.7–18.8 | Aboriginal girls / families / Western Australia | The `JIGALONG` pin drops, and families appear as small warm pins only. The camera pulls back as Western Australia lights up with a white border and label. |
| 19.4–24.9 | government policy… mothers | A quiet grade darkens and desaturates the map, and the family pins dim. No officials are drawn. |
| 25.2–30.6 | taken… south… near Perth | A white dashed removal line with an arrowhead runs south and the three dots are carried along it. `1,600 KM` sits on the line. The `MOORE RIVER` and `PERTH` pins drop. |
| 31.0–33.4 | The very next day, Molly leads them out | A push-in on the Moore River close-up layer. Three trails leave the camp and the **day counter starts at DAY 1**. |
| 33.6–42.0 | rabbit-proof fence… whole state… by home | The **fence self-draws** from the south coast to the north coast as a glowing thread with a travelling spark, labelled `RABBIT-PROOF FENCE`. Rings pulse where it passes Jigalong. |
| 42.3–50.5 | tracker / footprints / burrows / rabbits / river | A muted dashed pursuit line follows the trail, then loses it as the footprints fade. A short night grade shows burrow notches beside the trail and one soft warm glow at the food stop, with no animals drawn. The trails then cross an unnamed flooded river band with a ripple. |
| 50.9–55.8 | For weeks… farms, sand dunes and salt lakes | The day counter grows and the camera tracks north then pulls out. Wheatbelt paddocks, dune ridges and the Lake Moore and Lake Barlee salt lakes light up on their words without labels. |
| 56.3–61.3 | Gracie… nearby town… caught | An **unnamed** grey town dot appears. Gracie's trail branches off and stops short of it, turning grey with a hollow ring. **Three trails become two.** No capture is shown. |
| 61.7–66.5 | nine weeks… Molly and Daisy… Home. | The counter lands on **NINE WEEKS**. **Two trails reach the Jigalong pin**, and a warm home glow pulses on "Home." |
| 67.0–76.5 | Ten years later… second time | A `+10 YEARS` chip. Molly's dot and two small daughter dots are carried back to the camp. A second, pale-blue trail runs north along the same fence, and one small dot travels with her for the baby. No people are drawn. |
| 76.7–81.8 | older daughter behind… over twenty years | **One pin stays at Moore River** with a slow pulse, under a quiet grade. A `20+ YEARS` dimension line runs between the camp and home. |
| 82.3–86.5 | taught everywhere / a like helps | A held pull-back over Western Australia. No emoji and no mascot. |
| 86.9–92.6 | episode five… map next | The **master map** joins this route in gold, tagged `EP. 5`, with the real loaded polylines for `EP. 1` Mary Bryant, `EP. 2` Bert Hinkler and `EP. 4` Robyn Davidson. An `IMPOSSIBLE JOURNEYS` chip shows. There is no episode 3 and no s29. |
| 92.96–94.39 | Because it all began with | The **incomplete loop**: the camera swoops back to the frame-1 composition, the fence dims to its faint thread, the three opening trails return and the hook re-slams. The last frame matches frame 1 for "Three girls." |

## Mix (`mix.mjs`, locked path)
1. The VO measured −23.5 LUFS, so it gets a static +5.5 dB plus `apad`. There is no VO loudnorm.
2. Skyline (Eugenio Mininni, Mixkit 601) is static at a bed target of −36.2 LUFS, which is s18's −32.2 minus 4 LU. It gets +3 dB only in VO gaps of 0.45 s or more, and −2 dB on the policy line and the daughter line. It never drops out.
3. There are 9 sparse SFX events of 6 types: hook impact, home whoosh, camp thud, day-1 tick, fence riser, Gracie thud, a soft "Home." impact, master-map whoosh and loop whoosh.
4. A float `amix` (normalize=0) feeds a peak-safety limiter, then a **two-pass loudnorm on the master only** at −14 LUFS and −1.5 dBTP. See `final/loudnorm-report.txt`.
