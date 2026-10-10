# lf07 pace-evening report

Generated 2026-10-11 04:04:12 AEDT. Rate target = voice median articulation rate (syl/s of speaking time): Atlas 5.00, Ara 5.08. GENTLE build: no internal silence is shortened or lengthened, lead/trail = 0.12 s, tempo untouched within +/-5% of the voice median (otherwise the smallest R3 pitch-held correction that lands inside +/-5%), linear gain to -20 LUFS integrated, no EQ/denoise, a look-ahead limiter only on files whose true peak would exceed -1.5 dBTP.

**Handover gap:** every file carries 0.12 s of lead and 0.12 s of trail silence, so two consecutive segments abut with 0.24 s. The script needs a 0.35-0.5 s handover, so put **0.11-0.26 s of extra silence** between segments in the edit (a 0.5 s clean beat after S12 and S28 per MIX_MAP).

## Corrected takes

| Seg | Voice | Raw s | Final s | Raw syl/s | Final syl/s (dev vs target) | Tempo | f0 raw -> final (Hz) | LUFS | TP dBTP | Limiter GR mean/max dB | Verified |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S01 | Atlas | 12.22 | 12.19 | 4.98 | 4.99 (-0.3%) | x1.000 | 133 -> 133 (+0.01 st) | -20.03 | -2.10 | 0.1 / 2.0 | yes |
| S02 | Ara | 14.45 | 14.74 | 5.47 | 5.34 (+4.8%) | x0.973 | 186 -> 187 (+0.02 st) | -20.00 | -2.85 | 0.0 / 0.0 | yes |
| S03 | Atlas | 9.00 | 7.56 | 4.00 | 4.78 (-4.4%) | x1.195 | 136 -> 136 (+0.06 st) | -20.02 | -2.15 | 0.0 / 0.6 | yes |
| S04 | Ara | 15.72 | 15.62 | 5.22 | 5.22 (+2.8%) | x1.000 | 201 -> 201 (+0.05 st) | -20.00 | -2.50 | 0.0 / 0.0 | yes |
| S05 | Atlas | 10.30 | 10.36 | 5.31 | 5.23 (+4.6%) | x0.985 | 140 -> 140 (+0.05 st) | -20.03 | -2.16 | 0.0 / 2.0 | yes |
| S06 | Ara | 8.04 | 8.47 | 5.70 | 5.31 (+4.3%) | x0.934 | 197 -> 197 (-0.00 st) | -20.01 | -2.16 | 0.0 / 0.6 | yes |
| S07 | Atlas | 9.96 | 9.88 | 5.07 | 5.08 (+1.5%) | x1.000 | 135 -> 135 (-0.01 st) | -20.09 | -2.15 | 0.1 / 1.9 | yes |
| S08 | Ara | 13.18 | 12.01 | 4.51 | 4.85 (-4.8%) | x1.078 | 214 -> 214 (+0.01 st) | -20.00 | -3.92 | 0.0 / 0.0 | yes |
| S09 | Atlas | 14.45 | 14.51 | 4.97 | 4.98 (-0.5%) | x1.000 | 142 -> 142 (-0.03 st) | -20.00 | -2.21 | 0.0 / 0.0 | yes |
| S10 | Ara | 20.21 | 20.72 | 5.46 | 5.32 (+4.9%) | x0.972 | 204 -> 204 (+0.00 st) | -20.00 | -3.64 | 0.0 / 0.0 | yes |
| S11 | Atlas | 17.98 | 17.86 | 4.95 | 4.95 (-1.1%) | x1.000 | 136 -> 136 (+0.00 st) | -20.00 | -2.49 | 0.0 / 0.0 | yes |
| S12 | Ara | 10.30 | 10.23 | 4.96 | 4.96 (-2.3%) | x1.000 | 201 -> 201 (-0.00 st) | -20.00 | -2.16 | 0.0 / 0.0 | yes |
| S13 | Atlas | 14.76 | 15.08 | 5.35 | 5.24 (+4.7%) | x0.977 | 129 -> 130 (+0.02 st) | -20.02 | -2.16 | 0.0 / 0.7 | yes |
| S14 | Ara | 11.88 | 11.65 | 5.02 | 5.02 (-1.5%) | x1.000 | 205 -> 205 (-0.05 st) | -20.00 | -2.80 | 0.0 / 0.0 | yes |
| S15 | Atlas | 18.60 | 18.56 | 5.07 | 5.08 (+1.5%) | x1.000 | 141 -> 141 (-0.03 st) | -20.04 | -2.13 | 0.1 / 1.6 | yes |
| S16 | Ara | 18.94 | 18.72 | 4.99 | 4.99 (-2.0%) | x1.000 | 186 -> 185 (-0.01 st) | -20.00 | -2.15 | 0.0 / 0.1 | yes |
| S17 | Atlas | 9.96 | 9.58 | 4.62 | 4.79 (-4.2%) | x1.034 | 133 -> 133 (-0.00 st) | -20.03 | -2.16 | 0.0 / 0.8 | yes |
| S18 | Ara | 13.49 | 13.38 | 4.84 | 4.84 (-4.9%) | x1.000 | 200 -> 200 (+0.00 st) | -20.00 | -2.31 | 0.0 / 0.0 | yes |
| S19 | Atlas | 14.14 | 13.96 | 5.00 | 5.01 (+0.1%) | x1.000 | 136 -> 136 (-0.03 st) | -20.06 | -2.14 | 0.1 / 2.0 | yes |
| S20 | Ara | 19.25 | 19.19 | 5.36 | 5.32 (+4.5%) | x0.992 | 199 -> 199 (-0.03 st) | -20.00 | -2.16 | 0.0 / 0.3 | yes |
| S21 | Atlas | 24.05 | 24.17 | 5.26 | 5.23 (+4.6%) | x0.994 | 138 -> 139 (+0.07 st) | -20.02 | -2.16 | 0.0 / 1.5 | yes |
| S22 | Ara | 13.80 | 13.70 | 5.08 | 5.08 (-0.3%) | x1.000 | 192 -> 192 (+0.02 st) | -20.01 | -2.15 | 0.0 / 0.4 | yes |
| S23 | Atlas | 13.80 | 13.12 | 4.60 | 4.77 (-4.7%) | x1.039 | 137 -> 137 (+0.01 st) | -20.00 | -2.67 | 0.0 / 0.0 | yes |
| S24 | Ara | 15.72 | 14.95 | 4.71 | 4.85 (-4.7%) | x1.033 | 196 -> 196 (+0.00 st) | -20.00 | -2.85 | 0.0 / 0.0 | yes |
| S25 | Atlas | 14.14 | 14.04 | 5.23 | 5.23 (+4.6%) | x1.000 | 135 -> 135 (+0.00 st) | -20.04 | -2.14 | 0.1 / 2.1 | yes |
| S26 | Ara | 16.06 | 16.49 | 5.58 | 5.32 (+4.4%) | x0.953 | 187 -> 186 (-0.09 st) | -20.00 | -2.58 | 0.0 / 0.0 | yes |
| S27 | Atlas | 19.25 | 19.29 | 5.19 | 5.19 (+3.8%) | x1.000 | 138 -> 138 (-0.02 st) | -20.01 | -2.13 | 0.0 / 1.2 | yes |
| S28 | Ara | 6.12 | 6.01 | 5.02 | 5.03 (-1.2%) | x1.000 | 198 -> 198 (+0.01 st) | -20.00 | -3.35 | 0.0 / 0.0 | yes |
| S29 | Atlas | 13.80 | 13.73 | 4.88 | 4.88 (-2.5%) | x1.000 | 134 -> 134 (-0.01 st) | -20.08 | -2.14 | 0.1 / 1.9 | yes |
| S30 | Ara | 21.17 | 21.02 | 5.00 | 5.00 (-1.9%) | x1.000 | 193 -> 193 (+0.01 st) | -20.04 | -2.13 | 0.0 / 1.2 | yes |
| S31 | Atlas | 16.68 | 16.64 | 4.95 | 4.95 (-1.1%) | x1.000 | 137 -> 137 (+0.02 st) | -20.05 | -2.08 | 0.1 / 2.6 | yes |
| S32 | Ara | 20.21 | 20.20 | 5.13 | 5.13 (+0.8%) | x1.000 | 194 -> 194 (-0.00 st) | -20.00 | -2.13 | 0.0 / 0.1 | yes |
| S33 | Atlas | 18.94 | 19.37 | 5.35 | 5.23 (+4.6%) | x0.977 | 135 -> 135 (-0.00 st) | -20.01 | -2.15 | 0.0 / 0.4 | yes |
| S34 | Ara | 10.92 | 10.60 | 4.79 | 4.86 (-4.2%) | x1.011 | 202 -> 203 (+0.06 st) | -20.00 | -2.36 | 0.0 / 0.0 | yes |
| S35 | Atlas | 10.61 | 10.45 | 5.01 | 5.02 (+0.3%) | x1.000 | 129 -> 130 (+0.05 st) | -20.12 | -2.14 | 0.1 / 2.2 | yes |
| S36 | Ara | 10.30 | 10.07 | 5.13 | 5.13 (+0.9%) | x1.000 | 194 -> 194 (-0.01 st) | -20.00 | -2.16 | 0.0 / 0.0 | yes |
| S37 | Atlas | 14.45 | 14.40 | 4.91 | 4.92 (-1.7%) | x1.000 | 133 -> 133 (+0.02 st) | -20.05 | -2.11 | 0.1 / 1.6 | yes |
| S38 | Ara | 6.46 | 6.45 | 5.00 | 5.00 (-1.8%) | x1.000 | 203 -> 203 (-0.03 st) | -20.01 | -2.16 | 0.0 / 1.0 | yes |
| S39 | Atlas | 9.34 | 9.14 | 5.10 | 5.10 (+1.9%) | x1.000 | 140 -> 140 (+0.02 st) | -20.00 | -2.50 | 0.0 / 0.0 | yes |
| S40 | Ara | 11.26 | 10.95 | 4.99 | 4.99 (-1.9%) | x1.000 | 218 -> 218 (+0.01 st) | -20.00 | -4.83 | 0.0 / 0.0 | yes |
| S41 | Atlas | 17.02 | 16.96 | 5.00 | 5.00 (+0.0%) | x1.000 | 133 -> 133 (-0.06 st) | -20.04 | -2.14 | 0.1 / 2.1 | yes |
| S42 | Ara | 23.40 | 23.12 | 5.32 | 5.32 (+4.6%) | x1.000 | 195 -> 195 (-0.02 st) | -20.03 | -2.09 | 0.1 / 2.2 | yes |
| S43 | Atlas | 16.06 | 15.25 | 4.54 | 4.78 (-4.6%) | x1.052 | 132 -> 133 (+0.07 st) | -20.04 | -2.15 | 0.0 / 0.9 | yes |
| S44 | Ara | 13.18 | 13.00 | 5.11 | 5.13 (+1.1%) | x1.000 | 200 -> 201 (+0.05 st) | -20.00 | -2.75 | 0.0 / 0.0 | yes |
| S45 | Atlas | 15.72 | 15.61 | 4.97 | 4.97 (-0.7%) | x1.000 | 135 -> 136 (+0.05 st) | -20.04 | -2.15 | 0.1 / 1.6 | yes |
| S46 | Ara | 8.38 | 8.37 | 5.49 | 5.31 (+4.4%) | x0.969 | 225 -> 226 (+0.02 st) | -20.00 | -5.06 | 0.0 / 0.0 | yes |

