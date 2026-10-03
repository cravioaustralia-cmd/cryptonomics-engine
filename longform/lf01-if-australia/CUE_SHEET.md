# Cue sheet — lf01 IF AUSTRALIA… Episode 1

Generated from the cue list that `render/mix.py` actually used, so this sheet and the mix match.
Times are the final cut (Whisper-locked). Sparse by design: grim beats run nearly dry; no Shorts whoosh/pop chatter.

## Music beds (free licence, see SOURCES.md)

| In | Out | Cue | Picture / script beat | Source, fades |
|---|---|---|---|---|
| 0:00.00 | 0:18.87 | Tense bed under the cold open; cuts out completely on "rejected" | V01-V02 | Silent Descent — Eugenio Mininni (Mixkit 614) from 0.0s; fade in 0.4s / out 0.03s |
| 0:29.70 | 1:21.73 | Music swells back in as the arrow re-extends; carries Act 1 opening | V03 gap 1.5 s -> V05 | Silent Descent — Eugenio Mininni (Mixkit 614) from 58.0s; fade in 1.5s / out 0.6s |
| 1:29.27 | 1:50.61 | Bed returns, tense and building | V07 | Silent Descent — Eugenio Mininni (Mixkit 614) from 75.0s; fade in 1.2s / out 1.0s |
| 1:57.91 | 3:01.14 | Bed under Curtin, Tokyo argument and the decision | V09-V11 | Silent Descent — Eugenio Mininni (Mixkit 614) from 88.0s; fade in 2.0s / out 0.2s |
| 3:03.19 | 3:35.43 | Storytelling, then tense | V12-V13 | Dark Drama — Eugenio Mininni (Mixkit 605) from 0.0s; fade in 1.0s / out 1.2s |
| 3:34.43 | 4:06.23 | Music shifts lighter and curious on "geography" | V13-V15 | Curiosity — Diego Nava (Mixkit 480) from 10.0s; fade in 1.4s / out 0.35s |
| 4:09.53 | 5:21.12 | Curious bed resumes for Act 2 | V16-V18 | Curiosity — Diego Nava (Mixkit 480) from 40.0s; fade in 1.0s / out 0.9s |
| 5:22.22 | 6:46.28 | Dramatic bed for the full invasion | V19-V22 | Dark Drama — Eugenio Mininni (Mixkit 605) from 40.0s; fade in 0.8s / out 1.0s |
| 7:01.72 | 7:20.65 | Serious, then sly | V24 | Dark Drama — Eugenio Mininni (Mixkit 605) from 130.0s; fade in 1.5s / out 0.2s |
| 7:22.80 | 8:02.38 | Tense bed: the plan to cut Australia off | V25-V26 | Fallen (Asper) — Eugenio Mininni (Mixkit 565) from 40.0s; fade in 0.8s / out 0.05s |
| 8:18.28 | 8:43.56 | Tense turn: midget submarines, shelling, Kokoda | V27-V28 | Fallen (Asper) — Eugenio Mininni (Mixkit 565) from 130.0s; fade in 2.0s / out 1.6s |
| 8:41.96 | 10:55.68 | Music lifts as the pins light and the lifeline redraws; resolves and holds through V30; warm under Act 5; outro under the end screen | V29-V34 + end screen | Vastness — Andrew Ev (Mixkit 184) from 0.0s; fade in 2.0s / out 3.5s |

Beds sit about 17 LU under the narration while Atlas speaks and rise to about 7.5 LU under it in the edit gaps (speech-activity envelope, attack 0.12 s / release 0.6 s). The voice itself is never processed.

## Sound effects (all synthesised in-house by `render/make_sfx.py`)

