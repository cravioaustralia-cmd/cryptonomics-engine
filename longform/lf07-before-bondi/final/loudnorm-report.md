# BEFORE BONDI — loudness report

Measured with ffmpeg `ebur128` (peak=true) on the final mp4 files, after AAC encoding. Source numbers are in `build/master_report.json` (not committed).

| File | Speed | Length | Integrated | True peak | LRA | Size | Video | Audio |
|---|---|---|---|---|---|---|---|---|
| `lf07-before-bondi-1x.mp4` | 1× | 12:45.73 | −14.1 LUFS | −2.0 dBTP | 5.5 LU | 89.1 MB (84.96 MiB) | H.264 two-pass, 790 kbps | AAC-LC 128 kbps, 48 kHz stereo |
| `lf07-before-bondi.mp4` | 1.28× | 9:58.23 | −14.2 LUFS | −2.0 dBTP | 4.3 LU | 88.9 MB (84.75 MiB) | H.264 two-pass, 1051 kbps | AAC-LC 128 kbps, 48 kHz stereo |

Targets: −14 LUFS, true peak at or under −1.5 dBTP, each file under 95 MB. Both pass.

## 1× chain

1. Mix summed in float (`render/mix.py`): voice bus +6 dB linear gain, music, effects, ambiences. No processing on any voice file.
2. Master (`mix.master`): gain, then a true-peak-safe limiter at 192 kHz (alimiter), then resample to 48 kHz. Gain is iterated until the WAV measures −14 LUFS. The limiter ceiling is −2.3 dBFS so the AAC file stays under −1.5 dBTP.
3. WAV: −14.1 LUFS, −2.8 dBTP, LRA 5.5. After AAC: −14.1 LUFS, −2.0 dBTP.

## 1.28× chain

1. The mastered 1× WAV goes through rubberband at tempo 1.28 with pitch held (pitchq=quality, transients=smooth, formant=preserved).
2. Two-pass loudnorm on that master only: target I −14, TP −2.4 (headroom for AAC), LRA 11, linear=true.
3. First-pass measurement of the rubberband output:

| input I | input TP | input LRA | threshold | target offset |
|---|---|---|---|---|
| −17.05 LUFS | −0.44 dBTP | 4.60 LU | −27.61 LUFS | +0.42 LU |

4. **Caveat:** loudnorm reported `normalization_type: dynamic`. Rubberband raised inter-sample peaks to −0.44 dBTP, so a purely linear +3 dB gain would have clipped and loudnorm fell back to its dynamic mode. With LRA 4.3 LU the gain riding is gentle, but it is not a pure linear gain. After AAC: −14.2 LUFS, −2.0 dBTP.

## The two silences (digital zero)

Measured on the decoded AAC audio of each mp4 as the longest run below −90 dBFS.

| Silence | 1× planned | 1× measured run | 1.28× measured run | Peak inside |
|---|---|---|---|---|
| S10, before "On the sixth of August" | 2:02.49–2:03.49 (1.0 s) | 1.085 s from 2:02.46 | 0.83 s from 1:35.69 | −240 dBFS (true zero) |
| S35, after "wasn't" | 9:33.90–9:35.90 (2.0 s) | 1.94 s from 9:33.99 | 1.50 s from 7:28.44 | 1×: −240 dBFS · 1.28×: −100 dBFS |

The S35 planned window is counted from the end of the word "wasn't". The voice file's own breath and decay tail runs about 0.09 s past that, and it is not trimmed, so true digital zero starts at 9:33.99. The −100 dBFS inside the 1.28× S35 window is rubberband and AAC residue, far below hearing.
