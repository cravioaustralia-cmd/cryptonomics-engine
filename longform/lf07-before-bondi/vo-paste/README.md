# BEFORE BONDI — Grok VO paste kit (vo-paste)

One file per segment: `S##_ATLAS.txt` (odd segments) or `S##_ARA.txt` (even segments). Line 1 of each file (`===== S## (ATLAS) =====`) is a header and is NOT part of the prompt. Paste everything below the header (the instruction paragraph, a blank line, then the narration) into Grok, generate, download the MP3 and save it as `audio/vo-raw/S##_ATLAS.mp3` / `S##_ARA.mp3`.

## Rules for every take

- Same prompt style for all 46 segments. Do NOT add 'slow down', 'separate the words' or 'leave silences' to any prompt (an earlier over-instructed take sounded slow and robotic). The pauses between paragraphs are created later in editing; a blank line in the text is only a short natural beat.
- Atlas = odd segments, Ara = even segments (checked against the script's own labels). Keep the voice, accent, output format and pace identical across all takes; use one new chat per segment so earlier context does not drift the tempo or pitch.
- Every segment is one take. If a take is wrong, regenerate that segment only with the identical prompt. Tags are already removed: no [pause], <soft> or <slow> appears in any file.
- Source texts: `audio/vo-text/S##.txt` (single paragraph, for alignment and captions) and `audio/vo-grok/S##.txt` (paragraphs at the pauses). Full structured data: `script/SEGMENTS.json`.
- Fact-check edits (10 Oct 2026) are APPLIED to the text and prompts of S03, S04, S05, S08, S09, S10, S11, S16, S19, S24, S26, S27, S30, S35, S36, S40, S42, S43, S44 — see `script/VOICE_EDITS_APPLIED.md`. Any take generated before this change for those segments must be regenerated. S13, S21, S23, S33 are unchanged by decision.

## Batches (contiguous)

| Batch | Segments | Atlas (odd) | Ara (even) | Spoken words |
|---|---|---|---|---|
| A | S01–S08 (8) | S01, S03, S05, S07 | S02, S04, S06, S08 | 268 |
| B | S09–S16 (8) | S09, S11, S13, S15 | S10, S12, S14, S16 | 334 |
| C | S17–S24 (8) | S17, S19, S21, S23 | S18, S20, S22, S24 | 338 |
| D | S25–S32 (8) | S25, S27, S29, S31 | S26, S28, S30, S32 | 330 |
| E | S33–S39 (7) | S33, S35, S37, S39 | S34, S36, S38 | 210 |
| F | S40–S46 (7) | S41, S43, S45 | S40, S42, S44, S46 | 297 |

Tip: within a batch, do all Atlas files first, then all Ara files, so each voice is selected once per batch (the files are independent, so the order does not matter).

Audition note from the script (section 5): generate S10 and S11 in Ara (backup Eve) next to Atlas before committing to the female voice. Never mix the two female voices.

## Segment checklist

| Seg | Voice | Words | Delivery |
|---|---|---|---|
| S01 | Atlas | 33 | quiet, grave, unhurried |
| S02 | Ara | 45 | searching, clear |
| S03 | Atlas | 24 | leaning in, conspiratorial |
| S04 | Ara | 43 | quiet, then a chill |
| S05 | Atlas | 35 | hushed, ominous |
| S06 | Ara | 29 | warm, intriguing |
| S07 | Atlas | 30 | calm, setting the contract with the viewer |
| S08 | Ara | 29 | investigative, vivid |
| S09 | Atlas | 36 | clear, rhythmic |
| S10 | Ara | 50 | formal, then weighty |
| S11 | Atlas | 42 | grave, then pointed |
| S12 | Ara | 37 | turning, building a bridge |
| S13 | Atlas | 41 | storytelling, quiet surprise |
| S14 | Ara | 30 | warm, vivid |
| S15 | Atlas | 50 | soft, even, equal weight to both halves |
| S16 | Ara | 48 | warm, grounded |
| S17 | Atlas | 31 | connecting, forward hook |
| S18 | Ara | 37 | clear, a small reveal |
| S19 | Atlas | 46 | neutral, both cases in identical tone |
| S20 | Ara | 55 | historic, connecting the dots |
| S21 | Atlas | 54 | neutral, attacked from both sides |
| S22 | Ara | 34 | tense, reading plainly |
| S23 | Atlas | 35 | weighty, then a turn inward |
| S24 | Ara | 46 | tender, slow |
| S25 | Atlas | 33 | steady, three voices read plainly |
| S26 | Ara | 43 | factual, gentle |
| S27 | Atlas | 44 | empathetic, then even |
| S28 | Ara | 19 | quietly ominous |
| S29 | Atlas | 36 | grave, steady |
| S30 | Ara | 55 | heavy, careful, then precise and attributed |
| S31 | Atlas | 43 | tense, fair |
| S32 | Ara | 57 | even, two matched cases |
| S33 | Atlas | 44 | a divided country |
| S34 | Ara | 27 | realisation, the big payoff |
| S35 | Atlas | 25 | hopeful for a beat, then two slow words |
| S36 | Ara | 28 | quiet dread |
| S37 | Atlas | 36 | grief, restrained |
| S38 | Ara | 18 | solemn, plain |
| S39 | Atlas | 32 | quiet courage, building |
| S40 | Ara | 34 | warm, a lump in the throat |
| S41 | Atlas | 48 | careful, fair |
| S42 | Ara | 60 | steady, then resonant |
| S43 | Atlas | 44 | stillness, then rhythm |
| S44 | Ara | 34 | quiet conviction |
| S45 | Atlas | 49 | warm, final |
| S46 | Ara | 28 | gentle, caring |
