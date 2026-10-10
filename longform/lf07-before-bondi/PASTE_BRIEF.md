# lf07 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`
Episode folder: `longform/lf07-before-bondi/` (called EP below)
Branch: `scaffold/lf07-before-bondi` (**pull this branch only; do not merge, do not open a PR, do not @ anyone, do not upload to YouTube**)
Film: **BEFORE BONDI — 799 days · 14,000 kilometres**. 46 segments (S01–S46): cold open, Chapters 1–6, closing. Atlas reads odd segments, Ara even; the final voice runs **651.6 s (10:51.6)**.

This is a long-form **DOCUMENTARY**, 16:9, 1920×1080, 30 fps, not a Short or a map film: maps are small built graphics among real photos and footage, evidence and quote cards, document zooms and a few AI shots. Abhishek expects it **next level**. Australian English in every label, caption and card.

## Read first, in this order

1. `EP/script/PRODUCTION_SCRIPT.txt` (and `.pdf`). **Section 7 is the shot-by-shot source of truth.** Follow it segment by segment: each segment's "Visual track", "Image moves", "Animation cues" (a cue starts on the first word of its trigger) and "Motif / Assets" lines. Sections 1, 4, 5 and 6 hold the rules, voices, tokens and motifs. Where this brief differs from the script, this brief wins.
2. `script/SCREEN_TAG_EDITS.md` (binding), `script/VOICE_EDITS_APPLIED.md` (old → new spoken text), `script/PUBLISH_CHECKS.md`, `script/SCRIPT_CONSISTENCY.md`, `script/SEGMENTS.json`.
3. `docs/QUOTES/QUOTES_VERIFIED.md` (exact wording, speaker, role, date, source for QT01–QT12), `docs/MANIFEST.md` and `docs/DOC*.txt` (card wording).
4. `audio/vo/PACE_REPORT.md`, `audio/vo/SEGMENT_DURATIONS.json`, `audio/MIX_MAP.md`, `audio/MUSIC_CREDITS.md`.
5. `MANIFEST.md`, `CREDITS.md`, `SKIPPED.md` in `images/`, `footage/`, `docs/` (and `broll/MANIFEST.md`), `assets-list/ASSET_STATUS.md`, `data/MAP_NOTES.md`, `data/CREDITS.md`, `fonts/`.

`MIX_MAP.md` predates the voice (it says `audio/vo/` is empty) and its times are paper times: move every cue onto the real voice files.

## Editorial stance and neutrality (locked, every frame)

Non-partisan. The film does not take a side in the Israeli–Palestinian conflict. Its question is how the conflict has affected Australia and Australians. When one community's experience or position appears, the other's appears at the **same size, for the same time, in the same design, with the same music level**, joined by the amber Seam (M3). Contested facts are attributed on screen. **No national flag colours as design colours** (do not grade the Opera House shot blue and white). Flags appear only where they are inside a real photograph. 

Equal-treatment moments: S15, S16 (both beats and number rolls), S19, S21, S22, S25 (three identical quote cards), S27, S32, S33, S40, S44, S45. Put a measured balance table for them in `final/BUILD_NOTES.md`: duration, size, move speed, label frame, music level (no ride), SFX gain.

## Section 4 rules (apply to every frame)

**Legal and accuracy**
- Every factual claim shows its source and date as it is spoken.
- "Allegedly" and "according to ASIO" stay attached to the Iran attribution (S05, S09, S10; S43 and S44 now say "ASIO says").
- No causal claim about Bondi. S07 and S41 say so; never imply the Middle East conflict, recognition, protests or any group caused the attack.
- **Bondi: never name or show either gunman.** The surviving accused is before the courts: say only what police have stated. No attack footage, CCTV, scene-adjacent images or police tape at the scene. MAP10 shows one soft suburb marker only.
- Quotes are short, exact, never edited. Every quote card shows speaker, role, date and source on the card itself, in one identical design (navy, off-white Source Serif 4, speaker in Inter, source in small caps, 3 px amber left rule).
- "Summary of public positions" labels every paraphrased case-for / case-against card. Analysis is labelled ANALYSIS. Casualty figures are always attributed with an as-of date.
- No ParlView, news-network, AAP, Getty or UN footage; no news-site screenshots.

