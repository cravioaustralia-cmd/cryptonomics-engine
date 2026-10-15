# lf09 PASTE BRIEF: Is Australia Full? (rules only)

You (Claude Code) decide all design, editing, mix and pacing. Nothing here has been paced or processed. This file is rules only.

## 1. Branch and paths
- Repo branch: `scaffold/lf09-australia-full` (worktree `/workspace/cryptonomics-engine-lf09`)
- Episode folder: `longform/lf09-australia-full/`
- Script: `script/PRODUCTION_SCRIPT.pdf` (master) and `script/PRODUCTION_SCRIPT.txt` (pdftotext)
- Spec to follow (reference, don't copy): Part 2 Rules · Part 3 Visual system (incl. 3.10 AI B-roll, 3.11 Voice pacing and mix) · Part 5 Shot-by-shot script · Part 7 Evidence register · Part 9 On-screen numbers. Part 8 = asset IDs; Part 11 = disclaimer.
- 44 segments S01–S44, single narrator (Grok voice Atlas), 16:9 1920×1080, 30 fps.

## 2. Raw VO
- `audio/vo-raw/S01.mp3` … `S44.mp3`: raw Atlas takes, unprocessed. Narration text = script Part 6 (paste prompts in `vo-paste/`).
- You handle the mix and pacing per script Part 3.11.
- Keep all segments at one steady, natural tempo with pitch held. Never stretch so far it sounds robotic.
- Check every name with Whisper or another ASR against the script text, segment by segment.
- Pronunciation watch-list: Albanese (al-buh-NEE-zee), Canberra (CAN-bruh), Specsavers, DemosAU ("Demos A-U"), Farrer, Sheehy.
- If a word is clearly wrong, do NOT fake or patch it: report to the user which segment needs a retake, and the word.

## 3. Asset map
- Master list: `assets-list/ASSET_LIST.md` and `assets-list/lf09_Asset_List.xlsx` (ID, file, source URL, licence, credit, status).
- Photos (real people, free licences, never altered): `images/` (IMG_*). Credits in the asset list.
- Stock B-roll: `footage/` (REUSE items, credits in asset list) and `footage/stock/` (new Pexels, credits in `footage/stock/STOCK_CREDITS.md`).
- AI B-roll: `broll/BR_AI_*.mp4` and `broll/BR_AI_thumbnail_bg.png`; prompts in `broll/AI_PROMPTS.tsv`.
- Music: `audio/music/MUS_01…MUS_06` (Mixkit, REUSE; credits in asset list / lf08 `audio/MUSIC_CREDITS.md`).
- SFX: `audio/sfx/` (.wav = REUSE, credits in asset list; .mp3 = new Pixabay, credits in `audio/sfx/SFX_CREDITS.md`).
- File names match the script IDs. Exceptions: `BR_STOCK_passport_desk_generic` is .mp4; `BR_STOCK_adelaide_skyline` and `BR_STOCK_house_sold_sign` are stills; `IMG_farley` is .png.
- Stand-ins (see asset-list notes): motorway clip is not Australian; construction and campus clips are approximate.
- Built-in animation (Part 8.7) is yours to build; nothing to collect.

## 4. Missing items and fallback rule
Missing:
- ParlView FT01, FT02, FT03, FT04, FT05: FREE SWAP per script (Part 4 + each segment). Use a real free photo + quote/date card + B-roll/animation. Never use news, agency, press-conference or National Press Club footage.
- BR_STOCK_orchard_ladders, BR_STOCK_empty_lectern_microphone, BR_STOCK_graduation_caps_air, BR_STOCK_country_pub_exterior, BR_STOCK_motel_sign_dusk.
Fallback rule: use the script's own fallback for that slot (Part 8 tables, Part 4 FREE SWAP). Otherwise fill the slot from assets already in the folder (other stock, AI B-roll, maps/cards/animation). Missing photo = the script's name card (no silhouette or drawn face). Never fetch non-free media, never generate a real person.

## 5. AI clips
- `broll/BR_AI_*.mp4` are 720p, 10 s, with a visible Grok watermark bottom-right. Crop or cover the watermark in every use.
- `BR_AI_thumbnail_bg.png` is rough with garbled text. It is optional; do not let garbled text reach the final frame.

## 6. Hard rules
- No AI-generated or altered real people. Real people only from the free photos/footage, unaltered.
- No crowds of migrants or travellers; no religious or national dress; no flags as main subject; no party logos (script Part 2, 3.10).
- Every claim card carries its label: FACT / CLAIM / ANALYSIS / SPECULATION, as in Part 5 and Part 7.
- "Copying" is only ever a question, never a statement.
- Equal weight for both sides (Labor's case and the pattern case).
- Exact quotes only, matched to Part 7. Numbers only from Part 9.
- "Dramatised reconstruction" label where the script asks for it (first AI B-roll, S01).

## 7. Sync and continuity
- Picture, voice and SFX in sync from start to finish.
- No gaps, no black frames, no empty frames anywhere. A previous film had a mid-film screen cut: verify the full runtime, not samples.

## 8. Outputs
1. A 1× cut (full film at natural speed).
2. A 1.28× master (the same cut at 1.28× speed, pitch held).

## 9. Checks you run yourself (report the numbers)
- Duration of each output; segment count = 44 and all VO present in order.
- Black/empty frame scan over the whole runtime of both outputs (e.g. ffmpeg `blackdetect` and `freezedetect`): zero hits outside intended holds.
- Silence scan (`silencedetect`) on the narration: no unintended gaps.
- Loudness: narration and master to Part 3.11 targets (integrated LUFS, true peak), measured with ffmpeg `ebur128`/`loudnorm`.
- A/V sync: audio and video stream durations match within one frame.
- ASR pass on the final narration vs Part 6 text: list any mismatched words and names.
- Watermark check on every AI B-roll shot used.
- Every on-screen number and quote checked against Parts 7 and 9.
- 1920×1080, 30 fps in both outputs.
