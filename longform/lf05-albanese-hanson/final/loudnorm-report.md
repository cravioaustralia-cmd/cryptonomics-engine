# lf05 loudnorm report — 94 Seats vs 30%: Can Albanese Stop Pauline Hanson?

Master: `final/lf05-albanese-hanson.mp4` (whole film at **1.28x**, pitch held with ffmpeg `rubberband`).
Loudness normalisation was applied to the **master only**, in two passes. The files in `audio/vo/` were not
retimed, pitch-shifted, loudnormed or overwritten.

## Measured on the delivered file (ffmpeg `ebur128=peak=true`, AAC decoded)

| Measure | Target | Measured | Result |
| --- | --- | --- | --- |
| Integrated loudness | about -14 LUFS | **-14.0 LUFS** | PASS |
| True peak | at or under -1.5 dBTP | **-1.8 dBTP** | PASS |
| Loudness range | — | 2.5 LU | — |

## Chain

1. 1x mix (`render/mix.py`): VO files at one fixed gain (+6 dB, identical for all 41), music beds ducked
   under the voice and lifted in the no-VO chapter holds, SFX only inside holds.
2. Whole mix at 1.28x, pitch held: `rubberband=tempo=1.28:pitch=1:pitchq=quality`.
3. Bus dynamics before normalisation: `acompressor=threshold=-30dB:ratio=2.5:attack=6:release=140:knee=8,volume=14.55dB,alimiter=limit=0.7586:attack=2:release=50:level=disabled`.
4. Loudnorm pass 1 (measure): input I -14.33 LUFS, TP -2.24 dBTP,
   LRA 2.50 LU, threshold -24.61 LUFS, offset -0.00.
5. Loudnorm pass 2 (apply): `I=-14.0:TP=-1.5`, measured values from pass 1, `linear=true`.
   Pass 2 reported normalisation type **linear**,
   output I -13.96 LUFS, TP -2.07 dBTP.
6. Encode: AAC 160 kb/s 48 kHz stereo.

Before the speed change and dynamics, the 1.28x mix measured -19.31 LUFS integrated and
-0.49 dBTP true peak.

## File

| | |
| --- | --- |
| Duration | 867.68 s (14:27.68) |
| Size | 95.4 MB (kept under GitHub's 100 MB per-file limit; this repo does not use Git LFS) |
| Video | HEVC (Main) 1920x1080, 30/1 fps, tag `hvc1` |
| Audio | AAC 48000 Hz, 2 ch |

## Music under the voice (lf04 lesson applied)

The music bus is levelled to two steady targets in `render/mix.py`: a quiet bed while the voice talks and a
louder (not full) bed in chapter holds and music-only breaths. Measured on the 1x music stem (RMS, 1 s windows):

| Music bus, 1x mix (RMS) | Measured |
| --- | --- |
| Under the voice, median | -47.9 dB |
| Chapter holds H1 to H9, median | -20.4 dB (range -22.9 to -19.8) |
| Dip while the voice talks | **27.5 dB** (about 85% quieter, perceived) |

The target was about 27.5 dB below the hold level, so the music is about 85% quieter under the voice.
The dip follows the voice timing: it starts about 0.3 s before the first word of a segment and lifts after
the last word. Gaps under 1.2 s between segments stay ducked.

Hold loudness on the delivered master (ffmpeg ebur128, music and picture only, no voice):

| Hold | Chapter | Integrated |
| --- | --- | --- |
| H1 | PART ONE · HOW STRONG IS ANTHONY ALBANESE? | -10.8 LUFS |
| H2 | PART TWO · THE RISE OF PAULINE HANSON | -13.0 LUFS |
| H3 | PART THREE · WHAT HAS ACTUALLY CHANGED? | -11.7 LUFS |
| H4 | The Coalition | -14.8 LUFS |
| H5 | PART FOUR · ALBANESE'S MOVES | -11.5 LUFS |
| H6 | PART FIVE · HANSON'S MOVES | -13.5 LUFS |
| H7 | POLLS, SEATS AND GOVERNMENT | -12.2 LUFS |
| H8 | THE BIG COMPARISON | -11.5 LUFS |
| H9 | ENDING · CAN ALBANESE STOP PAULINE HANSON? | -12.4 LUFS |
