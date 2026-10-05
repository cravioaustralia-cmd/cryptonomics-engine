# lf04 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`  
Episode folder: `longform/lf04-housing/`  
Branch: `scaffold/lf04-housing` (**pull this branch only; do not merge, do not open a PR, do not @ anyone, do not upload to YouTube**)  
Film: **Who Killed the Aussie Dream? Five Suspects Behind Australia’s Housing Crisis**

This is a long-form **DOCUMENTARY**, 16:9. It is not a vertical Short. It is **not a map film**. Do **not** build an animated parchment map, Gallipoli-style kinetic map, or continuous terrain flyover as the body of the picture. A map or place graphic appears only if a narration line is specifically about a place, and even then only as a simple place card using a photo already in `images/` or a short evidence card. Prefer real free video, Ken Burns free photos, evidence cards, timeline/data graphics, and AI B-roll only where no free clip fits.

Australian English in every label, caption, chapter, and on-screen card.

## Read this before you touch a frame

Narration source of truth (even Atlas VO):

`longform/lf04-housing/audio/vo/` (S01.mp3–S40.mp3)

Matching text:

`longform/lf04-housing/audio/vo-text/` (S01.txt–S40.txt)

Pace table: `audio/VO_PACE.md` (even durations are the cut lengths; do not retime the VO files themselves).

Also read, in order:

1. `script/SCRIPT_NOTE.md`
2. `script/PUBLISH_CHECKS.md`
3. `footage/CREDITS.md` + `footage/SKIPPED.md`
4. `images/CREDITS.md` (inventory of IMG-01..25; some may still be PENDING)
5. `broll/MANIFEST.md` + `broll/PROMPTS.md`
6. `audio/MUSIC_CREDITS.md`
7. `LOG.md`

Rules that never move:

- Do **not** rewrite spoken words. Do not add facts, places, numbers, shots, or beats the voice files do not support.
- `[pause]`, `[long-pause]`, `<slow>`, and `<soft>` were delivery tags. Never put them on screen. Never bleep them. They are not in the audio.
- If a card would say something the voice does not say, change the card to match the voice.
- **Cards and timeline numbers must match spoken words only.** Including **S28: net overseas migration about 245,000 this financial year** (not 260,000). See `script/PUBLISH_CHECKS.md`.
- Do **not** speed, pitch-shift, loudnorm, or overwrite the files in `audio/vo/`. Raw backups live in `audio/vo-raw/`; leave both alone.
- Media budget is **$0**. Free licences only. Credit author + source in the YouTube description from the CREDITS files.

## Role split

You do the design, the cards, the timeline, the edit, and the mix. The production manager already recorded the voice, seated free stock, and generated the five AI B-roll clips. You only place those files. Do **not** generate new AI video. Do **not** generate a likeness of any real person. Do **not** download ParlView, news-network, AAP, Getty, or RBA conference video.

## Picture

Master: **1920×1080, 30 fps**.

Five layers, in the order the narration needs them. **Not a map.**

1. **Real free video** — `footage/F01.mp4`–`F35.mp4` (~581 MB). Mute every clip. Prefer these over photos and AI.
2. **Ken Burns free photos** — any `images/IMG-*.jpg` / `.png` that exists when you cut. Inventory and beats: `images/CREDITS.md`.
3. **Evidence cards** — short, sourced, same wording as the voice. If a source and the voice disagree, follow the voice file.
4. **Timeline / data** — RBA rate path, Housing Accord completions, NOM series, lock icons (Deposit / Loan / Home). Digits on screen must match the spoken numbers.
5. **AI B-roll** — only `broll/B01.mp4`–`B05.mp4`, and only on the beats mapped below. Scale 1280×720 → 1920×1080. Mute. Keep all five (VideoReview PASSED: no faces, no readable text/logos/flags).

**Picture priority:** real footage → free photo Ken Burns → evidence card / timeline → AI B-roll. Never the reverse when a better layer exists.

First time an AI clip appears in the edit, put a small on-screen label: **Dramatised reconstruction**. Do not bake that label into the mp4 file.

### ParlView / chamber / Budget / Senate — FREE SWAP (locked)

There is **no** ParlView chamber video in this repo. Do **not** download any. Do **not** pretend a clip is seated.

Until Abhishek gives **written** confirmation to use ParlView:

- Budget night / Treasurer announcement (S18): **IMG-04** (Chalmers) + evidence cards + `F23` Parliament House **exterior** only.
- Senate committee / tax bill / Greens support (S17–S18): **IMG-07** / **IMG-08** chamber stills when present, else name/evidence cards + `F23` exterior.
- Politics / election beats (S38): **IMG-06** / **IMG-08** when present, else cards + `F23`.
- Same rule for any RBA conference video: use **IMG-01** (Bullock), **IMG-02** / **IMG-03** (RBA building / lettering), cards — never conference video.

