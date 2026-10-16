#!/usr/bin/env python3
"""Build the single timing source for the Cravio sales video.

Inputs
  tools/hero_words.json, tools/social_words.json
      Word timestamps from faster-whisper (small.en) on the raw recorded VO.
Outputs
  remotion/src/timing/hero.json, remotion/src/timing/social.json
      Scene cuts, VO phrase placements, every word in OUTPUT time, the music
      edit map and the SFX cue list. Remotion drives all animation from these
      files and tools/mix_audio.py builds the soundtrack from the same files.

Rules baked in
  * VO is never stretched or pitched. Each phrase is a contiguous slice of the
    recording placed at a new output time ("outStart").
  * Music is Kevin MacLeod "Digital Lemonade", measured at exactly 120 BPM with
    the first downbeat at 0.047 s, so a bar is 2.0 s (60 frames at 30 fps).
    The music edit splices whole bars only, and scene cuts land on beats.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "remotion", "src", "timing")
FPS = 30
BAR0 = 0.047  # first downbeat of Digital Lemonade (s)
BAR = 2.0     # 120 BPM, 4/4


def bar(n):
    """Track time (s) of bar n's downbeat."""
    return round(BAR0 + n * BAR, 4)


def place(words, segments):
    """segments: list of (id, srcStart, srcEnd, outStart, sceneStart, sceneEnd)."""
    vo, scenes, outwords = [], [], []
    for sid, s0, s1, o0, c0, c1 in segments:
        off = o0 - s0
        vo.append({"scene": sid, "srcStart": s0, "srcEnd": s1, "outStart": o0,
                   "outEnd": round(s1 + off, 3)})
        scenes.append({"id": sid, "start": c0, "end": c1})
        for w in words:
            # a word belongs to the segment it overlaps most (whisper edges can
            # sit a few tens of ms outside the measured speech span)
            ov = [(min(w["e"], b) - max(w["s"], a), k) for k, (_, a, b, *_r) in enumerate(segments)]
            best = max(ov)[1]
            if segments[best][0] == sid:
                outwords.append({"scene": sid, "w": w["w"],
                                 "t": round(max(w["s"], s0) + off, 3),
                                 "e": round(w["e"] + off, 3)})
    return vo, scenes, outwords


def load(name):
    with open(os.path.join(HERE, f"{name}_words.json")) as f:
        return json.load(f)


# Speech spans come from an energy scan of the raw VO (silence gaps between
# phrases measured 10 ms RMS against the -75 dBFS noise floor).
HERO_SEGMENTS = [
    #  id   srcStart srcEnd  outStart sceneStart sceneEnd
    (1,  0.020,  2.335,  0.30,  0.0,  3.0),
    (2,  2.680,  8.678,  3.10,  3.0,  9.5),
    (3,  9.525, 13.464,  9.60,  9.5, 14.0),
    (4, 14.100, 17.331, 14.10, 14.0, 21.0),   # 17.3-21.0: spinner -> C morph, riser
    (5, 17.678, 20.949, 22.00, 21.0, 27.0),   # 21.0 = music drop + logo draw
    (6, 21.285, 29.612, 27.20, 27.0, 36.0),
    (7, 30.100, 37.932, 36.10, 36.0, 44.5),
    (8, 38.232, 41.356, 44.60, 44.5, 48.5),
    (9, 41.841, 49.885, 48.60, 48.5, 59.0),
    (10, 50.237, 52.860, 60.00, 59.0, 65.0),  # hero moment: pad, click on 63.0
    (11, 53.266, 56.961, 65.20, 65.0, 69.5),
    (12, 57.375, 60.383, 69.60, 69.5, 73.0),
    (13, 60.732, 68.700, 73.30, 73.0, 84.5),  # end card, final chord 81.0, black from 84.0
]
HERO_DURATION = 84.5

# Music edit: (outStart, trackStart, trackEnd). Whole bars of Digital Lemonade.
HERO_MUSIC = [
    (3.0,  bar(64), bar(65)),   # hats out, bass pulse (tense build) ...
    (5.0,  bar(64), bar(71)),   # ... continues under scenes 2-4
    (19.0, bar(71), bar(72)),   # crash fill into the drop (spinner -> C)
    (21.0, bar(72), bar(80)),   # DROP on the logo draw, groove for 5-7
    (37.0, bar(16), bar(24)),   # main groove (stations 7-9)
    (53.0, bar(29), bar(32)),   # phrase end + fill into the pad
    (59.0, bar(48), bar(51)),   # breakdown pad: "says yes" hero moment
    (65.0, bar(56), bar(60)),   # groove returns, lifting (11-12)
    (73.0, bar(84), bar(88)),   # last phrase + fill; the track's button stop lands at 80.7
]
# End-card bed: the breakdown pad, low-passed and smeared into a sustained
# chord wash under the final hold (from the same track, no new source).
HERO_PAD = {"out": 81.0, "track": bar(48), "dur": 3.0, "gainDb": 4}
HERO_STAB = {"out": 0.0, "track": bar(72), "dur": 0.55}

