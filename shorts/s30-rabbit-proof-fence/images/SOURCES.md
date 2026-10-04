# Image sources — s30-rabbit-proof-fence

**MAP EXPLAINER:** maps carry the story. **No AI historical stills. No emoji. No film stills. No AI faces.**

## Portraits searched (4 Oct 2026)

| Person | Result |
|---|---|
| Molly Craig (Molly Kelly) | **No clearly free photo.** Wikipedia article has no image file. Commons hits for the fence are maps, not her portrait. |
| Daisy Kadibil | **No clearly free photo.** Wikipedia article has no image file. |
| Gracie Cross | **No clearly free photo.** No Wikipedia article with a portrait found (title `Gracie_Cross` 404). |
| SLWA | No catalogue hit confirmed as a free-licence photo of this Molly Craig. Not downloaded. |
| Fairfield City “Mollie Craig” | **Wrong person** (Smithfield, NSW). Not downloaded even where that collection marks a photo out of copyright. |

**Decision:** map labels only (`MOLLY`, `DAISY`, `GRACIE`). Do not substitute emoji, pictograms-as-faces, or generated portraits.

## Stills in this folder

None.

## Basemap

Claude builds the GeoGlobeTales-style satellite canvas in render (rich land colour, deep navy bathymetry, soft mid-contrast, no blown white relief). Do not use a Commons fence-route PNG as the basemap or as a face.

### Basemap and map data used in the build (open data only)

| Layer | Source | Licence |
|---|---|---|
| Land colour | NASA Blue Marble Next Generation with topography, the 5400×2700 copy in the PyPI package `basemap-data` | Public domain (NASA) |
| Relief and bathymetry | AWS Open Data Terrain Tiles, Terrarium PNG (SRTM, GMTED2010, ETOPO1) | Open data; attribution per the Terrain Tiles registry |
| Coast, state borders, WA outline, salt lakes (Lake Moore, Lake Barlee) | Natural Earth 10m | Public domain |
| Prior Impossible Journeys routes (master map) | Loaded from the repo by `render/make_ij_routes.py`: ep.1 `mary.escape` and ep.2 `routes.flight` from `3db0f94:shorts/s27-bert-hinkler/render/geo.json`; ep.4 `WAY` from `origin/claude/s28-robyn-davidson-map-gwcpin` | Repo content |

### Rabbit-proof fence trace (approximate)

Fence No. 1 is drawn as one north–south thread from Starvation Boat Harbour on the south coast, through Burracoppin, past Jigalong, to near Cape Keraudren on the north coast. Those anchors are documented by the WA heritage register (inHerit, DPLH) and its fence entries. OpenStreetMap and Wikipedia were blocked from the build container, so the line between the anchors is an approximate hand trace at map scale. The 1931 walk is drawn as a stylised path from Moore River across the wheatbelt onto the fence and north to Jigalong. It makes no day-by-day route claim. The nearby town is a small unnamed dot. The river crossing is an unnamed map band.