## Tempo-corrected (beyond +/-5%) / pitch-shifted takes: artefact proxies vs the raw take

Proxies are level-independent and compare the output with its own raw take. PASS needs: rate within +/-5% of target, f0 shift within 0.2 st of the intended shift, pitch std >= 85% of raw, 4-10 kHz share within +/-1.5 dB, onset sharpness >= 85%, HNR drop <= 1.5 dB, flux CV within +/-15%, formants within +/-5% (pitch-shifted take).

| Seg | Why | Tempo | Rate dev | f0 shift (st) | f0 raw -> out (Hz) | Pitch std | HF dB | Onset sharp. | HNR dB | Flux CV | F1/F2/F3 | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S02 | tempo beyond 5% | x0.973 | +4.8% | +0.02 | 186 -> 187 | 100% | -0.3 | 89% | +0.3 | -8% | -0.0/+1.6/+0.3% | **PASS** |
| S03 | Bondi retake H (dye ending) is 19.8% slow: tempo-corrected to within 5 | x1.195 | -4.4% | +0.06 | 136 -> 136 | 101% | -0.8 | 110% | -0.7 | -9% | -2.1/-0.1/+0.2% | **PASS** |
| S05 | tempo beyond 5% | x0.985 | +4.6% | +0.05 | 140 -> 140 | 102% | -0.2 | 103% | +0.0 | -12% | +1.2/-0.8/+0.0% | **PASS** |
| S06 | pace-only failure; closest take (v1) tempo-corrected beyond 8% | x0.934 | +4.3% | -0.00 | 197 -> 197 | 98% | -0.3 | 117% | +1.0 | -6% | +2.2/-0.7/-0.6% | **PASS** |
| S08 | pace-only failure; closest take (v1) tempo-corrected beyond 8% | x1.078 | -4.8% | +0.01 | 214 -> 214 | 99% | -0.5 | 108% | -0.1 | -7% | -1.2/+0.5/-0.4% | **PASS** |
| S10 | tempo beyond 5% | x0.972 | +4.9% | +0.00 | 204 -> 204 | 100% | -0.3 | 103% | +0.1 | -8% | -0.5/-1.2/-0.6% | **PASS** |
| S13 | tempo beyond 5% | x0.977 | +4.7% | +0.02 | 129 -> 130 | 100% | -0.3 | 107% | +0.1 | -9% | -0.7/+0.2/+0.3% | **PASS** |
| S17 | tempo beyond 5% | x1.034 | -4.2% | -0.00 | 133 -> 133 | 100% | -0.4 | 116% | +0.1 | -7% | -0.1/+0.7/+0.2% | **PASS** |
| S20 | tempo beyond 5% | x0.992 | +4.5% | -0.03 | 199 -> 199 | 100% | -0.3 | 95% | +0.2 | -9% | +0.9/+0.9/-0.4% | **PASS** |
| S21 | tempo beyond 5% | x0.994 | +4.6% | +0.07 | 138 -> 139 | 100% | -0.3 | 99% | -0.4 | -9% | -0.4/+0.7/+0.2% | **PASS** |
| S23 | pace-only failure; closest take (retake b) tempo-corrected beyond 8% | x1.039 | -4.7% | +0.01 | 137 -> 137 | 101% | -0.4 | 101% | -0.2 | -10% | +0.7/+0.1/-0.1% | **PASS** |
| S24 | triage: 'the first' acoustically present (false alarm) | x1.033 | -4.7% | +0.00 | 196 -> 196 | 101% | -0.3 | 120% | +0.3 | -6% | +0.4/-0.3/-0.1% | **PASS** |
| S26 | pace-only failure; closest take (v1) tempo-corrected beyond 8% | x0.953 | +4.4% | -0.09 | 187 -> 186 | 99% | -0.3 | 96% | +0.4 | -9% | -0.4/+1.1/+0.1% | **PASS** |
| S33 | tempo beyond 5% | x0.977 | +4.6% | -0.00 | 135 -> 135 | 100% | -0.3 | 106% | -0.2 | -8% | +0.7/+0.7/+0.3% | **PASS** |
| S34 | tempo beyond 5% | x1.011 | -4.2% | +0.06 | 202 -> 203 | 101% | -0.3 | 101% | +0.3 | -9% | +0.6/+0.2/-0.0% | **PASS** |
| S43 | pace-only failure; closest take (v1) tempo-corrected beyond 8% | x1.052 | -4.6% | +0.07 | 132 -> 133 | 100% | -0.4 | 116% | -0.4 | -7% | +1.0/-0.5/-0.1% | **PASS** |
| S46 | pitch shift REJECTED (fricative centroid -7.5% (phasiness proxy)); uns | x0.969 | +4.4% | +0.02 | 225 -> 226 | 99% | -0.3 | 95% | -0.0 | -9% | -0.7/+0.3/+0.4% | **PASS** |

