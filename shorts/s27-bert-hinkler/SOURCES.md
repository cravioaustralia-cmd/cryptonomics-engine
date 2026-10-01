# Sources — s27-bert-hinkler

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md): three real public-domain photographs of Bert Hinkler (two portraits, one with his Avro Avian) plus the satellite basemaps and globes built for this episode.

**Mode:** **MAP EXPLAINER** — maps carry the story; photos brief credibility inserts only. Basemap: GeoGlobeTales quality — rich satellite, soft lighting, **no blown white relief**.

**Series:** Impossible Journeys episode 2 — series camel = vector MG (hidden among passport stamps); red route joins master map.

## Image lock (CRITICAL — user locked 2026-10-01)

**Always use a real free-licence photo/portrait of Bert Hinkler** — NEVER emoji, pictogram-only, or name-chip stand-ins when a real image can be sourced. Bert has abundant PD/Commons portraits and Avro Avian photos — **require at least one real Bert portrait insert** (and plane photo if licence-clean). Mussolini / Florence funeral: period free stills if available, else soft map treatment — **not emoji**. **No AI historical stills.** Document every still here / in `images/SOURCES.md`.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Skyline** — Eugenio Mininni | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/skyline/ (asset `https://assets.mixkit.co/music/601/601.mp3`; discover slug `skyline`; id **601**) |

Same Impossible Journeys standing bed as s26 Mary Bryant (ep.1). **Claude mix:** seat music safely under VO; ~**4 dB quieter** than s18’s original Silent Descent bed before final master loudnorm. Loop/extend if VO exceeds ~206 s (track ~205.9 s).

## SFX

Episode copies the reviewed Mixkit shared-kit cues plus paper rustle, thud (passport stamp / pin-drop), and optional record-scratch. Source URLs in [`sfx/sources.tsv`](sfx/sources.tsv). Prefer ~**6–10 intentional cues** — sparse; stage accelerating stamp thunks, newspaper pop, soft grey settle on disappear.

## Audio hand-off

- `audio/vo.mp3` — **held** Atlas en-AU (91.25 s). Whisper word timings → `transcript.json`. See [`audio/README.md`](audio/README.md).
- Mix path: measure VO → static gain + `apad` → float `amix` → two-pass loudnorm on master only (~−14 LUFS). No pre-amix VO loudnorm.

## Key factual sources

- Wikipedia — *Bert Hinkler*
- Australian Dictionary of Biography — Hinkler, Herbert John (Bert) (1892–1933)
- State Library of NSW — “Hustling Hinkler”
- State Library of Queensland — Bert Hinkler’s record flight (1928)
- UK Hansard — Aviation (Mr Hinkler’s Flight), 27 Feb 1928
- See also deliverables `FACT_NOTES.md`
