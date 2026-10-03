# Cue sheet — lf01 IF AUSTRALIA… Episode 1

Generated from the cue list that `render/mix.py` actually used, so this sheet and the mix match.
Times are the final cut (Whisper-locked). Sparse by design: grim beats run nearly dry; no Shorts whoosh/pop chatter.

## Music beds (free licence, see SOURCES.md)

| In | Out | Cue | Picture / script beat | Source, fades |
|---|---|---|---|---|
| 0:00.00 | 0:18.87 | Tense cold-open bed; cuts out completely on "rejected" | V01-V02 | Silent Descent — Eugenio Mininni (Mixkit 614) from 0.0s; fade in 0.4s / out 0.03s |
| 0:29.70 | 0:59.94 | Swells back in as the arrow re-extends; carries V04 and the title | V03 gap -> V04 gap | Silent Descent — Eugenio Mininni (Mixkit 614) from 58.0s; fade in 0.9s / out 0.8s |
| 1:00.24 | 1:21.73 | War: Japan sweeps across Asia (dark, heavy) | V05 | Dark Drama — Eugenio Mininni (Mixkit 605) from 20.0s; fade in 0.8s / out 0.8s |
| 1:21.53 | 1:29.07 | Loss: the prisoners (sad, low) | V06 / B02 / gap 2 s | Echoes — Andrew Ev (Mixkit 188) from 40.0s; fade in 1.0s / out 0.8s |
| 1:29.27 | 1:49.31 | Tense and building: Australia exposed | V07-V08 | Silent Descent — Eugenio Mininni (Mixkit 614) from 75.0s; fade in 1.0s / out 0.6s |
| 1:49.51 | 1:59.05 | War: the bombing of Darwin (heavy, insistent) | V08 / B03 / gap 2.5 s | Between Two Evils — Michael Ramir C. (Mixkit 1020) from 40.0s; fade in 0.6s / out 1.0s |
| 1:59.15 | 3:01.09 | Plans and argument: Curtin, Tokyo, the decision (mysterious) | V09-V11 | Fallen (Asper) — Eugenio Mininni (Mixkit 565) from 40.0s; fade in 1.2s / out 0.2s |
| 3:03.19 | 3:34.93 | War: landings in the north (dark, heavy) | V12-V13 | Dark Drama — Eugenio Mininni (Mixkit 605) from 100.0s; fade in 1.0s / out 0.8s |
| 3:35.23 | 4:05.43 | Geography takes over (lighter, curious); drops out for the deadpan beat | V13-V15 | Curiosity — Diego Nava (Mixkit 480) from 10.0s; fade in 1.4s / out 0.45s |
| 4:09.53 | 5:21.12 | Curious bed resumes for the rest of scenario one | V16-V18 | Curiosity — Diego Nava (Mixkit 480) from 40.0s; fade in 1.0s / out 0.9s |
| 5:22.22 | 6:45.98 | War: the full invasion (darkest, heaviest section) | V19-V22 | Dark Drama — Eugenio Mininni (Mixkit 605) from 200.0s; fade in 0.8s / out 1.0s |
| 7:01.72 | 7:20.60 | Serious, then sly | V24 | Fallen (Asper) — Eugenio Mininni (Mixkit 565) from 130.0s; fade in 1.5s / out 0.2s |
| 7:22.80 | 8:02.87 | War threat: the plan to cut Australia off (heavy, insistent); cuts on the snap | V25-V26 | Between Two Evils — Michael Ramir C. (Mixkit 1020) from 80.0s; fade in 0.8s / out 0.05s |
| 8:08.78 | 8:23.00 | Loss: Australia cut off and alone (sad, low) | V27 | Echoes — Andrew Ev (Mixkit 188) from 100.0s; fade in 1.5s / out 0.8s |
| 8:23.20 | 8:39.92 | War: midget submarines, shelling, Kokoda (dark, heavy) | V27-V28 | Dark Drama — Eugenio Mininni (Mixkit 605) from 120.0s; fade in 0.6s / out 0.9s |
| 8:39.62 | 9:22.20 | Relief: the music lifts as the pins light and the lifeline redraws; resolves and holds | V29-V30 + gap 2 s | Vastness — Andrew Ev (Mixkit 184) from 0.0s; fade in 1.5s / out 1.2s |
| 9:22.10 | 10:55.68 | Warm and hopeful: ANZUS, migration, the end screen outro | V31-V34 + end screen | The Journey — Ahjay Stelino (Mixkit 79) from 0.0s; fade in 1.5s / out 3.0s |

