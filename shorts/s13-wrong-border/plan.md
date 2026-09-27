# Shot plan — s13-wrong-border (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, meridian/offset SVG, court stamp, strip-area callout. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `WRONG LINE`, `1836`, `141°E`, `SURVEY`, `~3 km` / `OFF`, `~1,300 km²`, `1914`, `PRIVY COUNCIL`, `STILL LEGAL`. **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts (`kilometres`).
- Crossfade at seams. Final frame should loop back toward the opening hook (`WRONG LINE` / “border in the wrong place”).
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.
- Longitude **true-vs-surveyed** = **MG/SVG overlay** (not a stock globe photo alone).

## Beat table

Approximate seams for the held **38.376 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–4.0 | ANIMATE | `s13_02_border_dispute_diagram.jpg` (or dim `s13_07_border_anomaly_map.jpg`) — wrong-place hook | Frame-1 unspoken hook `WRONG LINE` (alt `141°E`); amused slam + kink arrow; soft impact |
| 2 | 4.0–7.5 | ANIMATE | `s13_05_middlesex_guildhall.jpg` — London court | Push-in on façade; `PRIVY COUNCIL` / `LONDON` chip only — **not** “1914 hearing photo”; sly grade |
| 3 | 7.5–12.5 | ANIMATE | `s13_08_sa_colony_handbook_map.jpg` with inset `s13_04_port_phillip_district_1839.svg` | `1836` + `141°E` stamp; meridian line draw (MG); storytelling map crop |
| 4 | 12.5–17.5 | ANIMATE | `s13_01_vic_sa_nsw_border_1883.jpg` under survey colour; optional Todd dim for continuity | `SURVEY` label; MG cairn / blaze / stone-pile motifs over bush-line pan; tense typewriter ticks |
| 5 | 17.5–21.5 | ANIMATE | Meridian ref `s13_03_141st_meridian_aus.svg` as **SVG/MG underlay** (not photo-alone) | Animated true-vs-surveyed offset; `~3 km` / `OFF` callout; shocked snap |
| 6 | 21.5–26.5 | ANIMATE | `s13_07_border_anomaly_map.jpg` — strip / anomaly | Area fill + `~1,300 km²` stamp; dramatic strip highlight; paper_rustle optional |
| 7 | 26.5–30.5 | ANIMATE | `s13_06_charles_todd_portrait.jpg` — dispute / instruments era | Soft `INSTRUMENTS` energy; **Todd = remeasurement**, not original Wade surveyor; decades-fight tense hold |
| 8 | 30.5–35.0 | ANIMATE | `s13_05_middlesex_guildhall.jpg` → twist stamp | `1914` + `PRIVY COUNCIL` dual stamp; “wrong line stays” gavel/slam MG; twist grade |
| 9 | 35.0–38.376 | ANIMATE | `s13_09_serviceton_aerial.jpg` (or `s13_07_…`) — loop / to this day | Deadpan incomplete line; `STILL LEGAL` chip; hard cut / whip back to beat-1 hook energy |

**Optional continuity:** Port Phillip 1839 SVG for NSW-origin soft beat if Claude adds a brief doc note on-screen (`NSW` soft chip — VO can stay SA–Vic).

## Still inventory / factual guardrails

1. Vic–SA–NSW border 1883 — period kink / dual-line story.
2. Border dispute diagram — hook / establishing geography (low-res; Claude may redraw SVG).
3. 141st meridian Aus SVG — **reference for Claude longitude MG** (true meridian concept).
4. Port Phillip District 1839 SVG — pre-Victoria / NSW chapter of the same meridian.
5. Middlesex Guildhall — London / Privy Council mood; **modern JCPC seat proxy** — label `PRIVY COUNCIL` / `LONDON` only.
6. Sir Charles Todd — **remeasurement / instruments** beat, not original Wade surveyor.
7. Border anomaly map — surveyed-vs-true strip / `~1,300 km²` geography (credit OSM + SCHolar44).
8. SA colony handbook map — 1836-era mood / exact-longitude beat.
9. Serviceton aerial — “to this day” closer (town in disputed strip that stayed in Victoria).

No AI historical reconstructions. Soft facts: area `~1,300 km²`; offset `~3–3.6 km west`; NSW origin noted in fact-check even if VO stays SA–Vic.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (**38.376 s**); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Curiosity** by Diego Nava, Mixkit Stock Music Free Licence (amused → tense → twist → deadpan loop; curious/documentary intrigue, not slapstick). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus optional `paper_rustle.mp3` (Mixkit — papers being moved / wrinkling). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Do **not** reintroduce single-pass VO `loudnorm` before amix (that ate ~3 s of VO tail on s09). Main’s `mix-audio.mjs` may still show the old path — **port the fixed mixer from PR #21 / #23 / #25** if needed.
