# BEFORE BONDI (lf07): music and SFX mix map (S01–S46)

**Status: built from the script and the file measurements only. Nobody has listened to any seated file and no voiceover audio exists yet (`audio/vo/` is empty).** Every time below is the script's own "≈" segment start, which does not include the BREATHE holds, the two silences or the 8 s / 5 s montage lead-ins, so real times will drift later as the VO is cut. Move each cue to the real first word of its trigger once S01–S46 exist. Cues sit on the first word of the trigger word.

Segment starts used (script): S01 0:00 · S02 0:19 · S03 0:38 · S04 0:50 · S05 1:08 · S06 1:21 · S07 1:34 · S08 1:54 · S09 2:09 · S10 2:25 · S11 2:47 · S12 3:05 · S13 3:21 · S14 3:43 · S15 3:58 · S16 4:22 · S17 4:43 · S18 4:57 · S19 5:15 · S20 5:35 · S21 5:59 · S22 6:22 · S23 6:38 · S24 6:53 · S25 7:16 · S26 7:30 · S27 7:48 · S28 8:07 · S29 8:15 · S30 8:34 · S31 9:00 · S32 9:18 · S33 9:43 · S34 10:02 · S35 10:22 · S36 10:35 · S37 10:50 · S38 11:08 · S39 11:18 · S40 11:32 · S41 11:52 · S42 12:13 · S43 12:38 · S44 12:57 · S45 13:14 · S46 13:41 · end ≈ 14:08, then a 15 s end screen. Mid-roll breaks (0.5 s clean beat) after S12 and S28.

## 1. Levels (script) and a fader offset per file

Script: **narration −14 LUFS integrated; SFX about 12 dB under narration; music about 20 dB under narration and ducking under speech; music rises to about −16 LUFS in the two montages (S34, S45).** Both voices must be matched to −14 LUFS before the mix (script section 5).

The seated files are not level-matched (MUS beds span −13.6 to −23.2 LUFS; effects differ by 20 dB). The offsets below bring each file to the script targets, measured on the files as seated, so set them as the starting fader (clip gain), then ride by ear:
- **Bed under speech:** −34 LUFS (14 + 20 dB under narration). Offset = −34 − the file's LUFS.
- **Montage / peak level:** −16 LUFS. Offset = −16 − the file's LUFS.
- **SFX (long ambiences):** −26 LUFS (12 dB under). Offset = −26 − the file's LUFS.
- **SFX (short one-shots, LUFS not measurable):** target RMS about −28 dBFS during the sound (narration at −14 LUFS has an RMS of roughly −16 dBFS, so −12 dB gives −28). Offset = −28 − the file's RMS.

