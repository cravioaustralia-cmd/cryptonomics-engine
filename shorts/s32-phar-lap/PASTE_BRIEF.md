**HARD LINE — MAP ANIMATION.** This Short is map-animation type. Kinetic cartography is the picture, not a photo-underlay. Real photos, if seated, are small name cards only, not the scene. The Tasman route, the catalogue flip, the near-miss duck, the three-city split pins, and the Flemington crowd camel are all on the map.

# s32 Phar Lap — Claude Code brief (paste-ready)

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `shorts/s32-phar-lap/`  
Branch: **`scaffold/s32-phar-lap`** — **pull this scaffold branch first** before building.  
Mode: **MAP ANIMATION / MAP EXPLAINER** (kinetic cartography is the picture) — **NOT** a photo-underlay and **NOT** a photo slideshow.  
Series: **Impossible Journeys — episode 7**. Confirmed from prior PASTE_BRIEFs: s26 Mary Bryant was **episode 1**; s27 Bert Hinkler was **episode 2**; s28 Robyn Davidson was **episode 4**. There is **no episode-3 folder** — do not invent episode 3 and do not renumber this short. **s29 Darwin Stuck is not this series** (it is the lf01 teaser). s30 Rabbit-Proof Fence was **episode 5**. s31 Mawson was **episode 6**. Do not draw s29 on the master map.

**Australian English** in all spelled facts and on-screen labels. On-screen names: **Phar Lap**, **Timaru**, **Sydney**, **Flemington**, **Melbourne**, **Agua Caliente**, **Tijuana**, **Mexico**, **California**, **Wellington**, **Canberra**. Do **not** rewrite the spoken words.

**Handoff:** the user pastes this file into Claude Code. Do **not** post a GitHub comment that summons Claude. Do **not** `@claude`. The user pastes this file into Claude Code themselves.

**VO:** Atlas en-AU will be seated at `shorts/s32-phar-lap/audio/vo.mp3` before paste. **Claude must not re-record it.** Do not overwrite `vo.mp3`. Do not record a new VO. Whisper-retune seams to that recording. Do not invent a duration — measure the seated file.

---

## Goal

Design, animate, mix and render History Short **s32 Phar Lap** (1926–1932: NZ foal → Australian champion → Mexico win → California death → three cities split the remains) at best quality — exceed prior Shorts. Claude owns `scenes.js`. Production never hand-designs scenes. **Do not upload to YouTube. Do not merge the PR.**

**The picture is the map.** Not a photo-underlay.

Visual gags are **staged exactly as given**. Deadpan only.

---

## MAP EXPLAINER — standing quality bar (locked)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km callouts. **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich colour, deep navy ocean, soft balanced lighting, **no blown white relief**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.

Read also: `shorts/s32-phar-lap/MAP_EXPLAINER_MODE.md` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

Map quality, in full: deep navy Tasman / Pacific with subtle bathymetry, soft balanced lighting, **NO blown-out white relief highlights** on ridges, slight atmospheric edge haze OK, crisp thin white distance lines with arrowheads, bold white labels + drop shadow, yellow km callouts.

---

## Stack (non-negotiable)

- Vertical **1080×1920 @ 30 fps**
- **SVG + `renderFrame(t)` + Playwright + ffmpeg ONLY**
- **No Remotion** (no Remotion CLI, no `src/episodes` compositions)
- Reuse `shorts/shared/render/`; put episode scenes in `shorts/s32-phar-lap/render/scenes.js`
- **Do not write placeholder / basic SVG** — design at best quality from the start
- Captions ~70% from the top, clear of graphics; never overlapping graphics; no VO-echo title cards
- Hook card **frame 1 only**: `THREE CITIES` — **NEVER spoken**
- Sparse intentional SFX under the voice (~6–10). **Not dense whooshes.**
- Mix: measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm** master only ~**−14 LUFS**. **True peak ≤ −1.5 dBTP on the AAC file, not just the WAV.** The s30 AAC master peaked at **−1.32 dBTP** — leave headroom so the AAC encode (the audio inside the master) measures at or under −1.5. Aim the WAV limiter nearer **−2.0 to −2.5 dBTP**, then measure the AAC. If the AAC is hot, lower the limiter and re-encode. Do not sign off on the WAV peak alone. Do **not** use a one-pass mix that flattens the voice

