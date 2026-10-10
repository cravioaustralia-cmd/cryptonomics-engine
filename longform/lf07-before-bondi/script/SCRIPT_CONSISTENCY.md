# BEFORE BONDI — SCRIPT CONSISTENCY FINDINGS

Checked 10 Oct 2026 against `PRODUCTION_SCRIPT.txt`, `assets-list/*.csv` and `Before_Bondi_Asset_List.xlsx`.
Programmatic checks were run (asset IDs, start times, counts); results below. Nothing was changed.

## 0. What is consistent (checked, no issue)
- 46 segments S01–S46; Atlas = odd (23), Ara = even (23); the script's own labels agree with the odd/even rule for all 46.
- Segment_Index.csv ↔ script: start times, chapter, voice identical for all 46 (0 differences). xlsx "Voiceover" tab = Voiceover.csv (0 differences). Mid-roll flags: S12 and S28 only, matching Section 2.
- Quote register: 12 cards; balance line 6+1+2+1+1+1 = 12 ✔ matches the cards.
- Every asset ID that appears anywhere in a segment exists in the asset list (0 IDs missing from the list). Every ID in the list is used somewhere in the script (0 orphans).
- Quiet-moment list (S01, S15, S24, S36, S37, S45) matches the segments marked QUIET.
- Runtime: S46 starts 13:41; ≈11 s narration → ≈13:52 + 15 s end screen ≈ 14:07 ≈ the stated ~14:08 ✔.
- Countdown arithmetic: every value in Section 10 recomputes exactly (see PUBLISH_CHECKS.md), except the final +365.

## 1. Word counts (Atlas 891 / Ara 884)
- Stated: 891 / 884 (total 1,775).
- Counting the Section 7 text exactly as printed gives 891 / 884 ✔.
- Counting the **actual spoken text in Section 8 / the voice files** gives **Atlas 891, Ara 887 (total 1,778)**. Cause: Section 8 spells "F thirty-five" (S18, twice → +2) and "U.N. backed" (S30 → +1) where Section 7 has "F-35" and "U.N.-backed". Ara is therefore 3 words over its stated figure. Balance is still ~50/50 (50.1% Atlas). Update the stated figure (and the Summary tab "Ara words 884") to 887, or leave and note that it counts Section 7.
- If the proposed edits in PUBLISH_CHECKS_SEGMENTS_AFFECTED.md are all applied: Atlas −3, Ara +9 → ≈888 / 896; re-state totals.

## 2. Factual / numeric inconsistencies inside the script
1. **77 vs 78 years**: Section 10 "1947 → 2025: 77 years" contradicts S03 ("seventy-eight years") and the −78 YEARS countdown. Correct value 78.
2. **Sydney–Melbourne 800 km** (S04, Section 10) — straight line ≈713 km, road ≈880 km, and Melbourne is south-*west*. Section 10 itself says "Keep consistent". Use ≈700 km.
3. **Royal Commission final report**: S42, Section 10 (Royal Commission row, countdown +365 · 14 Dec 2026) and Section 12 all say 14 Dec 2026 / "one year to the day". The deadline was extended to **18 Dec 2026** → +369; "one year to the day" is now false.
4. **"Same suburb"** (S03, S36; Section 12 already flags it): the restaurant is reported as North Bondi, the attack was at Bondi Beach.
5. **S35 "Sixty-five days later"** counts from the ceasefire start (10 Oct), while the same sentence says the ceasefire "brought the hostages home" (13 Oct = 62 days). Clarify as "after the ceasefire began".
6. **S13 vs DOC02 vs S20**: S13 states in the film's own voice that Australia was the first to vote yes; S20 attributes it to the PM; DOC02 prints "(first)". Only the PM attribution is sourced.
7. **S11 label "Opposition Leader Sussan Ley"** and the cast-board/QT02 label are out of date (Ley replaced 13 Feb 2026). Section 9's balance line "Opposition (1)" should read "then Opposition leader".
8. **S08/S09/S05 vs QT12 card**: card says "layer cake" of *middlemen*; Burgess said "layer cake of *cut-outs*".
9. Pronunciation note (Section 8 line "Evatt (EV-at)") vs the brief's "Evatt = EV-it": the script says EV-at; the voice prompts use EV-it only when the name is spoken — it is **never spoken** in any narration (on-screen only), so no conflict in practice. Likewise Payman, AUKUS, Lattouf, Binskin, Herzog, Mashni appear in the pronunciation guide but in **no narration line** (Payman and AUKUS appear nowhere in the script at all — leftovers from an earlier draft). The vo-paste files include a hint only when a name occurs in the segment text, so this is harmless; remove the dead entries from Section 8's guide.

