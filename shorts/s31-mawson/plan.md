# Shot plan — s31-mawson (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP ANIMATION (locked).** Kinetic cartography is the picture, not a photo-underlay. Read `MAP_EXPLAINER_MODE.md` in this folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km** callouts. Secondary: `/workspace/geoarchivez-scripts/raw/` Pan American Highway sample.
- **Basemap look (locked):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich natural colour, deep navy ocean with subtle bathymetry, soft balanced lighting, slight atmospheric edge haze OK, **no blown-out white relief highlights**. On this episode the land is **ice**: it must read as ice (pale blue-grey, sastrugi texture, crevasse shadow) **without** blown-out white ridges. Crisp thin white distance lines with arrowheads; bold white labels + drop shadow; yellow km callouts.
- Continuous map motion: the **eastward route self-draws**; camera tracks the sledges. Camera **always moving**.
- **The route, the crevasse, the sledge split, and the ship leaving are all on the map.**
- **First frame:** Antarctica ice; three sledges moving east from the base; tiny hidden snow-camel; unspoken hook **`A FEW HOURS`**.
- **Visual gag (once, before the crevasse only):** on “two friends”, British and Swiss flag pins pop beside the sledge icons, each wearing a tiny woolly hat. **No gag after the crevasse.** No gore. No cartoon death. No comic timing. No emoji. No AI faces.
- **Portraits:** three public-domain photographs are in `images/` (see `images/SOURCES.md`). They are **small name cards only**, not the scene, not an underlay, not full-screen.
- Captions ~70% from the top (lower-middle), clear of graphics. Extra MG text = labels only (`MAWSON`, `NINNIS`, `MERTZ`, `1912`, `CAPE DENISON`, `COMMONWEALTH BAY`, `~500 km`, `~160 km`, `DISTANCE TO BASE`, `JANUARY 1913`, `NINNIS GLACIER`, `MERTZ GLACIER`). No VO-echo title cards. Frame-1 hook: **`A FEW HOURS`**.
- **On-screen names (locked):** Mawson, Ninnis, Mertz, Ninnis Glacier, Mertz Glacier.
- **Base labels (confirmed, labels only — do not add them to the spoken words):** **Cape Denison**, **Commonwealth Bay**. Do **not** name the ship. Do **not** print “Black Crevasse”, “14 December 1912”, “8 February 1913”, “Aurora”, or “Far Eastern Party”.
- **Series:** Impossible Journeys **episode 6**. At the series line the route joins the master map and the camera pulls back over prior IJ routes **only if their polylines load**. Otherwise **pull back over Antarctica and hold** (this route still visible).
- **Incomplete loop:** spoken `Because once,` → open hook / “Three men set out”.
- **Atlas VO:** will be at `audio/vo.mp3` before the brief is pasted. **Claude must not re-record. Do not overwrite `vo.mp3`.** Pull the branch. Whisper-retune to the seated file. Do not invent its duration.
- Australian English. Do not rewrite the spoken words.

## Hook

- **Primary (frame 1 only, never spoken):** `A FEW HOURS`
- **Alternates:** `1912` · `EAST`

## Beat table (skeleton — Claude expands + retunes to Whisper once VO is held)

