# Sources — s20-sar-region

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). All stills are NASA / NSF public-domain or Creative Commons sources cropped from those; no AI stills are used. ESA Standard Licence stills were **not** retained (commercial/entertainment restriction).

**MAP EXPLAINER MODE (locked):** animated kinetic cartography primary — see [`MAP_EXPLAINER_MODE.md`](MAP_EXPLAINER_MODE.md). SRR overlays on real satellite/topo basemap; parchment/weathered fill; thick white outer glow; bold 3D labels + drop shadows; soft shadows. Correct AMSA/NATSAR geography only. Photos brief inserts only.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Vastness** — Andrew Ev | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/vastness/ (asset `https://assets.mixkit.co/music/184/184.mp3`) |

Chosen for shocked scale → awe km² → Pole dive → incomplete-loop energy. **Quieter under VO** than s18 Silent Descent (~**4 dB quieter** bed target before master loudnorm).

## SFX

Episode copies reviewed Mixkit shared-kit cues plus paper rustle for map / km²-callout colour. Source URLs and Mixkit licence are recorded in [`sfx/sources.tsv`](sfx/sources.tsv).

| File | Description | Licence / source |
|---|---|---|
| `sfx/impact_hit.mp3` | Movie trailer epic impact | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2908/ |
| `sfx/riser.mp3` | Cinematic trailer riser | Mixkit Licence · https://mixkit.co/free-sound-effects/download/790/ |
| `sfx/whoosh_1.mp3` | Air whoosh | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1489/ |
| `sfx/whoosh_2.mp3` | Cinematic whoosh fast transition | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1492/ |
| `sfx/text_pop.mp3` | Dry pop-up notification alert | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2356/ |
| `sfx/typewriter_tick.mp3` | Typewriter tick | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1379/ |
| `sfx/paper_rustle.mp3` | Papers being moved or wrinkling (map / callout colour) | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2379/ |

## Fact sources (primary)

| Claim cluster | Source |
|---|---|
| ~53M km²; one-tenth; 10 bordering SRRs | AMSA SRR page; NATSAR Vol. 1 §1.4; ANAO 2021 |
| Halfway Africa / Indonesia / NZ; to South Pole | AMSA Media Centre backgrounder |
| SRR coordinates; aviation to Pole | NATSAR Vol. 1 §1.5 |
| ICAO/IMO international SRR system | NATSAR Vol. 1 §1.1; IAMSAR |
| Vostok / Concordia inside AAT / SRR band | Station coords vs 75°E–163°E; AAD magazine 2011; Antarctic Treaty context |

## Audio hand-off

- `audio/vo.mp3` — **pending Atlas en-AU**. See [`audio/README.md`](audio/README.md). **Do not place VO yet.**
- Claude owns audio ducking, SFX timing, final mix and render.
- Mix path: measure VO → static gain + `apad` → `amix` (prefer float premix) → two-pass loudnorm on master only (PR #21 / #23 / #25). Do **not** pre-amix VO loudnorm. Target ~−14 LUFS. Music ~**4 dB quieter** than s18 original bed under VO.
