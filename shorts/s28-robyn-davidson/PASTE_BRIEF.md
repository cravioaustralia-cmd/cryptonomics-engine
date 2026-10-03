# s28 Robyn Davidson — Claude Code brief (paste-ready)

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `shorts/s28-robyn-davidson/`  
Branch: `scaffold/s28-robyn-davidson`  
Mode: **MAP EXPLAINER** (kinetic cartography primary) — **NOT** a photo slideshow.  
Series: **Impossible Journeys — episode 4** (s26 Mary Bryant was ep.1; s27 Bert Hinkler was ep.2). This short is **s28**, and the series label stays **episode 4** even though the short number is not 29. Do not renumber it to episode 3. There is no episode-3 folder in the repo yet.

**Australian English** in all spelled facts and on-screen labels.

**Handoff:** the user pastes this file into Claude Code. Do **not** post a GitHub comment that summons Claude. The user pastes this file into Claude Code themselves.

**VO:** Atlas en-AU is **PENDING** at `audio/vo.mp3`. Video Production will seat Atlas VO **before** the user pastes. If `audio/vo.mp3` is already there when you start, do not overwrite it. Whisper-retune seams to the held recording. Do not invent timings before it lands.

---

## Goal

Design, animate, mix and render History Short **s28 Robyn Davidson** (1977 camel walk, Alice Springs to the Indian Ocean) at best quality — exceed prior Shorts. Claude owns `scenes.js`. Production never hand-designs scenes. **Do not upload to YouTube. Do not merge the PR.**

---

## MAP EXPLAINER — standing quality bar (locked)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km/year callouts, obstacle cutaways on the map (Darién-style). **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.

Read also: `shorts/s28-robyn-davidson/MAP_EXPLAINER_MODE.md` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

Map quality, in full: rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, **NO blown-out white relief highlights** on terrain, slight atmospheric edge haze OK, crisp thin white distance lines with arrowheads, bold white labels + drop shadow, yellow km callouts.

---

## Stack (non-negotiable)

- Vertical **1080×1920 @ 30 fps**
- **SVG + `renderFrame(t)` + Playwright + ffmpeg ONLY**
- **No Remotion** (no Remotion CLI, no `src/episodes` compositions)
- Reuse `shorts/shared/render/`; put episode scenes in `shorts/s28-robyn-davidson/render/scenes.js`
- **Do not write placeholder / basic SVG** — design at best quality from the start
- Captions lower-middle ~70%; no VO-echo title cards
- Hook card **frame 1 only**: `2,700 km, FOUR camels` — **NEVER spoken**
- Sparse intentional SFX ~**6–10**, clearly under VO, with VO-only stretches. Cut dense whoosh/pop chatter
- Mix: measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm** master only ~**−14 LUFS**

---

## Hook (on-screen only — never spoken)

**Frame-1 hook card:** `2,700 km, FOUR camels`

One strong hook slam on frame 1. **Not** a VO-echo title restating the opening sentence.

### First frame (user — locked)

A 3D terrain map of Australia’s red centre: four camel icons and one person icon march west across rippling dunes, with the Indian Ocean glowing at the far edge of the map.

---

## Full spoken script (Atlas VO)

Emotion cues in `()` are **performance only — never spoken**. Do not add facts. Do not change these words.

(fast, amazed) One woman. Four camels. 2,700 kilometres of desert.

(storytelling) 1977. Her name is Robyn Davidson. She arrives in Alice Springs, a town in the very middle of Australia, with one plan: walk west until she reaches the ocean.

(sly) One problem. She has no camels. And no idea how to handle them.

(deadpan) Camels bite, kick, spit… and have opinions.

(fast) So she spends about two years learning from camel handlers, and training wild camels herself.

(tense) She needs money. National Geographic agrees to pay, on one condition: a photographer will meet her along the way.

(amused) She wants to be alone in the desert. The photographer keeps turning up. In the desert.

(fast) Then she walks. West, past Uluru, the giant red rock, and deep into the desert.

(serious) She learns some of the local Aboriginal language, and an Aboriginal elder walks part of the way with her.

(tense) Rumours spread that she’s lost. Journalists start hunting for her.

(deadpan) Exactly what someone who wants to be alone needs: a search party of reporters.

(dark, slower) Then disaster. Her dog eats poison bait. To end his suffering, she has to shoot him herself.

(awed) Nine months after she set off, she leads her camels down to the ocean, on Australia’s west coast.

(twist, awed) And they wade into the sea. Camels that had never seen that much water in their lives.

(warm) If that made you smile, give those camels a like. They walked a long way for it.

(warm) That’s episode four of Impossible Journeys. Follow along for the next one.

(loop) All of it, for

**Spoken word count:** 250 (excl. emotion cues).  
**Incomplete loop:** closing mid-phrase bridges into the open. The camera should be set up so the first frame can loop:

`…All of it, for` → *[match-cut on red-centre march west / Indian Ocean glowing / `2,700 km, FOUR camels`]* → `One woman. Four camels…`