| At | Ends | Cue | Script beat | File (level vs VO peak) |
|---|---|---|---|---|
| 0:00.00 | 0:18.89 | Low drone from frame 1 | V01 frame 1 | drone.flac (-15 dB) |
| 0:07.39 | 0:15.39 | Deep boom on "invade Australia"; rings through the 1 s gap | V01 | boom.flac (+0 dB) |
| 0:19.02 | 0:20.92 | Stamp thud as REJECTED slams | V02 | stamp_thud.flac (-2 dB) |
| 0:57.94 | 1:05.24 | IF AUSTRALIA... series sting as the title builds | V04 gap 2.5 s | series_sting.flac (-2 dB) |
| 1:11.79 | 1:12.89 | Pin thunk (hong) | V05 | pin_thunk.flac (-10 dB) |
| 1:13.39 | 1:14.49 | Pin thunk (malaya) | V05 | pin_thunk.flac (-10 dB) |
| 1:17.59 | 1:18.69 | Pin thunk (singapore) | V05 | pin_thunk.flac (-10 dB) |
| 1:21.53 | 1:28.53 | Music drops to a single low note under the prisoner line and B02 | V06 / B02 | low_note.flac (-13 dB) |
| 1:48.71 | 1:59.71 | Air-raid siren fades in, peaks over B03, fades on the pull-back | V08 / B03 / gap 2.5 s | siren.flac (-12 dB) |
| 1:51.51 | 1:59.51 | Distant explosions, no screams | V08 / B03 | explosions_distant.flac (-8 dB) |
| 2:45.61 | 2:47.51 | Soft thud as "4 MARCH 1942" stamps onto Tokyo | V11 | stamp_thud.flac (-12 dB) |
| 3:01.04 | 3:07.54 | Cliffhanger sting; then 1.5 s hold (mid-roll 1) | V11 | cliff_sting.flac (-1 dB) |
| 3:01.94 | 3:03.84 | Whoosh into the big "1" | Act 2 open | whoosh.flac (-6 dB) |
| 3:02.61 | 3:08.71 | Drum hit as "1" slams onto the map | Act 2 open | drum_1.flac (-1 dB) |
| 4:06.08 | 4:10.78 | Single gust of desert wind (the comic beat) over B05 | V15 / B05 | desert_wind.flac (-6 dB) |
| 5:14.69 | 5:16.59 | Soft thud as STUCK stamps the verdict card | V18 | stamp_thud.flac (-10 dB) |
| 5:20.87 | 5:22.77 | Whoosh into the big "2" | Act 3 open | whoosh.flac (-5 dB) |
| 5:21.54 | 5:29.24 | Heavier drum hit as "2" slams on | Act 3 open | drum_2.flac (+0 dB) |
| 5:51.14 | 5:55.94 | Sonar ping 1 (B07 periscope) | V20 / B07 | sonar_ping.flac (-8 dB) |
| 5:54.39 | 5:59.19 | Sonar ping 2 (submarine icons strike) | V20 after B07 | sonar_ping.flac (-8 dB) |
| 6:45.98 | 7:02.02 | Strings only under V23 and B09 | V23 / B09 / gap 1.5 s | strings_pad.flac (-8 dB) |
| 7:20.55 | 7:27.05 | Cliffhanger sting; then 1.5 s hold (mid-roll 2) | V24 | cliff_sting.flac (-1 dB) |
| 7:21.45 | 7:23.35 | Whoosh into the big "3" | Act 4 open | whoosh.flac (-4 dB) |
| 7:22.12 | 7:31.42 | Heaviest hit of the three as "3" slams on | Act 4 open | drum_3.flac (+1 dB) |
| 8:01.86 | 8:05.66 | Snapping cable as the lifeline breaks | V26 | cable_snap.flac (-2 dB) |
| 8:02.46 | 8:14.46 | Near silence with a low wind tone (Australia alone) | V26 -> gap 2 s -> V27 | low_wind.flac (-17 dB) |
| 8:42.79 | 8:43.89 | Pin thunk (coral) as the four pins light up | V29 | pin_thunk.flac (-9 dB) |
| 8:43.95 | 8:45.05 | Pin thunk (midway) as the four pins light up | V29 | pin_thunk.flac (-9 dB) |
| 8:46.35 | 8:47.45 | Pin thunk (kokoda) as the four pins light up | V29 | pin_thunk.flac (-9 dB) |
| 8:47.99 | 8:49.09 | Pin thunk (millan) as the four pins light up | V29 | pin_thunk.flac (-9 dB) |

## Structure markers

| Marker | Time |
|---|---|
| Mid-roll 1 (hold on the map, no ad read) | 3:02.49 |
| Mid-roll 2 (hold on the map, no ad read) | 7:22.00 |
| Big "1" / "2" / "3" | 3:02.49 / 5:21.42 / 7:22.00 |
| End screen (10 s) | 10:45.68 – 10:55.68 |

## B-roll zoom-throughs

| Clip | In | Out | Length (Part 2) | Pin |
|---|---|---|---|---|
| B01 | 0:04.89 | 0:08.89 | 4 s | Tokyo pin, on 'admirals' |
| B02 | 1:22.83 | 1:26.83 | 4 s | Singapore pin, prisoners; ends, then pull back in the 2 s gap |
| B03 | 1:51.31 | 1:56.31 | 5 s | Darwin pin after the planes |
| B04 | 3:13.47 | 3:17.47 | 4 s | Darwin coast pin, on 'landings' |
| B05 | 4:05.33 | 4:09.33 | 4 s | railway gap, 'that's a road to nowhere' |
| B06 | 5:25.42 | 5:29.42 | 4 s | open ocean |
| B07 | 5:51.09 | 5:54.09 | 3 s | east-coast supply line, on 'submarines' |
| B08 | 6:08.83 | 6:12.83 | 4 s | Midway pin |
| B09 | 6:51.38 | 6:56.38 | 5 s | city pin (Sydney), blackout street |
| B10 | 8:24.06 | 8:28.06 | 4 s | Sydney Harbour pin |
| B11 | 8:32.58 | 8:37.58 | 5 s | New Guinea, Kokoda Track |
| B12 | 9:51.58 | 9:56.58 | 5 s | Act 5 harbour pin, warm |

## Master

- Voice as recorded, assembled: -22.0 LUFS integrated (no voice loudnorm, no compression).
- Master chain: `volume=8.34dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)`.
- Two-pass loudnorm on the master only, pass 2 normalisation type: **linear**.
- Result: **-14.02 LUFS integrated, -2.05 dBTP true peak**, LRA 5.20 LU (target −14 LUFS, ≤ −1.5 dBTP).

## Series sting ("IF AUSTRALIA…")

Invented for this series in episode 1 and reused unchanged in every episode (`audio/sfx/series_sting.flac`).
Regenerate the identical file with `python3 render/make_sfx.py series_sting` (seeded).
Construction: one low taiko-style hit (pitch drop ~100 → 42 Hz), a rising open-fifth brass-like swell on D
(D2–A2–D3–A3 sawtooth stack, low-pass opening 300 Hz → 2.9 kHz over 1.4 s), and a soft high shimmer
(D5–A5–D6 sines) that rings out through a 2.8 s synthetic hall. About 4.5 s with tail; it lands under the
title build in the 2.5 s gap after V04. It is not the Impossible Journeys sting.
