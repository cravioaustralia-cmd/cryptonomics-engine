# Loudnorm report — lf01 IF AUSTRALIA… Episode 1

Target: **−14 LUFS integrated**, true peak **≤ −1.5 dBTP**. The final is the 1.28× master: the finished mix was time-stretched with ffmpeg atempo=1.28 (WSOLA time-stretch, pitch unchanged), and the master chain and two-pass loudnorm below ran on that file only. Voice measured, never squashed: no loudnorm, compression or ducking on the VO.

| Stage | Integrated | True peak | LRA |
|---|---|---|---|
| Atlas VO, 34 takes assembled, untouched | -22.0 LUFS | — | — |
| Pre-master mix (VO + music + SFX + ambience + accents) at 1.28× | -22.4 LUFS | — | — |
| Pass 1 measurement (after make-up gain + limiter) | -14.90 LUFS | -3.00 dBTP | 5.10 LU |
| Pass 2 output (`linear`) | -13.97 LUFS | -2.10 dBTP | 5.20 LU |

Master chain (master bus only): `volume=8.38dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)`

## Voice over everything else

In every 20 ms frame where Atlas is sounding (15898 frames), the voice is above music, SFX, ambience and accents combined by at least **12.0 dB** in the speech band (200 Hz–5 kHz). The median margin is 27.3 dB.

## Delivered file `final/lf01-if-australia.mp4` (AAC 192 kbit/s, ffmpeg ebur128)

```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -24.9 LUFS

  Loudness range:
    LRA:         5.3 LU
    Threshold: -34.9 LUFS
    LRA low:   -17.6 LUFS
    LRA high:  -12.4 LUFS

  Sample peak:
    Peak:       -1.6 dBFS

  True peak:
    Peak:       -1.5 dBFS
```
