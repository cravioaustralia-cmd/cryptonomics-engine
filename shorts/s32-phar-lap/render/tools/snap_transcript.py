"""Snap Whisper words (render/whisper-raw.json) to script.md spelling/punctuation → transcript.json.
Timing is Whisper's (held audio/vo.mp3, never modified). Replaced spans keep Whisper's span."""
import json, re, difflib, subprocess
raw = json.load(open('render/whisper-raw.json'))
m = [dict(w) for w in raw['raw']]
txt = open('script.md').read().split('## Spoken script')[1].split('## Visual gags')[0]
txt = re.sub(r'\([^)]*\)', ' ', txt).replace('…', '… ')
S = txt.split()
norm = lambda s: re.sub(r"[^a-z0-9]", '', s.lower().replace('’', "'"))
a = [norm(x['word']) for x in m]
b = [norm(x) for x in S]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
out = []
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == 'equal':
        for k in range(i2 - i1):
            out.append({'word': S[j1 + k], 'start': m[i1 + k]['start'], 'end': m[i1 + k]['end']})
    else:
        print('DIFF', op, [(x['word'], x['start'], x['end']) for x in m[i1:i2]], S[j1:j2])
        assert i2 > i1 and j2 > j1, 'unhandled insert/delete'
        st, en = m[i1]['start'], m[i2 - 1]['end']
        n = j2 - j1
        for k in range(n):
            out.append({'word': S[j1 + k], 'start': round(st + (en - st) * k / n, 3), 'end': round(st + (en - st) * (k + 1) / n, 3)})
for w in out:
    w['word'] = w['word'].replace('’', "'")
# Whisper returned a zero-length "1926." (7.90-7.90). ffmpeg silencedetect (-38 dB, 0.12 s) on the held VO puts
# the spoken year at 7.01-7.95 s, between the 6.74 s and 8.72 s words. Only that one word's span is set here.
for w in out:
    if w['word'] == '1926.' and w['end'] - w['start'] < 0.05:
        w['start'], w['end'] = 7.01, 7.95
# the VO begins at 0.087 s (silencedetect); Whisper pins the first word to 0.00
if out[0]['start'] < 0.087:
    out[0]['start'] = 0.087
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'audio/vo.mp3']).decode())
json.dump({'duration': dur, 'source': 'faster-whisper medium.en word timestamps on held audio/vo.mp3 (not modified); spelling snapped to script.md',
           'words': out}, open('transcript.json', 'w'), indent=1)
print(len(out), 'words → transcript.json; duration', dur)
