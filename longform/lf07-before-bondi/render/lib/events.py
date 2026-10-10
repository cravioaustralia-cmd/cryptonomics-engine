"""events.py - one registry shared by picture, mix and sync check.

Scene planners add:
  cue(sid, name, t, trig)            a visual cue that starts on the first word of `trig`
  sfx(sid, t, file, gain, trig)      a sound effect (gain in dB relative to the file's MIX_MAP offset)
  tag(sid, kind, text, t0, t1)       an on-screen tag / label / source line (checked by OCR)
  tick(sid, t, text, ...)            a Bondi Countdown value change
"""
from dataclasses import dataclass, field


@dataclass
class Ev:
    kind: str
    sid: str
    t: float
    name: str = ""
    trig: str = ""
    file: str = ""
    gain: float = 0.0
    text: str = ""
    t1: float = 0.0
    extra: dict = field(default_factory=dict)


EVENTS = []
CUES = {}


def reset():
    EVENTS.clear()
    CUES.clear()


def cue(sid, name, t, trig="", **extra):
    e = Ev("cue", sid, t, name=name, trig=trig, extra=extra)
    EVENTS.append(e)
    CUES[f"{sid}.{name}"] = t
    return t


def sfx(sid, t, file, gain=0.0, trig="", name="", **extra):
    EVENTS.append(Ev("sfx", sid, t, name=name or file, trig=trig, file=file, gain=gain, extra=extra))
    return t


def tag(sid, kind, text, t0, t1, trig="", **extra):
    EVENTS.append(Ev("tag", sid, t0, t1=t1, name=kind, text=text, trig=trig, extra=extra))


def tick(sid, t, text, trig="", sound=True, gain=0.0, flip=0.45, pulse=False, **extra):
    """Ticker value change. sound=True adds one SFX24 tick at t."""
    EVENTS.append(Ev("tick", sid, t, text=text, trig=trig, extra=dict(flip=flip, pulse=pulse, sound=sound, **extra)))
    if sound:
        sfx(sid, t, "SFX24_countdown_tick", gain, trig, name="tick:" + text)


def of(kind, sid=None):
    return [e for e in EVENTS if e.kind == kind and (sid is None or e.sid == sid)]
