# Sources — s16-nullarbor-845

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). All stills are Wikimedia Commons public-domain or Creative Commons sources; no AI stills are used.

**Maps rule (locked):** territory overlays on real satellite/topo basemap (terrain visible under colour); parchment/weathered fill; thick white outer glow on borders; bold 3D labels + drop shadows; soft shadows. Nullarbor Plain / WA–SA border / Eucla–Madura–Border Village / Eyre Highway corridor **only**.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Traveling Along** — Ahjay Stelino | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/traveling-along/ (asset `https://assets.mixkit.co/music/94/94.mp3`) |

Chosen for amazed → sly → storytelling → deadpan → twist → incomplete-loop energy: energetic / curious road-trip pulse, not comedy slapstick.

## SFX

Episode copies reviewed Mixkit shared-kit cues plus optional paper rustle for map / highway-sign beats. Source URLs and Mixkit licence are recorded in [`sfx/sources.tsv`](sfx/sources.tsv).

| File | Description | Licence / source |
|---|---|---|
| `sfx/impact_hit.mp3` | Movie trailer epic impact | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2908/ |
| `sfx/riser.mp3` | Cinematic trailer riser | Mixkit Licence · https://mixkit.co/free-sound-effects/download/790/ |
| `sfx/whoosh_1.mp3` | Air whoosh | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1489/ |
| `sfx/whoosh_2.mp3` | Cinematic whoosh fast transition | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1492/ |
| `sfx/text_pop.mp3` | Dry pop-up notification alert | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2356/ |
| `sfx/typewriter_tick.mp3` | Typewriter tick | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1379/ |
| `sfx/paper_rustle.mp3` | Papers being moved or wrinkling (map / sign colour) | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2379/ |

## Audio hand-off

- `audio/vo.mp3` is **PENDING** — VO recorded separately; parent will drop the MP3. See [`audio/README.md`](audio/README.md).
- Claude owns audio ducking, SFX timing, final mix and render **after** VO lands.
- Mix path: measure VO → static gain + `apad` → `amix` (prefer float premix) → two-pass loudnorm on master only (PR #21 / #23 / #25). Do **not** pre-amix VO loudnorm.
