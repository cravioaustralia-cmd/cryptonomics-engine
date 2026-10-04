**HARD LINE — MAP ANIMATION.** This Short is map-animation type. Kinetic cartography is the picture, not a photo-underlay. Real portraits, if seated, are small name cards only, not the scene. The route, the crevasse, the sledge split, and the ship leaving are all on the map.

# s31 Douglas Mawson — Claude Code brief (paste-ready)

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `shorts/s31-mawson/`  
Branch: **`scaffold/s31-mawson`** — **pull this scaffold branch first** before building.  
Mode: **MAP ANIMATION / MAP EXPLAINER** (kinetic cartography is the picture) — **NOT** a photo-underlay and **NOT** a photo slideshow.  
Series: **Impossible Journeys — episode 6**. Confirmed from prior PASTE_BRIEFs: s26 Mary Bryant was **episode 1**; s27 Bert Hinkler was **episode 2**; s28 Robyn Davidson was **episode 4**. There is **no episode-3 folder** — do not invent episode 3 and do not renumber this short. **s29 Darwin Stuck is not this series** (it is the lf01 teaser). s30 Rabbit-Proof Fence was **episode 5**. Do not draw s29 on the master map.

**Australian English** in all spelled facts and on-screen labels. On-screen names: **Mawson**, **Ninnis**, **Mertz**, **Ninnis Glacier**, **Mertz Glacier**. Do **not** rewrite the spoken words.

**Handoff:** the user pastes this file into Claude Code. Do **not** post a GitHub comment that summons Claude. Do **not** `@claude`. The user pastes this file into Claude Code themselves.

**VO:** Atlas en-AU is already at `shorts/s31-mawson/audio/vo.mp3`. **Claude must not re-record it.** Do not overwrite `vo.mp3`. Do not record a new VO. Whisper-retune seams to that recording. Do not invent a duration — measure the seated file.

---

## Goal

Design, animate, mix and render History Short **s31 Douglas Mawson** (1912–13: a sledge team goes east from base, Ninnis is lost in a crevasse, Mertz dies on the return, Mawson misses the ship by hours and winters again) at best quality — exceed prior Shorts. Claude owns `scenes.js`. Production never hand-designs scenes. **Do not upload to YouTube. Do not merge the PR.**

**The picture is the map.** Not a photo-underlay.

Two men die. Quiet after the crevasse. **One gentle gag only, and only before the crevasse.**

---

## MAP EXPLAINER — standing quality bar (locked)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km callouts. **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich colour, deep navy ocean, soft balanced lighting, **no blown white relief**. On this episode Antarctica must **read as ice** (pale blue-grey, texture, crevasse shadow) **without blown-out white ridges**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.

Read also: `shorts/s31-mawson/MAP_EXPLAINER_MODE.md` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

Map quality, in full: ice that is still ice, deep navy Southern Ocean with subtle bathymetry, soft balanced lighting, **NO blown-out white relief highlights** on ridges, slight atmospheric edge haze OK, crisp thin white distance lines with arrowheads, bold white labels + drop shadow, yellow km callouts.

---

## Stack (non-negotiable)

- Vertical **1080×1920 @ 30 fps**
- **SVG + `renderFrame(t)` + Playwright + ffmpeg ONLY**
- **No Remotion** (no Remotion CLI, no `src/episodes` compositions)
- Reuse `shorts/shared/render/`; put episode scenes in `shorts/s31-mawson/render/scenes.js`
- **Do not write placeholder / basic SVG** — design at best quality from the start
- Captions ~70% from the top, clear of graphics; never overlapping graphics; no VO-echo title cards
- Hook card **frame 1 only**: `A FEW HOURS` — **NEVER spoken**
- Sparse intentional SFX under the voice. **Not dense whooshes.**
- Mix: measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm** master only ~**−14 LUFS**. **True peak ≤ −1.5 dBTP on the AAC file, not just the WAV.** The s30 AAC master peaked at **−1.32 dBTP** — leave headroom so the AAC encode (the audio inside the master) measures at or under −1.5. Aim the WAV limiter nearer **−2.0 to −2.5 dBTP**, then measure the AAC. If the AAC is hot, lower the limiter and re-encode. Do not sign off on the WAV peak alone. Do **not** use a one-pass mix that flattens the voice

---

