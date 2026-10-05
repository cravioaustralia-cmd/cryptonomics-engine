# Render — s32-phar-lap (MAP ANIMATION · Impossible Journeys ep.7)

This build uses **SVG + `renderFrame(t)` + Playwright + ffmpeg** through `shorts/shared/render/`. There is no Remotion. Kinetic cartography is the picture. The route, the warts zoom, the catalogue flip, the near-miss duck, the three-city split with its tug-of-war rope, and the Flemington crowd camel all happen on the map. The two public-domain stills appear only as small name cards.

The held Atlas VO at `audio/vo.mp3` (**74.76 s**, md5 `2d666eedc427e6e7193268044850f713`) was not re-recorded, overwritten or modified.

## Files
- `camera.js` — the one continuous camera, shared by the page and by node. It keys look-at longitude/latitude, zoom, tilt and bearing over three **orthographic planes**: A (160°E 37°S, Tasman), B (118°W 33°N, California and Baja) and M (178°W 4°S, the whole Pacific). Between planes the projection centre slerps, which is a **globe spin**.
- `scenes.js` — every overlay, projected through the same camera: routes, the chestnut horse token, pins, the five gags, the two racecourse insets, labels, chips, name cards, the master map and karaoke captions.
- `mix.mjs` — the locked mix path. It writes `out/final-mix.wav`, `out/final-mix.m4a` and `out/loudnorm-report.txt`.
- `build.mjs` — renders spin frames, mixes, runs a 4-worker capture, concats and muxes. The audio in the master is the measured AAC, stream-copied. It then measures the AAC true peak inside the MP4 and builds the contact sheet.
- `tools/make_basemap.py` + `tools/geo_common.py` — build `assets/map_*.jpg` and `map_layers.json` from open data (see `../SOURCES.md`). They also build the graded world texture `cache/equi.jpg` used by the spins.
- `tools/dump_spins.mjs` + `tools/make_spin.py` — dump the exact camera of every spin frame, then render that frame's basemap from the world texture. Output goes to `cache/spin/`, which is not committed and is rebuilt by `build.mjs`. Only frames whose camera changed are re-rendered.
- `tools/make_geo.py` — writes `assets/geo.js` with Natural Earth outlines for Australia, New Zealand, Mexico and California, used for the region highlights.
- `tools/make_ij_routes.py` — writes `assets/ij_routes.js` by `git show` of the prior episodes' real polylines. Nothing is retyped.
- `tools/make_cards.py` — writes the two name-card crops of the PD stills.
- `tools/whisper_align.py` and `tools/snap_transcript.py` — faster-whisper medium.en word timings, snapped to `script.md` spelling, written to `../transcript.json`. All 192 words matched. Whisper gave "1926" zero length, so its span is set from ffmpeg silencedetect to 7.01–7.95 s. That fix is documented in the script.
- `tools/preview.mjs` and `tools/frame.mjs` — review sheets and full-resolution frames through the exact capture page.

## Rebuild
```bash
cd shorts/shared/render && npm ci
cd ../../s32-phar-lap
pip install numpy scipy pillow faster-whisper basemap-data
python3 render/tools/whisper_align.py && python3 render/tools/snap_transcript.py   # only to re-time
mkdir -p /tmp/claude-0/ne && for f in ne_10m_land ne_10m_minor_islands ne_10m_lakes ne_10m_admin_0_countries ne_10m_admin_1_states_provinces; do
  curl -sS -o /tmp/claude-0/ne/$f.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/$f.geojson; done
cd render/tools
python3 make_basemap.py          # fetches the Terrarium tiles it needs into $TILES (default /tmp/claude-0/tiles)
python3 make_geo.py && python3 make_cards.py
git fetch origin claude/model-opus-8eaepb claude/s28-robyn-davidson-map-gwcpin claude/model-opus-v3027k claude/model-opus-exnwqa
python3 make_ij_routes.py
cd .. && PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs --workers 4
```

