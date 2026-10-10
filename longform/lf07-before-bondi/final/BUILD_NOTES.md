# BEFORE BONDI — build notes

Long-form documentary, 46 segments (Atlas odd, Ara even), 1920×1080, 30 fps, Australian English. Built in code from the seated assets only: no downloads, no AI video generated, no likeness of any real person drawn or altered. Budget spent: $0.

## Measured numbers

| | 1× (`lf07-before-bondi-1x.mp4`) | 1.28× master (`lf07-before-bondi.mp4`) |
|---|---|---|
| Length | 12:45.73 | 9:58.23 |
| Integrated loudness | −14.1 LUFS | −14.2 LUFS |
| True peak | −2.0 dBTP | −2.0 dBTP |
| Loudness range | 5.5 LU | 4.3 LU |
| File size | 89.1 MB | 88.9 MB |
| Video bitrate | 790 kbps | 1051 kbps |

Full chain and silence measurements: `loudnorm-report.md`.

| Check (final picture + final mix) | Result |
|---|---|
| Voice files placed at planned time, no overlaps | 46/46 |
| Cues within 3 frames of their trigger word (whisper on the mix) | 368/369; the miss is S01 "Bondi Beach", which passes 5/5 on the recheck with the same 1 s lead-in the other segments get |
| Tags, labels, source lines, corner tags, AI labels by OCR | 94/95; the S20 caption was checked by eye and is legible |
| Plain handovers, audible gap at −50 dBFS | about 0.43 s each; S41→S42 is 0.395 s |
| S10 silence, digital zero | 1.09 s (1×), 0.83 s (1.28×) |
| S35 silence, digital zero | 1.94 s (1×), 1.50 s (1.28×); planned 2.0 s from the end of "wasn't", the file's own 0.09 s decay tail is not trimmed |

Full detail: `SYNC_REPORT.md`.

## Chapters (master and 1× times)

| Chapter | 1.28× master | 1× cut |
|---|---|---|
| COLD OPEN: How Did This Happen Here? | 0:00 | 0:00 |
| CHAPTER 1: The Fire | 1:12 | 1:32.12 |
| Mid-roll ad break after S12 | 2:15 | 2:52.76 |
| CHAPTER 2: Two Memories | 2:15 | 2:52.76 |
| CHAPTER 3: Canberra's Choices | 3:21 | 4:16.94 |
| CHAPTER 4: Australian Lives | 4:43 | 6:02.04 |
| Mid-roll ad break after S28 | 5:46 | 7:23.32 |
| CHAPTER 5: A Country Under Strain | 5:46 | 7:23.32 |
| CHAPTER 6: Bondi | 7:30 | 9:35.90 |
| CLOSING | 8:54 | 11:23.91 |

Each mid-roll sits on the chapter card, after a 0.5 s beat past the last word of S12 and S28. `CHAPTERS.txt` carries the master times with `#` lines for the mid-rolls.

## Neutrality and balance

Every two-sided moment gets the same size, move, label treatment and music level, and both sides appear together for the same time. Measured from the event registry and the mix stems (`render/balance.py`):