One cue per emotional section, with a short stop at section changes: darker, heavier beds (Dark Drama, Between Two Evils) for war and invasion; a sad, low bed (Echoes) and the scripted strings for loss; Fallen (Asper) for plans and argument; Curiosity for geography; Vastness for relief; The Journey for the warm Act 5.

While Atlas speaks the bed sits about 23 LU under the narration, with a 1.5–4 kHz presence dip of about 7 dB. In pauses, the cold open and atmosphere beats it rises to about 11 LU under the narration: heard, never full. Speech detection runs 150 ms ahead, so beds are already down before a word starts.
Word safety (speech band 200 Hz–5 kHz, every 20 ms frame where the voice sounds, 15898 frames): the voice is above music + SFX + ambience by **at least 12.0 dB**, median 26.9 dB. A sidechain on the beds (never on the voice) enforces the 12 dB floor.

## Sound effects (synthesised in-house by `render/make_sfx.py`)

Effects sit in the pauses; anything that overlaps narration is ducked about 16 dB and kept under the 12 dB floor above.

| At | Ends | Cue | Script beat | File (level vs VO peak) |
|---|---|---|---|---|
| 0:00.00 | 0:18.89 | Low drone from frame 1 | V01 frame 1 | drone.flac (-16 dB) |
| 0:03.82 | 0:04.37 | Label click: TOKYO | V01 | click.flac (-17 dB) |
| 0:08.64 | 0:16.64 | Deep boom right after "invade Australia"; rings through the 1 s gap | V01 / gap 1 s | boom.flac (+0 dB) |
| 0:11.30 | 0:12.90 | Red arrow draws Tokyo to northern Australia | V02 | pen_draw.flac (-24 dB) |
| 0:21.21 | 0:22.81 | Arrow re-extends | V03 | pen_draw.flac (-24 dB) |
| 0:39.96 | 0:41.16 | Arrow splits into dotted 1, 2, 3 | V04 | pen_draw.flac (-24 dB) |
| 0:57.94 | 1:05.24 | IF AUSTRALIA... series sting as the title builds | V04 gap 2.5 s | series_sting.flac (-3 dB) |
| 1:02.64 | 1:03.01 | Date tick: DECEMBER 1941 | V05 | tick.flac (-18 dB) |
| 1:02.76 | 1:03.13 | Date tick: DECEMBER 1941 | V05 | tick.flac (-18 dB) |
| 1:06.36 | 1:06.91 | Label click: PEARL HARBOR | V05 | click.flac (-17 dB) |
| 1:11.79 | 1:12.89 | Pin thunk (hong), soft under the voice | V05 | pin_thunk.flac (-14 dB) |
| 1:13.39 | 1:14.49 | Pin thunk (malaya), soft under the voice | V05 | pin_thunk.flac (-14 dB) |
| 1:15.34 | 1:15.71 | Date tick: FEBRUARY 1942 | V05 | tick.flac (-18 dB) |
| 1:15.46 | 1:15.83 | Date tick: FEBRUARY 1942 | V05 | tick.flac (-18 dB) |
| 1:17.59 | 1:18.69 | Pin thunk (singapore), soft under the voice | V05 | pin_thunk.flac (-14 dB) |
| 1:21.53 | 1:28.53 | Single low note under the prisoner line and B02 | V06 / B02 | low_note.flac (-16 dB) |
| 1:35.91 | 1:36.46 | Label click: AUSTRALIA | V07 | click.flac (-17 dB) |
| 1:37.19 | 1:37.56 | Counter: Population ~7 million | V07 | tick.flac (-18 dB) |
| 1:37.34 | 1:37.71 | Counter: Population ~7 million | V07 | tick.flac (-18 dB) |
| 1:39.25 | 1:39.62 | Counter: Coastline 30,000+ km | V07 | tick.flac (-18 dB) |
| 1:39.40 | 1:39.77 | Counter: Coastline 30,000+ km | V07 | tick.flac (-18 dB) |
| 1:45.31 | 1:45.86 | Label click: MIDDLE EAST | V07 | click.flac (-17 dB) |
| 1:48.71 | 1:59.71 | Air-raid siren: rises in the pause before "It's the first time", ducks under the words, fades on the pull-back | V08 / B03 / gap 2.5 s | siren.flac (-12 dB) |
| 1:50.49 | 1:51.04 | Label click: DARWIN | V08 | click.flac (-17 dB) |
| 1:51.51 | 1:59.51 | Distant explosions, no screams | V08 / B03 | explosions_distant.flac (-9 dB) |
| 2:07.87 | 2:09.47 | Blue line to the United States | V09 | pen_draw.flac (-24 dB) |
| 2:09.37 | 2:09.92 | Label click: UNITED STATES | V09 | click.flac (-17 dB) |
| 2:30.20 | 2:30.57 | Counter: Divisions needed 10–12 | V10 | tick.flac (-18 dB) |
| 2:30.35 | 2:30.72 | Counter: Divisions needed 10–12 | V10 | tick.flac (-18 dB) |
| 2:35.46 | 2:35.83 | Counter: Shipping needed | V10 | tick.flac (-18 dB) |
| 2:35.61 | 2:35.98 | Counter: Shipping needed | V10 | tick.flac (-18 dB) |
| 2:41.38 | 2:41.93 | Label click: Tied down in China | V10 | click.flac (-17 dB) |
| 2:45.89 | 2:47.79 | Soft thud as "4 MARCH 1942" stamps onto Tokyo | V11 | stamp_thud.flac (-12 dB) |
| 3:01.04 | 3:03.24 | Cliffhanger sting (short); then 1.5 s hold (mid-roll 1) | V11 | cliff_sting.flac (-7 dB) |
| 3:01.94 | 3:03.84 | Whoosh into the big "1" | Act 2 open | whoosh.flac (-7 dB) |
| 3:02.61 | 3:08.71 | Drum hit as "1" slams onto the map | Act 2 open | drum_1.flac (-2 dB) |
| 3:06.59 | 3:07.14 | Label click: DARWIN | V12 | click.flac (-17 dB) |
| 3:48.09 | 3:49.69 | Railway draws to Birdum | V14 | pen_draw.flac (-24 dB) |
| 3:51.13 | 3:51.68 | Label click: BIRDUM | V14 | click.flac (-17 dB) |
| 3:52.51 | 3:54.11 | Railway draws up to Alice Springs | V14 | pen_draw.flac (-24 dB) |
| 3:54.21 | 3:54.76 | Label click: ALICE SPRINGS | V14 | click.flac (-17 dB) |
| 3:57.77 | 3:58.14 | Counter: ~1,000 km of NO railway | V14 | tick.flac (-18 dB) |
| 3:57.92 | 3:58.29 | Counter: ~1,000 km of NO railway | V14 | tick.flac (-18 dB) |
| 4:07.58 | 4:12.28 | Single gust of desert wind after "road to nowhere" (the comic beat) | V15 / B05 / gap | desert_wind.flac (-8 dB) |
| 4:11.66 | 4:13.26 | Road draws through the gap | V16 | pen_draw.flac (-24 dB) |
| 4:15.72 | 4:16.27 | Label click: Stuart Highway | V16 | click.flac (-17 dB) |
| 4:35.38 | 4:36.98 | Supply line draws back to Japan | V16 | pen_draw.flac (-24 dB) |
| 4:57.80 | 4:58.35 | Label click: MELVILLE ISLAND | V17 | click.flac (-17 dB) |
| 4:59.48 | 5:00.03 | Label click: Ulungura label | V17 | click.flac (-17 dB) |
| 5:20.87 | 5:22.77 | Whoosh into the big "2" | Act 3 open | whoosh.flac (-6 dB) |
| 5:21.54 | 5:29.24 | Heavier drum hit as "2" slams on | Act 3 open | drum_2.flac (-1 dB) |
| 5:34.90 | 5:35.45 | Label click: BRISBANE | V20 | click.flac (-17 dB) |
| 5:35.56 | 5:36.11 | Label click: SYDNEY | V20 | click.flac (-17 dB) |
| 5:36.08 | 5:36.63 | Label click: MELBOURNE | V20 | click.flac (-17 dB) |
| 5:38.85 | 5:39.22 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-18 dB) |
| 5:39.18 | 5:39.55 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-20 dB) |
| 5:39.48 | 5:39.85 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-20 dB) |
| 5:39.74 | 5:40.11 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-20 dB) |
| 5:39.97 | 5:40.34 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-20 dB) |
| 5:40.15 | 5:40.52 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-20 dB) |
| 5:40.29 | 5:40.66 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-20 dB) |
| 5:40.35 | 5:40.72 | Counter climbs: shipping to 2,000,000 tons | V20 | tick.flac (-18 dB) |
| 5:42.53 | 5:43.73 | Supply route draws | V20 | pen_draw.flac (-24 dB) |
| 5:52.34 | 5:57.14 | Sonar ping 1 (periscope), in the pause after "aircraft" | V20 / B07 | sonar_ping.flac (-9 dB) |
| 5:53.31 | 5:58.11 | Sonar ping 2 (submarine icons strike), in the 1 s gap | V20 gap | sonar_ping.flac (-11 dB) |
| 5:58.85 | 5:59.40 | Label click: Coral Sea | V21 | click.flac (-17 dB) |
| 6:05.21 | 6:05.76 | Label click: PORT MORESBY | V21 | click.flac (-17 dB) |
| 6:08.13 | 6:08.68 | Label click: MIDWAY | V21 | click.flac (-17 dB) |
| 6:22.90 | 6:23.45 | Label click: Early wins? | V22 | click.flac (-17 dB) |
| 6:29.40 | 6:29.95 | Label click: Faster collapse? | V22 | click.flac (-17 dB) |
| 6:38.74 | 6:39.29 | Label click: MIDDLE EAST | V22 | click.flac (-17 dB) |
| 6:38.74 | 6:40.34 | Troop arrow from the Middle East | V22 | pen_draw.flac (-24 dB) |
| 6:43.30 | 6:44.80 | Arrow from the United States | V22 | pen_draw.flac (-24 dB) |
| 6:45.98 | 7:02.02 | Loss: strings only under V23 and B09 | V23 / B09 / gap 1.5 s | strings_pad.flac (-8 dB) |
| 7:20.55 | 7:22.75 | Cliffhanger sting (short); then 1.5 s hold (mid-roll 2) | V24 | cliff_sting.flac (-7 dB) |
| 7:21.45 | 7:23.35 | Whoosh into the big "3" | Act 4 open | whoosh.flac (-5 dB) |
| 7:22.12 | 7:31.42 | Heaviest hit of the three as "3" slams on | Act 4 open | drum_3.flac (+0 dB) |
| 7:34.38 | 7:35.98 | Lifeline draws across the Pacific | V25 | pen_draw.flac (-24 dB) |
| 7:38.94 | 7:39.49 | Label click: FIJI | V25 | click.flac (-17 dB) |
| 7:40.04 | 7:40.59 | Label click: SAMOA | V25 | click.flac (-17 dB) |
| 7:40.90 | 7:41.45 | Label click: NEW CALEDONIA | V25 | click.flac (-17 dB) |
| 7:46.70 | 7:47.25 | Label click: PORT MORESBY | V25 | click.flac (-17 dB) |
| 7:53.78 | 7:54.33 | Label click: QUEENSLAND | V25 | click.flac (-17 dB) |
| 8:02.35 | 8:06.15 | Snapping cable in the pause after "fewer supplies" | V26 | cable_snap.flac (-3 dB) |
| 8:02.95 | 8:10.18 | Near silence with a low wind tone (Australia alone) | V26 -> gap 2 s | low_wind.flac (-17 dB) |
| 8:23.80 | 8:24.35 | Label click: SYDNEY HARBOUR | V27 | click.flac (-17 dB) |
| 8:28.74 | 8:29.29 | Label click: SYDNEY | V28 | click.flac (-17 dB) |
| 8:29.09 | 8:29.64 | Label click: NEWCASTLE | V28 | click.flac (-17 dB) |
| 8:29.42 | 8:37.42 | Distant shell bursts, soft under the voice | V28 | explosions_distant.flac (-15 dB) |
| 8:37.78 | 8:38.33 | Label click: PORT MORESBY | V28 | click.flac (-17 dB) |
| 8:37.83 | 8:38.20 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-18 dB) |
| 8:37.83 | 8:39.33 | Red line crawls toward Port Moresby | V28 | pen_draw.flac (-24 dB) |
| 8:37.88 | 8:38.43 | Label click: KOKODA | V28 | click.flac (-17 dB) |
| 8:38.21 | 8:38.58 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-20 dB) |
| 8:38.54 | 8:38.91 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-20 dB) |
| 8:38.83 | 8:39.20 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-20 dB) |
| 8:39.07 | 8:39.44 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-20 dB) |
| 8:39.24 | 8:39.61 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-20 dB) |
| 8:39.33 | 8:39.70 | Counter falls: distance to Port Moresby, stops at ~40 km | V28 | tick.flac (-18 dB) |
| 8:42.79 | 8:43.89 | Pin thunk (coral), soft under the voice | V29 | pin_thunk.flac (-14 dB) |
| 8:43.95 | 8:45.05 | Pin thunk (midway), soft under the voice | V29 | pin_thunk.flac (-14 dB) |
| 8:46.35 | 8:47.45 | Pin thunk (kokoda), soft under the voice | V29 | pin_thunk.flac (-14 dB) |
| 8:47.99 | 8:49.09 | Pin thunk (millan), soft under the voice | V29 | pin_thunk.flac (-14 dB) |
| 9:02.86 | 9:04.16 | Lifeline redraws solid | V29 | pen_draw.flac (-24 dB) |
| 9:24.74 | 9:25.11 | Year ticks to 1942 | V31 | tick.flac (-15 dB) |
| 9:28.42 | 9:28.79 | Year ticks to 1945 | V31 | tick.flac (-15 dB) |
| 9:34.88 | 9:35.25 | Year ticks to 1951 | V31 | tick.flac (-15 dB) |
| 9:39.28 | 9:40.38 | ANZUS triangle draws | V31 | pen_draw.flac (-24 dB) |
| 9:39.58 | 9:40.13 | Label click: AUSTRALIA / NEW ZEALAND / USA | V31 | click.flac (-17 dB) |
| 9:40.18 | 9:40.73 | Label click: ANZUS 1951 | V31 | click.flac (-17 dB) |
| 10:01.57 | 10:01.94 | Counter climbs: population | V33 | tick.flac (-18 dB) |
| 10:02.29 | 10:02.66 | Counter climbs: population | V33 | tick.flac (-20 dB) |
| 10:02.91 | 10:03.28 | Counter climbs: population | V33 | tick.flac (-20 dB) |
| 10:03.41 | 10:03.78 | Counter climbs: population | V33 | tick.flac (-20 dB) |
| 10:03.79 | 10:04.16 | Counter climbs: population | V33 | tick.flac (-20 dB) |
| 10:03.97 | 10:04.34 | Counter climbs: population | V33 | tick.flac (-18 dB) |
| 10:05.39 | 10:06.79 | Migration arrows from Britain and Europe | V33 | pen_draw.flac (-24 dB) |
| 10:07.23 | 10:08.63 | Migration arrows from everywhere | V33 | pen_draw.flac (-24 dB) |
| 10:25.84 | 10:26.39 | Label click: 1942 / TODAY split | V34 | click.flac (-17 dB) |

