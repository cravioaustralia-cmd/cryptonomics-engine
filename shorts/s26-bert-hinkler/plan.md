# Shot plan — s26-bert-hinkler (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in the repo episode folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** Skylab photo-underlay slideshow as the main beat language.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km/day** callouts, obstacle cutaways on the map. Secondary: `/workspace/geoarchivez-scripts/raw/vZHLIqiC_Jc.mp4`.
- **Basemap look (locked 2026-10-01):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief** (s24 failure). Thick white borders + bold white labels + drop shadow still fine; yellow km callouts on distance lines.
- Continuous map motion: pans, zooms, **self-drawing London→Italy→Med→North Africa→Middle East→India→Burma→Singapore→Indonesia→Darwin route**, pin drops, passport-stamp beats, numeric distance/day callouts. Camera **always moving**; route never sits dead.
- Photos only as **brief credibility inserts** (Hinkler portrait, Avro Avian, Darwin welcome, Florence grave) — **maps carry the story**.
- Captions ~70%. Extra MG text = labels only (`15 DAYS`, `1928`, `BERT HINKLER`, `LONDON`, `ITALY`, `INDIA`, `BURMA`, `SINGAPORE`, `DARWIN`, `18,000 KM`, `HUSTLING HINKLER`, `FLORENCE`). No VO-echo titles. Frame-1 hook: **`15 DAYS`**.
- Stage all **five Visual gags** on the named VO lines.
- **Incomplete loop** mid-phrase into open.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune seams to Whisper when held.
- Australian English (`kilometres`, humour spelling).

## Hook

- **Primary:** `15 DAYS`
- **Alternates:** `HUSTLING HINKLER` · `1928`

## Beat table (skeleton — Claude expands + retunes to Whisper)

| # | VO cue | Mode | Named motion / gag |
|---|---|---|---|
| 1 | Open alone / England→Australia | ANIMATE (map) | Hook slam `15 DAYS`; route tease; camera already drifting |
| 2 | Bert Hinkler / small town / birds + gliders | ANIMATE (map + brief insert) | Pin Bundaberg soft; brief portrait ≤~1 s; chip `BERT HINKLER` |
| 3 | tries to become one | ANIMATE | **Gag 1** cardboard wings / sand dune |
| 4 | Nobody… alone / 28 days | ANIMATE (map) | Full-route ghost; soft `28 DAYS` crew record chip |
| 5 | No autopilot… sandwich | ANIMATE (map) | **Gag 2** plane wobble + floating sandwich |
| 6 | 7 February / London | ANIMATE (map) | Pin `LONDON` / Croydon; route starts self-drawing |
| 7 | Italy / Med / North Africa | ANIMATE (map) | **Gag 3** passport stamps (Italy… N. Africa) — thud, accelerating |
| 8 | Middle East… India | ANIMATE (map) | **Gag 3** continues (India stamp); desert region glow |
| 9 | Burma / Singapore / Indonesia | ANIMATE (map) | **Gag 3** fastest stamps; island hop; soft `INDONESIA` |
| 10 | 22 February / Darwin / 18,000 km / 15 days | ANIMATE (map) | Land Darwin; chips `DARWIN` · `18,000 KM` · `15 DAYS` |
| 11 | Halved record / Hustling Hinkler | ANIMATE | **Gag 4** spinning 1920s newspaper headline |
| 12 | Five years later… disappears | ANIMATE (map) | **Gag 5** plane vanishes; stamps fade; map grey + quiet |
| 13 | Three months / body / mountain Italy | ANIMATE (map) | Soft Pratomagno / Arezzo pin; sober discovery beat |
| 14 | Mussolini / full military honours | ANIMATE (map + brief) | Soft Florence pin; honour tone — no slapstick |
| 15 | Buried Florence / other side of world | ANIMATE (map) | Florence ↔ Bundaberg distance callout; soft home pin |
| 16 | All of it, because in 1928, | ANIMATE (map) | Incomplete loop whip to open `15 DAYS` / London route-head |

## Audio

- `audio/vo.mp3` — **VO file coming**
- Music: Drawing The Sky (Eugenio Mininni / Mixkit id **606**)
- Mix: measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- Sparse SFX ~6–10 (whoosh, riser, impact, stamp thuds, paper, newspaper spin)
