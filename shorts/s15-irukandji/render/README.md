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

## Built (Claude, 2026-09-28)

- `scenes.js` has 12 beats: hook · fingernail scale · dread · map · sting · onset timer · symptoms (body scan → nausea → BP dial) · case notes · doom · hospital · loop · loop hook. Every beat has a full-bleed photo or the locked-style map as underlay, with SVG MG on top. It has its own compositor (true crossfades, whip, flash) and reuses `HS.captionSvg` / `HS.groupCaptions` from the shared engine.
- **Locked map:** `build-map-layers.py` classifies land from the NASA MODIS pixels (`s15_04`), so the coastline is the real Cape York / north Queensland coast. From that it builds the parchment fill (terrain visible), the offset soft shadow, the thick white outer glow and the coastal-waters band (`images/s15_12…15`). The map beat sweeps the parchment in, shimmers the waters with drifting jelly glyphs, and uses bold 3D-extruded labels with drop shadows: `CAPE YORK`, `GREAT BARRIER REEF`, `NORTHERN AUSTRALIA`.
- Loop: the last line whips into the vial, then flashes back to the frame-1 composition (macro + `IRUKANDJI`), so the end cycles into the open.
- `../transcript.json` holds faster-whisper `small.en` word timings, with spelling and punctuation corrected to the script (`Irukandji,` etc.).
- `config.json` has 41 SFX cues retimed to the Whisper beats. Mix: `musicStart 2.0` (the bed's first 2 s are silent), `musicVol 0.12`, `voLufs −16`, master `−14 LUFS` through the fixed two-pass master-only path.
- Font: Oswald (OFL), served from this folder as `/ep/Oswald-VF.ttf`.
- Headless: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` if the npm Playwright build has no matching browser.
