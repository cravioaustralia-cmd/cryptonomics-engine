# Render — s26-mary-bryant (MAP EXPLAINER · Impossible Journeys ep.1)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**. No Remotion. Built on `shorts/shared/render/` (`frame.html`, `engine.js`, `capture.mjs`).

## Build

```bash
cd shorts/shared/render && npm ci              # once (Playwright)
node shorts/s26-mary-bryant/render/build.mjs   # mix → capture → mux → out/ + final/
node shorts/s26-mary-bryant/render/mix.mjs     # audio only (writes out/loudnorm-report.txt)
node shorts/s26-mary-bryant/render/tools/preview.mjs /tmp/pv 0 25.9 59.5   # spot frames (PNG)
node shorts/s26-mary-bryant/render/tools/preview.mjs /tmp/cs --every 1.5 && \
  python3 shorts/s26-mary-bryant/render/tools/sheet.py /tmp/cs final/contact-sheet.jpg 66
```

`capture.mjs` falls back to `/opt/pw-browsers/chromium` (or `$PW_CHROMIUM`) when the npm Playwright build is newer than the installed browser.

## Files

| File | What |
|---|---|
| `scenes.js` | The whole film. A persistent SVG holds the basemap layers under an always-moving eased camera. Each frame re-projects routes, coast glows, gags, HUD and karaoke captions. |
| `basemap.json` | Normalised Web-Mercator bounds of each `images/map-*.{jpg,webp}` layer |
| `geo.json` | Natural Earth outlines (Australia, Timor, Great Britain), GBR reef lines, and the sea routes (escape, First Fleet, return in chains, Pandora boats) |
| `mix.mjs` | Locked mix path. VO is measured, then gets static gain and apad. Music and SFX use static gains. Then float amix, then two-pass loudnorm on the master at −14 LUFS / −1.5 dBTP. |
| `build.mjs` / `config.json` | Full render. `shared/render/mix-audio.mjs` is **not** used because it loudnorms the VO before the amix. |
| `whisper.raw.json` | faster-whisper `medium.en` word timings on `audio/vo.mp3`. `tools/make_transcript.py` cleans these into `../transcript.json`. |
| `tools/build_basemap.py` | Satellite basemap: BMNG colour, Tilezen relief and bathymetry, Natural Earth land mask. Soft knee, no blown white. |
| `tools/build_geo.py` | Simplified coastlines and reefs, plus hand-placed routes validated so no densified point sits on land. The return leg up the Thames is exempt. |
| `fonts/` | Anton and Montserrat (SIL OFL 1.1) |

## Beat map (seams from `transcript.json`)

| s | VO | Map treatment |
|---|---|---|
| 0.0 | A mother, a toddler, a baby… | Frame 1 lands on the **5,000 KM** hook over a dashed Sydney→Timor preview. Family chips pop on each word, then the camera dives to Port Jackson. |
| 3.2 | …and a stolen boat | The family hops into the cutter at the Sydney Cove pin. |
| 4.4 | Escaping across 5,000 kilometres | Pull-out. A comet runs the dashed route while a counter ticks 0 → 5,000 KM. |
| 8.3 | 1791 · Mary Bryant · highway robber | Whip to England with a **1791** slam and GB glow. The First Fleet arc self-draws Portsmouth → Tenerife → Rio → Cape → Sydney, tracked by the camera. |
| 16.8 | colony starving · William · not staying | Colony darkens, ration bar drains, MARY + WILLIAM BRYANT chips, white dashed intent arrow north. |
| 22.7 | don't just steal a boat… the governor's boat | **Gag 1.** A rowboat gets crossed out. The crowned cutter and its **GOVERNOR – DO NOT TOUCH** plaque are yanked off the harbour pin (thud). |
| 26.7 | moonless night · Eleven people | Night grade, the moon empties, the yellow route starts drawing out through the Heads. **Gag 2:** the count chip flickers 11 → **12?** as the series camel peeks from the stern. |
| 32.3 | sail north… east coast | **Gag 3.** Camera tracks the leading edge with speed-lines, pin-drops at bends and a DAY counter. |
| 36.3 | Storms nearly swamp them | Storm clouds, rain, two lightning flashes, boat pitching, camera shake. |
| 37.9 | squeeze between the reef and the coast | GBR reef lines glow, squeeze brackets close, boat squashes, GREAT BARRIER REEF label. |
| 41.2 | round the tip… out across open sea | Push into the Torres layer with a TORRES STRAIT label and Cape York pin, then pull out west over the ARAFURA SEA. |
| 45.1 | 69 days… Timor… over 5,000 km… alive | **69 DAYS** slam. Kupang pin, TIMOR highlight, full-route **5,000 KM** callout, eleven figures light up. |
| 52.9 | cover story · Dutch believe it… for a while | **Gag 4.** Shipwreck speech-bubble, sad faces with tears, Dutch tricolour pin nods twice, hourglass drains. |
| 59.2 | real shipwreck crew · Bounty | **Gag 5.** Record-scratch jolt and flash, whip to Pandora Entrance. **PANDORA** sinks on the reef and four lifeboats crawl to Timor with the captain's bicorne and a WANTED · BOUNTY MUTINEERS poster. |
| 65.0 | story falls apart · chains | Bubble cracks and falls, faces go shocked, chain links wrap the boat, padlock snaps (thud). **Gag 6:** map desaturates and a grey route starts west. |
| 69.3 | baby son… husband… daughter | Grey route Kupang → Batavia → Cape → Atlantic. Three soft white rings (no text, no gore) at Batavia and at sea. |
| 74.6 | London alone · death sentence | London pin, LONDON label, **ALONE** chip, gavel taps once with a red ring. |
| 79.0 | Boswell · pardoned · money for life | Colour and warmth return. JAMES BOSWELL quill chip, case file, **PARDONED** stamp (impact), £ coins arcing London → Mary's pin in Cornwall. |
| 85.9 | like for sheer nerve | Thumbs-up pulse and burst, a tap on "you know what to do". Camera keeps pulling out. |
| 90.3 | episode one of Impossible Journeys | **Gag 7.** Escape route turns red and joins the gold-framed **IMPOSSIBLE JOURNEYS** master map with an EP. 1 tag. The camel mascot walks in and waves. A dashed "?" EP. 2 slot appears on "next one". |
| 94.8 | And it all started with… | Incomplete loop. Whip back to the frame-1 framing as the dashed preview, pins and **5,000 KM** slam rebuild the opening frame. |
