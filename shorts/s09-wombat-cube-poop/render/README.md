# Render — s09 Wombat Cube Poop

- **Claude owns `scenes.js`**: design and animate all beats, captions-safe MG overlays, mix and render. Do not add a prebuilt scene file in this hand-off.
- Use `config.json` as the timing/audio starting point and `../transcript.json` if Claude generates word timings locally after VO lands.
- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s09-wombat-cube-poop --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s09-wombat-cube-poop
```

The render writes to `out/`; generated MP4s and frame dumps stay out of Git. Claude should provide the reviewed MP4 in its PR, not in this staging commit.
