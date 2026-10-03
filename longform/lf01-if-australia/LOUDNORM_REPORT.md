# Loudness report — lf01 IF AUSTRALIA

Master: `out/final-mix.wav` (48 kHz, 24-bit), runtime 647.21 s.

| Measure | Value |
|---|---|
| Integrated loudness (ebur128, final) | **-14.0 LUFS** |
| True peak (ebur128, final) | **-1.8 dBTP** |
| Loudness range (final) | 5.6 LU |
| Target | −14 LUFS, true peak ≤ −1.5 dBTP |

## How it was made
- **Voice:** 34 seated Atlas files, median take -22.50 LUFS. One static gain of +4.52 dB for every chunk. Outlier takes more than 2 LU off the median get a static level match only: V19 -2.3 dB, V33 -5.9 dB. No compressor, no per-chunk normalise, no time-stretch. Only head/tail silence padding was trimmed (silencedetect, 80 ms margin).
- **Master peak catch:** `alimiter` at -4 dBFS on the summed premix (not on the voice stem), so loudnorm pass 2 runs linear. It acts on 0.306% of samples, maximum reduction 5.7 dB.
- **Music:** bed measured -19.72 LUFS, looped with a 6 s crossfade, about 13 LU under the voice in gaps and a further -9 dB under speech (smoothed side-chain, 60 ms attack, 700 ms release).
- **Master:** two-pass `loudnorm` (I=-14:TP=-1.5:LRA=11), **master only**, linear mode.

## loudnorm pass 1 (premix measurement)
```
input_i -15.68  input_tp -3.47  input_lra 5.50  input_thresh -26.84  target_offset -0.05
```
## loudnorm pass 2
```
output_i -13.97  output_tp -2.32  output_lra 5.50  normalization_type linear
```
## ebur128 summary of the final master
```
Summary:

  Integrated loudness:
    I:         -14.0 LUFS
    Threshold: -25.1 LUFS

  Loudness range:
    LRA:         5.6 LU
    Threshold: -35.1 LUFS
    LRA low:   -18.2 LUFS
    LRA high:  -12.6 LUFS

  True peak:
    Peak:       -1.8 dBFS
```
