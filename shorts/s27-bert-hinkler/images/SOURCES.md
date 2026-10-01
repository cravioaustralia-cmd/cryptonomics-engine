# Image sources — s27-bert-hinkler

**MAP EXPLAINER:** maps carry the story. Every frame sits on a satellite basemap or globe built for this episode by `render/tools/build_basemap.py`. All gag props are vector motion graphics drawn in `render/scenes.js`: the Avro Avian, cardboard-wings kid, dune, birds, sandwich, passport stamps, series camel, newspaper, thumbs-up stamp, honour guard and wreath. **No AI historical stills.**

## Real photographs (brief credibility inserts)

| File | Subject | Licence basis | Source | Used at |
|---|---|---|---|---|
| `s27_01_bert_hinkler_aviator_slq.jpg` | **Bert Hinkler, aviator** — signed commemorative portrait (State Library of Queensland, record 197751) | Public domain: Australian photograph taken before 1955 (Hinkler died 1933), PD-Australia; SLQ marks its Commons uploads out of copyright | Wikimedia Commons `File:StateLibQld_1_197751_Bert_Hinkler,_aviator.jpg` | 8.05–9.95 s — "His name is Bert Hinkler" (mandatory real portrait, ~1.5 s) |
| `s27_02_bert_hinkler_aged_27.jpg` | **Bert Hinkler aged 27**, c. Dec 1919–1920 | Public domain: Australian photograph taken before 1955, PD-Australia | Wikimedia Commons `File:Bert_Hinkler_aged_27.jpg` | 79.1–82.8 s — "the boy from a small Australian town… buried in Florence" (oval memorial frame) |
| `s27_03_bert_hinkler_avro_avian_1928.jpg` | **Bert Hinkler and his Avro Avian, 1928** (registration G-E… visible) | Public domain: Australian photograph from 1928, PD-Australia | Wikimedia Commons `File:Bert_Hinkler-MJC.jpg` | 54.3–60 s — inside the 1920s "Hustling Hinkler" newspaper prop (Gag 4) |

**How they were fetched:** this session's egress policy blocks Wikimedia, NLA, SLQ and other collection hosts. The three files came from the Hugging Face dataset `wikimedia/wit_base` (Wikipedia-based Image Text, CC BY-SA 4.0 for the dataset text; images keep their Commons licence). That dataset ships each Commons image as a **300 px-wide copy**, so these are displayed at roughly 1.2× in framed photo cards.

**Licence check to do before upload:** the Commons file pages could not be opened from this session, so the licence templates above were not re-read. The PD basis (Australian photographs taken before 1 January 1955) is standard for these files. Please confirm each Commons page shows PD-Australia (or "no known copyright restrictions" for SLQ) and, if wanted, swap in the full-resolution originals: same filenames, no code change needed.

Not used: Mussolini / Florence funeral period stills. None could be fetched or licence-verified here, so that beat uses a soft map treatment (grey Florence pin, honour guard, wreath, name chip). No emoji.

## Basemap layers (built here, Web Mercator + two orthographic globes)

| File | Coverage | Built from |
|---|---|---|
| `map-world.jpg` | World, 74°N–68°S | NASA Blue Marble Next Generation + Tilezen terrain z5 + Natural Earth 10m land |
| `map-route.webp` | England → Australia, 14°W–157°E, 58°N–33°S | Same, terrain z6 |
| `map-europe.webp` | Europe / Mediterranean / North Africa | Same, terrain z7 (+ Natural Earth rivers) |
| `map-aus.webp` | Indonesian archipelago + northern / eastern Australia | Same, terrain z7 |
| `map-italy.webp` | Central Italy (Tuscany, Rome) | Same, terrain z9 |
| `map-london.webp` | London / Thames / Croydon area | Terrain z10 relief; vegetation colour synthesised from elevation (BMNG is ~9 km/px); soft urban tint |
| `map-tuscany.webp` | Florence, Arno valley, Pratomagno | Terrain z11, synthesised colour, rivers |
| `map-darwin.webp` | Darwin | Terrain z10, synthesised colour |
| `map-bundaberg.webp` | Bundaberg / Burnett River / Mon Repos | Terrain z11, land from elevation, synthesised colour |
| `map-globe.webp` | Orthographic globe centred 14°E 39°N (space dive onto London) | BMNG + z4 terrain + Natural Earth |
| `map-globe-over.webp` | Orthographic globe centred 85°E 10°N (overviews: London, Darwin, Florence, Bundaberg all visible) | Same |

- **NASA Blue Marble Next Generation** (Reto Stöckli, NASA Earth Observatory), `bmng.jpg` 5400×2700 from the `basemap-data` wheel on PyPI. Public domain.
- **Tilezen / Mapzen Terrain Tiles** (terrarium), AWS Open Data `s3://elevation-tiles-prod`; derived from SRTM, GMTED2010, ETOPO1, GEBCO, NED. Attribution per https://github.com/tilezen/joerd/blob/master/docs/attribution.md.
- **Natural Earth** 1:10m land, minor islands, rivers; 1:50m countries. Public domain. https://github.com/nvkelso/natural-earth-vector

**Look lock (GeoGlobeTales):** BMNG colour graded with saturation ×1.35. The ocean uses a deep navy bathymetry ramp. Relief is soft and multi-directional with a highlight knee. Snow, ice and salt pans are compressed to a muted grey-blue, so there is **no blown white relief**. Detail layers are WebP files with feathered alpha edges.

## Fonts

| File | Font | Licence |
|---|---|---|
| `render/fonts/anton-latin-400-normal.woff2` | Anton | SIL OFL 1.1 (`render/fonts/OFL-Anton.txt`) |
| `render/fonts/montserrat-latin-{600..900}-normal.woff2` | Montserrat | SIL OFL 1.1 (`render/fonts/OFL-Montserrat.txt`) |
