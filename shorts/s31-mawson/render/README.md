# Render — s31-mawson

Claude owns `scenes.js` and the Playwright + ffmpeg build here. Reuse `shorts/shared/render/`. Atlas VO will be at `audio/vo.mp3` before paste. **Claude must not re-record it. Do not overwrite it.** **Do not write scenes.js in the scaffold. Do not re-record VO.** No Remotion. **MAP ANIMATION** — kinetic cartography is the picture, not a photo-underlay. Match the GeoArchivez quality bar in `MAP_EXPLAINER_MODE.md`.

**Hard line:** the route, the crevasse, the sledge split, and the ship leaving are all on the map. Real portraits are small name cards only.

**First frame:** Antarctica satellite; ice reads as ice (no blown white ridges); three sledges moving east; hidden snow-camel; hook `A FEW HOURS` (never spoken).

**Portrait lock:** `images/s31_douglas_mawson.jpg`, `images/s31_belgrave_ninnis.jpg`, `images/s31_xavier_mertz.jpg` — public domain, name cards only. No emoji. No AI faces.

**Gag:** flag pins + woolly hats on “two friends” only. None after the crevasse.

**Suspense:** Distance-to-base counter ticks down; sledge icon snaps in half; ship leaves the base pin as Mawson arrives.

**Master map:** load prior IJ polylines from other commits only (Mary `mary.escape` / `f83a646`; Hinkler `routes.flight` in `3db0f94`; Robyn `WAY` on `origin/claude/s28-robyn-davidson-map-gwcpin`). Episode 5 fence only if a real polyline exists. No episode 3. No s29. If you cannot load them: **pull back over Antarctica and hold**.

**SFX:** sparse, under VO. Not dense whooshes. Do not use record-scratch. Nothing playful after the crevasse.

**Mix path (locked):** measure VO → static gain + `apad` → float `amix` → two-pass loudnorm on master only (~−14 LUFS). **True peak ≤ −1.5 dBTP on the AAC file, not just the WAV.** s30 AAC peaked at −1.32 dBTP — leave headroom (WAV limiter nearer −2.0 to −2.5) and measure the AAC. Music Skyline Mixkit 601 ~4 dB quieter than s18 original Silent Descent bed under VO.

**Loop:** spoken `Because once,` bridges into `Three men set out`.
