# Shot plan — s26-mary-bryant (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in the repo episode folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** Skylab photo-underlay slideshow as the main beat language.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km/day** callouts, obstacle cutaways on the map. Secondary: `/workspace/geoarchivez-scripts/raw/vZHLIqiC_Jc.mp4`.
- **Basemap look (locked 2026-10-01):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief** (s24 failure). Thick white borders + bold white labels + drop shadow still fine; yellow km callouts on distance lines.
- Continuous map motion: pans, zooms, **self-drawing Sydney→east coast→GBR→Torres Strait→Arafura→Timor route**, pin drops, Day counter, numeric distance callouts. Camera **always moving**; route never sits dead.
- Photos only as **brief credibility inserts** (Mary/First Fleet soft, Boswell portrait, Pandora wreck colour) — **maps carry the story**.
- Captions ~70%. Extra MG text = labels only (`5,000 KM`, `1791`, `MARY BRYANT`, `SYDNEY`, `GOVERNOR'S BOAT`, `11`, `DAY n`, `GREAT BARRIER REEF`, `TIMOR`, `69 DAYS`, `PANDORA`, `LONDON`, `BOSWELL`, `PARDONED`). No VO-echo titles. Frame-1 hook: **`5,000 KM`**.
- Stage all **seven Visual gags** on the named VO lines — **all on the map**.
- **Series:** Impossible Journeys episode 1 — series camel stowaway on “Eleven people”; final **red route joins master map**.
- **Incomplete loop** mid-phrase into open.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune seams to Whisper when held.
- Australian English (`kilometres`, `Harbour`, humour spelling).
- **Replaces** abandoned `s26-bert-hinkler` (user changed script).

## Hook

- **Primary:** `5,000 KM`
- **Alternates:** `THE GOVERNOR'S BOAT` · `69 DAYS`

## Beat table (skeleton — Claude expands + retunes to Whisper)

| # | VO cue | Mode | Named motion / gag |
|---|---|---|---|
| 1 | mother / toddler / baby / stolen boat / 5,000 km | ANIMATE (map) | Hook slam `5,000 KM`; Sydney Harbour pin; boat tease; camera already drifting |
| 2 | 1791 / Mary Bryant / highway robber / Sydney | ANIMATE (map + brief) | Soft England→Sydney First Fleet arc; chip `MARY BRYANT` · `1791`; brief portrait ≤~1 s OK |
| 3 | colony starving / William / not staying | ANIMATE (map) | Colony pin darkens; soft hunger/state cue on map |
| 4 | steal the governor's boat | ANIMATE (map) | **Gag 1** crown boat “GOVERNOR – DO NOT TOUCH” yanked off harbour pin |
| 5 | moonless night / Sydney Harbour / Eleven people | ANIMATE (map) | Night harbour slip; **Gag 2** head-count 11→12? + **series camel** at stern |
| 6 | sail north / entire east coast | ANIMATE (map) | **Gag 3** starts — boat races north, speed-lines, pin-drops, Day counter |
| 7 | Storms nearly swamp them | ANIMATE (map) | Storm overlay; boat tilts; Day counter continues |
| 8 | GBR squeeze / tip / open sea | ANIMATE (map) | Macro↔micro reef corridor; Torres Strait; Arafura push; **Gag 3** climax |
| 9 | 69 days / Timor / 5,000 km / all alive | ANIMATE (map) | Land pin `TIMOR` / Kupang; chips `69 DAYS` · `5,000 KM`; route completes solid yellow/orange |
| 10 | survivors of a shipwreck / Dutch believe | ANIMATE (map) | **Gag 4** fake sad faces; Dutch flag pin nods |
| 11 | real shipwreck crew / Bounty hunter | ANIMATE (map) | **Gag 5** navy ship sinks reef → lifeboat Timor + **record-scratch** |
| 12 | story falls apart / chains | ANIMATE (map) | **Gag 6** map desaturates; grey return route toward London |
| 13 | baby son / husband / daughter die | ANIMATE (map) | Soft grey markers fade one by one — dignity; no gore |
| 14 | London alone / death sentence | ANIMATE (map) | London pin; sober chip `ALONE` |
| 15 | Boswell / pardoned / money for life | ANIMATE (map + brief) | Warm colour returns; brief Boswell insert ≤~1 s; chip `PARDONED` |
| 16 | like for sheer nerve / CTA | ANIMATE (map) | Soft CTA pulse — keep map alive |
| 17 | episode one of Impossible Journeys | ANIMATE (map) | **Gag 7** red route joins **master map**; series title chip |
| 18 | And it all started with | ANIMATE (map) | Incomplete loop whip to open `5,000 KM` / harbour boat yank |

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Sydney / Port Jackson / Sydney Harbour | Escape night 28 Mar 1791 |
| East coast of Australia (northbound) | Pin-drops / Day counter |
| Great Barrier Reef corridor | Squeeze between reef and coast |
| Tip of Australia / Torres Strait | Round tip → open sea |
| Arafura Sea | Open-sea leg to Timor |
| Timor / Kupang (Koepang) | Land 5 Jun 1791 · ~69 days · ~5,000+ km |
| Great Barrier Reef (Pandora wreck) | HMS Pandora wreck Aug 1791 — Edwards crew to Timor |
| London / Newgate | Return in chains; pardon 1793 |
| Cornwall / Fowey (soft) | Home return after pardon — optional soft pin |

**Route:** thick solid yellow/orange self-drawing escape line + soft drop shadow; camera tracks leading edge. Return = **grey dashed/solid** after arrest. Series join = **red** route onto master map.

## Audio

- `audio/vo.mp3` — **VO file coming**
- Music: Skyline (Eugenio Mininni / Mixkit id **601**)
- Mix: measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- Sparse SFX ~6–10 (whoosh, riser, impact, thud/yank, pin drops, storm, record-scratch, desaturate settle, soft warm resolve)
