"""Lock the lf02 cut to the real words.

Takes V01..V36 (incl. V16b) are placed end to end with the edit gaps from script Part 3. Where Part 3 marks
no gap, a 0.4 s breath seam keeps two takes from touching (0.9 s at the Act 1 -> Act 2 seam so the
cliffhanger sting has room). The take files are never modified.

VO EDITS (placement only, files untouched): two seated takes contain spoken delivery instructions that are
not Part 4 narration. They are skipped by playing only the clean parts of the take:
  V27 "After the first sentence, hold a clear pause before continuing,"  -> play 0-3.70 s and 8.20 s-end
  V31 "Australian accent."                                               -> play 2.10 s-end
Both cut points sit in room tone (below -65 dBFS).

Picture: every B-roll clip and full-screen photo is placed on a Whisper word (chunk-local seconds), in Part 3
order, never longer than its Part 3 length. Map shots fill everything else.
Writes render/timeline.json (scenes.js, mix, compose) and ../transcript.json.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
raw = json.load(open(os.path.join(HERE, 'whisper-raw.json')))
KEYS = [f'V{i:02d}' for i in range(1, 17)] + ['V16b'] + [f'V{i:02d}' for i in range(17, 37)]

SEAM = 0.4
END_SCREEN = 10.0
CUTS = {'V27': [(0.0, 3.70), (8.20, None)], 'V31': [(2.10, None)]}
# gap BEFORE each chunk (what fills it)
GAP = {
    'V01': (0.8, 'lead-in: B01 frame 1, oars and drone before the first word'),
    'V02': (1.0, 'gap 1 s after V01 ("lost")'),
    'V05': (2.5, 'gap 2.5 s: "IF AUSTRALIA..." title + series sting'),
    'V12': (1.5, 'gap 1.5 s after V11: underwater boom, then silence'),
    'V13': (0.9, 'act seam: cliffhanger sting (Act 1 -> Act 2)'),
    'V17': (1.0, 'gap 1 s after V16b'),
    'V19': (1.0, 'gap 1 s after V18'),
    'V22': (2.0, 'gap 2 s after V21 (strings only), then MID-ROLL 1 hold'),
    'V28': (1.5, 'gap 1.5 s after V27 cliffhanger sting, then MID-ROLL 2 hold'),
    'V35': (1.5, 'gap 1.5 s after V34'),
    'V36': (2.0, 'gap 2 s after V35'),
}

# B-roll: (id, chunk, local start, seconds, entry, exit, pin [lon, lat], note)
#   entry: cut (frame 1) | iris (zoom-through out of the pin) | fade (soft dissolve over the previous clip/photo)
#   exit : iris (shrinks back into the pin) | fade (dissolves to the full-screen photo under it) | hold (next clip dissolves over it)
PINS = {
    'cove': [26.2775, 40.2465], 'plateau': [26.2830, 40.2510], 'entrance': [26.215, 40.02], 'somme': [2.68, 49.93],
    'narrows': [26.385, 40.135], 'erenkoy': [26.335, 40.075], 'forts': [26.372, 40.142], 'offcove': [26.245, 40.240],
    'ridge': [26.3105, 40.2635], 'sub': [26.62, 40.375], 'quinns': [26.2930, 40.2560], 'chunuk': [26.3135, 40.2705],
    'beach': [26.2780, 40.2440], 'lonepine': [26.2885, 40.2305], 'constantinople': [28.975, 41.01],
    'russia': [24.0, 53.0], 'rail': [37.6, 55.75], 'mideast': [38.5, 31.5], 'nsw': [149.58, -33.42],
    'canberra': [149.149, -35.281], 'anatolia': [32.0, 39.6], 'australia': [149.13, -35.28],
}
BROLL = [
    ('B01', 'V01', -0.8, 7.0, 'cut', 'iris', 'cove', 'boats to the cliffs before dawn; pulls back into M01 through the cove pin'),
    ('B02', 'V02', 5.9, 6.6, 'iris', 'iris', 'plateau', 'lone soldier on the clifftop'),
    ('B03', 'V04', 10.6, 8.0, 'iris', 'iris', 'entrance', 'battleships through the strait'),
    ('B04', 'V05', 11.2, 5.0, 'iris', 'iris', 'somme', 'Western Front trench in rain'),
    ('B05', 'V07', 13.7, 6.0, 'iris', 'iris', 'narrows', 'aerial glide along the strait, forts'),
    ('B06', 'V09', 0.9, 7.0, 'iris', 'iris', 'entrance', 'fleet steaming into the strait'),
    ('B07', 'V10', 2.6, 7.5, 'iris', 'iris', 'erenkoy', 'minelayer at night'),
    ('B08', 'V11', 0.3, 4.5, 'iris', 'fade', 'erenkoy', 'battleship heeling over'),
    ('B09', 'V12', 0.4, 7.0, 'iris', 'iris', 'forts', 'fort gun, few shells'),
    ('B10', 'V13', 7.0, 4.6, 'iris', 'hold', 'offcove', 'rowing boats and pinnaces before dawn'),
    ('B11', 'V14', None, 5.5, 'fade', 'fade', 'cove', 'cliffs and beach, boats grinding ashore'),
    ('B12', 'V16', 4.9, 7.0, 'iris', 'iris', 'ridge', 'Ottoman soldiers up the ridge'),
    ('B12b', 'V16b', 11.2, 7.6, 'iris', 'iris', 'sub', 'submarine low in the strait at dawn'),
    ('B13', 'V17', 0.0, 4.6, 'iris', 'iris', 'quinns', 'hillside trench, midday heat'),
    ('B14', 'V17', 10.6, 4.5, 'iris', 'iris', 'quinns', 'same trenches, night snowstorm'),
    ('B15', 'V18', 7.6, 7.0, 'iris', 'iris', 'chunuk', 'summit at dawn, strait in the distance'),
    ('B16', 'V19', 2.3, 6.0, 'iris', 'hold', 'offcove', 'night sea, ships offshore'),
    ('B17', 'V20', None, 5.9, 'fade', 'fade', 'beach', 'drip tins and rifle by candlelight'),
    ('B18', 'V20', 7.9, 5.0, 'fade', 'iris', 'beach', 'soldiers filing down to the beach at night'),
    ('B19', 'V21', 0.3, 5.7, 'iris', 'fade', 'lonepine', 'white grave markers above the sea'),
    ('B20', 'V22', 8.8, 4.4, 'iris', 'hold', 'narrows', 'warships through the strait, bright sun (what-if)'),
    ('B21', 'V23', None, 4.6, 'fade', 'iris', 'constantinople', 'domes and minarets, warships offshore (what-if)'),
    ('B22', 'V25', 3.0, 4.0, 'iris', 'fade', 'russia', 'Russian soldiers in a snowy trench'),
    ('B23', 'V26', 9.8, 3.4, 'iris', 'hold', 'rail', 'empty freight wagons, snowy yard'),
    ('B24', 'V27', None, 4.0, 'fade', 'iris', 'mideast', 'desert railway and telegraph poles'),
    ('B25', 'V28', 0.3, 6.0, 'iris', 'iris', 'cove', 'slouch hat and water bottle, candlelight'),
    ('B26', 'V29', 9.9, 8.0, 'iris', 'fade', 'nsw', 'country-town crowd at a newspaper office'),
    ('B27', 'V30', 3.1, 5.5, 'fade', 'iris', 'canberra', 'dawn crowd with candles, lone bugler (warm)'),
    ('B28', 'V31', 7.3, 5.0, 'iris', 'iris', 'australia', 'old textbook pages turning'),
    ('B29', 'V32', 12.8, 6.0, 'iris', 'iris', 'anatolia', 'Anatolian hills at sunrise'),
    ('B30', 'V33', 15.9, 8.0, 'iris', 'fade', 'cove', 'dawn crowd on a beach (warm)'),
    ('B31', 'V34', 4.5, 6.0, 'fade', 'iris', 'cove', 'red wildflowers on a clifftop (warm)'),
    ('B32', 'V35', 9.4, 8.0, 'iris', 'iris', 'cove', 'waves on a pebbly beach at sunrise (warm)'),
]
PART3_LEN = {'B01': 7, 'B02': 7, 'B03': 8, 'B04': 7, 'B05': 8, 'B06': 8, 'B07': 8, 'B08': 5, 'B09': 7, 'B10': 9, 'B11': 6,
             'B12': 7, 'B12b': 8, 'B13': 8, 'B14': 6, 'B15': 8, 'B16': 6, 'B17': 6, 'B18': 6, 'B19': 6, 'B20': 7, 'B21': 8,
             'B22': 7, 'B23': 4, 'B24': 7, 'B25': 6, 'B26': 8, 'B27': 8, 'B28': 5, 'B29': 6, 'B30': 8, 'B31': 6, 'B32': 8}
DISSOLVE = 0.5
# full-screen Ken Burns photos (drawn in the map plate): (id, chunk, local start, seconds incl. any dissolve overlap)
KB = [
    ('IMG03', 'V11', 4.3, 4.0, 'HMS Irresistible, 18 March 1915. Real photo.'),
    ('IMG01', 'V14', None, None, 'Anzac Cove, 25 April 1915'),   # follows B11; ends in the photo-to-map morph at 9.4
    ('IMG10', 'V20', None, None, 'The real "drip rifle".'),     # between B17 and B18
    ('IMG18', 'V21', None, None, 'Lone Pine Cemetery, Gallipoli, 2012'),
    ('IMG13', 'V25', None, None, 'Petrograd, 1917. Real photo.'),
    ('IMG15', 'V30', None, None, 'Anzac Day, 1916.'),
    ('IMG17', 'V34', None, None, 'Memorial at Arı Burnu, 2012'),
]
KB_END = {'IMG01': ('V14', 9.4), 'IMG18': ('V21', 10.0)}

# ------------------------------------------------------------------ place takes
t = 0.0
chunks = {}
for k in KEYS:
    before, why = GAP.get(k, (SEAM, 'seam'))
    t += before
    segs = CUTS.get(k, [(0.0, None)])
    dur_full = raw[k]['duration']
    play, words, acc = [], [], 0.0
    for a, b in segs:
        b = dur_full if b is None else b
        play.append({'src': a, 'len': round(b - a, 3), 'at': round(t + acc, 3)})
        for w in raw[k]['words']:
            if w['start'] >= a - 0.02 and w['end'] <= b + 0.05:
                words.append({'w': w['word'], 's': round(t + acc + w['start'] - a, 3), 'e': round(t + acc + w['end'] - a, 3)})
        acc += b - a
    chunks[k] = {'start': round(t, 3), 'end': round(t + acc, 3), 'dur': round(acc, 3), 'gapBefore': before, 'why': why,
                 'play': play, 'words': words, 'cut': k in CUTS}
    t += acc
marks = {'endScreen': round(t + 0.4, 3)}
total = round(t + 0.4 + END_SCREEN, 3)
marks['midroll1'] = chunks['V22']['start']
marks['midroll2'] = chunks['V28']['start']
marks['title'] = chunks['V04']['end'] + 0.05
for name, k in (('act1', 'V05'), ('act2', 'V13'), ('act3', 'V22'), ('act4', 'V28')):
    marks[name] = chunks[k]['start']

# ------------------------------------------------------------------ B-roll times
broll = []
prev = None
for bid, k, loc, d, ent, ext, pin, note in BROLL:
    assert d <= PART3_LEN[bid] + 1e-6, bid
    if loc is None:   # dissolves over the previous clip
        tin = prev['tOut'] - DISSOLVE
    else:
        tin = chunks[k]['start'] + loc
    if bid == 'B01':
        tin = 0.0
    b = {'id': bid, 'chunk': k, 'tIn': round(tin, 3), 'tOut': round(tin + d, 3), 'dur': d, 'part3': PART3_LEN[bid],
         'entry': ent, 'exit': ext, 'pin': pin, 'lon': PINS[pin][0], 'lat': PINS[pin][1], 'note': note,
         'warm': bid in ('B27', 'B30', 'B31', 'B32')}
    broll.append(b)
    prev = b
B = {b['id']: b for b in broll}
# KB photo windows: from the clip/map before to the clip/map after
kb = []
def S(k): return chunks[k]['start']
spec = {
    'IMG03': (S('V11') + 4.3, S('V11') + 8.3),
    'IMG01': (B['B11']['tOut'] - DISSOLVE, S('V14') + 9.4),
    'IMG10': (B['B17']['tOut'] - DISSOLVE, B['B18']['tIn'] + DISSOLVE),
    'IMG18': (B['B19']['tOut'] - DISSOLVE, S('V21') + 10.0),
    'IMG13': (B['B22']['tOut'] - DISSOLVE, S('V25') + 11.0),
    'IMG15': (B['B26']['tOut'] - DISSOLVE, B['B27']['tIn'] + DISSOLVE),
    'IMG17': (B['B30']['tOut'] - DISSOLVE, B['B31']['tIn'] + DISSOLVE),
}
for pid, k, _, _, cap in KB:
    a, z = spec[pid]
    kb.append({'id': pid, 'chunk': k, 't0': round(a, 3), 't1': round(z, 3), 'caption': cap})
for x in kb:
    full = x['t1'] - x['t0'] - (DISSOLVE if x['id'] in ('IMG10', 'IMG15', 'IMG17') else 0)
    x['visible'] = round(full, 2)

# sanity: no two iris clips overlap; dissolves chain correctly
for a, b in zip(broll, broll[1:]):
    if b['entry'] == 'fade' and a['exit'] == 'hold':
        assert abs(b['tIn'] - (a['tOut'] - DISSOLVE)) < 1e-6
    elif b['tIn'] < a['tOut'] + 0.6 and not (b['entry'] == 'fade'):
        raise SystemExit(f'too close: {a["id"]} -> {b["id"]}')

tl = {'duration': total, 'fps': 30, 'chunks': chunks, 'marks': marks, 'broll': broll, 'kb': kb, 'pins': PINS, 'dissolve': DISSOLVE}
json.dump(tl, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
allw = [{'word': w['w'], 'start': w['s'], 'end': w['e'], 'chunk': k} for k, c in chunks.items() for w in c['words']]
json.dump({'duration': total, 'words': allw}, open(os.path.join(HERE, '..', 'transcript.json'), 'w'), indent=1)


def mmss(x):
    return f'{int(x // 60)}:{x % 60:05.2f}'


vo = sum(c['dur'] for c in chunks.values())
gaps = sum(c['gapBefore'] for c in chunks.values())
print(f'VO {mmss(vo)}  gaps+seams {gaps:.1f}s  end screen {END_SCREEN}s  TOTAL {mmss(total)}  master(1.28x) {mmss(total / 1.28)}')
for k, c in chunks.items():
    print(k, mmss(c['start']), '-', mmss(c['end']), c['why'] if c['why'] != 'seam' else '')
for k, v in marks.items():
    print(k, mmss(v))
bt = sum(b['dur'] for b in broll)
print(f'B-roll {bt:.1f}s ({100 * bt / total:.0f}%)  KB {sum(x["t1"] - x["t0"] for x in kb):.1f}s')
for b in broll:
    print(b['id'], mmss(b['tIn']), '-', mmss(b['tOut']), f"{b['dur']}/{b['part3']}s", b['entry'], '->', b['exit'], b['pin'])
for x in kb:
    print(x['id'], mmss(x['t0']), '-', mmss(x['t1']), x['visible'])
