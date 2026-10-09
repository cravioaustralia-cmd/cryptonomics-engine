# lf06 Chapter 1 (S05–S13): music and SFX mix map

Clock: **ch** = chapter time (S05 = 0:00 = film 1:17). Segment starts are the script's estimates: S05 0:00 · S06 0:08 · S07 0:20 · S08 0:34 · S09 0:57 · S10 1:06 · S11 1:35 · S12 1:48 · S13 1:56 · end 2:10 (film 3:27). Move every cue to the real VO once S05–S13 voice files exist; cues sit on the first word of their trigger. **file** = position inside the seated file in `audio/music/` (leading silence is already trimmed, so file 0:00 is the first sound).

Levels (script): narration −14 LUFS-I; SFX about 12 dB under narration; music about 20 dB under narration, ducking under speech; music crossfades 2–4 s on emotion changes, not on cuts. Masters differ: MUS02 −14.3, MUS03 −13.6, MUS12 −18.3, **MUS06 −23.2 LUFS** (about 9 dB quieter, so set its fader about 9 dB above MUS02 to hold the same bed level and keep the S10 handover level). SFX07 is a quiet master (−24 LUFS).

## Music lane

| ch time | Segment / trigger | Action | File position | Notes |
|---|---|---|---|---|
| 0:00 | S05 chapter card | **MUS12_motif** starts | file 0:00 | 10.5 s: 2 bars at ~60 BPM plus a ringing downbeat. Built-in fade 8.0→10.4 s |
| 0:06 → 0:09 | S05, under motif tail | **MUS02_history_strings** fades in (3 s) | file 0:00 (MUS02 file = ch − 0:06) | Opening is very soft (≈ −32 dB) and builds by itself. Motif (A-minor feel) → bed (A minor) shares a key |
| ≈0:31–0:34 | S07 HOLD 1.5 s after "Australia" | **MUS02 swells slightly**: ride +3 dB for about 3 s, then back | file ≈0:25–0:28 | The track's own build only starts around file 0:45, so the swell must be automated |
| 0:34–1:06 | S08–S09 | MUS02 continues, ducked under Atlas | file 0:28–1:00 | Natural build from −26 to −20 dB here suits "warm, storytelling" in S08 |
| **1:06 → 1:09** | **S10 start (quiet moment)** | **Crossfade MUS02 → MUS06_sombre_piano, 3 s** (equal-power) | MUS02 out at file 1:00–1:03; MUS06 in at file 0:00 | Crossfade out of MUS02 **before** its file 1:08.6 lift (A-major swell), so no swell lands in the quiet moment. A minor → E minor is a smooth handover |
| 1:09–1:35 | S10 | MUS06 alone, soft. **Equal level under both halves** (no rides on "rescue" or "Nakba") | file 0:03–0:29 | Neutrality rule: identical music level for both memories. No SFX except SFX06 soft and the SFX21 pin |
| **1:35 → 1:38** | **S11 start** ("Both memories later sailed…") | **Crossfade MUS06 → MUS02 "warm", 3 s** | MUS06 out at file 0:29–0:32; **MUS02 re-enters at file 1:06.5** (MUS02 file = ch − 0:28.5) | The "warm variation" is MUS02's later section: an A-major lift at file 1:08.6, fuller at about −15 dB from about 1:10. It lands just as the crossfade completes |
| 1:38–≈2:04 | S11–S13 | MUS02 warm section continues | file 1:09.5–≈1:35.5 | Stays inside the steady full section (file 1:10–2:05) |
| **≈2:04** | **S13 "…wired into the war"** | **MUS02 out (2 s fade) · MUS03_minimal_pulse in (2–3 s fade)**, continuing into Ch 2 | MUS02 out at file ≈1:35.5–1:37.5; MUS03 in at file 0:00 | MUS03's pulse starts immediately (about 99 BPM 16ths, C/Am). Pair with the SFX10 rise below. 3:15 of file is available for Ch 2 |

**Loop / extension need: none at script timings.** MUS02 is used for about 63 s (file 0:00–1:03) plus about 31 s (file 1:06.5–1:37.5) from a 2:34 file, with no repeats. MUS06 needs about 32 s of 2:34. MUS12 needs about 10 s of 10.5 s.
If the real VO runs long:
- **MUS02 warm pass:** if more is needed after file 2:05, loop **file 2:00.05 → back to 1:22.34** (37.7 s loop). Use a 2 s equal-power crossfade cut on the onsets; chroma match is 0.98. Alternative: 1:38.17 → 1:10.73 (27.4 s).
- **MUS02 first pass:** do not loop. Start MUS02 earlier (it has 1:00 of quiet build before the lift).
- **MUS06:** 2:34 is available; no loop needed.

