# Image sources — s17-new-australia-paraguay

All files under `images/`. Wikimedia Commons / NASA PD / Creative Commons. No AI historical stills.

**Maps rule:** Australia (Sydney departure) ↔ Paraguay / New Australia (Nueva Londres) / Cosme region only; locked parchment + white-glow 3D map style over satellite/topo.

**Scaffold gaps for Claude (optional):** free-licence polymer $10 showing Mary Gilmore (paper-series $10 is wrong design — do not use); Cosme colony historical still; higher-res Vandyck Lane portrait if needed (held file is Sydney Worker 1893 PD likeness).

---

### s17_01_shearers_strike_hughenden_1891.jpg
- **Title:** Shearers strike in Hughenden, 1891
- **Author:** Johnson, W. D. (State Library of Queensland)
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:StateLibQld_1_47996_Shearers_strike_in_Hughenden,_1891.jpg
- **Why it fits:** 1891 shearers’ strike camp — recession / beaten shearers mood.

### s17_02_shearers_strike_sketches_1891.jpg
- **Title:** Sketches of events during the Shearers' Strike, 1891
- **Author:** The Queenslander (State Library of Queensland)
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:StateLibQld_2_46852_Sketches_of_events_during_the_Shearers%27_Strike,_1891.jpg
- **Why it fits:** Period strike sketches — 1893-context labour unrest colour.

### s17_03_william_lane_portrait.jpg
- **Title:** William Lane
- **Author:** Sydney Worker 1893
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:William_Lane.jpg
- **Why it fits:** Leader likeness for “Journalist William Lane” beat (Worker 1893 PD portrait).

### s17_04_sydney_cove_circular_quay_c1890.jpg
- **Title:** Church hill from Circular Quay… Sydney Cove, c.1890
- **Author:** Henry King
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:Church_hill_from_Circular_Quay,_depicting_ferries_and_sailing_ships_in_Sydney_Cove,_by_Henry_King,_Sydney,_Australia,_c._1890.jpg
- **Why it fits:** Sydney Harbour / Cove era departure still — Royal Tar leaves Sydney.

### s17_05_royal_tar_ship.jpg
- **Title:** Royal Tar (ship)
- **Author:** State Library of Queensland collection
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:StateLibQld_1_40835_Royal_Tar_(ship).jpg
- **Why it fits:** The colony ship *Royal Tar*.

### s17_07_world_topo_basemap_ref.jpg
- **Title:** Blue Marble / world topo.bathy (Dec 2004 composite)
- **Author:** NASA Earth Observatory / GSFC
- **Licence:** Public domain (NASA)
- **URL:** https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg
- **Why it fits:** Voyage globe / AU↔PY route **reference** underlay — crop to Australia–South America; rebuild locked parchment style; not a flat schematic hero.

### s17_07b_queensland_modis.jpg
- **Title:** Queensland, Australia (MODIS 2017-09-28)
- **Author:** Jeff Schmaltz, MODIS Land Rapid Response Team, NASA GSFC
- **Licence:** Public domain (NASA)
- **URL:** https://commons.wikimedia.org/wiki/File:Queensland,_Australia_(MODIS_2017-09-28).jpg
- **Why it fits:** Eastern Australia satellite basemap for Sydney departure / voyage origin (correct country).

### s17_08_paraguay_satellite_2003.jpg
- **Title:** Satellite image of Paraguay in January 2003
- **Author:** Jeff Schmaltz, MODIS Rapid Response Team, NASA/GSFC
- **Licence:** Public domain (NASA)
- **URL:** https://commons.wikimedia.org/wiki/File:Satellite_image_of_Paraguay_in_January_2003.jpg
- **Why it fits:** **Preferred Paraguay map basemap** — correct country terrain under parchment colony overlays.

### s17_10_nueva_londres_plaza.jpg
- **Title:** Plaza en Nueva Londres
- **Author:** Va de Carro
- **Licence:** CC BY 3.0
- **URL:** https://commons.wikimedia.org/wiki/File:Plaza_en_Nueva_Londres_-_panoramio.jpg
- **Why it fits:** Modern Nueva Londres (New Australia locality) — descendants / place continuity.

### s17_11_nueva_londres_landscape.jpg
- **Title:** Amanecer en Nueva Londres camino a La Pastora
- **Author:** LUIS MILTOS
- **Licence:** CC BY-SA 3.0
- **URL:** https://commons.wikimedia.org/wiki/File:Amanecer_en_Nueva_Londres_camino_a_La_Pastora_-_panoramio.jpg
- **Why it fits:** Paraguay landscape near Nueva Londres — correct-country mood (not Amazon stand-in).

