# Render — s29-darwin-stuck (MAP EXPLAINER)

SVG + `renderFrame(t)` + Playwright + ffmpeg. No Remotion. Reuses `shorts/shared/render/` (`frame.html`, `engine.js`, `capture.mjs`).

## Files

| File | Role |
|---|---|
| `scenes.js` | Episode scenes. One eased camera over a Web Mercator satellite mip chain, map-space SVG (rails, arrows, pins, labels, gags), screen-space UI (hook card, chips, envelopes, Related arrow, captions). All timings from `../transcript.json`. |
| `build_basemap.py` | Builds `../images/map/*` from AWS Terrain Tiles + NASA Blue Marble (GeoGlobeTales look, no blown white relief). |
| `make_horn.py` | Synthesises `../sfx/sad_horn_toot.wav` (gag 3). |
| `mix.mjs` | Measure VO → static gain + apad → float amix (music + 10 SFX) → two-pass loudnorm on the master (−14 LUFS / −1.5 dBTP). Writes `../final/loudnorm-report.txt`. |
| `build.mjs` | mix → capture (JPEG q95, x264 crf 18 slow) → mux → `../out/` + `../final/s29-darwin-stuck.mp4`. |
| `preview.mjs` | Stills at chosen times; `--sheet` renders the contact-sheet times. |

## Run

```bash
cd shorts/shared/render && npm ci
pip install numpy pillow scipy           # basemap + horn only
python3 shorts/s29-darwin-stuck/render/build_basemap.py   # optional: images/map is committed
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s29-darwin-stuck/render/build.mjs
```

`PW_CHROMIUM_PATH` is only needed when Playwright's bundled Chromium is not installed.

## Beat map (Whisper seams)

| t (s) | Beat | Visual |
|---|---|---|
| 0.0 | Japan could have captured Darwin… stuck | Frame-1 hook `ROAD TO NOWHERE` (green guide sign, never spoken); dashed intent arrow into Darwin; desert hint; camera drifting |
| 4.8–6.3 | Blame the map | **Gag 1** map sheet shrugs: top corners lift like shoulders (displacement warp) |
| 6.3–13.2 | admirals / northern Australia / bombed / people gone | Pull out; NT highlight + real borders; pin drop; `1942`; soft shock rings; town dots drift away |
| 13.7–15.8 | landing there? Probably possible | Red landing arrow + craft chevrons + beach ripples |
| 16.2–17.7 | But then look south | Whip south to continental view |
| 18.1–21.0 | Thousands of km of desert / cities | Desert glow; Darwin→Adelaide line `2,600 km`; city pins |
| 21.5–27.8 | railway / Birdum / Alice Springs | **Gag 2** rail self-draws, buffer stop + `DEAD END` sign at Birdum; south line draws up to Alice Springs |
| 27.8–32.3 | In between? ~1,000 km of no railway at all | Gap pulse; arrowed line `~1,000 km`; **Gag 3** train chugs to end of track, stops, sad horn toot at 32.30 |
| 32.7–34.3 | not a road into Australia | Dashed road-intent pushes south and fizzles in the gap |
| 34.8–37.2 | road to nowhere | **Gag 4** tumbleweed rolls across the gap |
| 36.6–44.8 | trap / stranded / supply lines / said no | Ring tightens on the north; stranded-army icon; supply arc to Japan `5,400 km`; `NO` stamp at 44.42 |
| 45.1–48.6 | scenario one / even wilder | `SCENARIO 1` chip; **Gag 5** envelopes 2 + 3 bounce and glow |
| 49.7–50.6 | linked right here | **Gag 6** yellow arrow points down to the Related-video area (no URL) |
| 50.9–51.9 | Because remember: | Whip back to the frame-1 composition → loop |