| Moment | Side A | A on screen (s) | Side B | B on screen (s) | Size | Move | Label frame | Music A (dBFS RMS) | Music B (dBFS RMS) | SFX |
|---|---|---|---|---|---|---|---|---|---|---|
| S15 1948 memories | PH03 Independence | 20.82 | PH04 Nakba | 20.82 | 958x1080 each | same push 1.04→1.12 | same label chip | -31.8 | -31.8 | none (quiet) |
| S15 labels | 1948 — INDEPENDENCE | 18.1 | 1948 — THE NAKBA | 18.1 | same chip | fade 0.6 s, together | same | -31.6 | -31.6 | none |
| S16 migrant beats | PH05 Melbourne | 9.66 | PH06c Sydney | 9.66 | 958x1080 each | same push | same city chip | -30.1 | -30.1 | SFX05 −5 dB each flow line |
| S16 number rolls | 99,956 Jewish Australians | 6.68 | 813,392 Muslim Australians | 6.68 | same type size | same 1.1 s roll | same | -33.1 | -33.1 | 8 × SFX06 −6 dB each |
| S19 two cases | Critics' case | 14.02 | Government's case | 14.02 | 760x600 each | same 0.32 s entrance | Summary of public positions | -32.1 | -32.1 | SFX18 +2 dB each |
| S21 scale cards | Coalition / Israel's govt / Jewish groups | 14.35 | APAN | 14.35 | 760x560 each | same 0.45 s drop | Summary of public positions | -31.4 | -31.4 | SFX21 −2 dB each |
| S22 portraits | PH10 Netanyahu | 14.44 | PH07 Albanese | 14.44 | 958x1080 each | same | caption | -27.8 | -27.8 | SPLIT whoosh |
| S22 quote cards | QT08 | 12.1 | QT09 | 12.1 | 840 wide, equal height | same | QT08 labelled recreation | -27.9 | -27.9 | SFX17 on QT08 only (the post) |
| S25 quote cards | QT03 Albanese | 16.15 | QT04 Netanyahu | 16.15 | 570 wide, equal height | same 0.32 s entrance | same card | -33.6 | -33.6 | none |
| S25 quote cards | QT05 Frankcom family | 16.15 | (third card, same) | 16.15 | 570 wide, equal height | same | same card | -33.6 | -33.6 | none |
| S27 loss on both sides | PH18 (Israel) | 7.78 | PH19 (Gaza) | 7.78 | 958x1080 each | same push | caption | -35.3 | -35.3 | none |
| S32 two cases | Published names (recreation) | 3.31 | DOC07 judgment | 2.81 | 800 wide each | same | Recreation label | -30.1 | -29.5 | SFX05 on lock |
| S33 charts | ECAJ | 8.68 | Islamophobia Register | 8.68 | 800x760 each | same 1.2 s rise | source line each | -34.1 | -34.1 | SFX06 −1 dB each |
| S33 exteriors + envoys | ST20 + Segal card | 6.75 | ST21 + Malik card | 6.75 | 958x1080 each; 640x260 cards | same | same card | -37.4 | -37.4 | SFX18 once |
| S40 two candles | candle 1 | 8.8 | candle 2 | 8.8 | 958x1080 each | same flicker | - | -27.9 | -27.9 | none |
| S45 montage split | PH03 | 1.25 | PH04 | 1.25 | 958x1080 each | same | - | -18.6 | -18.6 | none |
| S45 name cards | Zomi Frankcom | 1.25 | Ahmed al Ahmed | 1.25 | same 58 px serif, same width | same write-on | same | -12.3 | -12.3 | none |
| S44 grieving on both sides | candle 1 | 4.21 | candle 2 | 4.21 | 958x1080 each | same | - | -25.6 | -25.6 | none |

Unequal by design, and why:
- **S22 SFX17** plays on QT08 only, because it is the sound of a posted message; QT09 is a spoken statement.
- **S32**: the published-names recreation is on screen 0.5 s longer than the DOC07 judgment because the voice line about the names comes first. They are not two sides of a debate.
- Equal-treatment edits made during the build: S15 labels appear together; S16 number frames show from "Today" with "—" until each roll; S19 both cards appear on "Critics" and each dims until its own words; S21 scale cards are visible from the start; S22 QT09's frame appears with QT08's; S25 all three cards appear at segment start; S33 both charts rise together with a "not directly comparable" note.

## Static-picture check

`render/static_check.py` flags stretches over 2 s where the mean frame difference at 192×108 is under 0.35 and fewer than one planned event per 2 s starts, outside quiet segments and scripted holds. It flags 42 stretches. The test is strict: a slow 3–4% card push, word-by-word lighting on a quote card, the ticker and the thread pulse all register below its threshold. The flagged stretches over 8 s were compared start frame against end frame, and all have a moving card push plus voice-synced word lighting or highlights:

| 1× time | Length | Segment | What moves |
|---|---|---|---|
| 1:52.1–2:02.2 | 10.0 s | S09 | layer-cake diagram builds tier by tier, then the CRIME AS A SERVICE words and the Sydney and Melbourne pins |
| 2:04.1–2:14.6 | 10.5 s | S10 | PM statement card push, voice-synced highlights |
| 4:40.4–4:48.6 | 8.3 s | S19 | both case cards, line-by-line dim/undim |
| 4:57.4–5:06.3 | 8.9 s | S20 | Choice 2 quote card, word-by-word reveal beside the portrait |
| 5:36.9–5:48.7 | 11.8 s | S22 | QT08 and QT09 word reveal |
| 6:41.3–6:50.2 | 8.9 s | S26 | Binskin card push, highlights |
| 7:52.1–8:03.3 | 11.2 s | S30 | casualty card, chips, push |
| 12:22.6–12:30.7 | 8.1 s | S46 | end card (scripted end hold) |

The S35 stretch at 9:33.6–9:35.9 is the scripted silence.

## Timeline (1× cut)

| Seg | Voice | Segment start | VO file start | VO length (s) | Holds after (s) | Audible gap to next (s) | Added silence (s) |
|---|---|---|---|---|---|---|---|
| S01 | Atlas | 0:00.00 | 0:03.00 | 12.20 | 2.00 | 2.43 | 0.17 |
| S02 | Ara | 0:17.36 | 0:17.36 | 14.74 | 0.00 | 0.43 | 0.175 |
| S03 | Atlas | 0:32.28 | 0:32.28 | 7.57 | 0.00 | 0.43 | 0.18 |
| S04 | Ara | 0:40.03 | 0:40.03 | 15.62 | 0.00 | 0.43 | 0.165 |
| S05 | Atlas | 0:55.82 | 0:55.82 | 10.37 | 0.00 | 0.43 | 0.24 |
| S06 | Ara | 1:06.42 | 1:06.42 | 8.47 | 0.00 | 0.43 | 0.155 |
| S07 | Atlas | 1:15.06 | 1:15.06 | 9.88 | 7.00 | 10.93 | 0.19 |
| S08 | Ara | 1:32.12 | 1:35.62 | 12.02 | 0.00 | 0.43 | 0.17 |
| S09 | Atlas | 1:47.81 | 1:47.81 | 14.52 | 0.00 | 1.43 | 0.165 |
| S10 | Ara | 2:02.48 | 2:03.48 | 20.73 | 0.00 | 0.43 | 0.17 |
| S11 | Atlas | 2:24.38 | 2:24.38 | 17.86 | 0.00 | 0.43 | 0.16 |
| S12 | Ara | 2:42.41 | 2:42.41 | 10.23 | 0.12 | 4.89 | — |
| S13 | Atlas | 2:52.76 | 2:57.26 | 15.09 | 1.50 | 1.93 | 0.24 |
| S14 | Ara | 3:14.09 | 3:14.09 | 11.65 | 1.50 | 1.93 | 0.19 |
| S15 | Atlas | 3:27.44 | 3:27.44 | 18.57 | 2.00 | 2.395 | 0.26 |
| S16 | Ara | 3:48.26 | 3:48.26 | 18.73 | 0.00 | 0.43 | 0.17 |
| S17 | Atlas | 4:07.16 | 4:07.16 | 9.59 | 0.00 | 4.43 | 0.2 |
| S18 | Ara | 4:16.94 | 4:20.94 | 13.38 | 0.00 | 0.43 | 0.154 |
| S19 | Atlas | 4:34.47 | 4:34.47 | 13.96 | 0.00 | 0.43 | 0.2 |
| S20 | Ara | 4:48.63 | 4:48.63 | 19.20 | 1.50 | 1.93 | 0.17 |
| S21 | Atlas | 5:09.50 | 5:09.50 | 24.18 | 0.00 | 0.43 | 0.19 |
| S22 | Ara | 5:33.87 | 5:33.87 | 13.71 | 1.00 | 1.43 | 0.17 |
| S23 | Atlas | 5:48.74 | 5:48.74 | 13.12 | 0.00 | 4.93 | 0.175 |
| S24 | Ara | 6:02.04 | 6:06.54 | 14.96 | 3.00 | 3.43 | 0.175 |
| S25 | Atlas | 6:24.67 | 6:24.67 | 14.04 | 2.00 | 2.43 | 0.21 |
| S26 | Ara | 6:40.93 | 6:40.93 | 16.50 | 0.00 | 0.43 | 0.165 |
| S27 | Atlas | 6:57.58 | 6:57.58 | 19.30 | 0.00 | 0.43 | 0.185 |
| S28 | Ara | 7:17.06 | 7:17.06 | 6.01 | 0.25 | 5.01 | — |
| S29 | Atlas | 7:23.32 | 7:27.82 | 13.73 | 1.00 | 2.925 | 0.26 |
| S30 | Ara | 7:42.82 | 7:44.32 | 21.02 | 1.50 | 1.93 | 0.17 |
| S31 | Atlas | 8:07.01 | 8:07.01 | 16.64 | 0.00 | 0.43 | 0.21 |
| S32 | Ara | 8:23.87 | 8:23.87 | 20.20 | 1.00 | 1.43 | 0.165 |
| S33 | Atlas | 8:45.24 | 8:45.24 | 19.38 | 0.00 | 8.43 | 0.17 |
| S34 | Ara | 9:04.78 | 9:12.78 | 10.61 | 0.00 | 0.43 | 0.17 |
| S35 | Atlas | 9:23.56 | 9:23.56 | 10.46 | 1.88 | 5.61 | — |
| S36 | Ara | 9:35.90 | 9:39.40 | 10.07 | 2.00 | 2.43 | 0.155 |
| S37 | Atlas | 9:51.63 | 9:51.63 | 14.40 | 3.00 | 5.43 | 0.215 |
| S38 | Ara | 10:09.25 | 10:11.25 | 6.46 | 2.00 | 2.43 | 0.165 |
| S39 | Atlas | 10:19.87 | 10:19.87 | 9.14 | 0.00 | 0.43 | 0.255 |
| S40 | Ara | 10:29.27 | 10:29.27 | 10.96 | 3.00 | 3.43 | 0.17 |
| S41 | Atlas | 10:43.39 | 10:43.39 | 16.96 | 0.00 | 0.395 | 0.26 |
| S42 | Ara | 11:00.62 | 11:00.62 | 23.12 | 0.00 | 4.43 | 0.165 |
| S43 | Atlas | 11:23.91 | 11:27.91 | 15.26 | 0.00 | 1.43 | 0.235 |
| S44 | Ara | 11:43.40 | 11:44.40 | 13.01 | 2.00 | 7.43 | 0.165 |
| S45 | Atlas | 11:59.57 | 12:04.57 | 15.62 | 2.00 | 2.43 | 0.17 |
| S46 | Ara | 12:22.36 | 12:22.36 | 8.38 | 15.00 | — | — |