| # | VO cue | Mode | Named motion |
|---|---|---|---|
| 1 | Three men set out / across Antarctica / only one came back / missed his ship / a few hours | ANIMATE (map) | **First frame.** Ice satellite, not blown white; unspoken hook `A FEW HOURS`; three sledge icons already moving east; tiny snow-camel hidden in the ice. No photo-underlay |
| 2 | 1912 / Douglas Mawson / sledge team east from his base / two friends / Belgrave Ninnis / Britain / Xavier Mertz / Switzerland | ANIMATE (map) | Base pin **`CAPE DENISON`** / **`COMMONWEALTH BAY`**. Route starts drawing east. **Only gag:** British flag pin + Swiss flag pin pop beside the sledge icons, each with a tiny woolly hat. Small name cards (real PD portraits) for Mawson, Ninnis, Mertz — cards only, then back to the map. Chip `1912` |
| 3 | Five weeks in / about 500 kilometres from base / Ninnis / hidden crevasse / snow gives way | ANIMATE (map) | **Gags end here.** Hats and flags are gone. Snow-camel is gone. Route reaches a crevasse split in the ice. Callout `~500 km`. Ninnis’s icon drops out of the route — no body, no scream, no cartoon death |
| 4 | He’s gone / tent / most of the food / six best dogs | ANIMATE (map) | Lost-supply labels only: `TENT` `MOST OF THE FOOD` `SIX BEST DOGS`. His trail stops. No gore. No dog illustration |
| 5 | Mawson and Mertz turn back / to survive / eat their remaining dogs | ANIMATE (map) | Two icons turn. **`DISTANCE TO BASE` counter starts ticking down.** Eating is not shown. No butchery. No comic dogs |
| 6 | don’t know / husky liver / vitamin A / poison a human | ANIMATE (map) | Serious label `HUSKY LIVER` / `VITAMIN A` on the return route. Not a joke. Not a science-gag mascot |
| 7 | Mertz grows weaker / January 1913 / he dies | ANIMATE (map) | Mertz’s icon slows and **stops**. Chip `JANUARY 1913`. No cartoon death. No grave comedy |
| 8 | Mawson is alone / about 160 kilometres / saws his sledge in half / crevasse / dangles on a rope / climbs back out | ANIMATE (map) | Counter passes `~160 km`. **Sledge icon physically snaps into two halves.** His icon drops into a second crevasse on a rope line and climbs back out. Suspense, not comedy, not gore |
| 9 | Weeks later / sees his base / ship sailing away / left only hours before | ANIMATE (map) | **Tiny ship icon leaves the base pin just as Mawson’s icon arrives.** He is late by hours. Do not print an hour count. Do not name the ship |
| 10 | survive another whole winter in Antarctica | ANIMATE (map) | The map holds. Winter darkens the ice. One icon stays at the base pin. No gag |
| 11 | Two glaciers / friends’ names / Ninnis Glacier / Mertz Glacier | ANIMATE (map) | Labels **`NINNIS GLACIER`** and **`MERTZ GLACIER`** appear on the eastward ice, in the right places. Warm, still. No joke on the names |
| 12 | episode six of Impossible Journeys / Follow along for the next one | ANIMATE (map) | This route joins the **master map**; camera pulls back. See geography lock. Series chip `EPISODE 6`. No emoji |
| 13 | Because once, | ANIMATE (map) | Incomplete loop → first-frame ice / three sledges / `A FEW HOURS` → “Three men set out” |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s. After the crevasse, stimulus is geographic suspense, not gag comedy.

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Cape Denison, Commonwealth Bay | The base the script means. Confirmed 4 Oct 2026: Australian Antarctic Program — Mawson established the AAE headquarters at Commonwealth Bay in 1912; the huts are at Cape Denison, Commonwealth Bay (https://www.antarctica.gov.au/about-antarctica/history/cultural-heritage/mawsons-huts-cape-denison/). Wikipedia *Cape Denison*: rocky point at the head of Commonwealth Bay; site of the expedition’s main base; approx. 67°00′S, 142°40′E. Label **`CAPE DENISON`** and **`COMMONWEALTH BAY`**. Do not add these names to the spoken words. |
| East from base | Spoken. The route draws east over the ice toward the two glaciers below. Do not invent a western or inland-south corridor. |
| Mertz Glacier | Spoken at the end. Wikipedia *Mertz Glacier* (fetched 4 Oct 2026): heavily crevassed glacier on George V Coast; named for Xavier Mertz; approx. 67°30′S, 144°45′E. Label only on the glacier beat. |
| Ninnis Glacier | Spoken at the end. Wikipedia *Ninnis Glacier* (fetched 4 Oct 2026): glacier on George V Coast; named for B. E. S. Ninnis; approx. 68°22′S, 147°00′E. Label only on the glacier beat. Do **not** print “Black Crevasse” or “14 December 1912” — the script does not say them. |
| ~500 km / ~160 km | As spoken, with “about”. The distance counter uses these anchors. Do not “correct” them to a single unofficial figure, and do not invent daily splits. |
| The ship | A tiny icon only. **Do not name it.** Do not print a date or an hour count. “A few hours” / “only hours before” stays as spoken. |
| Antarctica | The whole map. Deep navy Southern Ocean. Ice reads as ice. **No blown white relief.** |

**Route language:** thick self-drawing eastward line + soft drop shadow; three sledge icons, then two, then one; yellow km callouts; `DISTANCE TO BASE` counting down. Crevasses are dark splits in the ice on that line, not a separate illustrated set.

### Master map (series line only)

Confirmed episode numbers — do not renumber, do not draw s29:

| Episode | Short | Where the polyline actually is |
|---------|--------|--------------------------------|
| 1 | s26 Mary Bryant | Commit `f83a646` (`origin/claude/model-opus-0zaqim` and `origin/claude/model-opus-8eaepb`): escape route in that episode’s render. Also stored as `mary.escape` inside `3db0f94:shorts/s27-bert-hinkler/render/geo.json`. |
| 2 | s27 Bert Hinkler | Commit `3db0f94` (`origin/claude/model-opus-8eaepb`): `shorts/s27-bert-hinkler/render/geo.json` key **`routes.flight`** (England → Australia). Do not swap in `routes.home`. |
| 3 | — | **No episode-3 folder.** Do not invent a route. |
| 4 | s28 Robyn Davidson | `origin/claude/s28-robyn-davidson-map-gwcpin`: `shorts/s28-robyn-davidson/render/scenes.js` const **`WAY`**. |
| — | s29 Darwin Stuck | **Not Impossible Journeys.** Do not draw it. |
| 5 | s30 Rabbit-Proof Fence | Only if a real polyline exists (the s30 scaffold on `origin/scaffold/s30-rabbit-proof-fence` has **no** `scenes.js`). `git show` / search before drawing. **Do not invent the fence.** |
| 6 | this short | The eastward ice route, once drawn. |

These polylines are **not on this branch**. Load them with `git show` of those paths. **Do not invent coordinates** for other journeys. If you cannot load a prior route, leave it off the master map. If you cannot load them at all: **pull back over Antarctica and hold** (this route still visible). Do not fake Mary, Bert, Robyn, or the fence.

## Audio

- `audio/vo.mp3` — Atlas en-AU, **seated before paste**. **Claude must not re-record. Do not overwrite.** This scaffold does not commit the VO.
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) — already in the repo; copied here from `origin/scaffold/s30-rabbit-proof-fence` (same file as s26 / s27 / s28) to `music/music.mp3` and `audio/music.mp3` (~205.9 s). Credit it. Seat ~**4 dB quieter** than the s18 original Silent Descent bed level under VO before master loudnorm. Keep it restrained. No comedy stingers. No extra music download.
- Mix: measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS. **True peak of the AAC file (the audio inside the delivered master), not just the WAV, must be ≤ −1.5 dBTP.** The s30 AAC master peaked at **−1.32 dBTP**. Leave headroom: aim the WAV limiter lower (about −2.0 to −2.5 dBTP) and **measure the AAC after encode**. If the AAC is over −1.5, lower the limiter and re-encode. Do not report only the WAV peak. Do **not** use a one-pass mix that flattens the voice.
- Sparse SFX under the voice (~4–8, not dense whooshes): route draw, distance-counter tick, one restrained sledge-split hit, a low crevasse (not a joke), ship leaving. VO-only stretches required. **No record-scratch. No comedy stinger. No cartoon-death sound. Nothing playful after the crevasse.** Shared kit is in `sfx/`; leave `record-scratch.mp3` unused.

## Dignity (locked)

- Two men die. Respectful. No gore. No cartoon death. No X-eyes, no scream pose, no comic timing after the crevasse.
- The woolly-hat / flag-pin gag exists only on “two friends”, and is gone before “Five weeks in”.
- The snow-camel is a small early motif in the ice, not a joke about the deaths, and it does not appear again after the crevasse.
- “Eat their remaining dogs” and husky-liver poisoning are not illustrated. Labels only. No butchery.
- No emoji. No AI faces. No generated “historical” scenes.
- Real portraits are small name cards only.
