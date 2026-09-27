# Shot plan — s16-nullarbor-845 (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, offset clocks, locked map treatment. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `+8:45`, `CWST`, `UNOFFICIAL`, `NULLARBOR`, `EUCLA`, `AWST +8`, `ACST +9:30`, `EYRE HWY`, `NO STATUTE`. **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts.
- Crossfade at seams. Final incomplete loop (`Yet to this day,`) should whip/match-cut back toward frame-1 `+8:45` / strip-of-Australia energy.
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.
- **Held Atlas VO:** `audio/vo.mp3` (**37.080 s**). Retune all seams to Whisper timings from this VO.

### LOCKED MAP RULE (mandatory)

Whenever maps appear: territory overlays on **real satellite/topo basemap** (Nullarbor terrain / Bight coast visible under colour); parchment/weathered fill texture; **thick white outer glow** on land / corridor borders; bold **3D/extruded labels** + drop shadow; soft shadows on overlays. **Correct location only:** Nullarbor Plain / WA–SA border / Eucla–Madura–Mundrabilla–Cocklebiddy–Border Village corridor on the Eyre Highway — **never** wrong-country stand-ins. Prefer photographic basemap `s16_03_sa_nullarbor_modis.jpg` (or `s16_02_nullarbor_satellite.jpg`). `s16_14_nullarbor_relief_map_ref.png` is underlay/reference only — rebuild in locked style; do not show flat schematic as hero.

## Beat table

Approximate seams — **placeholder until VO duration known**. Claude must retune against Whisper word timings after `audio/vo.mp3` arrives. Rough ~32–40 s expected from script length.

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–4.5 | ANIMATE | `s16_04_eyre_highway_nullarbor.jpg` (+ optional `s16_06_…` plain) | Frame-1 unspoken hook **`+8:45`** (alts `NO LAW MADE THIS` / `UNOFFICIAL TIME`); amazed hook slam; thin corridor / strip highlight MG; soft push on endless highway |
| 2 | 4.5–7.0 | ANIMATE | Highway underlay + kinetic type | Sly beat; `BIZARRE` / offset preview chip (not a full VO-echo title); clock-hand tease toward :45 |
| 3 | 7.0–11.5 | ANIMATE | **Locked map** over `s16_03_sa_nullarbor_modis.jpg` (+ `s16_10_sa_wa_border_sign.jpg` flash) | Storytelling; parchment corridor fill WA–SA Nullarbor with thick white outer glow; 3D labels `NULLARBOR` / `WA` · `SA` / soft `EUCLA`; pin-drop on border; never wrong-country |
| 4 | 11.5–16.0 | ANIMATE | Split: `s16_11_perth_skyline.jpg` \| `s16_12_adelaide_skyline.jpg` | Fast contrast; dual clock / UTC badges `AWST +8` vs `ACST +9:30`; whoosh between cities |
| 5 | 16.0–20.5 | ANIMATE | Roadhouse stills `s16_08_eucla_hotel_motel.jpg` / `s16_09_border_village_checkpoint.jpg` / `s16_07_eucla_road_sign.jpg` / `s16_13_mundrabilla_highway_sign.jpg` | Amused “split the difference”; midpoint MG between +8 and +9:30 snapping to **+8:45**; soft: don’t over-claim every settlement |
| 6 | 20.5–24.0 | ANIMATE | Offset graphic MG (+ optional highway underlay) | Deadpan hold on **`+8:45`** / `UTC+8:45` extruded label; quarter-hour tick animation |
| 7 | 24.0–27.5 | ANIMATE | Same offset MG + subtle globe/rare-offset chips | Awed; soft caption `QUARTER-HOUR` / “one of the only” — **do not** say “the only on Earth” |
| 8 | 27.5–31.0 | ANIMATE | **`s16_01_entering_cwst_sign.jpg`** hero (+ `s16_05_…` Caiguna highway) | Fast; highway clock-change sign slam; `CHANGE CLOCKS` / `45 MIN` label; paper_rustle optional |
| 9 | 31.0–35.5 | ANIMATE | Sign / map return + restrained type | Twist; `NO STATUTE` / `UNOFFICIAL` chip; origin-uncertainty beat — no invented founding year |
| 10 | 35.5–end | ANIMATE | Return to `+8:45` + highway strip | Incomplete loop punch; hard cut / whip / match-cut on `+8:45` or clock-sign back to beat-1 open |

## Still inventory / factual guardrails

1. Entering CWST highway sign — hero “change your clocks” still (free licence: yes).
2. Nullarbor satellite (legacy) — secondary basemap.
3. SA / Nullarbor MODIS — **preferred map basemap**.
4. Eyre Highway on Nullarbor (SA) — strip / road-trip establishing.
5. Eyre Highway near Caiguna — western approach / signage corridor.
6. Nullarbor Plain landscape — geography mood.
7. Eucla road sign — names principal town.
8. Eucla Hotel Motel — roadhouse practice hub.
9. Border Village checkpoint — SA-side CWST corridor.
10. SA–WA border sign — “where WA meets SA”.
11. Perth skyline — AWST +8 contrast.
12. Adelaide skyline — ACST +9:30 contrast.
13. Mundrabilla highway sign — another corridor roadhouse (distance board; not the 45-min clock sign).
14. Nullarbor ecoregion relief PNG — map **reference only**; rebuild locked style.

No AI historical reconstructions. Soft facts: unofficial / no statute; some roadhouses (VERIFY list); UTC+8:45; Perth +8 / Adelaide +9:30 standard; highway signs exist; origin uncertain; “one of the only” quarter-hour offsets — do not overclaim.

## Audio hand-off

- **`audio/vo.mp3`:** **PENDING** (parent drop). Do not start Claude mix until present.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Traveling Along** by Ahjay Stelino, Mixkit Stock Music Free Licence (~100 s; energetic / curious road-trip). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus optional `paper_rustle.mp3` (map / sign / paper colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix.
