# lf04 loudnorm report — Who Killed the Aussie Dream?

Master: `final/lf04-housing.mp4` (whole film at **1.28x**, pitch held with ffmpeg `rubberband`).
Loudness normalisation was applied to the **master only**, in two passes. The files in `audio/vo/` were not
retimed, pitch-shifted, loudnormed or overwritten.

## Measured on the delivered file (ffmpeg `ebur128=peak=true`, AAC decoded)

| Measure | Target | Measured | Result |
| --- | --- | --- | --- |
| Integrated loudness | about -14 LUFS | **-14.0 LUFS** | PASS |
| True peak | at or under -1.5 dBTP | **-1.7 dBTP** | PASS |
| Loudness range | — | 2.5 LU | — |

## Chain

1. 1x mix (`render/mix.py`): VO files at one fixed gain (+6 dB, identical for all 40), music beds ducked
   under the voice and lifted in the no-VO chapter holds, SFX only inside holds.
2. Whole mix at 1.28x, pitch held: `rubberband=tempo=1.28:pitch=1:pitchq=quality`.
3. Bus dynamics before normalisation: `acompressor=threshold=-30dB:ratio=2.5:attack=6:release=140:knee=8,volume=14.61dB,alimiter=limit=0.7586:attack=2:release=50:level=disabled`.
4. Loudnorm pass 1 (measure): input I -14.31 LUFS, TP -2.06 dBTP,
   LRA 2.50 LU, threshold -24.38 LUFS, offset 0.03.
5. Loudnorm pass 2 (apply): `I=-14.0:TP=-1.5`, measured values from pass 1, `linear=true`.
   Pass 2 reported normalisation type **linear**,
   output I -13.96 LUFS, TP -2.09 dBTP.
6. Encode: AAC 160 kb/s 48 kHz stereo.

Before the speed change and dynamics, the 1.28x mix measured -19.34 LUFS integrated and
0.91 dBTP true peak.

## File

| | |
| --- | --- |
| Duration | 759.33 s (12:39.33) |
| Size | 94.1 MB (kept under GitHub's 100 MB per-file limit; this repo does not use Git LFS) |
| Video | HEVC (Main) 1920x1080, 30/1 fps, tag `hvc1` |
| Audio | AAC 48000 Hz, 2 ch |

## Revision 3: music dip under the voice set to about 70% quieter (5 Oct 2026)

This is an audio-only change on the same cut. Picture, cards, VO files, SFX timing, music tracks, chapters,
mid-rolls and credits are unchanged. The HEVC video stream was stream-copied, so its bitstream is
byte-identical to every earlier delivery (stream MD5 `24a7cadee7bbd2735cfaed36779cf43f`).

Changes in `render/mix.py`:

- The music under the voice now sits about 17.5 dB below the hold level, so it is about 70% quieter
  (perceived) while he talks.
- Holds and pauses stay at one steady level, unchanged from Revision 2.
- Sync: the dip now follows the voice timing without extra smoothing. The music is halfway down about
  0.2 to 0.27 s before the first word on the master and comes back up just after the last word.

| Music bus, 1x mix (RMS) | First delivery | Revision 2 | Revision 3 |
| --- | --- | --- | --- |
| Under the voice, median | -30.7 dB | -33.6 dB | -37.9 dB |
| Holds and pauses (H1 to H10) | -31.6 to -19.9 dB | -21.6 to -20.1 dB | -21.3 to -19.9 dB |
| Dip while talking | uneven | about 13 dB (about 60% quieter) | about 17.5 dB (about 70% quieter) |

Hold loudness on the delivered master (ffmpeg ebur128, music and hold SFX together):

| Hold | Revision 2 | Revision 3 |
| --- | --- | --- |
| H1 | -11.2 LUFS | -11.0 LUFS |
| H2 | -11.1 LUFS | -10.9 LUFS |
| H3 | -14.6 LUFS | -14.4 LUFS |
| H4 | -12.6 LUFS | -12.4 LUFS |
| H5 | -11.0 LUFS | -10.8 LUFS |
| H6 | -13.9 LUFS | -13.7 LUFS |
| M3 | -14.2 LUFS | -13.7 LUFS |
| H7 | -12.6 LUFS | -12.4 LUFS |
| H8 | -13.1 LUFS | -12.8 LUFS |
| H9 | -14.4 LUFS | -14.1 LUFS |
| H10 | -12.4 LUFS | -12.2 LUFS |

The master chain is unchanged: 1.28x rubberband with the pitch held, the same bus dynamics and two-pass
loudnorm with a linear second pass. The measurements at the top of this report are for Revision 3.
