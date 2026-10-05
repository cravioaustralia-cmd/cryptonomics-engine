# Shot plan — s32-phar-lap (scaffold skeleton) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **THIS EPISODE IS MAP ANIMATION (locked).** Kinetic cartography is the picture, not a photo-underlay. Read `MAP_EXPLAINER_MODE.md` in this folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km** callouts. Secondary: `/workspace/geoarchivez-scripts/raw/` Pan American Highway sample.
- **Basemap look (locked):** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich natural colour, deep navy ocean with subtle bathymetry, soft balanced lighting, slight atmospheric edge haze OK, **no blown-out white relief highlights**.
- Continuous map motion: the **horse route self-draws** (Timaru → Sydney → Pacific → Mexico); camera tracks the icon. Camera **always moving**.
- **The route, the catalogue, the near-miss duck, the three-city split, and the Flemington crowd camel are all on the map.**
- **First frame:** Tasman Sea map; chestnut horse icon gallops Timaru → Sydney; dotted Pacific toward Mexico; unspoken hook **`THREE CITIES`**.
- **Visual gags (stage exactly — deadpan only):** warts zoom + boing; catalogue flip over Timaru; near-miss whoosh + duck; three pins `HIDE`/`SKELETON`/`HEART` + tug-of-war rope across the Tasman; camel hidden in Flemington crowd (series motif, not a joke character). No emoji. No AI faces.
- **Portraits:** public-domain Phar Lap stills are in `images/` (see `images/SOURCES.md`). They are **small name cards only**, not the scene, not an underlay, not full-screen.
- Captions ~70% from the top (lower-middle), clear of graphics. Extra MG text = labels only (`TIMARU`, `SYDNEY`, `PHAR LAP`, `1926`, `1930`, `MELBOURNE CUP`, `FLEMINGTON`, `AGUA CALIENTE`, `TIJUANA`, `MEXICO`, `CALIFORNIA`, `MELBOURNE`, `WELLINGTON`, `CANBERRA`, `HIDE`, `SKELETON`, `HEART`, `37/51`). No VO-echo title cards. Frame-1 hook: **`THREE CITIES`**.
- **Series:** Impossible Journeys **episode 7**. At the series line the route joins the master map and the camera pulls back over prior IJ routes **only if their polylines load**. Otherwise **pull back over the Tasman / Pacific route and hold** (this route still visible).
- **Incomplete loop:** spoken `Because, believe it or not,` → open hook / “Australia’s greatest racehorse…”.
- **Atlas VO:** will be at `audio/vo.mp3` before the brief is pasted. **Claude must not re-record. Do not overwrite `vo.mp3`.** Pull the branch. Whisper-retune to the seated file. Do not invent its duration.
- Australian English. Do not rewrite the spoken words.

## Hook

- **Primary (frame 1 only, never spoken):** `THREE CITIES`
- **Alternates:** `SPLIT UP` · `HIDE · SKELETON · HEART`

## Beat table (skeleton — Claude expands + retunes to Whisper once VO is held)

| # | VO cue | Mode | Named motion |
|---|---|---|---|
| 1 | Australia’s greatest racehorse / born in New Zealand / after he died / three cities split him up | ANIMATE (map) | **First frame.** Tasman Sea satellite; chestnut horse icon gallops Timaru → Sydney; dotted Pacific toward Mexico; unspoken hook `THREE CITIES`. No photo-underlay |
| 2 | 1926 / chestnut foal / near Timaru, New Zealand / Warts all over his head / Nobody’s impressed | ANIMATE (map) | Pin **`TIMARU`**. Foal icon. Chip `1926`. **Gag 1:** cartoon zoom on foal face + little **boing** on “warts” |
| 3 | picked out of a sales catalogue / shipped to Australia / named Phar Lap / lightning / Thai | ANIMATE (map) | **Gag 2:** catalogue page icon flips over Timaru, one entry circled. Route draws Timaru → Sydney. Label `PHAR LAP`. Small PD name card optional, then back to map |
| 4 | starts winning / And winning / Thirty-seven races out of fifty-one | ANIMATE (map) | Win flash / tally chip `37/51` on the Australian map. Camera keeps moving |
| 5 | someone tries to shoot him / days before the 1930 Melbourne Cup | ANIMATE (map) | Push to **Flemington / Melbourne**. Chip `1930` `MELBOURNE CUP`. **Gag 3:** near-miss whoosh; horse icon **ducks**. **Series motif:** tiny unlabelled camel hidden in the Flemington crowd |
| 6 | He wins it anyway | ANIMATE (map) | Triumphant route flash / Cup chip. Crowd holds; camel stays tiny and unlabelled |
| 7 | 1932 / shipped across the Pacific to Mexico / richest race in the world / He wins that too | ANIMATE (map) | Dotted Pacific route self-draws to **Agua Caliente / Tijuana, Mexico**. Labels `AGUA CALIENTE` `TIJUANA` `MEXICO`. Win flash |
| 8 | Just over two weeks later / California / falls suddenly ill / dies | ANIMATE (map) | Short hop to **California** pin. Darken. Icon stops. Label `CALIFORNIA` only (script does not name a town). No gore. No cartoon death |
| 9 | Was he poisoned? / arsenic / sudden infection / argument has never ended | ANIMATE (map) | Twin unsettled labels `ARSENIC?` / `INFECTION?` — question marks stay. No verdict graphic |
| 10 | both countries want him / hide → Melbourne / skeleton → Wellington / heart → Canberra | ANIMATE (map) | **Gag 4:** pins **Melbourne** `HIDE`, **Wellington** `SKELETON`, **Canberra** `HEART` light up; tug-of-war rope stretches across the Tasman |
| 11 | If he’s still your hero / give him a like | ANIMATE (map) | Warm hold on the three pins / route. No emoji CTA art |
| 12 | episode seven of Impossible Journeys / Follow along for the next one | ANIMATE (map) | This route joins the **master map**; camera pulls back. Series chip `EPISODE 7`. No emoji |
| 13 | Because, believe it or not, | ANIMATE (map) | Incomplete loop → first-frame Tasman / horse icon / `THREE CITIES` → “Australia’s greatest racehorse…” |

