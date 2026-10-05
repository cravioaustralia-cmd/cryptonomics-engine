# lf04 loudnorm report — Who Killed the Aussie Dream?

Master: `final/lf04-housing.mp4` (whole film at **1.28x**, pitch held with ffmpeg `rubberband`).
Loudness normalisation was applied to the **master only**, in two passes. The files in `audio/vo/` were not
retimed, pitch-shifted, loudnormed or overwritten.

## Measured on the delivered file (ffmpeg `ebur128=peak=true`, AAC decoded)

| Measure | Target | Measured | Result |
| --- | --- | --- | --- |
| Integrated loudness | about -14 LUFS | **-14.0 LUFS** | PASS |
| True peak | at or under -1.5 dBTP | **-1.8 dBTP** | PASS |
| Loudness range | — | 2.3 LU | — |

## Chain

1. 1x mix (`render/mix.py`): VO files at one fixed gain (+6 dB, identical for all 40), music beds ducked
   under the voice and lifted in the no-VO chapter holds, SFX only inside holds.
2. Whole mix at 1.28x, pitch held: `rubberband=tempo=1.28:pitch=1:pitchq=quality`.
3. Bus dynamics before normalisation: `acompressor=threshold=-30dB:ratio=2.5:attack=6:release=140:knee=8,volume=14.32dB,alimiter=limit=0.7586:attack=2:release=50:level=disabled`.
4. Loudnorm pass 1 (measure): input I -14.33 LUFS, TP -2.15 dBTP,
   LRA 2.40 LU, threshold -24.38 LUFS, offset -0.02.
5. Loudnorm pass 2 (apply): `I=-14.0:TP=-1.5`, measured values from pass 1, `linear=true`.
   Pass 2 reported normalisation type **linear**,
   output I -13.97 LUFS, TP -2.07 dBTP.
6. Encode: AAC 160 kb/s 48 kHz stereo.

Before the speed change and dynamics, the 1.28x mix measured -19.39 LUFS integrated and
0.97 dBTP true peak.

## File

| | |
| --- | --- |
| Duration | 759.33 s (12:39.33) |
| Size | 94.0 MB (kept under GitHub's 100 MB per-file limit; this repo does not use Git LFS) |
| Video | HEVC (Main) 1920x1080, 30/1 fps, tag `hvc1` |
| Audio | AAC 48000 Hz, 2 ch |