## How it was built

- **Pipeline.** Picture is drawn frame by frame with skia (`render/film.py`, scenes in `render/scenes/`), timed from the real voice files. One event registry (`render/lib/events.py`) feeds the picture, the mix (`render/mix.py`) and the sync check (`render/sync_check.py`), so every cue, sound, tag and ticker value is planned once.
- **Voice files are untouched.** All 46 files in `audio/vo/` are placed whole. The mix only applies linear gain (+6 dB voice bus) and a master limiter on the summed mix. No speed, stretch, pitch, EQ, denoise, de-ess or loudnorm was applied to any voice file, and no file was split or overwritten.
- **Handovers.** Each handover adds 0.11–0.26 s to the 0.12 s file edges, measured per pair so the audible gap (energy at −50 dBFS) is about 0.43 s. S41→S42 sits at 0.395 s because S41's tail is short; the 0.26 s ceiling was kept.
- **Runtime.** No padding. Every scripted hold, the two silences, both montages, seven chapter holds (3.5–4.5 s) and the 15 s end screen are included.

## Mid-segment holds

The script places a few holds inside a voice line (S30 after the first line, S44 map and Ley card). Files cannot be split, so the picture holds still through the natural pause, and the scripted seconds are added at the segment edge instead: S30 gets 1.5 s before and 1.5 s after; S44 gets 1.0 s of map before and 2.0 s on the candles after, and Ley's card stays on screen for about 5.6 s while it is read. S38's QT10 shows silent for 2.0 s first, as scripted.

