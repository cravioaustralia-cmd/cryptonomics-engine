# Sources — s21-broome-japanese-cemetery

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). All stills are Wikimedia Commons public-domain or Creative Commons sources; no AI stills are used. Prefer Broome-correct photos; optional Thursday Island diver marked soft-geography.

**Mode:** Standard Skylab photo-underlay + premium MG — **NOT** map-explainer mode.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Echoes** — Andrew Ev | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/echoes/ (asset `https://assets.mixkit.co/music/188/188.mp3`; discover slug `echoes`; id **188**) |

Chosen as a dark / atmospheric documentary bed under sombre memorial VO — not slapstick, not raid-tense. Distinct from s18 Silent Descent, s19 Curiosity, s20 Vastness. **Claude mix instruction (locked):** seat music safely under VO; target roughly **4 dB quieter** than s18’s original bed level before final master loudnorm.

## SFX

Episode copies the reviewed Mixkit shared-kit cues (whoosh, riser, impact, text pop, typewriter, paper rustle). Source URLs and Mixkit licence are recorded in [`sfx/sources.tsv`](sfx/sources.tsv).

| File | Description | Licence / source |
|---|---|---|
| `sfx/impact_hit.mp3` | Movie trailer epic impact | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2908/ |
| `sfx/riser.mp3` | Cinematic trailer riser | Mixkit Licence · https://mixkit.co/free-sound-effects/download/790/ |
| `sfx/whoosh_1.mp3` | Air whoosh | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1489/ |
| `sfx/whoosh_2.mp3` | Cinematic whoosh fast transition | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1492/ |
| `sfx/text_pop.mp3` | Dry pop-up notification alert | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2356/ |
| `sfx/typewriter_tick.mp3` | Typewriter tick | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1379/ |
| `sfx/paper_rustle.mp3` | Papers being moved or wrinkling (archival / plaque colour) | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2379/ |

## Audio hand-off

- `audio/vo.mp3` — **pending Atlas en-AU**. See [`audio/README.md`](audio/README.md).
- Claude owns audio ducking, SFX timing, final mix and render.
- Mix path: measure VO → static gain + `apad` → `amix` (prefer float premix) → two-pass loudnorm on master only (PR #21 / #23 / #25). Do **not** pre-amix VO loudnorm. Target ~−14 LUFS. Music ~**4 dB quieter** than s18 original bed under VO.

## Key factual sources (see also fact-check.md)

- NMA — Japanese divers in Broome — https://www.nma.gov.au/defining-moments/resources/japanese-divers-broome
- Consulate-General of Japan, Sydney — first consulate Townsville 1896 — https://www.sydney.au.emb-japan.go.jp/itpr_en/about_history.html
- On-site Broome Japanese Cemetery history plaque (Commons still `s21_01`) — 919 people / 707 graves
