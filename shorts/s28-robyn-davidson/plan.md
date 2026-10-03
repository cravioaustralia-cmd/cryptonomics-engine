# Shot plan — s28-robyn-davidson (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in the repo episode folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** a photo slideshow.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km** callouts, obstacle cutaways on the map. Secondary: `/workspace/geoarchivez-scripts/raw/` Pan American Highway sample.
- **Basemap look (locked):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, slight atmospheric edge haze OK, **no blown-out white relief highlights**. Crisp thin white distance lines with arrowheads; bold white labels + drop shadow; yellow km callouts.
- Continuous map motion: pans, zooms, **self-drawing Alice Springs → west past Uluru → deep desert → Indian Ocean west coast**, camel-line icons, dynamic region highlights. Camera **always moving**; route never sits dead.
- **First frame (user):** 3D terrain of Australia’s red centre; four camel icons and one person icon march west across rippling dunes; Indian Ocean glowing at the far edge. Hook card **`2,700 km, FOUR camels`** (frame 1 only; never spoken).
- Photos only as **brief credibility inserts** — **maps carry the story**.
- **IMAGE LOCK:** Always try a **real free-licence photo of Robyn Davidson**. **None was found** on Wikimedia Commons at scaffold (3 Oct 2026). Do **not** invent one, do **not** use National Geographic / Getty / Rick Smolan trek scans, and do **not** fall back to emoji, pictogram-only, or a name-chip stand-in pretending to be her portrait. Until a free-licence portrait is verified, keep her as the map’s person icon plus route — not a fake face. A free-licence **Rick Smolan** portrait (2009, not a trek photo) is in `images/` for the photographer beat. No AI historical stills.
- Captions ~70% (lower-middle). Extra MG text = labels only (`2,700 km`, `FOUR CAMELS`, `1977`, `ROBYN DAVIDSON`, `ALICE SPRINGS`, `ULURU`, `INDIAN OCEAN`, `WEST COAST`). No VO-echo titles. Frame-1 hook: **`2,700 km, FOUR camels`**.
- Stage all **six Visual gags** on the named VO lines — **all on the map**. Keep gag timing tight to the spoken words.
- **Series:** Impossible Journeys **episode 4** — series camel walks at the **back** of her camel line; at “That’s episode four…” the **red route joins the master map**.
- **Incomplete loop** mid-phrase into the open (red-centre march west, Indian Ocean glowing).
- **Atlas VO:** **PENDING** → `audio/vo.mp3`. Video Production seats Atlas before the user pastes. Do not invent timings before VO lands.
- Australian English (`kilometres`, `Rumours`, humour spelling).
- **Dignity:** Aboriginal elder beat — no sacred art or symbols, no caricature. Dog-shooting beat — desaturate + music drop only; do **not** show the shooting, blood, or a gun close-up.

## Hook

- **Primary (frame 1 only, never spoken):** `2,700 km, FOUR camels`

## Beat table (skeleton — Claude expands + retunes to Whisper once VO is held)

