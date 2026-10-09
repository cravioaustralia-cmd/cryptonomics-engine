# lf06 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`
Episode folder: `longform/lf06-gaza-ch1/`
Branch: `scaffold/lf06-gaza-ch1` (**pull this branch only; do not merge, do not open a PR, do not @ anyone, do not upload to YouTube**)
Film: **14,000 KILOMETRES — Why Gaza Matters in Australia · Chapter 1: The Vote Australia Cast First** (segments S05–S13, about 2 min 10 s at 1×)

This is a long-form **DOCUMENTARY**, 16:9, 1920×1080, 30 fps. It is a pilot: Abhishek has high expectations and wants this chapter to look and sound **next level** before the full script is made. It is not a vertical Short. It is not a Gallipoli-style map film: maps are small built graphics (MAP01–MAP04 below) that sit among real archival photos, real footage, evidence cards, document zooms and a few AI shots.

Australian English in every label, caption and card.

## Read this before you touch a frame (in this order)

1. `script/PRODUCTION_SCRIPT.txt` (and `.pdf`): the producer's full shot-by-shot script. **It is the design bible**: visual tracks, image moves (DROP, PAN, STACK, ZOOM, CIRCLE, CALLOUT, SPLIT, PIN), animation cues on trigger words, design tokens, recurring devices, sound rules. Follow it. The notes below only say where reality differs from the script.
2. `script/SCRIPT_NOTE.md` (publish-day checks and the one voice edit).
3. `docs/EVIDENCE_CARDS.md` (final card wording) and `docs/FACT_CHECKS.md`.
4. `images/MANIFEST.md`, `images/CREDITS.md`, `images/SKIPPED.md`
5. `footage/MANIFEST.md`, `footage/CREDITS.md`, `footage/SKIPPED.md`
6. `broll/MANIFEST.md`
7. `audio/MUSIC_CREDITS.md` and **`audio/MIX_MAP.md`** (every music and SFX cue, with file positions and levels). Move its estimated times onto the real voice files.
8. `data/MAP_NOTES.md`, `data/CREDITS.md` (Natural Earth and the partition-plan geometry), `fonts/`

## Editorial stance (locked by the script, applies to every frame)

Non-partisan. The film does not take a side in the Israeli–Palestinian conflict; its question is how the conflict affected Australia and Australians. Equal treatment: when one community's experience or position is shown, the other's is shown at the **same size, for the same time, in the same design, with the same music level**. In this chapter that is **S10** (two memories of 1948) and **S12** (two population figures). Contested facts are attributed on screen. **No national flag colours as design colours. Flags appear only where they are in a real photograph.** No AI-generated, drawn or altered image of any real person; no AI religious dress, symbols or flags. No graphic content: no violence or casualties from any side. Do not put anything on screen that the voice does not support.

S10 balance check (do it, and write the measured result into `final/DELIVERY_NOTES.md`): the PH03 half and the PH04 half are on screen for the **identical duration**, same size, same Ken Burns speed, labels appear at the **same frame**, music level constant, no sound effect favours one side.

## Rules that never move

