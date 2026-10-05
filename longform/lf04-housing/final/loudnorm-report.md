# lf04 loudnorm report — Who Killed the Aussie Dream?

Master: `final/lf04-housing.mp4` (whole film at **1.28x**, pitch held with ffmpeg `rubberband`).
Loudness normalisation was applied to the **master only**, in two passes. The files in `audio/vo/` were not
retimed, pitch-shifted, loudnormed or overwritten.

## Measured on the delivered file (ffmpeg `ebur128=peak=true`, AAC decoded)

| Measure | Target | Measured | Result |
| --- | --- | --- | --- |
| Integrated loudness | about -14 LUFS | **-14.0 LUFS** | PASS |
| True peak | at or under -1.5 dBTP | **-1.6 dBTP** | PASS |
| Loudness range | — | 2.3 LU | — |

## Chain

1. 1x mix (`render/mix.py`): VO files at one fixed gain (+6 dB, identical for all 40), music beds ducked
   under the voice and lifted in the no-VO chapter holds, SFX only inside holds.
2. Whole mix at 1.28x, pitch held: `rubberband=tempo=1.28:pitch=1:pitchq=quality`.
3. Bus dynamics before normalisation: `acompressor=threshold=-30dB:ratio=2.5:attack=6:release=140:knee=8,volume=14.43dB,alimiter=limit=0.7586:attack=2:release=50:level=disabled`.
4. Loudnorm pass 1 (measure): input I -14.32 LUFS, TP -2.07 dBTP,
   LRA 2.30 LU, threshold -24.36 LUFS, offset -0.00.
5. Loudnorm pass 2 (apply): `I=-14.0:TP=-1.5`, measured values from pass 1, `linear=true`.
   Pass 2 reported normalisation type **linear**,
   output I -13.96 LUFS, TP -2.08 dBTP.
6. Encode: AAC 160 kb/s 48 kHz stereo.

Before the speed change and dynamics, the 1.28x mix measured -19.38 LUFS integrated and
0.94 dBTP true peak.

## File

| | |
| --- | --- |
| Duration | 759.33 s (12:39.33) |
| Size | 94.0 MB (kept under GitHub's 100 MB per-file limit; this repo does not use Git LFS) |
| Video | HEVC (Main) 1920x1080, 30/1 fps, tag `hvc1` |
| Audio | AAC 48000 Hz, 2 ch |

## Revision 2 — music levelling only (5 Oct 2026)

Audio-only fix on the same cut. Picture, cards, VO files, SFX timing, music tracks, chapters, mid-rolls and
credits are unchanged. The HEVC video stream was stream-copied from the first master, so its bitstream is
byte-identical (stream MD5 `24a7cadee7bbd2735cfaed36779cf43f` before and after). Only the audio was replaced.

What changed in `render/mix.py`: a slow, offline music leveller replaces the fixed duck. It holds the music bus
at two steady levels instead of following each track's own dynamics. It uses a 2 s centred RMS window, 0.8 s
gain smoothing and at most +9 dB of lift. The open titles and the end tail keep their original fades.

| Music bus, 1x mix (RMS) | First delivery | Revision 2 |
| --- | --- | --- |
| Under the voice, median | -30.7 dB | -33.6 dB (about 3 dB quieter) |
| Under the voice, p10 to p90 across segments | -35.2 to -29.3 dB | -33.7 to -33.3 dB |
| Chapter holds and pauses (H1 to H10) | -31.6 to -19.9 dB | -21.6 to -20.1 dB |

Hold loudness on the delivered master (ffmpeg ebur128, music and hold SFX together):

| Hold | First delivery | Revision 2 |
| --- | --- | --- |
| H1 | -16.3 LUFS | -11.2 LUFS |
| H2 | -12.9 LUFS | -11.1 LUFS |
| H3 | -15.0 LUFS | -14.6 LUFS |
| H4 | -12.7 LUFS | -12.6 LUFS |
| H5 | -15.5 LUFS | -11.0 LUFS |
| H6 | -15.4 LUFS | -13.9 LUFS |
| M3 | -20.2 LUFS | -14.2 LUFS |
| H7 | -13.8 LUFS | -12.6 LUFS |
| H8 | -13.1 LUFS | -13.1 LUFS |
| H9 | -14.1 LUFS | -14.4 LUFS |
| H10 | -14.2 LUFS | -12.4 LUFS |

The master chain is unchanged: 1.28x rubberband with the pitch held, the same bus dynamics and two-pass
loudnorm with a linear second pass. The measurements at the top of this report are for Revision 2.
