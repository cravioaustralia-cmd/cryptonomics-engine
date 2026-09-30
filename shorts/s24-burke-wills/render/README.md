# Render — s24-burke-wills (MAP EXPLAINER)

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg. No Remotion. Reuses `shorts/shared/render/` (capture + frame loader).

## ⚠ Held VO covers only the back half of the script

`audio/vo.mp3` (39.168 s) starts at **"On the way back, food runs out…"** and ends on **"…story of how"**, which is about 112 of ~251 words.
The first half ("In 1860…" → "…never seeing the ocean") is **not in the file**. Whisper confirms speech starts at 0.00 s with no leading silence.
At the take's real pace (~2.9 words/s) the full script would run **~87 s**, not 39 s.

How this build handles it:
- Every beat in `scenes.js` is anchored to a **phrase in `transcript.json`**, not to a hard-coded second.
- **Held VO (back half):** beats 1–7 collapse into a 1.4 s route recap under the frame-1 `NINE HOURS` hook. The outward route self-draws Melbourne→Menindee→Cooper→Gulf with pins. The film then plays beats 8–13 at full quality. This is the Checkpoint C MP4.
- **Full VO (when recorded):** drop the new `vo.mp3` in, re-transcribe to `transcript.json`, and run `video`. Beats 1–7 turn on automatically. Burke and Royal Park cards, camels, `~20 t`, `OAK TABLE`, the wagon break, `FIRST NIGHT`, dumping crates, the Menindee pile, the Cooper split, `3 MONTHS`, WILLS/KING/GRAY, the `~1,100 KM` ruler, `~2 MONTHS` and the mangrove "no ocean" obstacle all appear.
  A silent **full-script animatic** with synthetic paced timings (`transcript-full-animatic.json`) previews that version.

## Commands
```bash
cd shorts/shared/render && npm ci            # playwright
export CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # only if the pinned build is absent
cd shorts/s24-burke-wills
python3 render/make_basemap.py               # graded 2× topo canvas → render/assets/basemap.jpg
node render/render.mjs stills 0,6,16.3,22.8  # review frames → out/stills/
node render/render.mjs sheet                 # final/contact-sheet.jpg
node render/render.mjs video                 # mix.mjs + capture + mux → final/s24-burke-wills.mp4
node render/render.mjs animatic              # silent full-script animatic (540p) → final/
```

## Map
- Canvas: NASA/JPL/NIMA topo `images/s24_12` (PD), georeferenced as Mercator from four coastline points (Byron Bay, South East Cape, Dirk Hartog, Cape York). The fit is within a few pixels. Pins use real lon/lat: Melbourne, Menindee, Cooper Creek Camp 65 / Dig Tree, Gulf Camp 119 area, Innamincka waterholes.
- `make_basemap.py` upscales 2×, grades the NASA greens toward outback ochre, darkens the ocean and bakes a white coast glow.
- Routes: outward is solid amber, the return is solid red-orange. Both self-draw with a pulsing leading edge. The camera tracks the head and never sits still, with eased log-zoom dolly, drift and slow rotation.
- Cooper Creek is a glowing channel. State borders are faint dashed lines that glow in the borderlands. Yandruwandha country is a soft ochre glow along the creek.
- Obstacles on the map: the wagon break, the mangrove belt with an eye-slash for "no ocean", the DIG blaze slam, the NINE HOURS clock, and a failed follow attempt.
- Environmental state: dusk grade from "That same evening", then a grief desaturation by the creek.

## Text
Captions sit at 70% with karaoke highlight, in the style-kit box. Graphics text is limited to names, places and facts: NINE HOURS, 1860, MELBOURNE, MENINDEE, COOPER CREEK, GULF OF CARPENTARIA, BURKE, WILLS, KING, GRAY, YANDRUWANDHA, FOOD, 4 DAYS, 3 MONTHS / 4+ MONTHS, DIG and ~1,100 KM.
The ~1,100 KM figure is the straight-line haversine distance from Cooper Creek to the Gulf, drawn as a straight dashed ruler.

## Audio (locked path)
`mix.mjs` follows the locked path:
- VO measures −22.8 LUFS and gets static +5.2 dB plus `apad`.
- The Dark Drama bed is −9.1 LUFS. It gets static −26 dB from 8 s in, about 4 dB under s18's Silent Descent seat, plus +3.5 dB lifts in VO gaps.
- There are 9 phrase-anchored SFX cues.
- Then float `amix`, a peak limiter and two-pass `loudnorm` on the master only. The master lands at −14.0 LUFS with a −1.9 dBTP peak.

## Fonts
Anton, Archivo Black and Inter come from `@fontsource` under SIL OFL 1.1 and live in `render/fonts/`.
