# Shot plan — s14-german-place-names (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo underlay with MG Skylab-style overlays: restrained parallax/crop, kinetic labels, name-swap stamps, 3D map pins. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `69 NAMES`, `WIPED OFF`, `1838`, `HAHNDORF`, `LOBETHAL`, `KLEMZIG`, `1918`, `AMBLESIDE`, `GAZA`, `BIRDWOOD`, `DANISH CAPTAIN`, `ADELAIDE`, `1935`, `NEVER RESTORED`. **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts.
- Crossfade at seams. Final frame should loop back toward the opening hook (`69 NAMES` / wipe motif).
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.

### LOCKED MAP RULE (mandatory)

Whenever maps appear: use **textured satellite** basemaps with a **3D** extruded/tilted treatment — detailed photographic/satellite texture (hills, farmland, towns visible). **NOT** flat schematic, outline, or bare relief-only maps. Claude should build **3D satellite map MG** for wipe/rename beats (town pins vanishing / old→new name callouts over Adelaide Hills–Barossa–metro). File `s14_11_sa_relief_location_underlay.png` is relief-only support — if used, extrude/tilt/crop into Hills detail or replace with a richer textured satellite / DEM basemap. Do **not** show it as a flat schematic hero.

## Beat table

Approximate seams for the held **45.000 s** Atlas VO. Claude must retune against Whisper word timings.

| # | Time (s) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–4.5 | ANIMATE | Dim Adelaide Hills aerial/geo ref (`s14_05_…` crop) or soft `s14_11_…` only as **support under textured satellite 3D MG** | Frame-1 unspoken hook `69 NAMES` (alt `WIPED OFF`); shocked slam; **3D textured-satellite map** with town pins vanishing / wipe motif |
| 2 | 4.5–7.5 | ANIMATE | `s14_08_adelaide_skyline_2022.jpg` — capital tease (do not spoil queen yet) | Soft push-in / sly grade; optional soft capital glow held for twist payoff |
| 3 | 7.5–12.0 | ANIMATE | `s14_04_klemzig_early_painting.jpg` — 1838 settler mood | Storytelling pan; `1838` chip; period village crop |
| 4 | 12.0–16.5 | ANIMATE | `s14_01_…` / `s14_02_…` Hahndorf + inset `s14_03_…` Lobethal (+ `s14_04` recall) | Kinetic town labels `HAHNDORF` / `LOBETHAL` / `KLEMZIG`; photo underlay swaps; text_pop |
| 5 | 16.5–22.5 | ANIMATE | `s14_10_tweedvale_lobethal_bush_scene.jpg` (wartime Tweedvale caption colour) under **3D textured-satellite map** | Tense `1918` stamp; name wipe energy on 3D satellite map — old labels strike-through / fade |
| 6 | 22.5–28.5 | ANIMATE | **3D textured-satellite map** primary + `s14_07_general_birdwood_gallipoli_1915.jpg` + aerial `s14_05_…` | Name-swap titles: Hahndorf→`AMBLESIDE`, Klemzig→`GAZA`, Blumberg→`BIRDWOOD`; Ambleside = railway station (not a general); Birdwood = Gallipoli general; paper_rustle / typewriter optional |
| 7 | 28.5–33.0 | ANIMATE | `s14_09_captain_dirk_meinerts_hahn.jpg` — Danish captain irony | Amused hold; `DANISH CAPTAIN` / `HAHN` chip — **not** “German captain” |
| 8 | 33.0–38.5 | ANIMATE | `s14_06_queen_adelaide_beechey.jpg` → `s14_08_adelaide_skyline_2022.jpg` | Twist slam; `ADELAIDE` + soft “German-born queen” label; capital was **never** on the 69 list |
| 9 | 38.5–42.5 | ANIMATE | Modern Hahndorf `s14_01_`/`s14_02_` vs Birdwood aerial `s14_05_` | `1935` restore chip on Hahndorf; `NEVER RESTORED` / still-Birdwood on aerial; Lobethal+Klemzig also restored 1935 (docs soft — VO focuses Hahndorf) |
| 10 | 42.5–45.000 | ANIMATE | Return to **3D textured-satellite map** wipe motif | Incomplete loop line; hard cut / whip back to beat-1 `69 NAMES` energy |

## Still inventory / factual guardrails

1. Hahndorf St Paul’s Lutheran — settler town / 1935 restoration.
2. Hahndorf Main Street — German-heritage streetscape.
3. Lobethal Lutheran church & school — named settler town (also restored 1935 from Tweedvale).
4. Early Klemzig painting — 1838-era settler village; Klemzig→Gaza (restored 1935).
5. Birdwood aerial 2023 — Blumberg→Birdwood (**name kept**); detailed geography ref for 3D satellite map.
6. Queen Adelaide (Beechey) — German-born (Saxe-Meiningen); capital never renamed.
7. Gen. Birdwood at Gallipoli, May 1915 — Blumberg→Birdwood rename.
8. Adelaide skyline — capital tease / twist payoff.
9. Capt. Dirk Meinerts Hahn — **Danish-born** *Zebra* master; naming irony.
10. Bush scene at Tweedvale (Lobethal) — wartime name colour for Lobethal.
11. SA relief locator PNG — **underlay support only** for 3D MG; replace/augment with **textured satellite** basemap — never flat schematic hero.

No AI historical reconstructions. Soft facts: 69 gazette ok / ~69 on-screen if hedge; Ambleside = railway station not Gallipoli general; Queen Adelaide German-born Saxe-Meiningen; Hahn Danish-born; Hahndorf restored 1935 with Lobethal/Klemzig; Birdwood stayed.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (**45.000 s**); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Silent Descent** by Eugenio Mininni, Mixkit Stock Music Free Licence (shocked → tense → twist → incomplete loop; dramatic documentary intrigue, not slapstick). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus optional `paper_rustle.mp3` (map / gazette / rename colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix** (PR #23) so static VO gain does not hard-clip before master loudnorm. Do **not** reintroduce single-pass VO `loudnorm` before amix (that ate ~3 s of VO tail on s09). Main’s `mix-audio.mjs` may still show the old path — **port the fixed mixer from PR #21 / #23 / #25** if needed.
