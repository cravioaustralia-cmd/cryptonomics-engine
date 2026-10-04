# LOG — s31-mawson

## 2026-10-04T22:40+11:00 AEDT — scaffold

- Episode: `shorts/s31-mawson/`
- Branch: `scaffold/s31-mawson` off `origin/main` (highest prior short folder confirmed: **s30** on `scaffold/s30-rabbit-proof-fence`; next = **s31**. No `s31` branch existed.)
- **Mode: MAP ANIMATION / MAP EXPLAINER (locked)** — kinetic cartography is the picture, not a photo-underlay. GeoArchivez motion bar; GeoGlobeTales colour; ice reads as ice; **no blown white relief**
- Series: Impossible Journeys **episode 6** (s26 Mary Bryant ep.1; s27 Bert Hinkler ep.2; no ep.3 folder; s28 Robyn Davidson ep.4; s30 Rabbit-Proof Fence ep.5). s29 is the Darwin teaser, not this series
- Atlas VO **not in this commit**. Path `audio/vo.mp3` will be seated before the brief is pasted. **Do not re-record. Do not overwrite.**
- Scaffold: `script.md`, `vo_script.md` (204 spoken words), `plan.md`, `PASTE_BRIEF.md`, `MAP_EXPLAINER_MODE.md`, `SOURCES.md`, `FACT_NOTES.md`, `images/SOURCES.md`, three PD portraits, Skyline 601 + shared SFX, render README, final/.gitkeep
- **No `scenes.js`** — Claude owns design / animation / mix
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**, ~205.9 s) copied from s30 (already in-repo; same file as s28). Not downloaded
- SFX: shared Mixkit kit seated; brief locks sparse use; record-scratch unused; no gag stingers after the crevasse
- Hook: `A FEW HOURS` (alts `1912` · `EAST`); incomplete loop on spoken `Because once,` → `Three men set out`
- Visual gag: **one**, before the crevasse only — British and Swiss flag pins, tiny woolly hats, on “two friends”. Snow-camel hidden in the ice early (series motif, not a death joke). **None after the crevasse**
- Suspense on the map: Distance-to-base counter ticks down; sledge icon snaps in half; ship icon leaves the base pin as Mawson arrives
- Place labels confirmed: **Cape Denison** / **Commonwealth Bay** (base). Glacier labels as spoken: **Ninnis Glacier**, **Mertz Glacier**. Ship unnamed. No Black Crevasse, no Aurora, no specific hour count
- Portraits: PD Commons — Mawson (SLSA B 9850), Ninnis (Hurley / NLA), Mertz (*Home of the Blizzard* 1915 plate, 900px JPEG of the Commons original). Name cards only. NLA Flickr “no known restrictions” Ninnis file skipped (`Copyrighted: True`)
- Mix lock for Claude: two-pass loudnorm ~−14 LUFS; **AAC** true peak ≤ −1.5 dBTP, not just the WAV. s30 AAC master peaked at −1.32 — leave headroom
- Master map: prior polylines live on other commits, not this branch. Episode 5 fence only if a real polyline exists (s30 scaffold has none). If Claude cannot load them: pull back over Antarctica and hold. Do not invent episode 3. Do not draw s29
- Dirty unrelated paths on the other checkout were not in this worktree and were not staged
- Handoff next: parent seats Atlas `audio/vo.mp3` → user pulls this branch → user pastes `PASTE_BRIEF.md` into Claude Code. Do not @claude, do not PR from this scaffold, do not upload
- Atlas VO seated at `audio/vo.mp3` (79.6s); do not overwrite.

## 2026-10-04 — Claude build (map animation, final render)
- Pulled `scaffold/s31-mawson`. Held Atlas VO `audio/vo.mp3` used as is (79.584 s, md5 e0337d21…7581). Not re-recorded, not overwritten.
- `transcript.json`: faster-whisper medium.en on the held VO. All 204 words matched; "kilometers" → "kilometres", "6" → "six".
- `render/scenes.js`: continuous kinetic map on an orthographic globe plane, from an open-data ice basemap with no blown white relief. It has the self-drawing route, the always-moving camera, ~500 KM and ~160 KM dimension lines, the DISTANCE TO BASE counter, the sledge snapping in two, Mawson's rope crevasse and the ship leaving as he arrives. The only gag is the hats and flag pins before the crevasse, and the snow-camel shows early only. PD portraits are small name cards.
- Master map: real polylines loaded from the repo for ep.1, ep.2, ep.4 and ep.5 (the s30 render's walk line, `origin/claude/model-opus-v3027k`). There is no ep.3 and no s29.
- Mix: VO −23.0 LUFS +5.0 dB static, Skyline bed at −36.2 LUFS, 8 SFX events, linear two-pass master loudnorm −14 LUFS. **AAC true peak −2.3 dBTP** in `final-mix.m4a` and inside the master MP4. WAV −2.5 dBTP.
- Final: `final/s31-mawson.mp4` (1080×1920, 30 fps, 2388 frames, 79.6 s, 56 MB), `final/contact-sheet.jpg` (reviewed), `final/loudnorm-report.txt`. Not uploaded, not merged.
