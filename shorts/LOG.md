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

## 2026-09-27T13:00:25+10:00 — s11 Cassowary (scaffold)
- Episode: `shorts/s11-cassowary/`
- Held Atlas en-AU VO `audio/vo.mp3` (**39.408 s**) from `/workspace/deliverables/s11-cassowary/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Vastness bed, Mixkit SFX (+ jungle/forest ambience), render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 10 Commons free-licence (southern cassowary QLD, claw foot, 1920s Cook Highway PD, seed dropping, Daintree); no AI stills; no gore
- Hook: Looks like a dinosaur
- Note: s06 reserved Somerton Man; s10 Shark Arm rebuild; this is s11

## 2026-09-27 — s11 The Cassowary (premium build, Checkpoint C)
- Episode: `shorts/s11-cassowary/` — held Atlas VO (39.408 s), not re-recorded. Issue #22.
- Claude-owned `render/scenes.js` (8 beats, photo underlay + SVG MG every beat) + `render/config.json` (36 SFX cues).
- Mix: measured VO → static gain + apad → amix → two-pass master loudnorm (PR #21 path). Premix now 32-bit float (16-bit clipped the gained VO peaks).
- Verified: faster-whisper on the final MP4 recovers every VO word; "…looks like a dinosaur." ends at 38.98 s (raw VO 39.02 s). −14.6 LUFS / −1.7 dBTP.
- Output: `deliverables/s11-cassowary.mp4` (1080×1920, 30 fps) + `deliverables/contact-sheet.jpg`; upload copy in `upload.md`.