---

## Hook (on-screen only — never spoken)

**Frame-1 hook card:** `THREE CITIES`

One strong hook slam on frame 1. **Not** a VO-echo title restating the opening sentence. Alternates if needed: `SPLIT UP` · `HIDE · SKELETON · HEART`.

### First frame (locked)

A map of the Tasman Sea: a tiny chestnut horse icon gallops out of Timaru, New Zealand, across the water to Sydney, then a dotted route stretches all the way across the Pacific to Mexico. Unspoken hook **`THREE CITIES`**. Camera already drifting. **No faces filling the frame. No photo-underlay.**

---

## Full spoken script (Atlas VO)

Emotion cues in `()` are **performance only — never spoken**. Do not add facts. Do not change these words.

(fast, amazed) Australia’s greatest racehorse was born in New Zealand… and after he died, three cities split him up.
(storytelling) 1926. A chestnut foal is born near Timaru, New Zealand. Warts all over his head. Nobody’s impressed.
(amused) He’s picked out of a sales catalogue, shipped to Australia, and named Phar Lap. It’s said to mean “lightning” in Thai.
(fast) Then he starts winning. And winning. Thirty-seven races out of fifty-one.
(tense) He’s so good, someone tries to shoot him, days before the 1930 Melbourne Cup.
(triumphant) He wins it anyway.
(fast) In 1932, he’s shipped across the Pacific to Mexico, for the richest race in the world at the time. He wins that too.
(dark) Just over two weeks later, in California, he falls suddenly ill… and dies.
(twist) Was he poisoned? Some say arsenic. Others say a sudden infection. The argument has never ended.
(twist) Then both countries want him. So his hide goes to Melbourne. His skeleton goes to Wellington. And his heart, almost twice the size of a normal horse’s, goes to Canberra.
(warm) If he’s still your hero, give him a like.
(warm) That’s episode seven of Impossible Journeys. Follow along for the next one.
(loop) Because, believe it or not,

**Spoken word count:** 192 (excl. emotion cues).  
**Incomplete loop:** closing mid-phrase bridges into the open. The camera should be set so the first frame can loop:

`…Because, believe it or not,` → *[match-cut on the Tasman map / chestnut horse / `THREE CITIES`]* → `Australia’s greatest racehorse…`

The loop line **“Because, believe it or not,” is spoken** and should complete into “Australia’s greatest racehorse…”.

---

## Visual gags (MUST stage exactly — all on the map)

1. On **“warts”**, a cartoon zoom on the foal icon’s face with a little **“boing”**.
2. On **“picked out of a sales catalogue”**, a catalogue page icon flips over Timaru with one entry circled.
3. On **“someone tries to shoot him”**, a near-miss whoosh, and the horse icon **ducks**.
4. On **“three cities split him up”**, three pins (Melbourne, Wellington, Canberra) light up with **`HIDE`**, **`SKELETON`** and **`HEART`** labels, and a tug-of-war rope stretches across the Tasman.
5. **Series camel motif:** “The camel is hidden in the Flemington crowd” — tiny unlabelled camel in the Melbourne Cup crowd beat. Series motif, **not** a joke character.

Deadpan only. No emoji. No inventing extra gags.

### Portrait lock

Public-domain Phar Lap stills are seated in `images/` (searched Wikimedia Commons, 6 Oct 2026 — see `images/SOURCES.md`):

- `images/s32_phar_lap.jpg` — Phar Lap with jockey Jim Pike at Flemington, c.1930 (Commons `File:Phar_Lap.jpg`, public domain)
- `images/s32_phar_lap_melbourne_cup_1930.jpg` — Phar Lap winning the 1930 Melbourne Cup (Commons `File:Pharlap1930melbournecup.jpg`, public domain; Argus / Picture Australia)

**Small name cards only**, when the name is spoken / Cup beat. Not the scene. Not a photo-underlay. Not full-screen. Do not generate AI faces. Do not swap in copyrighted museum photos that are not in this folder. Do not use the 1983 movie still.

---

