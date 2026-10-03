# Shot plan — s29-darwin-stuck (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in the repo episode folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** a photo slideshow.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km** callouts, obstacle cutaways on the map. Secondary: `/workspace/geoarchivez-scripts/raw/` Pan American Highway sample.
- **Basemap look (locked):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, slight atmospheric edge haze OK, **no blown-out white relief highlights**. Crisp thin white distance lines with arrowheads; bold white labels + drop shadow; yellow km callouts.
- Continuous map motion: pans, zooms, **self-drawing Darwin ↔ Birdum railway**, southern Alice Springs stub, **1,000 km gap** highlight, desert south of Darwin, supply-line dashed arc back toward Japan. Camera **always moving**; route never sits dead.
- **First frame:** northern Australia / Darwin region; Japanese intent arrow teasing Darwin; desert south hinted; unspoken hook **`ROAD TO NOWHERE`**.
- Photos only as **brief credibility inserts** — **maps carry the story**. **No named person who needs a portrait.** No emoji. No AI historical stills.
- Captions ~70% (lower-middle). Extra MG text = labels only (`DARWIN`, `BIRDUM`, `ALICE SPRINGS`, `1942`, `~1,000 km`, `SCENARIO 1`). No VO-echo titles. Frame-1 hook: **`ROAD TO NOWHERE`**.
- Stage all **six Visual gags** on the named VO lines — **all on the map**. Keep gag timing tight to the spoken words.
- **Teaser for lf01** — end card / gag 6 points **down** to the YouTube Related-video area. **Do not invent a YouTube URL.** Do not upload.
- **Button loop:** spoken `Because remember:` → open hook. Say that in the whip-back.
- **Atlas VO:** **PENDING** → `audio/vo.mp3`. Video Production seats Atlas before the user pastes. Do not invent timings before VO lands. Do **not** record a new VO.
- Australian English. On-screen spelling: **Birdum**, **Darwin**, **Alice Springs**. Do not rewrite the spoken words.

## Hook

- **Primary (frame 1 only, never spoken):** `ROAD TO NOWHERE`
- **Alternates:** `STILL STUCK` · `BIRDUM`

## Beat table (skeleton — Claude expands + retunes to Whisper once VO is held)

| # | VO cue | Mode | Named motion / gag |
|---|---|---|---|
| 1 | Japan could have captured Darwin / still been stuck | ANIMATE (map) | **First frame** Darwin tease; Japanese intent arrow; unspoken hook `ROAD TO NOWHERE`; camera already drifting |
| 2 | Blame the map | ANIMATE (map) | **Gag 1** map shrugs — edges curl like shoulders |
| 3 | admirals / northern Australia / Darwin bombed / people gone | ANIMATE (map) | Northern Australia highlight; Darwin pin; soft `1942` chip; empty town cue (not a portrait) |
| 4 | landing there? Probably possible | ANIMATE (map) | Landing-arrow / beach pin at Darwin; tense hold |
| 5 | But then look south | ANIMATE (map) | Camera whip / pull south across the continent |
| 6 | Thousands of kilometres of desert / cities | ANIMATE (map) | Desert region glow; yellow km callout; distant southern city pins (no VO-echo title) |
| 7 | railway from Darwin / Birdum / Alice Springs | ANIMATE (map) | **Gag 2** railway lines self-draw and **stop**; “dead end” road sign pops at **Birdum**; pin `ALICE SPRINGS` on southern stub |
| 8 | no railway at all | ANIMATE (map) | **Gag 3** tiny train icon chugs out of Birdum, hits end of track, stops; **sad horn toot** SFX |
| 9 | road to nowhere | ANIMATE (map) | **Gag 4** single cartoon tumbleweed rolls across the ~1,000 km gap; yellow `~1,000 km` callout |
| 10 | generals saw the trap / stranded / supply lines / said no | ANIMATE (map) | Stranded-army icon in the north; dashed supply line stretching toward Japan; soft “NO” stamp / reject cue (not a portrait) |
| 11 | scenario one / even wilder | ANIMATE (map) | Soft `SCENARIO 1` chip; **Gag 5** glowing envelopes labelled **2** and **3** bounce in a safe corner (clear of captions + YT UI) |
| 12 | full video’s linked right here | ANIMATE (map) | **Gag 6** animated arrow points **down** to Related-video area at bottom. **No invented URL.** |
| 13 | Because remember: | ANIMATE (map) | Button loop → first-frame Darwin / stuck / `ROAD TO NOWHERE` |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s.

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Darwin, NT | Northern port; Feb 1942 bombing already happened in the story beat. Pin on the harbour / town. |
| Birdum, NT | Historical southern terminus of the North Australia Railway (Darwin line). Dead-end sign here. Spelling: **Birdum**. |
| Alice Springs, NT | Southern railway stub end (Central Australian Railway). Do not invent a through-line that did not exist in 1942. |
| ~1,000 km gap | Roughly Birdum ↔ Alice Springs with **no railway** in 1942. Yellow km callout on the gap. |
| Southern cities | Distant pins only (e.g. Adelaide / Melbourne / Sydney energy) — do not invent false rail links. |
| Japan / supply lines | Dashed long-range supply intent back toward Japan — schematic, not a fake fleet photo. |

**Route language:** thick solid yellow/orange self-drawing rail stubs + soft drop shadow; crisp thin white distance lines with arrowheads across the gap; dashed supply arc for the trap beat.

## Audio

- `audio/vo.mp3` — **PENDING** Atlas en-AU. Video Production seats it before paste. Do not overwrite a file that appears later. **Do not record a new VO.**
- Music: **Silent Descent** (Eugenio Mininni / Mixkit id **614**) — already in repo from s18 Darwin Closer; seated here as the tense map-explainer bed. **Not** Mixkit Skyline 601 (this is an lf01 teaser, not Impossible Journeys). Seat ~**4 dB quieter** than the s18 original Silent Descent bed level under VO before master loudnorm.
- Mix: measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS / true peak ≤ −1.5 dBTP. Do **not** use a one-pass mix that flattens the voice.
- Sparse SFX ~6–10 (map-shrug, rail draw / dead-end pop, **sad horn toot**, tumbleweed roll, envelope bounce, end-card arrow). Clearly under VO. VO-only stretches required. Cut dense whoosh/pop chatter. Shared kit is in `sfx/`; if no horn file fits, Claude may add **one** Mixkit-free train-horn toot and credit it in `sfx/sources.tsv`.
