# Render — s10

Claude-owned `scenes.js` + `config.json` (SFX cues, mix levels). SVG + renderFrame(t) + Playwright + ffmpeg; no Remotion.

```bash
# from repo root (set CHROMIUM_PATH if the Playwright browser build differs)
node shorts/shared/render/render-episode.mjs shorts/s10-shark-arm-case
```

Word timings: `../transcript.json` (faster-whisper small.en on `audio/vo.mp3`; "Xboxer" corrected to "ex-boxer").
Final MP4 + contact sheet are copied to `../deliverables/`.
