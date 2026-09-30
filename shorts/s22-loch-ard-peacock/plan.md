# Shot plan — s22-loch-ard-peacock (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **Mode: standard Skylab Short** — photo-underlay + premium MG. **NOT map-explainer mode** (no kinetic cartography primary; no continuous self-drawing route camera). Brief location chips OK (`VICTORIA` / `SHIPWRECK COAST` / `LOCH ARD GORGE` / `1878`) — not a map episode. If a map insert is used, parchment/satellite + white glow + 3D labels for **Victoria / Shipwreck Coast / Loch Ard Gorge only**.
- Every beat uses a full-bleed, factually tied photo underlay with MG overlays: restrained parallax/crop, kinetic labels, ship/wreck energy, gorge cliffs, peacock hero. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `THREE SURVIVORS`, `1878`, `LOCH ARD`, `54 ABOARD`, `TOM PEARCE`, `EVA CARMICHAEL`, `LOCH ARD GORGE`, `MINTON`, `FLAGSTAFF HILL`, soft `$4M` / `MILLIONS` only if carefully hedged. **No VO-echo titles** that restate whole spoken sentences. Only a brief frame-1 hook card.
- Australian English in any spelled facts.
- Crossfade at seams. **Incomplete loop** ends echoing the open — whip/match-cut back to frame-1 `THREE SURVIVORS` / peacock energy into the open.
- Preferred look: **photo-underlay + MG** (Skylab), dramatic shipwreck → heroic → warm twist → peacock surprise — not cartoon-world primary, not slideshow-only.
- Visual rhythm: **dramatic hook → tense wreck → heroic rescue → marriage twist → peacock reveal → incomplete loop.** Respectful of the dead; no gore; Victoria / Shipwreck Coast / Loch Ard Gorge–correct stills only.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune all seams to Whisper timings once VO lands.

## Hook recommendation

- **Primary (frame 1 unspoken):** `THREE SURVIVORS`
- **Alternates:** `THE PEACOCK` · `LOCH ARD` · `1878`
- Prefer **`THREE SURVIVORS`** — short, number-punch, matches incomplete loop echo; peacock alt strong for A/B.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` once held.

| # | Time (approx) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---|---|---|---|
| 1 | Open ~0–6 s | ANIMATE | Peacock `s22_01` + gorge tease `s22_02`/`s22_03`/`s22_15` | Frame-1 unspoken hook **`THREE SURVIVORS`**; dramatic slam; ship-sank tease — **no VO-echo title** |
| 2 | ~6–14 s | ANIMATE | Period ship `s22_08`/`s22_09` + Mutton Bird Island / rocks `s22_07`/`s22_06` | Tense; stamp `1878` · `LOCH ARD` · `54 ABOARD`; pre-dawn mist/cliff energy; hit rocks |
| 3 | ~14–28 s | ANIMATE | Gorge beach / cliffs `s22_03`/`s22_04`/`s22_05`/`s22_16`/`s22_17` | Heroic; chips `TOM PEARCE` · `EVA CARMICHAEL` · `LOCH ARD GORGE`; wash-in → scream → swim-back rescue — no gore |
| 4 | ~28–34 s | ANIMATE | Soft gorge rest / cemetery dignity `s22_11` or gorge hold | Warm twist; soft “wanted them to marry” energy; **THEY DIDN’T** stamp — no romance VO-echo card |
| 5 | ~34–48 s | ANIMATE | Peacock hero `s22_01` + Flagstaff Hill `s22_22`/`s22_23`/`s22_24` | Surprised reveal; crate/wash-ashore MG; `MINTON` · soft value chip; almost unscratched |
| 6 | End | ANIMATE | Return peacock / `THREE SURVIVORS` | Incomplete loop punch echoing open; hard cut / whip / match-cut back to beat-1 |

## Still inventory / factual guardrails

1. Loch Ard Peacock (CC BY 3.0) — Minton majolica hero; Flagstaff Hill artefact.
2–5, 15–17, 20. Loch Ard Gorge / Great Ocean Road gorge stills (CC0 / CC BY / CC BY-SA) — cliff / beach / rescue geography.
6. Island Arch near Loch Ard (CC BY 3.0) — Shipwreck Coast rock architecture.
7. Mutton Bird Island (CC BY 2.0) — wreck site island off the gorge.
8. Loch Ard ship SLV PD — period clipper portrait.
9. Loch Ard with tugboat Robert Bruce PD — period ship colour.
10. Loch Ard SLQ PD — additional period ship still (lower res).
11. Cemetery at Loch Ard (CC BY-SA 3.0) — Carmichael family / wreck dead memorial (respectful).
14. Twelve Apostles (CC BY-SA 4.0) — **soft Shipwreck Coast colour only**; never label as Loch Ard Gorge.
22–24. Flagstaff Hill Maritime Village (CC BY 2.0) — peacock’s home museum / Warrnambool context.

No AI historical reconstructions. Soft facts: ages 18–19; “valued at millions” = insurance/marketing (~A$4m) not a recent auction hammer; period press romanticised Tom & Eva. **Gaps for Claude (optional):** free-licence 1878 Tom Pearce / Eva Carmichael carte-de-visite portraits (NPG / SLV — confirm licence before use); McCabe Carmichael watch stills (Commons CC0 — rate-limited at scaffold); Loch Ard hull/rigging plans PD; higher-res peacock display case if free-licence. Do **not** use wrong-coast stand-ins as Loch Ard Gorge heroes. Do **not** stamp Twelve Apostles as the wreck site.

## Audio hand-off

- **`audio/vo.mp3`:** Atlas en-AU pending — drop in when recorded; do not invent timing from this plan alone.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Fallen (Asper)** by Eugenio Mininni, Mixkit Stock Music Free Licence (~295 s). **Claude must seat the bed safely under VO**, target roughly **4 dB quieter** than s18’s original bed level before final master loudnorm.
- SFX: shared Mixkit kit in `sfx/` (whoosh, riser, impact, text pop, typewriter, paper rustle). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