## Hook (on-screen only — never spoken)

**Frame-1 hook card:** `A FEW HOURS`

One strong hook slam on frame 1. **Not** a VO-echo title restating the opening sentence.

### First frame (locked)

Antarctica on a GeoGlobeTales-style satellite map. Ice reads as ice; ridges are not blown white. Three small sledge icons are already moving east from the base. A tiny snow-camel shape is hidden in the ice (series motif, not a joke). Unspoken hook **`A FEW HOURS`**. Camera already drifting. **No faces filling the frame. No photo-underlay.**

---

## Full spoken script (Atlas VO)

Emotion cues in `()` are **performance only — never spoken**. Do not add facts. Do not change these words.

(fast, intense) Three men set out across Antarctica. Only one came back… and he missed his ship home by a few hours.
(storytelling) 1912. Australian geologist Douglas Mawson leads a sledge team east from his base. With him are two friends: Belgrave Ninnis from Britain, and Xavier Mertz from Switzerland.
(tense) Five weeks in, about 500 kilometres from base, Ninnis crosses a hidden crevasse. The snow gives way.
(dark) He’s gone. And with him, the tent, most of the food, and the six best dogs.
(tense) Mawson and Mertz turn back. To survive, they eat their remaining dogs.
(serious) They don’t know that husky liver is so full of vitamin A, it can poison a human.
(dark, slower) Mertz grows weaker and weaker. In January 1913, he dies.
(awed) Mawson is alone, about 160 kilometres from base. He saws his sledge in half to make it lighter. He falls into a crevasse, dangles on a rope… and climbs back out.
(tense) Weeks later, he finally sees his base… and his ship sailing away. It left only hours before.
(twist) He has to survive another whole winter in Antarctica.
(warm) Two glaciers now carry his friends’ names: the Ninnis Glacier and the Mertz Glacier.
(warm) That’s episode six of Impossible Journeys. Follow along for the next one.
(loop) Because once,

**Spoken word count:** 204 (excl. emotion cues).  
**Incomplete loop:** closing mid-phrase bridges into the open. The camera should be set so the first frame can loop:

`…Because once,` → *[match-cut on the three sledges / eastward ice / `A FEW HOURS`]* → `Three men set out`

The loop line **“Because once,” is spoken** and should complete into “Three men set out”.

---

## Visual gags

**One, before the crevasse only.** On “two friends”, a British flag pin pops beside Ninnis’s sledge icon and a Swiss flag pin beside Mertz’s. Each sledge icon wears a tiny woolly hat. Then it is over.

**NONE after the crevasse.** Do not invent more. No cartoon jokes, no emoji, no comic timing, no gore, no cartoon death.

**Snow-camel:** early only, a small camel shape hidden in the ice (series motif). Unlabelled. Not a character. Not a joke on the deaths. Gone before the crevasse. Does not return.

### Suspense map moments (must stage — all on the map)

1. **“Distance to base” counter ticking down** on the return. Anchors as spoken: about 500 km at the fall, about 160 km when he is alone. Do not invent a kilometre diary.
2. **Sledge icon physically snaps into two halves** when he saws it in half.
3. **Tiny ship icon leaves the base pin just as Mawson’s icon arrives.** Do not name the ship. Do not print an hour count.

### Dignity (locked)

- Two men die. Ninnis’s icon leaves the route when the snow gives way. Mertz’s icon stops in January 1913. No body, no scream, no X-eyes, no comic beat.
- Lost with Ninnis: labels only (`TENT`, `MOST OF THE FOOD`, `SIX BEST DOGS`). No gore.
- “Eat their remaining dogs” and husky-liver poisoning are **not illustrated**. A serious `VITAMIN A` label is enough. No butchery. No dog characters.
- Mawson’s own crevasse is a rope on the map: he dangles and climbs out. Suspense, not a stunt cartoon.
- No emoji. No AI faces. No generated scene of the deaths.

### Portrait lock

Three **public-domain** portraits are seated in `images/` (searched Wikimedia Commons, 4 Oct 2026 — see `images/SOURCES.md`):

- `images/s31_douglas_mawson.jpg` — Douglas Mawson
- `images/s31_belgrave_ninnis.jpg` — Belgrave Ninnis (Frank Hurley / NLA)
- `images/s31_xavier_mertz.jpg` — Xavier Mertz

