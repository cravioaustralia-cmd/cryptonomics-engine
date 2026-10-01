# Sources — s26-mary-bryant

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md). The film is 100% map: a satellite basemap built from NASA Blue Marble (public domain), Tilezen terrain/bathymetry (open data) and Natural Earth (public domain). Every gag prop is vector MG. No photos and no AI historical stills were used. Photo inserts were optional, and this session's egress policy blocked the collections, so none could be licence-verified.

**Mode:** **MAP EXPLAINER** — maps carry the story; photos brief credibility inserts only. Basemap: GeoGlobeTales quality — rich satellite, soft lighting, **no blown white relief**.

**Series:** Impossible Journeys episode 1 — series camel = vector MG; red route joins master map.

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Skyline** — Eugenio Mininni | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/skyline/ (asset `https://assets.mixkit.co/music/601/601.mp3`; discover slug `skyline`; id **601**) |

Chosen as a cinematic / journey-tagged documentary bed under Mary Bryant open-boat MAP EXPLAINER VO (Sydney→Timor → chains → Boswell pardon). Distinct from s18 Silent Descent, s19 Curiosity, s20 Vastness, s21 Echoes, s22 Fallen (Asper), s23 Between Two Evils, s24 Dark Drama, s25 Better Times Are Coming, abandoned s26-bert Drawing The Sky. **Claude mix:** seat music safely under VO; ~**4 dB quieter** than s18’s original bed before final master loudnorm. Loop/extend if VO exceeds ~206 s (track ~205.9 s).

## SFX

Episode copies the reviewed Mixkit shared-kit cues plus paper rustle, thud, and **record-scratch** (Pandora gag). Source URLs in [`sfx/sources.tsv`](sfx/sources.tsv). Prefer ~**6–10 intentional cues** — sparse; stage boat yank, pin drops, storm, record-scratch, desaturate settle.

## Audio hand-off

- `audio/vo.mp3` — **held** Atlas en-AU (96.12 s). Word timings in `transcript.json` come from faster-whisper medium.en; see `render/whisper.raw.json`.
- Final master: `render/mix.mjs` → `out/final-mix.wav`. Report: `final/loudnorm-report.txt` (−14 LUFS / −1.5 dBTP).
- Mix path: measure VO → static gain + `apad` → float `amix` → two-pass loudnorm on master only (~−14 LUFS). No pre-amix VO loudnorm.

## Key factual sources

- Australian Dictionary of Biography — Bryant, Mary
- Wikipedia — *Mary Bryant*
- State Library of NSW — Mary Bryant’s tea leaves
- UCL — Memorandoms of James Martin
- Naval Historical Society of Australia — open-boat voyage essay
- See also deliverables `FACT_NOTES.md`