**People and respect**
- No AI-generated, drawn, animated or altered likeness of any real person. Real people appear only in real photos. Animated people are faceless figure icons. No icons, drawings or AI images of religious symbols, religious dress, flags or party logos.
- No graphic content: aftermath, memorials, maps and documents only.
- **Zomi Frankcom: NO photo anywhere, ever** (no PH15; do not use PH15b/PH15c as her image). Abhishek's decision (11 Oct 2026): a designed name card in the film's style (Source Serif 4 name, Inter role line taken from the voice, amber rule, slow motion) over a memorial shot (`ST13` candles or `ST13b` flowers). **Ahmed al Ahmed gets the same card style** (no photo exists; never AI). The cast board (MG02: Albanese, Netanyahu, Ley, Frankcom, Ahmed) uses identical name chips, no photos.
- Quiet moments (S01, S15, S24, S36, S37, S45; S38–S41 near-quiet): slow, minimal motion, no stamps, shakes or comic effects, no ticks.
- **"Dramatised reconstruction"** corner label (bottom-left, added in the edit, never baked into files) on every AI shot, whenever it appears: AI01, AI02, AI03, AI05, AI10, AI11, AI12. Other labels: "Recreation" on rebuilt items (QT08 post, S32 names list).

**Budget:** $0. Use only assets already seated in EP: download nothing, generate no AI video and no likeness of any real person.

## The voice files are FINAL (hard rules)

- `EP/audio/vo/S01.mp3`–`S46.mp3` are the **gentle final set**: raw Grok takes, every internal pause untouched, edges trimmed to 0.12 s, only 17 takes given a pitch-held tempo nudge (all within ±5% of the voice median pace except S03, which needed ×1.195 on its Bondi-hint take; listen to it) (S02, S03, S05, S06, S08, S10, S13, S17, S20, S21, S23, S24, S26, S33, S34, S43, S46), linear gain only to **−20 LUFS** per file (not −14; a transparent limiter touches a few stray peaks). **Do not speed, stretch, pitch-shift, EQ, denoise, de-ess, loudnorm or overwrite them. Only place them.** Leave `audio/vo-raw/` alone. Never rewrite spoken words or add what the voice does not support. Delivery tags (`[pause]`, `<soft>`, `<slow>`) are never on screen.
- Each file has exactly 0.12 s of lead and trail silence. Build the Atlas ↔ Ara handover from those edges (add 0.11–0.26 s) so the audible gap is **0.35–0.5 s**.
- The mix raises the voice bus to about −14 LUFS (the mix's gain, not the file's); music about 20 dB under it (ducking under speech), SFX about 12 dB under.
- **Timing comes from the real files, not the script's start times.** Real voice total: **651.58 s** (`SEGMENT_DURATIONS.json`). Get word times per file with whisper (below) and judge sync by whisper alignment only; do not re-edit audio. Build a timeline from real durations plus every scripted hold. The real runtime is expected at about **12:30–13:30**: report the real length, do not pad, never slow the voice. Slot overruns (voice + holds + 0.5 s handover vs the script slot): **S10 +0.2, S11 +0.4, S21 +1.7, S25 +2.5, S27 +0.8, S33 +0.9, S44 +1.5 s.** Never cut voice: let the picture hold or the next slot absorb the overrun, then re-time every later cue.
- **Bondi pronunciation** (`audio/vo/BONDI_CHECK.md`): spoken "dye" (/aɪ/) in S03, S04, S07, S10, S12, S17, S34, S36, S44; still "dee" in **S01, S41, S43**. Do not touch the audio or pitch: report S01, S41 and S43 under caveats in BUILD_NOTES.
- Two total silences, music and all SFX out, digital zero: **1.0 s before S10's first word** and **2.0 s after S35's "it wasn't"** (MUS09 cut with an 80 ms fade). Do not shorten them.
- `PACE_REPORT.md` flags S11 ("word errors 0→2"): listen in the sync step and report in BUILD_NOTES; do not replace audio.

## Design

