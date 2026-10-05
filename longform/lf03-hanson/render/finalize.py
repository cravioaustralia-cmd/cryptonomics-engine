"""Join the picture slices, encode the delivered 1.28x master with the 1.28x audio master, and write the paperwork:
final/lf03-hanson.mp4, final/contact-sheet.jpg, final/CHAPTERS.md, final/loudnorm-report.md, CUE_SHEET.md."""
import glob, json, os, subprocess
from PIL import Image, ImageDraw
import scenes as SC
import gfx as G

SPEED = 1.28
EP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
B, FIN = os.path.join(EP, 'build'), os.path.join(EP, 'final')
os.makedirs(FIN, exist_ok=True)
OUT = os.path.join(FIN, 'lf03-hanson.mp4')
LN = json.load(open(os.path.join(B, 'loudnorm.json')))
MIX = json.load(open(os.path.join(B, 'mix.json')))
DUR = LN['duration_s']
TARGET_MB = 92.0          # GitHub's per-file limit is 100 MB
AUDIO_K = 192
VIDEO_K = int(TARGET_MB * 8e6 / DUR / 1000 - AUDIO_K - 8)


def run(cmd):
    subprocess.run(cmd, check=True)


def mmss(t):
    t = int(t)
    return f'{t // 60}:{t % 60:02d}'


if not os.environ.get('SKIP_ENCODE'):
    parts = sorted(glob.glob(os.path.join(B, 'parts', 'p*.mp4')))
    with open(os.path.join(B, 'parts.txt'), 'w') as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(B, 'parts.txt'), '-c', 'copy', os.path.join(B, 'picture.mp4')])
    common = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{VIDEO_K}k', '-maxrate', f'{VIDEO_K * 3}k', '-bufsize', f'{VIDEO_K * 4}k',
              '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60', '-passlogfile', os.path.join(B, 'x264')]
    run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(B, 'picture.mp4')] + common + ['-pass', '1', '-an', '-f', 'mp4', os.devnull])
    run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(B, 'picture.mp4'), '-i', os.path.join(B, 'master_speed.wav')] + common +
        ['-pass', '2', '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', f'{AUDIO_K}k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT])

# ------------------------------------------------------------------ measure the delivered file
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels',
                                            '-of', 'json', OUT]))
eb = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', OUT, '-af', 'ebur128=peak=true+sample', '-f', 'null', '-'], capture_output=True, text=True).stderr
eb = eb[eb.rindex('Summary:'):].strip()
size_mb = int(probe['format']['size']) / 1e6
fdur = float(probe['format']['duration'])

# ------------------------------------------------------------------ chapters on the master clock
chap = [(t / SPEED, n) for t, n in SC.CH]
mid = [m / SPEED for m in SC.MIDROLL]
with open(os.path.join(FIN, 'CHAPTERS.md'), 'w') as f:
    f.write('# lf03 chapters — times on the 1.28× master\n\n')
    f.write('Paste-ready for the YouTube description (the first chapter starts at 0:00, every chapter is longer than 10 seconds).\n\n```\n')
    for t, n in chap:
        f.write(f'{mmss(t)} {n}\n')
    f.write('```\n\n## Exact times\n\n| Master time | 1× cut time | Chapter |\n|---|---|---|\n')
    for (t, n), (t1, _) in zip(chap, SC.CH):
        f.write(f'| {t:.2f} s ({mmss(t)}) | {t1:.2f} s | {n} |\n')
    f.write('\n## Suggested mid-rolls\n\nEach sits in a silent gap after the take ends (no word under it). The master is long enough for all three.\n\n| After | Master time | Gap |\n|---|---|---|\n')
    for k, m in zip(('S17', 'S23', 'S29'), mid):
        f.write(f'| {k} | {m:.2f} s ({mmss(m)}) | {SC.E(k) / SPEED:.2f}–{SC.S("S%02d" % (int(k[1:]) + 1)) / SPEED:.2f} s |\n')
    f.write(f'\nMaster length: {fdur:.2f} s ({mmss(fdur)}).\n')

