#!/usr/bin/env python3
"""Clean faster-whisper (medium.en, word timestamps) output → transcript.json.
Spellings follow script.md (Australian English); timings stay Whisper's."""
import json, os
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
raw = json.load(open(os.path.join(EP, 'render', 'whisper.raw.json')))
w = raw['words']
out = []
i = 0
while i < len(w):
    a = dict(w[i])
    if a['word'] == '5' and i + 1 < len(w) and w[i + 1]['word'].startswith(',000'):
        a['word'] = '5,000'; a['end'] = w[i + 1]['end']; i += 1
    out.append(a); i += 1
# Whisper dropped "rest of his life." (second pass on 83.4–86.6 s clip recovered it)
k = next(j for j, x in enumerate(out) if x['word'] == 'the' and abs(x['start'] - 84.68) < 0.05)
out[k]['end'] = 84.76
patch = [('rest', 84.76, 84.98), ('of', 84.98, 85.12), ('his', 85.12, 85.24), ('life.', 85.24, 85.64)]
out[k + 1:k + 1] = [dict(word=a, start=b, end=c) for a, b, c in patch]
fix = {'baby,': 'baby…', 'sea,': 'sea.', 'brand': 'brand-new', 'Navy': 'navy', 'with...': 'with…',
       'night': 'night,', 'it': 'it…', 'pardoned': 'pardoned…', 'nerve,': 'nerve…', 'later': 'later,'}
res = []
for x in out:
    if x['word'] == 'new' and res and res[-1]['word'] == 'brand-new':
        res[-1]['end'] = x['end']; continue
    if x['word'] == '11': x['word'] = 'Eleven'
    if x['word'] == 'If': x['start'] = 85.92
    if x['word'] == 'it' and abs(x['start'] - 57.52) > 0.05: pass
    elif x['word'] in fix: x['word'] = fix[x['word']]
    if x['word'] == 'Harbour,': x['word'] = 'Harbour.'
    res.append(x)
json.dump({'duration': 96.12, 'source': 'faster-whisper medium.en word timestamps on audio/vo.mp3 (held Atlas en-AU)',
           'words': res}, open(os.path.join(EP, 'transcript.json'), 'w'), indent=1)
print(' '.join(x['word'] for x in res))