# SFX cues: (outTime, file, gainDb, opts)
HERO_SFX = [
    (0.00, "ui_notification_pop", -8, {}),
    (1.05, "ui_select_modern", -20, {"rate": 0.8}),          # "3 days" tag ticks
    (1.85, "impact_whoosh_deep", -10, {"start": 0.0, "dur": 0.9, "fade": 0.4}),  # second email thud
    (8.95, "whoosh_simple_pixabay", -12, {}),                # stack topples
    (9.75, "ui_notification_pop", -18, {"rate": 1.12}),      # chat bubble
    (10.6, "ui_notification_pop", -20, {"rate": 0.94}),
    (13.70, "whoosh_fast", -16, {"dur": 0.9, "fade": 0.3}),  # iris to a dot
    (17.40, "riser_synth", -16, {"start": 3.9, "dur": 3.6, "fade": 0.04}),  # riser into the drop
    (20.95, "glitch_small_electric", -12, {}),               # trace zip
    (21.00, "impact_whoosh_deep", -9, {"dur": 2.2, "fade": 1.2}),  # power-on
    (25.80, "whoosh_fast_transition", -14, {}),              # camera rides right
    (27.25, "conveyor_clack", -12, {}),
    (31.30, "ui_typing_soft", -20, {"start": 2.0, "dur": 2.6, "fade": 0.3}),  # quote drafting
    (34.00, "ui_select_modern", -14, {}),                    # Missing spec flag
    (36.20, "conveyor_clack", -12, {}),
    (40.30, "conveyor_clack", -13, {}),
    (42.70, "ui_select_modern", -15, {"rate": 0.9}),         # Escalated tag
    (44.60, "conveyor_clack", -12, {}),
    (47.30, "whoosh_simple_pixabay", -15, {}),               # track loops up
    # stamps land on the words (filled in below from word times)
    (58.20, "whoosh_fast_transition", -16, {}),              # cards slide to review queue
    (63.00, "ui_click_scifi", -8, {}),                       # the ✓ click
    (63.20, "whoosh_simple_pixabay", -11, {}),               # gate opens
    (64.45, "whoosh_fast_transition", -11, {}),              # big ✓ wipes the frame
    (66.90, "machining_whirr", -16, {}),
    (68.05, "lock_clunk", -10, {}),
    (69.40, "whoosh_simple_pixabay", -17, {}),               # pull back to aerial
    (76.30, "ui_typing_soft", -20, {"start": 6.0, "dur": 1.4, "fade": 0.2}),  # URL types
    (81.00, "chime_correct_tone", -12, {}),                  # logo pulse
]

SOCIAL_SEGMENTS = [
    (1,  0.020,  2.460,  0.15,  0.0,  3.0),
    (2,  2.884,  8.675,  3.05,  3.0,  9.0),
    (3,  9.080, 12.840,  9.10,  9.0, 13.0),
    (4, 13.359, 16.400, 13.10, 13.0, 18.2),
]
SOCIAL_DURATION = 18.2
SOCIAL_MUSIC = [
    (0.0,  bar(72), bar(78)),          # starts on the drop
    (12.0, bar(87), bar(88)),          # fill; button stop at 13.7
]
SOCIAL_PAD = {"out": 14.0, "track": bar(48), "dur": 4.1, "gainDb": 4}
SOCIAL_SFX = [
    (0.00, "ui_notification_pop", -9, {}),
    (1.55, "impact_whoosh_deep", -12, {"dur": 0.8, "fade": 0.35}),   # "Any update?" slams
    (2.90, "whoosh_fast", -16, {"dur": 0.8, "fade": 0.3}),
    (3.10, "glitch_small_electric", -14, {}),                        # C logo flash
    # ✓ stamps on the three items (filled from word times)
    (8.70, "whoosh_fast_transition", -15, {}),                       # whip pan
    (11.45, "ui_click_scifi", -9, {}),                              # Approve click
    (12.60, "whoosh_fast_transition", -13, {}),                      # ✓ wipe
    (14.00, "chime_correct_tone", -13, {}),                          # logo nodes pop
]


def word_time(words, scene, text, nth=0):
    hits = [w for w in words if w["scene"] == scene and w["w"].strip(".,?!'\"").lower() == text.lower()]
    return hits[nth]["t"]


def build(name, words_src, segments, duration, music, sfx, stab=None, extra=None, pad=None):
    vo, scenes, words = place(words_src, segments)
    sfx = list(sfx)
    if extra:
        sfx += extra(words)
    sfx.sort(key=lambda c: c[0])
    data = {
        "fps": FPS,
        "duration": duration,
        "durationInFrames": int(round(duration * FPS)),
        "bpm": 120,
        "musicTrack": "music/kmacleod-digital-lemonade.mp3",
        "vo": vo,
        "scenes": scenes,
        "words": words,
        "music": [{"outStart": a, "trackStart": b, "trackEnd": c} for a, b, c in music],
        "stab": stab,
        "pad": pad,
        "sfx": [{"t": t, "file": f, "gainDb": g, **o} for t, f, g, o in sfx],
    }
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, f"{name}.json"), "w") as f:
        json.dump(data, f, indent=1)
    print(name, data["durationInFrames"], "frames;", len(words), "words")
    return data


def hero_extra(words):
    cues = []
    # content engine: five format cards stamp on their words
    for w in ["LinkedIn", "blogs", "reels", "SEO", "newsletters"]:
        cues.append((word_time(words, 9, w) - 0.02, "stamp", -11, {}))
    return cues


def social_extra(words):
    cues = []
    for w in ["quotes", "answer", "reply"]:
        cues.append((word_time(words, 2, w) + 0.25, "stamp", -13, {}))
    return cues


if __name__ == "__main__":
    build("hero", load("hero"), HERO_SEGMENTS, HERO_DURATION, HERO_MUSIC, HERO_SFX,
          HERO_STAB, hero_extra, HERO_PAD)
    build("social", load("social"), SOCIAL_SEGMENTS, SOCIAL_DURATION, SOCIAL_MUSIC,
          SOCIAL_SFX, None, social_extra, SOCIAL_PAD)