## Beats (Whisper-timed, 74.76 s)
| Time | VO | On the map |
|---|---|---|
| 0.00–1.85 | Australia's greatest racehorse | **Frame 1:** tilted Tasman satellite. The chestnut horse token is just leaving Timaru and gallops across the water to Sydney as the gold route draws. A `~2,100 KM` dimension line runs alongside. The hook `THREE CITIES` shows on frame 1 only, is never spoken, and clears by 1.65 s. |
| 1.55–3.45 | was born in New Zealand | The globe turns east as the dotted white route stretches across the Pacific to a Mexico pin. New Zealand's outline glows with a `NEW ZEALAND` label. |
| 3.55–5.0 | …and after he died | The globe turns back to the Tasman. The map dims slightly. |
| 5.38–6.9 | three cities split him up | **Gag 4 (flash-forward):** pins light at Melbourne `HIDE`, Wellington `SKELETON` and Canberra `HEART`, and the tug-of-war rope stretches across the Tasman. |
| 7.0–8.6 | 1926 | Swoop to Canterbury. An extruded `1926` settles into a chip. |
| 8.7–12.0 | foal · near Timaru, New Zealand | Pin drop and the foal token. `NEAR TIMARU` and `NEW ZEALAND` show on their words. |
| 12.5–14.1 | Warts all over his head | **Gag 1:** a cartoon magnifier zooms on the foal's face. Warts pop on one by one, then a springy **boing**. |
| 14.2–15.0 | Nobody's impressed | A deadpan hold. |
| 15.5–17.6 | picked out of a sales catalogue | **Gag 2:** a sales catalogue rises over Timaru, a page flips, and one entry (a tiny chestnut foal) is circled in red. |
| 17.5–19.0 | shipped to Australia | The foal rides a boat across the Tasman as the route draws. A `~2,100 KM` dimension line, Australia's outline glow and a `SYDNEY` pin follow. |
| 19.3–22.4 | named Phar Lap · "lightning" in Thai | He grows into the full horse token. A `PHAR LAP` label and the small PD name card appear. A lightning bolt zaps and a `"LIGHTNING"` chip shows. |
| 22.9–27.4 | winning · 37 of 51 | He gallops Sydney to Melbourne on a gold trail with win flashes. A tally grid fills to `37`, then `/51` lands on "fifty-one". |
| 27.4–31.0 | someone tries to shoot him | Push to Flemington. **Gag 3:** a near-miss streak whooshes just over his head and the token **ducks**. No weapon is drawn. |
| 31.4–33.4 | 1930 Melbourne Cup | `1930` and `MELBOURNE CUP` chips and a `FLEMINGTON` label show. A racecourse inset grows out of the pin: track, rails, the field and the crowd. **The camel motif** is tiny, sand-coloured and unlabelled in the crowd on the straight. |
| 33.4–35.0 | He wins it anyway | He crosses the post first with a gold burst, and the crowd lifts. The 1930 Melbourne Cup PD card appears. |
| 35.0–38.3 | 1932 · across the Pacific to Mexico | `1932`, then the globe turns from the Tasman to California as the boat token crosses on the dotted route. Labels `PACIFIC OCEAN` and `~12,100 KM` show. |
| 38.3–42.3 | richest race · He wins that too | Mexico's outline glows. The `AGUA CALIENTE` pin with `TIJUANA` gets a gold glow with glints. A gold-bordered course inset shows him winning again. |
| 42.8–47.6 | two weeks later · California · ill… and dies | A `+2 WEEKS` chip shows. A short dotted hop runs north. California's outline glows with its label. The map desaturates, and the token slows, stops and greys with a quiet ring. No town is labelled, and there is no gore and no cartoon death. |
| 48.0–54.9 | poisoned? · arsenic · infection · never ended | Two question chips, `ARSENIC?` and `INFECTION?`, sit on a beam that keeps tipping and never settles. There is no verdict. |
| 54.9–56.6 | both countries want him | The globe turns back. Australia and New Zealand glow. |
| 57.3–65.3 | hide · skeleton · heart | The pins light on their words: Melbourne `HIDE`, Wellington `SKELETON`, Canberra `HEART`. The rope stretches and tugs, with the red centre flag swaying. On "twice the size" a big beating heart grows beside a normal one with `~2×`. |
| 65.9–68.5 | still your hero · like | A warm golden hold on the three pins and the rope. |
| 68.7–73.3 | episode seven of Impossible Journeys | The globe turns to the whole Pacific. This route is tagged `EP. 7` in gold. The **loaded** polylines draw for `EP. 1`, `EP. 2`, `EP. 4`, `EP. 5` and `EP. 6` under an `IMPOSSIBLE JOURNEYS` chip. There is no episode 3 and no s29. |
| 73.4–74.76 | Because, believe it or not, | The **incomplete loop**: the globe turns back to the frame-1 Tasman composition, the horse is back at Timaru, and `THREE CITIES` re-slams into "Australia's greatest racehorse…". |

## Mix (`mix.mjs`, locked path)
1. The VO measured −23.1 LUFS and gets a static +5.1 dB plus `apad`. There is no VO loudnorm.
2. Skyline (Eugenio Mininni, Mixkit 601) is static at −36.2 LUFS, which is s18's −32.2 minus 4 LU. It lifts +3 dB only in VO gaps of 0.45 s or more and dips 2.5 dB under the death.
3. There are 9 SFX events of 7 types, all about 20 LU under the voice. The boing is synthesised with ffmpeg. No record-scratch is used.
4. A float `amix` (normalize=0) feeds a 4x-oversampled peak limiter, then a two-pass loudnorm on the master only, which stays linear, at −14 LUFS.
5. The AAC is encoded and **its true peak is measured**, in `final-mix.m4a` and again inside the master MP4. The limiter aims for −2.4 dBTP on the WAV, and the chain re-runs lower if the AAC is over −1.5 dBTP.
