# Sources — lf02 IF AUSTRALIA… Episode 2

What If Australia Had WON at Gallipoli? Long-form documentary, 16:9.

## Narration

- **Voice:** Atlas (Grok TTS), Australian English. 37 seated takes: `audio/vo/V01.mp3` … `V36.mp3`, including `V16b.mp3`. Paste-ready text in `audio/vo-text/`.
- The take files are **untouched**: not overwritten, not time-stretched, not regenerated, not loudnormed. The cut is locked to faster-whisper (medium.en) word timestamps of these files (`render/whisper_vo.py` → `render/whisper-raw.json`).
- **Two edit-level skips (files untouched):** two seated takes contain spoken delivery instructions that are not Part 4 narration. They are skipped by placing only the clean parts of the take, with both cut points in room tone below −65 dBFS:
  - `V27.mp3`: the words “After the first sentence, hold a clear pause before continuing,” (3.70–8.20 s in the file) are not played. Part 4's pause is kept (about 1.2 s).
  - `V31.mp3`: the opening words “Australian accent.” (0–2.10 s in the file) are not played.
- Other small read differences are kept as recorded (the voice file wins for what was said), e.g. V04 says “something you can't imagine living without”.

## B-roll

- **33 dramatised AI reconstruction clips** (Grok Imagine): `broll/B01.mp4` … `B32.mp4` plus `B12b.mp4`, 1280×720, about 10 s each. Prompts and the record of each picture: `broll/PROMPTS.md`. None regenerated, swapped or added.
- In the edit: scaled to 1920×1080 inside the zoom-through, trimmed to the timeline length (never longer than the Part 3 length), every clip **muted**.
- **Synthetic content:** the B-roll is dramatised / synthetic. B01 carries an on-screen “Dramatised reconstruction” label. Tick YouTube's “altered or synthetic content” option when uploading.
- B27, B30, B31, B32 keep their warm present-day palette; B28 and B29 are sepia as generated.

## Real historical images

Seated files in `images/` (no substitutes fetched; there is no IMG04 or IMG08). Full licence statements, source pages and the skip history are in `images/CREDITS.md`, including the “Added 4 October 2026” rows for IMG14 and IMG20. In the film every photo is graded warm sepia with a little grain and a soft vignette (`render/make_photos.py`; never colourised), with a small caption and a tiny on-screen credit.