## Beat plan (ANIMATE vs STILL)

Approximate seams — **retune to Whisper** on the seated `audio/vo.mp3`. Do not overwrite `vo.mp3`. Do not re-record.

| # | Beat (VO cue) | Mode | Treatment |
|---|---|---|---|
| 1 | Australia’s greatest racehorse / NZ / three cities split him up | ANIMATE (map) | First frame; hook `THREE CITIES`; Timaru→Sydney gallop; Pacific dotted toward Mexico |
| 2 | 1926 / foal / Timaru / warts / Nobody’s impressed | ANIMATE (map) | Timaru pin; **warts zoom + boing** |
| 3 | sales catalogue / shipped to Australia / named Phar Lap / lightning / Thai | ANIMATE (map) | **Catalogue flip** over Timaru; route to Sydney; optional small PD name card |
| 4 | winning / 37 of 51 | ANIMATE (map) | Win tally `37/51` |
| 5 | shoot him / 1930 Melbourne Cup | ANIMATE (map) | Flemington; **near-miss whoosh + duck**; **camel in crowd** |
| 6 | wins it anyway | ANIMATE (map) | Cup triumph flash |
| 7 | 1932 / Pacific / Mexico / richest race / wins that too | ANIMATE (map) | Pacific dotted → **Agua Caliente / Tijuana** |
| 8 | California / ill / dies | ANIMATE (map) | California pin; icon stops; no gore |
| 9 | poisoned? / arsenic / infection / never ended | ANIMATE (map) | Twin question labels; no verdict |
| 10 | both countries / hide Melbourne / skeleton Wellington / heart Canberra | ANIMATE (map) | **Three pins + tug-of-war rope** |
| 11 | still your hero / like | ANIMATE (map) | Warm hold |
| 12 | episode seven / follow along | ANIMATE (map) | Master-map pullback — loaded routes only, else **pull back over Tasman/Pacific and hold** |
| 13 | Because, believe it or not, | ANIMATE (map) | Loop into “Australia’s greatest racehorse…” |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s.

### Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Near Timaru, NZ | Birth. Label `TIMARU` / `NEAR TIMARU`. Seadown Stud is historical context — do not force onto VO. Confirmed 6 Oct 2026 (NMA; Museums Victoria). |
| Sydney / Australia | First-frame landfall after Tasman crossing. |
| Flemington, Melbourne | 1930 Melbourne Cup. Camel motif here. |
| Agua Caliente / Tijuana, Mexico | 1932 Agua Caliente Handicap (richest race of the time). Confirmed Wikipedia *Agua Caliente Handicap*; NMA; Museums Victoria. **Not** a US city. |
| California | Death. Script says California only — do not invent a town label. |
| Melbourne — hide | Melbourne Museum / Museums Victoria. |
| Wellington — skeleton | Te Papa Tongarewa. |
| Canberra — heart | National Museum of Australia. |

**Route:** self-drawing Timaru→Sydney, dotted Pacific→Mexico, three-city pins + rope. Yellow km callouts. Soft drop shadow. No blown white relief.

### Master map

At “That’s episode seven…”, join **this** route to the master map and pull back.

Only draw a prior journey if you load its **actual polyline** from the repo (these commits are not on this branch; `git show` them — do not retype a guess):

- **Episode 1 — Mary Bryant:** commit `f83a646`, or `mary.escape` inside `3db0f94:shorts/s27-bert-hinkler/render/geo.json`.
- **Episode 2 — Bert Hinkler:** commit `3db0f94`, `shorts/s27-bert-hinkler/render/geo.json` key **`routes.flight`** only.
- **Episode 3:** no folder. **Do not invent a route.**
- **Episode 4 — Robyn Davidson:** `origin/claude/s28-robyn-davidson-map-gwcpin` `shorts/s28-robyn-davidson/render/scenes.js` const **`WAY`**.
- **s29 Darwin Stuck:** not this series. Do not draw it.
- **Episode 5 — Rabbit-Proof Fence:** only if a polyline actually exists. The s30 scaffold has no `scenes.js`. **Do not invent the fence.**
- **Episode 6 — Mawson:** only if a real eastward ice polyline exists on a build branch. Scaffold had no `scenes.js`. **Do not invent Antarctica.**

