# LOG — s30-rabbit-proof-fence

## 2026-10-04T12:25+11:00 AEDT — scaffold

- Episode: `shorts/s30-rabbit-proof-fence/`
- Branch: `scaffold/s30-rabbit-proof-fence` off `origin/main` (highest prior short folder confirmed: **s29** on `scaffold/s29-darwin-stuck`; next = **s30**)
- **Mode: MAP EXPLAINER (locked)** — GeoArchivez standing quality bar; GeoGlobeTales basemap lock
- Series: Impossible Journeys **episode 5** (s26 Mary Bryant ep.1; s27 Bert Hinkler ep.2; no ep.3 folder; s28 Robyn Davidson ep.4). s29 is the Darwin teaser, not this series
- Atlas VO **seated** at `audio/vo.mp3` (**94.392 s**, from `/workspace/s30-vo.mp3`) — Whisper small usable (Molly, Daisy, Gracie, Perth; ending “Because it all began with”); **do not re-record**
- Scaffold: `script.md`, `vo_script.md` (269 spoken words), `plan.md`, `PASTE_BRIEF.md`, `MAP_EXPLAINER_MODE.md`, `SOURCES.md`, `FACT_NOTES.md`, `images/SOURCES.md`, Skyline 601 + shared SFX, render README, final/.gitkeep
- **No `scenes.js`** — Claude owns design / animation / mix
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**, ~205.9 s) copied from s28 (already in-repo). Not downloaded
- SFX: shared Mixkit kit seated; brief locks sparse use, no gag stingers
- Hook: `1,600 km. NO MAP` (alts `FOLLOW THE FENCE` · `1931`); incomplete loop on spoken `Because it all began with` → `Three girls.`
- Visual gags: **none**. Quiet map moments only (glowing fence, day counter, three trails → two, two trails reach Jigalong, master-map pullback)
- Place labels confirmed: **Jigalong** (community), **Moore River** (camp near Perth). Nearby town left unnamed. Daughter names not printed
- Portraits: **no clearly free photo** of Molly Craig, Daisy Kadibil, or Gracie Cross. Map labels only. Fairfield NSW “Mollie Craig” is a different person — not used
- Master map: prior polylines exist on other commits (`f83a646` Mary, `3db0f94` Hinkler `routes.flight`, s28 `WAY`) but **not on this branch**. If Claude cannot load them: pull back over Western Australia and hold. Do not invent episode 3. Do not draw s29
- Dirty unrelated paths left unstaged: `shorts/incoming-vo/*`, `shorts/s19-emu-war/images/*`
- Handoff next: parent seats Atlas `audio/vo.mp3` → user pulls this branch → user pastes `PASTE_BRIEF.md` into Claude Code. Do not @claude, do not PR from this scaffold, do not upload

## 2026-10-04 — s30 Rabbit-Proof Fence (Claude build)
- Built on `claude/model-opus-v3027k` from `scaffold/s30-rabbit-proof-fence`. MAP EXPLAINER. SVG + renderFrame + Playwright + ffmpeg. No Remotion
- Held Atlas VO untouched (94.392 s); `transcript.json` = faster-whisper medium.en, 269/269 words, "mothers." seam pinned by silencedetect
- Basemap from open data (NASA BMNG, AWS Terrain Tiles, Natural Earth): WA layer + Moore River and Jigalong close-ups; soft relief, no blown whites
- Quiet map moments staged: glowing self-drawing fence, day counter DAY 1 → NINE WEEKS, three trails → two (unnamed town), two trails reach Jigalong, second walk with one pin that stays at Moore River, `20+ YEARS`
- Master map uses only loaded polylines: ep.1 Mary (`3db0f94` mary.escape), ep.2 Hinkler (`3db0f94` routes.flight), ep.4 Robyn (s28 `WAY`). No ep.3, no s29
- No gags, no emoji, no portraits, no faces, no daughter names, no town name
- Mix: VO −23.5 LUFS +5.5 dB static, Skyline bed −36.2 LUFS (s18 −4 LU), 9 sparse SFX, float amix, two-pass master loudnorm → −14.0 LUFS / −1.5 dBTP
- Fence No. 1 trace is approximate between documented anchors (OSM and Wikipedia blocked from the container); see `images/SOURCES.md`
- Deliverables: `final/s30-rabbit-proof-fence.mp4` (1080×1920, 30 fps, 94.4 s, 65 MB), `final/contact-sheet.jpg`, `final/loudnorm-report.txt`. Not uploaded. Not merged
