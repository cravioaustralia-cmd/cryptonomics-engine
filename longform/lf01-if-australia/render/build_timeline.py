"""Lock the cut to the real words: place V01..V34 end to end with the script's edit gaps.

Gaps come from script Part 2 ("Edit gap" lines). Where Part 2 marks no gap, a 0.4 s breath
seam is used so two takes never collide (not an edit gap; nothing plays in it but the bed).
Writes render/timeline.json (absolute word times for scenes.js + mix) and ../transcript.json.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
raw = json.load(open(os.path.join(HERE, 'whisper-raw.json')))

LEAD_IN = 0.6      # frame 1 already moving; drone + dive before the first word
SEAM = 0.4         # breath seam where Part 2 marks no gap
END_SCREEN = 10.0  # script: end screen 10 s

# (chunk, gap BEFORE it in seconds, label of what fills that gap)  — gap AFTER is the next row's "before"
PLAN = [
    ('V01', LEAD_IN, 'lead-in: drone, dive from space'),
    ('V02', 1.0, 'gap 1 s: boom rings out, pull back'),
    ('V03', 1.0, 'gap 1 s: silence after REJECTED'),
    ('V04', 1.5, 'gap 1.5 s: music swells back in'),
    ('V05', 2.5, 'gap 2.5 s: IF AUSTRALIA... title + series sting'),
    ('V06', SEAM, 'seam'),
    ('V07', 2.0, 'gap 2 s: B02 finishes, pull back'),
    ('V08', SEAM, 'seam'),
    ('V09', 2.5, 'gap 2.5 s: siren fades, pull back, map desaturates briefly'),
    ('V10', 1.0, 'gap 1 s'),
    ('V11', SEAM, 'seam'),
    ('V12', 1.5 + 1.0, 'gap 1.5 s after cliffhanger sting | MID-ROLL 1 | gap 1 s: big "1" + whoosh + drum'),
    ('V13', SEAM, 'seam'),
    ('V14', 1.0, 'gap 1 s'),
    ('V15', SEAM, 'seam'),
    ('V16', 1.5, 'gap 1.5 s: desert wind, B05 out'),
    ('V17', SEAM, 'seam'),
    ('V18', SEAM, 'seam'),
    ('V19', 1.5 + 1.0, 'gap 1.5 s after verdict | gap 1 s: big "2" + heavier drum'),
    ('V20', SEAM, 'seam'),
    ('V21', 1.0, 'gap 1 s: B07 out, sonar'),
    ('V22', 1.5, 'gap 1.5 s: B08 out'),
    ('V23', SEAM, 'seam'),
    ('V24', 1.5, 'gap 1.5 s: B09 out, strings'),
    ('V25', 1.5 + 1.0, 'gap 1.5 s after cliffhanger sting | MID-ROLL 2 | gap 1 s: big "3" + heaviest hit'),
    ('V26', SEAM, 'seam'),
    ('V27', 2.0, 'gap 2 s: cable snap, near silence, low wind'),
    ('V28', SEAM, 'seam'),
    ('V29', 1.0, 'gap 1 s: line stops at ~40 km'),
    ('V30', 1.5, 'gap 1.5 s: lifeline redrawn, music lifts'),
    ('V31', 2.0, 'gap 2 s: music resolves and holds'),
    ('V32', SEAM, 'seam'),
    ('V33', 1.0, 'gap 1 s: B12 out'),
    ('V34', 1.5, 'gap 1.5 s'),
]

t = 0.0
chunks = {}
marks = {}
for k, before, why in PLAN:
    if k == 'V12':
        marks['midroll1'] = t + 1.5
        marks['slam1'] = t + 1.5
    if k == 'V19':
        marks['slam2'] = t + 1.5
    if k == 'V25':
        marks['midroll2'] = t + 1.5
        marks['slam3'] = t + 1.5
    t += before
    d = raw[k]['duration']
    words = [{'w': w['word'], 's': round(t + w['start'], 3), 'e': round(t + w['end'], 3)} for w in raw[k]['words']]
    chunks[k] = {'start': round(t, 3), 'end': round(t + d, 3), 'dur': d, 'gapBefore': before, 'why': why, 'words': words}
    t += d
marks['endScreen'] = t + 0.4
total = round(t + 0.4 + END_SCREEN, 3)
marks['act1'] = chunks['V05']['start']
marks['act5'] = chunks['V31']['start']

import re


def norm(x):
    return re.sub(r'[^a-z0-9]', '', x.lower())


broll = []
for b in json.load(open(os.path.join(HERE, 'broll_plan.json'))):
    c = chunks[b['chunk']]
    if 'word' in b:
        hits = [w['s'] for w in c['words'] if norm(w['w']).startswith(norm(b['word']))]
        tin = hits[b.get('occ', 0)] + b.get('off', 0)
    else:
        tin = c['start'] + b['local']
    broll.append(dict(b, tIn=round(tin, 3), tOut=round(tin + b['dur'], 3)))
for a, b in zip(broll, broll[1:]):
    assert a['tOut'] + 1.0 < b['tIn'], (a['id'], b['id'])
tl = {'duration': total, 'fps': 30, 'chunks': chunks, 'marks': marks, 'broll': broll}
json.dump(tl, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
allw = [{'word': w['w'], 'start': w['s'], 'end': w['e'], 'chunk': k} for k, c in chunks.items() for w in c['words']]
json.dump({'duration': total, 'words': allw}, open(os.path.join(HERE, '..', 'transcript.json'), 'w'), indent=1)


def mmss(x):
    return f'{int(x // 60)}:{x % 60:05.2f}'


vo = sum(c['dur'] for c in chunks.values())
gaps = sum(c['gapBefore'] for c in chunks.values())
print(f'VO {mmss(vo)}  gaps+seams {gaps:.1f}s  end screen {END_SCREEN}s  TOTAL {mmss(total)}')
for k, c in chunks.items():
    print(k, mmss(c['start']), '-', mmss(c['end']))
for k, v in marks.items():
    print(k, mmss(v))
for b in broll:
    print(b['id'], mmss(b['tIn']), '-', mmss(b['tOut']), b['note'])