## Overrun handling

The overruns listed in the brief (S10, S11, S21, S25, S27, S33, S44) are against the script's paper slots. The timeline is built from the real files, so nothing had to be cut: every later cue is re-timed from the real word times, and each segment simply takes the length its voice and holds need.

## Ticker values chosen

S34 races down on its words: −420 on "The fires", **−300 on "jet parts"** (chosen), −110 on "ambassador", −84 on "recognition", **−78 on "court cases"** and **−72 on "visas"** (chosen), strictly in order. During the 8 s montage before the first word the ticker stays at −799 and pulses with each of the six heartbeat ticks. S35 races −65 → −60 → −54 → −48 → −42 → −36 → −30 → −25 → −20 → −15 → −10 → −6 → −3 → 0 (14 ticks, last five intervals 0.14–0.09 s, each tick cut short), the zero landing 0.06 s before "it". After the attack: +25 (the only tick), FEB 2026 (month only, no tick), +137 (stamp, no tick), and the final **+369 DAYS · 18 DEC 2026** pulsing amber with SFX21.

## Shots replaced, dropped or changed

- **Colour fix in mastering.** The full-length picture intermediate was rendered with skia's BGRA pixels labelled as RGBA, which swaps red and blue. Both masters apply an exact channel swap (`colorchannelmixer`) so colours are correct; the encoder is fixed in `film.py` for any future render.
- AI04 → ST07 CNC with MADE IN AUSTRALIA stamp (captioned "file footage, not an F-35 part"). AI07 → flat door graphic plus kinetic text plus SFX22. AI09 → built phone-notification graphic with a blurred, recreated names list labelled "Recreation".
- FT07/FT06 (ParlView) → FT07b/FT06b chamber file footage, dimmed under cards, captioned "House of Representatives, Canberra (file footage)".
- FT04 → recognition map (Australia, Canada and the United Kingdom lit) plus DOC09. **The script said "four countries light"; only three are lit**, because the seated joint statement names only Canada and the United Kingdom alongside Australia. FT05 → PH26 with projector flicker, DOC01 zoom and MAP03. FT05b was not used.
- S04: ST03 → AI01 (labelled) → text card "Bondi, 20 Oct 2024" → MAP11 → torn text card "Melbourne, 6 Dec 2024". The script's police-tape slide became a "POLICE TREAT IT AS A LOCAL CRIME" band with a low SFX05 (no tape, no siren).
- S06: the Campbell Parade beat and parked-car outline were dropped; ST01 is Sydney Harbour, not Bondi, and is captioned so.
- S16: PH05 (Georgic, 1949) and PH06c (Sydney, 1948) in an equal split; MAP04 is a small schematic inset. PH06 and PH06b were not used.
- S36: the S03 flame dissolves into one cream candle from a held ST13 frame. The two candles (S40, S41, S44, S45) are two held ST13 frames with a gentle flicker, joined by the Seam, identical every time.
- S40: no occupation shown, no fruit-shop visual; ST19 not used.
- Zomi Frankcom and Ahmed al Ahmed appear only as identical designed name cards (Source Serif 4 name, Inter role line from the voice, amber rule, slow write-on), Zomi over ST13b flowers, Ahmed over ST13 candles. No photo of either.
- PH10 Netanyahu: framed with a 1.18 zoom inside the split panel so the flag sliver at the left edge is out of frame; Albanese gets the same zoom. No `_orig_with_flag` file used.
- PH13 Virginia Bell: small inset (134 × 180 px) on a name card beside DOC04 only.
- AI10 and AI11 showed no glitches in review, so neither was dropped. AI02 is an envelope with no hands.
- The DOC02 voting sheet is cropped to the typed table (Afghanistan No, Argentina Abstain, Australia Yes), with no autographs visible. This is the M4 frame in S13, S20 and S34, at identical framing (a 0.75 scale inside the S14 split panel).