**Small name cards only**, when the names are spoken. Not the scene. Not a photo-underlay. Not full-screen. Do not generate AI faces. Do not swap in a copyrighted expedition plate that is not in this folder.

---

## Beat plan (ANIMATE vs STILL)

Approximate seams — **retune to Whisper** on the seated `audio/vo.mp3`. Do not overwrite `vo.mp3`. Do not re-record.

| # | Beat (VO cue) | Mode | Treatment |
|---|---|---|---|
| 1 | Three men / Antarctica / only one came back / a few hours | ANIMATE (map) | First frame; hook `A FEW HOURS`; three sledges east; hidden snow-camel |
| 2 | 1912 / Mawson / east from base / two friends / Ninnis / Britain / Mertz / Switzerland | ANIMATE (map) | Pins `CAPE DENISON` `COMMONWEALTH BAY`. **Flag pins + woolly hats** (only gag). Small PD name cards, then the map |
| 3 | Five weeks / ~500 km / hidden crevasse / snow gives way | ANIMATE (map) | Gag gone. Snow-camel gone. Crevasse on the route. Ninnis’s icon drops out. No cartoon death |
| 4 | He’s gone / tent / food / six best dogs | ANIMATE (map) | Supply labels only. Trail stops |
| 5 | turn back / eat remaining dogs | ANIMATE (map) | Two icons return. **`DISTANCE TO BASE` ticks down.** Eating not shown |
| 6 | husky liver / vitamin A / poison | ANIMATE (map) | Serious label. Not a joke |
| 7 | Mertz weaker / January 1913 / dies | ANIMATE (map) | His icon stops. `JANUARY 1913`. No cartoon death |
| 8 | alone / ~160 km / sledge in half / crevasse / rope / climbs out | ANIMATE (map) | Counter at `~160 km`. **Sledge snaps in two.** Rope crevasse, climbs out |
| 9 | sees his base / ship sailing away / hours before | ANIMATE (map) | **Ship icon leaves the base pin as Mawson’s icon arrives** |
| 10 | another whole winter | ANIMATE (map) | Hold. One icon stays. No gag |
| 11 | Ninnis Glacier / Mertz Glacier | ANIMATE (map) | Glacier labels on the eastward ice |
| 12 | episode six / follow along | ANIMATE (map) | Master-map pullback — loaded routes only, else **pull back over Antarctica and hold** |
| 13 | Because once, | ANIMATE (map) | Loop into “Three men set out” |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s.

### Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Cape Denison / Commonwealth Bay | The base. Confirmed 4 Oct 2026 (Australian Antarctic Program Mawson’s Huts page; Wikipedia *Cape Denison*, ~67°00′S 142°40′E). Labels only. Do not add the names to the VO. |
| East | Spoken. Route draws east. |
| Mertz Glacier | End label. Wikipedia: George V Coast, ~67°30′S 144°45′E, named for Xavier Mertz. |
| Ninnis Glacier | End label. Wikipedia: George V Coast, ~68°22′S 147°00′E, named for B. E. S. Ninnis. Do not print “Black Crevasse” or 14 December 1912. |
| The ship | Icon only. **Do not name it.** No hour count. No 8 February 1913 chip. |
| ~500 km / ~160 km | Keep “about”. |

**Route:** self-drawing eastward line, three sledges then two then one, distance counter down, sledge split, ship leaving. Yellow km callouts. Soft drop shadow. No blown white relief.

### Master map

At “That’s episode six…”, join **this** route to the master map and pull back.

Only draw a prior journey if you load its **actual polyline** from the repo (these commits are not on this branch; `git show` them — do not retype a guess):

- **Episode 1 — Mary Bryant:** commit `f83a646`, or `mary.escape` inside `3db0f94:shorts/s27-bert-hinkler/render/geo.json`.
- **Episode 2 — Bert Hinkler:** commit `3db0f94`, `shorts/s27-bert-hinkler/render/geo.json` key **`routes.flight`** only.
- **Episode 3:** no folder. **Do not invent a route.**
- **Episode 4 — Robyn Davidson:** `origin/claude/s28-robyn-davidson-map-gwcpin` `shorts/s28-robyn-davidson/render/scenes.js` const **`WAY`**.
- **s29 Darwin Stuck:** not this series. Do not draw it.
- **Episode 5 — Rabbit-Proof Fence:** only if a polyline actually exists. The s30 scaffold has no `scenes.js`. **Do not invent the fence.**

