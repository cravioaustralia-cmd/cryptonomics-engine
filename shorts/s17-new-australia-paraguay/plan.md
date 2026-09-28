# Shot plan — s17-new-australia-paraguay (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, voyage arc, locked map treatment. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `NEW AUSTRALIA`, `PARAGUAY`, `ROYAL TAR`, `1893`, `WILLIAM LANE`, `COSME`, `MARY GILMORE`, `$10`, `SYDNEY`, `OVER 200`. **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts.
- Crossfade at seams. Final incomplete loop (`Because`) should whip/match-cut back toward frame-1 `NEW AUSTRALIA` / voyage energy.
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.
- **Held Atlas VO:** `audio/vo.mp3` (**44.856 s**). Retune all seams to Whisper timings from this VO.

### LOCKED MAP RULE (mandatory)

Whenever maps appear: territory overlays on **real satellite/topo basemap** (terrain visible under colour); parchment/weathered fill texture; **thick white outer glow** on land / route borders; bold **3D/extruded labels** + drop shadow; soft shadows on overlays. **Correct locations only:** Australia (Sydney departure) ↔ Paraguay / New Australia (Nueva Londres) / Cosme region — **never** wrong-country stand-ins. Prefer photographic basemaps `s17_07_australia_se_modis.jpg` (or Queensland MODIS if present) and `s17_08_paraguay_satellite_2003.jpg`. `s17_15_australia_paraguay_locator_ref.png` and `s17_12_paraguay_atlantic_forest_map.png` are underlay/reference only — rebuild voyage + colony pins in locked style; do not show flat schematic locators as hero.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` (**44.856 s**).

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–5.0 | ANIMATE | Voyage tease over `s17_04_sydney_cove…` / `s17_05_royal_tar…` + locked AU→PY arc start | Frame-1 unspoken hook **`NEW AUSTRALIA`** (alts `$10 NOTE` / `PARAGUAY` / `ROYAL TAR`); surprised hook slam; ship + South America tease |
| 2 | 5.0–8.0 | ANIMATE | Gilmore portrait flash `s17_14` / `s17_13` + kinetic `$10` chip | Sly money tease; `$10` / note silhouette MG — **not** a full VO-echo title; soft: polymer Gilmore note still may be gap |
| 3 | 8.0–13.0 | ANIMATE | `s17_01` / `s17_02` shearers strike stills | Storytelling 1893 recession; paper stamp `1893`; strike-camp / beaten mood; restrained dim |
| 4 | 13.0–18.0 | ANIMATE | `s17_03_william_lane_portrait.jpg` + locked Paraguay jungle/basemap tease (`s17_08` / Nueva Londres landscape) | Fast; Lane portrait card + `WILLIAM LANE` label; paradise promise; parchment Paraguay fill begins |
| 5 | 18.0–22.0 | ANIMATE | **Locked map** Paraguay over `s17_08_paraguay_satellite_2003.jpg` | Tense; war-aftermath settler pitch; thick white glow on Paraguay; 3D `PARAGUAY`; soft — no invented casualty % |
| 6 | 22.0–27.5 | ANIMATE | `s17_05_royal_tar…` + Sydney Cove + locked AU→PY voyage arc | Fast July 1893 departure; ship slam; route line Sydney→Paraguay; `ROYAL TAR` / `OVER 200` chips |
| 7 | 27.5–32.5 | ANIMATE | Colony stills `s17_09` / `s17_16` + dark rule badges | Dark; temperance / no-mixing / British-only stamps; do not over-claim sole-cause failure |
| 8 | 32.5–38.0 | ANIMATE | Split MG + `s17_10` Nueva Londres plaza / descendants mood | Fast split → `COSME` branch; soft `~2,000` descendants chip (keep “about”) |
| 9 | 38.0–43.0 | ANIMATE | `s17_13` / `s17_14` Mary Gilmore + `$10` MG | Twist; Gilmore reveal; `$10 NOTE` extruded label; soft — don’t flash wrong paper-series note as Gilmore |
| 10 | 43.0–end | ANIMATE | Return to `NEW AUSTRALIA` + voyage arc | Incomplete loop punch on **`Because`**; hard cut / whip / match-cut back to beat-1 open |

## Still inventory / factual guardrails

1. Shearers strike Hughenden 1891 — recession / beaten shearers mood.
2. Shearers’ strike sketches 1891 — period strike colour.
3. William Lane portrait (SLNSW, 1890–94) — leader likeness.
4. Sydney Cove / Circular Quay c.1890 (Henry King) — Sydney departure era harbour.
5. Royal Tar (State Library Qld) — the colony ship.
6. Royal Tar alt — secondary ship angle if useful.
7. Southeastern Australia MODIS — **Australia map basemap** (Sydney departure).
8. Paraguay satellite Jan 2003 (NASA) — **preferred Paraguay map basemap**.
9. New Australia settlement photo (1892–1905) — colony historical still.
10. Nueva Londres plaza — modern New Australia place continuity / descendants geography.
11. Nueva Londres landscape dawn — Paraguay landscape (correct country).
12. Alto Paraná Atlantic Forest map PNG — ecoregion **reference only**; rebuild locked style.
13. Mary Gilmore 1891 — near-era colonist portrait.
14. Dame Mary Gilmore — later portrait for “on the $10” twist.
15. Australia–Paraguay locator PNG — globe/route **reference only**; not hero map.
16. New Australia colony photo (additional PD still).

No AI historical reconstructions. Soft facts: over 200 / ~220; Triple Alliance devastation without invented %; Lane rules without sole-cause overclaim; split within a year → Cosme; about 2,000 descendants; Gilmore on polymer $10. **Gap:** free-licence polymer $10 showing Gilmore not found at scaffold — Claude may source or use portrait + MG.

## Audio hand-off

- **`audio/vo.mp3`:** held Atlas en-AU **44.856 s**. Do not re-record.
- Bed: `music/music.mp3` and `audio/music.mp3` — **The Journey** by Ahjay Stelino, Mixkit Stock Music Free Licence (~108 s; adventurous / tense voyage). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus optional `paper_rustle.mp3` (map / manifesto / note colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
