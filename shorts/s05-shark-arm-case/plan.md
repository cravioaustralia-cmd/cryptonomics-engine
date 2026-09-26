# Shot plan — s05-shark-arm-case (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo/scan underlay with MG Skylab-style overlays: restrained parallax/crop, masked wipes, pins, type, particles and practical texture. Do not invent a 1935 photograph from a modern still.
- No AI historical stills. Present-day wildlife/building photos are labelled as present-day; period stills stay period.
- Captions remain in the lower-middle safe band. Keep extra MG text sparse: the frame-1 hook, `1935`, `COOGEE`, `TIGER SHARK`, `TWO BOXERS`, `CUT OFF`, `JAMES SMITH`, `MURDER`, `ACQUITTED`, `NEVER FOUND`, and `A SHARK` only where useful. Do not echo whole VO sentences as titles.
- No gore: no severed-arm imagery, no gunshot wound, no body. The knife/cut beat is forensic/police language only. The witness-car beat is a period sedan underlay, not a crime-scene recreation.
- Crossfade at seams. The final tiger-shark frame should loop back to the opening aquarium/crowd language.

## Beat table

| # | Time (s) | Mode | Photo/scan underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–7.5 | ANIMATE | `s05_01_coogee_pier_1929.jpg` — Coogee Beach & pier with summer crowd, c.1929 (Hall & Co / SLNSW); era context for the Coogee Aquarium baths where the shark was displayed | Frame-1 hook `A SHARK COUGHED UP A HUMAN ARM`; crowd push-in; `1935` / `COOGEE` stamps; restrained impact and paper-grain reveal |
| 2 | 7.5–12.0 | ANIMATE | `s05_02_tiger_shark.jpg` — real tiger shark (*Galeocerdo cuvier*); label as present-day wildlife photo, not the 1935 aquarium animal | Species lock-up `TIGER SHARK`; slow underwater drift; shock hit on “threw up a human arm”; no gore overlay |
| 3 | 12.0–22.0 | ANIMATE | `s05_03_two_boxers.jpg` — public-domain press photo of two boxers in the ring (Agence Rol); visual stand-in for the “two boxers” tattoo / James Smith’s boxing past — not a portrait of Smith | Tattoo silhouette / two-boxer stamp; detective wipe into `CUT OFF` / knife fact tag; no blood or severed-limb imagery |
| 4 | 22.0–28.5 | ANIMATE | `s05_04_police_court_sydney.jpg` — Justice and Police Museum (former Water Police Courts), Sydney; present-day photo of the period police-court building | Investigation pin; `JAMES SMITH` name lock-up; `MURDER` / `DELIVERY SERVICE` compact tags; route from aquarium → police |
| 5 | 28.5–34.0 | ANIMATE | `s05_05_circular_quay_1930.jpg` — Circular Quay / Sydney Harbour circa 1930 (bridge under construction); period harbour for the “murder delivery” beat | Harbour push; ferry/tram parallax; dark vignette on “delivery service”; keep modern labels off the period still |
| 6 | 34.0–39.0 | ANIMATE | `s05_06_1935_sedan.jpg` — restored 1934–35 Buick sedan (present-day classic-car photograph); period vehicle language for the witness found shot in his car — no gore | Car crop + night grade; `WITNESS` tag dims; tense riser into sudden cut; never depict a body or wound |
| 7 | 39.0–43.5 | STILL → ANIMATE | `s05_07_darlinghurst_court.jpg` — Darlinghurst Court House, Sydney (present-day night exterior); NSW criminal-court landmark for the acquittal | `ACQUITTED` stamp; `BODY NEVER FOUND` sparse type; slow pull-back; no invented verdict papers |
| 8 | 43.5–47.208 | ANIMATE | `s05_08_tiger_shark_loop.jpg` — second real tiger-shark still for the loop punchline | `THE ONLY WITNESS…` assembles then resolves to `A SHARK`; shark silhouette loops back toward opening Coogee crowd language; land the last word cleanly |

Approximate seam times are VO-relative starting points; Claude should retune against Whisper word timings.

## Still inventory / factual guardrails

1. Coogee Pier c.1929 — real Coogee Beach / baths / pier crowd near the aquarium site; public domain (SLNSW).
2. Tiger shark — real *Galeocerdo cuvier*; CC BY-SA 3.0; labelled present-day wildlife, not the 1935 specimen.
3. Two boxers — public-domain era boxing still used only as tattoo / former-boxer metaphor; not James Smith’s likeness.
4. Justice and Police Museum — real Sydney former Water Police Courts; CC BY 2.0; investigation underlay, not a crime-scene recreation.
5. Circular Quay c.1930 — real period Sydney Harbour; public domain; bridge still incomplete in the photograph.
6. 1934–35 Buick sedan — present-day photo of a period vehicle; CC BY 2.0; no gore.
7. Darlinghurst Court House — real NSW criminal-court landmark; CC BY 3.0; labelled present-day exterior.
8. Tiger shark (loop) — second real tiger-shark still; CC BY-SA 3.0; punchline callback.

No generic magnifying glass, AI historical person, gore, severed-arm photo, or geographically wrong filler is included. Draft pack images from `australia-shorts/s05` were inspected and rejected (wrong place/subject/filler).

## Audio hand-off

- Held VO: `audio/vo.mp3`; do not re-record.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Vastness** by Andrew Ev, Mixkit Free Music Licence. Claude owns ducking, timing, loudness and final mix.
- SFX: `sfx/` contains selected reviewed Mixkit shared-kit cues; source URLs are in `sfx/sources.tsv`.
