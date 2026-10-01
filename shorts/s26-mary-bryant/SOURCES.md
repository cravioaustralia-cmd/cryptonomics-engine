# Sources — s26-mary-bryant

Image sources will be documented in [`images/SOURCES.md`](images/SOURCES.md). Prefer free-licence, factually correct stills (First Fleet / Port Jackson context, Timor/Kupang geography, Pandora colour, Boswell PD portrait, satellite basemap). No AI historical stills.

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

- `audio/vo.mp3` — **pending** Atlas en-AU. See [`audio/README.md`](audio/README.md).
- Mix path: measure VO → static gain + `apad` → float `amix` → two-pass loudnorm on master only (~−14 LUFS). No pre-amix VO loudnorm.

## Key factual sources

- Australian Dictionary of Biography — Bryant, Mary
- Wikipedia — *Mary Bryant*
- State Library of NSW — Mary Bryant’s tea leaves
- UCL — Memorandoms of James Martin
- Naval Historical Society of Australia — open-boat voyage essay
- See also deliverables `FACT_NOTES.md`
