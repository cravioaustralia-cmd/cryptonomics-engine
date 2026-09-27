# Shot plan — s11-cassowary (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, claw outline, year stamp, seed particles, type. Do **not** invent AI “historical” stills of the 1926 death or fake wounds.
- **No gore.** No graphic wound, blood, or body recreation. Death beat = period Queensland context + restrained typography.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse: frame-1 hook `LOOKS LIKE A DINOSAUR`, plus short labels (`CASSOWARY`, `~2 m`, `~50 km/h`, `CLAWs >10 cm`, `1926`, `QUEENSLAND`, `SHY`, `SEED DISPERSAL` / `GARDENER`). **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts (`metres` / `kilometres` if written out; `~2 m` / `~50 km/h` OK).
- Crossfade at seams. Final frame should loop back toward the opening dinosaur/cassowary language.
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.

## Beat table

Approximate seams for the held **39.408 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–5.5 | ANIMATE | `s11_01_cassowary_portrait.jpg` — southern cassowary portrait (Mt Hypipamee NP); unspoken hook | Frame-1 hook `LOOKS LIKE A DINOSAUR`; casque slam + ominous push-in; impact on “fight like one.” |
| 2 | 5.5–12.5 | ANIMATE | `s11_03_kuranda_cassowary.jpg` — Kuranda QLD cassowary; species + size | `CASSOWARY` name chip; height bar `~2 m`; speed streak `~50 km/h`; jump/swim icon pops (no fake footage claim) |
| 3 | 12.5–17.0 | ANIMATE | `s11_04_claw_foot.png` — Port Douglas foot/claw close-up (licensed) | Claw outline / dagger stamp; `>10 cm` measure callout; tense crop — **no blood** |
| 4 | 17.0–26.0 | ANIMATE | `s11_05_cook_highway_1920s.jpg` — Cook Highway Cairns–Cooktown, 1920–1930 (SLQ PD); era/region proxy for 1926 QLD | `1926` / `QUEENSLAND` stamps; map-pin toward Mossman (MG only); serious grade; **no wound / no victim recreation** |
| 5 | 26.0–30.5 | ANIMATE | `s11_06_rainforest_cassowary.jpg` — cassowary in NQ rainforest (PD) | Soft pull-back; `SHY` chip; warm grade flip from tense beat |
| 6 | 30.5–36.0 | ANIMATE | `s11_07_seed_dropping.jpg` (seeds in dropping) under dim `s11_08_daintree_rainforest.jpg` canopy | Seed particles / scatter arcs; `GARDENER` / `SEED DISPERSAL` labels; rainforest ambience cue |
| 7 | 36.0–39.408 | ANIMATE | `s11_09_etty_bay.jpg` (callback) or `s11_01_…` — loop punchline | Respect beat → hook language reassembles for loop; final frame matches beat-1 energy |

**Optional continuity stills** (swap if Claude prefers): `s11_02_daintree_casoar.jpg` (Daintree bird), `s11_10_mission_beach.jpg` (Mission Beach walking — run/shy continuity).

## Still inventory / factual guardrails

1. Portrait cassowary — dinosaur-silhouette hook; southern cassowary, Queensland.
2. Kuranda cassowary — species reveal + size/speed beat.
3. Foot/claw close-up — dagger claw fact; licensed Port Douglas habitat photo crop.
4. 1920–1930 Cook Highway — period FNQ road context for 1926 Mossman incident (**proxy only**).
5. Rainforest cassowary (PD) — shy / habitat beat.
6. Cassowary dropping with visible seeds (Lamb Range west of Cairns) — gardener / seed-dispersal proof still.
7. Daintree rainforest canopy (CC0) — habitat underlay for gardener beat.
8. Etty Bay rainforest bird — loop callback.

No AI McClean-scene fakes, no gore, no unlicensed news photos of injuries.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (**39.408 s**); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Vastness** by Andrew Ev, Mixkit Free Music Licence (tense / cinematic nature — matches ominous→warm arc). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus `birds_jungle_ambience.mp3` / `forest_birds.mp3` (Mixkit). Source URLs in `sfx/sources.tsv`.
- **Mix warning:** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Do not reintroduce single-pass VO `loudnorm` before amix (PR #21 fix).
