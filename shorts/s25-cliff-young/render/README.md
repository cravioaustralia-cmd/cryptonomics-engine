# Render — s25-cliff-young (Checkpoint C)

Standard **Skylab** build: photo underlay plus premium SVG motion graphics. It is **not** map-explainer primary; one route-map card is used, on a GeoGlobeTales-grade Blue Marble basemap.
Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg** via `shorts/shared/render/`. No Remotion.

## Files
- `scenes.js` — 16 Whisper-timed scenes with a hand-built prop kit: gumboot, running shoe, sheep, stroke pictograms (runner, shuffler, helpers), race tokens with sponsor stickers, a guilty alarm clock, tents with zzz, a podium and confetti. Designed transitions (whip, flash, zoom, fade) and karaoke captions at ~70%.
- `whisper_align.py` — faster-whisper `medium.en` word timestamps on the held `audio/vo.mp3` → `whisper-raw.json`
- `snap_transcript.py` — snaps Whisper tokens to the `script.md` spelling and punctuation → `../transcript.json`. Timing is Whisper's; there were 0 alignment mismatches across all 231 words.
- `mix.mjs` — VO, music and sparse SFX (see Mix below); writes `out/loudnorm-report.txt`
- `build.mjs` — mix → capture (shared `capture.mjs`) → mux → `final/` MP4 and contact sheet
- `preview.mjs` — renders chosen timestamps or a contact sheet through the same page as the final capture
- `fonts/` — Anton, Montserrat 800/900, Playfair Display (SIL OFL; same kit as s22 and s23)
- `assets/grain.png` — film grain (same as s23)
- `assets/basemap_se.jpg` — SE Australia crop of NASA Blue Marble (public domain; see `../images/SOURCES.md`)

`shared/render/capture.mjs` carries the s22/s23 version byte-for-byte: exported `openEpisodePage`, the `/ep/*` asset route and `PLAYWRIGHT_CHROMIUM`.

## Build
```bash
cd shorts/shared/render && npm ci
cd ../../s25-cliff-young/render
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs   # cloud container
node build.mjs --remux                                          # audio-only rebuild
```
Output: `final/s25-cliff-young.mp4` (1080×1920, 30 fps, 87.336 s) and `final/contact-sheet.jpg`.

## Beats (Whisper-timed)
| Time | Underlay | Motion |
|---|---|---|
| 0.00–8.60 | Rubber boots (`s25_01`) | Frame-1 hook `61 · GUMBOOTS` slam (unspoken), `1983` chip, potato sticker on "potato farmer", toughness gauge pinned red on "toughest", overalls drop, gumboots slam on "gumboots" |
| 8.60–13.20 | Apollo Bay / Otways (`s25_02`) | Gold Cliff token, `CLIFF YOUNG` slab plus sheen, age line 0 → 61 with a jogging pictogram from ~57 and a soft `~61` chip |
| 13.20–21.40 | Blue Marble map card over Sydney | Pins `SYDNEY` then `MELBOURNE`, route self-draws, footprints on "on foot", `875 KM` counter, pro markers line up beside Cliff |
| 21.40–26.80 | NSW country road | **Gag 1:** the pro token is covered in 12 invented sponsor stickers on "sponsors", coaches with clipboards, a sparkling shoe. Spotlight swings to Cliff, who gets **one sheep sticker** in the "has…" pause, then gumboots drop on "gumboots". |
| 26.80–30.45 | Australia Day crowd | Laughing-face bubbles, camp chair slides under Cliff, `SPECTATOR` pass swings on (prop text) |
| 30.45–38.10 | NSW road | `START` banner, starter flash, pros sprint off with speed blur, Cliff's slow shuffle, car-keys thought bubble and magnifier sweep |
| 38.10–42.00 | Road, night grade | **Gag 2:** moon and stars, pro tokens in tents with floating **Z z z**, Cliff shuffles past with a head-torch beam |
| 42.00–49.30 | Night grade | Clock dial: a team hand twists the knob wrong, 2-hour sleep wedge, `~2 H`. **Gag 3:** on "Best mistake ever" the dial sprouts bells and legs and turns into a **guilty cartoon alarm clock** (side-eye, worried brows, sweat drop, ringing wobble). |
| 49.30–53.40 | Road, dawn grade + sunrise | Map zoom: broadcast rings from Cliff's marker (in the lead), radio and newspaper icons fly out, pros behind |
| 53.40–58.85 | Apollo Bay sheep (`s25_03`) | Padlock unlocks on "secret training", Cliff pictogram herds sheep round a paddock loop, sun/moon wheel and tally marks on "for days" |
| 58.85–63.35 | Boots, blurred | Gumboot flips to a running shoe. **Gag 4:** shoe counter ticks **×1 → ×10** (0.16 s per tick, one **ding** each) while the shoe pile stacks. |
| 63.35–68.60 | Road, dawn grade | Day flip card 1 → 5, 24-hour ring with a small sleep slice, progress track where Cliff's marker slowly catches the leaders |
| 68.60–74.90 | Flinders Street, Melbourne | `5D` `15H` `4M` built on each spoken number, `MELBOURNE` chip, `FINISH` arch, tape breaks. **Gag 5a:** white flash, shock ring and **confetti** burst on "First." |
| 74.90–78.70 | Melbourne, dimmed | **Gag 5b:** cut to **gumboots on the podium** (1st). The warm spotlight softens and two helpers gently support Cliff off the stage, with the boots left on the podium. Kept respectful, no mockery. |
| 78.70–84.20 | Crowd, warm | Soft `$10,000` chip with sheen, coins split and fly to other runners' tokens and team tokens |
| 84.20–87.336 | Boots | Loop callback (laugh bubbles) on "…laughed at when," then a whip and flash back to the exact frame-1 `61 · GUMBOOTS` composition (incomplete loop) |

## Mix (`mix.mjs`, locked path)
1. VO measured **−23.2 LUFS** (ebur128) → static **+5.2 dB** + `apad`. There is no loudnorm on the VO.
2. Music *Better Times Are Coming* (Mixkit 173) from 0 s. The window measured −12.3 LUFS, so static **−23.9 dB** puts the bed at **−36.2 LUFS**, which is 4 LU under s18's original Silent Descent bed (−32.2 LUFS). It gets +3 dB only in VO gaps of 0.45 s or more.
3. **Sparse SFX:** 10 beat cues plus the shoe-counter dings.
   - Beat cues: hook slam 0.00, map whoosh 13.95, 875 KM hit 17.06, pros whoosh 31.78, soft zzz 39.2, alarm pop 48.0, riser 72.3, "First." impact 74.44, confetti pop 74.46, loop whoosh 86.95.
   - Dings: 10 at 61.78 + k·0.16 s (Gag 4, one per tick).
   - `ding.wav`, `zzz_soft.wav` and `confetti_pop.wav` are synthesised in-repo (see `../sfx/sources.tsv`). There are no text pops or typewriter chatter.
4. Float `amix` (normalize=0) → peak safety limiter → **two-pass loudnorm on the master only** (−14 LUFS, −1.5 dBTP, linear). See `out/loudnorm-report.txt` after a build.
