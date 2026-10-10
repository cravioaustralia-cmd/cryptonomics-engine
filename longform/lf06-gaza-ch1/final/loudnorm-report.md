# lf06 Ch1: loudness report

Measured with ffmpeg `ebur128` (true peak, 4x oversampled) and `loudnorm` analysis on the decoded AAC of each delivered file.

## 1x review cut: `final/lf06-gaza-ch1-1x.mp4`

- Duration 132.30 s, video 5323 kbps 2-pass H.264, AAC 192 kbps 48 kHz stereo, 86.6 MB.
- Pre-master mix: -14.6 LUFS-I, LRA 6.4 LU, true peak +0.1 dBTP.
- Processing: static gain +1.50 dB, then a peak limiter at -2.8 dBFS (sample peak). No loudnorm (the brief puts loudnorm on the 1.28x master only).
- Delivered file: **-14.2 LUFS-I**, true peak **-2.3 dBTP**, LRA 6.1 LU.

## 1.28x master (pitch held): `final/lf06-gaza-ch1.mp4`

- Duration 103.36 s, video 6886 kbps 2-pass H.264 (`setpts=PTS/1.28`, 30 fps), AAC 192 kbps 48 kHz stereo, 86.8 MB.
- Audio chain: the whole 1x pre-master mix through `rubberband` (tempo 1.28, pitch 1.0, quality pitch mode, formants preserved), pre-levelled with a static gain of +4.30 dB and a -2.8 dBFS peak limiter, then two-pass `loudnorm` I=-14, TP=-1.5, LRA=11, linear=true.
- Pass 1 measured: -14.36 LUFS-I, -2.60 dBTP, LRA 5.20 LU, threshold -24.91, offset -0.20.
- Pass 2 output: -13.88 LUFS-I, -2.44 dBTP, LRA 4.30 LU, normalisation type: linear.
- Delivered file: **-14.0 LUFS-I**, true peak **-2.2 dBTP**, LRA 5.2 LU.

## Mix levels (1x, from `render/mix.py`)

| Segment | Narration (median momentary LUFS) | Bed under speech (music + SFX) | Spacing |
|---|---|---|---|
| S05 | -14.7 | -30.4 | 15.2 dB |
| S06 | -16.2 | -32.6 | 18.2 dB |
| S07 | -17.3 | -33.4 | 19.1 dB |
| S08 | -16.2 | -33.6 | 17.8 dB |
| S09 | -16.1 | -33.2 | 17.7 dB |
| S10 | -16.2 | -34.2 | 17.2 dB |
| S11 | -15.6 | -34.0 | 17.9 dB |
| S12 | -13.8 | -34.2 | 18.0 dB |
| S13 | -16.5 | -33.8 | 18.1 dB |

| Music-only hold | Bed (median momentary LUFS) |
|---|---|
| opening | -25.4 |
| S07 hold | -19.5 |
| S09 hold | -27.9 |
| S10 same-event hold | -25.7 |
| end hold | -22.4 |

S10 bed under memory 1: -34.44 LUFS-M; under memory 2: -34.14 LUFS-M.

Voice clip gains (one static gain per file; the files on disk are untouched):

| File | File loudness | Clip gain |
|---|---|---|
| audio/vo/S05.mp3 | -23.55 LUFS | +9.55 dB |
| audio/vo/S06.mp3 | -22.16 LUFS | +8.16 dB |
| audio/vo/S07.mp3 | -21.18 LUFS | +7.18 dB |
| audio/vo/S08.mp3 | -22.88 LUFS | +8.88 dB |
| audio/vo/S09.mp3 | -20.42 LUFS | +6.42 dB |
| audio/vo/S10.mp3 | -23.52 LUFS | +8.52 dB |
| audio/vo/S11.mp3 | -23.75 LUFS | +9.75 dB |
| audio/vo/S12.mp3 | -22.92 LUFS | +8.92 dB |
| audio/vo/S13.mp3 | -23.05 LUFS | +9.05 dB |