Tokens: Navy `#0E1A2B` (backgrounds, cards) · Paper `#F2EEE6` (evidence and quote cards) · Amber `#E8A33D` (Thread, Seam, highlights, pins) · Grey `#8A8A8A` (secondary labels, disputed tags) · Map land `#22324A` · Map sea `#0A1422`. Fonts (in `fonts/`): Source Serif 4 for chapter, quote, evidence and name cards; Inter for labels and numbers; IBM Plex Mono for the split-flap ticker. Archival grade: warm sepia, light grain, soft vignette; modern: slightly desaturated, cool. Entrances ease-out 200–350 ms; map lines draw over 1.5–2 s.

**Golden rule:** something on screen reacts to the voice every 1–2 seconds, except in quiet moments and BREATHE holds, where stillness is the point.

Motifs M1–M9 (script Section 6; each looks identical every time it returns): **M1** the Thread globe (MAP01; nodes THE FIRE, TWO MEMORIES, CANBERRA, LIVES, BONDI); **M1b** the evidence board; **M2** flame → candle (S36) → two candles (S40, S44) → dawn sunlight (S45, ST17); **M3** the Seam (cracks S23, widens S28, rejoins between two candles S40); **M4** the 1947 roll-call circle around "Australia", returning in S20 and S34 as the **identical frame**; **M5** doors (closing S11, opening S27); **M6** suitcases (S16, S27, S45); **M7** three pinned questions top-right (HOW DID THIS HAPPEN HERE? / WHO PAID FOR THE FIRE? / WHO RAN TOWARD THE GUNFIRE?), answered S10, S40, S41/S43; **M8** Ley's quote planted S11, paid off S44; **M9** the Bondi Countdown.

**M9 ticker** (MG01, split-flap, lower-left, IBM Plex Mono). Values (recomputed, correct): S01 `14 DEC 2025 · BONDI` (**S01 decision:** ONE soft SFX24 tick only as the ticker first appears; the quiet moment has nothing else) · S02 on "October twenty twenty-three" rolls back to `OCT 2023 · BONDI −799 DAYS` · S03 `−78 YEARS` flash · S04 `OCT 2024 · −420 DAYS`, then `DEC 2024 · −373 DAYS` on "Seven weeks later"; the MAP11 counter runs 0 → **≈700 KM** · S08 card `−420` · S10 `AUG 2025 · −110` (after the silence) · S12 pulses `−110` · S13 `29 NOV 1947 · −78 YEARS` · S14 `−108 YEARS` · S17 rolls forward to `−799` on "Canberra" · S20 `−125` · S22 `−117` · S24 `−622` (no tick) · S28 rolls back to `−799` on "in two" · S29 shows `−799` (no tick) · S31 `9 OCT 2023 · −797` · S33 `−133` · S34 races down from −799: −420 "fires", "jet parts" a value you choose between −420 and −110, −110 "ambassador", −84 "recognition", "court cases" and "visas" values you choose between −84 and −65, strictly in order, listed in BUILD_NOTES · S35 `OCT 2025 · −65` then a race to 0 with accelerating SFX24 · S36 `14 DEC 2025 · BONDI` (no tick) · S42 counts **up**: `JAN 2026 · +25 DAYS` (one soft SFX24, the only tick after the attack), `FEB 2026` (month only), `APR 2026 · +137 DAYS` (SFX19 soft, no tick), and the final value **`+369 DAYS · 18 DEC 2026`** pulsing amber on "eighteenth of December" (SFX21, no tick). Never show +365 or 14 Dec 2026 as the end value.

**Breathe and silence list** (do not trim): S01 3.0 s before the first word (ST02 + SFX13 waves, no music) and 2.0 after · S07 title slam on "follow the money", 3.0 hold on the title, then the 4 s disclaimer card, no VO · S10 silence 1.0 · S13 1.5 · S14 1.5 · S15 2.0 (TWO MEMORIES pins) · S20 1.5 · S22 1.0 · S24 3.0 · S25 family card 2.0 after · S29 1.0 · S30 1.5 + 1.5 · S32 1.0 · S34 **8.0 s montage, no VO** · S35 silence 2.0 · S36 2.0 on the candle (MUS10 begins) · S37 3.0 music only · S38 QT10 silent 2.0 first, 2.0 after · S40 3.0 (MUS10 swells) · S44 1.0 map, 2.0 Ley card, 2.0 candles · S45 **5.0 s montage, no VO**, then 2.0 hold · S46 15 s end screen.

