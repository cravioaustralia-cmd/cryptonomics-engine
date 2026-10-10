"""common.py - shared timing state and overlays (M7 questions, MG02 cast board)."""
from lib.core import *
from lib import events as EV
from lib.comps import q_card, q_slot, Q_TEXT, stamp_text
from lib.board import cast_board

# windows (filled by scene planners)
Q = {"pin": {}, "hide": [], "answer": {}, "fly": {}}
CASTW = []      # (t0, t1, active_name)
CAST_LIT = {}   # name -> time first lit


def C(key):
    return EV.CUES[key]


def q_visible(t):
    a = 0.0
    for t0, t1 in Q["hide"]:
        pass
    for t0, t1 in Q.get("show", []):
        a = max(a, eo(t, t0, 0.3) * (1 - smooth(t, t1 - 0.3, t1)))
    return a


def draw_questions(c, t):
    va = q_visible(t)
    if va <= 0.003:
        return
    for i in range(3):
        tp = Q["pin"].get(i)
        if tp is None or t < tp:
            continue
        if i in Q["fly"] and Q["fly"][i][0] <= t <= Q["fly"][i][1]:
            continue           # drawn by its scene while centre stage
        x, y, w, h = q_slot(i)
        k = eo(t, tp, 0.3)
        ans = Q["answer"].get(i)
        bright = 0.0
        txt = None
        if ans is not None and t >= ans[0]:
            txt = ans[1]
        q_card(c, i, x, y, w, h, va * k, bright=bright, text=txt)


def draw_cast(c, t):
    for t0, t1, act in CASTW:
        if t0 - 0.3 <= t <= t1 + 0.3:
            a = eo(t, t0, 0.3) * (1 - smooth(t, t1 - 0.3, t1))
            cast_board(c, t, CAST_LIT, a, act)
            return


def extra_overlays(c, t, fi):
    draw_questions(c, t)
    draw_cast(c, t)
