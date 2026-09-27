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

## Built (Claude, 2026-09-27)

- `scenes.js` has 12 beats: hook · missed · 1838 · towns · war/1918 · renames · Hahn · capital · queen · 1935 · never · loop. Every beat has a photo underlay or the 3D satellite map, with SVG MG on top.
- `map3d.js` (served to the page as `/ep/map3d.js`) is the **3D textured-satellite map**. WebGL2 renders it inside `renderFrame(t)`, with no 3D library and no Remotion. It drapes real Sentinel-2 true colour (`images/s14_12_…`) over AWS Terrain Tiles elevation (`images/s14_13_…`) at ×3.2 vertical exaggeration, cut as an extruded slab with rock side walls. The camera flies per frame. Pins are projected from real WGS84 town coordinates, so HAHNDORF / LOBETHAL / KLEMZIG / BLUMBERG→BIRDWOOD / ADELAIDE sit on the actual towns. A sepia shader grade marks the 1918 renames.
- Shared render changes: episode helpers are served at `/ep/*`, `frame.html` awaits `EPISODE.ready`, and `renderFrame` may return a promise. `capture.mjs` / `snapshot.mjs` await that promise, so each map frame's data-URL image has loaded before the screenshot.
- `../transcript.json` holds faster-whisper `small.en` word timings, with spelling corrected to the script.
- `config.json` has 59 SFX cues retimed to the Whisper beats. Mix: `voLufs −16`, master `−14 LUFS`.
- Headless WebGL: Playwright's bundled Chromium with SwiftShader is enough (WebGL2). Set `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` if the npm Playwright build has no matching browser.
