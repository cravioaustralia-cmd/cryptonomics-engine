# Image sources — s15-irukandji

# s15 image sources — free-licence candidates

All files under `images/`. Prefer Wikimedia Commons / NASA PD / Creative Commons. No AI historical stills. No gore.

**Maps rule:** northern Australia / GBR / tropical north waters only; locked parchment + white-glow 3D map style over satellite/topo.

---

### s15_01_carukia_barnesi_gershwin.jpg
- **Title:** Carukia barnesi 001A
- **Author:** Lisa-ann Gershwin
- **Licence:** CC BY 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Carukia_barnesi_001A.jpg
- **Why it fits:** Hero macro of *Carukia barnesi* (Irukandji) — transparent cubozoan bell + tentacles; tasteful scientific underwater/lab photography.

### s15_02_irukandji_tube_queensland.jpg
- **Title:** Irukandji-jellyfish-queensland-australia
- **Author:** GondwanaGirl
- **Licence:** CC BY-SA 3.0
- **URL:** https://commons.wikimedia.org/wiki/File:Irukandji-jellyfish-queensland-australia.jpg
- **Why it fits:** Tiny jelly in vial held in hand — excellent **fingernail/scale proxy**. Soft caption: Commons also associates Malo category — label “Irukandji-type / small box jelly” if species ID is uncertain.

### s15_03_irukandji_size_comparison.png
- **Title:** Irukandjijellyfishsize
- **Author:** Anynobody
- **Licence:** CC BY-SA 3.0
- **URL:** https://commons.wikimedia.org/wiki/File:Irukandjijellyfishsize.png
- **Why it fits:** Schematic scale + nematocysts-on-bell callout — **MG reference only**. Diagram marks ~5 mm bell; adult *C. barnesi* often cited ~1–2 cm — do not let the 5 mm label override VO soft size.

### s15_04_gbr_northern_aus_modis_satellite.jpg
- **Title:** Australia and the Great Barrier Reef (MODIS 2018-04-30)
- **Author:** Jeff Schmaltz, MODIS Land Rapid Response Team, NASA GSFC
- **Licence:** Public domain (NASA)
- **URL:** https://commons.wikimedia.org/wiki/File:Australia_and_the_Great_Barrier_Reef_(MODIS_2018-04-30).jpg
- **Why it fits:** Correct **northern Queensland / Cape York / GBR** satellite basemap for locked map style (terrain/reef visible).

### s15_05_gbr_whitsunday_misr_satellite.jpg
- **Title:** GreatBarrierReef-EO
- **Author:** NASA / MISR
- **Licence:** Public domain (NASA)
- **URL:** https://commons.wikimedia.org/wiki/File:GreatBarrierReef-EO.JPG
- **Why it fits:** Whitsunday / central GBR satellite colour — secondary geography still (lower resolution).

### s15_06_gbr_marine_park_locator.svg
- **Title:** Great Barrier Reef Marine Park locator map
- **Author:** NeoGeneric (CAPAD 2016 derivative)
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Great_Barrier_Reef_Marine_Park_locator_map.svg
- **Why it fits:** Park extent locator — **underlay/reference** for MG rebuild in locked parchment + white-glow style; not a flat schematic hero on its own.

### s15_07_hazardous_marine_creatures_sign.jpg
- **Title:** Australia - Hazardous Marine Creatures
- **Author:** Genet
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Australia_-_Hazardous_Marine_Creatures.JPG
- **Why it fits:** Official-style Qld beach hazard board that **names Irukandji**, delayed symptoms, and northern range (QLD/WA/NT) — safety-colour B-roll; do not treat first-aid text as current medical advice in captions.

### s15_08_marine_stingers_vinegar_depot.jpg
- **Title:** Australia - Marine Stingers (Vinegar depot)
- **Author:** Genet
- **Licence:** CC BY-SA 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:Australia_-_Marine_Stingers_(Vinegar_depot).jpg
- **Why it fits:** Beach “marine stingers” vinegar station — tropical north stinger-season mood; no gore.

### s15_09_mater_hospital_townsville.jpg
- **Title:** Mater Misericordiae Hospital, Townsville
- **Author:** ROxBo (English Wikipedia) — released PD
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:Mater_Misericordiae_Hospital,_Townsville.jpg
- **Why it fits:** North Queensland hospital exterior — “fast hospital treatment” mood without gore or clinical interiors.

### s15_10_ecg_12_lead.jpg
- **Title:** 12 lead ECG
- **Author:** Peterhcharlton
- **Licence:** CC BY 4.0
- **URL:** https://commons.wikimedia.org/wiki/File:12_lead_ECG.jpg
- **Why it fits:** Clinical ECG — hypertension / cardiac-monitoring mood for BP-spike beat. Soft: not a known Irukandji patient’s trace.

### s15_11_munch_scream_doom_mood.jpg
- **Title:** Edvard Munch, 1893, The Scream…
- **Author:** Edvard Munch (1893)
- **Licence:** Public domain
- **URL:** https://commons.wikimedia.org/wiki/File:Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg
- **Why it fits:** Abstract **impending doom / psychology** proxy — tasteful fine-art PD, no gore. Optional if a custom dark abstract MG is preferred instead.

---

## Proxy / labelling notes

- Tiny jellyfish photos are scarce; `01` is the best identified *C. barnesi* still; `02` is the best **scale-in-hand** proxy (species soft).
- No free-licence northern beach turquoise still landed this pass (Commons rate limits) — satellite `04` + safety signs cover geography/season mood; beach still optional later.
- No gore assets included.

---

## Attribution reminder

When publishing, credit CC BY / BY-SA works (authors + licence + link). PD/CC0 need no legal credit but titles help the research trail.

---

## Derived map layers (built for the locked map style, 2026-09-28)

Made by `render/build-map-layers.py` from `s15_04` (NASA MODIS, public domain). The land mask is classified from that image's own pixels, so the coastline is the real Cape York / north Queensland coast. No outside map data or AI.

### s15_12_map_basemap.jpg
- Crop (x 600–3400, full height) of `s15_04`, with a light colour and contrast grade. **Public domain (NASA)**. It's the photographic basemap for the map beat: Cape York, the Gulf coast, the Coral Sea and the outer Great Barrier Reef.

### s15_13_map_parchment.png
- Weathered parchment fill (procedural noise and fibres, with the edges darkened toward the coast), alpha-masked to land at about 50–70% so the terrain shows through. Derived from `s15_04`, public domain.

### s15_14_map_glow.png
- Soft offset drop shadow plus the thick white outer glow on the coastline. Derived from `s15_04`, public domain.

### s15_15_map_waters.png
- A cyan hatched band along the tropical-north coastal waters, animated as the Irukandji "waters of northern Australia". Derived from `s15_04`, public domain.

## Font
- **Oswald** (variable), used for the hook and labels, at `render/Oswald-VF.ttf`. SIL Open Font License 1.1 (`render/OFL-Oswald.txt`).