## Source-tag caveats (for Abhishek)

- **DOC06 (Binskin):** the PDF was never read. The card wording comes from the search-index excerpt ("not knowingly or deliberately directed against the WCK") and the Foreign Minister's quotation of the report ("serious failures to follow IDF procedures, mistaken identification and errors in decision-making"). The source line says "as quoted by DFAT and the Foreign Minister".
- **DOC13 (F-35 position):** comes from an SBS/AAP report of Marles, 10 Aug 2025; Hansard is unconfirmed. The card follows the voice, and its tag reads "DFAT / Hansard" as ordered.
- **DOC16:** only the act title and commencement are confirmed. The card names the 2026 Act and the final-report date; the firearms act is not named.
- **DOC21:** rests on ABC and The Guardian reports (IDF statement, family statement); the tag reads "DFAT / PM statement, Aug 2026" as ordered.
- **DOC14:** 2,062 (Oct 2023–Sep 2024) is labelled RECORD. The latest year, 1,654, is not called a record.
- **Tension 1, S19:** the tag reads "Greens / aid groups statements", but the voice says "human rights groups and the Greens".
- **Tension 2, S30:** the grey tag reads "not independently verified by the UN", but the voice says "U.N. agencies broadly treat those figures as reliable". Both are shown as attributed chips on the card ("UN agencies broadly treat the figures as reliable" and "Israel long disputed them").
- **Tags added beyond the checklist, not backed by a seated document; please verify:** S15 "UN Conciliation Commission for Palestine estimate, 1951" (the 700,000 figure); S23 "Home Affairs Minister and Israeli Foreign Ministry statements, 18 Aug 2025" (visas cancelled on both sides); S29 "Israeli authorities, via UN OCHA" (about 1,200 killed, about 250 hostages); S30 "US Holocaust Memorial Museum statement, Oct 2023" (deadliest day). These are my attributions from general knowledge, not from files in `docs/`.
- S11 "first since the Second World War, the government said": the card reads "Government: first expulsion of an ambassador since WWII" as ordered. DOC19 records that the seated government statement does not contain the phrase; ABC reported it.
- S33: the Islamophobia Register chart is labelled "HIGHEST SINCE IT BEGAN" (in-person incidents), from the report's own wording. The two charts carry a note that they are not directly comparable.

## Voice caveats and the S11 listen result (from whisper; nobody has listened)

