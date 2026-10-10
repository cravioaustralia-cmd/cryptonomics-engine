#!/usr/bin/env python3
"""Prepare render inputs from the seated assets (originals are never modified).

Writes to render/build/ (git-ignored): cropped/resized stills, document crops,
30 fps JPEG frame windows of the clips actually used, and simplified geodata.
Crops only (no retouching): AWM burned-in strips removed; UN map crop drops the
"UNITED NATIONS" name and map number (PD-UN-map request); voting sheet cropped to
the typed table (no autographs).
"""
import json, os, subprocess, shutil
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
B = os.path.join(HERE, "build")
os.makedirs(os.path.join(B, "img"), exist_ok=True)


def save(im, name, maxw=2400, q=92):
    im = im.convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(B, "img", name), quality=q)
    print("img", name, im.size)


def src(p):
    return Image.open(os.path.join(EP, p))


# --- photos ---------------------------------------------------------------------------
save(src("images/PH26_un_1947_2400.jpg"), "PH26.jpg")
save(src("images/PH01_evatt_2400.jpg"), "PH01.jpg", 1600)
save(src("images/PH01b_evatt_press_conference_1945_2400.jpg"), "PH01b.jpg")
# AWM: crop the burned-in "AUSTRALIAN WAR MEMORIAL" strip (white band + text at the bottom)
save(src("images/PH02_beersheba_light_horse.jpg").crop((2, 2, 638, 412)), "PH02.jpg")
save(src("images/PH02b_light_horse_advancing_beersheba_1917.jpg").crop((2, 2, 618, 637)), "PH02b.jpg")
save(src("images/PH02c_light_horse_beersheba_morning_after_1917.jpg").crop((2, 2, 638, 374)), "PH02c.jpg")
save(src("images/PH03_israel_1948_celebration_2400.jpg"), "PH03.jpg")
save(src("images/PH04_palestinian_refugees_1948_2400.jpg"), "PH04.jpg")
save(src("images/PH05_station_pier_migrants.jpg"), "PH05.jpg")
save(src("images/PH05_small.jpg"), "PH05s.jpg")
save(src("images/PH06_lakemba_haldon_st_2007.jpg"), "PH06.jpg")

# --- documents --------------------------------------------------------------------------
save(src("docs/DOC01_res181_title_page-01.png"), "DOC01_page.jpg", 2143)
save(src("docs/DOC02_A-PV-128_rollcall-15.png").crop((120, 2280, 1180, 3260)), "DOC02_excerpt.jpg", 1060)
save(src("docs/DOC02b_voting_sheet_29nov1947.jpg").crop((205, 190, 628, 1290)), "DOC02b_table.jpg", 2000)
# UN partition-plan map (A/516 Annex A): title block + northern half, UN name/number cropped out
save(src("data/partition_plan_1947_UN_A516_annexA_map.jpg").crop((487, 359, 3077, 3180)), "ANNEX_crop.jpg", 2600)

import sys
if "--geo-only" in sys.argv:
    CLIPS_SKIP = True
else:
    CLIPS_SKIP = False
# --- clip windows -> 30 fps JPEG frames --------------------------------------------------
CLIPS = {  # id: (file, start, dur)
    "FT05b": ("footage/FT05b_lake_success_1946.mp4", 15.3, 3.2),   # chamber wide (Aug 1946)
    "ST06": ("footage/ST06_desert_wind.mp4", 0.0, 4.2),
    "AI03": ("broll/AI03_cavalry_silhouettes.mp4", 2.0, 4.6),       # calm window, riders on far ridge
    "FT02": ("footage/FT02_light_horse_1917.mp4", 11.6, 3.4),       # horseman passes, Beersheba street
    "FT02c": ("footage/FT02c_jerusalem_dec1917.mp4", 0.2, 3.6),     # mounted troops by Jaffa Gate
    "AI05": ("broll/AI05_suitcases_ship.mp4", 1.5, 4.0),            # calm window
}
for k, (f, ss, d) in ({} if CLIPS_SKIP else CLIPS).items():
    od = os.path.join(B, "vid", k)
    shutil.rmtree(od, ignore_errors=True)
    os.makedirs(od)
    subprocess.run(["ffmpeg", "-v", "error", "-ss", str(ss), "-i", os.path.join(EP, f), "-t", str(d),
                    "-vf", "fps=30,scale=1920:1080:flags=lanczos", "-q:v", "3", os.path.join(od, "%04d.jpg")],
                   check=True)
    print("vid", k, len(os.listdir(od)))
if not CLIPS_SKIP: json.dump({k: len(os.listdir(os.path.join(B, "vid", k))) for k in CLIPS}, open(os.path.join(B, "vid", "counts.json"), "w"))

# --- geodata ------------------------------------------------------------------------------
def rnd(c, nd):
    if isinstance(c[0], (int, float)):
        return [round(c[0], nd), round(c[1], nd)]
    return [rnd(x, nd) for x in c]


def bbox_hit(geom, b):
    xs, ys = [], []
    def walk(c):
        if isinstance(c[0], (int, float)):
            xs.append(c[0]); ys.append(c[1])
        else:
            for x in c: walk(x)
    walk(geom["coordinates"])
    return not (max(xs) < b[0] or min(xs) > b[2] or max(ys) < b[1] or min(ys) > b[3])


def _area(r):
    return sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1)) / 2


def rewind(geom):
    """d3-geo wants exterior rings clockwise, holes counter-clockwise (planar lon/lat)."""
    def fix_poly(p):
        out = []
        for k, r in enumerate(p):
            cw = _area(r) < 0
            want_cw = (k == 0)
            out.append(r if cw == want_cw else r[::-1])
        return out
    if geom["type"] == "Polygon":
        geom["coordinates"] = fix_poly(geom["coordinates"])
    elif geom["type"] == "MultiPolygon":
        geom["coordinates"] = [fix_poly(p) for p in geom["coordinates"]]
    return geom


def layer(path, b=None, nd=3):
    g = json.load(open(os.path.join(EP, path)))
    out = []
    for f in g["features"]:
        if f["geometry"] is None:
            continue
        if b and not bbox_hit(f["geometry"], b):
            continue
        out.append({"type": "Feature", "properties": {"n": f["properties"].get("ADM0_A3") or f["properties"].get("name") or f["properties"].get("id")},
                    "geometry": rewind({"type": f["geometry"]["type"], "coordinates": rnd(f["geometry"]["coordinates"], nd)})})
    return {"type": "FeatureCollection", "features": out}


ME = [24, 22, 46, 40]
geo = {
    "world": layer("data/ne_110m_admin_0_countries.geojson", None, 2),
    "region": layer("data/ne_50m_admin_0_countries.geojson", ME, 3),
    "lakes": layer("data/ne_50m_lakes.geojson", ME, 3),
    "plan": layer("data/partition_plan_1947.geojson", None, 4),
    "pts": json.load(open(os.path.join(EP, "data/coordinates.json"))),
}
json.dump(geo, open(os.path.join(B, "geo.json"), "w"), separators=(",", ":"))
print("geo.json", os.path.getsize(os.path.join(B, "geo.json")) // 1024, "KB")