| ID | Used as | On-screen caption | On-screen credit | Licence (per CREDITS.md) | Credit line |
|---|---|---|---|---|---|
| IMG01 | Map card (V02), flips to a gold “?” (V03), full-screen Ken Burns + photo-to-map morph (V14), split card with IMG22 (V33), scrapbook (V35) | Anzac Cove, 25 April 1915 | State Library of NSW, Mitchell Library | Public domain (PD-Australia); acknowledgement of the Mitchell Library requested | State Library of New South Wales, Mitchell Library, PXB 592. Publisher Brookes |
| IMG02 | Map card on London (V06), beside the “?” (V12) | Churchill, Portsmouth, February 1915 | Agence Rol / BnF | Public domain in France and the US; attribution mandatory (French moral rights) | Agence Rol, février 1915 (Rol 44010). BnF, ark:/12148/btv1b69334178 |
| IMG03 | Full-screen Ken Burns (V11) | HMS Irresistible, 18 March 1915. Real photo. | Royal Navy / Library of Congress | Public domain (PD-UKGov) | Royal Navy photograph; Library of Congress cph.3c10854 |
| IMG05 | PIP beside the mine line, label “Nusret” (V10) | Nusret, 1912 | Turkish General Staff | Public domain (Ottoman) | The historic 1912 photograph, not the museum replica |
| IMG06 | Map card on the ridge (V16); beside IMG16 (V32) | Mustafa Kemal, Gallipoli, 1915 | Turkish General Staff | Public domain (Ottoman) | Mustafa Kemal Bey, Gallipoli front, 1915 |
| IMG07 | Map card riding beside the AE2 icon (V16b) | AE2, Sydney, 1914 | Australian War Memorial H11559 | Public domain (PD-Australia) | **The boat at Sydney in 1914, not a photo inside the strait.** The label “AE2, first Allied sub through” belongs to the map icon |
| IMG09 | PIP from the left (V17) | Lone Pine, 6 August 1915 | Australian War Memorial A02022 | Public domain | AWM A02022 |
| IMG10 | Full-screen Ken Burns (V20) | The real “drip rifle”. | Australian War Memorial G01291 | Public domain | AWM G01291, C. E. W. Bean, 17 December 1915. **AWM screen file, 640 px; shown at native resolution scaled, not upscaled or sharpened** |
| IMG11 | Map card at the beach (V20) | Anzac Beach, December 1915 | Australian War Memorial H03482 | Public domain | AWM H03482. **640 px screen file, not upscaled or sharpened** |
| IMG12 | PIP from the right (V17) | Ottoman trench, Gallipoli | Turkish General Staff | Public domain (per file page) | The file page gives no year, so none is captioned |
| IMG13 | Full-screen Ken Burns across the album sheet of four (V25) | Petrograd, 1917. Real photo. | J. M. Pringle / Library of Congress | Public domain per the Commons licensing section (LOC says “No known restrictions on publication”) | James Maxwell Pringle, LOC ppmsca 31321 |
| IMG14 | Map card on Australia, slow push into the headline (V29) | The Referee, Sydney, 12 May 1915 | The Referee (public domain) | Public domain (Commons statement) | *The Referee* (Sydney), page 1, 12 May 1915. This is the newspaper card (the script's “from Trove”) |
| IMG15 | Full-screen Ken Burns (V30); card that fades grey and slides off (V31) | Anzac Day, 1916. | Photo attrib. George Bell | Public domain (PD-Australia) | First Anzac Day parade, Macquarie Street, Sydney, 25 April 1916 |
| IMG16 | Map card on Ankara, IMG06 beside it (V32) | Atatürk, 1923 | Agence Rol / BnF | Public domain in France and the US; attribution mandatory | Agence Rol, mars 1923 (Rol 81992). BnF. **Framed on Atatürk only; Latife is outside the crop** |
| IMG17 | Full-screen Ken Burns (V34) | Memorial at Arı Burnu, 2012 | Jorge Láscar, CC BY 2.0 | CC BY 2.0 | Jorge Láscar, 30 August 2012 |
| IMG18 | Full-screen Ken Burns (V21) | Lone Pine Cemetery, Gallipoli, 2012 | Jorge Láscar, CC BY 2.0 | CC BY 2.0 | Jorge Láscar, 30 August 2012 |
| IMG19 | Faint texture only (V07) | none | none on screen (texture) | Public domain release by Gsl | **A modern public-domain map with Spanish labels, not a 1915 map.** Legend cropped out, softened, about 16% opacity so no label reads; never captioned as a 1915 map |
| IMG20 | PIP at the corner (V05) | Le Hamel, Somme, 9 August 1915 | Stéphane Passet / Musée Albert-Kahn, CC0 | CC0 | Autochrome, graded to the same sepia |
| IMG21 | Map card on Sofia, on the real red state only (V24) | Bulgarian troops, 1915 | Unknown author | Public domain (per file page) | No one is named on screen |
| IMG22 | Split card with IMG01 (V33) | Anzac Cove, 2012 | Jorge Láscar, CC BY 2.0 | CC BY 2.0 | Jorge Láscar, 30 August 2012. “110 years apart” is not put on screen |

- **Jorge Láscar, CC BY 2.0** (IMG17, IMG18, IMG22): https://creativecommons.org/licenses/by/2.0/ — credited on screen, here and in `YOUTUBE_DESCRIPTION.md`.
- Named real people appear only as these real photos (IMG02, IMG06, IMG16). No photo of the dead or wounded. No real photo sits on a gold what-if event.

## Map, fonts, render

- **Projection and layers:** Mercator parchment terrain map built by `render/make_basemap.py` (adapted from lf01) from open data: **AWS Open Data Terrain Tiles** (Terrarium; SRTM, GMTED, ETOPO1), **NASA Blue Marble Next Generation** (public domain), **Natural Earth** 10 m land, islands and admin-0 countries (public domain). Close-up Gallipoli coastlines come from the terrain model itself. Lighting lock: soft mid-contrast hillshade, highlights capped, no white glare.
- Vector overlays (`render/make_geo.py`): the 1915 Ottoman Empire is approximated from modern Natural Earth outlines plus a hand-drawn Hejaz strip; Bulgaria and the Middle East borders use modern outlines. They are motion-graphic shapes, not survey maps.
- **Fonts** (SIL Open Font License, via Fontsource, copied from lf01): IM Fell English / SC, Special Elite, Oswald, Playfair Display, Black Ops One, Libre Baskerville.
- **Renderer:** SVG + `renderFrame(t)` + Playwright + ffmpeg (`render/`). No Remotion, no video framework. The shared `shorts/shared/render/capture.mjs` gained an optional size override (default stays 1080×1920).
- Episode 1 thumbnail on the end card: a frame of the lf01 master from this repo (`longform/lf01-if-australia/final/chapters/02-scenario-1-grab-the-north.jpg`, branch `claude/model-opus-bdipl6`).

## Music (free licence)

All eight beds are Mixkit tracks under the **Mixkit Stock Music Free Licence**. They were **copied byte-identical** from `longform/lf01-if-australia/audio/music/` at approved commit `b3973eb` (branch `claude/model-opus-bdipl6`). Every one was already licensed and documented in this repo for an earlier Short, then reused in lf01; nothing new was downloaded, and no copyrighted score is used. Same licences as lf01.

| File | Track — artist | Page | Asset | Repo origin | lf01 role (starting point) |
|---|---|---|---|---|---|
| `audio/music/silent-descent-614.mp3` | Silent Descent — Eugenio Mininni | https://mixkit.co/free-stock-music/silent-descent/ | https://assets.mixkit.co/music/614/614.mp3 | s18 → lf01 → lf02 | Tension |
| `audio/music/dark-drama-605.mp3` | Dark Drama — Eugenio Mininni (see note) | https://mixkit.co/free-stock-music/dark-drama/ | https://assets.mixkit.co/music/605/605.mp3 | s24 → lf01 → lf02 | War |
| `audio/music/between-two-evils-1020.mp3` | Between Two Evils — Michael Ramir C. | https://mixkit.co/free-stock-music/between-two-evils/ | https://assets.mixkit.co/music/1020/1020.mp3 | s23 → lf01 → lf02 | War beats |
| `audio/music/echoes-188.mp3` | Echoes — Andrew Ev | https://mixkit.co/free-stock-music/echoes/ | https://assets.mixkit.co/music/188/188.mp3 | s21 → lf01 → lf02 | Loss |
| `audio/music/fallen-asper-565.mp3` | Fallen (Asper) — Eugenio Mininni | https://mixkit.co/free-stock-music/fallen-asper/ | https://assets.mixkit.co/music/565/565.mp3 | s22 → lf01 → lf02 | Plans and argument |
| `audio/music/curiosity-480.mp3` | Curiosity — Diego Nava | https://mixkit.co/free-stock-music/curiosity/ | https://assets.mixkit.co/music/480/480.mp3 | s19 → lf01 → lf02 | Geography / map |
| `audio/music/vastness-184.mp3` | Vastness — Andrew Ev | https://mixkit.co/free-stock-music/vastness/ | https://assets.mixkit.co/music/184/184.mp3 | s20 → lf01 → lf02 | Relief / resolve |
| `audio/music/the-journey-79.mp3` | The Journey — Ahjay Stelino | https://mixkit.co/free-stock-music/the-journey/ | https://assets.mixkit.co/music/79/79.mp3 | s17 → lf01 → lf02 | Warm act / outro |

**Note on asset 605:** the same file (identical bytes, same asset URL) is titled "Dark Drama" in `shorts/s24-burke-wills` and "Delirium" in `shorts/s15-irukandji`. Mixkit could not be reached from the lf01 session to settle the title. The licence and asset URL are the same either way. Confirm the title before publishing credits.

The Shorts Skyline bed and the Impossible Journeys sting are not used.

### Where each track plays in lf02

Chosen by emotion; the full in/out list at 1× and master timecodes is in `CUE_SHEET.md` (generated from the mix).

| Section (Part 3 beats) | Track | Why |
|---|---|---|
| Cold open V02–V04, up to the title | `silent-descent-614.mp3` | Tension: Australia's most famous defeat, then the what-if |
| Act 1 V05–V08 | `curiosity-480.mp3` | Geography and the plan |
| V09–V10 | `silent-descent-614.mp3` | Tension: the fleet, the minelayer at night |
| V11 | `dark-drama-605.mp3` | War: three battleships sunk; cuts dead for the underwater boom and the silence |
| V12 | `fallen-asper-565.mp3` | Plans and argument: the first what-if; cliffhanger sting at the end |
| Act 2 V13–V16 | `between-two-evils-1020.mp3` | War: the landing and the heights |
| V16b | `silent-descent-614.mp3` | Tension and wonder: AE2 under the minefields |
| V17–V18 | `dark-drama-605.mp3` | War: trenches, heat and snow, the August breakout |
| V19–V20 | `echoes-188.mp3` | Loss and quiet: the escape at night |
| V21 | (no music) `strings_pad.flac` only | Strings only under the graves, Lone Pine and the memorial counters |
| Act 3 V22–V24 | `vastness-184.mp3` | The what-if lifts: the fleet sails through |
| V25–V27 | `fallen-asper-565.mp3` | Plans and argument: Russia, the counter-case, the borders; cliffhanger sting |
| Act 4 V28–V29 | `echoes-188.mp3` | Loss and reflection: a nation through defeat |
| V30 | `the-journey-79.mp3` | Warm: Anzac Day |
| V31–V32 | `fallen-asper-565.mp3` | What-if and reflection: a date in a textbook; Atatürk |
| V33–V36 + end screen | `the-journey-79.mp3` | Warm: the dawn service, the memorial, the outro under the badge |

## Sound effects and shot environment

Copied byte-identical from `longform/lf01-if-australia/audio/sfx/` at `b3973eb`. Same licences and authorship as lf01:

- **Spot effects:** synthesised in-house for lf01 by `render/make_sfx.py` (numpy, seeded per cue; no third-party samples). They are drone, boom, stamp thud, three drum hits, whoosh, low note, air-raid siren, distant explosions, desert wind gust, sonar ping, snapping cable, low wind, pin thunk, strings pad, cliffhanger sting, and the **IF AUSTRALIA… series sting** (`series_sting.flac`).
- **Environment beds:** synthesised in-house by the same script (rain, sea, distant war rumble, fire crackle, underwater rumble, low engine). Original works; no third-party source.
- **Picture-sync accents:** synthesised in-house by the same script (`tick`, `click`, `pen_draw`, `riser_short`, `word_hit`). Short original sounds; no third-party source and no copyrighted effects.
- Files are lossless 24-bit FLAC in `audio/sfx/`.
- No commercial sound effects and no audio from any YouTube video are used.
- The lf01 jungle-birds Mixkit file is **not** copied into this episode (Gallipoli has no jungle beat).
- **Made for lf02:** `audio/sfx/oars.flac` — oars for the cold open (the script calls for oars and there was no oars file). Synthesised in this project by `render/make_oars.py` (numpy, seeded): wooden knock, band-passed water swirl, drips. No third-party sample.
- **Used in lf02:** oars, sea, drone, low_note, series_sting, rain, low_wind, underwater, boom, cliff_sting, strings_pad, pin_thunk, click, tick. **Not used:** siren, sonar_ping (not in this script) and the other lf01-only effects.
- Environment only under shots that show it: rain under B04, wind under the B14 snowstorm, sea under B01, B10, B11, B16, B30, B32. Every B-roll clip's own audio track is dropped.

