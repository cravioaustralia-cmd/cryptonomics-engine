# data/ credits

| File | Source | Licence (as stated) | URL |
|---|---|---|---|
| ne_110m_admin_0_countries.geojson, ne_50m_admin_0_countries.geojson | Natural Earth (via nvkelso/natural-earth-vector GeoJSON, master) | Public domain — "All versions of Natural Earth raster + vector map data found on this website are in the public domain." | https://www.naturalearthdata.com/about/terms-of-use/ · https://github.com/nvkelso/natural-earth-vector/tree/master/geojson |
| ne_110m_populated_places.geojson | Natural Earth | Public domain | same |
| ne_110m_lakes.geojson, ne_50m_lakes.geojson | Natural Earth | Public domain | same |
| coordinates.json | Compiled city-centre coordinates (facts); cross-checked with Natural Earth populated places | n/a (facts) / PD | — |

Optional credit line: "Map data: Natural Earth (public domain)".
Note: Natural Earth admin-0 shows de-facto boundaries with its own disputed-area conventions (Gaza/West Bank appear as "Palestine"); MAP03 partition lines must be drawn separately from the 1947 plan, not from NE.

## 1947 UN Partition Plan (MAP03), added 10 Oct 2026

| File | Source | Author | Licence (as stated) | URL |
|---|---|---|---|---|
| partition_plan_1947_UN_A516_annexA_map.jpg (3586x6000, downscaled from the 7277x12175 scan) | "Palestine plan of partition with economic union proposed by the Ad Hoc Committee on the Palestinian Question", Map No. 103, UN Presentation 290, November 1947 (A/516, Annex A); base map Survey of Palestine, April 1946. Scan: Eran Laor Cartographic Collection, National Library of Israel (FL27965163) | United Nations | Public domain (Commons: {{PD-UN-map}} — "Unless stated otherwise, UN maps are to be considered in the public domain… UN requests however that you delete the UN name, logo and reference number upon any modification to the map.") | https://commons.wikimedia.org/wiki/File:United_Nations,_Palestine_plan_of_partition_(FL27965163_2651448).jpg · https://upload.wikimedia.org/wikipedia/commons/4/4a/United_Nations%2C_Palestine_plan_of_partition_%28FL27965163_2651448%29.jpg |
| partition_plan_1947_UN_map103-1b_1956.png (1370x2838, GIF converted to PNG) | Same plan, bilingual reprint: UN Map No. 103.1(b), February 1956 ("Annex A to resolution 181 (II) of the General Assembly, dated 29 November 1947"), from UNISPAL | United Nations Cartographic Section | Public domain (Commons: {{UN map}} → {{PD-UN-map}}) | https://commons.wikimedia.org/wiki/File:UNGA_Resolution_181_(II)._Future_government_of_Palestine_Annex_A_Plan_of_Partition_with_Economic_Union.gif |
| partition_plan_1947.geojson (4 features, EPSG:4326) | Derived by us from partition_plan_1947_UN_map103-1b_1956.png: colour segmentation + affine georeference on 8 graticule intersections (30–33°N × 35–36°E; max residual 0.37 km). Contains no UN name, logo or map number. | Derived work (lf06) of a PD UN map | Public domain source; our derivation is free to use (we add no restrictions) | — |

Credit line (on screen or description): "Boundaries: UN Plan of Partition with Economic Union, A/516 Annex A, 1947 (UN map, public domain). Base map data: Natural Earth (public domain)."
If the UN raster itself is shown modified (cropped, recoloured, relabelled), crop out or remove the "United Nations" name and map number, per the UN request in PD-UN-map, and say "based on UN Map No. 103, Nov 1947".

Considered, not used
- File:UN_Partition_Plan_For_Palestine_1947.svg (PD-USGov, CIA 1973 atlas): vector, but heavily generalised — the Jaffa enclave is missing and boundaries are smoothed. Not accurate enough for MAP03.
- File:1947_Partition_plan_for_Palestine_EN.svg (CC BY-SA 4.0, 2021, own work by a Wikipedia user): fine licence, but unsourced redraw; the UN original is preferred.
- File:UN_Palestine_Partition_Versions_1947.jpg: CC BY-SA 3.0 claimed by a 2026 uploader as "own work" on a copy of the UN map, with categories unrelated to the plan → licence/provenance muddled; skipped.
- GitHub dmxsan/mapping-the-nakba "1947_un_partition_plan.geojson": MIT licence (not in the allowed list), file no longer in the repo, unsourced geometry, advocacy project → skipped.
- UNISPAL Map No. 3067 Rev.1 (DPI): not on Commons with a PD mark → not used.

## lf07 additions (10 Oct 2026)
| File | Source | Author | Licence (as stated) | URL |
|---|---|---|---|---|
| osm_bondi.geojson | OpenStreetMap via Overpass API (coastline, roads, parks; lat -33.915..-33.870, lon 151.245..151.300) | © OpenStreetMap contributors | ODbL 1.0 — credit "© OpenStreetMap contributors" on screen / in description | https://www.openstreetmap.org/copyright |
| coordinates.json (new places: Bondi Beach, Canberra, Tehran, New York UN HQ, Washington, London, Ottawa, Paris, Ripponlea, Lakemba, Beirut, Athens, Rome, Haifa, Jaffa, Kfar Aza, Be'eri, Deir al-Balah, Khan Younis, Rafah, Kerem Shalom, frames, haversine distances) | facts (WGS84 points, ±0.01°), cross-checked against Natural Earth where present | — | not copyrightable | — |
| MAP_NOTES.md (section "Data for the other maps") | own | — | own | — |
