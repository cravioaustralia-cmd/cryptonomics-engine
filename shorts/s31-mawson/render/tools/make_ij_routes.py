"""Load the prior Impossible Journeys polylines from the repo (never retyped) → render/assets/ij_routes.js.
  ep.1 Mary Bryant    : 3db0f94:shorts/s27-bert-hinkler/render/geo.json  key mary.escape
  ep.2 Bert Hinkler   : 3db0f94:shorts/s27-bert-hinkler/render/geo.json  key routes.flight
  ep.4 Robyn Davidson : origin/claude/s28-robyn-davidson-map-gwcpin:shorts/s28-robyn-davidson/render/scenes.js  const WAY
  ep.5 Rabbit-Proof Fence (the 1931 walk): origin/claude/model-opus-v3027k:shorts/s30-rabbit-proof-fence/render/scenes.js
        const WALKP (its first point is P.moore from the same file's const P). The s30 render's own master map
        draws this line as its EP. 5 journey. It is loaded, not redrawn; the fence line itself is not used.
No episode 3 exists. s29 is not in this series. Fetch those refs first:
  git fetch origin claude/model-opus-8eaepb claude/s28-robyn-davidson-map-gwcpin claude/model-opus-v3027k"""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
show = lambda spec: subprocess.check_output(['git', 'show', spec], cwd=HERE).decode()
geo = json.loads(show('3db0f94:shorts/s27-bert-hinkler/render/geo.json'))


def js_array(src, name):
    body = re.search(r'const ' + name + r' = (\[.*?\]);', src, re.S).group(1)
    return body


s28 = show('origin/claude/s28-robyn-davidson-map-gwcpin:shorts/s28-robyn-davidson/render/scenes.js')
way = json.loads(re.sub(r',\s*\]$', ']', js_array(s28, 'WAY').strip()))
s30 = show('origin/claude/model-opus-v3027k:shorts/s30-rabbit-proof-fence/render/scenes.js')
pblock = re.search(r'const P = \{(.*?)\};', s30, re.S).group(1)
P = {k: [float(a), float(b)] for k, a, b in re.findall(r'(\w+): \[([-\d.]+), ([-\d.]+)\]', pblock)}
walk_src = js_array(s30, 'WALKP')
walk_src = re.sub(r'P\.(\w+)', lambda m: json.dumps(P[m.group(1)]), walk_src)
walk = json.loads(re.sub(r',\s*\]$', ']', walk_src.strip()))
out = {
    'ep1': {'name': 'Mary Bryant', 'src': '3db0f94 s27 geo.json mary.escape', 'pts': geo['mary']['escape']},
    'ep2': {'name': 'Bert Hinkler', 'src': '3db0f94 s27 geo.json routes.flight', 'pts': geo['routes']['flight']},
    'ep4': {'name': 'Robyn Davidson', 'src': 's28 scenes.js WAY', 'pts': way},
    'ep5': {'name': 'Rabbit-Proof Fence', 'src': 'origin/claude/model-opus-v3027k s30 scenes.js WALKP', 'pts': walk},
}
os.makedirs(os.path.join(HERE, '..', 'assets'), exist_ok=True)
open(os.path.join(HERE, '..', 'assets', 'ij_routes.js'), 'w').write('window.IJ = ' + json.dumps(out, separators=(',', ':')) + ';\n')
for k, v in out.items():
    print(k, v['name'], len(v['pts']), 'pts', v['pts'][0], '→', v['pts'][-1])
