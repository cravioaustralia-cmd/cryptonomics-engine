# Sources — lf01 IF AUSTRALIA… Episode 1

What If Japan Had Invaded Australia in 1942? Long-form documentary, 16:9.

## Narration

- `audio/vo/V01.mp3` … `V34.mp3` — Atlas voice takes seated by Video Production (see `LOG.md`). Used as recorded: no regeneration, no time-stretch, no voice loudnorm.

## Music (free licence)

All eight beds are Mixkit tracks under the **Mixkit Stock Music Free Licence**. Every one was already licensed and documented in this repo for an earlier Short; the episode copies in `audio/music/` are byte-identical to those repo files. Nothing new was downloaded, and no copyrighted score is used.

| File | Track — artist | Page | Asset | Repo origin | Used for |
|---|---|---|---|---|---|
| `audio/music/silent-descent-614.mp3` | Silent Descent — Eugenio Mininni | https://mixkit.co/free-stock-music/silent-descent/ | https://assets.mixkit.co/music/614/614.mp3 | s18 | Cold open; tension build in V07 |
| `audio/music/dark-drama-605.mp3` | Dark Drama — Eugenio Mininni (see note) | https://mixkit.co/free-stock-music/dark-drama/ | https://assets.mixkit.co/music/605/605.mp3 | s24 | War and invasion: V05, V12–V13, V19–V22, V27–V28 |
| `audio/music/between-two-evils-1020.mp3` | Between Two Evils — Michael Ramir C. | https://mixkit.co/free-stock-music/between-two-evils/ | https://assets.mixkit.co/music/1020/1020.mp3 | s23 | War: the Darwin raid (V08); the plan to cut Australia off (V25–V26) |
| `audio/music/echoes-188.mp3` | Echoes — Andrew Ev | https://mixkit.co/free-stock-music/echoes/ | https://assets.mixkit.co/music/188/188.mp3 | s21 | Loss: the prisoners (V06); Australia alone (V27) |
| `audio/music/fallen-asper-565.mp3` | Fallen (Asper) — Eugenio Mininni | https://mixkit.co/free-stock-music/fallen-asper/ | https://assets.mixkit.co/music/565/565.mp3 | s22 | Plans and argument: V09–V11, V24 |
| `audio/music/curiosity-480.mp3` | Curiosity — Diego Nava | https://mixkit.co/free-stock-music/curiosity/ | https://assets.mixkit.co/music/480/480.mp3 | s19 | Geography: V13 "geography" to V18 |
| `audio/music/vastness-184.mp3` | Vastness — Andrew Ev | https://mixkit.co/free-stock-music/vastness/ | https://assets.mixkit.co/music/184/184.mp3 | s20 | Relief: V29 lift and V30 resolve |
| `audio/music/the-journey-79.mp3` | The Journey — Ahjay Stelino | https://mixkit.co/free-stock-music/the-journey/ | https://assets.mixkit.co/music/79/79.mp3 | s17 | Act 5 (warm) and the end-screen outro |

**Note on asset 605:** the same file (identical bytes, same asset URL) is titled "Dark Drama" in `shorts/s24-burke-wills` and "Delirium" in `shorts/s15-irukandji`. Mixkit could not be reached from this session to settle the title. The licence and asset URL are the same either way. Confirm the title before publishing credits.

The Shorts Skyline bed and the Impossible Journeys sting are not used.

## Sound effects and shot environment

- **Spot effects:** synthesised in-house by `render/make_sfx.py` (numpy, seeded per cue; no third-party samples). They are drone, boom, stamp thud, three drum hits, whoosh, low note, air-raid siren, distant explosions, desert wind gust, sonar ping, snapping cable, low wind, pin thunk, strings pad, cliffhanger sting, and the **IF AUSTRALIA… series sting**.
- **Environment beds for the B-roll shots:** synthesised in-house by the same script (rain, sea, distant war rumble, fire crackle, underwater rumble, low engine). These are original works made for this episode, with no third-party source.
- **Picture-sync accents:** synthesised in-house by the same script (`tick`, `click`, `pen_draw`, `riser_short`, `word_hit`). They are short original sounds made for this episode: typewriter ticks for counters and dates, a soft click for labels, a pencil scratch for lines drawing, and a short rise into a low hit for hard words. No third-party source and no copyrighted effects.
- **Jungle birds under B11:** `shorts/s11-cassowary/sfx/birds_jungle_ambience.mp3`, already in this repo. "Birds in the jungle", Mixkit, Mixkit Sound Effects Free Licence, https://mixkit.co/free-sound-effects/download/2434/ (recorded in `shorts/s11-cassowary/sfx/sources.tsv`).
- Files are lossless 24-bit FLAC in `audio/sfx/`. Cue-by-cue placement is in `CUE_SHEET.md`.
- No commercial sound effects and no audio from any YouTube video are used.