### Named people — free photos only, never AI faces

| Person | File | Notes |
| --- | --- | --- |
| Michele Bullock | IMG-01 | Official RBA portrait CC BY 4.0 |
| Jim Chalmers | IMG-04 | Official Treasury portrait CC BY 4.0 (lower res — framed inset, not full-bleed 4K) |
| Clare O’Neil | IMG-05 | When present; Commons CC BY-SA portrait crop |

If IMG-05 is still missing when you cut S34, use a **name card** (“Housing Minister Clare O’Neil”) — never invent a face. No photo and no AI face for any other named person.

### Photos inventory (IMG-01..25)

Full table lives in `images/CREDITS.md`. Status when this brief was written (5 Oct 2026 AEDT):

- **Seated / expected on disk soon:** IMG-01..04 already collected in staging; IMG-05..25 listed in CREDITS with Commons URLs and may still be landing under `images/`.
- **Claude’s rule:** use **any `IMG-*` that exists** when you cut. If a numbered still is missing, **fall back** to `footage/` clips and evidence cards for that beat. Do **not** wait, do **not** download agency photos, do **not** generate AI faces or substitute faces.

Quick beat map (prefer these when the file exists):

| ID | Use on |
| --- | --- |
| IMG-01 Bullock | S02, S08, S11, S39 |
| IMG-02 RBA building | S01, S08–S10, S13, S36, S39 |
| IMG-03 RBA lettering | S08, S09, S12 |
| IMG-04 Chalmers | S18 |
| IMG-05 O’Neil | S34 (or name card if missing) |
| IMG-06 Parliament exterior | S18, S30, S38 (sparingly; `F23` also covers) |
| IMG-07 Senate chamber | S17, S18 |
| IMG-08 House chamber | S18, S38 |
| IMG-09 Treasury building | S14, S16, S18 |
| IMG-10..15 estates / construction / cranes | S03, S06, S19, S21–S25, S29, S39 |
| IMG-16 sale signs street | S15, S17, S33 |
| IMG-17 terraces | S12, S24, S37 |
| IMG-18 apartments Waterloo | S05, S24, S28 |
| IMG-19 townhouses | S05, S24 |
| IMG-20 Box Hill aerial | S21, S24, S25, S27 |
| IMG-21 / IMG-22 bank exteriors | S01, S09, S32 (**photos only** — no free bank exterior video) |
| IMG-23 Queenslander | S03, S37 |
| IMG-24 Melrose Park redevelopment | S22, S24, S30 |
| IMG-25 Sydney skyline | S04, S35, S40 open/close |

### Footage gaps (do not invent clips)

From `footage/SKIPPED.md` — no free video seated for:

- RBA / bank exterior **video** → use IMG-02/03/21/22
- Rental “for lease” **video** → use IMG-16 sale-signs still + cards, or empty-interior / suburb clips
- ParlView / news-network → banned; FREE SWAP above

Theme coverage already in pack: suburbia F01–F07, F31–F33; apartments F08–F11, F17; construction F12–F17; cities F18–F22, F30, F35; money abstract F25; Parliament exterior F23; airport/migration F24; doors F26; empty interiors F10/F11/F29; rain/window F27/F28/F34.

Vertical clip note: **F01** is 2160×3840 — letterbox/crop carefully to 16:9; do not stretch.

### Where the AI clips go

| ID | Beat | Picture |
| --- | --- | --- |
| B01 | S03a | smartphone face-down + rain window |
| B02 | S03b | empty backyard clothesline at dusk |
| B03 | S15 | hand signing contract + house key (no face) |
| B04 | S24 | leafy single-storey suburban street move |
| B05 | S37 | suburban dusk, lights switching on |

If any B-roll somehow shows a person face, flag, party logo, or readable text in your QC, do not use that clip — cut to a photo or card instead. Current pack passed VideoReview; keep all five.

### Sam and the three locks

**Sam** is a **fictional example** (S05). Never treat Sam as a real person. Never generate a Sam face.

Three locks (S06): **Deposit / Loan / Home**. Keep a small recurring lock/icon treatment that lights or cracks as each suspect touches a lock. Same three words the voice uses — no extra jargon.

## Chapter holds (CRITICAL — Abhishek locked rule)

Before each new chapter, suspect, or major topic change: leave a **deliberate music-and-visuals hold with NO voiceover**. Music rises under the hold. Picture keeps moving — these are **not** empty black or static colour holds.

A hold is a proper documentary beat built from seated assets only: cut real free clips, Ken Burns photos, evidence cards, timeline stings, and/or AI B-roll already in the pack. Then resume narration.

