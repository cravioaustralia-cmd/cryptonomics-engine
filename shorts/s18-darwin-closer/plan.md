# Shot plan — s18-darwin-closer (Checkpoint C hand-off) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in this folder. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** Skylab photo-underlay slideshow as the main beat language.
- Continuous map motion: pans, zooms, self-drawing route/distance arcs, capital pins, compare callouts. Camera **always moving**; route line never stops.
- **Beat the Rankora ref** (https://youtube.com/shorts/5IaLp97pUQA): ref has zero numeric distances — we add dynamic **km callouts**, ticking counters, arc labels (Darwin↔Dili ~700 vs Darwin↔Canberra ~3,100, etc.).
- Photos only as **brief credibility inserts** (e.g. WWII Darwin raid still, optional Pearl Harbor compare) — maps carry the story.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `DARWIN`, `CANBERRA`, `DILI`, `PORT MORESBY`, `JAKARTA`, `~700 KM`, `~1,800 KM`, `OVER 3,100 KM`, `19 FEB 1942`, `188`, `SAME COMMANDER`, `PEARL HARBOR` (compare only). **No VO-echo titles** that restate whole spoken sentences.
- Australian English in any spelled facts.
- Crossfade / whip at seams. Final incomplete loop (`Because remember:`) hard-cuts back toward frame-1 `CLOSER THAN CANBERRA` / Darwin pin energy.
- **Held Atlas VO:** `audio/vo.mp3` (**45.336 s**). Retune all seams to Whisper timings from this VO.

### LOCKED MAP STYLE (mandatory)

Real **satellite/topo** basemap (terrain visible under colour); parchment/weathered fills where useful; **thick white outer glow** on land / route borders; bold **3D/extruded labels** + drop shadow; soft shadows on overlays. **Correct locations only:** Darwin · Canberra · Dili · Port Moresby · Jakarta; Pearl Harbor only as labelled compare if needed — **never** wrong geography. Prefer photographic basemaps `s18_02_timor_sea_modis.jpg`, `s18_03_van_diemen_gulf_modis.jpg`, `s18_01_world_topo_basemap_ref.jpg` (crop northern Australia / Timor Sea / Indonesia / PNG corridor). Locator SVGs are **reference only** — rebuild pins/arcs in locked style; do not show flat schematic locators as hero.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` (**45.336 s**).

| # | Time (s) | Mode | Map / brief photo | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–4.5 | ANIMATE (map) | Wide northern Australia / Timor Sea corridor over `s18_02` / `s18_01` crop | Frame-1 unspoken hook **`CLOSER THAN CANBERRA`** (alts `DARWIN 1942` / `3100 KM` / `SAME COMMANDER`); surprised hook slam; Darwin pin lights; camera already drifting |
| 2 | 4.5–7.5 | ANIMATE (map) | Same corridor; danger tease | Sly; soft pulse on Darwin; geography-as-threat tease — no VO-echo sentence title |
| 3 | 7.5–14.0 | ANIMATE (map) | Darwin Top End zoom (`s18_03` / `s18_04`) + long arc to Canberra | Storytelling; self-drawing Darwin→Canberra arc; numeric callout **OVER 3,100 KM** / ~3,127; 3D `DARWIN` + `CANBERRA` labels; continuous pan along arc |
| 4 | 14.0–20.5 | ANIMATE (map) | Timor Sea + PNG corridor | Fast; Darwin→Dili arc (~700 km) then Darwin→Port Moresby (~1,800); capital pins; km counters beat the ref; brief photo insert optional only if needed for city ID |
| 5 | 20.5–24.0 | ANIMATE (map) | Jakarta pin west + Canberra compare | Fast; Darwin→Jakarta arc (~2,700) vs Darwin→Canberra (~3,100); highlight Jakarta closer; simultaneous compare pins |
| 6 | 24.0–28.0 | ANIMATE (map) | Zoom back to Darwin / Timor Sea approaches | Tense; closeness → danger; route energy darkens; parchment fill pulse on Top End |
| 7 | 28.0–32.0 | ANIMATE (map + brief insert) | Map attack vectors + optional brief `s18_11` / `s18_12` raid still | Dramatic; **19 FEB 1942** + **188** chips; carrier-approach arcs into Darwin harbour; photo insert ≤~1s for credibility then back to map |
| 8 | 32.0–36.5 | ANIMATE (map) | Darwin ↔ labelled Pearl Harbor compare (not wrong-geo collage) | Twist; **SAME COMMANDER** extruded label; optional brief `s18_14` Pearl Harbor PD still as labelled compare only; **do not** invent commander names beyond soft Fuchida if sourced on screen |
| 9 | 36.5–40.5 | ANIMATE (map) | Darwin harbour focus / bomb-count soft callout | Shocked; soft “by many accounts” — prefer bomb-count compare chip, **not** hard tonnage claim |
| 10 | 40.5–43.5 | ANIMATE (map) | Australia outline + Darwin pin as largest foreign attack | Serious; scale badge; avoid “only invasion” overclaim |
| 11 | 43.5–end | ANIMATE (map) | Return to Darwin pin + `CLOSER THAN CANBERRA` | Incomplete loop punch on **`Because remember:`**; hard cut / whip / match-cut back to beat-1 open |

## Still inventory / factual guardrails

1. World topo.bathy (NASA) — corridor / globe **reference** basemap (crop AU–Indonesia–PNG).
2. Timor Sea MODIS 2019 — **preferred corridor basemap** for Darwin–Timor–Indonesia.
3. Van Diemen Gulf MODIS — Darwin Top End satellite basemap.
4. Van Diemen sediment MODIS — alt Darwin harbour approaches.
5. Darwin Waterfront Precinct — brief city credibility insert.
6. Darwin city still — alt Darwin insert.
7. NT location map SVG — **reference only**; rebuild locked style.
8. NT in Australia SVG/PNG — **reference only**.
9. Australia locator SVG — **reference only**.
10. Canberra Parliament House — brief Canberra capital insert / pin support.
11. Jakarta Monas — brief Jakarta capital insert.
12. USS William B. Preston during Darwin raid 19 Feb 1942 (NHHC PD) — raid credibility insert.
13. MV Don Isidro (AWM PD) — raid-era shipping insert (attacked en route to Darwin).
14. USS Arizona Pearl Harbor (NARA PD) — **labelled compare only** if used.

No AI historical reconstructions. Soft facts: about/over distances; ~188 aircraft; Fuchida dual command as commonly recounted; “by many accounts” more bombs; largest foreign air attack soft. **Gaps for Claude (optional):** higher-res Dili / Port Moresby free-licence stills if pins need photo support — maps remain primary.

## Audio hand-off

- **`audio/vo.mp3`:** held Atlas en-AU **45.336 s**. Do not re-record.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Silent Descent** by Eugenio Mininni, Mixkit Stock Music Free Licence (~160 s; tense cinematic). Claude owns ducking, timing, loudness and final mix.
- SFX: shared Mixkit kit cues in `sfx/` plus `paper_rustle.mp3` (map / callout colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
