"""Shared layer table + projection for the lf01 basemap (python side).

Projection (mirrored in scenes.js): equirectangular, standard parallel 25 deg.
    U = (lon - LON0) * COS          V = LAT0 - lat          (map units = degrees of latitude)
Longitudes east of the dateline are written as lon + 360 (Pearl Harbor = 202.0, Midway = 182.6).
"""
import math

LON0, LAT0 = -15.0, 62.0
COS = math.cos(math.radians(25.0))

# name: (lon0, lon1, lat_top, lat_bottom, px per degree of latitude, terrarium zoom)
LAYERS = {
    'base':    (-15.0, 255.0, 62.0, -52.0, 22, 5),
    'seasia':  (96.0, 125.0, 25.0, -10.0, 60, 6),
    'japan':   (127.0, 147.0, 46.0, 29.0, 100, 7),
    'hawaii':  (199.0, 204.5, 23.0, 18.5, 140, 8),
    'aus':     (108.0, 158.0, 1.0, -45.0, 80, 7),
    'png':     (140.0, 152.5, -2.0, -11.5, 220, 8),
    'topend':  (129.2, 134.2, -10.8, -16.2, 360, 9),
    'sydney':  (150.5, 152.1, -32.5, -34.3, 760, 11),
    'melb':    (144.2, 145.6, -37.6, -38.5, 760, 11),
}
ORDER = ['base', 'seasia', 'japan', 'hawaii', 'aus', 'png', 'topend', 'sydney', 'melb']


def uv(lon, lat):
    return ((lon - LON0) * COS, LAT0 - lat)