## SFX lane (by script cue)

| Seg | Trigger (first word) | Animation | File | Notes |
|---|---|---|---|---|
| S05 | chapter card | Card + projector | `SFX07_projector` | Start with the card; run under PH26 PAN + flicker and fade 1 s out at the S05 HOLD. Steady 1.5 s rattle cycle. **Seamless loop: 1.5 s → 22.5 s** (21 s = 14 cycles, 20 ms crossfade) if FT05/PH26 runs longer than 24 s |
| S05 | "November" | Split-flap → NOV 1947 | `SFX06_tick` | Stack 3–5 ticks about 60 ms apart for the flap flutter, or one tick |
| S05 | "New York" | Locator dot | `SFX05_whoosh` | Low, short |
| S06 | DROP PH01 | Photo lands | `SFX12_shutter` | |
| S06 | PAN PH01 | Push/parallax | `SFX05_whoosh` (very low) | Optional per the DROP/PAN table |
| S06 | "an Australian" | Kinetic AUSTRALIAN | `SFX06_tick` | |
| S06 | "Doc" | Label pops | `SFX_pop` | CALLOUT |
| S07 | ZOOM DOC01/DOC02 | Dive into the document | `SFX18_paper` | One per ZOOM |
| S07 | "divide the land" | Map splits | `SFX05_whoosh` | |
| S07 | "first country" | Roll-call scrolls fast | `SFX06_tick` ×N | Repeat every 50–80 ms for the scroll, stopping with the list. Vary the gain ±2 dB so it doesn't sound like a machine gun |
| S07 | "Australia" | Marker circle | `SFX20_marker` | 0.34 s stroke. Time-stretch to the circle draw (about 0.6–0.8 s) or play twice offset by 0.3 s |
| S08 | "Beersheba" | Flap → OCT 1917 + locator pin | `SFX06_tick` (flap) + `SFX21_thunk` | |
| S08 | "charged" | Arrow sweeps | `SFX16_hooves` | Fade in 0.3 s and out with the arrow (about 2–4 s used of 12.9 s). Gait period 0.517 s. If needed, loop 0.50 → 12.39 s (23 strides) with 30 ms crossfade |
| S08 | PH02 PAN / STACK | Photos land | `SFX05_whoosh` (PAN) / `SFX12_shutter` or `SFX06_tick` per photo (STACK "a click per photo") | |
| S08 | "road to Jerusalem" | Line extends | `SFX05_whoosh` | |
| S09 | SPLIT | Two images lock | `SFX05_whoosh` + `SFX06_tick` on lock | |
| S09 | "horseback" | Left brightens | none | Per script |
| S09 | "ballot" | Right brightens | `SFX19_stamp` | Stand-in, soft. Keep low (−15 dB under VO) |
| S10 | "rescue" / "Nakba" | Labels | none | Per script: no SFX; identical treatment both sides |
| S10 | "seven hundred thousand" | Number roll | `SFX06_tick` soft | A few ticks, very low (quiet moment) |
| S10 | "Remember that idea" | TWO MEMORIES pins | `SFX21_thunk` | |
| S11 | DROP PH05 / PH06 | Photos land | `SFX12_shutter` ×2 | |
| S11 | "sailed" | Flow line 1 | `SFX05_whoosh` | |
| S11 | "south-west" | Flow line 2 | `SFX05_whoosh` | Same gain as flow line 1 (balance) |
| S12 | "one hundred thousand" | Left number roll | `SFX06_tick` ×N | **Identical tick pattern and gain for both rolls** (balance rule) |
| S12 | "eight hundred thousand" | Right number roll | `SFX06_tick` ×N | Same as above |
| S13 | "start the clock" | Clock hand ticks once | `SFX06_tick` | Single |
| S13 | "never heard of" | Node 1 glows; card pins | `SFX21_thunk` + `SFX10_machining` start | SFX10 starts at about −30 dB under VO |
| S13 | "wired into the war" → end | Sound bridge | `SFX10_machining` **rising** | Ramp about 6–8 s to its SFX level by 2:10 and carry into Ch 2. Steady 48.7 s hum, so no loop is needed; any 0.5 s crossfade loops cleanly if required. Lands with the MUS02 → MUS03 swap above |
