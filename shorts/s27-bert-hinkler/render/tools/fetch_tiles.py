#!/usr/bin/env python3
"""Fetch Tilezen terrarium tiles (AWS Open Data) for every layer into <scratch>/tiles."""
import math, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
from layers import LAYERS
SP = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/sp'
os.makedirs(f'{SP}/tiles', exist_ok=True)
def u_of(lon): return (lon + 180.0) / 360.0
def v_of(lat):
    r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2
jobs = set()
for z, lon0, lon1, la0, la1, _ in LAYERS.values():
    n = 2 ** z
    for x in range(int(u_of(lon0) * n), int(u_of(lon1) * n) + 1):
        for y in range(int(v_of(la0) * n), int(v_of(la1) * n) + 1):
            jobs.add((z, x, y))
for x in range(16):
    for y in range(16): jobs.add((4, x, y))   # globe
def get(j):
    z, x, y = j; f = f'{SP}/tiles/{z}_{x}_{y}.png'
    if os.path.exists(f) and os.path.getsize(f) > 0: return 0
    for a in range(4):
        try:
            urllib.request.urlretrieve(f'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png', f); return 1
        except Exception as e: err = e
    print('fail', j, err); return 0
with ThreadPoolExecutor(24) as ex: print(len(jobs), 'tiles,', sum(ex.map(get, sorted(jobs))), 'fetched')
