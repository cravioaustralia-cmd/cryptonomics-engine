# Image sources — s25-cliff-young

Every still used in the render is listed here. All are free licences. **No AI images.**

**Cliff Young likeness:** no free-licence photo of Cliff Young (or of the 1983 race) could be verified, so none is used. On screen he is a gold race token and a gold pictogram, never a faked portrait. If production obtains a licensed 1983 race/finish photo, it can drop into the name beat (`IMG.farm`) or the finish beat (`IMG.melb`) in `render/scenes.js`.

**How the Flickr stills were found:** Wikimedia hosts are blocked by this build container's network policy. The stills below come from the Flickr Creative Commons photos mirrored in the CommonCatalog CC-BY dataset on Hugging Face (`common-canvas/commoncatalog-cc-by`), which records each photo's Flickr page, author and licence. Each licence below is the one recorded there (CC BY 2.0).

| File | What it shows | Author | Licence | Source | Why it fits / where used |
|---|---|---|---|---|---|
| `s25_01_rubber_boots.jpg` | Pair of black rubber boots (gumboots) beside a child's pink pair | Fabio Bruna | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Flickr 417667243](http://www.flickr.com/photos/58703524@N00/417667243/) | Gumboots hero prop: frame-1 hook `61 · GUMBOOTS`, opening beat, shoe-swap beat and the loop. Generic prop, not Cliff's own boots. |
| `s25_02_apollo_bay_otways.jpg` | Apollo Bay and the Otway Ranges hills, Victoria | Aenneken | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Flickr 138837938](http://www.flickr.com/photos/78414259@N00/138837938/) | Otways country around Beech Forest, where Cliff farmed. Name beat (`CLIFF YOUNG`). |
| `s25_03_apollo_bay_sheep.jpg` | Sheep grazing on a hillside above Apollo Bay, Victoria | DWZ | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Flickr 101555521](http://www.flickr.com/photos/93907767@N00/101555521/) | Otways sheep country. "Round up sheep on foot… for days" beat. |
| `s25_05_nsw_country_road.jpg` | Tree-lined NSW country road with a 100 km/h sign (Big Ride 2006, Binalong–Holbrook area, near the Hume corridor) | goosmurf | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Flickr 108322343](http://www.flickr.com/photos/19349404@N00/108322343/) | Country road between Sydney and Melbourne. Cropped to the left third, so the cyclists are out of frame. Used for sponsors, race start, night (re-graded), morning (re-graded) and catch-up beats. |
| `s25_06_australia_day_crowd.jpg` | Crowd on Australia Day, Southbank, Brisbane (2007) | David Jackmanson | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Flickr 370386620](http://www.flickr.com/photos/58301516@N00/370386620/) | Soft "people" crowd underlay for "People laugh" and the prize-share beat. Not presented as the 1983 race crowd. |
| `s25_07_sydney_harbour.jpg` | Watsons Bay and North Head, Sydney | Ymblanter | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Commons](https://commons.wikimedia.org/wiki/File%3ASydney_Watsons_Bay_North_Head_seen_from_South_Head_Lighthouse_Walk_04.jpg) (already in repo: `video/australia-documentary/images/37_sydney_harbour_headland.jpg`) | Sydney context behind the route map (race start city). |
| `s25_08_melbourne_flinders_st.jpg` | Flinders Street Station, Melbourne | Guohua Song | Pexels Licence (free) | [Pexels](https://www.pexels.com/photo/flinders-street-station-in-melbourne-cityscape-32008373/) (already in repo: `video/australia-documentary/images/91_melbourne_crowd.jpg`) | Melbourne finish, podium and carried-off beats. |
| `s25_map_src_blue_marble_ortho.jpg` | NASA Blue Marble orthographic view of Australia | NASA (composed by Ghalas) | Public domain (NASA) | [Commons](https://commons.wikimedia.org/wiki/File:Australia_satellite_orthographic.jpg) (already in repo: `s24_06` / `s07_02`) | Source of `render/assets/basemap_se.jpg` (see below). |

## Route map basemap

`render/assets/basemap_se.jpg` is a public-domain derivative of `s25_map_src_blue_marble_ortho.jpg`. It is cropped to south-east Australia (Sydney ↔ Melbourne), upscaled 4× with Lanczos, and given soft highlight roll-off so no relief blows out white, plus a gentle warm and saturation grade. Ocean tint and soft top-left lighting are added in SVG, to the GeoGlobeTales quality bar.

- Sydney and Melbourne pins are placed from visible landmarks: Port Phillip Bay, Cape Howe, Moreton Bay and Wilsons Promontory, with latitude interpolated along the NSW coast.
- The route line is an **approximate** Hume Highway corridor (Goulburn · Yass · Gundagai · Albury · Wangaratta · Seymour), not a surveyed race course.
- On-screen labels are `SYDNEY` and `MELBOURNE` only.

## Not used

- Cyclist crowd at the Big Ride start (Flickr 108322262). It shows a cycling event, which would read as the wrong sport.
- Non-Australian sheep (New Zealand, Europe). They are geographically wrong.
