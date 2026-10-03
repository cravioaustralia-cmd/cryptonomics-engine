# Loudnorm report — lf01 IF AUSTRALIA… Episode 1

Target: **−14 LUFS integrated**, true peak **≤ −1.5 dBTP**. Voice measured, never squashed: no loudnorm or compression on the VO.

| Stage | Integrated | True peak | LRA |
|---|---|---|---|
| Atlas VO, 34 takes assembled, untouched | -22.0 LUFS | — | — |
| Pre-master mix (VO + music + SFX) | -22.3 LUFS | — | — |
| Pass 1 measurement (after make-up gain + limiter) | -14.95 LUFS | -3.00 dBTP | 5.30 LU |
| Pass 2 output (`linear`) | -13.96 LUFS | -2.05 dBTP | 5.30 LU |
| **Delivered `final/lf01-if-australia.mp4` (AAC 192 kbit/s)** | see below | see below | see below |

Master chain (master bus only): `volume=8.34dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)`

The limiter runs 4× oversampled so it catches inter-sample peaks. The ceiling is −3.0 dBFS because AAC encoding adds about 0.4 dB of true peak. The ceiling was set so the delivered file, not only the WAV master, stays at or under −1.5 dBTP.

## Delivered file (ffmpeg ebur128, true peak)

```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -24.4 LUFS

  Loudness range:
    LRA:         5.5 LU
    Threshold: -34.5 LUFS
    LRA low:   -17.3 LUFS
    LRA high:  -11.8 LUFS

  Sample peak:
    Peak:       -1.6 dBFS

  True peak:
    Peak:       -1.6 dBFS
```
