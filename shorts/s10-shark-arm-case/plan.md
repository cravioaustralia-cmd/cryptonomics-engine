# Shot plan — s10-shark-arm-case (fast Atlas rebuild)

## Direction

- **Claude owns design, animation, mix and render.** No `scenes.js` in staging; Claude creates `render/scenes.js`.
- Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg** only (no Remotion). Reuse `shorts/shared/render/`.
- Photo-underlay + MG every beat (Skylab style). Captions ~70% lower-middle; never overlap badges/stamps.
- On-screen text ONLY: frame-1 hook `THROWN UP BY A SHARK`, plus short labels (`1935`, `SYDNEY`, `TIGER SHARK`, `TWO BOXERS`, `CUT OFF`, `JAMES SMITH`, `MURDER`, `WALKED FREE`, `NEVER FOUND`, `A SHARK`). No VO-echo title cards.
- No gore. Loop: last beat should land cleanly back toward the opening aquarium/arm-vomit language.
- **Mix warning:** do **not** run single-pass `loudnorm` on the VO *before* amix (it eats ~3s of VO tail — see s09). Prefer one master loudnorm after amix, or measured two-pass / pad VO first.

## Beat table (retune to Whisper timings)

| # | Mode | Underlay | Motion / MG |
|---|---|---|---|
| 1 | ANIMATE | `s10_01_coogee_pier_1929.jpg` | Hook `THROWN UP BY A SHARK`; `1935` / `SYDNEY`; crowd push-in; shock on “human arm” |
| 2 | ANIMATE | `s10_02_tiger_shark.jpg` | `TIGER SHARK` lock-up; underwater drift; present-day wildlife label language if needed |
| 3 | ANIMATE | `s10_03_two_boxers.jpg` | Tattoo / two-boxers stamp; wipe to `CUT OFF` / knife fact tag (no blood) |
| 4 | ANIMATE | `s10_04_police_court_sydney.jpg` | `JAMES SMITH`; `MURDER` / delivery-service compact tags |
| 5 | ANIMATE | `s10_05_circular_quay_1930.jpg` | Harbour push; tense grade on “delivery service” |
| 6 | ANIMATE | `s10_06_1935_sedan.jpg` | `WITNESS` dims; car crop; no body/wound |
| 7 | ANIMATE | `s10_07_darlinghurst_court.jpg` | `WALKED FREE` / `NEVER FOUND` stamps |
| 8 | ANIMATE | `s10_08_tiger_shark_loop.jpg` | Punchline → `A SHARK`; loop callback to opening hook |

## Audio

- Held Atlas VO: `audio/vo.mp3` (fast energetic) — do not re-record.
- Bed: **Vastness** — Andrew Ev (Mixkit) in `music/music.mp3` / `audio/music.mp3`.
- SFX: Mixkit cues in `sfx/` (`sources.tsv`).
