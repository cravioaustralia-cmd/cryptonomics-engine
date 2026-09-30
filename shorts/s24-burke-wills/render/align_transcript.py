"""Align vo_script.md wording onto Whisper word timings → transcript.json.
Whisper (faster-whisper small.en, word_timestamps) supplies timing only; every
caption word comes from the script (fixes e.g. "Two weeks" → "Too weak").
Usage: python3 render/align_transcript.py <whisper_raw.json>
"""
import json, re, sys, difflib, os
EP = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
raw = json.load(open(sys.argv[1]))
ww = raw['words']
txt = open(os.path.join(EP, 'vo_script.md')).read().split('---', 1)[1]
script = []
for l in txt.splitlines():
    l = l.strip()
    if l.startswith('('):
        script += re.sub(r'^\([^)]*\)\s*', '', l).split()
norm = lambda s: re.sub(r"[^a-z0-9]", '', s.lower().replace('’', "'"))
a = [norm(w['word']) for w in ww]
b = [norm(w) for w in script]
out = [None] * len(script)
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(j2 - j1):
            out[j1 + k] = (ww[i1 + k]['start'], ww[i1 + k]['end'])
    elif tag == 'replace' or (tag == 'insert'):
        if i2 > i1:
            s, e = ww[i1]['start'], ww[i2 - 1]['end']
        else:  # insert: squeeze between neighbours
            s = ww[i1 - 1]['end'] if i1 > 0 else 0.0
            e = ww[i1]['start'] if i1 < len(ww) else s + 0.3
        n = j2 - j1
        for k in range(n):
            out[j1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)
        print(f"{tag}: whisper {[w['word'] for w in ww[i1:i2]]} -> script {script[j1:j2]}")
    elif tag == 'delete':
        print(f"delete (whisper only): {[w['word'] for w in ww[i1:i2]]}")
words = []
prev = 0.0
for w, (s, e) in zip(script, out):
    s = max(s, prev); e = max(e, s + 0.06)
    words.append({'word': w, 'start': round(s, 3), 'end': round(e, 3)})
    prev = s + 0.02
json.dump({'duration': raw['duration'], 'source': 'faster-whisper small.en word timings on audio/vo.mp3; words from vo_script.md (align_transcript.py)', 'words': words}, open(os.path.join(EP, 'transcript.json'), 'w'), indent=1)
print(len(words), 'words; last', words[-1])
