# s29 Darwin Stuck — Claude Code brief (paste-ready)

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `shorts/s29-darwin-stuck/`  
Branch: **`scaffold/s29-darwin-stuck`** — **pull this scaffold branch first** before building.  
Mode: **MAP EXPLAINER** (kinetic cartography primary) — **NOT** a photo slideshow.  
Role: **Teaser Short** for long-form **lf01** (*What If Japan Had Invaded Australia in 1942*) — this Short covers **scenario one** only (Darwin / desert / railway trap). The other two scenarios stay in the long-form.

**Australian English** in all spelled facts and on-screen labels. On-screen spelling: **Birdum**, **Darwin**, **Alice Springs**. Do **not** rewrite the spoken words.

**Handoff:** the user pastes this file into Claude Code. Do **not** post a GitHub comment that summons Claude. Do **not** `@claude`. The user pastes this file into Claude Code themselves.

**VO:** Atlas en-AU will be seated at `audio/vo.mp3` **before paste**. Match the s28 convention: `shorts/s29-darwin-stuck/audio/vo.mp3`. **VO will be seated before paste; do not record a new one.** Do not overwrite `vo.mp3` if present. Whisper-retune seams to that recording. Do not invent timings before VO lands.

---

## Goal

Design, animate, mix and render History Short **s29 Darwin Stuck** (1942 Darwin invasion trap — map says no) at best quality — exceed prior Shorts. Claude owns `scenes.js`. Production never hand-designs scenes. **Do not upload to YouTube. Do not merge the PR. Do not invent a YouTube URL for the related long-form.**

---

## MAP EXPLAINER — standing quality bar (locked)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km callouts, obstacle cutaways on the map (Darién-style “no road” / gap beats). **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.

Read also: `shorts/s29-darwin-stuck/MAP_EXPLAINER_MODE.md` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

Map quality, in full: rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, **NO blown-out white relief highlights** on terrain, slight atmospheric edge haze OK, crisp thin white distance lines with arrowheads, bold white labels + drop shadow, yellow km callouts.

---

## Stack (non-negotiable)

- Vertical **1080×1920 @ 30 fps**
- **SVG + `renderFrame(t)` + Playwright + ffmpeg ONLY**
- **No Remotion** (no Remotion CLI, no `src/episodes` compositions)
- Reuse `shorts/shared/render/`; put episode scenes in `shorts/s29-darwin-stuck/render/scenes.js`
- **Do not write placeholder / basic SVG** — design at best quality from the start
- Captions lower-middle ~70%; never overlapping graphics; no VO-echo title cards
- Hook card **frame 1 only**: `ROAD TO NOWHERE` — **NEVER spoken**
- Sparse intentional SFX ~**6–10**, clearly under VO, with VO-only stretches. The **sad horn toot** is one of them. Cut dense whoosh/pop chatter
- Mix: measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm** master only ~**−14 LUFS** / true peak ≤ **−1.5 dBTP**. Do **not** use a one-pass mix that flattens the voice

---

## Hook (on-screen only — never spoken)

**Frame-1 hook card:** `ROAD TO NOWHERE`

One strong hook slam on frame 1. **Not** a VO-echo title restating the opening sentence.

### First frame (locked)

Northern Australia / Darwin harbour region on a GeoGlobeTales-style satellite map: Japanese intent arrow teasing toward Darwin; desert south already hinted; unspoken hook **`ROAD TO NOWHERE`**. Camera already drifting.

---

## Full spoken script (Atlas VO)

Emotion cues in `()` are **performance only — never spoken**. Do not add facts. Do not change these words.

(fast, amazed) Japan could have captured Darwin in 1942… and still been stuck.

(sly) Blame the map.

(storytelling) Some Japanese admirals wanted to grab northern Australia. Darwin had already been bombed. Most of its people were gone.

(tense) So landing there? Probably possible.

(deadpan) But then look south.

(awed) Thousands of kilometres of desert between Darwin and the cities.

(fast) The railway from Darwin stopped at a tiny place called Birdum. The line from the south ended at Alice Springs.

(amused) In between? Roughly a thousand kilometres of no railway at all.

(deadpan) That’s not a road into Australia. That’s a road to nowhere.