**Disclaimer card (S07, 4 s, navy, Source Serif 4 28 pt, `#F2EEE6`):** "An independent, non-partisan documentary. We don't take sides. Facts are sourced on screen; each side's view is attributed and given equal weight. Some scenes and the narration voices are AI-generated."

## Chapter holds, mid-rolls and Abhishek's hold rule

Before **every** chapter (Ch1 S08, Ch2 S13, Ch3 S18, Ch4 S24, Ch5 S29, Ch6 S36, Closing S43) build a deliberate **music-and-visual hold of about 3–5 s, no voice**. It is never an empty or black frame. Design each from real clips, photos and cards plus the script's chapter card (`CHAPTER 1 — THE FIRE · BONDI −420 DAYS` and so on). Ideas: Ch2 PH26 sepia with SFX07 flicker; Ch3 ST07 and FT01 with SFX10 rising; Ch4 slow ST13 candles, quiet; Ch5 faint PH18 / MAP07 under the card, MUS09 only; Ch6 the 2.0 s silence, then ST01 dusk with waves; Closing ST02 as in S01. MUS12 sits on the title and on chapter cards **except Ch5 and Ch6**; MIX_MAP omits it at Ch4 (quiet moment), so judge by ear and default to none there.

**Mid-roll ad breaks after S12 and S28 only**: a clean 0.5 s beat after the last word (never on a word), then the next chapter hold. Mark both in `final/CHAPTERS.txt` as `#` lines (`# MID-ROLL AD BREAK after S12 at m:ss`) so the chapter block stays clean.

## On-screen tag and source checklist (Abhishek, binding; wording exact)

Tick each item in `final/SYNC_REPORT.md` with the frame it appears on.
- S03 "Some go back seventy-eight years…": corner tag ANALYSIS for the length of the line.
- S04 on the counter: ≈700 KM (see fact-check changes). On "Seven weeks later": source tag NSW Police / Victoria Police, Oct–Dec 2024.
- S07: corner tag ANALYSIS for the whole segment.
- S13 on "first country to vote yes": source tag UN General Assembly records, 29 Nov 1947.
- S16 on "largest communities of Holocaust survivors": source tag Jewish Holocaust Centre, Melbourne. On the population numbers: ABS Census 2021.
- S17: corner tag ANALYSIS for the whole segment.
- S18 on "Dozens of Australian companies": source tag Department of Defence, F-35 program.
- S19 on both cards: label Summary of public positions; sources Greens / aid groups statements (left) and DFAT / Hansard (right).
- S21 on the scale cards: label Summary of public positions. On QT07: APAN, 11 Aug 2025.
- S22 on QT08: label Recreation of public post · X, 19 Aug 2025.
- S26 on the Binskin card: Binskin report, DFAT, Aug 2024. On the 2026 card: DFAT / PM statement, Aug 2026.
- S27 on "thousands of visitor visas": Department of Home Affairs. On the three positions: label Summary of public positions.
- S30 casualty card bottom line: Gaza Health Ministry (Hamas-run), via UN OCHA · not independently verified by the UN · as of 30 Sep 2026; figure 74,032 (OCHA snapshot, 30 Sep 2026). Famine card: IPC, Aug 2025.
- S31 on the police review card: NSW Police statement, Feb 2024.
- S33 on the two charts: ECAJ report (left) and Islamophobia Register (right), each with its year and period.
- S36 on "around a thousand people": small tag "as reported".
- S37 lower third for the whole segment: Source: NSW Police, plus the line "The surviving accused has not been convicted" (the case was still before the courts on 10 Oct 2026; recheck on publish day).
- S40 on Ahmed's details: source tag NSW Police / PM statement, Dec 2025.
- S41: keep corner tag ANALYSIS from "And some warn…" to the end. On "inspired by Islamic State": NSW Police.
- S42 on the dates: Royal Commission (asc.royalcommission.gov.au).
- S43 "It didn't pull the trigger. But for two years, it pulled at the country…": corner tag ANALYSIS for the whole segment.
- S44 on Ley's QT02 returning: keep its original source line, Hansard, 26 Aug 2025 (and "then Opposition Leader").
- S45 "Maybe the real question…": corner tag ANALYSIS for the whole segment.
- S46 end card: "Full sources and corrections: see description." plus "Support: Lifeline 13 11 14 (lifeline.org.au)".
- Every quote card: speaker, role, date, source on the card. Every AI shot: Dramatised reconstruction.