**Limiter:** used on 29 of 46 files (true peak after linear gain was above the ceiling); mean GR on speech over those files 0.04 dB (worst file 0.14), max GR 2.65 dB. **Pauses:** all 193 internal pauses >=250 ms kept; largest deviation from the raw take (after tempo scaling) 20 ms.


## RE-RECORD (not stretched, not processed)

None.

## Duration vs script slot

Over by = final - slot. Over incl. = final + HOLD/BREATHE seconds + 0.5 s handover - slot (the realistic fit).

| Seg | Final s | Slot s | Over by | HOLD/BREATHE s | Over incl. holds + 0.5 s |
|---|---|---|---|---|---|
| S10 | 20.7 | 22 | -1.3 | 1 | +0.2 |
| S11 | 17.9 | 18 | -0.1 | 0 | +0.4 |
| S21 | 24.2 | 23 | +1.2 | 0 | +1.7 |
| S25 | 14.0 | 14 | +0.0 | 2 | +2.5 |
| S27 | 19.3 | 19 | +0.3 | 0 | +0.8 |
| S33 | 19.4 | 19 | +0.4 | 0 | +0.9 |
| S44 | 13.0 | 17 | -4.0 | 5 | +1.5 |

## Bondi retakes

See `BONDI_CHECK.md`. Replaced raw takes (originals in /workspace/lf07-vo/raw_v2): S03 (H), S04, S07, S10, S12, S17, S34, S36 (R), S44 (H). Kept: S01, S41, S43 (still "dee").
