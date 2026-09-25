# s03 LOG — Buckley’s Chance

## 2026-09-25 — Premium build (Issue #8)
Claude owns design, animation, mix and render. Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg (no Remotion).

### Timing
- `transcript.json` from held `audio/vo.mp3` (57.456 s) via faster-whisper `small.en` word stamps; matches `script.md`. VO not re-recorded.

### Beats (photo underlay + MG on every beat)
| # | Time (s) | Underlay | Motion graphics |
|---|---|---|---|
| 1 | 0–10.35 | SLV Buckley portrait (later likeness) | Frame-1 hook lock-up “Buckley’s chance”, 1803 year chip, eucalypt shadow sweep as he vanishes, ink **MISSING** stamp on “dead”, revive + **WILLIAM BUCKLEY** name plate, 6′6″ ruler grows (≈198 cm) |
| 2 | 10.35–16.95 | 1803 Admiralty chart of Port Phillip | Pin drop + ink cross on **SULLIVAN BAY**, camera pull-out to **PORT PHILLIP BAY**, footprint route clockwise round the bay to the Bellarine, day tally marks (weeks, uncounted) |
| 3 | 16.95–23.0 | Kulin language map (toned) | **WADAWURRUNG** region outline draws + ochre fill (map spells “Wathaurong” — credited), warm welcome ripples at the arrival point. No spear/grave imagery. |
| 4 | 23.0–35.75 | You Yangs / Wurdi Youang panorama (present day) | Long horizon pan, golden grade, light-leak on “took him in”, **WADAWURRUNG COUNTRY** tag, 1803→1835 ring counter lands **32 YEARS**, four line-icons (language, law, country, family) pop on the ring — icons, not VO-echo words |
| 5 | 35.75–40.35 | Wedge sketch, Indented Head huts, Aug 1835 | Sketch sheet tilts in with registration marks, **1835** stamp, schematic **TASMANIA → PORT PHILLIP** crossing (no invented coastline), hut glow + chimney smoke on “camp” |
| 6 | 40.35–47.55 | Woodhouse 1861 painting | Whip-pan (motion blur) from settlers to Buckley on “huge”, spotlight + sunburnt rim glow, 6′6″ height bracket, **WILLIAM BUCKLEY** tag |
| 7 | 47.55–54.0 | Woodhouse painting, tight on Buckley | **AUSSIE PHRASE** tag, hand-lettered “Buckley’s” wipe + **CHANCE** slam, red swash underline, glint |
| 8 | 54.0–57.456 | 1803 chart again | Route rewinds to Sullivan Bay, **ODDS · 1803** gauge needle drops to **0%** on “none”, portrait + hook bloom back in so the last frame matches frame 1 (loop) |

On-screen text is names/places/key facts/hook only; captions carry the VO. All overlays keep clear of the ~70% caption band and the right-edge YT rail (checked on contact sheets).

### Audio
- `render/config.json` → `mix.duck`: VO clean-up (HPF + light compression), Vastness bed sidechain-ducked under VO, 33 timed SFX cues, two-pass loudnorm → `audio/final-mix.mp3` (−14.4 LUFS integrated, −1.5 dBTP).

### Renderer changes (shared, backwards compatible)
- `capture.mjs`: `openEpisodePage()` helper; serves `/fonts/*`; falls back to pre-installed Chromium; encoder preset `medium`, JPEG q94.
- `frame.html`: awaits optional `EPISODE.ready` (fonts + image decode) before frame 0.
- `mix-audio.mjs`: opt-in `mix: { duck: true }` path (sidechain ducking, per-cue `dur` trims, two-pass loudnorm). Default path unchanged.
- `render-episode.mjs`: passes `mix`, resolves relative `sfxDir`.
- New `contact-sheet.mjs`; new `shorts/shared/fonts/` (OFL).

### Output
- `deliverables/s03-buckleys-chance.mp4` (1080×1920, 30 fps, 57.456 s, H.264 + AAC)
- Contact sheet: `deliverables/s03-contact-sheet.jpg`
