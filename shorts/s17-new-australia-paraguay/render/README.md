# Render — s17-new-australia-paraguay

Claude owns `scenes.js`, the mix and the Playwright + ffmpeg build here. It reuses `shorts/shared/render/`. No Remotion.

## Built (Claude, 2026-09-28)

### `scenes.js`
13 scenes on the Whisper timings in `../transcript.json`:

1. **Frame-1 hook:** `NEW AUSTRALIA` (3D, light sweep) over Sydney Cove c.1890.
2. **Voyage tease:** a fast pan across the South Pacific on the locked voyage map. The route draws Sydney → Cape Horn → up the River Plate, then `SOUTH AMERICA` and `PARAGUAY` labels appear, a pin drops and `NEW AUSTRALIA` lands on the zoom-in.
3. **Money tease:** a stylised polymer `$10` frame with a silhouetted portrait, a `?`, and a `$` burst.
4. **1893:** a sepia shearers' strike card with a `1893` stamp and a plunging (unlabelled) recession line. The *Queenslander* strike sketches slide in on "Striking shearers feel beaten".
5. **William Lane:** the *Worker* 1893 portrait card over a Nueva Londres dawn, with a `WILLIAM LANE` label and a paradise sun-ray burst.
6. **Paraguay colony map:** a push-in on the forest, then a pull-back to the whole country. The MODIS still is feathered into the aligned Blue Marble underlay.
   - A 3D `PARAGUAY` label, a parchment wipe and a white border glow come in, and settlers stream in from the east.
   - A figure panel where a dark sweep leaves many of the figures as faint outlines. No number is shown.
7. **July 1893:** a tear-off calendar over Sydney Cove, with a `SYDNEY` chip.
8. **Royal Tar:** the ship photo slams in with a `ROYAL TAR` label.
9. **Voyage:** a `SYDNEY` pin, then a barque icon sails the route with a camera follow. An `OVER 200` panel shows a crowd counting in.
10. **Rules:** the New Australia colony photo card and three medallions: an alcohol ban slash, a no-mixing slash, and a gate closing. A `BRITISH ONLY` stamp slams in.
11. **Split:** the colony map zooms to the colonies. The `NEW AUSTRALIA` pin cracks, then a branch draws to `COSME`. `ABOUT 2,000` counts up, descendant dots bloom, and a `NUEVA LONDRES` plaza card appears.
12. **Mary Gilmore:** the 1891 portrait with a `MARY GILMORE` label and a quill flourish. It then becomes the polymer `$10` frame with the later portrait in its oval, a `$10` chip and sparkles.
13. **Loop:** on "Because…" it whips back to the exact frame-1 composition, so it cycles into "Hundreds of Australians…".

### `build-map-layers.py`
Builds the locked-style map layers (`images/s17_20…26`). See `images/SOURCES.md`.

### `config.json`
- 50 SFX cues on the word timings.
- Mix settings: `musicStart 1.0`, `musicVol 0.13`, `voLufs −16`, master −14 LUFS, and a short 0.4 s tail fade so the loop stays live.

### Mix path
This is the shared `mix-audio.mjs`, the fixed mixer from PR #21/#23/#25 (ported from the s16 branch):
1. Measure the VO.
2. Apply static gain + `apad`.
3. Float `amix`.
4. Run a two-pass `loudnorm` on the master only.

### Font
Oswald (SIL OFL), served as `/ep/Oswald-VF.ttf`.

## Build commands
```bash
cd shorts/shared/render && npm install        # once
python3 shorts/s17-new-australia-paraguay/render/build-map-layers.py   # map layers (numpy, scipy, pillow)
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node shorts/shared/render/render-episode.mjs shorts/s17-new-australia-paraguay
```
