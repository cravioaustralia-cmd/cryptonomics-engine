# Render — s12 Koala Fingerprints

- **Claude owns `scenes.js`**: design and animate all beats, captions-safe MG overlays, mix and render. Do not add a prebuilt scene file in this hand-off.
- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).
- Timing: retune against Whisper word timings from held `audio/vo.mp3` (37.080 s).

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s12-koala-fingerprints --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s12-koala-fingerprints
```

The render writes to `out/`; generated MP4s and frame dumps stay out of Git. Claude should provide the reviewed MP4 in its PR, not in this staging commit.

## Mix warning (critical — keep PR #21 / #23 path)

Do **not** reintroduce single-pass `loudnorm` on the VO before `amix`. Correct path: measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on the master only**. Prefer **32-bit float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Port the fixed mixer from PR #21/#23 if `main` still has the old single-pass VO loudnorm.
