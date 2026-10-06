# lf05 — VO paste pack (Grok Atlas)

Film: *94 Seats vs 30%: Can Albanese Stop Pauline Hanson?*
Built 6 Oct 2026 (AEDT) from `longform/lf05-albanese-hanson/audio/vo-text/S01–S41.txt` on branch `scaffold/lf05-albanese-hanson` (includes the approved S31 migration edit and the S33 High Court edit). 41 segments, ~2,614 words.

**Status: NOT RECORDED.** No MP3 exists yet. These are paste-ready prompts only.

## Delivery (locked, every segment)

All 41 files use the same delivery instruction — no per-segment HOOK/STORY/EVIDENCE/WEIGHT modes and no words-per-minute targets:

> Delivery for this segment: steady humane documentary pace, one even tempo across the whole film (about conversational clarity, never abrupt fast or slow). Do not swing between modes.

## How to record

- One paste = one segment = one MP3. Same Atlas voice and identical settings every time. Australian English.
- Each `S##.txt` = instruction header + the single locked even-tempo delivery line (above) + pronunciation hints (only where the name occurs) + the spoken words. The words below "Speak only the narration below:" are the source of truth; paste the whole file.
- Delivery tags (`[pause]`, `<slow>` etc.) are deliberately NOT in these files so Atlas cannot read them aloud. Tagged versions are in `audio/vo-grok/` if needed.
- Save as `S01.mp3` … `S41.mp3` into `longform/lf05-albanese-hanson/audio/vo-raw/` (raw), then the even-pace pass writes `audio/vo/`. Any residual pace drift is evened later by the parent (max ±6%).
- Check pronunciation on playback: Albanese, Farrer, Faruqi, Rinehart, DemosAU ("DEM-oss A-U"), Grayndler. Re-take any segment that misreads a number.
- Do NOT change wording. S12 and S40 optional tweaks were NOT applied — record as written.

## Parallel batches (contiguous, roughly equal words)

| Batch | Segments | Words |
| --- | --- | ---: |
| A | S01–S14 | 667 |
| B | S15–S26 | 731 |
| C | S27–S34 | 618 |
| D | S35–S41 | 598 |

- `BATCH_A–D.txt` concatenate the segment files for each parallel recorder as a reading list. Still paste **one `===== S## =====` block at a time** into Atlas; never paste a whole batch as one generation.