## 3. Voice / sound rule conflicts
1. **S01 uses a countdown tick (SFX24)** at "fourteenth of December", but S01 is a QUIET moment and Section 4 says "No countdown tick sound during quiet moments". (S24 correctly says "no tick in quiet moments".) Either drop the tick in S01 or exempt the first appearance.
2. **S15 (QUIET)** triggers a pin thunk (SFX21) on "opposite ways"; the quiet rule says "no stamps, shakes or comic effects" — a thunk is borderline; consider a softer pin sound.
3. Countdown (M9) coverage: Section 6's M9 "Where" list omits **S03** (−78 YEARS flash), **S08** (chapter-card ticker) and **S14** (−108 YEARS) although those segments show a countdown; it includes **S29**, whose own visual track says "No motif". M1 (Thread) "Where" list omits S12, S17, S23, S28, S42, where segment motif lines call it.

## 4. Asset ID usage vs the asset list
No ID is missing from the list. But the list's "Used in segments" column and the segments' own Assets lines disagree in these places:

| Asset | Appears in script segments not listed in the asset list's "Used in" | Segment Assets line lacks it |
|---|---|---|
| FT04 (Real Footage), MAP08 | S02 (wall of nine images) — list says S21 only | S02 |
| MUS02 | S15, S17 (list: S13, S14, S16) | S15, S17 |
| MUS06 | S16, S28 (list: S15, S23–S27) | S16, S28 |
| MUS07 | S23 (list: S17–S22) | S23 |
| PH18 | S30 (list: S27, S29) | S30 |
| SFX05 | S39, S41 (list has 14 segments but not these) | S39, S41 |

Other points:
- Assets listed in a segment's Assets line but never referenced in its visual track/cue table (informational; mostly music and the two chapter cards): SFX09, SFX10, SFX19 (S18 — jet, factory, stamp have no cue-table trigger); SFX24 (S22); ST13 (S25, S40, S44 — referenced only as "the candle"); AI05 (S27 — referenced as "suitcases from S16"); MAP01 (S35, S41); ST16/SFX13 (S36); PH22 (S02, S38); PH15 (S45); SFX07 (S13). MG01/MG02 are in most Assets lines but only some visual tracks name them. Pipeline should key off the Assets line, not the narrative text.
- Segment_Index.csv writes "FT05 (permission/terms)" (S13), "FT04 (permission/terms)" (S21), "PH15 (permission/terms)" (S24, S45) while the script's Assets lines give bare IDs — cosmetic, but a strict ID parser will fail on the CSV.
- Numbering gaps in the asset list (not necessarily errors, but confirm nothing was deleted by mistake): AI06, AI08; FT03; MAP09; MUS03, MUS05, MUS08; PH01, PH08, PH11, PH12, PH14, PH23, PH25, PH28; SFX01, SFX12; ST08, ST10, ST11, ST14, ST18.
- The script says ID counts: Summary tab ranges (A2:A7 etc.) match row counts (Real Footage 6, Photos 21, Free Stock 16, AI B-roll 10, Quote Cards 12, Evidence 21, Maps 12, Music 9, SFX 22, Voiceover 46 rows + header ✔).

