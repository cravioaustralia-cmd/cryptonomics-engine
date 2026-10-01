# Shot plan — s27-bert-hinkler (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in the repo episode folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** Skylab photo-underlay slideshow as the main beat language.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km/day** callouts, obstacle cutaways on the map. Secondary: `/workspace/geoarchivez-scripts/raw/vZHLIqiC_Jc.mp4`.
- **Basemap look (locked 2026-10-01):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief** (s24 failure). Thick white borders + bold white labels + drop shadow still fine; yellow km callouts on distance lines.
- Continuous map motion: pans, zooms, **self-drawing London→Italy→Med→North Africa→Middle East→India→Burma→Singapore→Indonesia→Darwin route**, passport stamp pin-drops, numeric distance callouts. Camera **always moving**; route never sits dead.
- **First frame (user):** Camera dives from space onto London; tiny biplane icon lifts off; red dotted route shoots south-east across the globe toward Australia. Hook card **`15 DAYS`**.
- Photos only as **brief credibility inserts** — **maps carry the story**.
- **IMAGE LOCK (CRITICAL — user locked 2026-10-01):** Always use a **real free-licence photo/portrait of Bert Hinkler** — NEVER emoji, pictogram-only, or name-chip stand-ins when a real image can be sourced. Require **at least one real Bert portrait insert** (and Avro Avian plane photo if licence-clean). Mussolini / Florence funeral: period free stills if available, else soft map treatment — **not emoji**. No AI historical stills. Document in `SOURCES.md` / `images/SOURCES.md`.
- Captions ~70%. Extra MG text = labels only (`15 DAYS`, `18,000 KM`, `BERT HINKLER`, `1928`, `LONDON`, `ITALY`, `DARWIN`, `HUSTLING HINKLER`, `FLORENCE`). No VO-echo titles. Frame-1 hook: **`15 DAYS`**.
- Stage all **seven Visual gags** on the named VO lines — **all on the map**.
- **Series:** Impossible Journeys episode 2 — series camel hidden among passport stamps; final **red route joins master map**.
- **Incomplete loop** mid-phrase into open (space dive / `15 DAYS` / London biplane).
- **Atlas VO:** **held** → `audio/vo.mp3` (**91.25 s**, Atlas en-AU). Whisper-retune seams to the held recording.
- Australian English (`kilometres`, humour spelling).
- **Do not reuse** abandoned `s26-bert-hinkler` (ABANDONED markers stay).

## Hook

- **Primary:** `15 DAYS`
- **Alternates:** `18,000 KM` · `HUSTLING HINKLER`

## Beat table (skeleton — Claude expands + retunes to Whisper)

| # | VO cue | Mode | Named motion / gag |
|---|---|---|---|
| 1 | One man / tiny open plane / England to Australia | ANIMATE (map) | **First-frame dive** space→London; biplane lifts; red dotted SE route; hook slam `15 DAYS`; camera already drifting |
| 2 | 1928 / Bert Hinkler / small Australian town / birds / gliders | ANIMATE (map + brief) | Soft Australia pin; chip `BERT HINKLER` · `1928`; **mandatory real Bert portrait** ≤~1–1.5 s |
| 3 | tries to become one | ANIMATE (map) | **Gag 1** zoom Bundaberg; cardboard-wings figure hops sand dune |
| 4 | nobody flown this far alone / 28 days | ANIMATE (map) | Globe scale / prior-record chip `28 DAYS`; tension |
| 5 | eats a sandwich | ANIMATE (map) | **Gag 2** plane wobbles mid-route; sandwich floats |
| 6 | 7 February / takes off from London | ANIMATE (map) | London pin; biplane lifts; route head starts solid/yellow self-draw |
| 7 | Italy / Mediterranean / North Africa | ANIMATE (map) | **Gag 3** passport stamps slam (accelerating) on each place |
| 8 | Middle East deserts / India | ANIMATE (map) | **Gag 3** continues — stamps faster |
| 9 | Burma / Singapore / Indonesia islands | ANIMATE (map) | **Gag 3** climax; **Gag 7** series camel peek among stamps |
| 10 | 22 February / Darwin / 18,000 km / 15 days | ANIMATE (map) | Land pin `DARWIN`; chips `18,000 KM` · `15 DAYS`; route completes |
| 11 | almost halved / Hustling Hinkler | ANIMATE (map) | **Gag 4** 1920s newspaper label pops over Darwin |
| 12 | Give the man a like | ANIMATE (map) | **Gag 5** vintage thumbs-up stamp on Darwin |
| 13 | five years later / disappears | ANIMATE (map) | **Gag 6** plane vanishes over Europe; map greys |
| 14 | three months / body / crashed plane / mountain in Italy | ANIMATE (map) | **Gag 6** single pin Pratomagno / Tuscany; dignity — no gore |
| 15 | Mussolini / funeral / full military honours | ANIMATE (map + brief) | Florence soft pin; period free still if available else soft map — **not emoji** |
| 16 | buried in Florence / other side of the world | ANIMATE (map) | Florence burial pin; home↔Florence distance feel |
| 17 | episode two of Impossible Journeys | ANIMATE (map) | **Gag 7** red route joins **master map**; series title chip |
| 18 | All of it started with | ANIMATE (map) | Incomplete loop whip → space dive / `15 DAYS` / London biplane lift |

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| London / Croydon (PASS-SOFT “London”) | Take-off 7 Feb 1928 |
| Italy | Early route stamp |
| Mediterranean | Overflight |
| North Africa | Coast / desert approach |
| Middle East deserts | Route beat |
| India | Route beat |
| Burma (historical name OK; soft Myanmar) | Route beat |
| Singapore | Route beat |
| Islands of today’s Indonesia (1928 Dutch East Indies) | Archipelago leg |
| Darwin, NT | Land 22 Feb 1928 · ~18,000 km · ~15 days |
| Bundaberg, QLD | Childhood / gag 1 only |
| Pratomagno / Tuscany mountains (near Arezzo) | 1933 crash |
| Florence | Burial (Cimitero degli Allori); Mussolini military honours |

**Route:** thick solid yellow/orange self-drawing England→Australia line + soft drop shadow; camera tracks leading edge. First-frame tease = **red dotted**. Disappear / crash = **grey**. Series join = **red** onto master map.

## Audio

- `audio/vo.mp3` — **VO held** (Atlas en-AU, **91.25 s**); source `/workspace/deliverables/s27-bert-hinkler/vo-raw/vo-atlas.mp3`
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) — same Impossible Journeys bed as s26 Mary Bryant
- Mix: measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- Sparse SFX ~6–10 (whoosh, riser, impact/stamp thunks accelerating, paper rustle, newspaper pop, soft grey settle, warm resolve)
