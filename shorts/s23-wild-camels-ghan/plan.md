# Shot plan — s23-wild-camels-ghan (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- **Mode: standard Skylab Short** — photo-underlay + premium MG. **NOT map-explainer mode** (no kinetic cartography primary; no continuous self-drawing route camera). Brief location chips OK (`OUTBACK` / `RED CENTRE` / `1860s` / `THE GHAN` / `ADELAIDE–DARWIN`) — not a map episode. If a map insert is used, parchment/satellite + white glow + 3D labels for **Australian outback / SA–NT Ghan corridor / Overland Telegraph** only.
- Every beat uses a full-bleed, factually tied photo underlay with MG overlays: restrained parallax/crop, kinetic labels, camel herd energy, cameleer archival colour, Ghan train hero, soft export twist. Do **not** invent AI historical stills.
- Captions remain in the lower-middle safe band (~70%). Extra MG text sparse — **labels only**: `OVER A MILLION`, `AUSTRALIA`, `1860s`, `THE GHAN`, `AFGHANS`, `OVERLAND TELEGRAPH`, `ADELAIDE–DARWIN`, soft `~1M+`. **No VO-echo titles** that restate whole spoken sentences. Only a brief frame-1 hook card.
- Australian English in any spelled facts.
- Crossfade at seams. **Incomplete loop** ends on `So yes.` — whip/match-cut back to frame-1 `OVER A MILLION` / camel-herd energy into the open.
- Preferred look: **photo-underlay + MG** (Skylab), shocked herd → sly train tease → storytelling import → haul → Ghan → release twist → Saudi export amused → incomplete loop — not cartoon-world primary, not slideshow-only.
- Visual rhythm: **shock → tease → origin story → labour → naming → release → export twist → incomplete loop.** Dignity for cameleer communities; no carcass-hero frames; Australian outback–correct stills only.
- **Atlas VO:** **held** at `audio/vo.mp3` (**43.008 s**). Retune all seams to Whisper timings.
- **SFX preference (locked 2026-09-30):** ~**6–10 intentional cues** only — sparse whoosh / riser / impact / soft paper or typewriter colour. **Not** dense `text_pop` chatter on every label.

## Hook recommendation

- **Primary (frame 1 unspoken):** `OVER A MILLION`
- **Alternates:** `THE GHAN` · `WILD CAMELS` · `1860s`
- Prefer **`OVER A MILLION`** — number-punch, matches population twist and incomplete-loop return; Ghan alt strong for A/B.

## Beat table

Approximate seams — Claude must retune against Whisper word timings from `audio/vo.mp3` once held.

| # | Time (approx) | Mode | Photo underlay (factually tied) | Named motion / MG treatment |
|---|---|---|---|---|
| 1 | Open ~0–5 s | ANIMATE | Modern feral herd `s23_01`/`s23_02`/`s23_06` | Frame-1 unspoken hook **`OVER A MILLION`**; shocked slam; Arabia/Asia reject energy without wrong-country hero stills — **no VO-echo title** |
| 2 | ~5–10 s | ANIMATE | The Ghan `s23_16`/`s23_17`/`s23_18`/`s23_19` | Sly tease; chip `THE GHAN`; train named-after tease |
| 3 | ~10–18 s | ANIMATE | Period camel trains `s23_10`/`s23_11`/`s23_13`/`s23_15` + outback horse-struggle colour via arid stills | Storytelling; stamp `1860s`; import from British India → India/Pakistan soft chips |
| 4 | ~18–24 s | ANIMATE | Cameleer archival `s23_08`/`s23_14` (+ `s23_07`/`s23_09` if recovered) | Fast; chips `AFGHANS` · multi-origin soft; dignity — no caricature |
| 5 | ~24–30 s | ANIMATE | OT / survey camels `s23_12`/`s23_20`/`s23_22`/`s23_24` | Awed haul; chips `RAILWAYS` · `TELEGRAPH` / `OVERLAND TELEGRAPH` |
| 6 | ~30–35 s | ANIMATE | Ghan hero + soft corridor map still `s23_23` as underlay only | Fast; `ADELAIDE–DARWIN` · `THE GHAN` · soft `WIDELY SAID` — not hard etymology slam |
| 7 | ~35–40 s | ANIMATE | Feral herd return `s23_01`/`s23_03`/`s23_04` | Twist; trucks-replace energy (MG icon OK); soft release; `OVER A MILLION` reprise — no precise census |
| 8 | ~40–43 s | ANIMATE | Herd + soft export twist (Australian camel still; optional Middle East cue without wrong-country “Australia” label) | Amused; soft `EXPORTS` / `SAUDI ARABIA` chip; incomplete loop `So yes.` → whip back to beat-1 |

## Still inventory / factual guardrails

1–4, 6. Modern Australian feral / outback camels (CC / PD Commons) — Red Centre / arid NSW / NT sanctuary / desert herd heroes.
5, 7–8, 10–15, 26–27. Period / muster / cameleer stills (PD / Commons) — APY muster, Afghans resting, 1891 cameleers, Hergott Springs, Wooltana, East–West Railway survey camels, 1928 offload, Sadadeen, Winton 1911, Birdsville 1926, decorated camel 1901.
16–19. The Ghan train / Alice Springs / carriage livery (CC) — Adelaide–Darwin service colour.
20–24. Overland Telegraph / Adelaide–Darwin line stills + soft route map as **photo underlay only** (not map-explainer mode).
Gaps for Claude (optional): Amedulah Khan camel train (Commons rate-limited at scaffold); higher-res Sadadeen; soft Saudi-export insert only if free-licence and not wrong-country-as-Australia. Do **not** use Arabia/Sahara/Gobi stand-ins as primary Australia beats. Soft facts: population soft ~1M+; gradual release; Ghan “widely said.”

## Audio hand-off

- **`audio/vo.mp3`:** Atlas en-AU **held** (**43.008 s**). Retune seams to Whisper timings.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Between Two Evils** by Michael Ramir C., Mixkit Stock Music Free Licence (~147 s; asset id **1020**). **Claude must seat the bed safely under VO**, target roughly **4 dB quieter** than s18’s original Silent Descent bed level before final master loudnorm.
- SFX: shared Mixkit kit in `sfx/` (whoosh, riser, impact, text pop, typewriter, paper rustle). Source URLs in `sfx/sources.tsv`. Prefer **~6–10 intentional cues** — sparse, not dense text_pop chatter.
- **Mix warning (critical — keep PR #21 / #23 / #25 path):** measure VO → static gain + `apad` → `amix` → **two-pass loudnorm on master only**. Prefer **float premix**. Do **not** reintroduce single-pass VO `loudnorm` before amix. Target ~**−14 LUFS** on master.