**Fact-check differences (10–11 Oct 2026), also binding**
- S04 counter **≈700 KM, not ≈800 KM** (713 km straight line; the voice says "about seven hundred kilometres south-west").
- S13 tag stays; DOC02 keeps "(first)": Australia was the first member called that voted yes (Afghanistan No, Argentina Abstain, Australia Yes); the scroll must show that order. In S20 the counter rolls 1947 → 2025 as **78 YEARS** (matches S03 and the ticker).
- S30: the grey tag reads "not independently verified by the UN" (not "disputed by Israel").
- S40: **no occupation on screen**, so no fruit-shop visual or caption; do not use ST19. The voice says only "A father of two."
- QT05 uses the WCK wording "compassion, bravery, and love" (with the comma). QT07 is attributed to APAN (APAN statement, 11 Aug 2025); name Nasser Mashni only via The Guardian report of the same day, and show APAN's fuller words so its position is not narrowed. QT03 footer 2 Apr 2024. QT11 date 16 Dec 2025 (PM doorstop, Sydney). QT01 and QT02 match their sources exactly (no stray commas). QT12 and S08 use "a layer cake of cut-outs" (Mike Burgess, ASIO Director-General, 26 Aug 2025); "middlemen" is the film's own graphic label, never inside his quote marks. QT02 reads "then Opposition Leader" with source Hansard, 26 Aug 2025 (S11 and S44; re-check on aph.gov.au is a publish-day item).

## Where reality differs from the script (decided; do not revisit)

