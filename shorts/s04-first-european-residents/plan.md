# Shot plan — s04-first-european-residents (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo/scan underlay with MG Skylab-style overlays: restrained parallax/crop, masked wipes, pins, route lines, type, particles and practical texture. Do not turn a historical still into a contemporary photograph.
- No AI historical stills. The present-day photos are labelled as present-day views; the 1647/1649 Dutch plate is a public-domain historical source, not a literal moving photograph.
- Captions remain in the lower-middle safe band. Keep extra MG text sparse: the frame-1 hook, `1629`, `BATAVIA`, `VOC`, `CORNELISZ`, `WIEBBE HAYES`, `WEST WALLABI`, `159 YEARS`, `LOOS`, `PELGROM`, and `NEVER SEEN AGAIN` only where useful. Do not echo whole VO sentences as titles.
- Crossfade at seams. The final wreck-site frame should loop back to the opening ship language.

## Beat table

| # | Time (s) | Mode | Photo/scan underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–7.6 | ANIMATE | `s04_01_batavia_replica.jpg` — ADZee’s present-day Batavia replica at sea; use as a clearly labelled replica, not the 1629 vessel | Frame-1 hook `159 YEARS BEFORE THE FIRST FLEET`; replica push-in; VOC pennant/route line; restrained impact and paper-grain reveal |
| 2 | 7.6–15.6 | ANIMATE | `s04_02_abrolhos_islands.jpg` — Morning Reef, Houtman Abrolhos; the blue mark identifies the Batavia wreck site | Australia-to-Abrolhos route trace; `1629` stamp; wreck-site pin and reef contour; no invented map coastline |
| 3 | 15.6–25.0 | ANIMATE | `s04_03_ongeluckige_voyagie.jpg` — public-domain plate from the 17th-century account of the Batavia wreck, killings and punishment | Plate registration/parallax; dark vignette on the mutiny beat; `CORNELISZ` name lock-up; use no gratuitous massacre imagery |
| 4 | 25.0–34.3 | STILL → ANIMATE | `s04_04_wiebbe_hayes_fort.jpg` — present-day photograph of the stone fort remains on West Wallabi Island | Warm counter-light and slow aerial crop; `WEST WALLABI`; stone-wall line draw and defensive perimeter; `OLDEST EUROPEAN STRUCTURES` as a compact fact tag only |
| 5 | 34.3–40.7 | STILL → ANIMATE | `s04_05_batavia_timbers.jpg` — preserved Batavia timbers at the Western Australian Shipwrecks Museum | Museum-label frame and timber-grain texture; rescue route line returns across the Indian Ocean; keep captions clear of the artefact |
| 6 | 40.7–47.7 | ANIMATE | `s04_06_beacon_island.jpg` — present-day Beacon Island, site of the Batavia mutiny and survivor camps | `RESCUE` route arrives; mutineer dots collapse; red execution mark for Cornelisz without depicting violence; quick cut on “different sentence” |
| 7 | 47.7–56.4 | ANIMATE | `s04_07_kalbarri_coast.jpg` — present-day mainland WA coast at Kalbarri; a geographic underlay for the marooning, not the exact landing site | Mainland WA locator and shoreward route; two small name tags `WOUTER LOOS` / `JAN PELGROM`; footprints fade into coast texture; no invented portraits or landing scene |
| 8 | 56.4–61.560 | ANIMATE | `s04_08_batavia_wreck_site.jpg` — Morning Reef wreck site, marked on the photograph | `NEVER SEEN AGAIN` assembles, then dims; wreck marker pulses into the opening Batavia silhouette/route language for the loop; land the last word cleanly |

## Still inventory / factual guardrails

1. Batavia replica — present-day replica, labelled as such; public domain Commons image.
2. Morning Reef — real Houtman Abrolhos wreck location; CC BY-SA 4.0.
3. Ongeluckige voyagie plate — public-domain historical source; use as an era document, not a literal eyewitness photograph.
4. Wiebbe Hayes fort — real West Wallabi Island remains; CC BY-SA 3.0.
5. Batavia timbers — real preserved wreck material in WA Shipwrecks Museum; CC BY-SA 4.0.
6. Beacon Island — real mutiny/survivor-camp site; CC BY-SA 4.0.
7. Kalbarri coast — real mainland Western Australian coast; CC BY-SA 4.0. It is not claimed as the exact marooning point.
8. Batavia wreck site — real Morning Reef location, clearly marked; CC BY-SA 4.0.

No generic storm, footprints, colonial portrait, AI historical person, invented shipwreck, or unrelated filler is included.

## Audio hand-off

- Held VO: `audio/vo.mp3`; do not re-record.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Vastness** by Andrew Ev, Mixkit Free Music Licence. Claude owns ducking, timing, loudness and final mix.
- SFX: `sfx/` contains selected reviewed Mixkit shared-kit cues; source URLs are in `sfx/sources.tsv` and `images/SOURCES.md`.
