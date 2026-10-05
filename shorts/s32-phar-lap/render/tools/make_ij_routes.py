"""Load the prior Impossible Journeys polylines from the repo (never retyped) -> render/assets/ij_routes.js.
  ep.1 Mary Bryant    : 3db0f94:shorts/s27-bert-hinkler/render/geo.json  key mary.escape
  ep.2 Bert Hinkler   : 3db0f94:shorts/s27-bert-hinkler/render/geo.json  key routes.flight
  ep.4 Robyn Davidson : origin/claude/s28-robyn-davidson-map-gwcpin:shorts/s28-robyn-davidson/render/scenes.js const WAY
  ep.5 Rabbit-Proof Fence (the 1931 walk): origin/claude/model-opus-v3027k:shorts/s30-rabbit-proof-fence/render/scenes.js
        const WALKP (P.* refs resolved from the same file's const P). The fence line itself is not used.
  ep.6 Mawson         : origin/claude/model-opus-exnwqa:shorts/s31-mawson/render/scenes.js const OUTP (to the fall)
        + const RETP (back to base); named points BASE / MZ / MC resolved from the same file.
No episode 3 exists. s29 is not in this series. Fetch those refs first:
  git fetch origin claude/model-opus-8eaepb claude/s28-robyn-davidson-map-gwcpin claude/model-opus-v3027k claude/model-opus-exnwqa"""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
show = lambda spec: subprocess.check_output(['git', 'show', spec], cwd=HERE).decode()


def js_array(src, name):
    return re.search(r'const ' + name + r' = (\[.*?\]);', src, re.S).group(1)


def parse(src_arr, names):
    if names:
        src_arr = re.sub(r'\b(' + '|'.join(names) + r')\b', lambda m: json.dumps(names[m.group(1)]), src_arr)
    return json.loads(re.sub(r',\s*\]$', ']', src_arr.strip()))


geo = json.loads(show('3db0f94:shorts/s27-bert-hinkler/render/geo.json'))
s28 = show('origin/claude/s28-robyn-davidson-map-gwcpin:shorts/s28-robyn-davidson/render/scenes.js')
way = parse(js_array(s28, 'WAY'), {})
s30 = show('origin/claude/model-opus-v3027k:shorts/s30-rabbit-proof-fence/render/scenes.js')
pblock = re.search(r'const P = \{(.*?)\};', s30, re.S).group(1)
P = {k: [float(a), float(b)] for k, a, b in re.findall(r'(\w+): \[([-\d.]+), ([-\d.]+)\]', pblock)}
walk = json.loads(re.sub(r',\s*\]$', ']', re.sub(r'P\.(\w+)', lambda m: json.dumps(P[m.group(1)]), js_array(s30, 'WALKP')).strip()))
s31 = show('origin/claude/model-opus-exnwqa:shorts/s31-mawson/render/scenes.js')
named = {k: [float(a), float(b)] for k, a, b in re.findall(r'const (BASE|MZ|MC) = \[([-\d.]+), ([-\d.]+)\]', s31)}
outp = parse(js_array(s31, 'OUTP'), named)
retp = parse(js_array(s31, 'RETP'), named)
out = {
    'ep1': {'name': 'Mary Bryant', 'src': '3db0f94 s27 geo.json mary.escape', 'pts': geo['mary']['escape']},
    'ep2': {'name': 'Bert Hinkler', 'src': '3db0f94 s27 geo.json routes.flight', 'pts': geo['routes']['flight']},
    'ep4': {'name': 'Robyn Davidson', 'src': 's28 scenes.js WAY', 'pts': way},
    'ep5': {'name': 'Rabbit-Proof Fence', 'src': 'origin/claude/model-opus-v3027k s30 scenes.js WALKP', 'pts': walk},
    'ep6': {'name': 'Douglas Mawson', 'src': 'origin/claude/model-opus-exnwqa s31 scenes.js OUTP + RETP', 'pts': outp + retp[1:]},
}
os.makedirs(os.path.join(HERE, '..', 'assets'), exist_ok=True)
open(os.path.join(HERE, '..', 'assets', 'ij_routes.js'), 'w').write('window.IJ = ' + json.dumps(out, separators=(',', ':')) + ';\n')
for k, v in out.items():
    print(k, v['name'], len(v['pts']), 'pts', v['pts'][0], '->', v['pts'][-1])
