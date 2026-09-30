# Render — s24-burke-wills (MAP EXPLAINER)

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg. No Remotion. Reuses `shorts/shared/render/` (capture + frame loader).

## VO

The full Atlas take is `audio/vo.mp3` (**89.736 s**). It supersedes the 39.168 s back-half take.
`transcript.json` uses faster-whisper word timings with the script's own words, aligned by `render/align_transcript.py`. That fixes Whisper's "Two weeks", "tons", "miss", "O 'Hara" and "Yandrew Wanda".

Every beat in `scenes.js` is anchored to a **phrase in the transcript**, not a hard-coded second. The same code also still renders a back-half-only VO: when "In 1860" is missing, beats 1–7 collapse into a 1.4 s route recap.
`transcript-full-animatic.json` holds the synthetic timings used for the earlier silent animatic.

Re-time after any new VO:
```bash
python3 /path/to/whisper_words.py audio/vo.mp3 > /tmp/raw.json   # faster-whisper small.en, word_timestamps=True
python3 render/align_transcript.py /tmp/raw.json
node render/render.mjs video && node render/render.mjs sheet
```

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
- There are 10 phrase-anchored SFX cues for the full VO: hook, the Melbourne push, the wagon, the race north, the DIG card, DIG, a riser, NINE HOURS, the pull-out and the whip.
- Then float `amix`, a peak limiter and two-pass `loudnorm` on the master only. The master lands at −14.0 LUFS with a −1.9 dBTP peak.

## Fonts
Anton, Archivo Black and Inter come from `@fontsource` under SIL OFL 1.1 and live in `render/fonts/`.
