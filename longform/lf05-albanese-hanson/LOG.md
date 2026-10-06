# lf05 Albanese vs Hanson — LOG

## 2026-10-06 (AEDT) — publish-day checks + scaffold

- Branch `scaffold/lf05-albanese-hanson` cut from `origin/main` (d9aa880, same base as lf04) via worktree `/workspace/cryptonomics-engine-lf05`.
- Episode folder `longform/lf05-albanese-hanson/` (documentary, not a map film). Title locked: *94 Seats vs 30%: Can Albanese Stop Pauline Hanson?*
- `script/PRODUCTION_SCRIPT.txt`: full extracted production script (Parts 1–13).
- `audio/vo-text/S01–S41.txt`: spoken text only (tags/directions stripped). `audio/vo-grok/S01–S41.txt`: same text with Grok delivery tags. 41 segments, ~2,607 words.
- Publish checks (`script/PUBLISH_CHECKS.md`): polls, RBA, Victorian election, leadership, censures, ages PASS (with recheck flags). **S33 FAIL → edited** (Hanson lodged High Court special leave application 21 Aug 2026; undecided). **S31 update recommended, not applied** (One Nation's 14 Sep 2026 net-negative migration plan) — needs Abhishek before recording S31. Optional S12/S40 tweaks listed.
- S32 "seven.thirty" → "seven thirty" (extraction artefact).
- Documented: mid-rolls after S13/S25/S33; chapter holds H1–H9 (music + documentary visuals, no VO); FACT/CLAIM/ANALYSIS/SPECULATION labels; 2003 conviction always with "overturned on appeal"; ParlView FREE SWAP; REUSE list from lf03 (Albanese film folder not found on repo).
- Not done (per brief): VO recording, B-roll, downloads, PASTE_BRIEF, PR/merge.

## 2026-10-06 (AEDT) — S31 VO edit (approved)

- Abhishek approved the S31 migration update. Applied in **both** `audio/vo-text/S31.txt` and `audio/vo-grok/S31.txt`: "On policy, One Nation has promised what it calls net-negative migration for three years, followed by a ceiling of one hundred and thirty thousand a year." Rest of S31 unchanged. PUBLISH_CHECKS row 8 → VO edited. S12 / S40 optional tweaks **not** applied.

## 2026-10-06 (AEDT) — asset pass (REUSE + free downloads + VO paste pack)

- **Albanese film assets:** not found on any remote branch, local worktree, or Google Drive. Downloaded `IMG-albanese-dfat.jpg` fresh (Commons, CC BY 4.0, DFAT/AUSPIC). GFX_75_lock / GFX_PM_ladder / GFX_rate_staircase / GFX_approval_dial listed as Claude-rebuild cards in SCRIPT_NOTE. Howard portrait skipped (licence unclear).
- **Images (26):** 15 REUSE from lf03 (Hanson ×3 incl. CC0 2016, Abbott, Joyce, Faruqi, Parliament House, both chambers, two courts, Albury ×2, Adelaide, Ipswich); 8 REUSE from lf04 (Chalmers, Parliament exterior, Treasury, housing ×3, Melbourne Box Hill aerial, Sydney skyline); new Taylor (CC BY 4.0) and Ley (CC BY 3.0 AU). Farley skipped (family in frame / news material). `images/CREDITS.md`.
- **Footage (46):** F01–F20 REUSE lf03, F21–F34 REUSE lf04, F35–F46 new (Pixabay ×9, Mixkit ×2, Commons ×2; re-encoded ≤1080p, ≤20 s, audio stripped): light plane, supermarket trolleys, piggy bank, Melbourne tram + aerial, Sydney Harbour timelapse, Sydney landing, screens abstract, TV static, AUD $50 notes, Sydney CBD, Brisbane. No ParlView. `footage/CREDITS.md` + `footage/SKIPPED.md` (US pump/US dollars/Tokyo crowd/Russian supermarket etc. rejected).
- **Music/SFX:** lf03/lf04 pack (4 Mixkit beds + 9 sfx incl. series sting, SHA-256 verified) → `audio/music`, `audio/sfx`, `audio/MUSIC_CREDITS.md` with lf05 bed/cue map and gaps (no chess/pluck bed, no stamp/propeller/TV-click sfx).
- **B-roll:** B01–B03 REUSE lf03 (ballot, Senate seats, phone). B04–B09 prompts written in `broll/PROMPTS.md` — **not generated** (no Grok Imagine access in this pass).
- **render:** `render/gfx.py` + fonts copied from lf03.
- **VO paste pack:** `/workspace/lf05-albanese-hanson/vo-paste/` S01–S41.txt (Atlas, Australian English, per-segment delivery mode/pace + pronunciation hints), BATCH_A–D for 4 parallel recorders, README. **Voice not recorded.**
- PASTE_BRIEF **not written** (voice missing).

## 2026-10-06 (AEDT) — AI B-roll B04–B09 seated

- Confirmed `broll/B01–B09.mp4` present (B01–B03 REUSE lf03; B04–B09 copied from `/workspace/lf05-albanese-hanson/broll/` after VideoReview PASS).
- Rewrote `broll/MANIFEST.md` for all nine clips + beats; first AI appearance → Dramatised reconstruction label in edit.
- `broll/PROMPTS.md` generation status → **generated**.
- PASTE_BRIEF still not written (voice missing). No merge/PR.

## 2026-10-06 (AEDT) — VO evened + PASTE_BRIEF seated

- Ran `even_vo_pace.py` (rubberband pitch-held + silenceremove, ±6% ceiling). Evened `audio/vo/S01.mp3`–`S41.mp3` (41 files). Raw untouched in `audio/vo-raw/`.
- Median raw WPS **2.5836**. Pace table saved to `audio/vo/PACE_REPORT.md`.
- Ceiling outliers still far from median: S01 (2.365), S09 (2.400), S20 (2.409), S39 (2.465) still slow; S35 (2.751), S41 (2.685) still fast. Do not retime further.
- Wrote complete `PASTE_BRIEF.md` for Claude Code (documentary style locked; mid-rolls S13/S25/S33; ParlView FREE SWAP; music ~85% quieter under VO; 1× build → 1.28× pitch-held + loudnorm −14 LUFS / ≤−1.5 dBTP; asset inventory F01–F46, images, B01–B09, music/sfx).
- No merge, no PR, no @claude, no YouTube/Drive upload.

## 2026-10-06 (AEDT) — edit, mix and master delivered

- Built `render/` pipeline from the lf04 one (design, timing, cut, media, render, mix, musicdip, master, deliver). Documentary picture only: real free footage first, Ken Burns photos, evidence cards and data graphics, AI B-roll last. No map film.
- 1x edit 18:30.6 (holds H0–H9, mid-roll beats after S13 / S25 / S33, end screen). VO files placed untouched at one fixed gain.
- Master `final/lf05-albanese-hanson.mp4`: whole film at 1.28x, pitch held, 14:27.7, 95.4 MB, HEVC 1080p30 + AAC. Two-pass loudnorm on the master only: **−14.0 LUFS, −1.8 dBTP**. Music under the voice 27.5 dB below hold level (about 85% quieter).
- Delivered: `final/chapters.md` (YouTube chapters, mid-roll times, cue sheet), `final/contact-sheet.jpg`, `final/contact-sheet-shots.jpg`, `final/loudnorm-report.md`, `final/DESCRIPTION.md` (draft), `final/DELIVERY_NOTES.md`.
- QC holds (seated but not used): B04 (readable price digits), F09/F10 (US flag), F12 (New York cabs), F13 (Tokyo), F30 (close face), F14 (private person close-up). S28 card omits "36–17" (not spoken).
- No merge, no PR, no @, no YouTube upload.
