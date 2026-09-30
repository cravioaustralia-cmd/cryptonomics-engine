# Render — s22-loch-ard-peacock (Checkpoint C)

Standard **Skylab** build (photo underlay + premium SVG motion graphics) — **not** map-explainer.
Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg** via `shorts/shared/render/`. No Remotion.

## Files
- `scenes.js` — 13 beat-synced scenes, designed transitions (whip / flash / zoom / fade), karaoke captions
- `mix.mjs` — VO + music + SFX mix (see Mix below)
- `build.mjs` — mix → capture (shared `capture.mjs`) → mux → `final/` MP4 + contact sheet
- `preview.mjs` — render any timestamps / a contact sheet through the same page as the final capture
- `fonts/` — Anton, Montserrat 800/900, Playfair Display 900 / 700 italic (SIL OFL, Google Fonts)
- `assets/grain.png` — generated film-grain tile
- `../transcript.json` — faster-whisper `medium.en` word timings on `audio/vo.mp3` (hyphenated tokens merged)

## Build
```bash
cd shorts/shared/render && npm ci
cd ../../s22-loch-ard-peacock/render
node build.mjs            # add PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium in cloud containers
```
Output: `final/s22-loch-ard-peacock.mp4` (1080×1920, 30 fps, 40.200 s) and `final/contact-sheet.jpg`.

## Beats (Whisper-timed)
| Time | Underlay | Motion |
|---|---|---|
| 0.00–2.05 | Loch Ard Peacock | Frame-1 hook `THREE SURVIVORS` (unspoken), shock ring, `SHIPWRECK COAST · VICTORIA` chip |
| 2.05–6.44 | Loch Ard Gorge surge | Three survivor medallions pop on "three"; two silhouettes on "Two teenagers"; real peacock crop on "peacock" |
| 6.44–8.90 | Loch Ard SLV period photo (sepia) | `1878` slam (+ `1 June`), brass `LOCH ARD` nameplate with sheen |
| 8.90–10.45 | Mutton Bird Island, pre-dawn grade | Target reticle, impact shake + cracks on "rocks", dawn glow, sea mist, `MUTTON BIRD ISLAND` |
| 10.45–12.45 | Loch Ard with tug (period) | `54 ABOARD` count-up + 54-figure grid; 52 dim, 2 glow (respectful) → zoom |
| 12.45–16.30 | Loch Ard Gorge from the sea | `TOM PEARCE / SHIP'S APPRENTICE` card, current path into gorge, pin drop, `LOCH ARD GORGE` |
| 16.30–21.95 | Loch Ard Gorge (cool) | Scream sound-rings + waveform; `EVA CARMICHAEL / PASSENGER`; loss held by desaturation |
| 21.95–24.70 | Loch Ard Gorge beach | Rescue path: Tom out to Eva, both back to shore; landing burst on "shore" |
| 24.70–27.38 | Loch Ard Gorge (warm) | Hearts rise, gold rings interlock on "marry", snap apart on "didn't" |
| 27.38–31.05 | Gorge panorama → peacock | Third medallion "?" → iris reveal of the peacock, height rule, `MINTON MAJOLICA` |
| 31.05–34.30 | Loch Ard Gorge sand | Crate rides surf ashore, lands on "crate", lid pops, condition scan on "without a scratch" |
| 34.30–36.25 | Flagstaff Hill Maritime Village | `FLAGSTAFF HILL · WARRNAMBOOL`; museum plaque, soft `INSURED AT ABOUT A$4M` / *insurance valuation* |
| 36.25–40.20 | Loch Ard Peacock | Loop: medallions refill, `THREE SURVIVORS` slams back — last frame matches frame 1 |

Twelve Apostles still is **not used**. Captions sit at ~70% (y≈1344); all graphics stay clear of that band.

## Mix (audio remaster — Checkpoint C redo)
1. VO measured **−23.0 LUFS** (ebur128) → static **+5 dB** + `apad` — no loudnorm on VO
2. Music *Fallen (Asper)* static **−23 dB** bed (s18 Silent Descent was −19 dB → 4 dB quieter), +3.5 dB only in VO gaps ≥ 0.45 s
3. **Sparse SFX (8 cues):** hook slam 0.00 · 1878 slam 6.86 (in the VO gap) · rocks 8.98 · rescue riser 21.6 → shore 24.2 · reveal riser 26.75 → peacock iris 29.28 · loop whoosh 39.5. No text pops, typewriter ticks, rustles or stacked whooshes. Impact tails trimmed to 1.6–2.2 s.
4. Float `amix` (normalize=0) → peak safety limiter → **two-pass loudnorm on the master only** (−14 LUFS, −1.5 dBTP, linear)

Premix levels (same gains):

| Stem | Integrated | Sample peak | Max short-term |
|---|---|---|---|
| VO | −18.4 LUFS | −6.0 dBFS | −17.2 LUFS |
| Music | −36.2 LUFS | −20.3 dBFS | −34.7 LUFS |
| SFX | −34.7 LUFS | −18.6 dBFS | −34.1 LUFS |

SFX peaks sit **12.6 dB** under VO peaks. There are no SFX at all from 11.2–21.6 s or 31.5–39.5 s.
Final MP4: **−14.1 LUFS**, true peak −1.3 dBTP. Audio-only rebuild: `node build.mjs --remux`.
