"""Snap Whisper words (render/whisper-raw.json) to the script's spelling/punctuation → ../transcript.json.
Timings are Whisper's; merged tokens (e.g. '61 -year -old', '$10 ,000') take first start / last end."""
import json, re, difflib
raw = json.load(open('render/whisper-raw.json'))
W = raw['raw']
# merge Whisper split tokens
m = []
for w in W:
    if m and (w['word'].startswith('-') or w['word'].startswith(',0')):
        m[-1] = {**m[-1], 'word': m[-1]['word'] + w['word'], 'end': w['end']}
    else:
        m.append(dict(w))
txt = open('script.md').read().split('## Spoken script')[1].split('## Visual gags')[0]
txt = re.sub(r'\([^)]*\)', ' ', txt)
S = txt.split()
norm = lambda s: re.sub(r"[^a-z0-9$]", '', s.lower().replace('fifties', '50s').replace('five', '5').replace('four', '4'))
a = [norm(x['word']) for x in m]
b = [norm(x) for x in S]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
out = []
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == 'equal':
        for k in range(i2 - i1):
            out.append({'word': S[j1 + k], 'start': m[i1 + k]['start'], 'end': m[i1 + k]['end']})
    else:
        print('DIFF', op, [x['word'] for x in m[i1:i2]], S[j1:j2])
        if i2 > i1 and j2 > j1:
            st, en = m[i1]['start'], m[i2 - 1]['end']
            n = j2 - j1
            for k in range(n):
                out.append({'word': S[j1 + k], 'start': round(st + (en - st) * k / n, 3), 'end': round(st + (en - st) * (k + 1) / n, 3)})
for w in out:
    w['word'] = w['word'].replace('’', "'")
json.dump({'duration': 87.336, 'source': 'faster-whisper medium.en word timestamps on audio/vo.mp3; spelling snapped to script.md',
           'words': out}, open('transcript.json', 'w'), indent=1)
print(len(out), 'words →  transcript.json')
