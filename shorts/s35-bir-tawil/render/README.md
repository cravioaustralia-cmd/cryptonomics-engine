# Render — s35 Bir Tawil ("The Land No Country Wants")

SVG + `renderFrame(t)` + Playwright + ffmpeg. No Remotion. Reuses `shorts/shared/render/` (frame.html, engine.js helpers, Playwright install).

## Files
- `scenes.js` — 12 beats; map camera over Natural Earth geometry; word-highlight captions at ~70% (y 1350).
- `geo.json` — Egypt, Sudan, Halaib, Bir Tawil, Lake Nasser, Nile, neighbours, ACT outline, 1899 line (22° N) and 1902 administrative line. Built by `tools/build_geo.py` from Natural Earth 10m (public domain).
- `build.mjs` — `node render/build.mjs stills <dir> <t…>` for contact-sheet stills; `node render/build.mjs video <out.mp4> 4` for the silent 1080x1920 30 fps video (4 parallel pages).
- `mix.sh` — VO + "Desert City" ducked under VO + 9 SFX cues, two-pass loudnorm on the master, AAC 256k mux.
- `contact_sheet.jpg` — 1 fps sheet of the final MP4, reviewed before delivery.
- `../transcript.json` — faster-whisper small.en word timings, spelling taken from `vo/atlas_read.txt` (139/139 words aligned).

## Rebuild
```bash
(cd shorts/shared/render && npm install)          # Playwright; uses /opt/pw-browsers/chromium if present
node shorts/s35-bir-tawil/render/build.mjs video /tmp/s35-silent.mp4 4
bash shorts/s35-bir-tawil/render/mix.sh /tmp/s35-silent.mp4 shorts/s35-bir-tawil/final/s35-bir-tawil.mp4
```

## Beats
| time (s) | beat | visual |
|---|---|---|
| 0.0–5.6 | hook | Nubian Desert photo; frame-1 hook NO COUNTRY WILL CLAIM THIS LAND; Bir Tawil plate vs ACT at the same km scale; UNCLAIMED stamp on "claim it" |
| 5.6–7.3 | name | Landsat 8 image of Bir Tawil; BIR TAWIL + coordinates typed |
| 7.3–10.4 | where | map pull-back from Bir Tawil to Egypt and Sudan |
| 10.4–12.4 | 1899 | War Office Wadi Halfa sheet (sepia) + 1899 stamp, BRITAIN / EGYPT |
| 12.4–16.3 | 22° N | ruler + pen draws the 1899 line dead straight |
| 16.3–21.3 | 1902 | camera zooms in; second line drawn round Bir Tawil and Halaib; Ababda / Bishari grazing routes |
| 21.3–27.9 | Egypt's claim | 1899 line glows; Halaib fills gold; ×10 tile panel (20,580 vs 2,060 km²) |
| 27.9–29.6 | Red Sea | Halaib coast photo |
| 29.6–33.2 | Sudan's claim | 1902 line glows; Halaib hatched gold/teal, both claimants pointing in |
| 33.2–38.9 | hand-off | each line pushes Bir Tawil to the other; claim it, Halaib drains (−20,580 km²) |
| 38.9–46.1 | 2014 | generic red flag drops and plants on the Bir Tawil plate, dust burst, crown; seals crossed out, scene desaturates, flag droops (no photo of the person) |
| 46.1–47.7 | loop | eases back to the frame-1 composition |

## Delivery check
- 1080x1920, 30 fps, H.264 + AAC 48 kHz, 47.73 s.
- Integrated -14.2 LUFS, true peak -1.7 dBTP after AAC.
