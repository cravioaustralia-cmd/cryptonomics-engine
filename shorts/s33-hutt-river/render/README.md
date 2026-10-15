# s33 Hutt River — render

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg (shared engine in `shorts/shared/render/`). No Remotion.

## Files
- `build_data.py` — maps Whisper word timings (`whisper_raw.json`, faster-whisper small.en on `audio/vo.mp3`) onto the script's display words → `../transcript.json`; projects Natural Earth AUS states → `map_data.js`.
- `scenes.js` — all beats, captions and the custom `renderFrame`.
- `config.json` — duration, music gain, SFX cues, contact-sheet times.
- `render.mjs` — `sheet` (contact sheet → `out/contact_sheet.jpg`), `mix`, `full` (→ `final/s33-hutt-river.mp4`).

```bash
python3 shorts/s33-hutt-river/render/build_data.py
(cd shorts/shared/render && npm install)
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s33-hutt-river/render/render.mjs sheet
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s33-hutt-river/render/render.mjs full
```
`CHROMIUM_PATH` is optional; use it when the installed Playwright's own browser build is missing.

## Beat plan (VO kept as recorded, 48.048 s; pauses already 0.3–0.5 s)
| t (s) | Beat | Underlay | Motion |
|---|---|---|---|
| 0.00 | Hook (frame-1 `HE LEFT AUSTRALIA. / WITHOUT MOVING.`) | Hutt River gate (HRP3) | hook card, `WESTERN AUSTRALIA · 1970` chip, red border ring draws round the farm road, outside darkens |
| 5.62 | Leonard Casley, 4,000 ha | OIC views (farmland) | polaroid drop, 10×10 wheat grid fills, counter to 4,000 |
| 10.66 | Quota → ~40 ha | same | 99 cells grey out, one stays lit, 4,000 struck through, `≈ 40` pops with leader |
| 13.45 | 21 April 1970 declaration | province paddock | tear-off calendar 19→20→21, flag (Commons SVG) rises and waves, light rays |
| 17.50 | Hutt River Province, 75 km², ~500 km from Perth | Natural Earth map | Australia → WA coast zoom, pin drop, true-scale 75 km² area, Perth pin, dotted route, scale bar |
| 23.45 | Prince Leonard | Prince Leonard bust | crown drops onto bust, brass plaque |
| 25.45 | Stamps / coins / passports | blurred passport-control desk | stamps card + postmark, two real coins flip in, UK passport + Hutt River visa stamp slam |
| 30.65 | War, 2 Dec 1977 | Hutt River government office | date chip, tiny flag vs continent, red wash + shake, `HOSTILITIES CEASED` stamp |
| 36.05 | Never recognised; tax | border road | spinning wireframe globe with 0, tax ledger counts to A$2.7m (2017 order), `UNPAID` stamp |
| 42.30 | 2020 hand-back | paddock | calendar 3 August 2020, flag lowers, scene desaturates |
| 45.35 | Loop: "Fifty years earlier…" | paddock → gate | rewind streaks, flag runs back up, year rolls 2020→1970 and lands in the frame-1 chip on the frame-1 gate framing |

Captions: word-by-word highlight, centred at y≈1352 (~70%); every graphic sits above y≈1240.

## Mix
VO (light compression) + Monkeys Spinning Monkeys (gain 0.30, sidechain-ducked by the VO) + 14 sparse SFX cues → two-pass loudnorm −14 LUFS, TP target −2.2, limiter, AAC 256k. The final MP4's decoded loudness and true peak are printed at the end of `full`.
