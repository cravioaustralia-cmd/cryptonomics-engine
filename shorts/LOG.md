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

## 2026-09-26 — s04 First European Residents (Issue #10) premium build
- Episode: `shorts/s04-first-european-residents/` — held VO reused (61.56 s), not re-recorded.
- Timing: `transcript.json` from faster-whisper medium.en word timestamps (“Wiebbe” spelling fixed).
- `render/scenes.js`: 9 beats, photo underlay on every beat + SVG MG (hook dock + 1629→1788 counter, VOC seal, WA locator route + reef strike, plate longboat ring, Cornelisz lock-up, 110-lights → 100+, fort wall line-draw, rescue ship + ring lock, name strike, Abrolhos → mainland crossing, name type-on + fading footprints, wreck-site pulse + 1629→? loop into frame 1).
- Shared renderer (backward compatible): `/fonts/` route + OFL fonts, `EPISODE.preload`, `contact-sheet.mjs`, `CHROMIUM_PATH`, encoder overrides via `config.video`, ducked mix via `config.mix` (sidechain duck, SFX `dur`, final loudnorm), relative/stale `sfxDir` fallback.
- Mix: static-gain VO + sidechain-ducked Vastness bed + 39 SFX cues; two-pass (sample-exact premix → one gain to −14 LUFS + latency-compensated limiter), −1.8 dBTP, exactly 61.560 s, VO verified 0 ms offset. Mux maps streams explicitly (no stray SFX ID3 chapter) and keeps full duration.
- Output: `out/s04-first-european-residents.mp4` → `deliverables/s04-first-european-residents/`.
