# MAP03 notes: 1947 UN Partition Plan (S05–S07)

## Files
- partition_plan_1947.geojson: 4 features (EPSG:4326), property `id` / `label`:
  - `arab_state`: "Proposed Arab state" (MultiPolygon: western Galilee; central hills; the coastal strip from Isdud south through Gaza to the Egyptian border, with a south-western Negev arm). ≈ 11,380 km²
  - `jaffa_enclave`: "Jaffa (enclave of the proposed Arab state)", a small polygon surrounded by the proposed Jewish state, ≈ 6 km². Use the Arab-state fill, with an optional thin outline so it stays visible.
  - `jewish_state`: "Proposed Jewish state" (MultiPolygon: eastern Galilee/Huleh; coastal plain Haifa–Tel Aviv–Rehovot; Negev). ≈ 14,490 km²
  - `jerusalem_corpus_separatum`: "Jerusalem (international zone)", including Bethlehem, ≈ 210 km²
  - Area cross-check: commonly cited plan figures are ~56% / ~43% / <1%. Ours give 55.5% / 43.6% / 0.8%. Close; the differences come from raster resolution.
- Accuracy: about 0.3–0.5 km, and up to about 1 km along boundary lines (source pixel ≈ 160 m). Lake and sea edges follow the 1946 base map. The Sea of Galilee and the Dead Sea are left as gaps, so draw ne_50m_lakes on top.
- Small details: Beersheba town is a tiny Arab-state lobe at the tip of the central Arab block (it is on the source map). At broadcast scale, place the Beersheba pin on that corner and do not claim more precision. Isdud/Majdal sit in the coastal Arab strip.
- Authoritative visual reference: partition_plan_1947_UN_A516_annexA_map.jpg, the 1947 original (A/516 Annex A, Map No. 103). Use it for a "document" shot, e.g. a slow push-in on the paper map, then dissolve into the clean redraw.

## Natural Earth layers already in data/: what holds the 1947 context
| Layer | Mediterranean coast | Gaza Strip | West Bank | Notes |
|---|---|---|---|---|
| ne_50m_admin_0_countries | yes (land edge of EGY/PSX/ISR/LBN/SYR) | yes: PSX part 1 (34.20–34.53E, 31.21–31.59N) | yes: PSX part 2 (34.87–35.57E, 31.35–32.53N) | ISR polygon is today's de-facto outline and extends to 35.89E / 33.42N (includes the Golan). Don't show ISR/PSX internal lines on a 1947 map. Dissolve ISR+PSX into one "Mandate Palestine land" shape, or just use the partition polygons, which already cover the whole Mandate. |
| ne_110m_admin_0_countries | yes (coarse) | NO: PSX at 110m is the West Bank only (Gaza is absorbed) | yes (9 vertices) | Too coarse for MAP03; use only for the world/route map. |
| ne_50m_lakes | — | — | — | Dead Sea (2 polygons) and Sea of Galilee: draw on top. |
| ne_110m_lakes | — | — | — | Neither lake is present in this frame; don't use. |
| ne_110m_populated_places | — | — | — | Only Jerusalem, Tel Aviv and Amman in frame. Use coordinates.json for Gaza, Beersheba and Jaffa. |
NB: The Gaza Strip and the West Bank are 1949 armistice-era shapes. On a 1947 map, do NOT draw them as outlines. If wanted, they belong in a later "1949" beat.

## (a) Frames (lon/lat, WGS84)
- Whole plan (portrait or side-panel), tight: lon 34.10 → 35.85, lat 29.40 → 33.40
- Whole plan in a full 16:9 frame (equirectangular, cos 31.4° ≈ 0.854), centred on 34.95E, 31.40N: lon 30.70 → 39.20, lat 29.35 → 33.45. The map then sits in the middle third. Better to place the plan at frame-left with the legend at right: lon 33.10 → 41.60, same lat.
- Tight Gaza–Jerusalem–Beersheba frame (16:9): lon 33.55 → 36.25, lat 30.90 → 32.20. This holds Gaza 34.47/31.50, Jaffa 34.75/32.05, Jerusalem 35.21/31.77, Beersheba 34.79/31.25, the Dead Sea and the Jordan.
- Jerusalem inset (corpus separatum, 16:9): lon 35.05 → 35.45, lat 31.63 → 31.86
- Pins: use coordinates.json, plus Jaffa 32.0504N, 34.7522E and Haifa 32.7940N, 34.9896E.

