# Render — s21-broome-japanese-cemetery

Standard **Skylab** (photo underlay + SVG MG) — not map-explainer. SVG + `renderFrame(t)` + Playwright + ffmpeg via `shorts/shared/render/`. No Remotion.

| File | Role |
|---|---|
| `scenes.js` | 14 beat scenes, karaoke captions (~70%), transitions, fonts/image preload |
| `mix.mjs` | VO static gain + apad → float amix with Echoes bed + SFX → two-pass loudnorm on master only (−14 LUFS) |
| `contact.mjs` | Contact sheet via shared capture stills mode → `out/contact-sheet.jpg` |
| `build.mjs` | mix → capture → mux → `final/s21-broome-japanese-cemetery.mp4` |

```bash
(cd shorts/shared/render && npm ci)
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s21-broome-japanese-cemetery/render/contact.mjs
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s21-broome-japanese-cemetery/render/build.mjs
```
(`CHROMIUM_PATH` only when the pinned Playwright browser isn't downloaded.)

Timing: `../transcript.json` (faster-whisper medium.en word timestamps; "1 in 10" → "one in ten", loop line unpunctuated).
