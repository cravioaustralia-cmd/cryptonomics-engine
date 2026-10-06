# lf05 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `longform/lf05-albanese-hanson/`  
Branch: `scaffold/lf05-albanese-hanson` (**pull this branch only; do not merge, do not open a PR, do not @ anyone, do not upload to YouTube**)  
Film: **94 Seats vs 30%: Can Albanese Stop Pauline Hanson?**

This is a long-form **DOCUMENTARY**, 16:9. It is not a vertical Short. It is **not a map film**. Do **not** build an animated parchment map, Gallipoli-style kinetic map, or continuous terrain flyover as the body of the picture. A map or place graphic appears only if a narration line is specifically about a place, and even then only as a simple place card using a photo already in `images/` or a short evidence card. Prefer real free video, Ken Burns free photos, evidence cards, timeline/data graphics, and AI B-roll only where no free clip fits.

Australian English in every label, caption, chapter, and on-screen card. Series colours: gold thread = Albanese (**#D4A017**), orange-red thread = Hanson (**#E8552A**).

## Read this before you touch a frame

Narration source of truth (even Atlas VO — **do not re-time or rewrite**):

`longform/lf05-albanese-hanson/audio/vo/` (S01.mp3–S41.mp3)

Matching text:

`longform/lf05-albanese-hanson/audio/vo-text/` (S01.txt–S41.txt)

Pace table: `audio/vo/PACE_REPORT.md` (even durations are the cut lengths; do not retime the VO files themselves).

Also read, in order:

1. `script/SCRIPT_NOTE.md`
2. `script/PUBLISH_CHECKS.md`
3. `footage/CREDITS.md` + `footage/SKIPPED.md`
4. `images/CREDITS.md` (26 seated photos)
5. `broll/MANIFEST.md` + `broll/PROMPTS.md`
6. `audio/MUSIC_CREDITS.md`
7. `LOG.md`

Rules that never move:

- Do **not** rewrite spoken words. Do not add facts, places, numbers, shots, or beats the voice files do not support.
- `[pause]`, `[long-pause]`, `<slow>`, and `<soft>` were delivery tags. Never put them on screen. Never bleep them. They are not in the audio.
- If a card would say something the voice does not say, change the card to match the voice.
- **Cards and timeline numbers must match spoken words only.** See key figures table below and `script/PUBLISH_CHECKS.md`.
- Do **not** speed, pitch-shift, loudnorm, or overwrite the files in `audio/vo/`. Raw backups live in `audio/vo-raw/`; leave both alone.
- Media budget is **$0**. Free licences only. Credit author + source in the YouTube description from the CREDITS files.
- Claude must use **only assets already seated** in this episode folder. Do not download new media. Do not generate new AI video. Do not invent clips.

## Role split

You do the design, the cards, the timeline, the edit, and the mix. The production manager already recorded the voice, evened pace, seated free stock, and generated the AI B-roll. You only place those files. Do **not** generate new AI video. Do **not** generate a likeness of any real person. Do **not** download ParlView, news-network, AAP, Getty, or agency video.

## Picture

Master: **1920×1080, 30 fps**.

Five layers, in the order the narration needs them. **Not a map.**

1. **Real free video** — `footage/F01.mp4`–`F46.mp4`. Mute every clip. Prefer these over photos and AI.
2. **Ken Burns free photos** — any `images/IMG-*.jpg` / `.png` that exists when you cut. All 26 listed in `images/CREDITS.md` are seated.
3. **Evidence cards** — short, sourced, same wording as the voice. Every card carries a **FACT / CLAIM / ANALYSIS / SPECULATION** label as the script requires (see below). If a source and the voice disagree, follow the voice file.
4. **Timeline / data** — poll Polaroids, seat counters, rate staircase, thread graphics. Digits on screen must match the spoken numbers.
5. **AI B-roll** — only `broll/B01.mp4`–`B09.mp4`, and only on the beats mapped below. Scale 1280×720 → 1920×1080. Mute. People-free pack (VideoReview PASSED).

**Picture priority:** real footage → free photo Ken Burns → evidence card / timeline → AI B-roll. Never the reverse when a better layer exists.

First time an AI clip appears in the edit, put a small on-screen label: **Dramatised reconstruction**. Do not bake that label into the mp4 file.

### ParlView / chamber / QT / Senate — FREE SWAP (locked)

There is **no** ParlView chamber video in this repo. Do **not** download any. Do **not** pretend a clip is seated. Do **not** tell anyone to use ParlView.

Until Abhishek gives **written** confirmation to use ParlView:

| Script beat | Seg | FREE SWAP |
| --- | --- | --- |
| House / Albanese QT 2025 | S01 | `IMG-albanese-dfat.jpg` Ken Burns over `IMG-house-of-reps-chamber.jpg` + chamber/seat card |
| House maiden speech 1996-09-10 | S14 | Hansard text card (10 Sep 1996, FACT) over `IMG-house-of-reps-chamber.jpg`; Hanson 2006/2007 Polaroids |
| Farley first speech / Farrer | S16 | Albury/Murray photos + F04–F06 Albury timelapses + Farrer/ABC evidence card (no Farley portrait — family/news skipped) |
| Joyce House (optional) | S16 | `IMG-joyce-official.jpg` card flies blue → orange bench |
| Albanese QT One Nation | S27 | Quote card + chamber photo (`IMG-house-of-reps-chamber.jpg`) |
| Senate burqa protest 2025-11-24 | S28 | `IMG-senate-chamber.jpg` **plain**, date lower-third “Senate, 24 November 2025”, plus plain text FACT card. No animation over it; no religious-dress imagery or icons |
| Senate censure vote 2026-03 | S28 | FACT card “Hanson censured… Coalition votes against” (36–17) over `IMG-senate-chamber.jpg` |

### Named people — free photos only, never AI faces

| Person | File | Notes |
| --- | --- | --- |
| Anthony Albanese | `IMG-albanese-dfat.jpg` | Official DFAT/AUSPIC portrait CC BY 4.0 |
| Pauline Hanson | `IMG-hanson-2016.jpg` (primary); `IMG-hanson-2006.jpg`, `IMG-hanson-2007-book-launch.jpg` | Free Commons; thumbnail / wilderness Polaroids |
| Jim Chalmers | `IMG-chalmers-official.png` | Official Treasury portrait CC BY 4.0 (lower res — framed inset) |
| Barnaby Joyce | `IMG-joyce-official.jpg` | CC BY 3.0 AU |
| Angus Taylor | `IMG-taylor-official.jpg` | CC BY 4.0 |
| Sussan Ley | `IMG-ley-official.jpg` | CC BY 3.0 AU |
| Tony Abbott | `IMG-abbott-official.jpg` | CC BY 3.0 AU |
| Mehreen Faruqi | `IMG-faruqi-official.jpg` | CC BY-SA 2.5 AU |

**Skipped (use name/evidence cards only — never invent a face):**

- **John Howard** — licence unclear. S06 SPLIT = text card “2004 → 2025” + Albanese portrait only.
- **David Farley** — family in frame / news material. Use Albury photos + Farrer evidence card.
- **Gina Rinehart** — no free portrait seated; name card only on the plane beat (S27).

### Photos inventory (26 seated)

Full table: `images/CREDITS.md`. Quick beat map:

| File | Use on |
| --- | --- |
| IMG-albanese-dfat | S01, S06, S37 column, thumb |
| IMG-hanson-2016 | S01 slide-in, S37 column, thumb |
| IMG-hanson-2006 / 2007 | S14 wilderness Polaroids |
| IMG-house-of-reps-chamber | ParlView FREE SWAP S01, S14, S27 |
| IMG-senate-chamber | ParlView FREE SWAP S28; S36 |
| IMG-parliament-house-canberra / exterior-day | S05 disclaimer, holds |
| IMG-joyce-official | S16 |
| IMG-ley-official / IMG-taylor-official | S16, S22 SPLIT |
| IMG-abbott-official | S32 |
| IMG-faruqi-official | S33 |
| IMG-chalmers-official | S09 |
| IMG-treasury-canberra | S09 budget |
| IMG-new-housing-estate-wa / house-construction-qld | S09 housing |
| IMG-suburb-sale-signs-wa | S24 cost-of-living WALL |
| IMG-albury-nsw / murray-river-albury | S16, S18 Farrer |
| IMG-adelaide-skyline | S16, S21 SA |
| IMG-ipswich | S20 Queensland |
| IMG-qeii-courts-brisbane / law-courts-sydney | S33 court |
| IMG-melbourne-box-hill-aerial | S40 Melbourne |
| IMG-sydney-skyline | S20–S21, holds |

### Footage inventory (F01–F46)

Full credits: `footage/CREDITS.md`. Mute all. Theme coverage:

| Range | Theme | Key segs |
| --- | --- | --- |
| F01 | Parliament House timelapse | S01, S05, H1, H5 |
| F02–F03 | Brisbane | S20–S21 |
| F04–F06 | Albury timelapses | S16, S18 Farrer |
| F07–F08 | Press / newspaper | S31–S32 media |
| F09–F10 | Ballot into box | S25, S34–S36 |
| F11 | Court gavel stock (face cropped) | S33 |
| F12–F13 | City street / night aerial | S20–S24 |
| F14–F16 | Phone / papers | S26, S30–S31 |
| F17–F20 | Canberra sunset / lake / park | holds, S41 |
| F21–F25 | Suburbs / Sydney apartments (F21 vertical — crop/letterbox) | S21, S24 |
| F26–F27 | Construction / new house | S09 |
| F28–F29 | Sydney / Brisbane aerial | S20–S21 |
| F30 | Melbourne Airport (distant) | S31 migration |
| F31 | Coins abstract (euros — keep abstract) | S30 money |
| F32 | Perth / WA | S20–S21 |
| F33–F34 | Melbourne / Australia montage | S40, holds |
| F35 | Light plane | S27 |
| F36 | Supermarket trolleys | S24 |
| F37 | Piggy bank / savings | S26 super |
| F38–F39 | Melbourne tram / aerial | S40 |
| F40, F45 | Sydney Harbour / CBD | S20–S21 |
| F41 | Sydney landing | S31 |
| F42–F43 | Screens / TV static | S31–S32 |
| F44 | AUD $50 notes | S30, S37 |
| F46 | Brisbane bridge/river | S20 |

**Footage gaps (do not invent):** ParlView, burqa protest video, AU petrol board video, “for lease” video, Howard/Farley/Rinehart portraits — use FREE SWAP / photos / AI B04–B06 / cards. See `footage/SKIPPED.md`.

### Where the AI clips go

| ID | Beat | Picture |
| --- | --- | --- |
| B01 | S25, S34–S35 | ballot into box — **first AI appearance → Dramatised reconstruction** |
| B02 | S36 | empty Senate benches |
| B03 | S30–S31 | phone on table, screen blurred |
| B04 | S10, S24 | petrol board night (digits unreadable) |
| B05 | S24 | bills + calculator still life |
| B06 | S24 | empty shopfront, blank sign |
| B07 | S26 | manila folder + glasses |
| B08 | S34–S35 | empty vote-count hall |
| B09 | S31 | CRT TV grey static (“Please Explain” texture; title card in edit) |

If any B-roll somehow shows a person face, flag, party logo, or readable text in your QC, do not use that clip — cut to a photo or card instead. Current pack passed VideoReview; keep all nine.

### AI rules (hard)

- No gore. No rising-sun flag. No identifiable real people in AI clips. No party logos. No ethnic or religious icons. No readable text.
- No new AI video beyond seated B01–B09.
- No AI / drawn / animated likeness of any real person. Animation people (if any) are faceless icons only.

### Legal / respect (non-negotiable)

- **Hanson’s 2003 conviction is ALWAYS paired with “overturned on appeal”** — on any card, lower-third, stamp (GUILTY → QUASHED shatter), and never show “jailed”/“GUILTY” alone, even for one frame. VO already pairs them (S14).
- Faruqi quote: on-screen text with the expletive bleeped if shown; VO says “go back to Pakistan” only.
- Evidence cards are recreated in our design, never screenshots of news pages.
- Not election material; no paid promotion near an election without advice.

## Evidence labels (every card / key line)

| Label | Colour | Meaning | Where |
| --- | --- | --- | --- |
| **FACT** | white | verified events, official results, records | majority of evidence beats |
| **CLAIM** | orange outline | what a person/party says | One Nation “Fire the Liar” figures, Albanese plane quote, government stated focus, S31 migration policy, S37 “raised millions” tile |
| **ANALYSIS** | blue #3A7BD5 | attributed interpretation by named analyst/outlet | ABC “fastest polling surge”; ABC on Labor’s ad strategy; ABC on broken promise feeding distrust; ABC on immigration message |
| **SPECULATION** | grey, dashed | what could happen | **ending only** — S39 UNKNOWN column, S40 Victorian test node |

Per-segment map (from script): S01/S06/S07 FACT · S02/S11/S12/S17/S20/S21/S23 FACT (poll cards) · S09 FACT (reported) · S10 FACT · S14/S15/S16/S18 FACT · S19 FACT + CLAIM + ANALYSIS (three stamps) · S22 FACT · S24 FACT + ANALYSIS · S26 ANALYSIS / FACT · S27 FACT (reported) + CLAIM (quote) · S28 FACT + CLAIM · S29 ANALYSIS + CLAIM · S30 CLAIM · S31 CLAIM / FACT · S32 FACT (reported) · S33 FACT (+ FACT card: special leave lodged 21 Aug 2026, undecided) · S34–S36 FACT · S37 tile “One Nation says raised millions” = CLAIM · S39 FACT + SPECULATION · S40 FACT (quote) + SPECULATION (Vic node).

Every poll Polaroid: pollster, fieldwork dates, sample size where known, and “One poll is a snapshot, not a verdict.” No winner declared; S33 “MOTIVE?” → “interpretation, not fact”.

## Key spoken numbers (cards must match exactly)

| Spoken | Card / timeline |
| --- | --- |
| ninety-four seats | 94 (Labor House) |
| seventy-seven seats (2022) | 77 |
| one hundred and fifty seats | 150 |
| seventy-five per cent caucus rule | 75% |
| four point six per cent cash rate | 4.60% (highest since 2011; four rises in 2026) |
| Newspoll ON thirty / Labor twenty-seven / Coalition ~nineteen | 30 / 27 / 19 |
| Albanese net approval minus twenty-seven | −27 |
| Hanson disapproval fifty-one per cent | 51% |
| Newspoll n=1,244 (Sep) | 1,244 |
| DemosAU Labor twenty-eight / ON twenty-six | 28 / 26 |
| Roy Morgan 2PP fifty-four to forty-six | 54–46 (as spoken; optional newer 53.5–46.5 **not** applied) |
| Roy Morgan ON twenty-five point five | 25.5% |
| Two House seats; four senators | 2 / 4 |
| Qld ON thirty-six / Labor twenty-five; NSW 31–30; Vic 29–25; Qld PPM 52–48 | match VO |
| Quarterly n=4,967 | 4,967 |
| Roy Morgan Qld 32.5; SA 18.5; SA n=228 | match VO |
| Labor + Coalition together forty-six per cent | 46% |
| ninety-five per cent of ON supporters “wrong direction” | 95% |
| twenty-seven dollars donation ask | $27 |
| plane ~two point one million dollars | ~$2.1m (CLAIM / reported) |
| “Fire the Liar” four million / sixty-five thousand donors / five days | $4m / 65,000 / 5 days — **CLAIM** (One Nation says) |
| net-negative migration three years → ceiling one hundred and thirty thousand | CLAIM card: “Net migration: net-negative 3 yrs → 130,000 ceiling” |
| seventy-six seats to form government | 76 |
| nineteen ninety-eight Qld ~23% / eleven of eighty-nine | 23% / 11 of 89 |
| Senate ~one-seventh / roughly fourteen per cent | ~14% |
| ON polling about twenty-five to thirty per cent | 25–30% range |
| Victorian election November twenty twenty-six | Nov 2026 |
| Albanese sixty-three; Hanson seventy-two | 63 / 72 |

Do **not** invent a third poll figure. Do not put Greens 13 (or any figure) on a card if the voice never says it.

## Chapter holds (CRITICAL — Abhishek locked rule)

Before each new chapter, Part, or major topic change: leave a **deliberate music-and-visuals hold with NO voiceover**. Music rises under the hold. Picture keeps moving — these are **not** empty black or static colour holds.

A hold is a proper documentary beat built from seated assets only: cut real free clips, Ken Burns photos, evidence cards, thread stings, and/or AI B-roll already in the pack. Then resume narration.

**Mid-rolls are separate from holds.** Mid-rolls stay after **S13, S25, S33** only. A chapter hold is not an ad break.

### Exact hold points

| # | Hold before | After | Mood / picture suggestion | Music bed |
| --- | --- | --- | --- | --- |
| H0 | Open titles (before S01 VO) | — | Series sting + title card + Parliament / dual portraits | `series_sting.flac` then tense bed in |
| H1 | **PART ONE · HOW STRONG IS ANTHONY ALBANESE?** | after S05, before S06 | gold thread + Parliament F01 / Albanese portrait + chapter card | investigative |
| H2 | **PART TWO · THE RISE OF PAULINE HANSON** | after S13 (+ mid-roll), before S14 | orange-red thread + Hanson 2016 + chapter card | surge / momentum |
| H3 | **PART THREE · WHAT HAS ACTUALLY CHANGED?** | after S19, before S20 | both threads + state heat-map cold-open / Ipswich / cities | investigative |
| H4 | topic: the Coalition (short) | after S21, before S22 | Ley→Taylor SPLIT prep / whip off orange | investigative |
| H5 | **PART FOUR · ALBANESE'S MOVES** | after S25 (+ mid-roll), before S26 | gold thread + papers F16 / B07 + chapter card | investigative or tense low (“chess”) |
| H6 | **PART FIVE · HANSON'S MOVES** | after S29, before S30 | orange-red + phone B03 / money F44 + chapter card | same low “chess” bed |
| H7 | **POLLS, SEATS AND GOVERNMENT** | after S33 (+ mid-roll), before S34 | ballot F09/B01 + chapter card | investigative very low (no pluck bed in pack) |
| H8 | **THE BIG COMPARISON** | after S36, before S37 | parallel POWER / PRESSURE columns cold-open | investigative |
| H9 | **ENDING · CAN ALBANESE STOP PAULINE HANSON?** | after S38, before S39 | both threads → 2028 node; Canberra dusk F17–F20 | sombre piano |

Hold length: long enough to feel intentional (roughly 1.5–4 s at 1×), picture always changing, music rising, **zero VO**. Do not rewrite VO text to create holds — edit/pacing only. Also honour script edit gaps after WEIGHT lines (S03 title, S08, S13, S19, S25, S29, S33, S38 — music-only breaths).

## Mid-rolls

Insert mid-roll ad breaks **only** after:

1. **S13** (end of Part One bridge)
2. **S25** (end of Part Three / “what hasn’t changed”)
3. **S33** (end of Part Five / High Court beat)

Do not put a mid-roll on a spoken word. Picture can hold on a card or muted clip. No invented ad reads or host spiel. Chapter titles that follow open *after* the break.

## On-screen chapter labels

| Label | Segments / holds |
| --- | --- |
| PART ONE · HOW STRONG IS ANTHONY ALBANESE? | H1 / S06–S13 |
| PART TWO · THE RISE OF PAULINE HANSON | H2 / S14–S19 |
| PART THREE · WHAT HAS ACTUALLY CHANGED? | H3 / S20–S25 |
| PART FOUR · ALBANESE'S MOVES | H5 / S26–S29 |
| PART FIVE · HANSON'S MOVES | H6 / S30–S33 |
| POLLS, SEATS AND GOVERNMENT | H7 / S34–S36 |
| THE BIG COMPARISON | H8 / S37–S38 |
| **ANALYSIS** | S19 three-stamp beat; S24; S26 ABC strategy; S29 |
| **SPECULATION** / UNKNOWN | S39 unknown column; S40 Vic node |
| Disclaimer | S05 — card holds ~8 s (script) |

Match VO wording on cards (Australian spelling). Threads: gold = Albanese, orange-red = Hanson.

## Suggested picture placement by block

Concrete, not generic — override only when a better seated file fits the same spoken beat.

### Open + question (H0, S01–S05)

- S01: F01 Parliament + Albanese DFAT + Hanson 2016 slide-in; seat card **94** / One Nation **none**
- S02: Newspoll Polaroid **30 / 27** (FACT)
- S03–S04: title hold + five-things board
- S05: disclaimer card over Parliament still/F01 (~8 s)

### Part One — Albanese strength (H1, S06–S13) → mid-roll

- S06–S07: seat ladder **77 → 94**; Keating milestone; **75%** lock card (Claude-rebuild GFX_75_lock / GFX_PM_ladder — no Howard face)
- S08: WEIGHT breath — power ≠ popularity
- S09: Chalmers + Treasury + housing stills; broken-promise FACT (reported)
- S10: rate staircase **4.60%**; B04 petrol board
- S11–S12: approval dial **−27**; poll Polaroids; DemosAU / Roy Morgan cards; “snapshot not a verdict”
- S13: WEIGHT → mid-roll 1

### Part Two — Hanson’s rise (H2, S14–S19)

- S14: wilderness Polaroids; **GUILTY → QUASHED** stamp (never GUILTY alone); 1996–2016 timeline
- S16: Joyce portrait; Albury F04–F06; Farrer card (no Farley face); Newspoll first-place **30%**
- S17–S18: poll disagreement Polaroids; **2 House / 4 senators**
- S19: three stamps FACT + CLAIM + ANALYSIS (ABC fastest surge)

### Part Three — what changed (H3–H4, S20–S25) → mid-roll

- S20–S21: state heat map / Qld Ipswich / SA Adelaide; sample-size caution card
- S22: Ley → Taylor SPLIT; Coalition collapse cards
- S23: combined primary **46%**
- S24: F36 trolleys, B04–B06, suburb footage; immigration ANALYSIS
- S25: **94 seats** / 2028 / “polls don’t elect anyone” + B01 ballot → mid-roll 2

### Part Four — Albanese’s moves (H5, S26–S29)

- S26: B07 / F16 paperwork; Labor ad-strategy ANALYSIS cards; $27 ask
- S27: F35 light plane + Rinehart **name card** (no face); Albanese quote CLAIM
- S28: Senate FREE SWAP (plain chamber + date LT); censure FACT
- S29: ANALYSIS board — budget distrust / counter-campaign

### Part Five — Hanson’s moves (H6, S30–S33) → mid-roll

- S30: “Fire the Liar” CLAIM cards ($4m / 65k / 5 days); F44 / F31 money; B03 phone
- S31: migration CLAIM card (net-negative 3 yrs → 130k); B09 CRT + “Please Explain” title; F30/F41 airport/landing; F42–F43 screens
- S32: Taylor / Abbott portraits; preference / censure votes FACT
- S33: Faruqi portrait + courts IMG + F11; special leave FACT “lodged 21 Aug 2026 — not yet decided”; MOTIVE? = interpretation not fact → mid-roll 3

### Polls / seats / Senate (H7, S34–S36)

- S34–S35: ballot mechanics F09–F10 / B01 / B08; 76-to-govern; 1998 Qld vs federal contrast
- S36: B02 empty Senate; ~14% quota card; preference fork

### Big comparison + ending (H8–H9, S37–S41)

- S37: dual POWER / PRESSURE columns (gold vs orange-red); no winner
- S38: WEIGHT — power vs pressure
- S39: FACT established vs SPECULATION unknown columns
- S40: Melbourne F22/F33/F38/F39 + Vic Nov 2026 SPECULATION node; ages 63 / 72; Hanson quote
- S41: three questions CTA; sources-in-description; subscribe end card; Canberra dusk F17–F20

### Claude-rebuild graphics (no Albanese-film REUSE found)

Build fresh in-house (use `render/gfx.py` helpers if useful): GFX_75_lock, GFX_PM_ladder, GFX_rate_staircase, GFX_approval_dial, dual-thread POWER/PRESSURE board, GUILTY→QUASHED stamp, poll Polaroids, state heat map. Numbers = spoken words only.

## Audio

Same pack and discipline as lf03/lf04 — with the **lf04 music lesson locked in**.

- While the voice is talking, music is a **quiet bed**. The voice is always clearer.
- **Music under VO must sit about 85% quieter than in holds** (lf04 lesson: roughly **~27.5 dB below** the steady hold level). Holds and pauses stay at the louder steady bed. Do not let the bed compete with words.
- In pauses and **chapter holds**, bring the bed **up**. Not full.
- Change the bed with the scene (see `audio/MUSIC_CREDITS.md` lf05 bed map):
  - **Tense** `audio/music/tense-vertigo-597.mp3` — open, jail/court sting, risk
  - **Investigative** `audio/music/investigative-feedback-dreams-588.mp3` — Parts One / Three / Comparison / default evidence
  - **Surge** `audio/music/poll-surge-dreaming-big-31.mp3` — Part Two rise / momentum (keep under VO)
  - **Sombre piano** `audio/music/sombre-piano-classical-7-714.mp3` — ending H9 / S39–S41
  - No dedicated “chess” or “pluck” bed in pack — use investigative/tense **very low** for H5–H7
- **Mute every** footage and B-roll clip. No original speech from anywhere. No news audio. No sirens.
- Hits land on the **picture**, never on a spoken word. SFX in `audio/sfx/`: shutter (poll Polaroids), typewriter, whoosh (thread zip), coin (fundraising counters), door, bell, paper tear, gavel (S33 sparingly), `series_sting.flac` on open. No stamp/propeller/TV-click in pack — skip or synthesise; do not rip.
- Open with `audio/sfx/series_sting.flac`.
- Do **not** speed or loudnorm the voice files themselves.
- Build the cut at **1×** first. The file you deliver is the **whole film at 1.28× with the pitch held**, then **two-pass loudnorm** on that master only. Target about **−14 LUFS**. True peak at or under **−1.5 dBTP**.
- Write `final/loudnorm-report.md` with the measured integrated loudness and true peak (and note the music under-VO dip ≈85% quieter / ~27.5 dB vs holds).

## Delivery

On branch `scaffold/lf05-albanese-hanson`, not merged:

- `final/lf05-albanese-hanson.mp4` — the **1.28× pitch-held**, loudnormed master
- A **contact sheet** (same convention as lf03/lf04)
- A **chapter list** with times on the master (1.28× timecodes; keep 1× beside them if you write a cue sheet)
- `final/loudnorm-report.md`

Do **not** upload to YouTube. Do **not** open a pull request. Do **not** @ anyone. Do **not** merge to `main`.

Credits for the description already live in `images/CREDITS.md`, `footage/CREDITS.md`, and `audio/MUSIC_CREDITS.md`. Do not drop a credit because a thumbnail crop was used. Only list media that make the final cut.

## Hard “do not” checklist

- No Gallipoli-style / parchment kinetic map film
- No ParlView / chamber video download; FREE SWAP to photos + cards
- No news-network / AAP / Getty footage or photos
- No AI faces of real people; no new AI beyond B01–B09
- No gore, rising-sun, party logos, religious/ethnic icons in AI
- No retiming / loudnorm of `audio/vo/*.mp3`
- No mid-rolls except after S13, S25, S33
- No empty black chapter holds — real visuals + music rise, no VO
- No inventing numbers; cards match spoken words only
- No GUILTY / jailed card without “overturned on appeal” / QUASHED
- No music competing with VO — bed ~85% quieter under VO than in holds
- No merge, no PR, no @, no YouTube upload
- Use only seated assets; credits files already written — place, don’t re-download
