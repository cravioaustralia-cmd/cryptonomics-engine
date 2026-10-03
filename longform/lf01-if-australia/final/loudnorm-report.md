# Loudnorm report — lf01 IF AUSTRALIA… Episode 1

Target: **−14 LUFS integrated**, true peak **≤ −1.5 dBTP**. Voice measured, never squashed: no loudnorm, compression or ducking on the VO.

| Stage | Integrated | True peak | LRA |
|---|---|---|---|
| Atlas VO, 34 takes assembled, untouched | -22.0 LUFS | — | — |
| Pre-master mix (VO + music + SFX + ambience + accents) | -22.1 LUFS | — | — |
| Pass 1 measurement (after make-up gain + limiter) | -14.83 LUFS | -3.00 dBTP | 6.00 LU |
| Pass 2 output (`linear`) | -13.96 LUFS | -2.17 dBTP | 6.00 LU |

Master chain (master bus only): `volume=8.15dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)`

## Voice over everything else

In every 20 ms frame where Atlas is sounding (15898 frames), the voice is above music, SFX, ambience and accents combined by at least **12.0 dB** in the speech band (200 Hz–5 kHz). The median margin is 26.9 dB.

## Delivered file `final/lf01-if-australia.mp4` (AAC 192 kbit/s, ffmpeg ebur128)

```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -25.0 LUFS

  Loudness range:
    LRA:         6.2 LU
    Threshold: -35.1 LUFS
    LRA low:   -18.4 LUFS
    LRA high:  -12.2 LUFS

  Sample peak:
    Peak:       -1.8 dBFS

  True peak:
    Peak:       -1.8 dBFS
```