- **Voice text was edited in 19 segments** (VOICE_EDITS_APPLIED.md). Follow the audio; cues change accordingly: S05 stamp reads ALLEGEDLY PAID; S09 layer 3 reads PEOPLE IN AUSTRALIA · ALLEGEDLY PAID and the kinetic words are DENIABLE · HARD TO DETECT only (no CHEAP); S11 DOC19 reads "Government: first expulsion of an ambassador since WWII"; S19 voice says "human rights groups and the Greens" and the DOC13 card matches the voice; S24 "grew up in Sydney" and "clearly marked" appears only as what the charity called the convoy; S26 "decided not to press criminal charges" / "insult to her memory"; S27 "An Australian grandmother"; S35 trigger is "Sixty-five days after the ceasefire"; S42 "former High Court judge", "visited Australia", "eighteenth of December… Four days after the anniversary" (the old "one year to the day" cue is gone); S43 "Fires, ASIO says, directed from abroad".
- **ParlView (FT06/FT07) is skipped**: its terms (CC BY-NC-ND, no digital manipulation, written Parliament confirmation never obtained; quoted in footage/SKIPPED.md) do not fit. Stand-ins `FT06b` (S42) and `FT07b` (S11): PEO chamber wide shots, c. 2017, 854×480 upscaled, **not the sitting**. Dim them, keep them under cards, mute, caption "House of Representatives, Canberra (file footage)".
- **UN footage (FT04, FT05) is skipped** (not free). FT04 → MAP08 + DOC09. FT05 → PH26 with SFX07 flicker + DOC01 zoom + MAP03; `FT05b` only as a cutaway under 3 s captioned "United Nations, Lake Success, New York, 1946".
- **No free image exists** for PH15, PH16, PH17, PH20, PH21, PH27. S02 wall: ST04 for PH16, ST22 for PH17. S04: ST03 → AI01 (labelled) → text card "Bondi, Oct 2024", then MAP11 and a text card "Melbourne, Dec 2024" (ST20 is the Great Synagogue, Sydney: never use it as the Melbourne synagogue). S10 pins are text cards. S31: ST04 or ST04b captioned "Sydney Opera House (file footage)". S33: ST22 and ST15b captioned "Sydney Harbour (file footage)" plus the route line; no crowd shown.
- **FREE SWAPS**: AI04 → ST07 CNC with the MADE IN AUSTRALIA stamp (S18, S34); AI07 → kinetic text plus SFX22 plus a flat door graphic (S11, M5); AI09 → a built phone-notification graphic with blurred names list (S32). The broll manifest's `ST11` does not exist.
- **AI clips**: 720p, scaled with grain, scored 6–7/10, calm 5–6 s windows. AI02 is an envelope with no hands. AI10 and AI11 are distant silhouettes. If a glitch shows, drop the shot (AI10 → ST13, AI11 → ST17) and say so in BUILD_NOTES. The S27 match-cut is AI05 suitcases → ST09 (a landing window view, no embrace).
- **Stand-ins that are not what the script names** (caption honestly): ST01 is Sydney Harbour at dusk, **not Bondi**, so the S06 "Campbell Parade" beat and the parked-car outline are dropped unless they read naturally; ST02 is Clovelly/Coogee in daytime, **not Bondi, not dawn**, so a "Bondi Beach" lower third is a kinetic title only and the clip is captioned "Sydney's eastern beaches"; S43 has no memorial or family to show over ST02; ST03 is a harbour night view, not a street; ST04 is Vivid 2016, not Oct 2023; ST07 has no sparks; ST12/ST20/ST21 are animated stills; ST15b has no crowd.
- **PH10 Netanyahu** has a thin unreadable sliver of flag at the left edge (a tighter crop cuts into the face). Hide it with framing, mask or the SPLIT panel's edge without cutting the face; if it still shows, use a NETANYAHU name card in the same style and say so in BUILD_NOTES. Never use the `_orig_with_flag` files.
- **PH13 Virginia Bell** is 178×241 px: name card plus DOC04; photo only as a small inset.
- **PH06**: the seated "1970s" photo is Lakemba 2007. Use PH06c ("Migrants arrive in Sydney, 1948", public domain) or PH06 captioned "Haldon Street, Lakemba, Sydney, 2007"; never caption either as Lebanese or 1970s. PH05 caption "British migrants aboard the Georgic, 1949" (no port claimed). Give the S16 Melbourne and Sydney beats equal size and time. PH06b only beside an equal-weight image.
- **Partial documents**: DOC06 (Binskin PDF never read), DOC13 (from an SBS/AAP report of Marles, 10 Aug 2025; Hansard unconfirmed), DOC16 (act title only), DOC21 (ABC and The Guardian), DOC14 (record is 2,062 for Oct 2023–Sep 2024; latest year 1,654, so never label 2025 "record"). Show tags exactly as ordered above, and list each of these, plus two tag-versus-voice tensions (S19 tag "aid groups" vs voice "human rights groups"; S30 "not independently verified by the UN" vs voice "U.N. agencies broadly treat those figures as reliable"), under "Source-tag caveats" in BUILD_NOTES for Abhishek.
- **Evatt**: PH01 / PH01b only with honest captions ("H.V. Evatt, Australia, 1940"; "Evatt at a press conference, Australia, 3 May 1945"); never imply he sat in the 1947 hall.
- **Sound stand-ins** (nobody has listened to any seated file): SFX24 (heartbeat tick; listen first), MUS07 (has drums), MUS10 (cello with piano), SFX08, SFX11, SFX17, SFX20, SFX21, SFX23; SFX19 is a low-quality preview. **No sirens**: SFX03 is not seated, so the S04 tape slide gets a low SFX05. Judge by ear and say what you would swap.
- **Music**: MUS09 is quiet to file 1:31 then steps +10 dB. Loop it inside file 0:25–1:30 (3 s equal-power crossfades, 15–25 s per pass) so the step lands exactly on the S34 montage start; if the voice runs long, loop again, never move the step. MUS06 is about 9 dB and MUS04 about 7 dB quieter than the other beds (raise their faders). MUS01 steps up at file 1:13: stop before it. MUS12 is 10.5 s against a 15 s end screen: fill the gap with MUS11's natural ending.

## Audio

Cues, files, levels and fader offsets: `audio/MIX_MAP.md`. Music ducks 8–10 dB under speech (150 ms attack, 600 ms release) and lifts about +6 dB in holds; the S34 and S45 montages peak near −16 LUFS. Crossfade 2–4 s on emotion changes, never on cuts. SFX24: one soft tick per ticker change, except quiet moments, S29, S36 and the S42 steps after the first; S34 and S35 accelerate like a heartbeat (MIX_MAP section 5). Hits land on the picture, never on a word. Mute every clip.

## Mandatory sync verification (write `render/sync_check.py` and `final/SYNC_REPORT.md`)

