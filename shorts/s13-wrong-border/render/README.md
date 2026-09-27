# Render — s13 The Wrong Border (SA–Vic)

- **Claude owns `scenes.js`**: design and animate all beats, captions-safe MG overlays, mix and render. Do not add a prebuilt scene file in this hand-off.
- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).
- Timing: retune against Whisper word timings from held `audio/vo.mp3` (38.376 s).

```bash
cd shorts/shared/render && npm install        # once
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node shorts/shared/render/snapshot.mjs shorts/s13-wrong-border /tmp/s13-frames 0 2.5 5 7.5   # spot frames
CHROMIUM_PATH=… node shorts/shared/render/render-episode.mjs shorts/s13-wrong-border
```

The render writes to `out/`; generated MP4s and frame dumps stay out of Git. Claude should provide the reviewed MP4 in its PR, not in this staging commit.

## Mix warning (critical — keep PR #21 / #23 / #25 path)

Do **not** reintroduce single-pass `loudnorm` on the VO before `amix`. Correct path: measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on the master only**. Prefer **32-bit float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Port the fixed mixer from PR #21 / #23 / #25 if `main` still has the old single-pass VO loudnorm (that ate ~3 s of VO tail on s09).

## Built (Claude, 2026-09-27)

- `scenes.js`: 12 beats (hook · London · 1836 · survey · hundreds · Todd · offset · strip · decades · 1914 · today · loop), photo/period-map underlay + SVG MG on every beat.
- `../transcript.json`: faster-whisper `small.en` word timings, spelling corrected to the script.
- `config.json`: 52 SFX cues retimed to the Whisper beats; mix `voLufs −16`, master `−14 LUFS`.
- Output: `../deliverables/s13-wrong-border.mp4`, `../deliverables/contact-sheet.jpg` and `../deliverables/upload.md`.