(twist) Japan’s own generals saw the trap: an army stranded in the north, with supply lines stretching all the way back to Japan. So they said no.

(warm) And that’s just scenario one. The other two are even wilder. The full video’s linked right here.

(loop) Because remember:

**Spoken word count:** 139 (excl. emotion cues).  
**Button loop:** closing spoken line bridges into the open. The camera should be set so the first frame can loop:

`…Because remember:` → *[match-cut on Darwin / stuck tease / `ROAD TO NOWHERE`]* → `Japan could have captured Darwin in 1942…`

The loop line **“Because remember:” is spoken** and should **button-loop the hook**.

---

## Visual gags (must stage — all on the map)

1. **On “Blame the map”** — the map itself shrugs: its edges curl like shoulders.
2. **Railway lines** draw in and stop with a **“dead end” road sign** popping up at **Birdum**.
3. **On “no railway at all”** — a tiny train icon chugs out of Birdum, reaches the end of the track, and stops with a **sad horn toot**.
4. **On “road to nowhere”** — a single cartoon tumbleweed rolls across the ~1,000 km gap.
5. **On “even wilder”** — two glowing envelopes labelled **“2”** and **“3”** bounce in a safe corner.
6. **On “linked right here”** — an animated arrow points **down** to the Related video link area at the bottom. **Do not invent a YouTube URL.** Leave a clean arrow toward the bottom related-video UI. Do not upload.

Humour lock: deadpan true detail. Stage every visual gag. Keep gag timing tight to the spoken words. Icons are gag colour — never present them as historical photographs.

### Portrait / still lock

- **No named person who needs a portrait.** No admiral faces. No emoji. No AI historical stills.
- Maps carry the story; any still would be optional place texture only and must be free-licence + documented.

---

## Beat plan (ANIMATE vs STILL)

Approximate seams — **retune to Whisper** once Atlas VO is held at `audio/vo.mp3`. Do not overwrite `vo.mp3`.

| # | Beat (VO cue) | Mode | Treatment |
|---|---|---|---|
| 1 | Japan could have captured Darwin / still been stuck | ANIMATE (map) | First-frame Darwin tease; intent arrow; unspoken `ROAD TO NOWHERE`; camera drifting |
| 2 | Blame the map | ANIMATE (map) | **Gag 1** map shrug (edges curl like shoulders) |
| 3 | admirals / northern Australia / bombed / people gone | ANIMATE (map) | North AU highlight; Darwin pin; soft `1942`; empty-town cue |
| 4 | landing there? Probably possible | ANIMATE (map) | Landing arrow at Darwin |
| 5 | But then look south | ANIMATE (map) | Camera whip / pull south |
| 6 | Thousands of kilometres of desert / cities | ANIMATE (map) | Desert glow; yellow km; distant city pins |
| 7 | railway / Birdum / Alice Springs | ANIMATE (map) | **Gag 2** rails self-draw + dead-end sign at Birdum; Alice Springs stub |
| 8 | no railway at all | ANIMATE (map) | **Gag 3** train chugs → end of track → sad horn toot |
| 9 | road to nowhere | ANIMATE (map) | **Gag 4** tumbleweed across ~1,000 km gap |
| 10 | trap / stranded / supply lines / said no | ANIMATE (map) | Stranded icon; dashed supply arc to Japan; soft NO |
| 11 | scenario one / even wilder | ANIMATE (map) | `SCENARIO 1`; **Gag 5** envelopes 2 + 3 bounce |
| 12 | full video’s linked right here | ANIMATE (map) | **Gag 6** arrow down to Related area — no URL invented |
| 13 | Because remember: | ANIMATE (map) | Button loop → first frame |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s.

### Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Darwin, NT | Northern port / bombing beat. |
| Birdum, NT | Southern terminus of the North Australia Railway. Spelling **Birdum**. Dead-end sign here. |
| Alice Springs, NT | Southern railway stub end. |
| ~1,000 km gap | Birdum ↔ Alice Springs — no railway in 1942. |
| Japan supply lines | Schematic dashed long-range arc — not a fleet photo. |

**Route:** thick solid yellow/orange self-drawing rail stubs + soft drop shadow; white distance lines with arrowheads; yellow km callouts on the gap and desert.