Build your own timeline file (every VO start, cue frame, tag and source line with start and end) and prove it:
1. Every voice file starts at its planned time, no two voices overlap, and each audible handover gap is 0.35–0.5 s (longer only where a hold is scripted).
2. Run `faster-whisper` (small.en; see lf03's `render/whisper_vo.py`) with word timestamps and the segment text as the prompt, as a forced-alignment pass, on the **final mix** (window per segment) and on the VO stem for cross-check. Each cue must land on the first word of its trigger within about three frames. List planned vs measured times and any miss.
3. Every tag, source line, corner tag and label in the checklists above appears at the right time. Pull a frame at each (OCR it if tesseract exists, else view it) and record pass or fail.
4. Fix every miss before the next chapter; put the final numbers in BUILD_NOTES.

## Build order and commits

Order: cold open S01–S07 → Ch1 S08–S12 (+ mid-roll) → Ch2 S13–S17 → Ch3 S18–S23 → Ch4 S24–S28 (+ mid-roll) → Ch5 S29–S35 → Ch6 S36–S42 → Closing S43–S46. For each: its hold, cards, maps, edit, mix, then the sync check for that range, then `git commit` ("lf07: <part> built and sync-checked") and `git push origin scaffold/lf07-before-bondi`. Then assemble the full cut and do a **final review pass**: watch it through; contact sheets; every checklist item; neutrality tables; nothing still over 2 s outside quiet moments; no gunman, no Zomi photo, no flag colours, every AI label present; full-film sync; loudness.

## Deliverables (in `EP/final/`)

- `lf07-before-bondi-1x.mp4`: the review cut at 1×, 1920×1080, 30 fps, AAC 48 kHz, **−14 LUFS integrated, true peak ≤ −1.5 dBTP**. Target about 14–16 min including holds. The voice is only 10:51, so expect about 12:30–13:30 with all scripted and chapter holds; **do not pad with filler**, make the designed holds generous, and report the real length.
- `lf07-before-bondi.mp4`: the house **1.28×, pitch-held** master (whole film through rubberband, then two-pass loudnorm on that master only: about −14 LUFS, TP ≤ −1.5 dBTP). The silences shrink at 1.28× (1.0 s → 0.78 s, 2.0 s → 1.56 s): confirm they still read. Keep each mp4 under 95 MB (no Git LFS); if that costs visible quality, say so and leave it uncommitted.
- `loudnorm-report.md` (both files), `contact-sheet.jpg` (a frame per second of the 1× cut), `contact-sheet-shots.jpg` (key shots per chapter), `SYNC_REPORT.md`.
- `CHAPTERS.txt`: YouTube chapter timestamps **from the real render** (master times; 1× times beside them in BUILD_NOTES): the script's eight names from `0:00 COLD OPEN: How Did This Happen Here?` to `CLOSING` (each at its chapter hold), with the `#` mid-roll lines.
- `CREDITS_USED.md`: only assets actually used, author and licence link for every CC BY / CC BY-SA item, the DVIDS non-endorsement line (FT01), © OpenStreetMap contributors (MAP10), Natural Earth, OFL fonts, ABS, AWM, GPO, music and SFX credit lines (copy from MUSIC_CREDITS.md), the AI-reconstruction note, and the licence flags (Mixkit, CC BY, CC0, Pixabay, AWM, ABS do not name monetised YouTube; Mixkit music may draw Content ID claims). Keep the placeholder `[your email]`.
- `BUILD_NOTES.md`: measured numbers (length, loudness, true peak, handover gaps, sync results, neutrality tables, ticker values you chose), overrun handling, source-tag caveats, replaced or dropped shots, S11 listen result, what to check by ear, and **honest caveats**. Publish-day items left for a human: accused's court status (CDPP court-updates page), Royal Commission date (update S42 and the closing if published after 18 Dec 2026), Gaza as-of date and ceasefire status, QT02 on aph.gov.au, the YouTube "altered or synthetic content" box.

**Do not merge, open a PR, @ anyone or upload anywhere.**

## Role split

You do the design, cards, maps, timeline, edit, mix and masters. The production manager recorded and evened the voice, seated the media, music and effects, and generated the AI shots. Place them; do not replace them.
