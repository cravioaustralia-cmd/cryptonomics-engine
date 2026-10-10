"""scene.py - scene registry and base class (shared by film.py and scenes/)."""
from .core import *
from . import events as EV

SCENES = {}


def scene(sid):
    def deco(cls):
        SCENES[sid] = cls
        return cls
    return deco


class Scene:
    xin = 0.0          # dissolve in from the previous segment (seconds)

    def __init__(self, seg):
        self.S = seg
        self.sid = seg.sid

    def w(self, phrase, occ=1):
        return self.S.w(phrase, occ)

    def we(self, phrase, occ=1):
        return self.S.we(phrase, occ)

    def cue(self, name, phrase, occ=1, **kw):
        return EV.cue(self.sid, name, self.S.w(phrase, occ), phrase, **kw)

    def sfx(self, t, f, gain=0.0, trig="", **kw):
        return EV.sfx(self.sid, t, f, gain, trig, **kw)

    def tag(self, kind, text, t0, t1, trig="", **kw):
        return EV.tag(self.sid, kind, text, t0, t1, trig, **kw)

    def tick(self, t, text, trig="", **kw):
        return EV.tick(self.sid, t, text, trig, **kw)

    def plan(self):
        pass

    def draw(self, c, t, fi):
        rect(c, 0, 0, W, H, "#000000")