- **Bondi pronunciation:** S01, S41 and S43 still say "Bon-dee" (not "Bon-dye"). Audio untouched, as instructed.
- **S43:** whisper hears "ASIO" as "AYZO" (11:40.8 in the 1× cut). Listen: it may be a mispronunciation (the hint is AY-zee-oh).
- **S11 (PACE_REPORT "word errors 0→2"):** whisper transcribes every word of the final S11 file correctly (0 word differences) on the file, the voice stem and the final mix. It has low confidence on "Opposition" (0.13), "turn" (0.16) and "neighbour" (0.07); "turn" and "neighbour" are timed as starting together, which suggests "turn" is swallowed or very short. Listen to "quote, turn neighbour against neighbour" (S11, about 2:36.9 in the 1× cut).
- **S15:** whisper adds a phantom "Please." after the last word (0.02 confidence), almost certainly breath or room noise in the file's tail. Listen once.
- S03 (×1.195 tempo nudge on its Bondi-hint take) passed the production manager's artefact proxies; listen for phasiness on "fire in Bondi".

## What to check by ear (no file was auditioned)

1. **SFX24 heartbeat tick:** is it felt rather than heard as an effect? Above all in S01 (the one soft tick in a quiet moment) and in the S35 race.
2. **MUS09 loop:** the jump from file 1:25 back to 1:07 sits about 85 s into the bed (around 8:39.8 in the 1× cut). Listen for a bump. The +10 dB step lands on the S34 montage start (9:04.8).
3. **MUS10:** is it cello with piano, and is it too hopeful under S36–S42? MUS06 is the free swap.
4. **MUS07 (drums) under Canberra's Choices:** is it too much of a thriller bed under S19 and S21?
5. SFX08 crowd (S31) may carry a car horn or a shout. SFX11 (a drum hit, not a sub boom), SFX17 (not a phone sound), SFX20, SFX21 and SFX23 are stand-ins. SFX19 is a low-quality preview.
6. **Master limiter:** the voice files peak near −2 dBTP at −20 LUFS, so raising the voice bus to −14 LUFS needs up to about 6 dB of peak limiting on the loudest syllables. Listen for pumping on hard consonants.
7. **The two digital silences** (S10: 2:02.5–2:03.5; S35: 9:33.9–9:35.9 in the 1× cut) and how they read at 1.28× (about 0.8 s and 1.5 s).

## Honest caveats

- **This is the review cut.** It is a designed motion-graphics documentary built in code, not hand-keyed in an NLE. Every frame was generated by the pipeline and checked by contact sheets and stills, but not every second was watched in real time with sound.
- **The 95 MB cap forces about 0.85 Mbps (1×) and 1.1 Mbps (1.28×) for 1080p video.** Film grain was kept very light and changes every third frame to help the encoder. Expect some softening in grainy archival shots and fast flame footage.
- **Golden rule:** the static-picture check flags a handful of stretches over 2 s with few planned events outside quiet moments. They are mostly on long cards where the reaction is word-by-word lighting or a highlight sweep, which the pixel-difference test barely registers. See the static-picture table above.
- **The S04 "Bondi, Oct 2024" card and the S10 pins are text cards,** because no free photo of either attack site exists.
- **Captions on stand-in footage say "file footage"** or name the real place (Sydney Harbour, Sydney's eastern beaches, Vivid Sydney 2016). No stand-in is captioned as Bondi or as Oct 2023.

## Publish-day items left for a human

1. **Accused's court status:** check the CDPP court-updates page. S37's lower third reads "The surviving accused has not been convicted"; remove or change it if the status has changed.
2. **Royal Commission:** the final report is due 18 Dec 2026. If publishing after it lands, update S42, the ticker's +369 line and the closing.
3. **Gaza figures:** the as-of date (30 Sep 2026, 74,032) and the ceasefire status (S35 says "ceasefire agreed Oct 2025").
4. **QT02 on aph.gov.au:** re-check Ley's words and the "then Opposition Leader" label in a normal browser.
5. **YouTube "altered or synthetic content" box:** tick it (AI reconstructions and AI narration voices).
6. Also: the ECAJ and Islamophobia Register reports (check for newer releases); Lattouf appeal or penalty status; the DVIDS non-endorsement line and every CC BY / CC BY-SA attribution in the description (`final/CREDITS_USED.md`); the description's "[your email]".
