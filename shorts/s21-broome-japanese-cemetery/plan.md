# Shot plan — s21-broome-japanese-cemetery (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **Mode: standard Skylab Short** — photo-underlay + premium MG. **NOT map-explainer mode** (no kinetic cartography primary; no continuous self-drawing route camera). Brief location chips OK (`BROOME` / `WA` / `1896`) — not a map episode.
- Every beat uses a full-bleed, factually tied photo underlay with MG overlays: restrained parallax/crop, kinetic labels, cemetery scale, diving-gear overlays on period stills. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `900 GRAVES`, `BROOME`, `WA`, `LATE 1800s`, `WAKAYAMA`, `THE BENDS`, `>1 IN 10`, `OVER 900`, `1896`, optionally `TOWNSVILLE` on the consulate beat. **No VO-echo titles** that restate whole spoken sentences. Only a brief frame-1 hook card.
- Australian English in any spelled facts.
- Crossfade at seams. **Incomplete loop** ends on `That’s why` with whip/match-cut back to frame-1 `900 GRAVES` / cemetery energy into the open.
- Preferred look: **photo-underlay + MG** (Skylab), sombre memorial — not cartoon-world primary, not slideshow-only.
- Visual rhythm: **surprised hook → heartbreaking story → pearling industry → danger → cemetery scale → consulate twist → incomplete loop.** Respectful of the dead; no gore; Broome-correct stills preferred.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune all seams to Whisper timings once VO lands.

## Hook recommendation

- **Primary (frame 1 unspoken):** `900 GRAVES`
- **Alternates:** `JAPAN IN BROOME` · `BROOME` · `ONE IN TEN`
- Prefer **`900 GRAVES`** — short, number-punch, matches plaque “over 900” / 919 people; mystery alts OK if A/B testing hooks.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` once held.

| # | Time (approx) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---|---|---|---|
| 1 | Open ~0–5 s | ANIMATE | Cemetery wide / rows `s21_05` / `s21_04` / `s21_03` + beach tease `s21_10` | Frame-1 unspoken hook **`900 GRAVES`**; surprised slam; Japan-in-beach-town tease — **no VO-echo title** |
| 2 | ~5–9 s | STILL/ANIMATE | Cemetery rows `s21_06` / `s21_04` + history plaque soft `s21_01` | Serious / heartbreaking; dim memorial hold; soft parallax |
| 3 | ~9–16 s | ANIMATE | Cable Beach / Roebuck Bay `s21_10` / `s21_11` / `s21_12` + period luggers `s21_09` | Storytelling Broome WA; stamp `BROOME` · `LATE 1800s`; pearl-shell / sea colour; lugger fleet underlay |
| 4 | ~16–21 s | ANIMATE | Luggers `s21_09` + diving suit Broome `s21_14` | Fast Wakayama arrival; soft chip `WAKAYAMA`; divers arrive energy — no wrong-country Japan tourism hero unless brief insert |
| 5 | ~21–27 s | ANIMATE | Broome diving suit `s21_14` (+ hard-hat detail `s21_15` as gear overlay only) | Tense; copper-helmet / lead-boots MG callouts on period still; depth pressure colour |
| 6 | ~27–36 s | ANIMATE | Dark sea / Roebuck `s21_11`–`s21_13` over cemetery dim; cyclone / danger MG | Dark beat; kinetic `THE BENDS` · drowning · cyclones; soft `>1 IN 10` chip; respectful — no carcass hero |
| 7 | ~36–42 s | ANIMATE | Cemetery hero `s21_05` / `s21_03` / `s21_06` / `s21_07` | Serious; scale of graves; `OVER 900` / `900 GRAVES` return; kanji headstone dignity |
| 8 | ~42–48 s | ANIMATE | Plaque / cemetery `s21_01` + lugger fleet `s21_09` (consulate twist — **do not** fake Broome consulate building) | Twist; soft `1896` · `FIRST CONSULATE`; optional `TOWNSVILLE` chip if naming city; pearling-boom → diplomacy link |
| 9 | End | ANIMATE | Return toward hook cemetery / `900 GRAVES` | Incomplete loop punch on **`That’s why`**; hard cut / whip / match-cut back to beat-1 open |

## Still inventory / factual guardrails

1. History plaque (CC0) — 919 people / 707 graves / bends / cyclones primary text.
2. Restoration plaque 1983 (CC0) — memorial / Japan–Broome care colour.
3. Cemetery path with headstones (CC0) — scale / rows.
4. Cemetery rows close (CC0) — kanji sandstone hero.
5. Cemetery wide (CC BY-SA 3.0) — classic Broome Japanese cemetery overview.
6. Japanese graves mid (CC BY 3.0) — dense markers.
7. Burial ground (CC BY 3.0) — additional Broome cemetery colour.
8. Cemetery 1969 archival (CC BY 2.0) — period memorial mood.
9. Pearling luggers Broome c.1914 PD (Yasukichi Murakami / NLA) — fleet / boom.
10. Cable Beach 2024 (CC0) — small Australian beach town open.
11–12. Roebuck Bay low tide (CC0) — Broome sea / shell beds colour.
13. ISS Roebuck Bay (NASA PD) — optional geography insert (not map-explainer primary).
14. Peter Donegan diving suit Broome 1936 (PD) — copper-helmet era dress / lead boots (helmet off; breastplate + boots visible).
15. Hard-hat diver AU MSB (CC BY 2.0) — **gear detail only**; not Broome-labelled as place.
16. Japanese pearl diver Thursday Island (SLQ; no restrictions) — **optional soft insert only**; Torres Strait ≠ Broome — prefer Broome `s21_14` for hero diving beats.

No AI historical reconstructions. Soft facts: one of the biggest; historians estimate >1 in 10; over 900; 1896 first consulate (Townsville). **Gaps for Claude (optional):** higher-res Broome copper-helmet-*on* period still if found free-licence; Wakayama / Taiji coastal still only as brief origin chip (label clearly Japan origin, not Broome); free-licence Townsville Kardinia / consulate still if naming the city on screen. Do **not** use wrong-country pearl-diver stand-ins as Broome heroes.

## Audio hand-off

- **`audio/vo.mp3`:** Atlas en-AU pending — drop in when recorded; do not invent timing from this plan alone.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Echoes** by Andrew Ev, Mixkit Stock Music Free Licence (~226 s). **Less prominent than s18’s Silent Descent.** Claude must seat the bed **safely under VO**, target roughly **4 dB quieter** than s18’s original bed level before final master loudnorm.
- SFX: shared Mixkit kit in `sfx/` (whoosh, riser, impact, text pop, typewriter, paper rustle). Source URLs in `sfx/sources.tsv`.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
