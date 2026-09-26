# Render — s09 Wombat Cube Poop

Claude-owned premium build: `scenes.js` (design + animation), `config.json` (SFX cue timing + mix), `../transcript.json` (word timings).

- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).
- Timing: `../transcript.json` — faster-whisper `small.en` word timestamps on the held Atlas VO `audio/vo.mp3` (33.792 s, byte-identical to staging), punctuation aligned to `script.md`.
- Look: full-bleed photo/schematic underlay every beat + SVG MG; cube-grid wipes (hard cuts, no dip to black) for the fast VO.

```bash
cd shorts/shared/render && npm install        # once
# if Playwright's pinned browser isn't installed, point at a local Chromium:
#   export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
node shorts/shared/render/contact-sheet.mjs shorts/s09-wombat-cube-poop --every 1.5
node shorts/shared/render/render-episode.mjs shorts/s09-wombat-cube-poop
```

## Beat map (seams cut to word timings)

| # | Time (s) | Underlay | Motion graphics | MG text |
|---|---|---|---|---|
| 1 | 0–4.45 | `s09_01` cube scat | 3D wireframe cube wraps the scat; corner-dot pop + burst on “cubes”; 90° spin + shake on “weirder” | frame-1 hook `PERFECT CUBES` |
| 2 | 4.45–5.92 | `s09_02` Maria Island wombat | punch-in; name chip slam on “wombat”; pointer to the head | `WOMBAT` · *Vombatus ursinus* |
| 3 | 5.92–9.15 | `s09_04` museum cube specimens | `~0→~100` counter with 25 falling iso cubes; night falls on “night” (tint, moon, stars) | `~100` · `/ NIGHT` |
| 4 | 9.15–12.3 | `s09_03` wombat face | curious push + tilt; poo-cube pops on “cube”; round hole → arrow → cube on “round hole”; `?` | (glyph only) |
| 5a | 12.3–14.85 | `s09_05` PD gut schematic on paper | live magnifier sweeping the intestines | `GUT DIAGRAM · ILLUSTRATIVE` |
| 5b | 14.85–20.22 | same schematic, blurred + dark | tube with stiff (teal) / stretchy (pink, wobbling) wall segments; blob squeezes through; cross-section ring squares off; corner brackets + bursts on “corners” | `STIFF` · `STRETCHY` |
| 6 | 20.22–25.6 | `s09_06` Narawntapu burrow | spinning cube + orbiting `?` on “why cubes”; cubes land on the mound on “leave them”; pin drop on “rocks”; dashed territory ring + scent pulses | `THEORY` · `TERRITORY` |
| 7 | 25.6–27.42 | `s09_07` Cradle Mountain scat | ramp test: ball rolls off-screen, cube stays put + check | `DON'T ROLL` stamp |
| 8 | 27.42–31.3 | `s09_08` PD medal art (gold line filter, clipped to the figure — no “National Medal” ring text, no Ig Nobel branding) | coin flip-in, rays, sparkles, ribbons; ink stamp on “prize”; medal lifts away | `PRIZE` |
| 9 | 31.3–33.792 | `s09_01` (callback) | wire cube redraws + settles; `PERFECT` / `CUBES` slam back on the spoken words; last frame = frame 1 for the loop | `PERFECT CUBES` |

Captions: shared engine style at ~70 %, phrase-chunked (≤24 chars, balanced) for the fast delivery; all MG sits above y≈1200.

## Mix

VO loudnorm → music bed (Fun and Games, `musicVol` 0.2) sidechain-ducked under the VO → 29 SFX cues on the beats (trimmed with `dur`) → limiter + master loudnorm. Measured: **−14.9 LUFS integrated, −1.4 dBTP**.

Generated MP4s and frame dumps under `out/` stay out of Git; the reviewed cut and contact sheet are in `../deliverables/`.
