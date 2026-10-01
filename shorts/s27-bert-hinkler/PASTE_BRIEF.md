# s27 Bert Hinkler — Claude Code brief (paste-ready)

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `shorts/s27-bert-hinkler/`  
Branch: `scaffold/s27-bert-hinkler`  
Mode: **MAP EXPLAINER** (kinetic cartography primary) — **NOT** Skylab photo-underlay slideshow.  
Series: **Impossible Journeys — episode 2** (s26 Mary Bryant was ep.1; gags all on the map; series line joins master map).

**Australian English** in all spelled facts and on-screen labels.

**Live Bert episode.** Abandoned `shorts/s26-bert-hinkler/` + `/workspace/deliverables/s26-bert-hinkler/` stay **ABANDONED** — do not reuse as live.

---

## Goal

Design, animate, mix and render History Short **s27 Bert Hinkler** (1928 solo England→Australia / Hustling Hinkler / Italy twist / Florence burial) at best quality — exceed prior Shorts. Claude owns `scenes.js`. Production never hand-designs scenes.

**VO held** (Atlas en-AU, 91.25 s; Whisper-retune): `/workspace/deliverables/s27-bert-hinkler/vo-raw/vo-atlas.mp3` → `shorts/s27-bert-hinkler/audio/vo.mp3`. Retune seams to the held recording.

---

## MAP EXPLAINER — standing quality bar (locked)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km/year callouts, obstacle cutaways on the map (Darién-style). **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.

Read also: `shorts/s27-bert-hinkler/MAP_EXPLAINER_MODE.md` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

---

## Stack (non-negotiable)

- Vertical **1080×1920 @ 30 fps**
- **SVG + `renderFrame(t)` + Playwright + ffmpeg ONLY**
- **No Remotion** (no Remotion CLI, no `src/episodes` compositions)
- Reuse `shorts/shared/render/`; put episode scenes in `shorts/s27-bert-hinkler/render/`
- **Do not write placeholder / basic SVG** — design at best quality from the start
- Captions ~70% (lower-middle); sparse intentional SFX ~**6–10**; mix: measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm** master only ~**−14 LUFS**

---

## Hook (on-screen only — never spoken)

**Primary frame-1 hook card:** `15 DAYS`  
**Alternates (A/B only):** `18,000 KM` · `HUSTLING HINKLER`

One strong hook slam on frame 1. **Not** a VO-echo title restating the opening sentence.

### First frame (user — locked)

Camera dives from space onto London; tiny biplane icon lifts off; red dotted route shoots south-east across the globe toward Australia. Unspoken hook card **`15 DAYS`**.

---

## Full spoken script (Atlas VO)

Emotion cues in `()` are **performance only — never spoken**. Atlas VO: **fast amazed → storytelling → tense → dark twist → warm series close**; **start instantly**.

(fast, amazed) One man. One tiny open plane. England to Australia… completely alone.

(storytelling) 1928. His name is Bert Hinkler, and he grew up in a small Australian town, watching birds and building his own gliders.

(deadpan) Basically, he watches birds… then tries to become one.

(tense) Nobody has ever flown this far alone. The fastest anyone has done it, even with a full crew, is 28 days.

(amused) No autopilot. No co-pilot. No one to take over while he eats a sandwich.

(fast) 7 February. He takes off from London.

(fast) Italy. The Mediterranean. North Africa.

(fast) The deserts of the Middle East. India.

(tense) Burma. Singapore. The islands of today’s Indonesia.

(awed) 22 February. He lands in Darwin. About 18,000 kilometres… in just 15 days.

(triumphant) He’s almost halved the record. Newspapers nickname him “Hustling Hinkler”.

(amused) Give the man a like. He earned it.

(twist, dark) Five years later, he tries to fly it even faster. He takes off from London… and disappears.

(slow, eerie) For over three months, nobody knows where he is. Then his body is found beside his crashed plane, on a mountain in Italy.

(twist) And Italy’s dictator, Benito Mussolini, orders a funeral with full military honours.

(serious) So the boy from a small Australian town is buried in Florence… on the other side of the world from home.