- Do **not** rewrite spoken words. Do not add facts, places, numbers or shots the voice does not support. `[pause]` and `<soft>` were delivery tags and are not in the audio or on screen.
- Narration source of truth: `audio/vo/S05.mp3`–`S13.mp3` (Ara = **S05, S12**; Atlas = the rest). Evened pace already. **Do not speed, pitch-shift, loudnorm or overwrite these files.** Raw backups are in `audio/vo-raw/`. Leave both alone. Read durations with `ffprobe`; do not hard-code the script's estimated times.
- S07 has two deliberate one-second silences ("…Arab state, [beat] the first country to vote yes [beat] is Australia."). Keep them as silence in the voice track and design the picture for them.
- **0.4 s of air at every Atlas ↔ Ara handover** (S05→S06 and S11→S12→S13). Add it in the edit, not in the voice files.
- **Voice wording changed from the PDF in one place:** S12 now says "about one hundred thousand Jewish Australians" because the 2021 Census (the latest; 2026 results are due 2027) counts 99,956. The card reads **About 100,000 Jewish Australians · 800,000+ Muslim Australians**, source tag **ABS Census 2021: 99,956 and 813,392**. Cards must match the voice.
- Use **only assets already seated** in this folder. Do not download media. Do not generate new AI video. Do not generate a likeness of any real person. No ParlView, news-network, AAP, Getty, UN Photo or agency material.
- Media budget **$0**: free licences only, credited from the CREDITS files.
- Every real photo carries a small caption (place, year) and a credit line in the corner (caption wording in `images/MANIFEST.md`; use those captions, not the script's, where they differ — see "Where reality differs").

## Design (from the script, restated)

Tokens: Navy `#0E1A2B` (background, chapter card) · Paper `#F2EEE6` (evidence cards, text on dark) · Amber `#E8A33D` (the Thread, highlights, circles) · Grey `#8A8A8A` (secondary labels) · Map land `#22324A` · Map sea `#0A1422`. Fonts (all in `fonts/`): Source Serif 4 for the chapter card, quotes and evidence cards; Inter for labels and numbers; IBM Plex Mono for the split-flap date board. Archival grade: warm sepia, light grain, soft vignette. Modern images slightly desaturated and cool. Motion: ease-out entrances 200–350 ms; map lines draw over 1.5–2 s ease-in-out.

**Golden rule: something on screen reacts to the voice every 1–2 seconds. The only exception is S10 (quiet moment): slow motion only, no shakes, no comic effects.** No shot may sit still for more than 2 seconds outside S10.

Recurring devices introduced here: split-flap date board (lower-left, IBM Plex Mono) for **NOV 1947** (S05) and **OCT 1917** (S08); the evidence board (dark board, cards tied with amber string; first two cards **TWO MEMORIES** in S10 and **1947 VOTE** in S13); MAP01 the Thread (dark globe, glowing amber line Sydney → Gaza, node 1 **1947 VOTE** lights in S13; the other nodes of the full film may sit dim and unlabelled or be omitted). Sydney → Gaza is about **14,185 km** (`data/coordinates.json`), supporting the title; the number "14,000 km" may sit small beside the line.

Maps are built by you from `data/`: Natural Earth (public domain) for coast, lakes and Australia; **`data/partition_plan_1947.geojson`** for MAP03 (traced from the official UN A/516 Annex A map, public domain, accuracy about 0.5 km; the three zones plus the Jaffa enclave; the reference scans are alongside it, and if you show a scan, remove the UN name, logo and map number). `data/MAP_NOTES.md` gives frames and the neutral palette (sand `#D6BE96` and slate `#8C96A5` at equal strength, off-white Jerusalem ring); the Natural Earth Israel/Palestine outlines are modern, so on the 1947 map do not draw modern internal lines. Keep them neutral: sand and slate fills, Jerusalem ring as a neutral third colour, labels "Proposed Jewish state", "Proposed Arab state", "Jerusalem (international zone)". No flags.

## Picture priority

Real footage and photos first, then document/evidence cards, then maps and data graphics, then AI B-roll (only where listed). Mute every clip.

Disclaimer / opening: this chapter plays standalone, so open with the script's **short on-screen disclaimer** (4 s, navy, no narration, Source Serif 4 28 pt, #F2EEE6): "An independent, non-partisan documentary. We don't take sides. Facts are sourced on screen; each side's view is attributed and given equal weight. Some scenes and the narration voices are AI-generated." Play it with the MUS12 motif, then cut to the chapter card. (The full disclaimer goes in the YouTube description.)

## Shot plan by segment (files are all in this folder)

Segment audio file, speaker and mood in brackets. Cues start on the first word of the trigger in the real voice file.

**Open (disclaimer 4 s, then chapter card ≈3 s): no VO.** MUS12 motif over the disclaimer; chapter card CHAPTER 1 — THE VOTE AUSTRALIA CAST FIRST (navy, film grain), `SFX07_projector` starts, MUS02 strings fade in under the motif tail. This is the film's chapter hold: music and picture, no voice.

**S05** (Ara, clear, formal, like reading the record). "November, nineteen forty-seven. The United Nations General Assembly, New York."
- FT05 (UN archive film) was **not licensed**; use the script's fallback. Picture: `PH26_un_1947.jpg` ("UN General Assembly, 1947") with PAN and a film-flicker overlay (SFX07), plus ZOOM into `docs/DOC01_res181_title_page-01.png` and, as a quick optional cutaway under 3 s, `footage/FT05b_lake_success_1946.mp4` captioned honestly **"United Nations, Lake Success, New York, 1946"** (never as the 1947 vote). HOLD 1.0 s.
- "November": split-flap flips to **NOV 1947** (SFX06). "New York": small locator dot on a world inset (SFX05).
- PH26 shows the Assembly President at the rostrum in September 1947, not the 29 November vote: caption it "UN General Assembly, 1947" and do not claim more.

**S06** (Atlas, curious, building). Evatt.
- `PH01_evatt.jpg` (use the `_2400` file) DROP then PAN with parallax (SFX12 shutter on the drop). Lower third: **H.V. "Doc" Evatt — Australian Foreign Minister**; callout on "Doc": **Chair, UN Ad Hoc Committee on Palestine**. Kinetic word **AUSTRALIAN** in amber on "an Australian" (SFX06). HOLD 0.5 s.
- Evatt appears **only in a real photo** (crop, scale, grade, position only). Optional second shot, under 2 s: `PH01b_evatt_press_conference_1945.jpg` captioned "H.V. Evatt, press conference, United States, May 1945". Do not caption anything as Evatt in the UN in 1947: Evatt had left for Australia before the vote, so do not imply he sat in the hall. Do not label the man in PH26 as Evatt.

**S07** (Atlas, quiet surprise). "When the vote is called on a plan to divide the land into a Jewish state and an Arab state, [beat] the first country to vote yes [beat] is Australia."
- ZOOM into `DOC01` to the line "181 (II). Future government of Palestine" with a highlighter swipe (SFX18 paper). Card DOC01: **UN General Assembly Resolution 181 (II) · 29 November 1947 · Future government of Palestine** (tag: A/RES/181(II)).
- MAP03: the 1947 partition plan draws in neutral sand and slate, Jerusalem marked as an international zone; on "divide the land" the map splits into two zones and the Jerusalem ring appears (SFX05).
- On "first country": the roll call scrolls fast then stops (SFX06 ticks), using `docs/DOC02b_voting_sheet_29nov1947.jpg` (crop to the typed table only; it has later handwritten autographs on it) and/or the A/PV.128 page images `docs/DOC02_A-PV-128_rollcall-15.png`. The scroll must show the true calling order: **Afghanistan · No / Argentina · Abstain / Australia · Yes**, and then stop on Australia. On "Australia": a hand-drawn amber circle draws around the word (SFX20 marker, time-stretched to the draw). Card DOC02: **Roll-call vote, 29 November 1947 — Australia: Yes** (tag: UN General Assembly, 128th plenary meeting, A/PV.128). Optional sub-line: Adopted 33–13, 10 abstentions.
- HOLD 1.5 s after "Australia"; MUS02 swells about +3 dB (hand-ridden, see MIX_MAP).

**S08** (Atlas, warm, storytelling). Beersheba, 31 October 1917.
- Open with `footage/ST06_desert_wind.mp4` (add a light blowing-sand particle layer; the clip's motion is subtle), then `broll/AI03_cavalry_silhouettes.mp4` (distant rider silhouettes on the far ridge; use a calm 5–6 s window; 720p scaled to 1080p with film grain). **AI03 is the first AI shot in the chapter: show a small "Dramatised reconstruction" label** (bottom-left, in the edit, not in the file).
- Real film/photos: `footage/FT02_light_horse_1917.mp4` ("Beersheba, 1917"), `footage/FT02b_light_horse_desert_1918.mp4` (caption "Palestine, 1918", not 1917), optional `footage/FT02c_jerusalem_dec1917.mp4` ("Jerusalem, December 1917"; do not call it Light Horse). Photos: PH02 PAN with parallax (riders separated from background), then STACK PH02b and PH02c (click per photo; SFX12/SFX06). Caption "Palestine, 1917. Credit: AWM". **The AWM files carry a burned-in "AUSTRALIAN WAR MEMORIAL" strip at the bottom: crop it.** They are low resolution (about 640 px): use them at no more than about 70% of frame width on the desk, or with a slow push, never full-bleed 4K. Optional texture: `PH02d_beersheba_after_battle_1917.jpg` (not identifiably Light Horse: caption "Beersheba, after the battle, 1917").
- MAP02 (built): Beersheba locator, dotted charge arrow, then a line toward Jerusalem. "Beersheba": split-flap flips to **OCT 1917**; locator pin drops (SFX21 thunk). "charged": arrow sweeps (SFX16 hooves, fade with the arrow). "road to Jerusalem": line extends to Jerusalem (SFX05). HOLD 1.0 s on the map.

**S09** (Atlas, reflective). "So Australians helped shape this land twice. [beat] Once on horseback. [beat] And once at a ballot."
- SPLIT: PH02 (left) and DOC02 (right) slide in and lock at equal size; years **1917 | 1947** above each. "horseback": left brightens. "ballot": right brightens (SFX19 stamp, kept low). HOLD 1.5 s.

**S10** (Atlas, soft, even, equal weight: QUIET MOMENT). Slow motion only, no shakes, no comic effects. MUS02 crossfades to `MUS06` soft piano over 3 s (equal-power; finish it before MUS02's lift, see MIX_MAP).
- SPLIT: `PH03_israel_1948_celebration.jpg` (left; "Tel Aviv, 14 May 1948") and `PH04_palestinian_refugees_1948.jpg` (right; "Galilee, October 1948"), identical size, identical duration, both PAN slowly at **identical speed**. Use the `_2400` versions. Credits on both: GPO Israel archive, CC BY-SA 3.0, shown with equal prominence. Labels fade in at the **same frame**: on "rescue" left **1948 — INDEPENDENCE**; on "Nakba" right **1948 — THE NAKBA** (hold these label-timings identical; the labels are the only things that differ). Both labels use the same design.
- On "seven hundred thousand": a small number rolls on the right half with the source tag **700,000+ displaced — UN Conciliation Commission for Palestine, 1950: ~711,000** (SFX06 soft, very low). On "The same event": the split line glows amber, HOLD 2.0 s. On "Remember that idea": kinetic text **TWO MEMORIES** writes on and PINs to the evidence board as card 1 (SFX21 thunk).
- Do not add anything else to this segment.

**S11** (Atlas, warm). MUS06 crossfades back to the MUS02 warm section over 3 s.
- `broll/AI05_suitcases_ship.mp4` (two suitcases on a ship's deck; calm 5–6 s window; scaled with grain) → `PH05_station_pier_migrants.jpg` (DROP + PAN; **caption "British migrants aboard the Georgic, 1949"**, not "Station Pier"; 1317 px, so use at about 70% frame or with a slow push) → `PH06_lakemba_haldon_st_2007.jpg` (DROP + PAN; **caption "Haldon Street, Lakemba, Sydney, 2007"**, not "1970s"; CC BY-SA 3.0 credit visible). Optional alt inset `PH05_small.jpg` ("Port Melbourne, 1954"). Optional `PH06b_eid_lakemba_mosque_2014.jpg`: **skip it unless a balancing image of the same weight sits beside it**; the default is not to use it.
- MAP04: two soft flow lines land in Melbourne and Sydney, **same design, same line weight, same timing**. "sailed": flow line 1 draws Europe→Melbourne (SFX05). "Holocaust survivors": Melbourne pin glows. "south-west": flow line 2 draws Middle East→Sydney (SFX05 at the same gain).

**S12** (Ara, clear, factual). Population graphic: two **identical** number rolls side by side, same size and design; source tag **ABS Census 2021: 99,956 and 813,392**. "one hundred thousand": left rolls 0 → 100,000+ shown as **About 100,000** (SFX06 ticks). "eight hundred thousand": right rolls 0 → **800,000+** (identical tick pattern and gain). Card DOC10: **About 100,000 Jewish Australians · 800,000+ Muslim Australians**.

**S13** (Atlas, closing a chapter, hinting forward).
- MAP01 globe: node 1 **1947 VOTE** lights on the Thread. "start the clock": a clock hand ticks once over the globe (SFX06). "never heard of": node 1 glows; evidence board card 2 **1947 VOTE** pins and the string ties it to **TWO MEMORIES** (SFX21 thunk + SFX10 hum rising).
- On "wired into the war": sound bridge. SFX10 factory hum rises; MUS02 out (2 s), MUS03 pulse in (2–3 s).
- **End hold (no voice, about 3 s):** music-led. MUS03 pulse with the globe thread glowing amber and the SFX10 hum rising, then a slow fade to navy. This is the chapter's closing hold into Chapter 2.

## Evidence cards (final wording; source tag small, same wording as the voice)

DOC01, DOC02, DOC10, S06 label, S10 labels — exactly as in `docs/EVIDENCE_CARDS.md`. Every card matches its source word for word; if anything differs, change the card, never the source. The S10 source tag must read "UN Conciliation Commission for Palestine, 1950: ~711,000", not a bare "UN". Chapter label rules: FACT cards are FACT; the film's contested claims are attributed, not asserted. Do **not** put on screen any figure the voice does not say (the only added number is the sourced ~711,000 tag on S10; the only added exact counts are the 99,956 / 813,392 source tags on S12).

## Audio

- Narration −14 LUFS integrated (final master). SFX about 12 dB under the narration. Music about 20 dB under the narration and ducking under speech; **bed rises in the music-only holds** (opening, S07 beats, S09 hold, S10 "same event" hold, end hold), changing with the scene, crossfading 2–4 s on emotion changes rather than on cuts.
- Cues, files and levels: `audio/MIX_MAP.md` (MUS12→MUS02 opening; MUS02→MUS06 in S10; MUS06→MUS02 warm in S11; MUS02→MUS03 and SFX10 rising in S13). `MUS06` masters about 9 dB quieter than MUS02, so set its fader about 9 dB above to hold the same bed level.
- B-roll and archive clips stay **mute**. No original speech. Hits land on the picture, never on a word. No sirens.
- SFX19 stamp is a stand-in (Mixkit punch, softened); keep it low.

## Build, master and deliver

Build at 1×. Write the review cut as `final/lf06-gaza-ch1-1x.mp4` (script timing, about 2:10 plus the opening card and end hold). Then also deliver the house **1.28×, pitch-held** master `final/lf06-gaza-ch1.mp4` (whole chapter run through rubberband, then two-pass loudnorm on that master only: about **−14 LUFS integrated, true peak ≤ −1.5 dBTP**) and write `final/loudnorm-report.md` for both. H.264 or HEVC 1920×1080, 30 fps, AAC 48 kHz stereo; keep each file under 95 MB so it can be committed (the repo does not use Git LFS). Also write:

- `final/contact-sheet.jpg` (one frame per second of the 1× cut) and `final/contact-sheet-shots.jpg` (key shots S05–S13),
- `final/chapters.md` (cue sheet with real times and, for the YouTube description, the chapter marker),
- `final/DESCRIPTION.md`: paste-ready YouTube description with the **full disclaimer from the script at the top**, the chapter marker, the sources named in the film (UN Resolution 181 (II) and the 128th plenary record A/PV.128, Australian War Memorial for the Beersheba date, UN Conciliation Commission estimate, ABS Census 2021), and **every media credit actually used in the cut** (drop credits for assets you did not use; the two CC BY-SA photos PH03/PH04 and PH06 need author and licence link; Mixkit tracks and effects; Natural Earth; fonts), plus the AI-reconstruction note ("some scenes are AI-generated reconstructions, the narration voices are AI-generated, no real person has been AI-generated or altered"). Email placeholder stays `[your email]`. Flag any licence that does not name YouTube explicitly (all Mixkit items do name it; AWM, Commons PD, CC BY-SA, ABS CC BY 4.0, Natural Earth, OFL do not),
- `final/DELIVERY_NOTES.md`: the S10 balance measurements, any shot you replaced or held back and why, anything an editor should check by ear (nobody has listened to the music pack: judge each bed by ear in the edit and say if any needs swapping), and the pilot review questions answered honestly (does S05–S07 make you want to know what comes next? do Atlas and Ara belong in the same film? are the free archival photos rich enough or thin? does anything stay still over 2 s outside S10? would a viewer from either community feel S10 treated their history fairly?).

Commit the work and the mp4s to `scaffold/lf06-gaza-ch1` and push that branch only. **Do not merge, do not open a PR, do not @ anyone, do not upload to YouTube.**

## Where reality differs from the script (decided; don't revisit)

- **FT05** (UN AV Library film): not licensed (paid, cannot be altered). Fallback: PH26 + DOC01/DOC02 zooms + MAP03, with FT05b as a short honest 1946 cutaway.
- **PH06** "Sydney, 1970s": no free 1970s photo exists; the seated image is modern Lakemba, caption changed to match.
- **PH05**: the seated photo is "British migrants aboard the Georgic, 1949" (source does not name a port).
- **S08 line "one of the last great cavalry charges"** is the script's wording; AWM says "major". Keep the voice.
- **AI shots are 720p** (the Grok account has no 1080p); both passed review at about 6/10. If a glitch shows on screen, drop that shot: AI03 → PH02 PAN, AI05 → PH05 PAN, and note it in DELIVERY_NOTES.
- **Voice**: S06 was re-recorded so "Evatt" is said as a word; S07 was re-recorded for its two beats. If any name still sounds wrong in the cut, say so in DELIVERY_NOTES rather than re-timing the audio.
- Anefo (Dutch agency) CC0 photos were deliberately **not** used (agency rule). Do not add them.

## Role split

You do the design, the cards, the maps, the timeline, the edit, the mix and the master. The production manager has already recorded the voice (Atlas and Ara via Grok), evened the pace, seated the real free media, music and effects, and generated the AI shots. Place them; do not replace them.
