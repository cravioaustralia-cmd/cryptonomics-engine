# Shot plan — s25-cliff-young (scaffold skeleton)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use **SVG + `renderFrame(t)` + Playwright + ffmpeg** (`shorts/shared/render/`). **No Remotion.**
- **Mode: standard Skylab Short** — photo-underlay + premium MG. **NOT map-explainer primary.** Brief route chips OK. If a Sydney→Melbourne map insert is used: **GeoGlobeTales quality** — rich satellite, soft lighting, **no blown white relief** (ref: `/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`).
- Captions ~70%. Extra MG text = labels only. Frame-1 hook: **`61 · GUMBOOTS`**. No VO-echo titles.
- Stage all **five Visual gags** on the named VO lines (see `script.md` / `PASTE_BRIEF.md`).
- **Incomplete loop** mid-phrase into open.
- **Atlas VO:** pending → `audio/vo.mp3`. Retune seams to Whisper when held.
- Australian English.

## Hook

- **Primary:** `61 · GUMBOOTS`
- **Alternates:** `GUMBOOTS` · `875 KM` · `1983`

## Beat table (skeleton — Claude expands + retunes to Whisper)

| # | VO cue | Mode | Named motion / gag |
|---|---|---|---|
| 1 | Open gumboots | ANIMATE | Hook slam `61 · GUMBOOTS` |
| 2 | Cliff Young / late fifties | ANIMATE | Name label |
| 3 | Sydney–Melbourne 875 km | ANIMATE | Route / distance chips; optional GeoGlobeTales map |
| 4 | Pros sponsors / Cliff gumboots | ANIMATE | **Gag 1** logos vs sheep sticker |
| 5 | People laugh | ANIMATE | Sly crowd beat |
| 6 | Shuffle / car keys | ANIMATE | Young shuffle MG |
| 7 | Pros sleep / Cliff shuffles | ANIMATE | **Gag 2** zzz + pass |
| 8 | Best mistake ever | ANIMATE | **Gag 3** guilty alarm |
| 9 | Still going | ANIMATE | News-spread energy |
| 10 | Sheep for days | ANIMATE | Farm/sheep underlay |
| 11 | Ten pairs | ANIMATE | **Gag 4** shoe counter + ding |
| 12 | Catches leaders | ANIMATE | Catch-up motion |
| 13 | First. | ANIMATE | **Gag 5** confetti → gumboots podium |
| 14 | Carried off | ANIMATE | Soft collapse — dignity |
| 15 | Shares $10,000 | ANIMATE | Warm share beat |
| 16 | when, | ANIMATE | Incomplete loop whip to open |

## Audio

- `audio/vo.mp3` — **VO file coming**
- Mix: measure VO → static gain + apad → float amix → two-pass loudnorm ~−14 LUFS
- Sparse SFX ~6–10
