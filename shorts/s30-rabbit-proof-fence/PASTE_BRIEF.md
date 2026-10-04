# s30 Rabbit-Proof Fence — Claude Code brief (paste-ready)

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `shorts/s30-rabbit-proof-fence/`  
Branch: **`scaffold/s30-rabbit-proof-fence`** — **pull this scaffold branch first** before building.  
Mode: **MAP EXPLAINER** (kinetic cartography primary) — **NOT** a photo slideshow.  
Series: **Impossible Journeys — episode 5**. Confirmed from prior PASTE_BRIEFs: s26 Mary Bryant was **episode 1**; s27 Bert Hinkler was **episode 2**; s28 Robyn Davidson was **episode 4**. There is **no episode-3 folder** — do not invent episode 3 and do not renumber this short. **s29 Darwin Stuck is not this series** (it is the lf01 teaser). Do not draw it on the master map.

**Australian English** in all spelled facts and on-screen labels. On-screen names: **Molly**, **Daisy**, **Gracie**. Do **not** rewrite the spoken words.

**Handoff:** the user pastes this file into Claude Code. Do **not** post a GitHub comment that summons Claude. Do **not** `@claude`. The user pastes this file into Claude Code themselves.

**VO:** Atlas en-AU will already be at `shorts/s30-rabbit-proof-fence/audio/vo.mp3` before this paste (seated by Video Production; not in the scaffold commit). **Claude must not re-record it.** Do not overwrite `vo.mp3`. Do not record a new VO. Whisper-retune seams to that recording. Do not invent timings before VO lands.

---

## Goal

Design, animate, mix and render History Short **s30 Rabbit-Proof Fence** (1931 walk home along the fence; second walk ten years later) at best quality — exceed prior Shorts. Claude owns `scenes.js`. Production never hand-designs scenes. **Do not upload to YouTube. Do not merge the PR.**

This is the **Stolen Generations**. Quiet and powerful. **Visual gags: NONE.**

---

## MAP EXPLAINER — standing quality bar (locked)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km/day callouts. **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.

Read also: `shorts/s30-rabbit-proof-fence/MAP_EXPLAINER_MODE.md` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

Map quality, in full: rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, **NO blown-out white relief highlights** on terrain, slight atmospheric edge haze OK, crisp thin white distance lines with arrowheads, bold white labels + drop shadow, yellow km callouts.

---

## Stack (non-negotiable)

- Vertical **1080×1920 @ 30 fps**
- **SVG + `renderFrame(t)` + Playwright + ffmpeg ONLY**
- **No Remotion** (no Remotion CLI, no `src/episodes` compositions)
- Reuse `shorts/shared/render/`; put episode scenes in `shorts/s30-rabbit-proof-fence/render/scenes.js`
- **Do not write placeholder / basic SVG** — design at best quality from the start
- Captions ~70% from the top, clear of graphics; never overlapping graphics; no VO-echo title cards
- Hook card **frame 1 only**: `1,600 km. NO MAP` — **NEVER spoken**
- Sparse intentional SFX under the voice. **Not dense whooshes.**
- Mix: measure VO → static gain + `apad` → float `amix` → **two-pass loudnorm** master only ~**−14 LUFS** / true peak ≤ **−1.5 dBTP**. Do **not** use a one-pass mix that flattens the voice

---

## Hook (on-screen only — never spoken)

**Frame-1 hook card:** `1,600 km. NO MAP`

One strong hook slam on frame 1. **Not** a VO-echo title restating the opening sentence.

### First frame (locked)

Western Australia on a GeoGlobeTales-style satellite map. The rabbit-proof fence is already a faint glowing thread running north–south. Three small trails are south of it, just starting to move. Unspoken hook **`1,600 km. NO MAP`**. Camera already drifting. **No faces.**

---

## Full spoken script (Atlas VO)

Emotion cues in `()` are **performance only — never spoken**. Do not add facts. Do not change these words.

(fast, intense) Three girls. 1,600 kilometres. No map. And they walked home.
(serious) 1931. Molly is about 14. Her little sister Daisy is about 8. Their cousin Gracie is about 11.
(storytelling) They’re Aboriginal girls who live with their families in a remote desert community in Western Australia.
(dark) Back then, government policy takes children of mixed Aboriginal and white parents away from their mothers.
(dark) So the three girls are taken, and sent far to the south, to a government camp near Perth.
(tense) The very next day, Molly leads them out.
(fast) She has one plan. Find the rabbit-proof fence, a fence built to stop rabbits that runs across the whole state. It passes right by home.
(tense) A tracker is sent after them. Molly hides their footprints. They sleep in rabbit burrows, catch rabbits to eat, and wade across a flooded river.
(awed) For weeks, they follow the fence north, across farms, sand dunes and salt lakes.
(dark) Then Gracie hears her mother might be in a nearby town. She goes to find her… and is caught.
(awed) But nine weeks after escaping, Molly and Daisy walk back into their community. Home.
(twist, slow) Ten years later, Molly is taken back to the same camp, this time with her two daughters. And she escapes again, carrying her baby, and walks home a second time.
(serious) But she has to leave her older daughter behind. They won’t see each other again for over twenty years.
(serious) If you think this story should be taught everywhere, a like helps more people find it.
(warm, serious) That’s episode five of Impossible Journeys. Follow along, and tell us which journey to map next.
(loop) Because it all began with