# ------------------------------------------------------------------ contact sheet from the delivered file
cols, tw_, th_ = 6, 320, 180
times = [t for t in range(5, int(fdur) - 2, 12)]
rows = (len(times) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw_ + (cols + 1) * 10, rows * (th_ + 34) + 90 + 10), (12, 14, 18))
d = ImageDraw.Draw(sheet)
d.text((12, 18), 'lf03 · Jailed. Censured. Now #1. How Pauline Hanson Took Over Australian Politics', font=G.F('label', 34), fill=G.WHITE)
d.text((12, 58), f'1.28× master · {mmss(fdur)} · one frame every 12 s · times are master times', font=G.F('label5', 22), fill=G.MUTED)
tmp = os.path.join(B, 'cs')
os.makedirs(tmp, exist_ok=True)
for i, t in enumerate(times):
    p = os.path.join(tmp, f'{t:05d}.jpg')
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', OUT, '-frames:v', '1', '-vf', f'scale={tw_}:{th_}', p])
    x, y = 10 + (i % cols) * (tw_ + 10), 90 + (i // cols) * (th_ + 34)
    sheet.paste(Image.open(p), (x, y))
    lab = mmss(t) + next((f'  · {n}' for tc, n in reversed(chap) if tc <= t), '')
    d.text((x, y + th_ + 4), lab[:44], font=G.F('label5', 20), fill=(200, 200, 195))
sheet.save(os.path.join(FIN, 'contact-sheet.jpg'), quality=88)

# ------------------------------------------------------------------ loudnorm report
p1, p2, vm = LN['pass1'], LN['pass2'], LN['verify_master_wav']
ws = MIX['word_safety']
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
with open(os.path.join(FIN, 'loudnorm-report.md'), 'w') as f:
    f.write(f"""# Loudnorm report — lf03 Hanson

Target: **−14 LUFS integrated**, true peak **at or under −1.5 dBTP**.

The cut and the mix were built at 1×. The delivered master is the whole film at **1.28×**: the finished 1× mix was time-stretched with {LN['stretch']}. The master chain and the two-pass loudnorm ran on that 1.28× file only. The narration is the even-pace set in `audio/vo-even/` (the originals in `audio/vo/` are untouched and unused). Those voice files were not sped up, normalised, compressed or ducked by the mix. The only change to the voice is the bleep in S22.

| Stage | Integrated | True peak | LRA |
|---|---|---|---|
| Atlas voice, 37 even-pace takes (`audio/vo-even/`) assembled, untouched | {LN['vo_lufs_untouched']:.1f} LUFS | — | — |
| 1× pre-master mix (voice, music, effects) | {LN['premaster_1x_lufs']:.1f} LUFS | — | — |
| 1.28× pre-master mix | {LN['premaster_speed_lufs']:.1f} LUFS | — | — |
| Pass 1 measurement (after make-up gain and limiter) | {float(p1['input_i']):.2f} LUFS | {float(p1['input_tp']):.2f} dBTP | {float(p1['input_lra']):.2f} LU |
| Pass 2 output (`{p2['normalization_type']}`) | {float(p2['output_i']):.2f} LUFS | {float(p2['output_tp']):.2f} dBTP | {float(p2['output_lra']):.2f} LU |
| Master WAV re-measured | {float(vm['input_i']):.2f} LUFS | {float(vm['input_tp']):.2f} dBTP | {float(vm['input_lra']):.2f} LU |

Master chain (master bus only):

```
{LN['master_chain']}
```

## Voice over everything else

In every 20 ms frame where the voice is sounding ({ws['voiced_frames']} frames at 1×), the voice sits above music and effects combined by at least **{ws['min_db']:.1f} dB** in the speech band (200 Hz–5 kHz). The 1st percentile is {ws['p1_db']:.1f} dB and the median is {ws['median_db']:.1f} dB. Music sits 23 dB under the voice while it talks and comes up to 11 dB under it in pauses.

## Bleep

S22, the word "piss" in "pack your bags and piss off back to Pakistan". The bleep covers {MIX['bleep']['in_take'][0]}–{MIX['bleep']['in_take'][1]} s inside the take ({MIX['bleep']['start_1x'] / SPEED:.2f}–{MIX['bleep']['end_1x'] / SPEED:.2f} s on the master). Its edges were measured on the waveform: the "p" release, through the end of the "ss", stopping before "off". The tone is a {MIX['bleep']['tone']}. A Whisper pass over the bleeped mix no longer transcribes the word. The card on screen reads "p*ss".

## Delivered file `final/lf03-hanson.mp4`

{v['width']}×{v['height']}, {v['r_frame_rate'].split('/')[0]} fps, {v['codec_name']}; audio {a['codec_name']} {AUDIO_K} kbit/s, {a['sample_rate']} Hz, {a['channels']} channels. Length {fdur:.2f} s ({mmss(fdur)}). Size {size_mb:.1f} MB.

ffmpeg ebur128 on the delivered file:

```
{eb}
```
""")

# ------------------------------------------------------------------ cue sheet
cues = json.load(open(os.path.join(B, 'cues.json')))
with open(os.path.join(EP, 'CUE_SHEET.md'), 'w') as f:
    f.write('# lf03 cue sheet\n\nTimes on the 1.28× master (1× in brackets). Every cue here is the one the mix used (`render/mix.py` writes it).\n\n'
            '| Kind | In | Out | What | Why |\n|---|---|---|---|---|\n')
    for kind, t0, t1, what, why in sorted(cues, key=lambda c: c[1]):
        f.write(f'| {kind} | {mmss(t0 / SPEED)} ({t0:.1f}) | {mmss(t1 / SPEED)} ({t1:.1f}) | {what} | {why} |\n')
    f.write('\nThe gavel (Pixabay Content License, "Gavel of Justice" by IntrepidMedia) is used once, on the QUASHED beat after S16. Credit it in the description with the line in `audio/MUSIC_CREDITS.md`. The service bell is not used. There is no siren and no stamp sound.\n')
print(f'master {fdur:.2f} s, {size_mb:.1f} MB, video {VIDEO_K} kbit/s')
print(eb)