## Picture-sync accents on hard words

A pause before a hard word gets a short rise (0.85 s, stops dead) and a tight low hit right on the word, instead of a long sting. Hits sit mostly below the speech band and stay under the 12 dB voice floor. Labels landing get a soft click, number changes get typewriter ticks (a short run for climbing or falling counters), and lines drawing on the map get a quiet pencil scratch; these are listed in the effects table above.

| At | Ends | Cue | Script beat | File (level vs VO peak) |
|---|---|---|---|---|
| 0:17.99 | 0:18.84 | Short rise into "rejected" (REJECTED stamp) | V02 | riser_short.flac (-9 dB) |
| 0:18.83 | 0:20.03 | Hit right on "rejected" (REJECTED stamp) | V02 | word_hit.flac (+1 dB) |
| 2:49.94 | 2:50.79 | Short rise into "No invasion" (the arrow vanishes) | V11 | riser_short.flac (-9 dB) |
| 2:50.78 | 2:51.98 | Hit right on "No invasion" (the arrow vanishes) | V11 | word_hit.flac (+1 dB) |
| 5:13.72 | 5:14.57 | Short rise into "stuck" (STUCK stamp) | V18 | riser_short.flac (-9 dB) |
| 5:14.56 | 5:15.76 | Hit right on "stuck" (STUCK stamp) | V18 | word_hit.flac (+1 dB) |
| 7:31.27 | 7:32.12 | Short rise into "Cut it off" | V25 | riser_short.flac (-9 dB) |
| 7:32.11 | 7:33.31 | Hit right on "Cut it off" | V25 | word_hit.flac (+1 dB) |
| 9:53.01 | 9:53.86 | Short rise into "populate, or perish" | V32 | riser_short.flac (-9 dB) |
| 9:53.85 | 9:55.05 | Hit right on "populate, or perish" | V32 | word_hit.flac (+1 dB) |

