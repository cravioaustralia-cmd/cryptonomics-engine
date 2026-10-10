# lf06 Gaza Ch1 (S05–S13) — LOG

## 2026-10-10 (AEDT) — scaffold to paste brief
- Branch `scaffold/lf06-gaza-ch1` from origin/main (d9aa880). Documentary pilot of "14,000 KILOMETRES — Why Gaza Matters in Australia" Chapter 1.
- Checks: Australia first yes VERIFIED (alphabetical roll call: Afghanistan no, Argentina abstain, Australia yes). S12 edited to "about one hundred thousand Jewish Australians" (ABS 2021: 99,956; Islam 813,392).
- Voice (Grok, text chat): Ara S05/S12, Atlas S06–S11/S13. S06 retaken (Atlas spelled Evatt as letters), S07 retaken (too fast, no beats). Evened with `render/even_vo_pace.py` (S07 left with its beats). Chapter VO total 1:56.
- Real media: photos PH01/01b/02/02b/02c/02d/03/04/05/06/06b/26/26b; footage FT02/02b/02c/FT05b/ST06; UN docs DOC01/DOC02/DOC02b; DOC10 ABS data; Natural Earth + 1947 partition geometry; fonts. FT05 skipped (paid), PH06 modern Lakemba, Anefo CC0 agency photos not used.
- Music + SFX: Mixkit set; SFX19 stand-in; nobody has listened to music.
- AI: AI03_b_v2 and AI05_a_v2 (720p, VideoReview PASS 6/10); first-pass clips FAILED and were replaced.
- PASTE_BRIEF written. No merge, no PR, no upload.

## 2026-10-10 (AEDT) — edit, mix, master (pilot cut)
- Built from the real VO (`render/timeline.py`, word times in `render/words.json`): 1x cut 2:12.3, 1.28x pitch-held master 1:43.4. Holds per script; 0.4 s handover air; S10 widened in its own pause for the 2.0 s "same event" hold (files untouched).
- Renderer `render/film.js` (canvas + d3-geo, Playwright capture), maps MAP01–MAP04 built from Natural Earth + the 1947 partition geometry, evidence cards per docs/EVIDENCE_CARDS.md.
- Mix `render/mix.py`, master `render/master.py` (1x: static gain + limiter, -14.2 LUFS; 1.28x: rubberband + two-pass linear loudnorm, -14.0 LUFS, -2.2 dBTP).
- QA `render/qa.py`: S10 halves 956/956 px, 22.51 s each, labels same frame; stillness runs listed in final/DELIVERY_NOTES.md.
- Nobody has listened to the cut. No merge, no PR, no upload.