(warm) That’s episode two of Impossible Journeys. Follow along for the next one.

(loop) All of it started with

**Spoken word count:** ~224 (excl. emotion cues).  
**Incomplete loop:** closing mid-phrase bridges into the open:

`…All of it started with` → *[whip / match-cut on space dive / `15 DAYS` / London biplane lift]* → `One man. One tiny open plane…`

---

## Visual gags (must stage — all on the map)

1. **On “tries to become one”** — map zooms **Bundaberg**; tiny figure with **cardboard wings** hops off sand dune.
2. **On “eats a sandwich”** — plane icon **wobbles** mid-route; **sandwich** icon floats beside it.
3. **On each place name** — **passport stamp** slams onto that country with pin-drop thunk, **faster and faster**.
4. **On “Hustling Hinkler”** — **1920s newspaper** label pops over Darwin.
5. **On “Give the man a like”** — **vintage thumbs-up stamp** lands on Darwin.
6. **On “disappears”** — plane **vanishes** over Europe; map **greys**; single pin drops on **Tuscan mountains**.
7. **Series camel** hidden among passport stamps; at series line route joins **Impossible Journeys master map**.

Humour lock: deadpan true details are funny alone; **stage these Visual gags** on the named lines (vector/MG overlays on the map — History Shorts keep dignity; no gore on death beats). Camel + cardboard wings + sandwich are gag colour only — never present as historical fact.

---

## Beat plan (ANIMATE vs STILL)

Approximate seams — **retune to Whisper** against the held `audio/vo.mp3` (91.25 s).

| # | Beat (VO cue) | Mode | Treatment |
|---|---|---|---|
| 1 | One man / tiny open plane / England to Australia | ANIMATE (map) | **First-frame dive** space→London; biplane lifts; red dotted SE route; unspoken `15 DAYS`; camera already drifting |
| 2 | 1928 / Bert Hinkler / small town / birds / gliders | ANIMATE (map + brief) | Soft Australia pin; chips `BERT HINKLER` · `1928`; **mandatory real Bert portrait** ≤~1–1.5 s |
| 3 | tries to become one | ANIMATE (map) | **Gag 1** Bundaberg zoom; cardboard-wings figure hops sand dune |
| 4 | nobody flown this far alone / 28 days | ANIMATE (map) | Globe scale; prior-record chip `28 DAYS` |
| 5 | eats a sandwich | ANIMATE (map) | **Gag 2** plane wobbles; sandwich floats |
| 6 | 7 February / London take-off | ANIMATE (map) | London pin; biplane lifts; self-drawing route head starts |
| 7 | Italy / Mediterranean / North Africa | ANIMATE (map) | **Gag 3** passport stamps slam (accelerating) |
| 8 | Middle East deserts / India | ANIMATE (map) | **Gag 3** continues — stamps faster |
| 9 | Burma / Singapore / Indonesia islands | ANIMATE (map) | **Gag 3** climax; **Gag 7** series camel peek among stamps |
| 10 | 22 February / Darwin / 18,000 km / 15 days | ANIMATE (map) | Land `DARWIN`; chips `18,000 KM` · `15 DAYS`; route completes |
| 11 | almost halved / Hustling Hinkler | ANIMATE (map) | **Gag 4** 1920s newspaper label over Darwin |
| 12 | Give the man a like | ANIMATE (map) | **Gag 5** vintage thumbs-up stamp on Darwin |
| 13 | five years later / disappears | ANIMATE (map) | **Gag 6** plane vanishes over Europe; map greys |
| 14 | three months / body / crashed plane / mountain Italy | ANIMATE (map) | **Gag 6** single pin Pratomagno / Tuscany — dignity; no gore |
| 15 | Mussolini / funeral / military honours | ANIMATE (map + brief) | Florence soft pin; period free still if available else soft map — **not emoji** |
| 16 | buried Florence / other side of world | ANIMATE (map) | Florence burial pin; home↔Florence distance feel |
| 17 | episode two of Impossible Journeys | ANIMATE (map) | **Gag 7** red route joins **master map** |
| 18 | All of it started with | ANIMATE (map) | Incomplete loop → space dive / `15 DAYS` / London biplane lift |

