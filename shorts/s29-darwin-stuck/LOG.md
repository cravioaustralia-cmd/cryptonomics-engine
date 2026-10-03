# LOG — s29-darwin-stuck

## 2026-10-04T05:08+11:00 AEDT — scaffold

- Episode: `shorts/s29-darwin-stuck/`
- Branch: `scaffold/s29-darwin-stuck` off `origin/main` (highest prior short folder confirmed: **s28** on `scaffold/s28-robyn-davidson`; next = **s29**)
- **Mode: MAP EXPLAINER (locked)** — GeoArchivez standing quality bar; GeoGlobeTales basemap lock
- Role: teaser for long-form **lf01** (scenario one — Darwin / desert / railway trap)
- Atlas VO **PENDING** at `audio/vo.mp3` — Video Production (parent) records Atlas; do not record in this scaffold
- Scaffold only: `script.md`, `vo_script.md` (~139 spoken words), `plan.md` with ANIMATE beat table, `PASTE_BRIEF.md`, `MAP_EXPLAINER_MODE.md`, `SOURCES.md`, `images/SOURCES.md`, music + shared SFX, render README, final/.gitkeep
- **No `scenes.js`** — Claude owns design / animation / mix
- Music: **Silent Descent** (Eugenio Mininni / Mixkit id **614**) copied from s18 — tense Darwin map bed; **not** Skyline 601
- SFX: shared Mixkit kit seated; sad horn toot noted as required gag cue (Claude may add one Mixkit-free horn if needed)
- Hook: `ROAD TO NOWHERE` (alts `STILL STUCK` · `BIRDUM`); button loop on spoken `Because remember:`
- Geography lock: Darwin / Birdum / Alice Springs / ~1,000 km gap; no invented through-rail
- End card: arrow down to Related area — no invented YouTube URL; do not upload
- Stills: none required at scaffold (no named-person portraits)
- Dirty unrelated paths left unstaged: `shorts/incoming-vo/*`, `shorts/s19-emu-war/images/*`
- Handoff next: parent records Atlas VO → seat `audio/vo.mp3` → user pastes `PASTE_BRIEF.md` into Claude Code (after pulling this branch)
- Atlas VO seated at `audio/vo.mp3` (51.8s); do not overwrite.

## 2026-10-03 — Claude Code build (branch `claude/model-opus-8v96iw`, from `scaffold/s29-darwin-stuck`)

- Whisper (faster-whisper medium.en) on the held Atlas VO → `transcript.json` (139 words, mapped 1:1 onto the locked script; Australian spelling). VO untouched, not re-recorded.
- Basemap built in render: AWS Terrain Tiles (relief + bathymetry) + NASA Blue Marble land colour → `images/map/` (GeoGlobeTales look, highlights soft-clipped, no blown white relief).
- `render/scenes.js`: one always-moving eased camera; self-drawing rails; NT highlight with real borders; km callouts (`2,600 km`, `~1,000 km`, `5,400 km`); all six gags on cue (shrug 4.8 s, DEAD END 24.34 s, train + sad toot 32.30 s, tumbleweed 34.8 s, envelopes 47.3 s, Related arrow 49.7 s); frame-1 hook `ROAD TO NOWHERE`; whip back to frame-1 composition on "Because remember:".
- Sad horn toot synthesised (`render/make_horn.py`) — Mixkit blocked by container network policy.
- Mix (`render/mix.mjs`): VO −23.0 LUFS → +5.4 dB static; Silent Descent from 26 s at −23 dB (4 dB under s18); 10 SFX; two-pass master loudnorm → **−14.0 LUFS, −1.7 dBTP** (`final/loudnorm-report.txt`).
- Deliverables: `final/s29-darwin-stuck.mp4` (51.9 s, 1080×1920 @ 30, x264 crf 18), `final/contact-sheet.jpg` (reviewed).
- Not uploaded. No YouTube URL invented. PR not merged.
