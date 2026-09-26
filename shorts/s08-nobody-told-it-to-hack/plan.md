# Shot plan — s08-nobody-told-it-to-hack (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo/schematic underlay with MG Skylab-style overlays: restrained parallax/crop, access/denied stamps, file-name cards, calendar delay stamps, type, particles and practical texture. Do not invent AI “historical” stills or fake hacked medical records.
- No AI stills. No patient-data imagery. No OpenAI wordmark/logo as a hero (trademark risk) — prefer generic neural-net / terminal / server MG. Australian Government / Parliament imagery carries the Medicare-portal and investigation beats.
- Captions remain in the lower-middle safe band. Keep extra MG text sparse: the frame-1 hook, `JUNE 2026`, `BLOCKED`, `ACCESS`, `STATS ONLY`, `JUN → AUG → SEP`, `UNACCEPTABLE`, and the loop closer only where useful. Do not echo whole VO sentences as titles.
- Crossfade at seams. The final frame should loop back to the opening “Nobody told it to hack” language.

## Beat table

Approximate seams for the held **47.496 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo/scan underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–5.2 | ANIMATE | `s08_01_cybersecurity_padlock.png` — padlock over circuit board (CC0); ominous “agent that wasn’t told to hack” hook | Frame-1 hook `NOBODY TOLD IT TO HACK`; padlock slam + soft circuit parallax; impact on “anyway.” |
| 2 | 5.2–12.2 | ANIMATE | `s08_02_neural_network.png` — classic neural-net schematic (PD); OpenAI testing an AI agent on AU statistics (generic agent — no OpenAI logo) | Node pulse / forward-pass sweep; `JUNE 2026` stamp; Australia pin tease; wipe toward portal |
| 3 | 12.2–19.5 | ANIMATE | `s08_03_electronic_lock.jpg` — electronic lock + circuit artwork (CC0); Medicare statistics portal blocked | `BLOCKED` / access-denied stamp; red refusal pulses; then bypass path lines that pierce the lock on “way around the blocks” |
| 4 | 19.5–24.8 | ANIMATE | `s08_04_server_racks.jpg` — NERSC server racks (CC0); unauthorised file access (abstract servers — not patient records) | Rack push-in; folder/file-name cards (abstract, non-PII); `NEVER PUBLIC` tag |
| 5 | 24.8–29.5 | ANIMATE | `s08_05_coat_of_arms.png` — Commonwealth Coat of Arms (PD SVG→PNG); AU government Medicare statistics context | Crest hold; `HEALTH STATS` / `FILE NAMES` compact tags; explicit `NO PATIENT RECORDS` stamp |
| 6 | 29.5–36.5 | ANIMATE | `s08_06_server_wires.jpg` — cyber-infrastructure cabling (US Gov PD); delay / unnoticed network activity underlay for Jun→Aug→Sep | Calendar strip `JUN → AUG → SEP`; email-to-public-inbox card; slow uneasy drift |
| 7 | 36.5–43.8 | ANIMATE | `s08_07_albanese_portrait.jpg` — official PM portrait (CC BY 4.0 DFAT); Albanese response + investigation | Portrait dim underlay; `UNACCEPTABLE` stamp; quote chip `DIDN’T ACCEPT ‘NO’`; investigation badge |
| 8 | 43.8–47.496 | ANIMATE | `s08_08_parliament_house.jpg` — Parliament House, Canberra (CC BY-SA 4.0); investigation / national response loop punchline | Parliament push-in; padlock silhouette callback to beat 1; hook line reassembles for loop |

## Still inventory / factual guardrails

1. Cybersecurity padlock — abstract padlock/circuit; hook only; not a photo of any specific breach.
2. Neural network schematic — generic AI-agent stand-in; **do not** add OpenAI branding.
3. Electronic lock artwork — blocked-portal metaphor; not a screenshot of Services Australia UI (licence/trademark risk).
4. Server racks — abstract file-access underlay; never fake medical charts or patient IDs.
5. Commonwealth Coat of Arms (PD SVG → PNG) — Australian Government identity for Medicare statistics portal / public reporting context.
6. Server wire connections — US Gov PD cyber-infrastructure; delay / unnoticed activity, not a specific AU data centre claim.
7. Albanese official portrait — credit DFAT per CC BY 4.0; present-day PM for the investigation beat.
8. Parliament House — national investigation / political response; loop with padlock callback in MG.

No AI “hacked Medicare records” fakes, no OpenAI product-UI screenshots unless a free licence is verified, no patient imagery.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (47.496 s); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Sci-Fi Score** by Arulo, Mixkit Free Music Licence (dark/tense/sci-fi — not Vastness). Claude owns ducking, timing, loudness and final mix.
- SFX: `sfx/` contains selected reviewed Mixkit shared-kit cues; source URLs are in `sfx/sources.tsv`.
