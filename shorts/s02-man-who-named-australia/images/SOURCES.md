# Image & music sources — s02-man-who-named-australia

All assets are free-licensed (Wikimedia Commons PD / CC, Flickr CC, Pexels/Pixabay pack, Mixkit). No AI-generated historical stills.

**Still rule:** Every underlay is interesting and factually correct for its beat (right place / person / artifact / era). Full-bleed photo underlays (s01 style) with SVG MG on top.

## Images (full-bleed underlays)

| File | Beat / role | Licence | Source / notes |
|------|-------------|---------|----------------|
| `s02_01_matthew_flinders.jpg` | portrait (7.1–9.4) + candle (33.2–35.85, mono) | Public domain (art) | Oil portrait of Matthew Flinders in naval uniform — matches the portrait attributed to Toussaint Antoine de Chazal, painted during Flinders' detention on Mauritius (c. 1806–07); verify attribution before quoting it on screen — the actual likeness for the name beat and the death beat |
| `s02_02_flinders_general.jpg` | **name** (24.15–29.45) | Public domain (1814 engraving) | **Corrected:** this file is *not* a portrait — it is Flinders' own engraved **“Chart of Terra Australis by M. Flinders, Commr. of H.M. Sloop Investigator, 1802-3 — North Coast, Sheet II”** (Gulf of Carpentaria), published with the 1814 *Voyage*. Used for the naming beat: zoom into the printed title “TERRA AUSTRALIS”, strike it, stamp AUSTRALIA |
| `s02_03_hms_investigator.jpg` | circumnavigate (9.4–12.25) | CC BY-SA 2.0 | Museum model of HMS Investigator — hugh llewelyn / Flickr https://www.flickr.com/photos/58433307@N08/28734761766 |
| `s02_04_trim_cat_statue.jpg` | **trim** (12.25–16.25) | CC / free stock (pack) | Flinders + Trim commemorative statue (plinth reads “…in commemoration of Captain Matthew Flinders” with Flinders University branding — appears to be a cast of Mark Richards' Euston statue design) — camera pushes onto the bronze Trim beside Flinders' foot |
| `s02_05_black_cat.jpg` | (rejected) | Pexels / Pixabay (pack) | **REJECTED** — AI/unnatural heterochromic glowing eyes; kept on disk for audit only, not used in render |
| `s02_06_mauritius_coast.jpg` | **prison** (16.25–24.15) | CC BY 2.0 | **Quiet quality pass:** Port Louis Harbour, Mauritius — Tips For Travellers / Flickr https://www.flickr.com/photos/8327374@N02/4592717513 (replaced lonely tropical tree filler) |
| `s02_07_voyage_terra.jpg` | book (29.45–33.2) | Public domain / free (pack) | *A Voyage to Terra Australis* binding — spine label reads “VOYAGE TO TERRA AUSTRALIS · FLINDERS”, foot “LONDON 1814”. The typeset title-page card over it is an SVG prop, not a photo |
| `s02_08_euston_station.jpg` | hook (0–7.1) + london (35.85–46.5; sepia → colour) | CC BY-SA 2.0 | Virgin Train at **London Euston** — Loco Steve / Flickr https://www.flickr.com/photos/36989019@N08/13599194805 |
| `s02_09_archaeological.jpg` | dig (46.5–56.8) | CC BY-SA 2.0 | Archaeologist in excavation trench — Sue Hutton / Flickr https://www.flickr.com/photos/69718262@N00/7986056180 |
| `s02_10_english_village.jpg` | home (56.8–64.97) | CC BY-SA 2.0 | View to the Church of St Peter, Creeton (geograph 2367540) — Nigel Chadwick / Wikimedia Commons. Flat south-Lincolnshire parish landscape — **not** alpine. Note: Creeton is ~25 km from Donington; it stands in for the county landscape, and the on-screen DONINGTON tag names the story's place, not the photo. **Upgrade when sourcing is possible:** a free-licence photo of St Mary & the Holy Rood, Donington (reburial July 2024) |

## REMOVED / REJECTED

| File / candidate | Reason |
|------------------|--------|
| `s02_05_black_cat.jpg` (as Trim underlay) | AI look — heterochromic glowing eyes; replaced by Trim statue |
| `s02_06_mauritius_coast_REJECTED_lonely_tree.jpg` | Generic tropical-tree filler, not Port Louis / imprisonment place |
| Prior alpine Donington still | Geographically wrong — alpine mountains, not flat Lincolnshire |
| Prior Auckland Harbour chart as Investigator | Wrong place/era |
| Prior St Pancras underground as Euston | Adjacent station but not Euston |
| Prior classical column ruins as dig | Mediterranean ruins — not railway/cemetery archaeology |

## Premium rebuild notes (Issue #6)
- Every beat has a full-bleed photo underlay (list above). Stills under ~1100 px on the long side (Investigator, Port Louis, Euston, village) are shown as a blurred full-bleed fill plus a sharp, feathered band so they are never a mushy 3× upscale.
- No new stills were added in this rebuild: the session's network policy blocked Wikimedia/Flickr/Geograph, so every underlay is from the already-verified set above.
- All maps (Australia coastline, Indian Ocean route) are hand-plotted SVG from lon/lat — no third-party map tiles.
- `s02_05_black_cat.jpg` is still unused (rejected AI look). Trim in the Mauritius beat is an SVG silhouette drawn from Flinders' own description (black, white feet, white star on breast).

## Fonts
OFL 1.1 (Bebas Neue, Cormorant Garamond, Cinzel, Montserrat, IBM Plex Mono) via Fontsource npm packages — bundled in `shorts/shared/fonts/` with licences.

## Music

| File | Title | Artist | Licence | Source |
|------|-------|--------|---------|--------|
| `audio/music.mp3` | Vastness | Andrew Ev | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/vastness-184/ |

## SFX

| File | Licence | Source |
|------|---------|--------|
| Shared kit (`whoosh_*`, `impact_hit`, `riser`, `text_pop`, `typewriter_tick`) | Mixkit License | `shorts/shared/sfx/` |
| `ship_creaking.mp3`, `cat_meow.mp3`, `cell_door.mp3`, `shovel_dig.mp3`, `church_bell.mp3` | Free stock (pack) | australia-shorts s02 pack |