**Mid-rolls are separate from holds.** Mid-rolls stay after **S13, S25, S34** only. A chapter hold is not an ad break.

### Exact hold points (segment boundaries)

| # | Hold before | After | Mood / picture suggestion | Music bed |
| --- | --- | --- | --- | --- |
| H0 | Open titles (before S01 VO) | — | Series sting + title card + Sydney/city skyline (`F18`/`F22`/`F35` or IMG-25) | `series_sting.flac` then tense bed in |
| H1 | **Suspect 1 — RBA / rates** | after S07, before S08 | RBA building still (IMG-02) + cash/coins (`F25`) + “SUSPECT 1” card | tense → investigative |
| H2 | **Suspect 2 — tax / investors** | after S13 (+ mid-roll), before S14 | Treasury / auction / sale-sign stills (IMG-09/16) + “SUSPECT 2” card | investigative |
| H3 | **Suspect 3 — supply** | after S20, before S21 | Cranes / new builds (`F12`–`F17` or IMG-10..15) + “SUSPECT 3” card | investigative, heavier |
| H4 | **ANALYSIS — zoning** | after S23, before S24 | Leafy street (`B04` or suburb aerials) + **ANALYSIS** label ready | sombre or investigative |
| H5 | **Suspect 4 — migration / demand** | after S25 (+ mid-roll), before S26 | Airport aerial `F24` + NOM chart sting cold-open + “SUSPECT 4” card | investigative |
| H6 | **Suspect 5 — Deposit Scheme / policy** | after S30, before S31 | Keys/door (`F26`/`B03` echo) or bank still + “SUSPECT 5” card | sombre / wary |
| H7 | **ANALYSIS board** | after S35, before S36 | Five-suspect board / locks montage; **ANALYSIS** label | sombre piano |
| H8 | Soft ownership beat | optional short breath before S37 if the cut needs air | Suburb dusk (`B05`) / terraces (IMG-17/23) | sombre piano soft |
| H9 | **WHAT COULD HAPPEN** | after S38, before S39 | Parliament exterior `F23` / RBA still + **WHAT COULD HAPPEN** label | tense under, then investigative |
| H10 | Closing / CTA | after S39, before S40 (or under S40 end card) | City hyperlapse `F35` / IMG-25 + end card | surge softer, then out |

Hold length: long enough to feel intentional (roughly 1.5–4 s at 1×), picture always changing, music rising, **zero VO**. Do not rewrite VO text to create holds — edit/pacing only.

## Mid-rolls

Insert mid-roll ad breaks **only** after:

1. **S13** (end of Suspect 1 / RBA)
2. **S25** (end of Suspect 3 / supply)
3. **S34** (end of Suspect 5 / Deposit Scheme)

Do not put a mid-roll on a spoken word. Picture can hold on a card or muted clip. No invented ad reads or host spiel.

## On-screen chapter labels

| Label | Segments |
| --- | --- |
| **ANALYSIS** | S24, S36, S37, S38 |
| **WHAT COULD HAPPEN** | S39 |

Suspect chapter titles on holds / first card of each suspect block, e.g. “SUSPECT 1 — THE RESERVE BANK”, matching plain-English voice (Australian spelling: labour not used here; “defence”, “metres” not required in cards — match the VO’s words: Reserve Bank, negative gearing, capital gains tax discount, Housing Accord, net overseas migration, five per cent Deposit Scheme).

## Suggested picture placement by block

Concrete, not generic — override only when a better seated file fits the same spoken beat.

### Open + cold open (H0, S01–S04)

- S01: city / money (`F18`/`F19`/`F25`) + IMG-02 RBA + bank stills IMG-21/22 when present; rate card “4.60%” / “four point six per cent”
- S02: IMG-01 Bullock + quote card **I guess possibly.** (exact words)
- S03: B01 then B02; rents / FHB card; IMG-10 or IMG-23 dream house when present
- S04: five-suspect title board; IMG-25 or city clip; “you’ll be the jury”

### Meet Sam + three locks (S05–S07)

- S05: apartments IMG-18 / F08–F11; Sam name card (“fictional example”)
- S06: Deposit / Loan / Home lock graphic
- S07: big number card **$607,624** and **8.5%** (match voice)

### Suspect 1 — RBA (H1, S08–S13) → mid-roll

- S08–S10: IMG-02/03, F25, explanatory cash-rate cards
- S11: **timeline** 2025 cuts → Feb/Mar/May/Sep 2026 to 4.60%; +$110 / month card
- S12–S13: Bullock IMG-01 sparingly; defence vs case cards; lock “Loan” highlight

### Suspect 2 — tax / investors (H2, S14–S20)

