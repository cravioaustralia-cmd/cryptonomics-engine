# Shot plan — s20-sar-region (Checkpoint C hand-off) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in this folder. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** Skylab photo-underlay slideshow as the main beat language.
- Continuous map motion: pans, zooms, **self-drawing SAR region outline/fill**, capital/base pins, numeric **km² / distance** callouts. Camera **always moving**; outline never sits dead.
- **Beat the Rankora ref** (https://youtube.com/shorts/5IaLp97pUQA): ref has zero numeric distances — we add dynamic **~53 MILLION KM²**, **1/10 OF EARTH**, halfway arc badges, border-country chips, Vostok/Concordia pins.
- Photos only as **brief credibility inserts** (Vostok / Concordia stills if present) — **maps carry the story**.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `1/10 OF EARTH`, `~53 MILLION KM²`, `SRR`, `SOUTH POLE`, `SOUTH AFRICA`, `SRI LANKA`, `SOLOMON ISLANDS`, `VOSTOK`, `CONCORDIA`, `AMSA`. **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts (`kilometres`, `rescue`).
- Crossfade / whip at seams. Final incomplete loop (`So if something goes wrong there,`) hard-cuts / whips back toward frame-1 `1/10 OF EARTH` / SRR outline energy — **Claude designs the visual whip-back**.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune all seams to Whisper timings once VO lands. **Do not place VO in this scaffold.**

### LOCKED MAP STYLE (mandatory)

Real **satellite/topo** basemap (terrain visible under colour); parchment/weathered fills for SRR; **thick white outer glow** on SRR border; bold **3D/extruded labels** + drop shadow; soft shadows on overlays. **Correct locations only** per AMSA/NATSAR: Australian continent + Indian/Pacific/Southern Oceans SRR; western edge ~**75°E**; eastern ~**163°E**; aviation SRR to **South Pole**; Vostok ≈78.5°S 106.8°E; Concordia ≈75.1°S 123.3°E. Prefer basemaps `s20_01_world_topo_basemap_ref.jpg`, `s20_02_southern_ocean_antarctica_crop.jpg`, `s20_02b_antarctica_blue_marble.jpg`, `s20_05_indian_pacific_au_corridor_crop.jpg`. Rebuild SRR polygon in locked style from AMSA outline — do not show flat schematic locators as hero.

## Hook recommendation

- **Primary (frame 1 unspoken):** `1/10 OF EARTH`
- **Stronger alts:** `53 MILLION KM²` · `TO THE SOUTH POLE` · `AUSTRALIA’S SAR REGION`
- Prefer **`1/10 OF EARTH`** — instant scale shock matching open VO; numeric alts good for A/B.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` once held. **ANIMATE-heavy map beats.**

| # | Time (approx) | Mode | Map / brief photo | Named motion / MG treatment |
|---|---|---|---|---|
| 1 | Open ~0–4 s | ANIMATE (map) | Globe / southern hemisphere over `s20_01` / `s20_05` | Frame-1 unspoken hook **`1/10 OF EARTH`**; shocked hook slam; Australia lights; camera already drifting outward |
| 2 | ~4–7 s | ANIMATE (map) | Wide SRR tease; parchment pulse | Sly; soft “places you’d never guess” tease — no VO-echo sentence; hint flicker toward Antarctica |
| 3 | ~7–14 s | ANIMATE (map) | Full SRR self-draw begin | Storytelling; **self-drawing SAR outline** + parchment fill; label `SEARCH AND RESCUE REGION` / `SRR`; countries’ ocean-zone mosaic fade-in lightly |
| 4 | ~14–18 s | ANIMATE (map) | Hold SRR; km² counter | Awed; ticking / slam callout **`~53 MILLION KM²`** beating Rankora (numeric!); camera slow push |
| 5 | ~18–24 s | ANIMATE (map) | Macro→micro halfway arcs | Fast; three directional extent arcs / badges: **AFRICA** · **INDONESIA** · **NEW ZEALAND** with soft “HALFWAY” chips; continuous pan along leading edges |
| 6 | ~24–28 s | ANIMATE (map) | Dive south over `s20_02` / `s20_02b` | Dramatic; whip-zoom to **SOUTH POLE** pin; aviation-SRR wedge to Pole; thick white glow border holds |
| 7 | ~28–34 s | ANIMATE (map) | Border SRR mosaic | Fast; neighbour SRR edges light; pins/chips **SOUTH AFRICA → SRI LANKA → SOLOMON ISLANDS** sweep; optional soft `10 NEIGHBOURS` badge |
| 8 | ~34–42 s | ANIMATE (map + brief inserts) | Antarctic plateau inward | Twist; pins drop on **VOSTOK** (RU) + **CONCORDIA** (FR/IT); brief ≤~1s photo inserts `s20_03` / `s20_04` if present then back to map; 3D labels |
| 9 | End | ANIMATE (map) | Return to SRR outline + hook | Incomplete loop punch on **`So if something goes wrong there,`**; hard cut / whip / match-cut back to beat-1 `1/10 OF EARTH` / outline slam — Claude owns whip-back design |

## Still inventory / factual guardrails

1. World topo.bathy (NASA) — **primary** globe / SRR basemap reference (`s20_01`).
2. Southern Ocean + Antarctica crop from same — Pole dive / halfway-south (`s20_02`).
3. Antarctica Blue Marble ortho (PD) — polar hero basemap (`s20_02b`).
4. Indian–Pacific–AU corridor crop — halfway Indonesia / NZ energy (`s20_05`).
5. Vostok Station still (NSF PD) — brief credibility insert if downloaded (`s20_03`).
6. Concordia Station still (NASA PD) — brief credibility insert if downloaded (`s20_04`).

No AI historical reconstructions. Soft facts: about 53 million; one-tenth; roughly halfway; aviation SRR to Pole; Vostok/Concordia inside AU SRR. **Gaps for Claude (optional):** higher-res AMSA official SRR outline SVG/PNG if free-licence obtainable for polygon reference; free-licence Vostok/Concordia stills if missing from `images/`; soft neighbour capital pins only if needed — maps remain primary.

## Audio hand-off

- **`audio/vo.mp3`:** Atlas en-AU **pending** — do not invent timing from this plan alone; **do not place VO in scaffold**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Vastness** by Andrew Ev, Mixkit Stock Music Free Licence (~230 s). Ambient awe — **quieter under VO**. Claude must seat bed ~**4 dB quieter** than s18 Silent Descent original bed before final master loudnorm.
- SFX: shared Mixkit kit in `sfx/` plus `paper_rustle.mp3` (map / km² callout colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
