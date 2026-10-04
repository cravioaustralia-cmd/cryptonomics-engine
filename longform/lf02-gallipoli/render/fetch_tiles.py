"""Fetch AWS Open Data Terrain Tiles (Terrarium PNG) for every basemap layer into $TILES (not committed)."""
import math, os, concurrent.futures as cf, urllib.request
from layers import LAYERS

TILES = os.environ.get('TILES', '/tmp/claude-0/geo/tiles')
os.makedirs(TILES, exist_ok=True)


def tx(lon, z):
    return (lon + 180) / 360 * 2 ** z


def ty(lat, z):
    r = math.radians(lat)
    return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** z


def job(z, x, y):
    x %= 2 ** z
    p = os.path.join(TILES, f'{z}_{x}_{y}.png')
    if os.path.exists(p) and os.path.getsize(p) > 0:
        return 0
    u = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    err = None
    for _ in range(4):
        try:
            urllib.request.urlretrieve(u, p)
            return 1
        except Exception as e:  # noqa
            err = e
    print('fail', u, err)
    return 0


jobs = set()
for name, (lon0, lon1, lat0, lat1, ppd, z, _) in LAYERS.items():
    for x in range(int(tx(lon0, z)), int(tx(lon1, z)) + 1):
        for y in range(int(ty(lat0, z)), int(ty(lat1, z)) + 1):
            jobs.add((z, x, y))
print(len(jobs), 'tiles')
with cf.ThreadPoolExecutor(24) as ex:
    print(sum(ex.map(lambda a: job(*a), sorted(jobs))), 'downloaded')
