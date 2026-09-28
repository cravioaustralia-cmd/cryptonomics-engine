# Sources — s18-darwin-closer

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). All stills are Wikimedia Commons public-domain or Creative Commons sources; no AI stills are used.

**MAP EXPLAINER MODE (locked):** animated kinetic cartography primary — see [`MAP_EXPLAINER_MODE.md`](MAP_EXPLAINER_MODE.md). Territory overlays on real satellite/topo basemap; parchment/weathered fill; thick white outer glow; bold 3D labels + drop shadows; soft shadows. Darwin · Canberra · Dili · Port Moresby · Jakarta only; Pearl Harbor labelled compare only. Photos brief inserts only.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Silent Descent** — Eugenio Mininni | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/silent-descent/ (asset `https://assets.mixkit.co/music/614/614.mp3`) |

Chosen for surprised geography hook → tense 1942 danger → raid → incomplete-loop energy.

## SFX

Episode copies reviewed Mixkit shared-kit cues plus paper rustle for map / km-callout colour. Source URLs and Mixkit licence are recorded in [`sfx/sources.tsv`](sfx/sources.tsv).

| File | Description | Licence / source |
|---|---|---|
| `sfx/impact_hit.mp3` | Movie trailer epic impact | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2908/ |
| `sfx/riser.mp3` | Cinematic trailer riser | Mixkit Licence · https://mixkit.co/free-sound-effects/download/790/ |
| `sfx/whoosh_1.mp3` | Air whoosh | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1489/ |
| `sfx/whoosh_2.mp3` | Cinematic whoosh fast transition | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1492/ |
| `sfx/text_pop.mp3` | Dry pop-up notification alert | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2356/ |
| `sfx/typewriter_tick.mp3` | Typewriter tick | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1379/ |
| `sfx/paper_rustle.mp3` | Papers being moved or wrinkling (map / callout colour) | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2379/ |

## Audio hand-off

- `audio/vo.mp3` — held Atlas en-AU **45.336 s**. See [`audio/README.md`](audio/README.md).
- Claude owns audio ducking, SFX timing, final mix and render.
- Mix path: measure VO → static gain + `apad` → `amix` (prefer float premix) → two-pass loudnorm on master only (PR #21 / #23 / #25). Do **not** pre-amix VO loudnorm. Target ~−14 LUFS.
