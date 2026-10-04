"""Snap Whisper words (render/whisper-raw.json) to script.md spelling/punctuation → transcript.json.
Timing is Whisper's. Merged tokens ('2 ,700') take first start / last end. Whisper insertions are dropped
(logged); replaced spans are spread evenly over Whisper's span."""
import json, re, difflib
raw = json.load(open('render/whisper-raw.json'))
m = []
for w in raw['raw']:
    if m and (w['word'].startswith(',') or w['word'].startswith('-')):
        m[-1] = {**m[-1], 'word': m[-1]['word'] + w['word'], 'end': w['end']}
    else:
        m.append(dict(w))
txt = open('script.md').read().split('## Spoken script')[1].split('## Visual gags')[0]
txt = re.sub(r'\([^)]*\)', ' ', txt)
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
        if i2 > i1 and j2 > j1:
            st, en = m[i1]['start'], m[i2 - 1]['end']
            n = j2 - j1
            for k in range(n):
                out.append({'word': S[j1 + k], 'start': round(st + (en - st) * k / n, 3), 'end': round(st + (en - st) * (k + 1) / n, 3)})
        elif j2 > j1:
            # script words Whisper skipped: place them in the gap after the previous word
            st = out[-1]['end'] if out else 0.0
            en = m[i1]['start'] if i1 < len(m) else raw['duration']
            en = min(en, st + 0.45 * (j2 - j1))
            n = j2 - j1
            for k in range(n):
                out.append({'word': S[j1 + k], 'start': round(st + (en - st) * k / n, 3), 'end': round(st + (en - st) * (k + 1) / n, 3)})
for w in out:
    w['word'] = w['word'].replace('’', "'")
# Manual seam (checked with silencedetect): Whisper folded 'mothers.' into 'their'; speech ends at 24.93 s.
for i, w in enumerate(out):
    if w['word'] == 'mothers.':
        out[i - 1].update(start=24.36, end=24.52)
        w.update(start=24.52, end=24.93)
json.dump({'duration': 94.392, 'source': 'faster-whisper medium.en word timestamps on held audio/vo.mp3 (not modified); spelling snapped to script.md',
           'words': out}, open('transcript.json', 'w'), indent=1)
print(len(out), 'words → transcript.json')