If you cannot load those polylines: **pull back over the Tasman / Pacific route and hold**. Do not fake other journeys.

---

## Asset notes

- **Music seated:** `audio/music.mp3` / `music/music.mp3` — **Skyline** by Eugenio Mininni (Mixkit Free Licence, id **601**, ~205.9 s). Already in the repo; copied from s31 (same file as s26 / s27 / s28 / s30). Not freshly downloaded. Credit it. Seat ~**4 dB quieter** than the s18 original Silent Descent bed under VO. Do not download other music.
- Shared Mixkit SFX kit seated in `sfx/`. Use it **sparingly** (~6–10 cues, clearly under VO, with VO-only stretches). No dense whooshes. Prefer leave `record-scratch.mp3` unused unless a beat clearly earns it.
- **Photos:** the two PD files above, **name cards only**.
- Basemap: Claude builds a GeoGlobeTales-quality satellite canvas.

---

## Style locks (verbatim)

- **Atlas VO:** fast amazed → storytelling → amused → fast → tense → triumphant → fast → dark → twist → twist → warm → warm → loop; start instantly; Australian English; never speak `()` cues; never speak the hook; **VO will be at `shorts/s32-phar-lap/audio/vo.mp3`; Claude must not re-record it**; do not overwrite; Whisper-retune seams to it
- **Captions** ~70% from the top; clear of graphics; no VO-echo big titles; labels for names/places/distances/dates only
- **Sparse SFX** under the voice (~6–10); not dense whooshes; VO-only stretches
- **Music:** Skyline (Mixkit 601), already copied in; credit Eugenio Mininni / Mixkit; seat ~4 dB quieter than the s18 Silent Descent bed
- **Mix:** measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS. **True peak ≤ −1.5 dBTP on the AAC, not just the WAV.** s30’s AAC master peaked at −1.32 dBTP — leave headroom and measure the AAC file. Do not flatten the voice with a one-pass mix
- **Humour:** stage the five listed gags exactly; deadpan only; camel is series motif not a joke character
- **Images:** kinetic cartography is the picture. PD Phar Lap stills as **small name cards only**. No emoji. No AI faces. No photo-underlay. No AI historical stills
- **MAP EXPLAINER primary** — the route, catalogue, duck, three-city split, and crowd camel are all on the map
- **Basemap:** GeoGlobeTales colour — soft mid-contrast, **NO blown white relief**
- **Motion:** GeoArchivez — self-drawing route, always-moving camera, km callouts
- **Loop:** spoken `Because, believe it or not,` bridges into `Australia’s greatest racehorse…`
- **Series pullback:** loaded prior routes only; else **pull back over Tasman/Pacific and hold**. No invented episode 3. No invented fence. No invented Mawson ice path. No s29
- **Quality:** Claude designs at best quality; exceed prior Shorts
- **Claude handoff:** paste this brief only after pulling `scaffold/s32-phar-lap`. Do not summon Claude from a GitHub issue. Do not upload to YouTube. Do not merge.

---

## Deliverables

- Open a PR **or** ship local: `out/s32-phar-lap.mp4` (and/or `final/s32-phar-lap.mp4`)
- `final/contact-sheet.jpg` (review before final)
- Loudnorm report on master (~−14 LUFS) **and** a true-peak measurement of the **AAC** (≤ −1.5 dBTP)
- `transcript.json` once Whisper runs on the held VO
- Leave PR open (do not merge). No YouTube upload.

## Success

Premium **map-animation** Short. Kinetic cartography is the picture. Warts zoom + boing; catalogue flip; near-miss duck; three pins `HIDE`/`SKELETON`/`HEART` with Tasman tug-of-war rope; camel hidden in Flemington crowd. Photos are small name cards only. No gore, no emoji, no AI faces, no photo-underlay. Series pullback uses only repo polylines or holds over this route. Incomplete loop on spoken `Because, believe it or not,`. Contact sheet reviewed. AAC true peak at or under −1.5 dBTP, not just the WAV. Atlas VO at `shorts/s32-phar-lap/audio/vo.mp3` — pull the branch; do not overwrite it; do not re-record.