### s17_12_paraguay_atlantic_forest_map.png
- **Title:** Alto Paraná Atlantic Forest
- **Author:** Miguelrangeljr
- **Licence:** CC BY-SA 3.0
- **URL:** https://commons.wikimedia.org/wiki/File:Alto_Paran%C3%A1_Atlantic_Forest.png
- **Why it fits:** Ecoregion **reference only** — rebuild locked map style; do not show flat schematic as hero.

### s17_13_mary_gilmore_1891.jpg
- **Title:** Mary Gilmore, 1891
- **Author:** Ethel Anna Stephens
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:Mary_Gilmore,_1891_SLNSW_FL3317911.jpg
- **Why it fits:** Near-era Gilmore portrait (around colony years).

### s17_14_dame_mary_gilmore.jpg
- **Title:** Dame Mary Gilmore
- **Author:** Unknown (PD)
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:Dame_Mary_Gilmore.jpg
- **Why it fits:** Later Gilmore portrait for “who’s now on Australia’s $10 note” twist.

### s17_15_australia_paraguay_locator_ref.png
- **Title:** Australia Paraguay Locator
- **Author:** Aquintero82
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Australia_Paraguay_Locator.png
- **Why it fits:** Globe/route **reference only** — rebuild as locked satellite + parchment + 3D labels; never hero flat locator.

### s17_16_new_australia_colony_photo.jpg
- **Title:** New Australia
- **Author:** Unknown (PD)
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:New_Australia.jpg
- **Why it fits:** New Australia colony historical still.

---

## Map layers built for the Short (Claude, `render/build-map-layers.py`)

### s17_20_voy_base.jpg … s17_23_voy_glow.png (voyage map)
- **What:** the locked-style Australia ↔ Paraguay voyage map. It is a Pacific-centred equirectangular map, lon 138°E → 42°W across the antimeridian, lat 2°S → 88°S.
  - `20`: the basemap.
  - `21` / `22`: the weathered parchment fills for Australia and Paraguay. Terrain shows through them.
  - `23`: a soft offset shadow plus a thick white outer glow on the Australian coast and the Paraguay border.
- **Sources:**
  - **Basemap:** `s17_07_world_topo_basemap_ref.jpg`. This is NASA Blue Marble world.topo.bathy (Dec 2004), public domain. It was re-cropped, upsampled ×2 and given an extra hillshade from its own shaded relief.
  - **Country outlines:** Natural Earth 1:10m Admin 0 countries, public domain (`nvkelso/natural-earth-vector`).
- **Route:** the *Royal Tar* track is an approximate sailing route. It runs Sydney → south of New Zealand → Cape Horn → River Plate → up the Paraná / Paraguay rivers → Asunción → the colony. No intermediate ports are labelled.

### s17_24_col_base.jpg … s17_26_col_glow.png (colony map)
- **What:** the locked-style Paraguay colony map.
  - `24`: the graded satellite, with neighbouring countries darkened.
  - `25`: a parchment fill over Paraguay. Terrain shows through it.
  - `26`: a thick white outer glow plus a soft shadow on Paraguay's border.
- **Basemap:** `s17_08_paraguay_satellite_2003.jpg` (NASA MODIS, public domain). It is georeferenced by an affine fit to four control points: Asunción, Lago Ypacaraí, Ciudad del Este and the Paraguay–Paraná confluence. The residual is under 0.006°, and the Natural Earth border lands on the real rivers.
- **Whole-country view:** for this view, the MODIS still is feathered into the aligned Blue Marble underlay.
- **Pins (WGS84):**
  - New Australia / Nueva Londres, Caaguazú: 25.42°S 56.53°W.
  - Colonia Cosme, Caazapá: 26.32°S 56.28°W.
- **Licence:** everything is derived from public-domain inputs. Credit is "NASA; Natural Earth".

## Build notes (Claude)
- **`s17_07b_queensland_modis.jpg` is not used.** Its frame covers the Queensland coast, well north of Sydney, so it can't show the Sydney departure correctly. The voyage map uses the real NASA Blue Marble topo/bathy basemap instead, which puts Sydney in the right place.
- **`s17_12` (Atlantic Forest) and `s17_15` (locator) are not shown.** Both were reference only, and the maps were rebuilt in the locked style.
- **The $10 beat avoids a note still.** No free-licence polymer $10 still was available, and no paper-series note is used. Instead, the beat uses a stylised polymer-note frame (motion graphic, not a reproduction of the RBA design) around `s17_14` (Dame Mary Gilmore, later portrait) plus a `$10` label.
- **`s17_16` (New Australia colony photo) is low-res (283×226).** It is used only as a framed sepia card and blurred underlay.
