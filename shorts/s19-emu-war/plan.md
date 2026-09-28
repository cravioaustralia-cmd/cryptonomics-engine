# Shot plan — s19-emu-war (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **Mode: standard Skylab Short** — photo-underlay + premium MG. **NOT map-explainer mode** (no kinetic cartography primary; no continuous self-drawing route camera). Brief location chips OK (`WESTERN AUSTRALIA` / `1932`) — not a map episode.
- Every beat uses a full-bleed, factually tied photo underlay with MG overlays: restrained parallax/crop, kinetic labels, problem counters, newspaper archive props, Lewis-gun mechanics as **animated overlays** on period stills. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `THE EMU WAR`, `1932`, `WESTERN AUSTRALIA`, `~20,000`, `LEWIS GUN`, `PROBLEM 1/2/3`, `>40 KM/H`, `MAJOR MEREDITH`. **No VO-echo titles** that restate whole spoken sentences. Only a brief frame-1 hook card.
- Australian English in any spelled facts.
- Crossfade at seams. Final loop echoes open (`…and lost.`) with whip/match-cut back to frame-1 `THE EMU WAR` / running-emu energy.
- Preferred look: **photo-underlay + MG** (Skylab), not cartoon-world primary, not slideshow-only.
- Visual rhythm: **comedic but respectful and historically correct** — real WA wheatbelt / emu / 1932 military sources; no gore carcass hero shots; no wrong-country emus; no generic modern soldier stand-ins as the 1932 detachment.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune all seams to Whisper timings once VO lands.

## Hook recommendation

- **Primary (frame 1 unspoken):** `THE EMU WAR`
- **Stronger mystery alts:** `THEY LOST TO BIRDS` · `1932` · `MACHINE GUNS VS EMUS`
- Prefer **`THE EMU WAR`** — short, searchable, historically tagged; mystery alts OK if A/B testing hooks.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` once held.

| # | Time (approx) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---|---|---|---|
| 1 | Open ~0–5 s | ANIMATE | Period soldiers / Lewis still `s19_01` / `s19_02` / `s19_03` + WA emu flash `s19_08` / `s19_11` | Frame-1 unspoken hook **`THE EMU WAR`**; deadpan hook slam; machine-gun silhouette overlay; birds vs soldiers tease — **no VO-echo title** |
| 2 | ~5–14 s | ANIMATE | Wheatbelt / damage `s19_06` / `s19_07` / `s19_05` + emu flock `s19_09` / `s19_12` / `s19_04` | Storytelling 1932; stamp `1932`; soft chip `~20,000`; `WESTERN AUSTRALIA` label; wheat underlay dim; army-send cut to Lewis gunners still |
| 3 | ~14–22 s | ANIMATE | Flock scatter `s19_12` / `s19_09` / `s19_04` | Comedic **Problem 1** kinetic counter; scatter burst particles / split arrows; emus peel into small groups |
| 4 | ~22–28 s | ANIMATE | Running emu WA `s19_08` (+ `s19_10` / `s19_11`) | **Problem 2**; speed streak / motion lines; soft extruded `>40 KM/H` chip; keep beach context as WA emu sprint colour (not claim Campion beach) |
| 5 | ~28–34 s | ANIMATE | Running/hard-to-stop emu `s19_08` / `s19_10` over period ops still dim | **Problem 3**; hit-but-running MG (sparks/impact ticks without gore); resilience badge; dignity — no carcass hero |
| 6 | ~34–42 s | ANIMATE | Period ops `s19_01`–`s19_03` + newspaper/typewriter MG props over wheatbelt | Laughing beat; ammo counter / `THOUSANDS` soft chip; archival **newspaper** prop cards (paper rustle); pull-out stamp / withdraw glyph |
| 7 | ~42–50 s | ANIMATE | Meredith-era military still `s19_01` / `s19_03` + emu hero `s19_11` / `s19_10` | Punchline; `MAJOR MEREDITH` nameplate; soft quote-gesture MG (not full VO-echo slam); army-of-birds tease |
| 8 | End | ANIMATE | Return to hook + running emu / Lewis still | Loop punch on **`…and lost.`**; hard cut / whip / match-cut back to beat-1 `THE EMU WAR` |

## Still inventory / factual guardrails

1. Australian soldiers resting during Emu War (1932 PD) — period detachment mood.
2. Lewis gun during Emu War (1932 PD) — machine-gun mechanics underlay.
3. McMurray & O’Halloran with Lewis gun (1932 PD) — named gunners / ops still.
4. Emus coming to drink (1932 PD) — period emu field still.
5. Fallow caused by emus (1932 PD) — crop/farm damage colour.
6. Wheatbelt view near Merredin (CC BY-SA 4.0) — correct WA wheatbelt geography.
7. Merredin aerial 2017 (CC BY-SA 4.0) — Campion-district town/wheatbelt aerial.
8. Emu running Monkey Mia WA (CC BY-SA 4.0) — WA emu sprint for >40 km/h beat.
9. Emus Stokes NP WA (CC BY-SA 4.0) — WA flock / scatter colour.
10. Emu Cape Range WA (CC BY-SA 4.0) — WA emu portrait / resilience.
11. Emu Bibbulmun Track WA (CC BY-SA 4.0) — WA emu portrait.
12. Emu mob (CC BY-SA 3.0; NSW arid research station) — flock scatter reference (correct species/country; prefer WA flock when choice exists).

No AI historical reconstructions. Soft facts: about 20,000; over 40 km/h; weeks; thousands of bullets; reportedly Meredith quote. **Gaps for Claude (optional):** free-licence Trove 1932 newspaper masthead/scan as archival prop; Sir George Pearce PD portrait; higher-res Lewis-gun detail still if needed for MG overlay reference. Do **not** use deceased-emu carcass stills as hero frames.

## Audio hand-off

- **`audio/vo.mp3`:** Atlas en-AU pending — drop in when recorded; do not invent timing from this plan alone.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Curiosity** by Diego Nava, Mixkit Stock Music Free Licence (~100 s). **Less prominent than s18’s Silent Descent.** Claude must seat the bed **safely under fast VO**, target roughly **4 dB quieter** than s18’s original bed level before final master loudnorm.
- SFX: shared Mixkit kit in `sfx/` plus `paper_rustle.mp3` (newspaper / pull-out / archival colour). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
