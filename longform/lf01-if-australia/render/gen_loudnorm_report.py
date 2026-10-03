"""final/loudnorm-report.md from build/loudnorm.json, build/word_safety.json and a fresh ebur128 pass on the delivered MP4."""
import json, os, subprocess
EP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
ln = json.load(open(os.path.join(EP, 'build', 'loudnorm.json')))
ws = json.load(open(os.path.join(EP, 'build', 'word_safety.json')))
mp4 = os.path.join(EP, 'final', 'lf01-if-australia.mp4')
eb = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-map', '0:a', '-af', 'ebur128=peak=true+sample', '-f', 'null', '-'], capture_output=True, text=True).stderr
eb = eb[eb.rindex('Summary:'):].strip()
p1, p2 = ln['pass1'], ln['pass2']
md = f"""# Loudnorm report — lf01 IF AUSTRALIA… Episode 1

Target: **−14 LUFS integrated**, true peak **≤ −1.5 dBTP**. {('The final is the 1.28× master: the finished mix was time-stretched with ' + ln['stretch'] + ', and the master chain and two-pass loudnorm below ran on that file only.') if ln.get('speed') else ''} Voice measured, never squashed: no loudnorm, compression or ducking on the VO.

| Stage | Integrated | True peak | LRA |
|---|---|---|---|
| Atlas VO, 34 takes assembled, untouched | {ln['vo_lufs_untouched']:.1f} LUFS | — | — |
| Pre-master mix (VO + music + SFX + ambience + accents){' at ' + str(ln['speed']) + '×' if ln.get('speed') else ''} | {ln['premaster_lufs']:.1f} LUFS | — | — |
| Pass 1 measurement (after make-up gain + limiter) | {p1['input_i']} LUFS | {p1['input_tp']} dBTP | {p1['input_lra']} LU |
| Pass 2 output (`{p2['normalization_type']}`) | {p2['output_i']} LUFS | {p2['output_tp']} dBTP | {p2['output_lra']} LU |

Master chain (master bus only): `{ln['master_chain']}`

## Voice over everything else

In every 20 ms frame where Atlas is sounding ({ws['voiced_frames']} frames), the voice is above music, SFX, ambience and accents combined by at least **{ws['min_db']:.1f} dB** in the speech band (200 Hz–5 kHz). The median margin is {ws['median_db']:.1f} dB.

## Delivered file `final/lf01-if-australia.mp4` (AAC 192 kbit/s, ffmpeg ebur128)

```
{eb}
```
"""
open(os.path.join(EP, 'final', 'loudnorm-report.md'), 'w').write(md)
print('loudnorm-report.md written')