## 5. Timing (segment slots from "Starts (approx)")
Method: narration at 150 wpm + the seconds of every BREATHE/HOLD/SILENCE/MONTAGE moment vs the gap to the next start time. Total narration ≈ 710 s of an ≈ 833 s film; real Grok takes at a "relaxed natural pace" will probably run slower than 150 wpm, so re-time from the final audio.
- Slots under the script's own 15–40 s guideline: S03 12 s, S05 13 s, S06 13 s, S17 14 s, S25 14 s, **S28 8 s**, S35 13 s, **S38 10 s**, S39 14 s.
- Segments whose narration + holds exceed the slot even before any text edits: **S38** (7.2 s speech + 2.0 s silent quote beat + 2.0 s hold ≈ 11.2 s in a 10 s slot), **S25** (13.2 + 2.0 hold = 15.2 s in 14 s), **S44** (12.8 + 5.0 holds ≈ 17.8 s in 17 s).
- Very tight (≤ 1 s spare): S01 (18.2/19), S10 (21/22 and the 0.35–0.5 s handover), S20 (23.5/24), S36, S37, S40, S42.
- Low speech density (long holds): S34 (≈ 81 wpm in slot — 8 s montage), S07, S45, S35, S38 — fine by design.
- Applying the edits in PUBLISH_CHECKS_SEGMENTS_AFFECTED.md adds overruns at S05, S23, S24, S30, S44 (see that file).

## 6. Wording / editorial risks (not factual errors)
- **Title/thumbnail**: "BEFORE BONDI" and "799 Days That Changed Australia"-style titles can read as "these 799 days led to the attack", which conflicts with Section 12 ("Never use the thumbnail or title to imply who or what caused the attack") and S07/S43's own disclaimers. Prefer a title that frames the *period* ("The Two Years Before Bondi") and avoid "changed Australia"/causal verbs.
- **S34/S35 sequence** (fires → jet parts → ambassador… → "All of it, in the two years before Bondi" → ceasefire → attack) is a causation-by-juxtaposition risk; S07 and S43 mitigate. Keep them untouched.
- **S43/S44 Iran attribution** lacks "according to ASIO"/"allegedly" in two lines (edits proposed).
- **S19** "Critics including aid groups" and the government-defence claim: see PUBLISH_CHECKS.
- Do not name or show either gunman anywhere (the Evidence/Quote registers and narration comply). The accused's name appears in the URL of the official court-updates page only.

## 7. Conflicts between `SCREEN_TAG_EDITS.md` (Abhishek's binding tag edits, 10 Oct 2026) and the fact-check
- **S04 "change the 800 KM counter to ≈800 KM"**: the figure is not supported (≈713 km straight line, ≈880 km by road). Recommend ≈700 KM (straight line) or ≈880 KM (road) — and the voice line likewise.
- **S13 source tag "UN General Assembly records" on "first country to vote yes"**: the UN record has not been located/confirmed for call order (see PUBLISH_CHECKS S13); a UN tag would imply it is verified. Either remove "first" from the voice (proposed) or keep the PM attribution (S20) and tag S13 as "per PM Albanese, 11 Aug 2025".
- **S30 "disputed by Israel · as of [date]"**: outdated — Israeli military officials reportedly accepted ~70,000 as broadly accurate (Jan 2026). Fill the as-of date: 30 Sep 2026, 74,032 (OCHA, MoH figures, not UN-verified). Famine card "IPC, Aug 2025" ✔ add "eased Dec 2025".
- **S26 2026 card "DFAT / PM statement, Aug 2026"**: I found the IDF decision and family reaction in ABC/Guardian (20 Aug 2026); the Foreign Minister's reaction is a ministerial statement. Confirm a DFAT/Wong URL exists before citing DFAT; otherwise cite ABC/Guardian.
- **S40 "source tag NSW Police / PM statement" for Ahmed's details**: neither source states his occupation; reports conflict (fruit shop vs tobacconist/convenience store). Drop the occupation (proposed) rather than tag it.
- **S41 ANALYSIS tag from "And some warn…"**: resolves the "some warn" attribution risk editorially; still better to name a source in the description.
- **S37 "The surviving accused has not been convicted"**: correct and needed — the accused remains before the courts (next listing reported 28 Oct 2026; confirm on publish day).
- **S19 "sources Greens / aid groups statements"**: the one sourced description is "human rights campaigners and the Greens" (Guardian 10 Aug 2025); name the specific aid-group statement or use "human rights groups".
- **S44 Ley card "keep its original source line, Hansard, 26 Aug 2025"** ✔ — add "then Opposition Leader".
