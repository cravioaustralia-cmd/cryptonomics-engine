# Render — s27-bert-hinkler (MAP EXPLAINER · Impossible Journeys ep.2)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**. No Remotion. Built on `shorts/shared/render/` (`frame.html`, `engine.js`, `capture.mjs`).

## Build

```bash
cd shorts/shared/render && npm ci                    # once (Playwright)
node shorts/s27-bert-hinkler/render/build.mjs         # mix → capture → mux → out/ + final/
node shorts/s27-bert-hinkler/render/mix.mjs           # audio only (writes out/loudnorm-report.txt)
node shorts/s27-bert-hinkler/render/tools/preview.mjs /tmp/pv 0 35.9 91.2       # spot frames (PNG)
node shorts/s27-bert-hinkler/render/tools/preview.mjs /tmp/cs --every 1.5 && \
  python3 shorts/s27-bert-hinkler/render/tools/sheet.py /tmp/cs final/contact-sheet.jpg 66
```

Rebuilding the data (scratch dir, not committed):
```bash
python3 render/tools/fetch_tiles.py /tmp/sp      # Tilezen terrain tiles
python3 render/tools/build_basemap.py /tmp/sp    # needs /tmp/sp/mpl_toolkits/basemap_data/bmng.jpg + /tmp/sp/ne/*.geojson
python3 render/tools/build_geo.py /tmp/sp        # needs /tmp/sp/mary_routes.json (s26 escape + return routes)
python3 render/tools/whisper.py && python3 render/tools/make_transcript.py
```

## How the camera works

One eased camera drives two projections at once. A flat Web-Mercator camera shows the basemap layers. An orthographic globe camera shows one of two pre-rendered globes. Each camera key carries a globe weight `g`. Every overlay point is projected through both cameras and mixed by `g`, so routes, pins and stamps morph between the flat map and the globe during dives and pull-outs. The portrait frame cannot show London and Darwin together on a flat map without blank polar bands, so the overview beats use the globe.

## Beat map (seams from `transcript.json`)

| s | VO | Map treatment |
|---|---|---|
| 0.0 | One man… | Frame 1: globe from space, glowing London pin, **15 DAYS** hook already slammed. Camera dives onto London. |
| 1.4 | One tiny open plane | Avro Avian lifts off over London (shadow separates, prop spins). |
| 2.9 | England to Australia… completely alone | Pull-out to the overview globe. A **red dotted route** shoots SE to Darwin; ENGLAND / AUSTRALIA pins. Spotlight on the lone plane. |
| 6.3 | 1928 · Bert Hinkler | **1928** slam → year chip. Whip to Australia. **Real Bert portrait** (SLQ) with BERT HINKLER chip. |
| 9.6 | small Australian town · birds · gliders | Australia coast glow, push to BUNDABERG pin, ibis flock, self-drawing glider blueprint. |
| 15.4 | tries to become one | **Gag 1.** Dive to the Mon Repos dune. A kid with cardboard wings watches birds, hops off, flaps, plops into the sand. |
| 19.5 | nobody this far alone · full crew · 28 days | Globe. The 1919 crew plane (four crew) crawls a white dashed route; DAY counter → **28 DAYS** slam. |
| 27.4 | No autopilot. No co-pilot. Sandwich | **Gag 2.** Close-up over the Libyan coast: robot and co-pilot "no" badges, plane wobbles, sandwich floats out and gets bitten. |
| 32.7 | 7 February · London | Calendar FEB 1928 / 7. Whip to London; take-off; yellow route self-draws. |
| 35.7 | Italy … Indonesia | **Gag 3.** Camera tracks the leading edge. Passport stamps slam on each place, faster and faster, with region glows, Med shimmer, desert heat and the Singapore ring. The calendar ticks 8 → 21 by real stop. **Gag 7a:** the series camel peeks from behind the INDONESIA stamp. |
| 45.4 | 22 February · Darwin | Calendar 22, plane lands, DARWIN pin. |
| 48.2 | 18,000 km · 15 days · almost halved | Overview globe with all stamps, counter to **18,000 KM**, **15 DAYS** slam, 28-vs-15 record bars with the ½ line. |
| 54.3 | Hustling Hinkler | **Gag 4.** A 1920s EXTRA newspaper spins in over Darwin with the real 1928 photo of Bert and his Avian. |
| 57.2 | Give the man a like | **Gag 5.** Vintage red thumbs-up rubber stamp slams onto Darwin. |
| 59.5 | five years later · faster · London · disappears | Calendar flips 1928 → 1933, stopwatch, ghost of the 1928 route, take-off. **Gag 6:** the plane dissolves over France, the route turns grey and the map greys. |
| 65.4 | three months · nobody knows | Months flip JAN → APR; search rings and question marks across France and the Alps. |
| 68.7 | body found · crashed plane · mountain in Italy | Push into Tuscany. A single grey pin on **PRATOMAGNO** and a quiet grey plane silhouette. ITALY outline. No gore. |
| 73.4 | Mussolini · full military honours | BENITO MUSSOLINI name chip, FLORENCE pin, procession line, honour guard, wreath. Soft map, no emoji. |
| 79.1 | the boy… buried in Florence | Real portrait of Bert aged 27 in an oval frame; memorial ring at Florence. |
| 82.8 | other side of the world from home | Pull-out to the globe. Colour returns. Dashed arc Florence → Bundaberg, house icon. |
| 85.3 | episode two of Impossible Journeys | **Gag 7b.** The globe unwraps into the gold-framed master map. Mary Bryant's routes (EP. 1) are shown, and Bert's route turns red as EP. 2. The camel walks in and waves. An EP. 3 "?" slot appears on "next one". |
| 90.0 | All of it started with… | Incomplete loop. Whip back to the frame-1 globe, red dots leave London, **15 DAYS** slams on "with". |