**Maps carry the story.** Photos only as brief credibility inserts. Camera never static; new visual stimulus ~every 1.5–2 s.

### Geography lock (correct locations only)

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
| Florence | Burial; Mussolini military honours |

**Route:** thick solid yellow/orange self-drawing England→Australia line + soft drop shadow; camera tracks leading edge. First-frame tease = **red dotted**. Disappear / crash = **grey**. Series join = **red** onto master map.

---

## Asset notes (free licence only → `images/SOURCES.md`)

Seek factually correct interesting stills — **no AI historical stills**:

- **REAL Bert Hinkler portrait (MANDATORY)** — PD/Commons; never emoji, pictogram-only, or name-chip stand-in
- Avro Avian / period open light-plane photo if licence-clean
- Darwin / Bundaberg / London soft geography stills as needed
- Mussolini / Florence funeral: period free stills if available, else soft map treatment — **not emoji**
- Satellite/topo basemap canvas (GeoGlobeTales quality — no blown white relief)
- Series camel = **vector MG** (not a photo)

Document every still in `SOURCES.md` / `images/SOURCES.md`. Prefer Australian English place names (`kilometres`, `Darwin`, `Bundaberg`).

---

## Style locks (verbatim)

- **Atlas VO:** fast amazed → storytelling → tense → dark twist → warm series close; start instantly; never speak `()` cues; **VO held** (Atlas en-AU, 91.25 s; Whisper-retune)
- **Captions** lower-middle ~70%; no VO-echo big titles; labels for names/places/facts only
- **Sparse intentional SFX** ~6–10; mix: measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- **Humour:** deadpan true details funny alone; stage the seven Visual gags; dignity on death / funeral beats
- **Images:** factually correct interesting stills only; free licence; SOURCES.md; no AI historical stills; **real Bert portrait mandatory**
- **MAP EXPLAINER primary** — maps carry the story; photos brief inserts only
- **Basemap:** GeoGlobeTales quality — rich satellite, soft lighting, **NO blown white relief**
- **Motion:** GeoArchivez continuous self-drawing route + always-moving camera; **first-frame space dive**
- **Series:** Impossible Journeys ep.2 — camel among stamps + master-map join
- **Quality:** Claude designs at best quality; exceed prior Shorts
- **Incomplete loop** into open as script ends mid-phrase
- **Claude handoff:** paste brief only (no @claude unless asked)

---

## Mix / SFX / captions locks

- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) already in `audio/music.mp3` — same Impossible Journeys bed as s26 Mary; seat safely under VO (~**4 dB quieter** than s18 Silent Descent original bed) before master loudnorm
- SFX: ~6–10 intentional cues (whoosh, riser, impact/stamp thunks accelerating, paper rustle, newspaper pop, soft grey settle, warm resolve) — **not** dense text_pop chatter
- Mix path (locked): measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm on master only** (~−14 LUFS / −1.5 dBTP). Do **not** pre-amix VO loudnorm
- Captions never overlap badges/gag cards; nudge per beat when graphics occupy the ~70% band
- Keep faces/key action out of YouTube UI safe zones (bottom + right edge)

---

## Deliverables

- Open a PR **or** ship local: `out/s27-bert-hinkler.mp4` (and/or `final/s27-bert-hinkler.mp4`)
- `final/contact-sheet.jpg` (review before final)
- Loudnorm report on master (~−14 LUFS)
- Updated `transcript.json` once Whisper runs on held VO
- Leave PR open (do not merge). No YouTube upload from Claude

## Success

Premium **map-explainer** Short matching GeoArchivez motion bar + GeoGlobeTales lighting lock, all seven visual gags staged on cue (including series camel + master-map join), first-frame space dive, incomplete loop into open, **real Bert portrait insert**, contact sheet reviewed, loudnorm clean. **VO held** (Atlas en-AU, 91.25 s; Whisper-retune) → `shorts/s27-bert-hinkler/audio/vo.mp3`. Claude should Whisper-retune seams to the held recording.