**Spoken word count:** 269 (excl. emotion cues).  
**Incomplete loop:** closing mid-phrase bridges into the open. The camera should be set so the first frame can loop:

`…Because it all began with` → *[match-cut on the fence thread / three trails / `1,600 km. NO MAP`]* → `Three girls.`

The loop line **“Because it all began with” is spoken** and should complete into “Three girls.”

---

## Visual gags

**NONE.** Do not invent any. No cartoon jokes, no emoji, no cute rabbits as comic relief, no caricature, no gore.

### Quiet map moments (must stage)

1. **Fence line glowing like a guiding thread** — self-drawing, tracked by the camera, from the moment they find it through the walk north.
2. **A day counter ticking** across “for weeks” and paying off at “nine weeks”. Do not invent a diary of days the script does not say.
3. **Three footprint trails become two** when Gracie is caught. Her trail leaves toward an **unnamed** town and stops. No capture scene.
4. **Two trails reach the community pin.** Home.
5. **Series line:** this route joins the Impossible Journeys master map and the camera pulls back to show every prior IJ route you can actually load. If you cannot load them: **pull back over Western Australia and hold**.

### Dignity (locked)

- This is the Stolen Generations. Quiet, powerful, respectful.
- No emoji. No cute rabbits. No caricature of the girls, their families, or the tracker.
- No gore. “Catch rabbits to eat” is not a killing shot. Burrows are a map notch, not a cartoon den.
- Children are never depicted in a sexual or exploitative way. Prefer the map: trails and pins, not bodies.
- **Do not generate AI faces** of the girls or of Aboriginal people. Do not use 2002 film stills or actor likenesses.
- The baby and the older daughter are **not illustrated**. Second walk = the fence thread again. The daughter left behind = one pin that stays at the camp. No reunion photo. No crying-child drawing.

### Portrait lock

**No clearly free photo** of Molly Craig (Molly Kelly), Daisy Kadibil, or Gracie Cross was found on Wikimedia Commons, their Wikipedia articles (no images), or a clearly free SLWA record (searched 4 Oct 2026). **Use map labels only.** Do not download the Fairfield City “Mollie Craig” photos — that is a different person in Smithfield, NSW. Document stays in `images/SOURCES.md`.

---

## Beat plan (ANIMATE vs STILL)

Approximate seams — **retune to Whisper** once Atlas VO is held at `audio/vo.mp3`. Do not overwrite `vo.mp3`. Do not re-record.

| # | Beat (VO cue) | Mode | Treatment |
|---|---|---|---|
| 1 | Three girls / 1,600 km / No map / walked home | ANIMATE (map) | First frame; hook `1,600 km. NO MAP`; three trails; camera drifting |
| 2 | 1931 / Molly ~14 / Daisy ~8 / Gracie ~11 | ANIMATE (map) | Labels `MOLLY` `DAISY` `GRACIE`; chip `1931`. No portraits |
| 3 | Aboriginal girls / families / remote desert community | ANIMATE (map) | Pin **`JIGALONG`**. Families as pins only |
| 4 | policy / children taken from mothers | ANIMATE (map) | Quiet darken. No cartoon officials |
| 5 | taken south / government camp near Perth | ANIMATE (map) | Ride south; pins **`MOORE RIVER`** and **`PERTH`**; `1,600 km` |
| 6 | next day / Molly leads them out | ANIMATE (map) | Three trails leave the camp |
| 7 | rabbit-proof fence / across the state / passes by home | ANIMATE (map) | **Fence self-draws and glows** past Jigalong. Label `RABBIT-PROOF FENCE` |
| 8 | tracker / hides footprints / burrows / rabbits / flooded river | ANIMATE (map) | Pursuit dash loses the trails. River crossing on the map. No comic rabbits. No gore |
| 9 | for weeks / fence north / farms, dunes, salt lakes | ANIMATE (map) | Camera tracks the thread. Land changes under it. **Day counter ticks** |
| 10 | Gracie / nearby town / caught | ANIMATE (map) | **Three trails become two.** Unnamed town. Trail stops. No capture picture |
| 11 | nine weeks / Molly and Daisy / community / Home | ANIMATE (map) | **Two trails reach Jigalong.** `NINE WEEKS` |
| 12 | ten years later / same camp / two daughters / escapes / baby / second time | ANIMATE (map) | Second thread on the same fence. No baby drawing |
| 13 | older daughter left behind / over twenty years | ANIMATE (map) | One pin stays at Moore River. `20+ YEARS` |
| 14 | taught everywhere / a like helps | ANIMATE (map) | Hold. No emoji. No mascot |
| 15 | episode five / which journey to map next | ANIMATE (map) | Master-map pullback — loaded routes only, else **pull back over Western Australia and hold** |
| 16 | Because it all began with | ANIMATE (map) | Loop into “Three girls.” |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s.

### Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Jigalong, WA | Label for the remote desert community. Confirmed (Wikipedia *Molly Craig*; AIATSIS note on Pilkington’s *Follow the Rabbit-Proof Fence*). Do not add extra facts to the VO. |
| Moore River, WA | Label for the government camp near Perth. Moore River Native Settlement. Same sources. |
| Perth | Spoken. Pin only. |
| Nearby town | **Do not name it.** |
| Daughters | **Do not name them.** |
| Fence | One north–south glowing thread across Western Australia that the walk follows, passing by Jigalong, as the script says. |

**Route:** glowing self-drawing fence + footprint trails (three, then two, then the second walk). Yellow km/day callouts. Soft drop shadow. No blown white relief.

### Master map

At “That’s episode five…”, join **this** fence route to the master map and pull back.

Only draw a prior journey if you load its **actual polyline** from the repo (these commits are not on this branch; `git show` them — do not retype a guess):

- **Episode 1 — Mary Bryant:** commit `f83a646`, or `mary.escape` inside `3db0f94:shorts/s27-bert-hinkler/render/geo.json`.
- **Episode 2 — Bert Hinkler:** commit `3db0f94`, `shorts/s27-bert-hinkler/render/geo.json` key **`routes.flight`** only.
- **Episode 3:** no folder. **Do not invent a route.**
- **Episode 4 — Robyn Davidson:** `origin/claude/s28-robyn-davidson-map-gwcpin` `shorts/s28-robyn-davidson/render/scenes.js` const **`WAY`**.
- **s29 Darwin Stuck:** not this series. Do not draw it.

If you cannot load those polylines: **pull back over Western Australia and hold**. Do not fake other journeys.

---

## Asset notes

- **Music seated:** `audio/music.mp3` / `music/music.mp3` — **Skyline** by Eugenio Mininni (Mixkit Free Licence, id **601**, ~205.9 s). Already in the repo from the other Impossible Journeys shorts; copied in, not freshly downloaded. Credit it. Seat ~**4 dB quieter** than the s18 original Silent Descent bed under VO. Do not download other music.
- Shared Mixkit SFX kit seated in `sfx/`. Use it **sparingly** (about 4–8 cues, clearly under VO, with VO-only stretches). No dense whooshes. No joke stingers.
- **No portrait stills.** Map labels only.
- Basemap: Claude builds a GeoGlobeTales-quality satellite canvas (no blown white relief).

---

## Style locks (verbatim)

- **Atlas VO:** fast intense → serious → storytelling → dark → tense → fast → awed → dark → twist slow → serious → warm serious → loop; start instantly; Australian English; never speak `()` cues; never speak the hook; **VO will be at `shorts/s30-rabbit-proof-fence/audio/vo.mp3` before paste; Claude must not re-record it**; do not overwrite; Whisper-retune seams to it
- **Captions** ~70% from the top; clear of graphics; no VO-echo big titles; labels for names/places/distances/dates only
- **Sparse SFX** under the voice; not dense whooshes; VO-only stretches
- **Music:** Skyline (Mixkit 601), already copied in; credit Eugenio Mininni / Mixkit; seat ~4 dB quieter than the s18 Silent Descent bed
- **Mix:** measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS / true peak ≤ −1.5 dBTP. Do not flatten the voice with a one-pass mix
- **Humour:** none. No visual gags. Dignity lock above
- **Images:** no free portrait found; map labels only; no emoji; no AI faces; no film stills
- **MAP EXPLAINER primary** — maps carry the story
- **Basemap:** GeoGlobeTales quality — rich satellite, soft mid-contrast, **NO blown white relief**
- **Motion:** GeoArchivez — self-drawing fence, always-moving camera, km/day callouts
- **Loop:** spoken `Because it all began with` bridges into `Three girls.`
- **Series pullback:** loaded prior routes only; else **pull back over Western Australia and hold**
- **Quality:** Claude designs at best quality; exceed prior Shorts
- **Claude handoff:** paste this brief only after pulling `scaffold/s30-rabbit-proof-fence`. Do not summon Claude from a GitHub issue. Do not upload to YouTube. Do not merge.

---

## Deliverables

- Open a PR **or** ship local: `out/s30-rabbit-proof-fence.mp4` (and/or `final/s30-rabbit-proof-fence.mp4`)
- `final/contact-sheet.jpg` (review before final)
- Loudnorm report on master (~−14 LUFS, true peak ≤ −1.5 dBTP)
- `transcript.json` once Whisper runs on the held VO
- Leave PR open (do not merge). No YouTube upload.

## Success

Premium **map-explainer** Short matching the GeoArchivez motion bar + GeoGlobeTales lighting lock. Fence glows as a guiding thread; day counter ticks; three trails become two; two trails reach Jigalong; second walk leaves one pin at Moore River. No gags, no portraits, no emoji. Series pullback uses only repo polylines or holds over Western Australia. Incomplete loop on spoken `Because it all began with`. Contact sheet reviewed, loudnorm clean. Atlas VO at `shorts/s30-rabbit-proof-fence/audio/vo.mp3` — do not overwrite it; do not re-record.
