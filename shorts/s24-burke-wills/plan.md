# Shot plan — s24-burke-wills (Checkpoint C hand-off) — MAP EXPLAINER MODE

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **THIS EPISODE IS MAP EXPLAINER MODE (locked).** Read `MAP_EXPLAINER_MODE.md` in this folder **and** `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`. Primary visual language = **animated map explainer** (kinetic cartography) — **NOT** Skylab photo-underlay slideshow as the main beat language.
- **Standing quality bar (dictate):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous **self-drawing route**, always-moving eased camera, dynamic region highlights, spatial **km/year** callouts, obstacle cutaways on the map (mangrove / DIG tree / nine-hours miss), premium **satellite/topo** canvas. Secondary: `/workspace/geoarchivez-scripts/raw/vZHLIqiC_Jc.mp4`. Rankora secondary only.
- Continuous map motion: pans, zooms, **self-drawing Melbourne→Menindee→Cooper→Gulf→Cooper route**, pin drops, numeric distance/day callouts. Camera **always moving**; route never sits dead.
- Photos only as **brief credibility inserts** (Burke/Wills/King portraits, Dig Tree, ST Gill departure, Longstaff) — **maps carry the story**.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `NINE HOURS`, `1860`, `DIG`, `MELBOURNE`, `MENINDEE`, `COOPER CREEK`, `GULF OF CARPENTARIA`, `BURKE`, `WILLS`, `KING`, `GRAY`, `YANDRUWANDHA`, soft `~20 t`, soft km callouts. **No VO-echo titles** that restate whole spoken sentences. Only a brief frame-1 hook card.
- Australian English in any spelled facts (`kilometres`, `tonnes`).
- Crossfade / whip at seams. Final incomplete loop (`…story of how`) hard-cuts / whips back toward frame-1 `NINE HOURS` / route-head energy — **Claude designs the visual whip-back**.
- Visual rhythm: **hook nine-hours → Burke portrait chip → Melbourne departure absurdity → dump/split route → Gulf mangrove obstacle → camel-meat dark return → DIG leave → nine-hours miss slam → creek deaths → King + Yandruwandha dignity → incomplete loop.**
- **Atlas VO:** **held** at `audio/vo.mp3` (**39.168 s**). Retune all seams to Whisper timings.
- **SFX preference (locked 2026-09-30):** ~**6–10 intentional cues** only — sparse whoosh / riser / impact / soft paper or typewriter colour. **Not** dense `text_pop` chatter on every label.

### LOCKED MAP STYLE (mandatory)

Real **satellite/topo** basemap (terrain visible under colour) — prefer `s24_12_australia_topo.jpg` / `s24_13_australia_topo_crop.png` / `s24_06_australia_sat_ortho.jpg` as canvas references; parchment/weathered fills where useful; **thick white outer glow** on state/region borders when activated; bold **3D/extruded labels** + drop shadow; soft shadows on overlays. **Correct locations only:**

| Place | Notes |
|-------|--------|
| Melbourne / Royal Park | Departure 20 Aug 1860 |
| Menindee (NSW) | Major dump / split |
| Cooper Creek / Innamincka borderlands (SA/QLD) | Depot · Dig Tree · deaths · King survival |
| Gulf of Carpentaria | **Mangrove coast** — never beach-ocean hero |
| Route | **Melbourne → Menindee → Cooper → Gulf → Cooper** (self-drawing solid yellow/orange line + soft shadow; camera tracks leading edge) |

Obstacle cutaways **on the map** (GeoArchivez style): wagon fail near Royal Park; mangrove block at Gulf; DIG tree blaze; nine-hours miss clock/arc at Cooper.

## Hook recommendation

