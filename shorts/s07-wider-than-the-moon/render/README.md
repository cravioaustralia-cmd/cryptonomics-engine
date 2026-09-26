# Render — s07 Wider Than the Moon

- **Claude owns `scenes.js`**: design and animate all beats, captions-safe MG overlays, mix and render. Do not add a prebuilt scene file in this hand-off.
- Use `config.json` as the timing/audio starting point and `../transcript.json` if Claude generates word timings locally.
- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s07-wider-than-the-moon --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s07-wider-than-the-moon
```

The render writes to `out/`; generated MP4s and frame dumps stay out of Git. Claude should provide the reviewed MP4 in its PR, not in this staging commit.
