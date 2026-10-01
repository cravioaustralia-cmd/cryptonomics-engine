#!/usr/bin/env python3
"""Clean faster-whisper (medium.en, word timestamps) output -> ../transcript.json.
Spellings/punctuation follow script.md (Australian English); timings stay Whisper's."""
import json, os
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
raw = json.load(open(os.path.join(EP, 'render', 'whisper.raw.json')))
out = []
for w in raw['words']:
    w = dict(w)
    if w['word'] == ',000' and out and out[-1]['word'] == '18':
        out[-1]['word'] = '18,000'; out[-1]['end'] = w['end']; continue
    out.append(w)
fix = {'Australia.': 'Australia…', 'copilot.': 'co-pilot.', 'birds,': 'birds…', 'kilometres': 'kilometres…',
       'Hustling': '“Hustling', 'Hinkler.': 'Hinkler”.', 'London': 'London…', 'Florence,': 'Florence…',
       "today's": 'today’s', "He's": 'He’s', "Italy's": 'Italy’s', "That's": 'That’s', 'plane': 'plane,'}
for i, w in enumerate(out):
    k = w['word']
    if k == 'Hinkler.' and i > 0 and not out[i - 1]['word'].endswith('Hustling'):
        continue
    if k == 'birds,' and w['start'] < 16: continue        # "watches birds…" only
    if k == 'London' and w['start'] < 60: continue
    if k == 'plane' and w['start'] < 60: continue          # "crashed plane, on a mountain"
    if k in fix: w['word'] = fix[k]
out[-1]['word'] = 'with…'
json.dump({'duration': raw['duration'],
           'source': 'faster-whisper medium.en word timestamps on audio/vo.mp3 (held Atlas en-AU, 91.25 s)',
           'words': out}, open(os.path.join(EP, 'transcript.json'), 'w'), indent=1, ensure_ascii=False)
print(' '.join(x['word'] for x in out))
