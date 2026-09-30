# Render — s23-wild-camels-ghan (Checkpoint C)

Standard **Skylab** build (photo underlay + premium SVG motion graphics) — **not** map-explainer.
Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg** via `shorts/shared/render/`. No Remotion.

## Files
- `scenes.js` — 15 Whisper-timed scenes, designed transitions (whip / flash / zoom / fade), karaoke captions at ~70%
- `mix.mjs` — VO + music + sparse SFX mix (see Mix below)
- `build.mjs` — mix → capture (shared `capture.mjs`) → mux → `final/` MP4 + contact sheet
- `preview.mjs` — render any timestamps / a contact sheet through the same page as the final capture
- `fonts/` — Anton, Montserrat 800/900, Playfair Display 900 / 700 italic (SIL OFL, Google Fonts; same kit as s22)
- `assets/grain.png` — film-grain tile (same as s22)
- `../transcript.json` — faster-whisper `medium.en` word timings on `audio/vo.mp3` (spelling fixed to script: *cameleers*, *The Ghan*)

`shared/render/capture.mjs` carries the s22 version (exported `openEpisodePage`, `/ep/*` asset route, `PLAYWRIGHT_CHROMIUM`) byte-for-byte, so it merges cleanly with PR #44.

## Build
```bash
cd shorts/shared/render && npm ci
cd ../../s23-wild-camels-ghan/render
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium node build.mjs   # cloud container
node build.mjs --remux                                          # audio-only rebuild
```
Output: `final/s23-wild-camels-ghan.mp4` (1080×1920, 30 fps, 43.008 s) and `final/contact-sheet.jpg`.

## Beats (Whisper-timed)
| Time | Underlay | Motion |
|---|---|---|
| 0.00–2.50 | Feral herd, Central Australia (`s23_01`) | Frame-1 hook `OVER A MILLION` (unspoken; kicker `WILD CAMELS`), shock ring, dust |
| 2.50–5.75 | Desert camels (`s23_06`) | `ARABIA` / `ASIA` chips struck through on each word → Australia outline self-draws, pin drop + `AUSTRALIA` on "Australia" |
| 5.75–10.15 | The Ghan locomotive (`s23_16`) | Sly tease: cameleer medallion (1891 print) on "people", ring on the loco's camel logo on "train", gold link on "named after", `?` |
| 10.15–13.20 | Strangways Springs 1872 (sepia) | `1860s` slam; heat sun + shimmer; horse silhouette slows and droops; camel strides in on "so" |
| 13.20–18.60 | Winton 1911 camel string (archival print) | Sea route arc; camel icons stream in (rate climbs on "thousands") and fill the map; `INDIA` / `PAKISTAN` chips on the words |
| 18.60–24.85 | Cameleers c.1891 + decorated camel 1901 (prints) | Prints dealt; `AFGHANISTAN` · `INDIA` · `PAKISTAN` on each word; `AFGHANS` ink stamp on "Afghans" |
| 24.85–26.10 | Hergott Springs 1905 loaded camel train | Load brackets lock onto the sacks on "supplies" |
| 26.10–28.15 | Hurley: railway + Overland Telegraph, Central Australia | Rails glow to the horizon on "railways" (clipped above captions); wire pulses on "telegraph"; `OVERLAND TELEGRAPH` |
| 28.15–30.05 | Archival Overland Telegraph line map card over the Ghan at Alice Springs | Route draws Adelaide → Darwin with pins, `ADELAIDE–DARWIN` |
| 30.05–33.45 | The Ghan carriage livery panel | Sheen on the name, ring on the logo, soft *widely said*, link from the cameleer medallion on "named after them" |
| 33.45–35.10 | Birdsville 1926 camels (print) | 1920s lorry rolls in on "trucks"; the camel string walks off on "replace" |
| 35.10–36.70 | Lone feral camel, Newhaven (NT) | Stock gate swings open on "free", sun flare (gradual release — no one-day stamp) |
| 36.70–38.95 | Outback camels (NT) | Map stipples with the herd across the arid interior; `OVER A MILLION` reprise on "million" (no census number) |
| 38.95–42.05 | Camel muster, APY Lands (SA) | Shipping tag swings in; destination types `SAUDI ARABIA`; `AUSTRALIA` chip |
| 42.05–43.008 | Feral herd (`s23_01`) | "So yes." → whip back; `OVER A MILLION` lands on the exact frame-1 framing |

`s23_07` (Afghans resting) is **not used**: a camel lying on its side could read as a carcass. No Arabia / Sahara / Gobi stand-ins; every camel still is Australian.

## Mix
1. VO measured **−22.7 LUFS** (ebur128) → static **+5 dB** + `apad` — no loudnorm on VO
2. Music *Between Two Evils* from 0 s: window measured −19.4 LUFS → static **−16.8 dB**, so the bed sits at **−36.2 LUFS** = 4 LU under s18's original Silent Descent bed (−32.2 LUFS measured); +3.5 dB only in VO gaps ≥ 0.45 s
3. **Sparse SFX (9 cues):** hook slam 0.00 · Australia pin 4.94 · whip 9.95 → 1860s slam 10.34 · AFGHANS stamp 23.8 · lorry whoosh 33.62 · riser 36.2 → OVER A MILLION 38.14 · loop whoosh 42.0. No text pops or typewriter chatter.
4. Float `amix` (normalize=0) → peak safety limiter → **two-pass loudnorm on the master only** (−14 LUFS, −1.5 dBTP, linear)

Premix stems (same gains): VO −18.1 LUFS / −6.0 dBFS peak · music −35.9 LUFS · SFX −37.1 LUFS, SFX peaks 14.6 dB under VO peaks. Master −13.9 LUFS.