---

## Asset notes

- **Music seated:** `audio/music.mp3` / `music/music.mp3` — **Silent Descent** by Eugenio Mininni (Mixkit Free Licence, id **614**). Same tense Darwin bed as s18. Credit it. **Do not force Mixkit Skyline 601** — this is an lf01 teaser, not Impossible Journeys.
- Shared Mixkit SFX kit seated in `sfx/`. Prefer ~6–10 intentional cues. The **sad horn toot** for gag 3 is required; if no file in `sfx/` fits, add **one** Mixkit-free train-horn toot and credit it in `sfx/sources.tsv`.
- No portrait stills required. Document any optional place still in `images/SOURCES.md`.
- Basemap: Claude builds GeoGlobeTales-quality satellite canvas (no blown white relief).

---

## Style locks (verbatim)

- **Atlas VO:** fast amazed → sly → storytelling → tense → deadpan → awed → fast → amused → deadpan twist → warm teaser → loop; start instantly; never speak `()` cues; never speak the hook; **VO will be seated before paste at `audio/vo.mp3`**; do not record a new one; do not overwrite; Whisper-retune seams to it
- **Captions** lower-middle ~70%; never overlapping graphics; no VO-echo big titles; labels for names/places/facts only
- **Sparse intentional SFX** ~6–10, clearly under VO, VO-only stretches; sad horn toot is one; cut dense whoosh/pop chatter
- **Music:** Silent Descent (Mixkit 614) — tense map explainer; **not** Skyline 601; seat ~4 dB quieter than s18’s original Silent Descent bed under VO
- **Mix:** measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS / ≤ −1.5 dBTP. Do not flatten the voice with a one-pass mix
- **Humour:** deadpan true detail; stage every visual gag; keep gag timing tight
- **Images:** no named-person portraits required; no emoji; no AI historical stills
- **MAP EXPLAINER primary** — maps carry the story
- **Basemap:** GeoGlobeTales quality — rich satellite, soft lighting, **NO blown white relief**
- **Motion:** GeoArchivez continuous self-drawing route + always-moving camera
- **End card:** arrow down to Related video area — **do not invent a YouTube URL**; do not upload
- **Loop:** spoken `Because remember:` button-loops the hook
- **Quality:** Claude designs at best quality; exceed prior Shorts
- **Claude handoff:** paste this brief only after pulling `scaffold/s29-darwin-stuck`. Do not summon Claude from the GitHub issue.

---

## Mix / SFX / captions locks

- Music: **Silent Descent** (Eugenio Mininni / Mixkit id **614**) already in `audio/music.mp3`. Seat safely under VO (~**4 dB quieter** than s18 original bed) before master loudnorm.
- SFX: ~6–10 intentional cues (map shrug, rail draw / dead-end, **sad horn toot**, tumbleweed, envelope bounce, end arrow). Clearly under VO. Leave VO-only stretches.
- Mix path (locked): measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm on master only** (~−14 LUFS / −1.5 dBTP). Do **not** pre-amix VO loudnorm
- Captions never overlap badges/gag cards; nudge per beat when graphics occupy the ~70% band
- Keep faces/key action out of YouTube UI safe zones (bottom + right edge) — especially leave room for gag 6’s down-arrow toward Related

---

## Deliverables

- Open a PR **or** ship local: `out/s29-darwin-stuck.mp4` (and/or `final/s29-darwin-stuck.mp4`)
- `final/contact-sheet.jpg` (review before final)
- Loudnorm report on master (~−14 LUFS)
- `transcript.json` once Whisper runs on the held VO
- Leave PR open (do not merge). No YouTube upload. No invented related-video URL.

## Success

Premium **map-explainer** Short matching the GeoArchivez motion bar + GeoGlobeTales lighting lock, all six visual gags staged on cue (map shrug, Birdum dead-end, sad-horn train, tumbleweed gap, envelopes 2+3, Related down-arrow), button loop on spoken `Because remember:`, contact sheet reviewed, loudnorm clean. Atlas VO seated at `shorts/s29-darwin-stuck/audio/vo.mp3` before paste — do not overwrite it; do not record a new one.
