"""Load the prior Impossible Journeys polylines from the repo (never retyped) → assets/ij_routes.js.
  ep.1 Mary Bryant   : 3db0f94:shorts/s27-bert-hinkler/render/geo.json  key mary.escape
  ep.2 Bert Hinkler  : 3db0f94:shorts/s27-bert-hinkler/render/geo.json  key routes.flight
  ep.4 Robyn Davidson: origin/claude/s28-robyn-davidson-map-gwcpin:shorts/s28-robyn-davidson/render/scenes.js  const WAY
No episode 3 exists. s29 is not in this series. Run from anywhere inside the repo after fetching those refs."""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
show = lambda spec: subprocess.check_output(['git', 'show', spec], cwd=HERE).decode()
geo = json.loads(show('3db0f94:shorts/s27-bert-hinkler/render/geo.json'))
s28 = show('origin/claude/s28-robyn-davidson-map-gwcpin:shorts/s28-robyn-davidson/render/scenes.js')
way = re.search(r'const WAY = (\[.*?\]);', s28, re.S).group(1)
way = json.loads(re.sub(r',\s*\]$', ']', way.strip()))
out = {
    'ep1': {'name': 'Mary Bryant', 'src': '3db0f94 s27 geo.json mary.escape', 'pts': geo['mary']['escape']},
    'ep2': {'name': 'Bert Hinkler', 'src': '3db0f94 s27 geo.json routes.flight', 'pts': geo['routes']['flight']},
    'ep4': {'name': 'Robyn Davidson', 'src': 's28 scenes.js WAY', 'pts': way},
}
open(os.path.join(HERE, 'assets', 'ij_routes.js'), 'w').write('window.IJ = ' + json.dumps(out, separators=(',', ':')) + ';\n')
for k, v in out.items():
    print(k, v['name'], len(v['pts']), 'pts', v['pts'][0], '→', v['pts'][-1])