| File | File loudness | Bed under speech (−34 LUFS) | Montage (−16 LUFS) |
|---|---|---|---|
| MUS01 mystery pulse | −13.6 LUFS | −20.4 dB | n/a |
| MUS02 history strings | −14.3 | −19.7 | n/a |
| MUS04 investigation | **−21.2** | **−12.8** | n/a |
| MUS06 sombre piano | **−23.2** | **−10.8** | n/a |
| MUS07 diplomatic strings | −14.4 | −19.6 | n/a |
| MUS09 heavy drone | −16.1 | −17.9 | **0.1** (the file's own peak plateau is about −16 LUFS short-term) |
| MUS10 cello grief | −14.8 | −19.2 | n/a |
| MUS11 closing | −16.1 | −17.9 | **0.1** |
| MUS12 motif | −18.3 | −15.7 (play it clearly, not buried: it is a signature, so try −10 dB first) | n/a |

| SFX | File level | Offset to −12 dB under narration |
|---|---|---|
| SFX02 fire | RMS −21.6 | −6.4 dB |
| SFX04 typewriter | RMS −26.9 | −1.1 |
| SFX05 whoosh | RMS −21.8 | −6.2 |
| SFX06 tick | RMS −20.9 | −7.1 |
| SFX07 projector (loop) | −24.0 LUFS | −2.0 (start about −30 dB under VO and rise) |
| SFX08 crowd (ambience) | −23.2 LUFS | −2.8 |
| SFX09 jet | −15.4 LUFS | −10.6 |
| SFX10 machining | −13.6 LUFS | −12.4 |
| SFX11 boom | RMS −24.1 | −3.9 (use "soft" cues at −8 dB more) |
| SFX12 shutter | RMS −26.8 | −1.2 |
| SFX13 waves/gulls | −20.1 LUFS | −5.9 |
| SFX14 riser | RMS −24.6 | −3.4 |
| SFX15 gavel | RMS −23.2 | −4.8 (cue says soft: −8 more) |
| SFX16 hooves | −26.8 LUFS | +0.8 |
| SFX17 ping | RMS −20.8 | −7.2 |
| SFX18 paper | RMS −33.9 | **+5.9** (a very quiet file) |
| SFX19 stamp | RMS −23.2 | −4.8 (soft cues −8 more) |
| SFX20 marker | RMS −17.9 | −10.1 |
| SFX21 thunk | RMS −21.7 | −6.3 |
| SFX22 door | RMS −21.3 | −6.7 |
| SFX23 rain | −23.2 LUFS | −2.8 |
| **SFX24 countdown tick** | RMS −14.9 | **−13.1** (the script says "a low heartbeat tick": keep it just above the bed so it is felt, not heard as an effect; ear-trim; see section 5) |
| SFX_pop | RMS −21.0 | −7.0 |
| SFX_paper_rip | RMS −27.7 | −0.3 |

True-peak safety: every file peaks at or below −1.1 dBFS as seated, and every offset above is a cut except SFX16 (+0.8, peak −1.43 → −0.6) and SFX18 (+5.9, peak −3.25 → +2.7): **do not apply a positive offset to those two without a limiter**; instead raise the other layers or use a limiter at −1 dBTP on the SFX bus.

Ducking (music): about −8 to −10 dB further under speech with 150 ms attack and 600 ms release, riding back up in pauses (the script's "ducking under speech"). In the BREATHE holds with no VO, lift the bed about +6 dB over 1.5 s (and back down before the next word), as the script says "MUS10 swells gently" in S40.

## 2. Silences and montage peaks

| Moment | Script | What the mix does |
|---|---|---|
| **Total silence 1: 1.0 s before S10's first word** | "SILENCE 1.0s before the first word." (music and SFX out) | End of S09: MUS04 fades out over the last ≈1.0 s of S09 (equal-power, ends exactly on the last word's tail; SFX06 ticks for the S09 words must finish before it). Then **1.000 s of true silence (digital zero; also no room tone)**. S10's first word starts the 1.0 s later; MUS04 returns about 3 s into S10 (fade-in 3 s, at its file position, see section 3). This adds 1.0 s to the running time of the film from S10 on |
| **Total silence 2: 2.0 s after S35 "it wasn't"** | "SILENCE 2.0s: music and all SFX out." | S35 ends on a hard cut to black. MUS09 is cut at the end of "wasn't" with an 80 ms fade (to avoid a click, not a fade you can hear), all SFX including SFX24 are already finished (the tick race ends before "it"). **2.000 s of digital silence**, then S36 begins with SFX13 waves from the first frame |
| **S34 montage peak** | "MONTAGE — NO VO, 8.0s before the first word … MUS09 builds to its peak." | MUS09 must reach its **file 1:31 step (+10 dB) at the start of the montage, 10:02 (this needs the 25 s loop in section 3)**, then hold its plateau under S34's VO and S35's first line. See section 3 for the exact in-points. Level: fader to the **montage offset (0.1 dB, ≈ −16 LUFS)**. Duck only −3 dB under S34's VO (not −8): the script wants this to be the loudest music so far |
| **S45 montage peak** | "MONTAGE — NO VO, 5.0s before the first word." | MUS11 plateau (file ≈ 0:53 onward) at the **montage level (≈ −16 LUFS)** from the first montage frame at 13:14; duck −5 dB under S45's VO; MUS12 on "more about us" |

## 3. Music lane (what plays when)

Crossfades are equal-power, 2–4 s, on emotion changes (not on cuts). "file t" = position in the seated file. All beds are long enough for their chapter except where a loop is listed. **Durations of the seated files:** MUS01 3:15.7 · MUS02 2:34.4 · MUS04 3:02.7 · MUS06 2:34.7 · MUS07 3:34.7 · MUS09 3:11.9 · MUS10 3:50.3 · MUS11 2:29.7 · MUS12 10.5 s.

| Script time | Segment | Action | File position / notes |
|---|---|---|---|
| 0:00–0:13 | S01 | **No music** (script: "SFX13 waves. No music yet"; 3.0 s hold, then voice) | SFX13 only |
| ≈0:13 | S01 "Fifteen people" | **MUS10 enters softly** (fade-in 3 s) | file 0:00. Over S01 (to 0:19) and S02 (0:19–0:38): file 0:00–0:25. The cello's first 25 s are −19 to −23 dB: quiet, as the script wants |
| 0:36 → 0:39 | S02 → S03 | **Crossfade MUS10 → MUS01 (3 s)**, hard emotional change to "mystery" | MUS01 in at file 0:00. S03–S06 (to 1:34) use file 0:00–0:56 (the steady pulse). **Do not run MUS01 past file 1:13: it steps up 7 dB there.** The 3:15 file has no need to loop |
| ≈1:46 | S07 "follow the money" | MUS01 fades out over 3 s (from about 1:44), **MUS12 on the title slam** (SFX11 + MUS12) | MUS12 file 0:00–10.5 s: plays through the 3.0 s title hold and the 4.0 s disclaimer card (no VO). Total motif needs about 7 s of 10.5 s; let the built-in fade run out to the end of the card |
| 1:54 → 1:57 | S08 chapter card | **MUS12 → MUS04** (3 s). Re-trigger MUS12 from file 0:00 for the card (it is a chapter card: "MUS12 → MUS04"), fade it out over 3 s while MUS04 comes in | MUS04 file 0:00 at ≈1:56 → under S08–S09 uses file 0:00–0:29 |
| ≈2:24 | S09 end | **MUS04 out over ≈1.0 s, then total silence 1.0 s** (see section 2) | |
| ≈2:29 (3 s into S10) | S10 | **MUS04 back in (fade-in 3 s)** | file ≈ 0:30 (continue, do not restart). S10–S12 (to 3:21) use file 0:30–1:25 |
| 3:18 | S12 end / S13 | MUS04 out (2 s fade) into the chapter card | |
| 3:21 → 3:24 | S13 chapter card | **MUS12 → MUS02 (3 s)** | MUS12 re-triggered; MUS02 file 0:00. S13–S14 (3:21–3:58) use file 0:00–0:37, which is the track's quiet build (−27 to −24 dB) |
| ≈3:56 → 3:59 | S14 end → S15 (QUIET) | **Crossfade MUS02 → MUS06 piano (3 s)** | MUS06 file 0:00; **fader about +9 dB relative to MUS02 to hold the same bed level** (MUS06 is −23.2 LUFS). Equal level under both halves of S15 (neutrality: no ride on "rescue" or "Nakba") |
| ≈4:20 → 4:23 | S15 end → S16 | **Crossfade MUS06 → MUS02 "warm" (3 s)** | **MUS02 re-enters at file 1:06.5** so its A-major lift (file 1:08.6) lands as the fade completes; plays to file ≈1:30 (S16 to 4:43). Same device as the lf06 mix |
| 4:41 → 4:44 | S16 end → S17 | **Crossfade MUS02 → MUS07 (3 s)**, on the countdown roll ("MUS02 out → MUS07 strings with pulse") | MUS07 file 0:00. MUS07 plays S17–S23: 4:43 → ≈6:50 = ≈127 s of 3:34. No loop |
| 4:57 | S18 chapter card | **MUS12 → MUS07**: MUS12 motif from file 0:00 over the card, MUS07 continues at its level (do not restart MUS07) | MUS07 at file ≈0:14 by now: its quiet-to-steady rise (file 0:15–0:35) is behind it |
| ≈6:48 → 6:51 | S23 end | **Crossfade MUS07 → MUS06 (3 s)** ("MUS07 → MUS06", fade to the candle, "much closer") | MUS06 re-enters at **file 0:30** (S15 used 0:00–0:28; no repeat). S24–S27 (to 8:07 + 3 s) use file 0:30–1:55 of 2:34. No loop |
| 8:07 → 8:11 | S28 | **Crossfade MUS06 → MUS09 (4 s)** ("MUS06 → MUS09 drone"; countdown rolls back to −799) | **MUS09 file 0:00** (it fades in from silence by itself, −52 dB at 0:00, −28 at 0:10) |
| 8:15 | S29 chapter card | MUS09 only; **no MUS12 on this card** (script: chapter cards but not Ch5 or Ch6) | |
| ≈9:07 (S31) | Ch5 body | **LOOP (extension): when MUS09 reaches file 1:00, jump back to file 0:35 with a 3 s equal-power crossfade, replay 0:35 → 1:00, and play on through to file 1:31.** The repeat adds 25 s | Reason: MUS09's quiet drone lasts only until 1:31, but it must run from 8:07 to the S34 montage at 10:02 (115 s). 91 s + 25 s = 116 s, so the file's +10 dB step lands at ≈10:03. The loop sits inside the steady-drone region (file 0:25–1:30 is flat at −24 ± 2 dB, no obvious event); listen for a bump. If the VO runs long, move the jump point, not the step |
| **10:02** | **S34 montage start** | MUS09 file **1:31**: the +10 dB step into the peak plateau | Montage 10:02–10:10 with no VO; plateau runs file 1:31–2:27 (−13 to −15 dB). S34 VO (10:10–10:22) and S35 first line (10:22–≈10:30) sit on file ≈1:39–2:00. S35 "MUS09 lifts briefly": ride +2 dB for 2 s on "hostages home", then back |
| ≈10:33 | S35 "it wasn't" | **MUS09 cut at the end of "wasn't"** (80 ms fade) then 2.0 s total silence | File would be at ≈ 2:00. Nothing of MUS09 is used after this |
| 10:35 + 2.0 | S36 | S36 begins: SFX13 waves first. **MUS10 cello begins at the candle (the 2.0 s hold on the candle)** | MUS10 **file 0:00** (same opening as S01: the cello returns, bookending the film; if that is too repetitive on a listen, start at file 0:05). Fade-in 3 s |
| 10:50–11:52 | S37–S41 | MUS10 continues under, "Music only" in the S37 3.0 s hold | At 11:32 (S40, +~57 s) the file is in its fuller section (file 0:38–1:25: −10 to −14 dB), so **"MUS10 swells gently" in S40 is mostly the file's own swell**; add a +3 dB ride over S40's 3.0 s hold. File 0:00 → ≈1:30 used. S38: QT10 appears silent 2.0 s first, then VO: leave the bed at its quiet level |
| ≈12:22 → 12:26 | S42 final node "BONDI" | **Crossfade MUS10 → MUS11 (4 s)** ("MUS10 resolves → MUS11") | MUS10 out at file ≈1:45; **MUS11 in at file 0:00** (rises from −50 dB in 6 s by itself) at ≈12:22 so that its file 0:50 lift (to −14) lands at 13:14, the start of the S45 montage |
| 12:38–13:14 | S43–S44 | MUS11 under, at the bed level | file 0:15–0:50 (flat −18 to −20 dB region) |
| **13:14** | **S45 montage start (5 s, no VO)** | MUS11 at its plateau; fader to the montage level (≈ −16 LUFS) | file ≈0:50–0:55; plateau (−13 to −15) from file 0:53 to 2:15 |
| ≈13:38 | S45 "more about us" | **MUS12 motif** (file 0:00) while MUS11 ducks −6 dB; HOLD 2.0 s | |
| 13:41–14:08 | S46 | MUS11 fades out under "Is this Australia's issue?" (3 s) and is gone by the support card | MUS11 used 12:22 → ≈13:44 = ≈82 s of 2:29. No loop; its own natural ending (file 2:15–2:29) is not needed |
| ≈14:08 → 14:23 | S46 end screen (15 s) | **MUS12 tail** from file 0:00 | MUS12 is 10.5 s; the end screen is 15 s, so **a 4.5 s gap of silence remains at the end**. To fill it, either let MUS11's natural ending (file 2:12–2:29.7, a 10 s fade) play instead and finish with MUS12 on top, or accept the silence. Decide at the edit |

Quiet moments (S01, S15, S24, S36, S37, S45; S38–S41 near-quiet): bed at the "under speech" level, no stamps, no heavy SFX (script rule).

**Loops summary:** only **MUS09** needs a loop (file 1:00 → 0:35, 25 s extension, above). If the real VO runs longer than the script, extend that same loop again (each pass adds 25 s) rather than letting the +10 dB step arrive early. No other bed is shorter than its chapter at the script's times: MUS04 uses 87 of 183 s, MUS02 uses ≈37 s (S13–S14) plus ≈24 s (S16) of 154 s, MUS07 ≈127 of 215 s, MUS06 ≈28 s + ≈85 s of 155 s, MUS10 ≈25 s + ≈105 s of 230 s, MUS11 ≈82 of 150 s, MUS01 ≈56 of 196 s.

**Neutrality rule (script section 1):** wherever two sides are shown in one segment (S15, S19, S21, S27, S32, S33, S44), keep the **same music level and no ride** between the two halves.

## 4. SFX lane (by script cue)

Image-move sounds (script "Image moves" table): DROP = SFX12 shutter · PAN = SFX05 (low) · STACK = one click per photo (SFX12 or SFX06) · ZOOM = SFX18 · CIRCLE = SFX20 · CALLOUT = SFX_pop · SPLIT = SFX05 + SFX06 on the lock · PIN = SFX21 · WALL = rapid SFX06 clicks (vary gain ±2 dB) · TORN = SFX_paper_rip. Where a cue below says only the animation, use these.

| Seg | Trigger | Sound (file) |
|---|---|---|
| S01 | HOLD 3.0 s, then voice | **SFX13 waves** from 0:00 (no music for the first 13 s). "fourteenth of December": **SFX24 tick** (soft). Fade SFX13 under the memorial cut (PH22) by about 0:19. File 38 s: no loop needed |
| S02 | "How did this happen here" | SFX21 thunk (pins) |
| S02 | "under strain" | SFX05 + WALL of 9 images (0.4 s each): script says "no sound but a soft whoosh": **SFX05 only, no SFX06 clicks** |
| S02 | "October twenty twenty-three" | **SFX24 + SFX06 fast ticks** (ticker rolls back to −799): about 8 SFX06 ticks over 0.7 s then **SFX24 on the landing** |
| S03 | "threads" | SFX05 + SFX14 riser (riser 2.4 s, ends on the Thread's draw) |
| S03 | "seventy-eight years" | SFX24 (−78 YEARS) |
| S03 | "a fire" | SFX02 (hard cut to flame) |
| S04 | "October" | SFX24 (−420 DAYS) · PH21 DROP: SFX12 |
| S04 | "goes up in flames" | SFX02 |
| S04 | "local crime" | **SFX03 siren: NOT SEATED (no sirens).** Leave silent or use a low SFX05 for the tape slide; decide before export |
| S04 | "Seven weeks later" | SFX24 (−373 DAYS) + SFX05 |
| S04 | "firebombed" | SFX11 (soft: −8 dB) · PH20 TORN: SFX_paper_rip |
| S05 | "paid" | SFX19 stamp (PAID) |
| S05 | "other side of the world" | SFX21 |
| S06 | "come back to him" | SFX21 |
| S07 | "together" | SFX05 |
| S07 | "follow the money" | SFX11 + MUS12 (title slam) |
| S08 | "ASIO" | SFX_pop · PH24 DROP: SFX12 |
| S08 | "following the money" | SFX06 |
| S08 | "layer cake" | SFX21 |
| S09 | "Middlemen overseas" / "Coordinators" / "local criminals" / "cheap" / "deniable" / "hard to detect" | SFX06 each; "local criminals" also SFX05 |
| S10 | (before the first word) | **TOTAL SILENCE 1.0 s** |
| S10 | "August" | SFX24 (−110 DAYS) |
| S10 | "Revolutionary Guard" | SFX11 |
| S10 | "restaurant fire" / "synagogue" | SFX21 / SFX21 (PIN) |
| S10 | "Australian soil" | SFX19 (answer stamp) · PH07 DROP: SFX12 |
| S11 | "expelled" | SFX22 door |
| S11 | "Second World War" | SFX06 fast + SFX19 |
| S11 | "Remember those words" | SFX21 (bright pin) |
| S12 | "one hundred and ten days" | SFX24 (pulse −110, no change in the number) |
| S12 | "as a weapon" | SFX02 (soft: −8 dB) |
| S12 | "cast first" | SFX07 projector starts; runs into S13 |
| S13 | "November" | SFX24 (29 NOV 1947 · −78 YEARS) |
| S13 | "divide" | SFX05 |
| S13 | "foreign minister" | SFX_pop |
| S13 | "Australia" | SFX20 (circle) · DOC02 ZOOM: SFX18 |
| S13 | PH26 flicker | SFX07 continues; **loop** (24.0 s file): seamless loop file 1.5 s → 22.5 s (14 cycles, 20 ms crossfade, as in lf06) if S12 + S13's flicker runs past 24 s. Fade out 1 s after the circle |
| S14 | "Beersheba" | SFX21 + SFX24 (−108 YEARS): put SFX24 0.15 s **before** the thunk |
| S14 | "charged" | SFX16 hooves (12.9 s; fade in 0.3 s, out with the arrow, about 2–4 s used) |
| S14 | "ballot" | SFX19 (soft) |
| S15 | "opposite ways" | SFX21 (quiet moment: very soft, −8 dB) |
| S16 | "sailed" / "south-west" | SFX05 / SFX05 (same gain, balance) |
| S16 | "one hundred thousand" / "eight hundred thousand" | SFX06 rolls: **identical tick pattern and gain for both** |
| S17 | "doesn't stay there" | SFX05 |
| S17 | "Canberra" | SFX24 (−799 DAYS roll) + SFX06 fast |
| S18 | (chapter card, "shared global pool") | SFX10 machining + SFX09 jet (S18's asset list): **SFX10 under the card from 4:57 (rises over 6 s)**, **SFX09 jet on "F-35"** (about 5:03). SFX19 (MADE IN AUSTRALIA stamp). "shared global pool" SFX05; "So does Israel's" SFX06 |
| S19 | "Critics" / "The government says" | SFX18 / SFX18 (equal) |
| S20 | "August" | SFX24 (−125 DAYS) |
| S20 | "nineteen forty-seven" | SFX20 (DOC02 circle redraws) |
| S20 | "back in" | SFX06 (counter 1947 → 2025) |
| S21 | "United Nations" | SFX05 |
| S21 | "both directions" | SFX11 (soft) ×2 |
| S21 | "rewarded Hamas" / "completely meaningless" | SFX21 / SFX21 (equal) |
| S22 | countdown appears (start) | SFX24 (−117 DAYS): **no tick row in the cue table, but SFX24 is in S22's asset list; add one at the countdown change** |
| S22 | "turned personal" / "posted" | SFX05 / SFX17 |
| S23 | "Visas" | SFX19 ×2 (one each side, equal) |
| S23 | "lowest point" | SFX11 (the Seam cracks) |
| S24 | (QUIET) | **No SFX** (−622 DAYS appears with no tick) |
| S25 | (three quote cards) | none |
| S26 | "twenty twenty-six" | SFX18 |
| S27 | "visitor visas" | SFX19 (stamp) · "Supporters" / "opposition" / "government": SFX06 ×3 |
| S28 | "never far away" | SFX21 |
| S28 | "in two" | SFX24 (the Seam widens; countdown rolls back to −799) |
| S29 | "seventh of October" | SFX04 typewriter (date types on; 4.8 s file) |
| S30 | "two years" / "Health Ministry" / "famine" | SFX05 (soft) / SFX04 / SFX18 |
| S31 | "Opera House" | SFX24 (−797 DAYS) |
| S31 | "rally gathered" | SFX08 crowd rises (file 2:00; fade in 2 s); SFX18 on "police review" |
| S32 | "phones" | SFX17 ×3–4, staggered 0.15–0.3 s, different gains (cascade) |
| S32 | "published online" | SFX19 |
| S32 | "taken off air" | SFX06 (the "click") |
| S32 | "unlawfully sacked" | SFX15 gavel (soft: −8 dB) |
| S32 | "Opposite sides" | SFX05 |
| S33 | "Harbour Bridge" | SFX24 (−133 DAYS) + SFX05; **SFX23 rain** starts here (file 48 s, S33 is about 19 s, no loop) |
| S33 | "antisemitic incidents" / "record abuse" / "two special envoys" | SFX06 / SFX06 (same) / SFX18 |
| S34 | montage + "before Bondi" | **SFX24 accelerating** (section 5); "before Bondi" **SFX14 + SFX11** (the strings pull to Bondi) |
| S35 | "ceasefire" | SFX18 |
| S35 | "Sixty-five days later" | **SFX24 accelerating, −65 → 0** (section 5); then silence |
| S36 | (resumes after silence) | SFX13 waves from the first frame; **no tick** (the ticker shows 14 DEC 2025 · BONDI; "never plays again after the attack except once in S42") |
| S37–S41 | | none |
| S42 | "Twenty-five days" | **SFX24 once, softly** (+25 DAYS) |
| S42 | "February" / "gun laws" | SFX19 (soft) / SFX19 (soft) (+137 DAYS: **stamp, not a tick**) |
| S42 | "one year to the day" | SFX21 (+365 DAYS pulses: **thunk, not a tick**) |
| S43 | start | SFX13 waves (dawn callback) |
| S43 | "A vote" / "jet" / "Fires" | SFX06 each |
| S44 | "ambassador" / "recognition" | SFX06 / SFX06 |
| S44 | "both sides" | SFX21 · "neighbour against neighbour" (QT02 returns): SFX21 (soft) |
| S45 | | none (the script lists MUS11 + MUS12 only) |
| S46 | "Australia's issue" | SFX06 (soft) |

## 5. SFX24 countdown tick (the film's sonic signature)

**File:** `SFX24_countdown_tick.mp3`: 0.29 s, mono, one low thump (20–120 Hz body, harmonics to 400 Hz), peak −3 dBFS. **STAND-IN built from a Mixkit heartbeat; nobody has listened to it: listen first and judge whether it reads as "a low heartbeat tick" before anything else.** Standard level = offset −13 dB (see section 1); "soft" = a further −4 dB. Never play it in a quiet-moment unless the script's cue says so.

**Countdown values (script section 10 and the cue tables), every one, with the segment and the sound:**

| # | Segment (start) | Trigger word | Ticker shows | Tick? |
|---|---|---|---|---|
| 1 | S01 (0:00) | "fourteenth of December" | 14 DEC 2025 · BONDI (day 0), first appearance | **Yes, one soft tick** (see conflict note below) |
| 2 | S02 (0:19) | "October twenty twenty-three" | rolls back to **−799 DAYS** (7 Oct 2023) | **Yes** + SFX06 fast flutter before it |
| 3 | S03 (0:38) | "seventy-eight years" | **−78 YEARS** (flash) | Yes |
| 4 | S04 (0:50) | "October" | **−420 DAYS** (20 Oct 2024) | Yes |
| 5 | S04 | "Seven weeks later" | **−373 DAYS** (6 Dec 2024) | Yes (+ SFX05) |
| 6 | S10 (2:25, after the 1.0 s silence) | "August" | **−110 DAYS** (26 Aug 2025) | Yes |
| 7 | S12 (3:05) | "one hundred and ten days" | −110 DAYS pulses | Yes |
| 8 | S13 (3:21) | "November" | **29 NOV 1947 · −78 YEARS** | Yes |
| 9 | S14 (3:43) | "Beersheba" | **−108 YEARS** (1917) | Yes (0.15 s before the thunk) |
| 10 | S17 (4:43) | "Canberra" | rolls forward to **−799 DAYS** | Yes + SFX06 fast |
| 11 | S20 (5:35) | "August" | **−125 DAYS** (11 Aug 2025) | Yes |
| 12 | S22 (6:22) | countdown appears | **−117 DAYS** (19 Aug 2025) | Yes (not in the cue table; in the asset list) |
| 13 | S24 (6:53) | "first of April" | −622 DAYS (1 Apr 2024) | **NO (quiet moment)** |
| 14 | S28 (8:07) | "in two" | rolls back to **−799 DAYS** | Yes |
| 15 | S29 (8:15) | chapter card | −799 DAYS shown | **NO** ("No motif; MUS09 only") |
| 16 | S31 (9:00) | "Opera House" | **−797 DAYS** (9 Oct 2023) | Yes |
| 17 | S33 (9:43) | "Harbour Bridge" | **−133 DAYS** (3 Aug 2025) | Yes (+ SFX05) |
| 18 | S34 (10:02) | montage, then "The fires" | races down from −799 toward −65; **−420** on "The fires" | Yes, accelerating (below) |
| 19 | S34 | "jet parts" | (no value given in the script) | Yes |
| 20 | S34 | "ambassador" | **−110** | Yes |
| 21 | S34 | "recognition" | **−84** (21 Sep 2025) | Yes |
| 22 | S34 | "court cases" / "visas" | (no values given in the script) | Yes, ×2 |
| 23 | S35 (10:22) | "Sixty-five days later" | **−65 DAYS** (10 Oct 2025) → **0** | **Yes, accelerating** (below), then silence |
| 24 | S36 (10:35) | candle | 14 DEC 2025 · BONDI | **NO** |
| 25 | S42 (12:13) | "Twenty-five days" | **+25 DAYS** (8 Jan 2026) | **Yes, once, softly** |
| 26 | S42 | "gun laws" | **+137 DAYS** (30 Apr 2026) | **NO tick** (SFX19 soft) |
| 27 | S42 | "one year to the day" | **+365 DAYS** (14 Dec 2026) | **NO tick** (SFX21) |

All the dates above were recomputed against 14 Dec 2025 and agree with the script's values. The CSV lists SFX24 in S01, S02, S03, S04, S10, S12, S13, S14, S17, S20, S22, S28, S31, S33, S34, S35 and S42: the same 17 segments as the table.

**S34 acceleration (the heartbeat building):**
- Montage (10:02, no VO, six cards of 1–1.5 s: ST16 flame, AI04 jet part, QT01 card, DOC02 circle, DOC07, ST09 doors): **one tick on each card change**, intervals shortening 1.5 → 1.35 → 1.15 → 0.95 → 0.75 s (ticks at 0, 1.5, 2.85, 4.0, 4.95, 5.7 s after the montage start; the sixth lands on ST09). Level starts at the standard and rises 1 dB per tick.
- Then the six word ticks (The fires, jet parts, ambassador, recognition, court cases, visas) land on their words about 1.5–2 s apart at standard +3 dB, **each on its card light**. The two groups should not collide: if a montage tick and a word tick are closer than 0.3 s, drop the montage tick.
- "before Bondi": SFX14 riser + SFX11 boom, no tick.

**S35 race (−65 → 0):** starts on the first syllable of "Sixty-five": **14 ticks, 3.38 s long, intervals shortening 0.55 → 0.09 s** (geometric): ticks at 0.00, 0.55, 1.02, 1.43, 1.78, 2.08, 2.34, 2.56, 2.75, 2.92, 3.06, 3.18, 3.29, 3.38 s after "Sixty-five". Level rises from standard −2 dB to standard +4 dB across the run. **Cut each tick short (30 ms fade-out at 110 ms) once the interval is below 0.2 s** so they do not smear into one rumble. The **last tick is the zero hit**: it lands on or just before "it", and the ticker reads 0. It must finish **before** the end of "wasn't". If the VO places "later," with a long pause, stretch the first intervals to fit; keep the final five intervals fixed (0.14 to 0.09 s). Then everything is cut: 2.0 s of silence.

**Script conflicts to settle (found while building this):**
1. M9 (script section 6) lists S24, S29 and S36 as countdown segments and says a tick plays "each time it changes", but the rules and cue tables say no tick in quiet moments (S24), "No motif" (S29) and no tick after the attack (S36). **I followed the cue tables** (no tick in S24, S29, S36).
2. S01 is a QUIET moment but its cue table asks for one tick on "fourteenth of December" and the CSV lists S01. **I followed the cue table (one soft tick).** The rule "No countdown tick sound during quiet moments" would suggest dropping it; one tick is the film's "first appearance" signature and the only sound under the opening voice, so it will be exposed: judge by ear.
3. S34 gives countdown values only for −420, −110 and −84; "jet parts", "court cases" and "visas" have no value in the script (the ticker is "racing down" between values). The editor chooses values between −799 and −65 for those three, in order.
4. The Music map (script section 6 "Sound") labels MUS04 Ch1, MUS02 Ch2, MUS07 Ch3, MUS06 Ch4, MUS09 Ch5, MUS10 Ch6, but `Music.csv` labels MUS02 "Ch 1", MUS04 "Ch 3", MUS06 "Ch 5", MUS07 "Ch 6", MUS09 "Ch 8" and MUS10 "Ch 9", which do not match this film's six chapters. **I followed the script's music map and cue tables**; the CSV's "Used in segments" columns match the cue tables.
5. S04 SFX03 siren: see section 4. The brief said no sirens.
6. S38–S41 are near-quiet: no SFX are scripted there; keep it that way.

## 6. Honest status of the audio
- Nothing in `audio/music/` or `audio/sfx/` has been auditioned. All cue positions are paper times from the script. Listen to, in order: SFX24, MUS09 (the loop point and the step), MUS10 (does piano appear?), MUS07, SFX11, SFX23, SFX08, SFX17, then the rest.
- Stand-ins: MUS07, MUS10 (music); SFX08, SFX11, SFX17, SFX20, SFX21, SFX23, SFX24 (effects). Not seated: SFX03.
- No VO exists in `audio/vo/`, so no ducking curve, LUFS-S measurement or timing has been checked against the real narration.