| # | VO cue | Mode | Named motion / gag |
|---|---|---|---|
| 1 | One woman / four camels / 2,700 km of desert | ANIMATE (map) | **First frame** red-centre march west; four camel icons + one person icon; Indian Ocean glowing at the far edge; unspoken hook `2,700 km, FOUR camels`; camera already drifting |
| 2 | 1977 / Robyn Davidson / Alice Springs / walk west to the ocean | ANIMATE (map + brief) | Pin `ALICE SPRINGS`; chip `ROBYN DAVIDSON` · `1977`; real portrait **only if** a free-licence photo is later verified — otherwise no face stand-in |
| 3 | no camels / no idea how to handle them | ANIMATE (map) | Empty camel-line slots; Alice Springs holds |
| 4 | bite, kick, spit / have opinions | ANIMATE (map) | **Gag 1** one camel icon turns to camera, slow side-eye |
| 5 | about two years / camel handlers / training wild camels | ANIMATE (map) | Time chip `~2 YEARS` over Alice Springs; wild-camel icons join the line |
| 6 | needs money / National Geographic / photographer along the way | ANIMATE (map + brief) | Soft chip `NATIONAL GEOGRAPHIC`; **real Rick Smolan still** (2009 free portrait, not a trek photo) ≤~1–1.5 s if used |
| 7 | wants to be alone / keeps turning up / in the desert | ANIMATE (map) | **Gag 2** camera icon whack-a-mole along the route; “click!” flash each pop |
| 8 | walks west / past Uluru / deep into the desert | ANIMATE (map) | Self-drawing route west; Uluru region highlight; yellow km callout; brief Uluru still optional |
| 9 | local Aboriginal language / elder walks part of the way | ANIMATE (map) | Dignity: a second person icon joins **part** of the route only, then leaves. No sacred art, no caricature, no name-chip costume |
| 10 | rumours she’s lost / journalists hunting | ANIMATE (map) | Tension; empty desert; her dot small |
| 11 | search party of reporters | ANIMATE (map) | **Gag 3** dozens of tiny press-car icons swarm toward her dot; the dot edges away |
| 12 | Then disaster / dog / poison bait / shoot him | ANIMATE (map) | **Gag 4** map desaturates; **music drops out**. No blood, no gun, no body. Hold the grey map |
| 13 | nine months / leads camels down to the ocean / west coast | ANIMATE (map) | Colour returns as the coast approaches; pin `INDIAN OCEAN` / `WEST COAST`; sourced Hamelin Pool pin allowed (see geography) but **do not speak** a town the VO does not say |
| 14 | wade into the sea / never seen that much water | ANIMATE (map) | **Gag 5** camera swoops to the coast; four camel icons step into blue water; big splash ripple |
| 15 | give those camels a like | ANIMATE (map) | Warm; like prompt stays a caption/MG, not a VO-echo title card |
| 16 | episode four of Impossible Journeys | ANIMATE (map) | **Gag 6** series camel (already at the back of the line) — red route joins the **master map** |
| 17 | All of it, for | ANIMATE (map) | Incomplete loop → red-centre march west / Indian Ocean glowing / hook card |

**Maps carry the story.** Photos only as brief credibility inserts. Camera never static; new visual stimulus ~every 1.5–2 s.

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Alice Springs, NT | Arrival and camel training. VO: “a town in the very middle of Australia.” |
| West across the red centre | Self-drawing route. Simpson Desert dune still is a **red-centre texture reference only** — the Simpson lies east/south-east of Alice and is **not** her westbound track. Do not pin the route through the Simpson. |
| Uluru (Ayers Rock), NT | VO says she walks past it. Route guides put Ayers Rock on the 1977 track. PASS-SOFT — do not move the rock. |
| Desert west of Uluru | Gibson Desert country is the historical crossing. Do not invent extra towns in the spoken line. |
| Aboriginal elder, part of the way | Sources name a Pitjantjatjara man, Mr Eddie, from the Docker River area toward Warburton. **Do not add his name to the VO.** On screen: a quiet companion icon for part of the route only. No sacred sites, art, or symbols. |
| Australia’s west coast / Indian Ocean | VO words for the end. |
| Hamelin Pool, Shark Bay, WA | **Sourced end, not spoken.** National Portrait Gallery of Australia record 2014.9 titles the arrival photograph “Robyn Davidson (Hamelin Pool, Indian Ocean, Western Australia)” and says the trek was to Shark Bay. A map pin is allowed. **Not** Hamelin Bay (south-west WA — a different place) and **not** Steep Point unless a source actually says that. |

**Route:** thick solid yellow/orange self-drawing Alice Springs → west line + soft drop shadow; camera tracks the leading edge. Crisp thin white distance lines with arrowheads for km callouts. First-frame tease can be the marching icons over dunes with the ocean already glowing. Disaster beat = **desaturated**. Series join = **red** onto the master map. Four camel icons + person; series camel at the **back**.

## Audio

- `audio/vo.mp3` — **PENDING** Atlas en-AU. Video Production seats it before paste. Do not overwrite a file that appears later.
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) — same Impossible Journeys bed as s26 Mary Bryant and s27 Bert Hinkler. Seat ~**4 dB quieter** than the s18 Silent Descent original bed under VO. **On gag 4 (“Then disaster”) the music drops out.**
- Mix: measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- Sparse SFX ~6–10 (camel-line whoosh, one side-eye accent, camera clicks under the whack-a-mole, a low swarm for the press cars, a single splash). **No gunshot.** VO-only stretches are required. Cut dense whoosh/pop chatter.
