# Shot plan — s15-irukandji (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, fingernail-scale MG, locked map treatment. Do **not** invent AI historical stills. **No gore / no graphic wound stills.**
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `IRUKANDJI`, `SMALLER THAN A NAIL`, `~1–2 CM`, `NORTHERN AUSTRALIA`, `GBR`, `~30 MIN`, `SENSE OF DOOM`, `HOSPITAL`, `RARE DEATHS`. **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts.
- Crossfade at seams. Final frame should loop back toward the opening fingernail / `IRUKANDJI` hook (complete loop echo).
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.

### LOCKED MAP RULE (mandatory)

Whenever maps appear: territory overlays on **real satellite/topo basemap** (terrain / reef shelf visible under colour); parchment/weathered fill texture; **thick white outer glow** on land borders; bold **3D/extruded labels** + drop shadow; soft shadows on overlays. **Correct location only:** northern Australia / Great Barrier Reef / tropical north waters — **never** Florida / Caribbean / Thailand or other wrong-country stand-ins. Prefer photographic basemap `s15_04_gbr_northern_aus_modis_satellite.jpg` (Cape York + GBR). `s15_06_gbr_marine_park_locator.svg` is underlay/reference only — rebuild in locked style; do not show flat schematic as hero.

## Beat table

Approximate seams for the held **35.640 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–5.5 | ANIMATE | `s15_01_carukia_barnesi_gershwin.jpg` hero + scale refs `s15_02_…` / `s15_03_…` (MG ref only; 5 mm label ≠ sole adult size) | Frame-1 unspoken hook `IRUKANDJI` (alt `SMALLER THAN A NAIL`); ominous slam; **fingernail-scale MG** (~1–2 cm bell vs nail/coin); soft push on translucent bell |
| 2 | 5.5–9.0 | ANIMATE | **Locked map** over `s15_04_gbr_northern_aus_modis_satellite.jpg` (+ optional `s15_05_…` Whitsunday sat) | Building energy; parchment range fill Broome→NT→tropical Qld / GBR with thick white outer glow; 3D labels `NORTHERN AUSTRALIA` / soft `CAIRNS`–`WHITSUNDAYS`; never wrong-country |
| 3 | 9.0–14.5 | ANIMATE | Macro `s15_01_…` (+ optional safety colour `s15_07_…` / `s15_08_…`) | Tense hold on tiny sting; MG timer / pulse toward `~30 MIN` / `~20–60 MIN`; whoosh into “it hits” |
| 4 | 14.5–19.5 | ANIMATE | `s15_09_mater_hospital_townsville.jpg` + `s15_10_ecg_12_lead.jpg` | Intense kinetic labels for pain / vomiting / BP spike; ECG = hypertension mood only (**not** a known Irukandji patient trace); **no gore** |
| 5 | 19.5–27.0 | ANIMATE | `s15_11_munch_scream_doom_mood.jpg` and/or dark abstract doom MG | Eerie slower hold; `SENSE OF DOOM` chip; Munch = abstract psychology proxy (optional if custom dark MG preferred); no wound stills |
| 6 | 27.0–31.5 | ANIMATE | `s15_09_mater_hospital_townsville.jpg` (+ restrained type) | Serious resolve; hospital care mood; soft caption `RARE DEATHS` / “deaths have been recorded” — **do not** invent large death toll or montage crime-scene photos; do not conflate with *Chironex* |
| 7 | 31.5–35.640 | ANIMATE | Return to fingernail-scale MG + `s15_01_…` / `s15_02_…` | Complete loop echo; hard cut / whip / match-cut on fingernail scale back to beat-1 `IRUKANDJI` energy |

## Still inventory / factual guardrails

1. *Carukia barnesi* Gershwin macro — hero species still (Irukandji namesake).
2. Tiny jelly in vial vs fingers — fingernail/scale proxy; soft “Irukandji-type / small box jelly” if species ID uncertain.
3. Size/nematocyst schematic — **MG reference only**; 5 mm label ≠ sole adult size (prefer ~1–2 cm for VO/captions).
4. Cape York / GBR MODIS satellite — **preferred map basemap** (correct northern Aus / GBR).
5. Whitsunday MISR satellite — secondary geography still (lower res).
6. GBR Marine Park locator SVG — underlay/ref for locked parchment + white-glow rebuild; not flat schematic hero.
7. Hazardous Marine Creatures beach sign (names Irukandji) — optional safety-colour B-roll; do not treat first-aid text as current medical advice.
8. Marine Stingers vinegar depot — stinger-season mood; no gore.
9. Mater Hospital Townsville — “fast hospital treatment” mood; north Qld; no clinical interiors/gore.
10. 12-lead ECG — BP / cardiac-monitoring mood only; not a diagnosed Irukandji trace.
11. Munch *The Scream* (PD) — abstract impending-doom psychology proxy; optional vs custom dark MG.

No AI historical reconstructions. Soft facts: fingernail / ~1–2 cm; *C. barnesi* namesake vs multi-species syndrome; ~20–60 min onset; doom symptom; most survive with hospital; deaths rare/recorded (often cite ~2002 cases) — do not overstate; no gore; don’t conflate with *Chironex*.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (**35.640 s**); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Delirium** by Eugenio Mininni, Mixkit Stock Music Free Licence (ominous → tense → eerie doom hold → restrained hospital resolve → loop; low documentary pulse, not slapstick). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus optional `paper_rustle.mp3` (map / sign / paper colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Do **not** reintroduce single-pass VO `loudnorm` before amix (that ate ~3 s of VO tail on s09). Main’s `mix-audio.mjs` may still show the old path — **port the fixed mixer from PR #21 / #23 / #25** if needed.
