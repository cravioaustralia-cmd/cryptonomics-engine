# Image sources — s14-german-place-names

All included stills are real, free-licence Wikimedia Commons / PD / CC sources. No AI-generated historical stills. Filenames renamed `s14_NN_…` for episode consistency; provenance below matches the deliverables pack.

**Maps rule (locked):** whenever maps appear, use **textured satellite** basemaps with a **3D** extruded/tilted treatment — detailed photographic/satellite texture (hills, farmland, towns visible). **NOT** flat schematic, outline, or bare relief-only. File `s14_11_…` is relief underlay support for Claude’s 3D satellite map MG — not a flat schematic hero.

| File | Use / factual note | Author / holding | Licence | Source |
|---|---|---|---|---|
| `s14_01_hahndorf_st_pauls_church.jpg` | St Paul’s Lutheran, Hahndorf — settler-town / 1935 restoration | Dietmar Rabich | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Hahndorf_(AU),_St_Paul%27s_Lutheran_Church_--_2019_--_0679.jpg) |
| `s14_02_hahndorf_main_street.jpg` | German-heritage main streetscape — built-towns / restoration closer | Orderinchaos | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:ADH_hahndorf_main_street.jpg) |
| `s14_03_lobethal_lutheran_church.jpg` | Lobethal Lutheran church & school — settler town (restored 1935 from Tweedvale) | Marionlad | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Lobethal_Lutheran_Church_%26_School.JPG) |
| `s14_04_klemzig_early_painting.jpg` | Early Klemzig painting — 1838-era storytelling; Klemzig→Gaza (restored 1935) | State Government Photographer / SLSA | CC0 | [Commons](https://commons.wikimedia.org/wiki/File:Klemzig_in_early_times_-_A_painting(GN12913).jpg) |
| `s14_05_birdwood_aerial_2023.jpg` | Detailed aerial of Birdwood (ex-Blumberg) — name **kept**; geography / 3D satellite map detail ref | Bahnfrend | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Birdwood_SA_aerial_photograph,_2023_(01).jpg) |
| `s14_06_queen_adelaide_beechey.jpg` | Queen Adelaide (Saxe-Meiningen) — German-born queen; capital never renamed | Sir William Beechey (c. 1831) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Beechey,_William_-_Adelaide_of_Saxe-Meiningen_-_NPG_1533.jpg) |
| `s14_07_general_birdwood_gallipoli_1915.jpg` | Gen. William Birdwood at Gallipoli, May 1915 — Blumberg→Birdwood rename | Unknown (period photograph) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Birdwood_Gallipoli_May_1915.jpg) |
| `s14_08_adelaide_skyline_2022.jpg` | Adelaide capital skyline — tease / “biggest German name” irony | Ardash Muradian | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Adelaide_skyline,_December_2022.jpg) |
| `s14_09_captain_dirk_meinerts_hahn.jpg` | Capt. Dirk Meinerts Hahn — **Danish-born** *Zebra* master; naming irony | Unknown (historical portrait) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Dirk_Meinerts_Hahn.jpeg) |
| `s14_10_tweedvale_lobethal_bush_scene.jpg` | Period “Tweedvale (Lobethal)” bush scene — wartime rename colour | State Government Photographer / SLSA | CC0 | [Commons](https://commons.wikimedia.org/wiki/File:Bush_Scene_at_Tweedvale_(Lobethal)(GN08225).jpg) |
| `s14_11_sa_relief_location_underlay.png` | SA relief locator — **underlay only** for 3D textured-satellite map MG; never flat schematic hero | Tentotwo | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Australia_South_Australia_relief_location_map.png) |
| `s14_12_sentinel2_adelaide_hills.jpg` | **3D map basemap texture.** True-colour (TCI) Sentinel-2A L2A, 11 Jan 2024, tiles 54HTG + 54HUG, same pass so there is no seam. Covers Adelaide coast → Mount Lofty Ranges → Birdwood (138.50–139.03°E, 34.72–35.13°S, UTM 54S). Mosaicked, resampled to 3072 px and lightly graded (brightness/contrast/saturation ×1.12). Real satellite imagery, not AI. | Contains modified Copernicus Sentinel data 2024 (ESA); via AWS Open Data `sentinel-cogs` (Element 84) | Copernicus Sentinel data licence: free, full and open (attribution) | `s3://sentinel-cogs/sentinel-s2-l2a-cogs/54/H/TG/2024/1/S2A_54HTG_20240111_0_L2A/`, `…/54/H/UG/2024/1/S2A_54HUG_20240111_0_L2A/` |
| `s14_13_terrain_dem_adelaide_hills.png` | **3D map elevation.** 520×490 height grid on the same UTM footprint as `s14_12`, encoded as R·256+G in decimetres (0–715 m). Built from Terrarium z12 tiles and drawn with ×3.2 vertical exaggeration. | AWS Terrain Tiles (Mapzen / Tilezen joerd; source data incl. SRTM, GMTED, ETOPO1) | SRTM / GMTED / ETOPO1: public domain (USGS / NOAA); tiles hosted on AWS Open Data | https://registry.opendata.aws/terrain-tiles/ |

## Usage notes

- Prefer town / portrait / aerial stills tied to the VO beats; reject generic European alpine village stock.
- Capt. Hahn: Danish-born — never caption “German captain”.
- Queen Adelaide: German-born (Saxe-Meiningen); city of Adelaide was **never** on the 69-name wipe list.
- Ambleside: railway station name near Hahndorf — **not** a Gallipoli general.
- Klemzig/Gaza and Lobethal/Tweedvale restored 1935 with Hahndorf; Birdwood (ex-Blumberg) **kept**.
- Maps: the 3D map is WebGL rendered inside `renderFrame(t)` (`render/map3d.js`). It drapes the real Sentinel-2 texture (`s14_12`) over exaggerated terrain (`s14_13`) as an extruded slab, and town pins are projected from WGS84 coordinates. `s14_11_…` is **not used** in the cut.
- Not used in the cut: `s14_11_sa_relief_location_underlay.png` (superseded by the satellite 3D map).
- Soft count: spoken 69 (gazette) fine; on-screen may hedge `~69`.
- CC BY / BY-SA stills: keep attribution in this file; share-alike applies if a still itself is adapted as a standalone work — MG overlay on a dimmed underlay for the Short is the intended use.
