# Render — s16-nullarbor-845

Claude owns `scenes.js`, the mix and the Playwright + ffmpeg build here. It reuses `shorts/shared/render/`. No Remotion.

## Built (Claude, 2026-09-28)
- **`scenes.js`**: 10 beats on the Whisper timings in `../transcript.json`:
  1. hook: `+8:45` flip-clock over the Eyre Highway, a parchment "strip" ribbon on the horizon, and a `NO LAW` gavel strike
  2. bizarre: a spinning clock glitches and locks on 8:45
  3. locked map: `NULLARBOR PLAIN`, WA/SA parchment wipes, a 129°E border glow, a Border Village pin and the `WA–SA BORDER` photo card
  4. Perth | Adelaide: diagonal split, AWST 8:00 / ACST 9:30 clocks, `UTC`, `+8` / `+9:30`
  5. corridor map: the Eyre Hwy draws in, roadhouse dots drop, `EUCLA` / `BORDER VILLAGE` pins and photo cards, a `+8 ──●── +9:30` slider snaps to `+8:45`, and the CWST corridor glows
  6. deadpan `+8:45` flip over the Eucla Motor Hotel, with `UTC+8:45`
  7. UTC-offset dial: hour / half / quarter ticks, the bezel spins and parks +8:45 at the top, plus a ¼-hour wedge clock
  8. the CWST highway sign card: lock-on brackets, a ring on "45 min", a dashboard clock advancing 45 min, and `EYRE HWY` / `+45 MIN`
  9. `TIME ZONES` register: AWST ✓, ACST ✓, CWST gets an `UNOFFICIAL` stamp plus `NO STATUTE`, then a `BEGAN` year flip counter that never settles (`????`)
  10. loop: a whip back to the exact frame-1 composition, so "Yet to this day," cycles into the open
- **`build-map-layers.py`**: builds the locked-style map layers (`images/s16_15…19`) from AWS Terrain Tiles plus the NASA Nullarbor satellite (`s16_02`), georeferenced. See `images/SOURCES.md`.
- **`config.json`**: 55 SFX cues on the word timings. Mix settings: `musicStart 2.0` (the bed's first ~2 s is a fade-in), `musicVol 0.12`, `voLufs −16`, master −14 LUFS.
- **Mix path** (shared `mix-audio.mjs`, fixed mixer ported from PR #21/#23/#25/#27/#31):
  1. Measure the VO.
  2. Apply static gain + `apad`.
  3. Float `amix`.
  4. Run two-pass `loudnorm` on the master only.
- **Font:** Oswald (SIL OFL), served as `/ep/Oswald-VF.ttf`.

```bash
cd shorts/shared/render && npm install        # once
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node shorts/shared/render/render-episode.mjs shorts/s16-nullarbor-845
```
