# Shot plan — s30-rabbit-proof-fence (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in this folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** a photo slideshow.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km** callouts. Secondary: `/workspace/geoarchivez-scripts/raw/` Pan American Highway sample.
- **Basemap look (locked):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, slight atmospheric edge haze OK, **no blown-out white relief highlights**. Crisp thin white distance lines with arrowheads; bold white labels + drop shadow; yellow km callouts.
- Continuous map motion: the **rabbit-proof fence self-draws** as a glowing guiding thread; camera tracks the girls north along it. Camera **always moving**.
- **First frame:** Western Australia; faint glowing fence; three trails starting south of it; unspoken hook **`1,600 km. NO MAP`**.
- **Visual gags: NONE.** No cartoon jokes, no emoji, no cute rabbits as comic relief, no caricature, no gore. Children are never depicted in a sexual or exploitative way. **Prefer the map.** Do not generate AI faces of the girls or of Aboriginal people.
- Photos: **no clearly free portrait** of Molly Craig (Molly Kelly), Daisy Kadibil, or Gracie Cross was found (see `images/SOURCES.md`). **Map labels only.** Do not substitute the Fairfield NSW “Mollie Craig” photos — that is a different person.
- Captions ~70% from the top (lower-middle), clear of graphics. Extra MG text = labels only (`MOLLY`, `DAISY`, `GRACIE`, `1931`, `JIGALONG`, `MOORE RIVER`, `PERTH`, `1,600 km`, `NINE WEEKS`). No VO-echo title cards. Frame-1 hook: **`1,600 km. NO MAP`**.
- **On-screen names:** Molly, Daisy, Gracie. Spellings locked.
- **Place labels (confirmed, labels only — do not add them to the spoken words):** the remote desert community is **Jigalong**; the government camp near Perth is **Moore River** (Moore River Native Settlement). Do **not** name the “nearby town” (do not print Wiluna, Meekatharra, or any other town the script does not say). Do not print daughter names (Doris, Annabelle) — the script does not say them.
- **Series:** Impossible Journeys **episode 5**. At the series line the route joins the master map and the camera pulls back over prior IJ routes **only if their polylines load**. Otherwise **pull back over Western Australia and hold**.
- **Incomplete loop:** spoken `Because it all began with` → open hook / “Three girls.”
- **Atlas VO:** already at `audio/vo.mp3` (**94.392 s**). **Claude must not re-record. Do not overwrite `vo.mp3`.**
- Australian English. Do not rewrite the spoken words.

## Hook

- **Primary (frame 1 only, never spoken):** `1,600 km. NO MAP`
- **Alternates:** `FOLLOW THE FENCE` · `1931`

## Beat table (skeleton — Claude expands + retunes to Whisper once VO is held)

| # | VO cue | Mode | Named motion |
|---|---|---|---|
| 1 | Three girls / 1,600 kilometres / No map / walked home | ANIMATE (map) | **First frame.** WA satellite; unspoken hook `1,600 km. NO MAP`; three trails; camera drifting. No faces |
| 2 | 1931 / Molly about 14 / Daisy about 8 / Gracie about 11 | ANIMATE (map) | Three trail labels `MOLLY` `DAISY` `GRACIE`; soft `1931` chip. Ages as spoken (“about”). No portraits |
| 3 | Aboriginal girls / families / remote desert community / Western Australia | ANIMATE (map) | Community pin **`JIGALONG`** in the desert north; families as map presence only (pins), not people drawings |
| 4 | government policy / children of mixed parents taken from mothers | ANIMATE (map) | Quiet darken of the community. No cartoon officials. No names the script does not say |
| 5 | taken / far to the south / government camp near Perth | ANIMATE (map) | Camera rides south; pin **`MOORE RIVER`** near **`PERTH`**. Distance callout `1,600 km` |
| 6 | The very next day, Molly leads them out | ANIMATE (map) | Three trails leave the camp pin the next beat. Day counter starts at the escape |
| 7 | one plan / rabbit-proof fence / runs across the whole state / passes right by home | ANIMATE (map) | **Fence self-draws** north–south across WA and **glows like a guiding thread**. It passes the Jigalong pin. Label `RABBIT-PROOF FENCE`. Not a cute rabbit |
| 8 | tracker / hides footprints / rabbit burrows / catch rabbits / flooded river | ANIMATE (map) | A faint pursuit dash loses the trails (footprints hidden). Burrows, food, and the river are **map state** (a soft burrow notch, a river crossing), not comic animals and not gore |
| 9 | For weeks / follow the fence north / farms, sand dunes and salt lakes | ANIMATE (map) | Camera tracks the glowing fence north. Farms → dunes → salt lakes as land texture under the line. **Day counter ticks** |
| 10 | Gracie / mother might be in a nearby town / caught | ANIMATE (map) | **Three footprint trails become two.** Gracie’s trail turns off toward an **unnamed** town pin and stops. Do not label the town. No capture illustration |
| 11 | nine weeks / Molly and Daisy / walk back into their community / Home | ANIMATE (map) | **Two trails reach the Jigalong pin.** Yellow `NINE WEEKS` / `1,600 km`. Hold on Home |
| 12 | Ten years later / same camp / two daughters / escapes again / carrying her baby / walks home a second time | ANIMATE (map) | Time chip. Second glowing thread leaves Moore River. One trail returns north along the fence. Baby is **not drawn** — same trail only. No child illustration |
| 13 | leave her older daughter behind / won’t see each other / over twenty years | ANIMATE (map) | One quiet pin **stays at Moore River**. The returning trail reaches Jigalong. Soft `20+ YEARS` callout. No faces, no reunion photo |
| 14 | taught everywhere / a like helps more people find it | ANIMATE (map) | Hold the two-trail home. No like-button mascot, no emoji |
| 15 | episode five of Impossible Journeys / which journey to map next | ANIMATE (map) | This fence route turns to join the **master map**; camera pulls back. See geography lock. Series chip `EPISODE 5` |
| 16 | Because it all began with | ANIMATE (map) | Incomplete loop → first-frame fence / three trails / `1,600 km. NO MAP` → “Three girls.” |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s. Stimulus is geographic, not gag comedy.

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Jigalong, WA | The remote desert community the script describes. Confirmed: Molly Craig was from Jigalong and the 1931 walk home was back to Jigalong (Wikipedia *Molly Craig*; AIATSIS catalogue note on Doris Pilkington, *Follow the Rabbit-Proof Fence*). Label **`JIGALONG`**. Do not add “Martu” or other facts into the VO. |
| Moore River, WA | The government camp near Perth. Confirmed as Moore River Native Settlement (same sources). Label **`MOORE RIVER`**. Do not add Neville, dormitory conditions, or dates the script does not say. |
| Perth, WA | Spoken. Southern reference pin only. |
| Rabbit-proof fence | A fence built to stop rabbits that runs across Western Australia and passes by home (Jigalong), as spoken. Draw it as one glowing north–south thread the walk follows. Do not turn it into a rabbit character. |
| Nearby town | **Unnamed on screen.** Gracie’s trail leaves the fence and stops. Do not print a town name. |
| Second walk | Same camp → home again, ten years later, as spoken. Older daughter’s pin stays at the camp. Do not name the daughters. |
| Western Australia | The whole map. Deep navy Indian Ocean to the west. No blown white relief. |

