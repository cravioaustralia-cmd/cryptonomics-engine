"""Shared layer table + projection for the lf02 basemap (python side).

Projection (mirrored in scenes.js): Mercator in degree units, so Gallipoli, Europe and Australia all keep
their true local shape on one continuous map.
    U = lon - LON0          V = Y0 - mdeg(lat),  mdeg(lat) = degrees(ln(tan(45deg + lat/2)))
"""
import math

LON0 = -15.0


def mdeg(lat):
    return math.degrees(math.log(math.tan(math.radians(45 + lat / 2))))


def imdeg(y):
    return math.degrees(2 * math.atan(math.exp(math.radians(y))) - math.pi / 2)


Y0 = mdeg(72.0)

# name: (lon0, lon1, lat_top, lat_bottom, px per map unit, terrarium zoom, coast source)
LAYERS = {
    'base':   (-15.0, 182.0, 72.0, -48.0, 22, 5, 'ne'),
    'europe': (-12.0, 60.0, 62.0, 26.0, 56, 6, 'ne'),
    'aus':    (110.0, 180.0, -8.0, -48.0, 44, 6, 'ne'),
    'aegean': (21.5, 31.0, 43.0, 38.0, 230, 9, 'ne'),
    'strait': (25.85, 26.95, 40.62, 39.92, 1400, 11, 'dem'),
    'anzac':  (26.215, 26.405, 40.315, 40.185, 9000, 13, 'dem'),
}
ORDER = ['base', 'europe', 'aus', 'aegean', 'strait', 'anzac']


def uv(lon, lat):
    return (lon - LON0, Y0 - mdeg(lat))
