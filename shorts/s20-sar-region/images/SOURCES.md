# Image sources — s20-sar-region

All files under `images/`. NASA / NSF public domain or crops thereof. No AI stills. No ESA Standard Licence files (commercial restriction).

**MAP EXPLAINER MODE:** maps carry the story; photos only brief credibility inserts. Locked parchment + white-glow 3D map style over satellite/topo.

**Correct geography only:** Australian SRR per AMSA/NATSAR (≈75°E–163°E; aviation to South Pole); Vostok ≈78.5°S 106.8°E; Concordia ≈75.1°S 123.3°E.

**Scaffold gaps for Claude (optional):** free-licence Vostok (NSF PD Commons `Russian_station_Vostok.jpg`) and Concordia (NASA PD Commons `Concordia_Station_at_Dome_C.jpg`) if missing from this folder after Wikimedia rate-limits; official AMSA SRR outline for polygon reference if free-licence obtainable.

---

### s20_01_world_topo_basemap_ref.jpg
- **Title:** Blue Marble / world.topo.bathy Dec 2004
- **Author:** NASA Earth Observatory / GSFC
- **Licence:** Public domain (NASA)
- **URL:** https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg
- **Why it fits:** Primary globe / SRR **basemap** — crop Indian–Pacific–Southern Ocean corridor; rebuild locked parchment SRR style.
- **Note:** Copied from s18 episode asset (same NASA source).

### s20_02_southern_ocean_antarctica_crop.jpg
- **Title:** Southern Ocean + Antarctica crop of world.topo.bathy
- **Author:** Crop of NASA Blue Marble topo (above)
- **Licence:** Public domain (NASA derivative crop)
- **Why it fits:** Pole-dive / Southern Ocean SRR basemap support.

### s20_02b_antarctica_blue_marble.jpg
- **Title:** Antarctica 6400px from Blue Marble (or thumb)
- **Author:** Dave Pape (using NASA Blue Marble / MODIS + AVHRR data)
- **Licence:** Public domain (author release)
- **URL:** https://commons.wikimedia.org/wiki/File:Antarctica_6400px_from_Blue_Marble.jpg
- **Why it fits:** Orthographic Antarctica + Southern Ocean polar hero basemap.

### s20_05_indian_pacific_au_corridor_crop.jpg
- **Title:** Indian–Pacific–Australia corridor crop of world.topo.bathy
- **Author:** Crop of NASA Blue Marble topo (above)
- **Licence:** Public domain (NASA derivative crop)
- **Why it fits:** Halfway Indonesia / New Zealand extent arcs; AU-centred SRR storytelling.

### s20_03_vostok_station.jpg (if present)
- **Title:** Russian station Vostok
- **Author:** NSF / Josh Landis (U.S. Antarctic Program Photo Library)
- **Licence:** Public domain (U.S. federal government / NSF)
- **URL:** https://commons.wikimedia.org/wiki/File:Russian_station_Vostok.jpg
- **Why it fits:** Brief credibility insert for Vostok pin beat.

### s20_04_concordia_station.jpg (if present)
- **Title:** Concordia Station at Dome C
- **Author:** NASA / Michael Studinger
- **Licence:** Public domain (NASA)
- **URL:** https://commons.wikimedia.org/wiki/File:Concordia_Station_at_Dome_C.jpg
- **Why it fits:** Brief credibility insert for Concordia pin beat.

## Download status (scaffold)

Present: `s20_01`, `s20_02`, `s20_02b`, `s20_05`. **Missing after Wikimedia 429:** `s20_03_vostok_station.jpg`, `s20_04_concordia_station.jpg` — Claude may fetch NSF PD / NASA PD Commons files listed above if needed as ≤1s inserts; maps remain primary.

## Build notes (Claude, Checkpoint C render)
- Basemap in the final: `s20_01_world_topo_basemap_ref.jpg` only, reprojected live onto an orthographic globe (covers the Pole dive, so `s20_02` / `s20_02b` / `s20_05` crops were not needed).
- `s20_03` / `s20_04` station stills: still missing — Wikimedia is blocked from the build container. Per MAP EXPLAINER mode the maps carry the station beat (pins + 3D labels); no stand-in photos used.
- `fonts/anton-latin-400-normal.woff2`, `fonts/montserrat-latin-800-normal.woff2`, `fonts/montserrat-latin-900-normal.woff2` — Anton (Vernon Adams) and Montserrat (Julieta Ulanovsky et al.), SIL Open Font License 1.1, from the @fontsource npm packages.
