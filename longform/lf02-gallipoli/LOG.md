# lf02 log

2026-10-04 12:48 AEDT — Scaffold only. Branch `scaffold/lf02-gallipoli` off `main` (`d9aa880`). Production script v2 seated in `script/script.md` from the source PDF (page form-feeds stripped; narration and shot list kept faithful). Music (8 Mixkit mp3s) and in-house sfx (29 flacs including `series_sting.flac`) copied byte-identical from lf01 approved commit `b3973eb`. Paste-ready vo-text V01–V36 including V16b written. Empty `audio/vo/`, `broll/`, `images/` with `.gitkeep`. Voice takes, Imagine B-roll clips, and real historical photos not yet seated. No render pipeline, no final, no PASTE_BRIEF.

2026-10-04 — voice V01–V36 including V16b seated (Atlas), 20 real photos seated (see images/CREDITS.md), Imagine B01–B08 seated, B09+ still generating.
2026-10-04 — Imagine B09–B20 seated. B12b and B21–B32 still generating.
2026-10-04 — Imagine B12b and B21–B32 seated. All 33 B-roll clips are in.

2026-10-04 — Picture, edit, mix and master built (branch `claude/model-opus-6aedwm`, cut from `scaffold/lf02-gallipoli` at `3fa5e58`; not merged, not uploaded).
- Whisper (faster-whisper medium.en) on the 37 seated takes; cut locked to the words. 1× cut 9:17.4; delivered master (whole film at 1.28×, pitch held) 7:15.5.
- **VO defects found and handled at the edit (files untouched):** `V27.mp3` speaks a delivery instruction aloud ("After the first sentence, hold a clear pause before continuing,"), and `V31.mp3` opens with the spoken words "Australian accent." Neither is Part 4 narration. The edit plays only the clean parts of those takes (V27: 0–3.70 s + 8.20 s–end; V31: 2.10 s–end), cut points in room tone. Re-recording those two chunks would be the clean long-term fix.
- 33 B-roll clips placed in Part 3 order, muted, none longer than Part 3 (several trimmed shorter where the real takes are tighter than the script clocks). B-roll ≈ 35% of runtime vs the script's ~45% target; no shots added to chase it.
- Photo/clip pairs the script itself places next to each other are kept in script order: B08 → IMG03, B11 → IMG01, IMG07 → B12b, B17 → IMG10, B19 → IMG18. Also IMG20 (Western Front trench PIP) → B04 (trench in rain) reads as the same subject; kept in script order and flagged.
- Map cards are kept fully on screen; where a card's place is near the frame edge the card is nudged inward and the pin stays on the true place.
- Master: −14.0 LUFS integrated, −2.1 dBTP true peak (two-pass loudnorm on the 1.28× master only).
