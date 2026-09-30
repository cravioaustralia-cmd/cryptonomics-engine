# Sources — s24-burke-wills

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). All stills are Wikimedia Commons public-domain or Creative Commons / NLA no-restrictions sources; no AI stills are used. Prefer Australia-correct geography (Melbourne · Menindee · Cooper Creek / Innamincka · Gulf mangrove coast). Maps dominate; photos are brief credibility inserts only.

**Mode:** **MAP EXPLAINER** — kinetic cartography primary. Standing quality bar: GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4`).

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Dark Drama** — Eugenio Mininni | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/dark-drama/ (asset `https://assets.mixkit.co/music/605/605.mp3`; discover slug `dark-drama`; id **605**) |

Chosen as a dark cinematic / tragic documentary bed under Burke & Wills map-explainer VO. Distinct from s18 Silent Descent, s19 Curiosity, s20 Vastness, s21 Echoes, s22 Fallen (Asper), s23 Between Two Evils. **Claude mix instruction (locked):** seat music safely under VO; target roughly **4 dB quieter** than s18’s original bed level before final master loudnorm.

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
| `sfx/paper_rustle.mp3` | Papers being moved or wrinkling (archival / map colour) | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2379/ |

**Preference (locked 2026-09-30):** ~**6–10 intentional cues** — sparse; not dense text_pop chatter on every label.

## Audio hand-off

- `audio/vo.mp3` — **held Atlas en-AU (39.168 s)**. See [`audio/README.md`](audio/README.md).
- Claude owns audio ducking, SFX timing, final mix and render.
- Mix path: measure VO → static gain + `apad` → `amix` (prefer float premix) → two-pass loudnorm on master only (PR #21 / #23 / #25). Do **not** pre-amix VO loudnorm. Target ~−14 LUFS. Music ~**4 dB quieter** than s18 original bed under VO.

## Key factual sources (see also fact-check.md)

- NMA Defining Moments — Burke and Wills
- burkeandwills.net.au — Brief History / despatches / King’s Narrative
- The Dig Tree (RHSQ) — nine hours / DIG folklore
- *The Age* 1860 departure archive — Royal Park wagon breakdown; Essendon first night

## Fonts (render/fonts)

Claude may copy the shared OFL kit used on prior Shorts (Anton, Montserrat, Playfair Display) into `render/fonts/` when building — not required in scaffold.
