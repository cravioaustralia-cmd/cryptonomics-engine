# Loudnorm report — final/lf02-gallipoli.mp4

Measured on the 1.28× pitch-held master audio (`build/master_speed.wav`, the stream muxed into the mp4).

| Measure | Value | Target |
|---|---|---|
| Delivered mp4 audio (AAC 192 kb/s) | -14.0 LUFS integrated, -1.8 dBTP true peak | measured on `final/lf02-gallipoli.mp4` |
| Integrated loudness | -14.0 LUFS | about −14 LUFS |
| True peak | -2.1 dBTP | at or under −1.5 dBTP |
| Loudness range | 4.6 LU | — |

## Chain

1. Voice takes placed untouched (no loudnorm, no stretch, one static unity gain). Assembled voice: -21.9 LUFS.
2. Mix at 1× (`render/mix.py`): music beds ducked under the voice, environment and sync hits; pre-master -22.2 LUFS.
3. Whole mix stretched to 1.28× with `atempo=1.28` (WSOLA, pitch unchanged): -22.4 LUFS.
4. Master chain on the 1.28× file only: `volume=8.41dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)`.
5. Two-pass loudnorm: pass 1 measured I -14.92 LUFS / TP -2.98 dBTP; pass 2 type `linear`.

## ffmpeg ebur128 on the master WAV

```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -24.9 LUFS

  Loudness range:
    LRA:         4.5 LU
    Threshold: -34.9 LUFS
    LRA low:   -17.4 LUFS
    LRA high:  -12.9 LUFS

  True peak:
    Peak:       -2.1 dBFS
```

## ffmpeg ebur128 on the delivered mp4 (AAC stream)

```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -24.9 LUFS

  Loudness range:
    LRA:         4.5 LU
    Threshold: -34.9 LUFS
    LRA low:   -17.4 LUFS
    LRA high:  -12.9 LUFS

  True peak:
    Peak:       -1.8 dBFS
```
