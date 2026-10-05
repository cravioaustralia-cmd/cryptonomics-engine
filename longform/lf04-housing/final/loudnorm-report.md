# lf04 loudnorm report — Who Killed the Aussie Dream?

Master: `final/lf04-housing.mp4` (whole film at **1.28x**, pitch held with ffmpeg `rubberband`).
Loudness normalisation was applied to the **master only**, in two passes. The files in `audio/vo/` were not
retimed, pitch-shifted, loudnormed or overwritten.

## Measured on the delivered file (ffmpeg `ebur128=peak=true`, AAC decoded)

| Measure | Target | Measured | Result |
| --- | --- | --- | --- |
| Integrated loudness | about -14 LUFS | **-14.0 LUFS** | PASS |
| True peak | at or under -1.5 dBTP | **-1.7 dBTP** | PASS |
| Loudness range | — | 2.6 LU | — |

## Chain

1. 1x mix (`render/mix.py`): VO files at one fixed gain (+6 dB, identical for all 40), music beds ducked
   under the voice and lifted in the no-VO chapter holds, SFX only inside holds.
2. Whole mix at 1.28x, pitch held: `rubberband=tempo=1.28:pitch=1:pitchq=quality`.
3. Bus dynamics before normalisation: `acompressor=threshold=-30dB:ratio=2.5:attack=6:release=140:knee=8,volume=14.65dB,alimiter=limit=0.7586:attack=2:release=50:level=disabled`.
4. Loudnorm pass 1 (measure): input I -14.32 LUFS, TP -2.16 dBTP,
   LRA 2.70 LU, threshold -24.53 LUFS, offset 0.04.
5. Loudnorm pass 2 (apply): `I=-14.0:TP=-1.5`, measured values from pass 1, `linear=true`.
   Pass 2 reported normalisation type **linear**,
   output I -13.96 LUFS, TP -2.08 dBTP.
6. Encode: AAC 160 kb/s 48 kHz stereo.

Before the speed change and dynamics, the 1.28x mix measured -19.30 LUFS integrated and
0.63 dBTP true peak.

## File

| | |
| --- | --- |
| Duration | 759.33 s (12:39.33) |
| Size | 94.1 MB (kept under GitHub's 100 MB per-file limit; this repo does not use Git LFS) |
| Video | HEVC (Main) 1920x1080, 30/1 fps, tag `hvc1` |
| Audio | AAC 48000 Hz, 2 ch |

## Revision 4: music about 85% quieter under the voice (5 Oct 2026)

This is an audio-only change on the same cut. The video stream was stream-copied and is byte-identical
(stream MD5 `24a7cadee7bbd2735cfaed36779cf43f`). Picture, cards, VO files, SFX, music tracks, chapters,
mid-rolls and credits are unchanged.

- While he talks, the music sits about 27.5 dB below the steady hold level, so it is about 85% quieter
  (perceived; it plays at about 15% of its hold loudness).
- Holds and pauses are unchanged.
- The dip still follows the voice timing: on the master the music is halfway down 0.20 to 0.26 s before
  the first word and comes back just after the last word.

| Music bus, 1x mix (RMS) | Revision 3 | Revision 4 |
| --- | --- | --- |
| Under the voice, median | -37.9 dB | -47.9 dB |
| Holds and pauses (H1 to H10) | -21.3 to -19.9 dB | -21.3 to -19.9 dB |
| Dip while talking | about 17.5 dB (about 70% quieter) | about 27.6 dB (about 85% quieter) |

Hold loudness on the delivered master (ffmpeg ebur128):

| Hold | Revision 3 | Revision 4 |
| --- | --- | --- |
| H1 | -11.0 LUFS | -11.0 LUFS |
| H2 | -10.9 LUFS | -10.9 LUFS |
| H3 | -14.4 LUFS | -14.3 LUFS |
| H4 | -12.4 LUFS | -12.3 LUFS |
| H5 | -10.8 LUFS | -10.8 LUFS |
| H6 | -13.7 LUFS | -13.6 LUFS |
| M3 | -13.7 LUFS | -13.6 LUFS |
| H7 | -12.4 LUFS | -12.4 LUFS |
| H8 | -12.8 LUFS | -12.7 LUFS |
| H9 | -14.1 LUFS | -14.1 LUFS |
| H10 | -12.2 LUFS | -12.2 LUFS |

The master chain is unchanged: 1.28x pitch-held rubberband, the same bus dynamics and two-pass loudnorm with
a linear second pass. The measurements at the top of this report are for Revision 4.