---

## Visual gags (must stage — all on the map)

1. **On “have opinions”** — one camel icon turns toward the camera with a slow side-eye.
2. **On “keeps turning up”** — a camera icon pops up at random points along her route like whack-a-mole, with a “click!” flash each time.
3. **On “search party of reporters”** — dozens of tiny press-car icons swarm across the empty map toward her dot, which edges away.
4. **On “Then disaster”** — the map desaturates and the **music drops out**.
5. **On the final line (wade into the sea)** — the camera swoops to the coast as four camel icons step into blue water with a big splash ripple.
6. **Series camel** walks at the **back** of her camel line. At the series line (“That’s episode four…”), the route joins the Impossible Journeys **master map**.

Humour lock: deadpan true details are funny alone; **stage these visual gags** on the named lines (vector/MG overlays on the map). Keep gag timing tight to the spoken words. Side-eye, camera pops, press cars, and the splash are gag colour — never present the icons as historical photographs.

### Dignity (locked)

- **Aboriginal elder beat** — no sacred art or symbols, no caricature. A quiet second person icon may walk part of the route and then leave. Do not costume them. Do not depict ceremony.
- **Dog-shooting beat** — do **NOT** show graphic violence or the shooting. Desaturate + music drop only. No blood. No gun close-up. No body.

---

## Beat plan (ANIMATE vs STILL)

Approximate seams — **retune to Whisper** once Atlas VO is held at `audio/vo.mp3`. Target ~105–125 s for ~250 words. Do not lock frame counts before the recording exists.

| # | Beat (VO cue) | Mode | Treatment |
|---|---|---|---|
| 1 | One woman / four camels / 2,700 km | ANIMATE (map) | **First-frame** red-centre march west; four camels + one person; Indian Ocean glowing; unspoken `2,700 km, FOUR camels`; camera already drifting |
| 2 | 1977 / Robyn Davidson / Alice Springs / walk west to the ocean | ANIMATE (map + brief) | Pin `ALICE SPRINGS`; chips `ROBYN DAVIDSON` · `1977`. Real portrait **only** if a free-licence photo is verified — none is in this scaffold |
| 3 | no camels / no idea how to handle them | ANIMATE (map) | Empty line; Alice holds |
| 4 | bite, kick, spit / have opinions | ANIMATE (map) | **Gag 1** slow side-eye |
| 5 | about two years / handlers / wild camels | ANIMATE (map) | Chip `~2 YEARS`; camel icons join |
| 6 | money / National Geographic / photographer | ANIMATE (map + brief) | Chip `NATIONAL GEOGRAPHIC`; optional brief **Rick Smolan** free portrait (2009, not a trek photo) |
| 7 | alone / keeps turning up | ANIMATE (map) | **Gag 2** camera whack-a-mole + click flashes |
| 8 | walks west / Uluru / deep desert | ANIMATE (map) | Self-drawing route; Uluru highlight; yellow km callout |
| 9 | Aboriginal language / elder part of the way | ANIMATE (map) | Dignity companion icon, part-route only |
| 10 | rumours lost / journalists hunting | ANIMATE (map) | Empty map; her dot small |
| 11 | search party of reporters | ANIMATE (map) | **Gag 3** press-car swarm; dot edges away |
| 12 | Then disaster / dog / poison bait / shoot | ANIMATE (map) | **Gag 4** desaturate; music out; no violence |
| 13 | nine months / ocean / west coast | ANIMATE (map) | Colour returns; `INDIAN OCEAN` · `WEST COAST`. Sourced Hamelin Pool pin allowed; **do not speak it** |
| 14 | wade into the sea | ANIMATE (map) | **Gag 5** swoop; four camels into blue water; splash ripple |
| 15 | give those camels a like | ANIMATE (map) | Warm; no VO-echo title |
| 16 | episode four of Impossible Journeys | ANIMATE (map) | **Gag 6** series camel already at the back; red route joins **master map** |
| 17 | All of it, for | ANIMATE (map) | Incomplete loop → first frame |

**Maps carry the story.** Photos only as brief credibility inserts. Camera never static; new visual stimulus ~every 1.5–2 s.

### Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Alice Springs, NT | Training and departure town. VO: “very middle of Australia.” |
| Uluru, NT | VO: she walks past “the giant red rock.” Do not relocate it. |
| Desert west of Uluru | The historical crossing is west (Gibson Desert country). Do not route her through the Simpson Desert. The Simpson dune still is texture reference only. |
| Elder, part of the way | Background only (not spoken): sources name Mr Eddie, a Pitjantjatjara man, Docker River area toward Warburton. No sacred art. |
| West coast / Indian Ocean | What the VO says. |
| Hamelin Pool, Shark Bay, WA | Sourced end point, **not** in the spoken script. National Portrait Gallery of Australia, record 2014.9. Not Hamelin Bay. Not Steep Point. |

**Route:** thick solid yellow/orange self-drawing line + soft drop shadow; camera tracks the leading edge. Disaster = desaturated, music out. Series join = **red** onto the master map.