**Route language:** thick glowing fence thread (guiding line) + soft drop shadow; three then two footprint trails in a quieter colour; yellow km/day callouts. Second walk is the same fence thread, not a new invented corridor.

### Master map (series line only)

Confirmed episode numbers — do not renumber, do not draw s29:

| Episode | Short | Where the polyline actually is |
|---------|--------|--------------------------------|
| 1 | s26 Mary Bryant | Commit `f83a646` (`origin/claude/model-opus-0zaqim` and `origin/claude/model-opus-8eaepb`): escape route in that episode’s render. Also stored as `mary.escape` inside `3db0f94:shorts/s27-bert-hinkler/render/geo.json`. |
| 2 | s27 Bert Hinkler | Commit `3db0f94` (`origin/claude/model-opus-8eaepb`): `shorts/s27-bert-hinkler/render/geo.json` key **`routes.flight`** (England → Australia). Do not swap in `routes.home`. |
| 3 | — | **No episode-3 folder.** Do not invent a route. |
| 4 | s28 Robyn Davidson | `origin/claude/s28-robyn-davidson-map-gwcpin`: `shorts/s28-robyn-davidson/render/scenes.js` const **`WAY`**. |
| — | s29 Darwin Stuck | **Not Impossible Journeys.** Do not draw it. |
| 5 | this short | The fence walk, once drawn. |

These polylines are **in the repo but not on this branch**. Load them with `git show` of those paths. **Do not invent coordinates.** If you cannot load a prior route, leave it off the master map. If you cannot load them at all: **pull back over Western Australia and hold** (this fence route still visible). Do not fake Mary, Bert, or Robyn.

## Audio

- `audio/vo.mp3` — Atlas en-AU already seated (**94.392 s**). **Claude must not re-record. Do not overwrite.**
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) — already in the repo from s26 / s27 / s28; copied here to `music/music.mp3` and `audio/music.mp3` (~205.9 s). Credit it. Seat ~**4 dB quieter** than the s18 original Silent Descent bed level under VO before master loudnorm. Keep it restrained. Do not drop into comedy stingers. No extra music download.
- Mix: measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS / true peak ≤ −1.5 dBTP. Do **not** use a one-pass mix that flattens the voice.
- Sparse SFX under the voice (~4–8, not dense whooshes): fence draw, soft day-counter tick, trail split when Gracie is caught, arrival at the community pin, quiet series pullback. VO-only stretches required. No sad-horn gag, no record-scratch joke, no rabbit squeak. Shared kit is in `sfx/`.

## Dignity (locked)

- Stolen Generations. Respectful, quiet, powerful.
- No cartoon jokes, no emoji, no cute rabbits, no caricature of Aboriginal people or of the tracker, no gore.
- Children never depicted sexually or exploitatively. Prefer trails and pins over bodies. No AI faces. No film stills. No actor likenesses (the 2002 film is not a source of pictures).
- “Catch rabbits to eat” and “sleep in rabbit burrows” stay geographic. Do not illustrate killing.
- The daughter left behind is a pin that stays, not a crying-child drawing.
