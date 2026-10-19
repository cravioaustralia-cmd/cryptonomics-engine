# lf10 PASTE BRIEF: Who Really Runs Australia? The Hunt for the Kingmaker (rules only)

You (Claude Code) decide all design, editing, mix and pacing. Nothing here has been paced or processed. This file is rules only. Documentary style throughout.

## 1. Branch and paths
- Pull branch `scaffold/lf10-kingmaker` (worktree `/workspace/cryptonomics-engine-lf10`). Episode folder: `longform/lf10-kingmaker/`.
- Script: `script/PRODUCTION_SCRIPT.pdf` (master) and `script/PRODUCTION_SCRIPT.txt`. S37 / shot 7.2 is updated in the txt and is the one to follow (changes from 1 July 2026, national caps from 1 January 2027).
- Follow the script's "How this script is built" rules: two layers on every shot, a real BASE (PARL / ARCHIVE PHOTO / B-ROLL / DOC) and an animation OVERLAY only when narration explains. Explain mode and witness mode as the script describes them. The case board, suspect tags and palette are the script's; how they look is up to you.
- 45 segments S01–S45, single narrator (Grok voice Atlas), 16:9 1920×1080, 30 fps.

## 2. Raw VO
- `audio/vo-raw/S01.mp3` … `S45.mp3`: raw Atlas takes, unedited, not listened to. They are the source of truth for words and timing. Text is in `vo-paste/Snn_ATLAS.txt`.
- Keep one steady, natural pace across all segments. You decide the pace. Pitch held, never robotic.
- Never speed up, stretch or loudnorm the voice on its own. Loudness is set on the master only.
- Check every name with Whisper or another ASR against the vo-paste text, segment by segment.
- Pronunciation watch-list: Albanese, Canberra (CAN-bruh), Whitlam, Holmes à Court, Druery, Rinehart, Kooyong, Bennelong, Dickson, Climate 200, Babet.
- If a word is clearly wrong, do NOT fake or patch it: report to the user which segment needs a retake, and the word.

## 3. Asset map
- Master list: `assets-list/ASSET_LIST.md` and `assets-list/lf10_Asset_List.xlsx` (segment → base asset, ID, file, source URL, licence, credit, status). Counts: REUSE 46 · NEW 69 · MISSING 38.
- Photos (real people, free licences, never altered): `images/` (credits `images/CREDITS.md`). Stock B-roll: `footage/` (credits `footage/CREDITS.md`). Doc screenshots: `docs/` (credits `docs/CREDITS.md`).
- AI B-roll: `broll/BR_AI_*.mp4`; prompts in `broll/AI_PROMPTS.tsv`.
- Music `audio/music/MUS_01…MUS_09` and SFX `audio/sfx/` (credits `audio/MUSIC_CREDITS.md`). Mood map follows the script's music section.
- Credit tags: every real asset gets the script's small corner credit (source / licence / author) from the credit files.

## 4. Missing items and fallback rule
- ParlView is NOT used (APH conditions: no digital manipulation, fair and balanced reports only). All 18 PV rows (PV01–PV18) use the still or doc fallback listed in the asset list. Never use TV news, AAP/Getty, newspaper pages, NFSA or press-conference footage.
- Other missing items (20): IMG_packer, IMG_druery (use the script's name card), IMG_perth_mining_tax_rally_2010, IMG_polling_place_pre1955, DOC_aph_news_and_fair_facts_1992, and 15 B-roll rows (BR_STOCK_haul_trucks_slowmo … BR_STOCK_bondi_eastern_suburbs_aerial). Each has a fallback in its notes.
- Fallback rule: use the listed fallback. Otherwise fill the slot from assets already in the folder (other stock, AI B-roll, cards/animation). A missing photo becomes a name card (no silhouette or drawn face). Never fetch non-free media, never generate a real person.

## 5. AI clips
- `broll/BR_AI_*.mp4` are 720p 10 s Grok Imagine clips with a visible Grok watermark bottom-right. Crop or cover it in every use. Mute their audio.
- The first Imagine clip on screen is labelled "Dramatised reconstruction".

## 6. Hard rules
- No AI-generated or altered real people. Real people only from the free photos, unaltered.
- No real footage on what-if beats (e.g. S21 "if money alone could buy power…"). Use animation or AI there.
- Cards and numbers must match the spoken words exactly (S37: CHANGES FROM 1 JULY 2026 · NATIONAL CAPS FROM 1 JANUARY 2027 · Source: AEC). Quotes and figures only from the script's fact sheet.
- Turnbull's 2018 downfall stays framed as his view, with News Corp's denial on screen. Balanced, equal time for both sides in S38.
- Stand-ins carry an honest label where a viewer could be misled: overseas crowd (BR_STOCK_crowd_street_crossing), non-Australian ore train (BR_STOCK_ore_train), gold mine for iron ore (IMG_super_pit_kalgoorlie), 2016 ballot rendering for 2013 (IMG_senate_ballot_vic_folded), and "Illustrative" on generic B-roll. Full stand-in list in the asset-list notes.
- No flags as main subject, no party logos, no readable unrelated text, no sirens.

## 7. Sound, sync and continuity
- Chapter holds (music + picture, no VO) before each chapter and each suspect.
- Hits and SFX land on picture changes, never on words. Mute every video clip's own audio.
- Picture, voice and SFX in sync from start to finish. No gaps, black frames or frozen frames anywhere.

## 8. Outputs
1. A 1× cut (full film at natural speed).
2. A 1.28× cut (the same cut at 1.28× speed, pitch held).
- Both: 1920×1080, 30 fps. Two-pass loudnorm on the master only, about -14 LUFS integrated, true peak ≤ -1.5 dBTP.
- Push both final mp4s to `final/` on the branch. Any file over 100 MB: byte-split into parts under 95 MB plus `SHA256SUMS` (as lf09).
- Write `final/DESCRIPTION.md`: paste-ready YouTube description with the disclaimer, chapters for both cuts, sources, only the credits actually used, and contact email placeholder `[your email]`.
- Do not merge, no PR, no @mentions, no YouTube upload.

## 9. Checks you run yourself (report the numbers)
- Duration of each output; segment count = 45 and all VO present in order.
- Black and frozen frame scan over the FULL runtime of both outputs (ffmpeg `blackdetect` and `freezedetect`): zero hits outside intended holds.
- Silence scan (`silencedetect`) on the narration: no unintended gaps.
- Loudness of both masters (integrated LUFS, true peak) with ffmpeg `ebur128`/`loudnorm`.
- A/V sync: audio and video stream durations match within one frame.
- ASR pass on the final narration vs the vo-paste text: list any mismatched words and names.
- Watermark check on every AI B-roll shot used; every on-screen number and quote checked against the script.