---

## Asset notes (free licence only → `images/SOURCES.md`)

- **Robyn Davidson portrait:** searched Wikimedia Commons 3 Oct 2026 — **no free-licence photo found**. Period trek pictures are Rick Smolan / National Geographic / Getty. **Do not download magazine scans.** Do not use emoji or a name-chip as her face. If you later verify a free-licence portrait, document it and insert it briefly.
- **Rick Smolan:** free-licence portrait **does** exist (`images/s28_02_rick_smolan_macworld_2009.jpg`, CC BY-SA 3.0, Macworld 2009). It is **not** a 1977 trek photo. Use only as a brief credibility insert. Do not crop in copyrighted NatGeo frames.
- Alice Springs, Uluru, NT desert camels, Simpson red-centre dunes (not on her route), Hamelin Pool / Shark Bay shore — already in `images/`. See `SOURCES.md`.
- Uluru still: landscape only, no rock art. Commons file carries an extra Australian Commonwealth-reserve commercial-use caveat (EPBC regs) beyond the CC licence — read `images/SOURCES.md` before relying on it in a monetised upload.
- Satellite/topo basemap canvas (GeoGlobeTales quality — no blown white relief).
- Series camel = **vector MG** (not a photo).

Document every still in `SOURCES.md` / `images/SOURCES.md`.

---

## Style locks (verbatim)

- **Atlas VO:** fast amazed → storytelling → sly/deadpan → tense → dark slower → awed → warm series close; start instantly; never speak `()` cues; never speak the hook; **VO PENDING** (Atlas en-AU; Video Production seats `audio/vo.mp3` before paste; Whisper-retune after)
- **Captions** lower-middle ~70%; no VO-echo big titles; labels for names/places/facts only
- **Sparse intentional SFX** ~6–10, clearly under VO, VO-only stretches; cut dense whoosh/pop chatter
- **Music:** Mixkit Skyline id 601, seated ~4 dB quieter than the s18 bed under VO (same as other Impossible Journeys). On gag 4, music drops out
- **Mix:** measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- **Humour:** deadpan true details; stage the visual gags listed; keep gag timing tight to the spoken words
- **Dignity:** Aboriginal elder beat — no sacred art/symbols, no caricature. Dog-shooting beat: do NOT show graphic violence or the shooting. Desaturate + music drop only; no blood, no gun close-up
- **Images:** ALWAYS try a real free-licence photo of Robyn Davidson (and other named people). NEVER emoji, pictogram-only, or name-chip stand-ins when a real image can be sourced. No AI historical stills. None was sourced for Robyn at scaffold — do not fake one
- **MAP EXPLAINER primary** — maps carry the story; photos brief inserts only
- **Basemap:** GeoGlobeTales quality — rich satellite, soft lighting, **NO blown white relief**
- **Motion:** GeoArchivez continuous self-drawing route + always-moving camera; first frame is the red-centre march west with the Indian Ocean glowing
- **Series:** Impossible Journeys ep.4 — series camel at the back of her line + master-map join
- **Quality:** Claude designs at best quality; exceed prior Shorts
- **Incomplete loop** into the open as the script ends mid-phrase
- **Claude handoff:** paste this brief only. Do not summon Claude from the GitHub issue.

---

## Mix / SFX / captions locks

- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) already in `audio/music.mp3` — same Impossible Journeys bed as s26 Mary and s27 Bert. Seat safely under VO (~**4 dB quieter** than s18 Silent Descent original bed) before master loudnorm. **Drop the bed out on “Then disaster”** and keep it out through the dog beat; bring it back only as the coast returns, or later if the picture needs the silence held.
- SFX: ~6–10 intentional cues that earn the beat (route whoosh, side-eye, camera clicks, press-car swarm, one splash). **Not** a gunshot. **Not** dense text_pop chatter. Clearly under VO. Leave VO-only stretches.
- Mix path (locked): measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm on master only** (~−14 LUFS / −1.5 dBTP). Do **not** pre-amix VO loudnorm
- Captions never overlap badges/gag cards; nudge per beat when graphics occupy the ~70% band
- Keep faces/key action out of YouTube UI safe zones (bottom + right edge)

---

## Deliverables

- Open a PR **or** ship local: `out/s28-robyn-davidson.mp4` (and/or `final/s28-robyn-davidson.mp4`)
- `final/contact-sheet.jpg` (review before final)
- Loudnorm report on master (~−14 LUFS)
- `transcript.json` once Whisper runs on the held VO
- Leave PR open (do not merge). No YouTube upload

## Success

Premium **map-explainer** Short matching the GeoArchivez motion bar + GeoGlobeTales lighting lock, all six visual gags staged on cue (including series camel at the back of the line + master-map join), first-frame red-centre march with the Indian Ocean glowing, incomplete loop into that open, dignity held on the elder and the dog, contact sheet reviewed, loudnorm clean. **VO pending** until Video Production seats Atlas at `shorts/s28-robyn-davidson/audio/vo.mp3`.
