# lf04 housing — LOG

## 2026-10-05 (AEDT) — scaffold

- Branch `scaffold/lf04-housing` cut from `origin/main` via worktree `/workspace/cryptonomics-engine-lf04`.
- Episode folder `longform/lf04-housing/` created (documentary, not map film).
- Copied VO text S01–S40 into `audio/vo-text/`; empty `audio/vo/` with `.gitkeep`.
- Copied Mixkit music + in-house/Mixkit/Pixabay/OGA sfx from lf03; wrote `audio/MUSIC_CREDITS.md`.
- Wrote `script/SCRIPT_NOTE.md`, `script/PUBLISH_CHECKS.md`, `broll/PROMPTS.md`, image/footage CREDITS stubs, `.gitignore` (match lf03).
- **Abhishek rule locked:** before every new chapter / suspect / major topic change, deliberate **music-and-visuals hold with NO voiceover** (picture edits + music rise), then resume narration. Mid-rolls stay after S13, S25, S34. No VO text change for holds.
- Publish checks: one VO edit in S28 (NOM forecast 260k → 245k). No ParlView / news-network downloads. No PASTE_BRIEF yet.
- Commit + push `scaffold/lf04-housing` (no force, no PR, no main).

## 2026-10-05 (AEDT) — documentary cut, mix and 1.28x master

- Built the film with the new `render/` pipeline (Python + ffmpeg). Not a map film: real free footage, Ken Burns photos, evidence cards, timeline/data graphics, and B01–B05 only on their mapped beats.
- Holds H0–H10 cut as no-VO music-and-picture beats (about 3.6 s at 1x), plus a 1.8 s mid-roll breath after S34. Mid-roll points only after S13, S25 and S34 (`final/chapters.md`).
- Card numbers match the spoken words only. S28 shows about 245,000 for this financial year.
- AI clips carry a small "Dramatised reconstruction" label on every appearance, not only the first. The label is an overlay and is not baked into the B-roll files.
- Named people: IMG-01 Bullock, IMG-04 Chalmers (framed inset), IMG-05 O'Neil (framed inset, the spokesperson line is labelled as a spokesperson's). No AI faces. Sam has no face.
- No ParlView, chamber video, news-network or RBA conference video. Budget and Senate beats use F23 exterior, IMG-04, IMG-07 and IMG-08 stills with cards.
- Footage QC: F24 has a man talking to camera at 0–5 s and the drone crew at 10–14 s and 18–20 s, so only 5–10 s and 14–18 s are used. F34 is a New York skyline and F28 shows readable neon text, so neither is used. F35's first second is black and skipped. The Westpac and Commonwealth Bank photos are cropped to avoid their rate and currency displays.
- VO files untouched. The mix applies one fixed +6 dB gain to all VO. The whole film went to 1.28x with rubberband (pitch held), then bus compression and a limiter, then two-pass loudnorm on the master only. Delivered master: -14.0 LUFS, -1.8 dBTP (`final/loudnorm-report.md`).
- Master is HEVC 1080p30 at 94 MB, kept under GitHub's 100 MB per-file limit because the repo has no Git LFS.
- Delivered: `final/lf04-housing.mp4`, `final/contact-sheet.jpg`, `final/contact-sheet-shots.jpg`, `final/chapters.md`, `final/loudnorm-report.md`, `final/DESCRIPTION.md` (draft only).
- Not uploaded. No PR, no merge, no @.

## 2026-10-05 (AEDT) — short fix: music levelling only

- Audio-only change, with no rebuild. The cut, picture, cards, VO, footage, B-roll, SFX, music tracks, chapters, mid-rolls and credits are unchanged.
- `render/mix.py` now runs a music leveller. The bed sits about 3 dB quieter and steady under the voice (median -33.6 dB RMS, was -30.7). Every no-VO hold and pause sits at one steady louder level (-21.6 to -20.1 dB RMS, was -31.6 to -19.9).
- Re-ran the 1.28x pitch-held master chain and two-pass loudnorm: -14.0 LUFS, -1.6 dBTP, linear second pass.
- Remuxed the new audio onto the existing HEVC stream with a stream copy. The video bitstream is byte-identical (same stream MD5). `final/lf04-housing.mp4` and `final/loudnorm-report.md` were overwritten.
- Not uploaded. No PR, no merge, no @.
