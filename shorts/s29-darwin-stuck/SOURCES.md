# Sources — s29-darwin-stuck

Scaffold seated 4 Oct 2026 (AEDT). **MAP EXPLAINER:** maps carry the story. No portrait stills required.

## Music

| File | Track | Licence | Credit | Source |
|---|---|---|---|---|
| `music/music.mp3` (also `audio/music.mp3`) | Silent Descent — Eugenio Mininni | Mixkit Stock Music Free Licence | Eugenio Mininni / Mixkit | https://mixkit.co/free-stock-music/silent-descent/ (asset id **614**) |

Why: tense cinematic bed for a 1942 Darwin map-explainer teaser (same free bed already in-repo from s18). **Not** Mixkit Skyline 601 (lf01 teaser, not Impossible Journeys).

## SFX

Shared Mixkit kit copied into `sfx/` — see `sfx/sources.tsv`.  
**Sad horn toot (gag 3):** `sfx/sad_horn_toot.wav` is an **original synthesis** (`render/make_horn.py`; minor A–C–E chord sagging ~2 semitones). Mixkit (`mixkit.co`, `assets.mixkit.co`) was blocked by the render container's network policy, so no third-party horn could be fetched. No licence encumbrance; credited in `sfx/sources.tsv`.

## Basemap (built in render — not stills)

| Layer | Source | Licence |
|---|---|---|
| Elevation + bathymetry (hillshade, coast, ocean depth) | AWS Terrain Tiles, Mapzen "terrarium" encoding (SRTM, GMTED2010, ETOPO1 and others) — https://registry.opendata.aws/terrain-tiles/ | Open data; attribution per https://github.com/tilezen/joerd/blob/master/docs/attribution.md |
| Land colour | NASA Blue Marble Next Generation (cloud-free), 4096×2048 copy shipped in the `three-globe` npm package (`example/img/earth-blue-marble.jpg`) | NASA imagery, public domain |

Built by `render/build_basemap.py` → `images/map/*` (Web Mercator mip chain + NT and desert overlays). Look: rich land colour, deep navy bathymetry, soft hillshade with highlights soft-clipped (no blown white relief). Inland water re-tinted from black to lake blue. Rail alignments, borders and city positions are hand-placed from real coordinates in `render/scenes.js`.

## Fonts

Montserrat (700/800/900) and Anton, SIL Open Font Licence 1.1, from the `@fontsource/montserrat` and `@fontsource/anton` npm packages → `images/fonts/`.

## Stills

None seated. No named person needs a portrait. Do not invent admiral faces, emoji stand-ins, or AI historical stills.

## Script geography (for Claude — do not rewrite VO)

- **Birdum, NT** — historical southern terminus of the North Australia Railway from Darwin.
- **Alice Springs, NT** — southern railway stub (Central Australian Railway) in 1942.
- Roughly **~1,000 km** with no connecting railway between those stubs — as spoken.
- Darwin bombing (Feb 1942) and evacuation of most civilians — as spoken background only; do not add dates to the VO.
