# Bondi final-vowel check (acoustic, wav2vec2 alignment + Praat formants)

'dye' = /aɪ/: F1 starts high (>=600 Hz) and falls, F2 starts low (<2000 Hz) and rises. 'dee' = /i/: F1 about 300 Hz and F2 about 2200-3000 Hz, flat. Mid-word gap (Bon|dye) was 0 ms in all 24 retakes (limit 150 ms); the final syllable was never louder than 'Bon' by more than 0.4 dB, so no odd stress. The 'dye' calls on sentence-final words (S03, S34) rest on a short, partly devoiced vowel (moderate confidence).

| Seg | Chosen | Result | Evidence (chosen take) | Other candidate |
|---|---|---|---|---|
| S01 | existing | **dee** | F1 ~300, F2 ~2300 flat | H dee, R dee |
| S03 | H | dye (moderate) | F1 861 -> 569, F2 1735 -> 1975, rate -19.8% so tempo x1.195 (artefact proxies pass) | R weak (F2 start 2273); existing dee |
| S04 | R | dye | F1 979 -> 206, F2 1671 -> 1815 | H dee |
| S07 | R | dye | F1 778 -> 283, F2 ~1500 | H dee |
| S10 | R | dye | F1 958 -> 424, F2 ~1780 | H dye but 'quote' missing, rejected |
| S12 | R | dye (both occurrences) | F1 983-1066, F2 ~1730-1760 | H dee |
| S17 | R | dye | F1 817 -> 423, F2 1788 -> 2021 | H dee |
| S34 | R | dye (sentence-final) | F1 1043 -> 705, F2 1609 -> 2450 | H dee |
| S36 | R | dye | F1 1043 -> 264, F2 1508 -> 2648 | H dee |
| S41 | existing | **dee** | F1 ~310, F2 ~2300 | H dee, R dee (and R lost 'quote') |
| S43 | existing | **dee** (moderate) | F1 max 515-610, F2 ~2100-2200 | H and R both ambiguous-to-dee |
| S44 | H | dye | F1 1018 -> 352, F2 1696 -> 2486 | R dye too; H closer in f0, WER 0 |

Still 'dee': S01, S41, S43. Do not touch pitch or audio to fix this; report it in BUILD_NOTES.
