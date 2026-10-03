# Image sources — s28-robyn-davidson

**MAP EXPLAINER:** maps carry the story. Photos are brief credibility inserts only. **No AI historical stills.** Fetched 3 Oct 2026 from Wikimedia Commons via `Special:FilePath`.

## Robyn Davidson — not sourced

| Requirement | Status |
|---|---|
| Real free-licence **Robyn Davidson** portrait | **NOT FOUND.** Commons search for “Robyn Davidson” returned no portrait (only an Italian film-still file, which was not downloaded). Trek photographs are Rick Smolan for National Geographic (Getty / NPG). NPG record 2014.9 is marked image not available and is not a free licence. **No magazine scan downloaded. No portrait invented.** |
| What to do on screen | Do **not** use emoji, a pictogram, or a name-chip as a stand-in face. Keep her as the map person icon until a free-licence photo is verified and added here. |

## Stills in this folder

| File | Subject | Licence | Author / credit | Source URL | Use |
|---|---|---|---|---|---|
| `s28_01_alice_springs_stuart_highway_sign.jpg` | Welcome to Alice Springs sign, southern entrance, Stuart Highway. GPS 23°47′09″S 133°52′40″E. Modern (7 Oct 2025) — the town, not a 1977 streetscape | CC BY-SA 4.0 | DaHuzyBru | https://commons.wikimedia.org/wiki/File:Welcome_to_Alice_Springs_southern_entrance_sign,_October_2025_03.jpg | Brief Alice Springs insert. Resized to 1200 px wide on download |
| `s28_02_rick_smolan_macworld_2009.jpg` | Photographer **Rick Smolan** at Macworld Expo, Moscone Center, San Francisco, 9 Jan 2009. **Not** a 1977 trek photo and **not** Robyn | CC BY-SA 3.0 and GFDL 1.2+ | Aljawad | https://commons.wikimedia.org/wiki/File:Rick_Smolan.jpg | Optional brief insert when the photographer is mentioned. Original upload note once misspelt “Smolar”; the file title and description say Rick Smolan, and the picture matches him |
| `s28_03_camels_northern_territory_c1925.jpg` | Camels in the desert, Northern Territory, c. 1925 (glass negative GN04504). **Not** Davidson’s 1977 camels | CC0 1.0 | State Government Photographer; History Trust of South Australia | https://commons.wikimedia.org/wiki/File:Camels_in_the_Desert,_Northern_Territory(GN04504).jpg | Desert-camel credibility. Label as NT camels, not her animals |
| `s28_04_uluru.jpg` | Uluru / Ayers Rock, landscape, 14 Sep 2004. No rock art in frame | CC BY-SA 3.0 (attribution: Alexandra at lb.wikipedia) and GFDL 1.2+ | Alexandra | https://commons.wikimedia.org/wiki/File:Ayers_Rock_-_Uluru.JPG | Brief Uluru insert. **Extra caveat:** Commons warns that images captured in Uluṟu-Kata Tjuṯa National Park (a Commonwealth reserve) may not be used for commercial gain unless an EPBC Regulations exemption or permit applies. Copyright licence is CC BY-SA; the park rule is separate. Confirm before a monetised YouTube upload. Do not swap in rock-art close-ups |
| `s28_05_simpson_desert_big_red.jpg` | Simpson Desert, “The Big Red”, 2001. Camera ~25°53′S 139°02′E (South Australia). Public-domain release by the photographer | Public domain (author release, worldwide) | Robinsoncrusoe | https://commons.wikimedia.org/wiki/File:SimpsonDesert.jpg | **Red-centre dune texture only.** The Simpson is east of Alice Springs and is **not** on the 1977 westbound route. Do not pin the route here |
| `s28_06_hamelin_pool_shark_bay.jpg` | Hamelin Pool, Shark Bay, WA — stromatolite shore and shallow Indian Ocean water, 9 Jan 2018. GPS 26°24′02″S 114°09′33″E | CC BY 2.0 | Donald Hobern (Flickr dhobern) | https://commons.wikimedia.org/wiki/File:Hamelin_Pool_(26081546618).jpg | West-coast ocean still for the **sourced** end (NPG 2014.9: Hamelin Pool / Shark Bay). Label as Hamelin Pool, Shark Bay — not as a town the VO names, and **not** Hamelin Bay in the south-west. Resized to 1600 px wide on download |

