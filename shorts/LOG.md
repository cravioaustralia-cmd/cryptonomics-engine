# History Shorts production log

## 2026-09-25 — Switched repo
- Production home moved from cravioaustralia-cmd/shorts-channel to cravioaustralia-cmd/cryptonomics-engine per user.
- Shared Mixkit SFX kit copied into public/sfx/ and shorts/shared/sfx/.

## 2026-09-25 — Non-Remotion rebuild (s01)
- Remotion waived override **revoked**. History Shorts use SVG + renderFrame(t) + Playwright + ffmpeg only.
- Scaffolded reusable renderer at `shorts/shared/render/`.
- Rebuilding `s01-skylab-esperance` without Remotion CLI / `src/episodes` compositions.

## 2026-09-25 — s01 non-Remotion render complete
- Renderer: shorts/shared/render (SVG + renderFrame + Playwright + ffmpeg)
- Output: shorts/s01-skylab-esperance/out/s01-skylab-esperance.mp4 → deliverables/s01-skylab-esperance/
- Animations: hook slam, orbit/satellite, map pin, debris rain, debris card, museum plaque, council pop, ticket+ISSUED, UNPAID+year count, radio EQ + Scott Barley, cash pop, loop punchline

## 2026-09-25 — Incoming VO batch (02–06 held)
Unpacked 6 Grok VOs into shorts/incoming-vo/. #01 matches finished Skylab Short; #02–06 held until scripts arrive. Use matching file as VO (skip Grok re-record).

## 2026-09-25 — s02 man who named Australia (non-Remotion)
- Episode: `shorts/s02-man-who-named-australia/`
- VO: held file `incoming-vo/02-man-who-named-australia.mp3` (~64.968s) — not re-recorded
- Renderer: shorts/shared/render (SVG + renderFrame + Playwright + ffmpeg)
- Output: `shorts/s02-man-who-named-australia/out/s02-man-who-named-australia.mp4` → `deliverables/s02-man-who-named-australia/`
- Animations: hook station-gulp slam, circumnavigate ship+Flinders, Trim friendship, prison bars+Trim fade, AUSTRALIA name+book July 1814, candle die, London grow/station gulp, dig+lead plate, village rest+loop punchline
- Music: Mixkit Vastness (Andrew Ev) — pack “epic_cinematic_adventure” skipped (likely CC BY-NC-ND)
- Mix: VO + ducked music + timed SFX (shared + thematic), loudnorm on VO
- Licence note: image SOURCES.md is best-effort from pack; prefer cartoon motion over stills

## 2026-09-25 — s02 animation-primary rebuild (review fail fix)
- Prior cut FAILED review: photo slideshow + rudimentary SVG overlays; alpine mountain still used for Donington/Lincolnshire home village.
- Rewrote `shorts/s02-man-who-named-australia/render/scenes.js` to **ANIMATE-primary / STILL-as-card-only**.
- Deleted `images/s02_10_donington_st_mary.jpg` (alpine/Dolomite — geographically wrong). Village beat is pure English parish illustration.
- No full-bleed photo underlays (Euston, Mauritius coast, dig, portrait removed as backgrounds).
- Credibility cards only (brief): Flinders portrait, HMS Investigator, dig-site inset.
- Animated scenes: hook cemetery+station gulp, circumnavigate ship+Flinders, Trim deck friendship, prison bars+Mauritius island+Trim fade, AUSTRALIA slam+book, candle extinguish, London skyline grow+station gulp, dig particles+lead plate, English village rest+loop punchline.
- Re-rendered via `node shorts/shared/render/render-episode.mjs shorts/s02-man-who-named-australia`.
- Output: `out/s02-man-who-named-australia.mp4` (1080×1920 30fps ~64.9s) → `deliverables/s02-man-who-named-australia/`.
- Audio: held VO + Vastness + same SFX cues (re-mixed, not redesigned). No YouTube upload.

## 2026-09-25 — s02 MG rebuild (VO-echo killed)
- User rejected prior cut: VO-echo titles + weak design.
- Rewrote `s02…/render/scenes.js`: kill-list applied; short labels only; motion-graphics upgrades (wake/orbit, Trim blink, bars slam, ink stamp, page flip, candle smoke, skyline build, dig particles, plate rotate-in, cloud drift, crossfades).
- Updated MASTER_PROMPT.md, workflows/shorts-pipeline/SKILL.md, shorts/CLAUDE.md with on-screen text rule + MG quality bar.
- Re-rendered via `node shorts/shared/render/render-episode.mjs shorts/s02-man-who-named-australia`.
- Deliverable: `out/s02-man-who-named-australia.mp4` → `deliverables/s02-man-who-named-australia/`.

## 2026-09-26 — s09 wombat cube poop (scaffold)
- Episode: `shorts/s09-wombat-cube-poop/`
- VO: held Atlas en-AU `audio/vo.mp3` (33.792 s) from Downloads / deliverables vo-raw — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Mixkit Fun and Games bed, shared SFX copy, render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 8 Commons free-licence (cube scat, common wombats, digestive PD schematic, burrow, science-medal abstract); no AI stills

## 2026-09-27T09:42:41+10:00 — s10 Shark Arm Case (fast rebuild)
- Atlas VO 37.488s held; staging assets from s05 still pack; Claude owns scenes/mix/render.
- Hook: Thrown up by a shark

## 2026-09-27 — s10 Shark Arm Case: Claude build (issue #20)
- `render/scenes.js`: 11 photo-underlay + SVG MG beats timed to faster-whisper word timings (`transcript.json`); hook `THROWN UP BY A SHARK` on frame 1; the last frame matches frame 1 (checked by pixel diff).
- No gore: the arm is never shown; the knife beat is a forensic diagram and the witness beat is a flatline card.
- **Mix fix (shared `mix-audio.mjs`):** removed the single-pass `loudnorm` on the VO before amix (the s09 tail-loss bug). The VO now gets a measured *static* gain + `apad`, is amixed, then gets a measured two-pass linear `loudnorm` on the master only. Verified: Whisper on the final mix recovers all 107 VO words through "…human arm." (37.28 s).
- Shared renderer: SFX paths now resolve against the episode dir (they previously resolved against the cwd); `frame.html` decodes every still before the first frame; captions break at sentence ends; `CHROMIUM_PATH` override; new `snapshot.mjs` for check frames and contact sheets.
- Output: `s10-shark-arm-case/deliverables/s10-shark-arm-case.mp4` (1080×1920, 30 fps, 37.9 s, −14.6 LUFS) + `contact-sheet.jpg` + `upload.md`.