If you cannot load those polylines: **pull back over Antarctica and hold**. Do not fake other journeys.

---

## Asset notes

- **Music seated:** `audio/music.mp3` / `music/music.mp3` — **Skyline** by Eugenio Mininni (Mixkit Free Licence, id **601**, ~205.9 s). Already in the repo; copied from s30 (same file as s26 / s27 / s28). Not freshly downloaded. Credit it. Seat ~**4 dB quieter** than the s18 original Silent Descent bed under VO. Do not download other music.
- Shared Mixkit SFX kit seated in `sfx/`. Use it **sparingly** (about 4–8 cues, clearly under VO, with VO-only stretches). No dense whooshes. **Do not use `record-scratch.mp3`.** No joke stingers. Nothing playful after the crevasse.
- **Portraits:** the three PD files above, **name cards only**.
- Basemap: Claude builds a GeoGlobeTales-quality satellite canvas. Ice, not blown white ridges.

---

## Style locks (verbatim)

- **Atlas VO:** fast intense → storytelling → tense → dark → serious → dark slower → awed → twist → warm → loop; start instantly; Australian English; never speak `()` cues; never speak the hook; **VO is already at `shorts/s31-mawson/audio/vo.mp3`; Claude must not re-record it**; do not overwrite; Whisper-retune seams to it
- **Captions** ~70% from the top; clear of graphics; no VO-echo big titles; labels for names/places/distances/dates only
- **Sparse SFX** under the voice; not dense whooshes; VO-only stretches; no record-scratch; no comic SFX after the crevasse
- **Music:** Skyline (Mixkit 601), already copied in; credit Eugenio Mininni / Mixkit; seat ~4 dB quieter than the s18 Silent Descent bed
- **Mix:** measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS. **True peak ≤ −1.5 dBTP on the AAC, not just the WAV.** s30’s AAC master peaked at −1.32 dBTP — leave headroom and measure the AAC file. Do not flatten the voice with a one-pass mix
- **Humour:** one gentle gag before the crevasse (flag pins, woolly hats). None after. Dignity lock above. Snow-camel is a small early motif, not a death joke
- **Images:** kinetic cartography is the picture. Three PD portraits as **small name cards only**. No emoji. No AI faces. No photo-underlay
- **MAP EXPLAINER primary** — the route, the crevasse, the sledge split, and the ship leaving are all on the map
- **Basemap:** GeoGlobeTales colour — ice that reads as ice, soft mid-contrast, **NO blown white relief**
- **Motion:** GeoArchivez — self-drawing route, always-moving camera, km callouts, distance-to-base counter
- **Loop:** spoken `Because once,` bridges into `Three men set out`
- **Series pullback:** loaded prior routes only; else **pull back over Antarctica and hold**. No invented episode 3. No invented fence. No s29
- **Quality:** Claude designs at best quality; exceed prior Shorts
- **Claude handoff:** paste this brief only after pulling `scaffold/s31-mawson`. Do not summon Claude from a GitHub issue. Do not upload to YouTube. Do not merge.

---

## Deliverables

- Open a PR **or** ship local: `out/s31-mawson.mp4` (and/or `final/s31-mawson.mp4`)
- `final/contact-sheet.jpg` (review before final)
- Loudnorm report on master (~−14 LUFS) **and** a true-peak measurement of the **AAC** (≤ −1.5 dBTP)
- `transcript.json` once Whisper runs on the held VO
- Leave PR open (do not merge). No YouTube upload.

## Success

Premium **map-animation** Short. Kinetic cartography is the picture. Distance-to-base ticks down; the sledge icon snaps in half; the ship leaves the base pin as Mawson arrives. One woolly-hat gag before the crevasse, then none. Snow-camel hidden early, not on the deaths. Portraits are small name cards only. No gore, no cartoon death, no emoji, no AI faces. Ice reads as ice without blown white ridges. Series pullback uses only repo polylines or holds over Antarctica. Incomplete loop on spoken `Because once,`. Contact sheet reviewed. AAC true peak at or under −1.5 dBTP, not just the WAV. Atlas VO at `shorts/s31-mawson/audio/vo.mp3` — pull the branch; do not overwrite it; do not re-record.
