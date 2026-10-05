# Render — s32-phar-lap

Claude owns `scenes.js` and the Playwright + ffmpeg build here. Reuse `shorts/shared/render/`. Atlas VO will be at `audio/vo.mp3` before paste. **Claude must not re-record it. Do not overwrite it.** **Do not write scenes.js in the scaffold. Do not re-record VO.** No Remotion. **MAP ANIMATION** — kinetic cartography is the picture, not a photo-underlay. Match the GeoArchivez quality bar in `MAP_EXPLAINER_MODE.md`.

**Hard line:** the horse route (Timaru → Sydney → Pacific → Mexico), the catalogue flip, the near-miss duck, the three-city split pins, and the Flemington crowd camel are all on the map. Real photos are small name cards only.

**First frame:** map of the Tasman Sea; tiny chestnut horse icon gallops Timaru → Sydney; dotted Pacific route toward Mexico; unspoken hook `THREE CITIES`. Camera already drifting. No photo-underlay. No emoji.

**Portrait lock:** `images/s32_phar_lap.jpg` (and optional Melbourne Cup still) — public domain, **small name cards only**. No AI historical stills.

**Gags (all on the map, stage exactly):**
1. On “warts” — cartoon zoom on the foal icon’s face + little “boing”.
2. On “picked out of a sales catalogue” — catalogue page icon flips over Timaru, one entry circled.
3. On “someone tries to shoot him” — near-miss whoosh; horse icon ducks.
4. On “three cities split him up” — Melbourne / Wellington / Canberra pins light with `HIDE` / `SKELETON` / `HEART`; tug-of-war rope across the Tasman.
5. Series motif: tiny unlabelled camel hidden in the Flemington crowd (not a joke character).

**Master map:** load prior IJ polylines from other commits only (Mary `mary.escape` / `f83a646`; Hinkler `routes.flight` in `3db0f94`; Robyn `WAY` on `origin/claude/s28-robyn-davidson-map-gwcpin`; ep5 fence / ep6 Mawson only if real polylines exist). No episode 3. No s29. If you cannot load them: **pull back over the Tasman / Pacific route and hold**.

**SFX:** sparse (~6–10), under VO. Not dense whooshes. Catalogue flip, boing, near-miss whoosh, pin lights, rope stretch. Do not use record-scratch unless it clearly earns a beat.

**Mix path (locked):** measure VO → static gain + `apad` → float `amix` → two-pass loudnorm on master only (~−14 LUFS). **True peak ≤ −1.5 dBTP on the AAC file, not just the WAV.** s30 AAC peaked at −1.32 dBTP — leave headroom (WAV limiter nearer −2.0 to −2.5) and measure the AAC. Music Skyline Mixkit 601 ~4 dB quieter than s18 original Silent Descent bed under VO.

**Loop:** spoken `Because, believe it or not,` bridges into `Australia’s greatest racehorse…`