## (b) Neutral styling (mandatory)
- Fills:
  - Proposed Jewish state: SLATE (e.g. #8C96A5).
  - Proposed Arab state, including the Jaffa enclave: SAND (e.g. #D6BE96).
  - Pick either assignment, but keep the two equal in saturation and value. Neither should read "hotter" or "warning".
- Jerusalem (international zone): a neutral third tone, e.g. warm off-white #EFEDE6 with a thin #5A5A5A ring.
- Surroundings: other land in muted grey-beige (#EBE8E1), sea in a pale grey-blue (#C8D7E1), no relief. Borders 1–1.5 px dark grey, the same weight on all zones.
- NO national flag colours or combinations. No blue + white together as the Jewish-state fill. No green / red / black / white set for the Arab state. No flags, emblems or symbols. No arrows suggesting movement or conquest.
- Labels exactly: "Proposed Jewish state" · "Proposed Arab state" · "Jerusalem (international zone)". Optional small label "Jaffa" next to the enclave. Same font, size and colour for both state labels (Inter SemiBold, dark grey).
- Title or caption suggestion: "UN Partition Plan, 29 November 1947 (General Assembly resolution 181 (II))". Source line: "Boundaries: UN map, A/516 Annex A, 1947 (public domain). Base: Natural Earth."
- Present-day names "Israel", "Palestine", "West Bank" and "Gaza Strip" do not appear on the 1947 map. Use only "Gaza" (town), "Jaffa", "Jerusalem" and "Beersheba" pins.
- Animate both states in at the same time, at the same speed and opacity (no sequential "reveal" that implies priority).

---
# Data for the other maps (collected 10 Oct 2026; the pipeline builds the maps)

| Map | Data in data/ | Notes |
|---|---|---|
| MAP01 THE THREAD (globe, Sydney → Gaza) | ne_110m_admin_0_countries.geojson, ne_110m_lakes.geojson, ne_110m_populated_places.geojson; coordinates.json (Sydney, Gaza, Melbourne, Canberra, Tehran, New York, Bondi Beach, London, Ottawa, Paris, Washington DC) | Natural Earth = public domain. Great-circle Sydney→Gaza City = 14,185 km (haversine, in coordinates.json `_distances_km_great_circle`); script says "≈14,000 km" (OK). Node places: 1947 VOTE (New York UN), JET PARTS (Sydney/Melbourne → global pool), THE FIRE (Bondi Beach 20 Oct 2024 — suburb marker only; Ripponlea Dec 2024), WORDS, LIVES, RECOGNITION (New York), THE SKEPTICS, OCT 7 (Kfar Aza/Be'eri), BONDI (Bondi Beach). |
| MAP02 Beersheba 1917 | ne_50m_admin_0_countries / ne_50m_lakes; coordinates.json Beersheba 31.2518N 34.7913E (also Gaza, Jerusalem) | Charge date 31 Oct 1917 (AWM). Arrow = pipeline. |
| MAP03 1947 partition plan | partition_plan_1947.geojson, partition_plan_1947_UN_A516_annexA_map.jpg, partition_plan_1947_UN_map103-1b_1956.png, ne_50m layers; see sections above | Reused unchanged from the pilot. |
| MAP04 migration flows | ne_110m_admin_0_countries; coordinates.json Melbourne (+Station Pier), Sydney, Lakemba, Beirut, Athens, Rome, London; frame "Australia + Middle East + Europe frame (MAP04)" | Europe→Melbourne, Middle East→Sydney. Flow volumes are NOT collected (build as schematic arrows; no numbers on screen, or take them from ABS 'Cultural diversity' — DOC10 xlsx has country-of-birth by religion). |
| MAP05 F-35 global parts pool | ne_110m_admin_0_countries; coordinates.json Sydney, Melbourne (AU factories are schematic), Washington DC | Label "simplified". All partner nodes one colour. No operator list collected: use the F-35 partner programme list from Lockheed/Defence at build time (not downloaded). |
| MAP06 alleged money trail | coordinates.json Tehran, Sydney, Melbourne, Ripponlea; ne_110m | Dotted line + 'ALLEGED' tag. Intermediaries ('cut-outs') are not geolocated — ASIO did not publish locations; draw as abstract waypoints. |
| MAP07 Gaza Strip + southern Israel | ne_50m_admin_0_countries (ISR/PSX), ne_50m_lakes; coordinates.json Gaza City, Deir al-Balah, Khan Younis, Rafah, Kerem Shalom, Kfar Aza, Be'eri; `Gaza Strip (bbox)`; `Southern Israel + Gaza frame (MAP07, 16:9)` | Reference OCHA map (cite OCHA). Border = Natural Earth 50m PSX polygon part 1. Convoy route (WCK 1 Apr 2024, Deir al-Balah) is schematic. |
| MAP08 recognition map | ne_110m_admin_0_countries (ADM0_A3: AUS, GBR, CAN, FRA) | Light Australia, UK, Canada, France together (script). Recognition date 21 Sep 2025 for AU/UK/CA; France announced at UNGA 22 Sep 2025 — check on build. |
| MAP10 Bondi locator | osm_bondi.geojson (OSM extract: coastline, roads, parks; lat -33.915..-33.870, lon 151.245..151.300), coordinates.json "Bondi Beach" | © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright). Extract fetched from Overpass API 10 Oct 2026. One soft marker only, no attack-site detail (no site coordinates collected on purpose). |
| MAP11 Sydney → Melbourne line | coordinates.json Sydney, Melbourne | Great-circle = 713 km; road distance ≈ 880 km. SCRIPT SAYS "800 km (rounded)" — matches neither; use "about 700 km" (straight line) or "about 880 km" (road) and keep it consistent (script s10 on-screen numbers). |
| MG01 / MG02 | no data (own) | MG02 cast board: Ahmed al Ahmed → name card (no free photo, PH27); Zomi Frankcom → name card (no permission, PH15). |
