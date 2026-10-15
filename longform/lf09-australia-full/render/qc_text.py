#!/usr/bin/env python3
"""Check every on-screen quotation and number in the scene code against the production script (Parts 5, 7, 9)."""
import re, os, json
R = os.path.dirname(os.path.abspath(__file__)); EP = os.path.dirname(R)
script = open(os.path.join(EP, 'script', 'PRODUCTION_SCRIPT.txt')).read()
flat = re.sub(r'\s+', ' ', script.replace('’', "'").replace('‘', "'"))
flat_nows = re.sub(r'\s+', '', flat)
src = ''.join(open(os.path.join(R, f)).read() for f in ['scenes_a.js', 'scenes_b.js', 'scenes_c.js'])
# strip code-only regions: we only look inside string literals
lits = re.findall(r"'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`", src)
texts = [a or b for a, b in lits]
texts = [re.sub(r'\$\{[^}]*\}', ' ', x) for x in texts]
texts = [re.sub(r'<[^>]+>', ' ', x) for x in texts]
quotes = set(); nums = set()
for x in texts:
    for q in re.findall(r'“([^”]+)”', x): quotes.add(q.strip())
    for n in re.findall(r'(?<![\w#.-])[−-]?\d[\d,]*(?:\.\d+)?%?', x): nums.add(n)
res = {'quotes': {}, 'numbers_not_in_script': []}
for q in sorted(quotes):
    k = re.sub(r'\s+', '', q.replace('’', "'").replace('…', '...'))
    ok = k in flat_nows.replace('…', '...')
    res['quotes'][q] = ok
CSS_OK = set()
for n in sorted(nums):
    core = n.replace('−', '-').lstrip('-').rstrip('%')
    if core in ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'): continue  # ordinals/labels (rank numbers, tile counts)
    if core not in flat: res['numbers_not_in_script'].append(n)
json.dump(res, open(os.path.join(R, 'data', 'qc_text.json'), 'w'), indent=1, ensure_ascii=False)
bad = [q for q, ok in res['quotes'].items() if not ok]
print('quotes checked', len(res['quotes']), 'not verbatim in script:', bad)
print('numbers not found in script text:', res['numbers_not_in_script'])