- S14–S16: IMG-09 Treasury; teach-negative-gearing / CGT cards (half profit = 50% discount)
- S15: **B03** contract + key
- S17: Senate committee — IMG-07 or card (no ParlView)
- S18: IMG-04 Chalmers + Budget date card **12 May 2026**; law from **1 July 2027**; Parliament pass **25 Jun 2026** — photos/cards/`F23` only
- S19–S20: construction defence (`F12`–`F17`); bridge to supply

### Suspect 3 — supply (H3, S21–S25) → mid-roll

- S21–S23: Accord target **1.2 million**; completed **307,635** vs ~**420,000** needed; slip to end-**2030**
- S24: **ANALYSIS** + **B04** leafy street + zoning cards
- S25: OECD **~400 homes per 1,000 people** card; shared-blame beat

### Suspect 4 — migration (H5, S26–S30)

- S26–S28: `F24` airport; NOM timeline: peak **556,000** → **306,000** → **292,100** → **~245,000 this financial year**
- S29–S30: construction workforce / building skills; link back to Suspect 3; IMG-06/`F23` for “governments” beat

### Suspect 5 — Deposit Scheme (H6, S31–S34) → mid-roll

- S31–S32: scheme explainer cards; 5% vs 20%; LMI; expanded **1 Oct 2025**
- S33: price-pressure / Cotality card (match voice, no extra claims)
- S34: IMG-05 O’Neil or name card; 95% loan risk card

### Board + ANALYSIS + ownership (S35–S38)

- S35: five suspects on one board; none acted alone
- S36–S38: **ANALYSIS** labels; **B05** on S37; home-ownership “about two in three”; 2019/2022 election politics via cards + IMG-08 when present — no party logos

### WHAT COULD HAPPEN + close (H9–H10, S39–S40)

- S39: **WHAT COULD HAPPEN** — inflation figures late Oct; RBA **3 Nov**; tax changes **1 Jul 2027**; Accord ~ end-**2030**
- S40: jury CTA; sources-in-description card; subscribe/follow end card; city close

## Audio

Same pack and discipline as lf03.

- While the voice is talking, music is a **quiet bed**. The voice is always clearer.
- In pauses and **chapter holds**, bring the bed **up**. Not full.
- Change the bed with the scene:
  - **Tense** `audio/music/tense-vertigo-597.mp3` — open, rate-shock, risk, WHAT COULD HAPPEN sting
  - **Investigative** `audio/music/investigative-feedback-dreams-588.mp3` — evidence chapters / suspects
  - **Sombre piano** `audio/music/sombre-piano-classical-7-714.mp3` — soft ownership / S37–S38 / reflective holds
  - **Surge** `audio/music/poll-surge-dreaming-big-31.mp3` — board reveal / closing momentum (keep under VO)
- **Mute every** footage and B-roll clip. No original speech from anywhere. No news audio. No sirens.
- Hits land on the **picture**, never on a spoken word. SFX in `audio/sfx/`: shutter, typewriter, whoosh, coin, door, bell, paper tear, gavel (use gavel sparingly if at all — court not central here; credit if used), `series_sting.flac` on open.
- Open with `audio/sfx/series_sting.flac`.
- Do **not** speed or loudnorm the voice files themselves.
- Build the cut at **1×** first. The file you deliver is the **whole film at 1.28× with the pitch held**, then **two-pass loudnorm** on that master only. Target about **−14 LUFS**. True peak at or under **−1.5 dBTP**.
- Write `final/loudnorm-report.md` with the measured integrated loudness and true peak.

## Delivery

On branch `scaffold/lf04-housing`, not merged:

- `final/lf04-housing.mp4` — the **1.28× pitch-held**, loudnormed master
- A **contact sheet** (same convention as lf03)
- A **chapter list** with times on the master (1.28× timecodes; keep 1× beside them if you write a cue sheet)
- `final/loudnorm-report.md`

Do **not** upload to YouTube. Do **not** open a pull request. Do **not** @ anyone. Do **not** merge to `main`.

Credits for the description already live in `images/CREDITS.md`, `footage/CREDITS.md`, and `audio/MUSIC_CREDITS.md`. Do not drop a credit because a thumbnail crop was used.

## Hard “do not” checklist

- No Gallipoli-style / parchment kinetic map film
- No ParlView / chamber video download; FREE SWAP to photos + cards
- No news-network / AAP / Getty footage or photos
- No AI faces of real people; no Sam face
- No new AI video beyond seated B01–B05
- No retiming / loudnorm of `audio/vo/*.mp3`
- No mid-rolls except after S13, S25, S34
- No empty black chapter holds — real visuals + music rise, no VO
- No inventing numbers; S28 NOM this FY = **245,000** as spoken
- No merge, no PR, no @, no YouTube upload