**Maps carry the story.** Camera never static; new visual stimulus ~every 1.5–2 s. Gags are deadpan and brief.

## Geography lock (correct locations only)

| Place | Notes |
|-------|--------|
| Near Timaru, New Zealand | Birth. Script says “near Timaru”. Seadown Stud (near Timaru) is the historical stud — **do not print Seadown** unless useful as a tiny optional chip; default label **`TIMARU` / `NEAR TIMARU`**. Confirmed 6 Oct 2026 (NMA; Museums Victoria): born 4 Oct 1926 at Seadown Stud near Timaru. |
| Shipped to Australia / Sydney | First-frame route Timaru → Sydney. Script says “shipped to Australia”; Sydney is the locked first-frame landfall. |
| Flemington, Melbourne | 1930 Melbourne Cup. Label **`FLEMINGTON`** / **`MELBOURNE`**. Camel motif lives in this crowd beat. |
| Agua Caliente / Tijuana, Mexico | 1932 richest race = **Agua Caliente Handicap** at Agua Caliente Racetrack, Tijuana, Baja California, Mexico (20 Mar 1932). Confirmed Wikipedia *Agua Caliente Handicap*; NMA; Museums Victoria. Labels **`AGUA CALIENTE`** **`TIJUANA`** **`MEXICO`**. Do not place the race in the USA. |
| California | Death. Script says California only. Menlo Park / Atherton often cited historically — **do not print a town** unless the spoken line names one. Label **`CALIFORNIA`**. |
| Melbourne — hide | Mounted hide at **Melbourne Museum** (Museums Victoria). Pin **`MELBOURNE`** + `HIDE`. |
| Wellington — skeleton | Skeleton at **Museum of New Zealand Te Papa Tongarewa**, Wellington. Pin **`WELLINGTON`** + `SKELETON`. |
| Canberra — heart | Heart at **National Museum of Australia**, Canberra. Pin **`CANBERRA`** + `HEART`. |
| Pacific route | Self-drawing dotted line Australia → Mexico. Deep navy ocean. Soft bathymetry OK. |

**Route language:** thick self-drawing Timaru→Sydney solid + Pacific dotted + soft drop shadow; chestnut horse icon; yellow km callouts where useful; three city pins + rope on the split beat.

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
| 6 | s31 Mawson | Only if a real eastward ice polyline exists on a build branch. Scaffold had no `scenes.js`. **Do not invent Antarctica coordinates.** |
| 7 | this short | Timaru → Sydney → Pacific → Mexico + three-city split pins, once drawn. |

These polylines are **not on this branch**. Load them with `git show` of those paths. **Do not invent coordinates** for other journeys. If you cannot load a prior route, leave it off the master map. If you cannot load them at all: **pull back over the Tasman / Pacific route and hold** (this route still visible). Do not fake Mary, Bert, Robyn, the fence, or Mawson.

## Audio

- `audio/vo.mp3` — Atlas en-AU, **seated before paste**. **Claude must not re-record. Do not overwrite.** This scaffold does not commit the VO.
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**) — already in the repo; copied here from `origin/scaffold/s31-mawson` (same file as s30 / s26 / s27 / s28) to `music/music.mp3` and `audio/music.mp3` (~205.9 s). Credit it. Seat ~**4 dB quieter** than the s18 original Silent Descent bed level under VO before master loudnorm. Keep it restrained. No comedy stingers. No extra music download.
- Mix: measure VO → static gain + apad → float amix → **two-pass loudnorm** ~−14 LUFS. **True peak of the AAC file (the audio inside the delivered master), not just the WAV, must be ≤ −1.5 dBTP.** The s30 AAC master peaked at **−1.32 dBTP**. Leave headroom: aim the WAV limiter lower (about −2.0 to −2.5 dBTP) and **measure the AAC after encode**. If the AAC is over −1.5, lower the limiter and re-encode. Do not report only the WAV peak. Do **not** use a one-pass mix that flattens the voice.
- Sparse SFX under the voice (~6–10, not dense whooshes): route draw, catalogue flip / paper, boing, near-miss whoosh, duck, pin lights, rope stretch. VO-only stretches required. Shared kit is in `sfx/`; use record-scratch only if it clearly earns a beat (prefer leave unused).

## Dignity / gag lock

- Death in California: map state only. No gore. No cartoon death.
- Poison argument: twin question labels, no verdict.
- Three-city split is the big gag — deadpan tug-of-war, not slapstick mutilation comedy.
- Camel in Flemington crowd is series motif, unlabelled, not a character.
- No emoji. No AI faces. No generated “historical” scenes.
- Real photos are small name cards only.
