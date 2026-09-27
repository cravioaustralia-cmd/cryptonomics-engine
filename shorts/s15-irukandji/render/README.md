# Render — s15 Irukandji (smaller than your fingernail)

- **Claude owns `scenes.js`**: design and animate all beats, captions-safe MG overlays, mix and render. Do not add a prebuilt scene file in this hand-off.
- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).
- Timing: retune against Whisper word timings from held `audio/vo.mp3` (35.640 s).
- **Maps rule (locked):** territory overlays on real satellite/topo basemap (terrain visible under colour); parchment/weathered fill; thick white outer glow on borders; bold 3D/extruded labels + drop shadows; soft shadows. **Northern Australia / GBR / tropical north waters only** — never wrong-country stand-in. Prefer `s15_04_…` MODIS basemap; rebuild `s15_06_…` locator in locked style rather than showing flat schematic as hero.
- **Visual soft rules:** no gore / no graphic wound stills; ECG = mood only; deaths soft-worded; do not conflate with *Chironex*.

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s15-irukandji --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s15-irukandji
```

The render writes to `out/`; generated MP4s and frame dumps stay out of Git. Claude should provide the reviewed MP4 in its PR, not in this staging commit.

## Mix warning (critical — keep PR #21 / #23 / #25 path)

Do **not** reintroduce single-pass `loudnorm` on the VO before `amix`. Correct path: measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on the master only**. Prefer **32-bit float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Port the fixed mixer from PR #21 / #23 / #25 if `main` still has the old single-pass VO loudnorm (that ate ~3 s of VO tail on s09).
