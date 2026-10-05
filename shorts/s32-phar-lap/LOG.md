# LOG — s32-phar-lap

## 2026-10-06T08:38+11:00 AEDT — scaffold

- Episode: `shorts/s32-phar-lap/`
- Branch: `scaffold/s32-phar-lap` off `origin/main` (`d9aa880`). Clean worktree at `/workspace/cryptonomics-engine-s32` — did not checkout dirty main in `/workspace/cryptonomics-engine` (unrelated `shorts/incoming-vo/*`, `shorts/s19-emu-war/images/*` left untouched).
- **Mode: MAP ANIMATION / MAP EXPLAINER (locked)** — kinetic cartography is the picture, not a photo-underlay. GeoArchivez motion bar; GeoGlobeTales colour; **no blown white relief**
- Series: Impossible Journeys **episode 7** (s26 Mary Bryant ep.1; s27 Bert Hinkler ep.2; no ep.3 folder; s28 Robyn Davidson ep.4; s30 Rabbit-Proof Fence ep.5; s31 Mawson ep.6). s29 is the Darwin teaser, not this series
- Atlas VO **not in this commit**. Path `audio/vo.mp3` will be seated before the brief is pasted. **Do not re-record. Do not overwrite.**
- Scaffold: `script.md`, `vo_script.md` (192 spoken words), `plan.md`, `PASTE_BRIEF.md`, `MAP_EXPLAINER_MODE.md`, `SOURCES.md`, `FACT_NOTES.md`, `images/SOURCES.md`, two PD Phar Lap stills, Skyline 601 + shared SFX, render README, final/.gitkeep
- **No `scenes.js`** — Claude owns design / animation / mix
- Music: **Skyline** (Eugenio Mininni / Mixkit id **601**, ~205.9 s) copied from s31 (already in-repo; same file as s30). Not downloaded
- SFX: shared Mixkit kit seated; brief locks sparse ~6–10 use
- Hook: `THREE CITIES` (alts `SPLIT UP` · `HIDE · SKELETON · HEART`); incomplete loop on spoken `Because, believe it or not,` → `Australia’s greatest racehorse…`
- Visual gags (exact): warts zoom + boing; catalogue flip; near-miss duck; three pins HIDE/SKELETON/HEART + Tasman tug-of-war rope; camel hidden in Flemington crowd (series motif)
- Geography locked: near Timaru NZ; Sydney landfall; Flemington/Melbourne Cup 1930; Agua Caliente Handicap, Tijuana Mexico 1932; California death (no town); hide Melbourne Museum; skeleton Te Papa Wellington; heart NMA Canberra
- Photos: PD Commons — `Phar_Lap.jpg` (Flemington c.1930) + `Pharlap1930melbournecup.jpg`. Movie still skipped. Name cards only
- Mix lock for Claude: two-pass loudnorm ~−14 LUFS; **AAC** true peak ≤ −1.5 dBTP, not just the WAV. s30 AAC master peaked at −1.32 — leave headroom (WAV nearer −2.0 to −2.5)
- Master map: prior polylines live on other commits, not this branch. Ep5 fence / ep6 Mawson only if real polylines exist. If Claude cannot load them: pull back over Tasman/Pacific and hold. Do not invent episode 3. Do not draw s29
- Dirty unrelated paths on the other checkout were not in this worktree and were not staged
- Handoff next: parent seats Atlas `audio/vo.mp3` → user pulls this branch → user pastes `PASTE_BRIEF.md` into Claude Code. Do not @claude, do not PR from this scaffold, do not upload

## 2026-10-06T08:39+11:00 AEDT — Atlas VO seated

- Atlas VO seated at `audio/vo.mp3` — duration **74.76 s**, **1,196,160** bytes, mp3 24 kHz mono 128 kbps. Do not overwrite. Date: 6 Oct 2026 (Sydney / AEDT).

## 2026-10-06 AEDT — map-animation build, mix and final render (Claude Code)

- Pulled `scaffold/s32-phar-lap` (`e505a46`). Held Atlas VO `audio/vo.mp3` untouched (74.76 s, md5 `2d666eedc427e6e7193268044850f713`). Not re-recorded, not overwritten.
- Whisper: faster-whisper medium.en word timings → `transcript.json` (192 words, snapped to `script.md`). "1926" span set from silencedetect (Whisper gave it zero length).
- Picture: SVG + `renderFrame(t)` + Playwright + ffmpeg via `shorts/shared/render/` (no Remotion). One continuous camera over three orthographic planes (Tasman, California/Baja, whole Pacific) with per-frame **globe spins** between them. Basemap built from open data (BMNG, Terrarium DEM, Natural Earth): rich land colour, deep navy ocean with bathymetry, snow toned to soft grey (no blown white relief).
- Gags staged on the map: warts magnifier + boing; catalogue page flip with one entry circled; near-miss streak + duck; HIDE / SKELETON / HEART pins + Tasman tug-of-war rope (flash-forward on "three cities split him up", full on the split beat); tiny unlabelled camel in the Flemington crowd.
- PD stills: two small name cards only (Phar Lap c.1930; 1930 Melbourne Cup).
- Master map: loaded polylines only via `render/tools/make_ij_routes.py` — EP.1 Mary Bryant, EP.2 Hinkler, EP.4 Robyn Davidson, EP.5 the 1931 walk (s30 WALKP), EP.6 Mawson (s31 OUTP+RETP from the s31 build branch). No ep.3, no s29.
- Shared render: `shorts/shared/render/capture.mjs` brought in line with the s31 build branch (`openEpisodePage`, `/ep/*` assets, `PLAYWRIGHT_CHROMIUM`, `EPISODE_READY`); backwards compatible.
- Mix: locked two-pass path (see `render/README.md`, `final/loudnorm-report.txt`).
- Not uploaded. PR left open, not merged.
