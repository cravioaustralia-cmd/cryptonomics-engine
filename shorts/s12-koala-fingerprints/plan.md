# Shot plan — s12-koala-fingerprints (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, ridge/loop overlays, microscope crop, evidence-card motif (theoretical only), type. Do **not** invent AI “crime scene” stills or fake SEM koala-print photos.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse: frame-1 hook `ALMOST IDENTICAL`, plus short labels (`KOALA`, `LOOPS`, `WHORLS`, `RIDGES`, `MICROSCOPE`, `IN THEORY`, `CONVERGENT EVOLUTION`, `GRIP`, `BRANCHES` / `LEAVES`, `SAME PRINTS`). **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts.
- Crossfade at seams. Final frame should loop back toward the opening “almost exactly like yours” / hook language.
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.

## Beat table

Approximate seams for the held **37.080 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–4.5 | ANIMATE | `s12_01_cape_otway_koala.jpg` — Cape Otway koala; unspoken hook | Frame-1 hook `ALMOST IDENTICAL`; soft slam + ridge-line draw toward camera; intrigued push-in |
| 2 | 4.5–10.0 | ANIMATE | `s12_03_koala_foot_underside.jpg` under dim `s12_02_mount_lofty_koala.jpg` (or swap) — pad close-up + species | `LOOPS` / `WHORLS` / `RIDGES` kinetic chips; SVG ridge overlay on pad; **not** a claim that the hind-foot photo is a forensic card |
| 3 | 10.0–16.5 | ANIMATE | `s12_07_lab_microscope.jpg` with inset `s12_04_fingerprint_loop_whorl.jpg` / `s12_05_fingerprint_plain_whorl.jpg` | Microscope iris / focus pull; human-print inset compare; `HARD TO TELL APART` short chip — **generic lab proxy**, not Adelaide 1997 SEM |
| 4 | 16.5–22.5 | ANIMATE | `s12_06_nist_fingerprints.jpg` (PD NIST card) — theoretical crime-scene framing | Playful evidence-card / print-card slam; `IN THEORY` stamp; **no** fake case file, court stamp, or “real case” headline |
| 5 | 22.5–30.5 | ANIMATE | `s12_09_koala_climbing.jpg` → cross to `s12_10_koala_eucalyptus.jpg` | Split timeline / convergent-evolution fork graphic; `NOT CLOSELY RELATED`; `GRIP` + branch/leaf icons; warm twist grade |
| 6 | 30.5–33.5 | ANIMATE | `s12_08_koala_claws.jpg` or `s12_11_bonorong_koala.jpg` — punchline | `DIFFERENT ANIMALS` / `SAME PRINTS` dual stamp; ridge lines reassemble |
| 7 | 33.5–37.080 | ANIMATE | `s12_01_…` or `s12_12_sydney_koala.jpg` — loop callback | Hook language reassembles for loop; final frame matches beat-1 energy |

**Optional continuity stills:** `s12_11_bonorong_koala.jpg`, `s12_12_sydney_koala.jpg`, second fingerprint stills for compare cards.

## Still inventory / factual guardrails

1. Cape Otway koala — hook / “almost identical” energy.
2. Mount Lofty female — species / Australian koala continuity.
3. Clancy hind-foot underside (ridged pads) — best free-licence pad close-up; pair with SVG ridges + human print stills (see fact-check).
4–5. Human fingerprint loop/whorl stills — “loops, whorls and ridges” beat.
6. NIST fingerprint card (PD) — theoretical crime-scene / print-card motif only.
7. Lab optical microscope — microscope beat proxy (not Henneberg’s SEM).
8. Baby + adult claws — grip / forelimb continuity.
9. Climbing koala — gripping branches.
10. Eucalyptus leaves — gripping leaves / feeding niche.
11–12. Bonorong / Sydney — optional loop / continuity.

No AI crime-scene fakes, no fake koala SEM micrographs, no invented forensic case.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (**37.080 s**); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Vastness** by Andrew Ev, Mixkit Free Music Licence (intrigued → twist → punchline). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus `forest_birds.mp3` (Mixkit). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Do **not** reintroduce single-pass VO `loudnorm` before amix (that ate ~3 s of VO tail on s09). Main’s `mix-audio.mjs` may still show the old path until #21/#23 merge — port the fixed mixer if needed.
