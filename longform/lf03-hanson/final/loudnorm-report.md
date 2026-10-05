# Loudnorm report — lf03 Hanson

Target: **−14 LUFS integrated**, true peak **at or under −1.5 dBTP**.

The cut and the mix were built at 1×. The delivered master is the whole film at **1.28×**: the finished 1× mix was time-stretched with ffmpeg atempo=1.28 (WSOLA time-stretch, pitch unchanged). The master chain and the two-pass loudnorm ran on that 1.28× file only. The narration is the even-pace set in `audio/vo-even/` (the originals in `audio/vo/` are untouched and unused). Those voice files were not sped up, normalised, compressed or ducked by the mix. The only change to the voice is the bleep in S22.

| Stage | Integrated | True peak | LRA |
|---|---|---|---|
| Atlas voice, 37 even-pace takes (`audio/vo-even/`) assembled, untouched | -23.0 LUFS | — | — |
| 1× pre-master mix (voice, music, effects) | -23.1 LUFS | — | — |
| 1.28× pre-master mix | -23.3 LUFS | — | — |
| Pass 1 measurement (after make-up gain and limiter) | -14.72 LUFS | -3.00 dBTP | 4.20 LU |
| Pass 2 output (`linear`) | -13.97 LUFS | -2.28 dBTP | 4.10 LU |
| Master WAV re-measured | -14.00 LUFS | -2.28 dBTP | 4.20 LU |

Master chain (master bus only):

```
volume=9.34dB,aresample=192000,alimiter=limit=0.7079:attack=3:release=80:level=false:asc=1,aresample=48000:resampler=soxr:precision=28,loudnorm(two-pass, linear)
```

## Voice over everything else

In every 20 ms frame where the voice is sounding (22468 frames at 1×), the voice sits above music and effects combined by at least **12.0 dB** in the speech band (200 Hz–5 kHz). The 1st percentile is 12.7 dB and the median is 26.9 dB. Music sits 23 dB under the voice while it talks and comes up to 11 dB under it in pauses.

## Bleep

S22, the word "piss" in "pack your bags and piss off back to Pakistan". The bleep covers 25.95–26.235 s inside the take (409.82–410.05 s on the master). Its edges were measured on the waveform: the "p" release, through the end of the "ss", stopping before "off". The tone is a 1 kHz sine, 3 dB under the surrounding speech RMS. A Whisper pass over the bleeped mix no longer transcribes the word. The card on screen reads "p*ss".

## Delivered file `final/lf03-hanson.mp4`

1920×1080, 30 fps, h264; audio aac 192 kbit/s, 48000 Hz, 2 channels. Length 687.27 s (11:27). Size 92.2 MB.

ffmpeg ebur128 on the delivered file:

```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -24.8 LUFS

  Loudness range:
    LRA:         4.2 LU
    Threshold: -34.8 LUFS
    LRA low:   -17.1 LUFS
    LRA high:  -12.9 LUFS

  Sample peak:
    Peak:       -2.0 dBFS

  True peak:
    Peak:       -2.0 dBFS
```
