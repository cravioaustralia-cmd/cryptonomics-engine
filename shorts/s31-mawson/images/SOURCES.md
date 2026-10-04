# Image sources — s31-mawson

**MAP ANIMATION:** kinetic cartography is the picture, not a photo-underlay. **No AI historical stills. No emoji. No AI faces.**

Real portraits below are **small name cards only**, not the scene.

## Portraits searched (4 Oct 2026)

| Person | File | Result |
|---|---|---|
| Douglas Mawson | `s31_douglas_mawson.jpg` | **Public domain.** Commons `File:Douglas Mawson 1914 2.jpeg`. State Library of South Australia B 9850. https://commons.wikimedia.org/wiki/File:Douglas_Mawson_1914_2.jpeg |
| Belgrave Ninnis | `s31_belgrave_ninnis.jpg` | **Public domain.** Commons `File:B. E. S. Ninnis.jpg`. Frank Hurley / National Library of Australia nla.pic-an23323358. https://commons.wikimedia.org/wiki/File:B._E._S._Ninnis.jpg |
| Xavier Mertz | `s31_xavier_mertz.jpg` | **Public domain.** Commons `File:Xavier Mertz.jpg`, from *The Home of the Blizzard* (1915), vol. 1, plate opposite p. 246. Seated JPEG is 900px wide from that original. https://commons.wikimedia.org/wiki/File:Xavier_Mertz.jpg |

Not used: `File:Lieutenant B.E.S. Ninnis, R.F., in uniform… (6173428229).jpg` — Commons UsageTerms “No known copyright restrictions” but `Copyrighted: True`. Not clearly free.

## How to use them

Small name cards when “Douglas Mawson”, “Belgrave Ninnis”, and “Xavier Mertz” are spoken. Then the map is the picture again. Do not full-bleed them. Do not put them under the route as a slideshow. Do not animate the faces.

## Basemap

Claude builds the GeoGlobeTales-style satellite canvas in render. Antarctica reads as ice (pale blue-grey, texture, crevasse shadow, navy ocean) with **no blown white relief**. Do not use a Commons map PNG as the basemap or as a face.

### Basemap and map data used in the build (open data only)

| Layer | Source | Licence |
|---|---|---|
| Land colour, except Antarctica | NASA Blue Marble Next Generation, the 5400×2700 copy in the PyPI package `basemap-data` | Public domain (NASA) |
| Antarctic ice | Graded procedurally in `render/tools/make_basemap.py` | — |
| Relief and bathymetry | AWS Open Data Terrain Tiles, Terrarium PNG (SRTM, GMTED2010, ETOPO1) | Open data; attribution per the Terrain Tiles registry |
| Coast, Antarctic ice shelves, Australian coast | Natural Earth 10m (`ne_10m_land`, `ne_10m_minor_islands`, `ne_10m_antarctic_ice_shelves_polys`) | Public domain |
| Prior Impossible Journeys routes (master map) | Loaded by `render/tools/make_ij_routes.py`. Ep.1 `mary.escape` and ep.2 `routes.flight` come from `3db0f94:shorts/s27-bert-hinkler/render/geo.json`. Ep.4 `WAY` comes from `origin/claude/s28-robyn-davidson-map-gwcpin`. Ep.5 `WALKP` is the 1931 walk line from the s30 render on `origin/claude/model-opus-v3027k`. | Repo content |

The ice grade is pale blue-grey with a highlight shoulder, so nothing reaches white. Shadows are blue. It adds sastrugi streaks along the katabatic wind, flow bands with arcuate crevasse rows on the Mertz and Ninnis glaciers, smoother ice shelves, a lit ice-cliff edge and small bergs offshore.

### Route trace (approximate)

The sledge track is an approximate trace at map scale. It runs east from Cape Denison inland of the coast, across the Mertz and Ninnis glaciers. The return runs a little further south. The drawn outbound length to the crevasse is about 500 km, and the drawn distance from where Mertz stops back to the base is about 165 km, matching the spoken "about 500" and "about 160". No day-by-day route is claimed.

The `DISTANCE TO BASE` counter is pinned to the spoken anchors: about 500 at the turn back, about 160 when Mawson is alone, and 0 at the base. It interpolates between them. The glacier flow lines are approximate and end at the Wikipedia coordinates of each glacier. The ship is an unnamed icon. No hour count or date is printed for it. The snow-camel is a drift shape drawn in the ice, unlabelled.

### Name cards

`render/assets/card_*.jpg` are square head-and-shoulders crops of the three public-domain portraits above. They were made with `render/tools/make_cards.py` using a crop and a gentle sepia tone only, with no retouching. They appear only as small cards while each name is spoken.