- **Primary (frame 1 unspoken):** `NINE HOURS`
- **Alternates:** `DIG` · `1860`
- Prefer **`NINE HOURS`** — twist punch matching open VO and incomplete-loop return; `DIG` strong for A/B; `1860` softer date slam.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` (held **39.168 s**). **ANIMATE-heavy map beats.** Fast Atlas take — expect dense seams.

| # | Time (approx) | Mode | Map / brief photo | Named motion / MG treatment |
|---|---|---|---|---|
| 1 | Open ~0–4 s | ANIMATE (map) | AU continent over topo/sat; route tease | Frame-1 unspoken hook **`NINE HOURS`**; intense slam; soft `1860` chip; camera already drifting — **no VO-echo title** |
| 2 | ~4–8 s | ANIMATE (map + brief insert) | Melbourne pin; brief Burke portrait `s24_01` ≤~1 s | Storytelling; chip `BURKE` · `IRISH POLICE`; push toward Melbourne |
| 3 | ~8–12 s | ANIMATE (map + brief insert) | Melbourne/Royal Park; brief ST Gill `s24_21` / camel colour `s24_22` | Amused; soft `~20 t` · `OAK TABLE`; camel/horse icons on map — not slideshow |
| 4 | ~12–15 s | ANIMATE (map) | Micro Melbourne edge | Fast; wagon-break obstacle cutaway; first-night pin barely beyond park; chip `EDGE OF MELBOURNE` |
| 5 | ~15–20 s | ANIMATE (map) | Self-draw Melbourne→Menindee→Cooper | Tense; dumping markers; pins `MENINDEE` · `COOPER CREEK`; region glow SA/QLD borderlands |
| 6 | ~20–23 s | ANIMATE (map) | Cooper depot split; four wait / three race north | Dramatic; dashed northbound intent line; chips `WILLS` · `KING` · `GRAY`; `3 MONTHS` wait badge |
| 7 | ~23–27 s | ANIMATE (map) | Route to Gulf; mangrove obstacle cutaway | Awed; pin `GULF OF CARPENTARIA`; mangrove block icon — **never ocean beach**; soft km callout |
| 8 | ~27–30 s | ANIMATE (map) | Return south; camel icons fade | Dark; food-out state; soft `GRAY` death marker ~4 days from depot |
| 9 | ~30–33 s | ANIMATE (map + brief insert) | Cooper Dig Tree; brief `s24_03`/`s24_08` insert | Tense; `DIG` blaze slam; depot leave arrow south; over-four-months badge |
| 10 | ~33–35 s | ANIMATE (map) | Same-evening return to empty depot | Twist stunned; **`NINE HOURS`** miss arc/clock on map; three pins arrive |
| 11 | ~35–37 s | ANIMATE (map) | Hold Cooper creek | Slow eerie; Burke + Wills fade markers by creek (not fake Dig-Tree death stamp) |
| 12 | ~37–39 s | ANIMATE (map + brief insert) | Cooper; brief King `s24_20` if used | Twist dignity; chip `YANDRUWANDHA` · `KING SURVIVES`; soft rescue approach |
| 13 | End | ANIMATE (map) | Route + hook energy | Incomplete loop on **`…story of how`**; hard cut / whip / match-cut back to beat-1 `NINE HOURS` / route slam — Claude owns whip-back |

## Still inventory / factual guardrails

**Basemap / map-primary (maps dominate):**
- 06, 12–13. Australia satellite ortho + NASA topo (PD) — **primary canvas**
- 17. Cooper Creek ISS (NASA PD) — Cooper geography insert / basemap colour

**Brief credibility inserts only:**
- 01–02. Burke / Wills portraits (PD)
- 20. John King c.1861 (PD)
- 21. ST Gill Royal Park departure (PD)
- 03, 07–08, 18. Dig Tree / inscription / Cooper near Dig (CC)
- 04–05, 09. Innamincka / Cooper Creek / Bullah waterhole (CC)
- 10–11. Menindee Lakes / Darling drifts (CC / NLA)
- 14–15. Longstaff arrival paintings (PD) — Dig miss folklore colour; brief only
- 16, 19. Weipa Gulf coast / mangrove (CC) — **mangrove obstacle**, not beach-ocean hero
- 22. Amedulah Khan camel train c.1901 (NLA no restrictions) — soft camel colour (period AU; not Burke party itself — label carefully or use as camel icon reference only)

No AI historical reconstructions. Soft facts: two-men open PASS-SOFT; ~20 t / oak table; nine hours; DIG; Gray ~4 days; mangrove not ocean; Yandruwandha dignity. **Gaps for Claude (optional):** higher-res Burke portrait if free-licence found; free-licence period camel *of the VEE* if available; soft Menindee township still. Do **not** use wrong-country desert/ocean stand-ins. Do **not** show Gulf party on an open beach.

## Audio hand-off

- **`audio/vo.mp3`:** Atlas en-AU **held** (**39.168 s**). Retune seams to Whisper timings.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Dark Drama** by Eugenio Mininni, Mixkit Stock Music Free Licence (~289.6 s; asset id **605**). **Claude must seat the bed safely under VO**, target roughly **4 dB quieter** than s18’s original Silent Descent bed level before final master loudnorm.
- SFX: shared Mixkit kit in `sfx/` (whoosh, riser, impact, text pop, typewriter, paper rustle). Source URLs in `sfx/sources.tsv`. Prefer **~6–10 intentional cues** — sparse, not dense text_pop chatter.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
