# Sources — s28-robyn-davidson

Image sources are documented in [`images/SOURCES.md`](images/SOURCES.md).

**Mode:** **MAP EXPLAINER** — maps carry the story; photos are brief credibility inserts only. Basemap: GeoGlobeTales quality — rich satellite, soft lighting, **no blown white relief**. Local still: `/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`. Motion ref: `/workspace/geoarchivez-scripts/top_short_share.mp4` and `/workspace/deliverables/style-refs/MAP_EXPLAINER_MODE.md`.

**Series:** Impossible Journeys episode 4 — series camel = vector MG at the back of her camel line; red route joins the master map.

## Image lock

**Robyn Davidson:** a real free-licence portrait was searched for and **not found** (Wikimedia Commons, 3 Oct 2026). Do not substitute emoji, a pictogram, or a name-chip as her face. Do not use National Geographic magazine scans or Getty trek photos. **Rick Smolan** does have a free-licence portrait (Macworld 2009, not a trek photo) — see the images log. **No AI historical stills.**

## Music

| File | Title / artist | Licence | Source |
|---|---|---|---|
| `music/music.mp3` and `audio/music.mp3` | **Skyline** — Eugenio Mininni | Mixkit Stock Music Free Licence | https://mixkit.co/free-stock-music/skyline/ (asset `https://assets.mixkit.co/music/601/601.mp3`; discover slug `skyline`; id **601**) |

Same Impossible Journeys standing bed as s26 Mary Bryant (ep.1) and s27 Bert Hinkler (ep.2). **Claude mix:** seat music safely under VO; ~**4 dB quieter** than s18’s original Silent Descent bed before final master loudnorm. **Drop the bed out on “Then disaster”.** Loop/extend if VO exceeds ~206 s (track ~205.9 s).

## SFX

Episode copies the reviewed Mixkit shared-kit cues. Source URLs in [`sfx/sources.tsv`](sfx/sources.tsv). Prefer ~**6–10 intentional cues** — sparse, clearly under VO, with VO-only stretches. No gunshot on the dog beat. Stage side-eye, camera clicks, press-car swarm, and one splash. Cut dense whoosh/pop chatter.

## Audio hand-off

- `audio/vo.mp3` — **PENDING**. Video Production seats Atlas en-AU before the user pastes this brief. Do not overwrite a file that lands later. Whisper word timings → `transcript.json` only after VO exists. See [`audio/README.md`](audio/README.md).
- Mix path: measure VO → static gain + `apad` → float `amix` → two-pass loudnorm on master only (~−14 LUFS). No pre-amix VO loudnorm.

## Key factual sources (notes only — not added to the spoken script)

- Wikipedia — *Robyn Davidson* (2,700 km; Alice Springs 1975; two years with camels; 1977 departure; four camels; nine-month journey; National Geographic 1978; Rick Smolan). https://en.wikipedia.org/wiki/Robyn_Davidson
- National Portrait Gallery of Australia, record 2014.9 — “Robyn Davidson (Hamelin Pool, Indian Ocean, Western Australia)”, 1977, Rick Smolan. States the trek was to Shark Bay, over 2,700 kilometres, nine months, and that she had to shoot her dog Diggity. Image itself is not available / not free — **not downloaded**. https://www.portrait.gov.au/portraits/2014.9/robyn-davidson-hamelin-pool-indian-ocean-western-australia
- Australian Museum — trailblazer note: Eddie, a Pitjantjatjara man, walked with her from Docker River toward Warburton. https://australian.museum/about/history/exhibitions/trailblazers/robyn-davidson/
- *The Telegraph* extract of her own account (film package): departure context from Glen Helen / Redbank area on 8 April; “DAY 195” near the ocean; also “1,700 miles in nine months.” https://www.telegraph.co.uk/culture/film/starsandstories/10773102/Tracks-The-true-story-behind-the-film.html
- See [`fact-check.md`](fact-check.md) and [`FACT_NOTES.md`](FACT_NOTES.md). Do not change the spoken words to resolve the nine-month vs day-count tension.
