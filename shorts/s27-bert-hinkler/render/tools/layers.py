"""Basemap layer definitions shared by fetch_tiles.py and build_basemap.py.
name: (zoom, lon0, lon1, lat_top, lat_bottom, options)"""
LAYERS = {
    'world':     (5, -180, 179.99, 74, -68, dict(zf=1.4, relief=0.45, max_w=6144, q=86)),
    'route':     (6, -14, 157, 58, -33, dict(zf=2.0, relief=0.6, max_w=7000, q=85, feather=0.03)),
    'europe':    (7, -12, 36, 57, 28, dict(zf=2.6, relief=0.75, max_w=5200, q=86, feather=0.06)),
    'aus':       (7, 102, 156, 6, -30, dict(zf=2.6, relief=0.75, max_w=5600, q=86, feather=0.06)),
    'italy':     (9, 9.4, 13.8, 45.2, 41.6, dict(zf=2.2, relief=0.8, max_w=3400, q=88, feather=0.1)),
    'london':    (10, -2.4, 2.0, 52.6, 50.6, dict(zf=1.8, relief=0.6, q=88, feather=0.12, synth=True)),
    'tuscany':   (11, 10.85, 12.25, 44.12, 43.35, dict(zf=1.6, relief=0.8, q=88, feather=0.12, synth=True)),
    'darwin':    (10, 129.9, 131.9, -11.6, -13.3, dict(zf=1.6, relief=0.6, q=88, feather=0.12, synth=True)),
    'bundaberg': (11, 151.95, 152.75, -24.5, -25.15, dict(zf=1.5, relief=0.6, q=88, feather=0.12, synth=True, land_from_elev=True)),
}