## Shot environment (B-roll)

Every B-roll clip is muted: the clips' own generated audio is never mapped into the film (`compose.py` takes audio only from the master). Environment comes from in-house synthesised beds and one Mixkit file already in this repo. Ducked about 12 dB under narration. B01 (the drone carries it) and B09 (script: strings only) get none.

| At | Ends | Environment | Shot | File (level vs VO peak) |
|---|---|---|---|---|
| 1:22.58 | 1:27.48 | Tropical rain under the marching column | B02 (Singapore pin, prisoners; ends, then pull back in the 2 s gap) | rain.flac (-15 dB) |
| 1:51.06 | 1:56.96 | Distant fire over the harbour | B03 (Darwin pin after the planes) | fire_crackle.flac (-20 dB) |
| 3:13.22 | 3:18.12 | Surf on the mangrove shore | B04 (Darwin coast pin, on 'landings') | sea.flac (-15 dB) |
| 3:13.22 | 3:18.12 | Low landing-craft engine | B04 (Darwin coast pin, on 'landings') | engine_low.flac (-19 dB) |
| 5:25.17 | 5:30.07 | Open sea under the fleet | B06 (open ocean) | sea.flac (-15 dB) |
| 5:25.17 | 5:30.07 | Distant war rumble | B06 (open ocean) | war_ambience.flac (-16 dB) |
| 5:50.84 | 5:54.74 | Choppy sea through the periscope | B07 (east-coast supply line, on 'submarines') | sea.flac (-17 dB) |
| 6:08.58 | 6:13.48 | Distant war rumble around the burning carrier | B08 (Midway pin) | war_ambience.flac (-15 dB) |
| 6:08.58 | 6:13.48 | Calm sea at Midway | B08 (Midway pin) | sea.flac (-19 dB) |
| 8:23.81 | 8:28.71 | Underwater rumble in Sydney Harbour | B10 (Sydney Harbour pin) | underwater.flac (-15 dB) |
| 8:32.33 | 8:38.23 | Heavy rain on the mountain track | B11 (New Guinea, Kokoda Track) | rain.flac (-15 dB) |
| 8:32.33 | 8:38.23 | Distant war rumble | B11 (New Guinea, Kokoda Track) | war_ambience.flac (-20 dB) |
| 8:32.33 | 8:38.23 | Jungle birds (repo file) | B11 (New Guinea, Kokoda Track) | birds_jungle_ambience.mp3 (-24 dB) |
| 9:51.33 | 9:57.23 | Harbour water under the arriving ship | B12 (Act 5 harbour pin, warm) | sea.flac (-17 dB) |

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
- Master chain: `volume=8.15dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)`.
- Two-pass loudnorm on the master only, pass 2 normalisation type: **linear**.
- Result: **-14.00 LUFS integrated, -2.17 dBTP true peak**, LRA 6.00 LU (target −14 LUFS, ≤ −1.5 dBTP).

## Series sting ("IF AUSTRALIA…")

Invented for this series in episode 1 and reused unchanged in every episode (`audio/sfx/series_sting.flac`).
Regenerate the identical file with `python3 render/make_sfx.py series_sting` (seeded).
Construction: one low taiko-style hit (pitch drop ~100 → 42 Hz), a rising open-fifth brass-like swell on D
(D2–A2–D3–A3 sawtooth stack, low-pass opening 300 Hz → 2.9 kHz over 1.4 s), and a soft high shimmer
(D5–A5–D6 sines) that rings out through a 2.8 s synthetic hall. About 4.5 s with tail; it lands under the
title build in the 2.5 s gap after V04. It is not the Impossible Journeys sting.