## B-roll and archival audio: muted

Every B-roll clip is **muted**. The clips' own generated audio (they carry a track) is never mapped into the film: `render/compose.py` takes video only from the clips and audio only from `build/master.wav`. The delivered MP4 has exactly one audio stream, the mix. There is no original speech and no leftover dialogue. No archival audio is used.

## Map (open data)

- **Coastlines, land, the mainland-USA outline:** Natural Earth 1:10m and 1:50m (public domain), https://www.naturalearthdata.com/ via https://github.com/nvkelso/natural-earth-vector
- **Land colour:** NASA Blue Marble Next Generation (public domain, NASA Earth Observatory), the 5400×2700 copy shipped in the PyPI package `basemap-data`, graded into a parchment war-map palette.
- **Relief and bathymetry:** AWS Open Data Terrain Tiles (Terrarium), https://registry.opendata.aws/terrain-tiles/ . Attribution as the dataset requires: *ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736; Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017; Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich; Canada terrain data contains information licensed under the Open Government Licence – Canada; Europe terrain data produced using Copernicus data and information funded by the European Union – EU-DEM layers; Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration; Mexico terrain data source: INEGI, Continental relief, 2016; New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government (All rights reserved); Norway terrain data © Kartverket; United Kingdom terrain data © Environment Agency copyright and/or database right 2015. All rights reserved; United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey.*
- Tiles and the Blue Marble plate are fetched at build time and not committed. The graded layers are committed in `render/assets/`.

## Fonts (SIL Open Font License 1.1, via Fontsource)

IM Fell English SC and IM Fell English Italic (Igino Marini), Special Elite (Astigmatic), Oswald (Vernon Adams et al.), Playfair Display (Claus Eggers Sørensen), Black Ops One (James Grieshaber, Eben Sorkin), Libre Baskerville (Impallari Type). Files are in `render/fonts/`.

## B-roll (dramatised, synthetic)

`broll/B01.mp4` … `B12.mp4` are AI-generated dramatised reconstructions (prompts in `broll/PROMPTS.md`). They are used as delivered, trimmed only to their Part 2 lengths. They are not archive footage. B01 carries an on-screen "Dramatised reconstruction" label, and the YouTube upload must tick "altered or synthetic content" (noted in `YOUTUBE_DESCRIPTION.md`). The clips' own generated audio is not used.

## People

### John Curtin (archive card, V09)

- **Intended archive still:** [File:John Curtin austerity speech SLNSW 1942.jpg](https://commons.wikimedia.org/wiki/File:John_Curtin_austerity_speech_SLNSW_1942.jpg). Public domain. **Credit: Mitchell Library, State Library of New South Wales.** Dated 30 October 1942, later than the "weeks earlier" line, which the brief accepts for an archive card of the prime minister.
- **Status in this render: the photograph is NOT in the film.** Wikimedia Commons (`commons.wikimedia.org`, `upload.wikimedia.org`) is blocked by this build environment's egress policy, so the file could not be fetched, and no face was invented or generated. The V09 card is a framed archive nameplate ("JOHN CURTIN", "Prime Minister of Australia") pinned to Australia, with the newspaper icon unfolding beside it.
- **To add the photo:** save the Commons file as `render/archive/curtin.jpg` and re-render. `scenes.js` checks for that file and places it in the card's photo frame automatically, with the credit line above.

### Matthias Ulungura (V17)

- **Map label only:** "Captured by Matthias Ulungura, Tiwi man", on Melville Island, beside the small plane icon. No photo and no AI person, as the script and brief require.
- No free-licence image with documented Tiwi cultural protocols was identified for this pass. Any future use of his photograph needs permission and must follow Tiwi cultural protocols, recorded here first.