## Not downloaded

- National Geographic, May 1978, “Tracks” — Rick Smolan photographs, including the camels in the sea. Copyrighted. Not downloaded.
- Getty / Contour Smolan frames. Not downloaded.
- NPG prints 2014.9 and the Uluru Smolan portrait. Image not available / not free.
- Italian Commons file `Tracks, il film che racconta…` — film still, not used.
- No free-licence photograph of the elder (Mr Eddie) was sought for portrait use. Map icon only; no caricature.

## Basemap (built in `render/make_basemap.py`; no stills used as the basemap)

The satellite canvas in `render/assets/map_*.jpg` is a graded derivative of open data only. The licences allow commercial use.

| Layer input | What it gives | Licence | Source |
|---|---|---|---|
| NASA Blue Marble Next Generation (5400×2700 copy in the PyPI package `basemap-data` 2.0.0, file `mpl_toolkits/basemap_data/bmng.jpg`) | Natural land colour | Public domain (NASA Earth Observatory) | https://pypi.org/project/basemap-data/ · https://visibleearth.nasa.gov/collection/1484/blue-marble |
| AWS Open Data Terrain Tiles (Terrarium PNG, zooms 7–12) | Elevation for soft hillshade, dune gating, Uluru relief and ocean depth | Open data. Sources include SRTM (NASA/USGS, public domain), GMTED2010 (USGS, public domain) and ETOPO1 (NOAA, public domain); attribution per https://github.com/tilezen/joerd/blob/master/docs/attribution.md | https://registry.opendata.aws/terrain-tiles/ |
| Natural Earth 10m land, minor islands, admin-1 lines and geography regions | Coastline mask, unlabelled state borders and the Gibson Desert outline | Public domain | https://github.com/nvkelso/natural-earth-vector |

Grade, per the GeoGlobeTales lock:

- **Colour:** saturation is lifted and the red centre warmed. Salt pans are pulled to pale ochre.
- **No blown white relief:** a highlight shoulder caps luminance at about 80 %, and the hillshade lift is capped at +11 %.
- **Ocean:** a deep-navy bathymetry ramp with turquoise coastal shallows.
- **Dunes:** a stylised linear-dune texture, roughly east–west, is gated to sandy low-relief country so the red-centre dunes read on screen. It is texture, not surveyed dunes.

Every layer is graded by the same function of longitude, latitude and elevation, so the high-resolution patches feather seamlessly into the base. The patches cover the route corridor, the opening shot, Alice Springs, Uluru, Shark Bay and Hamelin Pool.

## Route and master map (vector, drawn in `render/scenes.js`)

- **Route:** her 1977 line is an approximate track: Alice Springs, Glen Helen, Areyonga, past Uluru, Docker River, Warburton, Carnegie, Wiluna, Hamelin Pool. It is not a surveyed path. Only Alice Springs, Uluru, Gibson Desert, Indian Ocean, west coast and the sourced Hamelin Pool end pin are labelled.
- **Distance callouts:** the 2,700 km callout runs along the route as a dimension line, so it does not claim a straight-line distance. The "~335 km" Alice–Uluru callout is the published straight-line distance (Wikipedia, *Uluru*). The haversine between the town centre and the rock measures 341 km.
- **Master map:** episode routes are approximate series graphics. Episode 1 runs from Sydney Cove north inside the reef, through Torres Strait, to Kupang. Episode 2 arrives from Singapore via Java and Bima to Darwin. Episode 3 has no folder yet, so nothing is drawn for it.

## Inserts used in the cut

- `s28_02_rick_smolan_macworld_2009.jpg` is shown about 1.6 s on "a photographer will meet her along the way". It is labelled "RICK SMOLAN · PHOTOGRAPHER · PICTURED 2009" with the on-screen credit "Photo: Aljawad · CC BY-SA 3.0". It is not presented as a trek photo.
- No other stills are used. The Uluru photo is not used, which sidesteps its EPBC park caveat. Robyn appears only as the map person icon, never as a fake face.
