# Image sources — s26-mary-bryant

**MAP EXPLAINER:** maps carry the whole story. Every frame sits on a satellite basemap built for this episode by `render/tools/build_basemap.py`. All gag props are vector motion graphics drawn in `render/scenes.js`: the boats, Pandora frigate, Dutch flag, camel, chains, case file and coins. **No AI historical stills. No photos were used.**

## Basemap layers (built here, Web Mercator)

| File | Coverage | Built from | Licence |
|---|---|---|---|
| `map-world.jpg` | World, 74°N–68°S | NASA Blue Marble Next Generation colour + Tilezen terrain z5 + Natural Earth 10m land | NASA imagery is public domain. Tilezen terrain is open data (see below). Natural Earth is public domain. |
| `map-region.webp` | Australia → Timor, 100–163°E, 8°N–46°S | Same, terrain z7 | Same |
| `map-torres.webp` | Cape York / Torres Strait / Pandora Entrance | Same, terrain z9 | Same |
| `map-kupang.webp` | West Timor / Kupang Bay | Same, terrain z10 | Same |
| `map-sydney.webp` | Port Jackson / Sydney coast | Tilezen terrain z11 relief; vegetated colour synthesised from elevation (BMNG is ~9 km/px here); land/water from terrain | Same |
| `map-uk.webp` | Great Britain (London, Cornwall) | Same, terrain z7 | Same |

- **NASA Blue Marble Next Generation** (Reto Stöckli, NASA Earth Observatory), `bmng.jpg` 5400×2700. Taken from the `basemap-data` wheel on PyPI (matplotlib basemap). NASA imagery is public domain. https://visibleearth.nasa.gov/collection/1484/blue-marble
- **Tilezen / Mapzen Terrain Tiles** (terrarium encoding), AWS Open Data `s3://elevation-tiles-prod`. These are derived from SRTM, GMTED2010, ETOPO1, GEBCO and NED. Attribution is per https://github.com/tilezen/joerd/blob/master/docs/attribution.md. Used for relief shading and ocean bathymetry.
- **Natural Earth** 1:10m land, minor islands, reefs and coastline, plus 1:50m countries. Public domain. Fetched from https://github.com/nvkelso/natural-earth-vector. Used for crisp land masks, coast glows, the Timor highlight and Great Barrier Reef lines.

**Look lock (GeoGlobeTales):** colour is graded from BMNG with saturation ×1.35 and lifted shadows. The ocean uses a deep navy bathymetry ramp. Relief is soft and multi-directional with a highlight knee, so ridges never clip to white. Snow, ice and salt pans are compressed toward a muted grey-blue, so there is no blown-white relief. Detail layers are WebP files with feathered alpha edges, so they melt into the world layer.

## Fonts (on-screen labels and captions)

| File | Font | Licence |
|---|---|---|
| `render/fonts/anton-latin-400-normal.woff2` | Anton (big numbers, hook) | SIL OFL 1.1 (`render/fonts/OFL-Anton.txt`), via `@fontsource/anton` |
| `render/fonts/montserrat-latin-{600..900}-normal.woff2` | Montserrat (captions, chips, labels) | SIL OFL 1.1 (`render/fonts/OFL-Montserrat.txt`), via `@fontsource/montserrat` |

## Not used: photo inserts

The brief allowed brief credibility inserts of 1 s or less: a First Fleet or Mary Bryant still, a Boswell portrait and Pandora wreck colour. This session's egress policy blocks Wikimedia Commons, NLA, SLNSW and other collections, so no free-licence still could be fetched or licence-verified. No authentic portrait of Mary Bryant is known to exist. The beats therefore stay fully on the map, using vector props: a quill chip for Boswell and a vector HMS Pandora. A licence-verified Boswell portrait (Reynolds, PD) can be dropped in later as a ≤1 s insert at about 79.4–80.9 s.
