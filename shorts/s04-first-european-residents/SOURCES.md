# Image, music and sound sources — s04-first-european-residents

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). All stills are Wikimedia Commons public-domain or Creative Commons sources; no AI historical stills are used.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Vastness** — Andrew Ev | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/vastness-184/ |

## SFX

The episode copies only reviewed cues from `shorts/shared/sfx/`. Their source URLs and Mixkit licence are recorded in [`sfx/sources.tsv`](sfx/sources.tsv).

| File | Description | Licence / source |
|---|---|---|
| `sfx/impact_hit.mp3` | Movie trailer epic impact | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2908/ |
| `sfx/riser.mp3` | Cinematic trailer riser | Mixkit Licence · https://mixkit.co/free-sound-effects/download/790/ |
| `sfx/whoosh_1.mp3` | Air whoosh | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1489/ |
| `sfx/whoosh_2.mp3` | Cinematic whoosh fast transition | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1492/ |
| `sfx/text_pop.mp3` | Dry pop-up notification alert | Mixkit Licence · https://mixkit.co/free-sound-effects/download/2356/ |
| `sfx/typewriter_tick.mp3` | Typewriter tick | Mixkit Licence · https://mixkit.co/free-sound-effects/download/1379/ |

## Audio hand-off

- `audio/vo.mp3` is the held VO copied from `shorts/incoming-vo/04-australias-first-european-residents.mp3` (61.560 s); do not re-record.
- Claude owns audio ducking, SFX timing, final mix and render.

## Fonts (on-screen type)

| File | Licence | Source |
|---|---|---|
| `shared/render/fonts/Oswald-VF.ttf` | SIL Open Font License 1.1 (`OFL-Oswald.txt`) | https://github.com/google/fonts/tree/main/ofl/oswald |
| `shared/render/fonts/PlayfairDisplay-VF.ttf`, `PlayfairDisplay-Italic-VF.ttf` | SIL Open Font License 1.1 (`OFL-PlayfairDisplay.txt`) | https://github.com/google/fonts/tree/main/ofl/playfairdisplay |

## Map graphics

Locator maps are drawn in SVG from a generalised Australian coastline (real lon/lat points) and the real positions of the Houtman Abrolhos island groups. The mainland landing zone is shown as an approximate dashed area only — the exact spot where Loos and Pelgrom were put ashore is not claimed.

## Timing

`transcript.json` word timings were generated locally from the held `audio/vo.mp3` with faster-whisper (`medium.en`, word timestamps); “Wiebe” corrected to “Wiebbe” to match the script.
