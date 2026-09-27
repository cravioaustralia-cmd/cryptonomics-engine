# Render — s14 German Place Names (SA WWI wipe)

- **Claude owns `scenes.js`**: design and animate all beats, captions-safe MG overlays, mix and render. Do not add a prebuilt scene file in this hand-off.
- Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).
- Timing: retune against Whisper word timings from held `audio/vo.mp3` (45.000 s).
- **Maps rule (locked):** whenever maps appear, use **textured satellite** basemaps with a **3D** extruded/tilted treatment — detailed photographic/satellite texture (hills, farmland, towns visible). **NOT** flat schematic, outline, or bare relief-only maps. Build 3D satellite map MG for wipe/rename beats. `s14_11_sa_relief_location_underlay.png` is relief-only underlay support — do not use as a flat schematic hero.

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s14-german-place-names --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s14-german-place-names
```

The render writes to `out/`; generated MP4s and frame dumps stay out of Git. Claude should provide the reviewed MP4 in its PR, not in this staging commit.

## Mix warning (critical — keep PR #21 / #23 / #25 path)

Do **not** reintroduce single-pass `loudnorm` on the VO before `amix`. Correct path: measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on the master only**. Prefer **32-bit float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Port the fixed mixer from PR #21 / #23 / #25 if `main` still has the old single-pass VO loudnorm (that ate ~3 s of VO tail on s09).
