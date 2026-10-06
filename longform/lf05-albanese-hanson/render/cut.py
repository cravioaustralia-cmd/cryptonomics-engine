"""lf05 edit decision list — 94 Seats vs 30%: Can Albanese Stop Pauline Hanson?

All times here are on the 1x timeline. The delivered master is the whole film at 1.28x.
Card wording follows audio/vo-text exactly; numbers on screen are only the spoken numbers.
Picture priority: real free footage -> Ken Burns free photos -> evidence cards / data -> AI B-roll.

Clips held back after QC (see final/DELIVERY_NOTES.md): B04 (readable price digits), F09/F10 (US flag),
F12 (New York cabs), F13 (Tokyo skyline), F30 (close face), F14 (portrait-only, private person).
"""
import design as D
from design import FPS, GOLD, ORANGE, STEEL, GREY, WHITE
from timing import Anchor, load

LEAD, TAIL = 0.25, 0.45
HOLD = 3.6
MID = 0.6

M_TENSE = "tense-vertigo-597.mp3"
M_INV = "investigative-feedback-dreams-588.mp3"
M_PIANO = "sombre-piano-classical-7-714.mp3"
M_SURGE = "poll-surge-dreaming-big-31.mp3"

BOTH = (GOLD, ORANGE)
AI = {"B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B09"}


def fr(t):
    return int(round(t * FPS))


class A:
    """Anchor helper for one block: a('phrase') -> absolute seconds."""

    def __init__(self, start, end, vo_start=None, anchor=None):
        self.s, self.e, self.vo, self.anc = start, end, vo_start, anchor

    def __call__(self, phrase, nth=0, lead=0.0):
        return self.vo + self.anc.at(phrase, nth) - lead

    def end_of(self, phrase):
        return self.vo + self.anc.end_of(phrase)

    def r(self, x):
        return (self.vo if self.vo is not None else self.s) + x

    @property
    def ve(self):
        """End of speech in this block."""
        return self.vo + self.anc.dur if self.vo is not None else self.e


class Cut:
    def __init__(self):
        self.info = load()
        self.T = 0.0
        self.blocks = []
        self.shots = []
        self.els = []
        self.sfx = []
        self.music = []
        self.vo = []  # (seg, abs start)
        self.markers = []  # (kind, label, abs time)

    def _place_shots(self, name, start, end, shots, a):
        bounds = []
        t = start
        for i, sh in enumerate(shots):
            if i == len(shots) - 1:
                t1 = end
            elif "d" in sh:
                t1 = t + sh["d"]
            else:
                u = sh["until"]
                t1 = (a(u) - 0.12) if isinstance(u, str) else a.r(u)
            bounds.append((t, t1))
            t = t1
        for sh, (t0, t1) in zip(shots, bounds):
            f0, f1 = fr(t0), fr(t1)
            assert f1 - f0 >= 12, (name, sh, t0, t1)
            rec = dict(sh)
            rec.update(block=name, f0=f0, nf=f1 - f0, t0=f0 / FPS, t1=f1 / FPS)
            self.shots.append(rec)
            if rec.get("src") in AI:
                self.els.append(D.ai_label(rec["t0"] + 0.1, rec["t1"] - 0.05))

    def hold(self, name, dur, shots, els=None, label=None, kind="hold"):
        start, end = self.T, self.T + dur
        a = A(start, end)
        self._place_shots(name, start, end, shots, a)
        if els:
            self.els += els(a)
        self.blocks.append(dict(name=name, kind=kind, t0=start, t1=end, label=label or name))
        self.T = end
        return a

    def seg(self, seg, shots, els=None, gap=0.0, tail=TAIL):
        info = self.info[seg]
        start = self.T
        vo0 = start + LEAD
        end = vo0 + info["dur"] + tail + gap
        anc = Anchor(info, seg)
        a = A(start, end, vo0, anc)
        self._place_shots(seg, start, end, shots, a)
        if els:
            self.els += els(a)
        self.vo.append((seg, vo0))
        self.blocks.append(dict(name=seg, kind="vo", t0=start, t1=end, vo0=vo0, label=seg))
        self.T = end
        return a

    def midroll(self, name, n, after, shots):
        self.markers.append(("midroll", f"Mid-roll {n} (after {after})", self.T))
        return self.hold(name, MID, shots, kind="mid", label=f"Mid-roll {n}")

    def span(self, b0, b1):
        t0 = next(b["t0"] for b in self.blocks if b["name"] == b0)
        t1 = next(b["t1"] for b in self.blocks if b["name"] == b1)
        return t0, t1

    def blk(self, name):
        return next(b for b in self.blocks if b["name"] == name)


def _shot(kind, src, until, d, **kw):
    s = dict(kind=kind, src=src, **kw)
    if until is not None:
        s["until"] = until
    if d is not None:
        s["d"] = d
    return s


def V(src, until=None, d=None, ss=0.0, treat=None, **kw):
    return _shot("v", src, until, d, ss=ss, treat=treat, **kw)


def I(src, until=None, d=None, kb=None, treat=None, box=None, **kw):
    return _shot("i", src, until, d, kb=kb or ("in",), treat=treat, box=box, **kw)


def P(src, until=None, d=None, **kw):
    """Framed portrait inset over a blurred background (bg=photo name)."""
    return _shot("p", src, until, d, **kw)


def C(until=None, d=None, bg=None, **kw):
    """Graphic background (ink) with an optional faint photo."""
    return _shot("c", bg, until, d, **kw)


def DUO(until=None, d=None, bg="IMG-parliament-house-canberra", **kw):
    return _shot("d", None, until, d, bg=bg, names=["IMG-albanese-dfat", "IMG-hanson-2016"], **kw)


def POL(names, bg, until=None, d=None):
    return _shot("q", None, until, d, names=names, bg=bg)


ALB = "IMG-albanese-dfat"
HAN = "IMG-hanson-2016"
PH_C = "IMG-parliament-house-canberra"
PH_D = "IMG-parliament-house-exterior-day"
HOR = "IMG-house-of-reps-chamber"
SEN = "IMG-senate-chamber"

NEWSPOLL_SEP = "Newspoll · The Australian · fieldwork 14–17 Sep 2026"


def build():
    c = Cut()
    E = D

    # ================================================================ H0 open titles
    c.hold("H0", 8.0, [
        V("F01", d=2.8, ss=0.0),
        DUO(d=2.2, slide_right=0.25),
        I(PH_C, kb=("in", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [
        E.title_card(a.r(5.0), a.e - 0.05),
        E.thread_bar(a.r(5.0), a.e, BOTH),
    ], label="Open titles")
    c.sfx.append(("series_sting.flac", 0.0, -3.0))

    # ================================================================ OPENING S01–S05
    c.seg("S01", [
        P(ALB, until="Labor took", bg=HOR, colour=GOLD, blur=8, bright=0.55),
        C(until="Pauline Hanson’s One Nation", bg=HOR),
        P(HAN, bg=HOR, colour=ORANGE, side="right", blur=8, bright=0.55),
    ], els=lambda a: [
        E.lower_third(a.s + 0.3, a("Labor took") - 0.3, "Anthony Albanese", "Prime Minister of Australia", GOLD),
        E.card(a("won the biggest") - 0.2, a("Labor took") - 0.2, "FACT", "MAY 2025 FEDERAL ELECTION",
               "The biggest election victory in Australian history", pos="tl", width=760, size=42),
        E.chamber(a("Labor took") - 0.1, a("Pauline Hanson’s One Nation") - 0.1,
                  [(a("Labor took"), dict(gold=94, big="94", cap="Labor seats in the House of Representatives"))],
                  title="HOUSE OF REPRESENTATIVES · MAY 2025", source="Source: Australian Electoral Commission"),
        E.lower_third(a("Pauline Hanson’s One Nation") + 0.1, a.e, "Pauline Hanson", "Leader, One Nation", ORANGE),
        E.card(a("won none") - 0.3, a.e, "FACT", "ONE NATION · HOUSE SEATS WON", "None", pos="tl", width=600,
               size=64, accent=ORANGE),
    ])
    c.seg("S02", [
        C(bg=PH_D),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("Newspoll") - 0.1, ["SIXTEEN MONTHS LATER"], size=120),
        E.polaroid(a("Newspoll") - 0.1, a.e, "NEWSPOLL", "Fieldwork 14–17 Sep 2026 · primary vote",
                   [("One Nation", 30, "30%", ORANGE), ("Labor", 27, "27%", GOLD)], x=560, y=150, rot=-2.0,
                   note="n = 1,244 · The Australian"),
        E.card(a("the country’s best-known") - 0.1, a("put One Nation") - 0.1, None, "NEWSPOLL",
               "The country’s best-known opinion poll", pos="bl", width=700, accent=WHITE),
    ])
    c.seg("S03", [
        V("F34", until="The real question", ss=4.0, treat="dark"),
        V("F40", until="Can Albanese stop", ss=2.0, treat="dark"),
        I(PH_C, kb=("in", 1.12, 1.04), treat="dark"),
    ], gap=1.5, els=lambda a: [
        E.headline(a("something in Australian") - 0.2, a("The real question") - 0.15,
                   ["SOMETHING HAS SHIFTED"], sub="In little more than a year", size=120),
        E.headline(a("how much") - 0.1, a("Can Albanese stop") - 0.15, ["HOW MUCH?", "WHERE?", "WILL IT LAST?"],
                   size=120, kicker="THE REAL QUESTION"),
        E.title_card(a("Can Albanese stop") - 0.1, a.e),
    ])
    c.seg("S04", [
        C(until="Along the way", bg=PH_C),
        V("F17", ss=1.0, treat="dark"),
    ], els=lambda a: [
        *E.stack(a.s + 0.2,
                 [a("how strong Anthony") - 0.1, a("how Pauline Hanson’s One Nation rose") - 0.1,
                  a("what has actually changed") - 0.1, a("what each side is doing") - 0.1,
                  a("and what could happen next") - 0.1],
                 a("Along the way") - 0.15,
                 ["How strong Anthony Albanese’s position really is", "How Pauline Hanson’s One Nation rose",
                  "What has actually changed in the numbers, and what hasn’t", "What each side is doing about it",
                  "What could happen next"],
                 title="Five things", x=180, y=330, size=44, width=1400,
                 colours=[GOLD, ORANGE, STEEL, GOLD, GREY]),
        E.headline(a("Along the way") - 0.05, a.e, ["THE POLLS · THE RESULTS · THE SOURCES"], size=86, y=380),
        E.pills(a("Along the way"), a.e, [a("when something is a fact") + 0.6, a("when it’s a claim") + 0.4,
                                          a("when it’s someone’s analysis") + 0.5], y=620),
    ])
    c.seg("S05", [
        V("F01", until="We’re not affiliated", ss=3.4, treat="dark"),
        I(PH_C, kb=("in", 1.02, 1.10), treat="dark"),
    ], els=lambda a: [
        E.card(a.s + 0.15, a.e, None, "A QUICK NOTE",
               "This is an independent documentary. We’re not affiliated with any political party, and every "
               "source is shown on screen and listed in the description.", pos="c", width=1300, size=50,
               accent=WHITE),
    ])

    # ================================================================ PART ONE
    c.hold("H1", HOLD, [
        V("F19", d=1.7, ss=3.0),
        P(ALB, bg=PH_C, colour=GOLD, side="right", blur=10, bright=0.45),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 115),
        E.chapter_card(a.r(0.3), a.e, "PART ONE", ["HOW STRONG IS", "ANTHONY ALBANESE?"], (GOLD,), cx=640),
    ], label="PART ONE · HOW STRONG IS ANTHONY ALBANESE?")
    c.sfx += [("whoosh.wav", c.blk("H1")["t0"] + 0.3, -12)]

    c.seg("S06", [
        I(PH_D, until="Albanese became Prime Minister", kb=("in", 1.02, 1.12)),
        C(until="And Albanese became the first", bg=HOR),
        P(ALB, bg=PH_C, colour=GOLD, side="right"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("Albanese became Prime Minister") - 0.15, ["THE EVIDENCE OF STRENGTH"], size=110),
        E.chamber(a("Albanese became Prime Minister") - 0.1, a("And Albanese became the first") - 0.1,
                  [(a("Albanese became Prime Minister") + 0.2, dict(gold=77, big="77", cap="2022 · a majority of two")),
                   (a("At the twenty twenty-five election"),
                    dict(gold=94, big="94", cap="2025 · 94 of 150 seats · the most any party has ever won")),
                   (a("Labor held every seat"), dict(cap="Labor held every seat it already had"))],
                  title="HOUSE OF REPRESENTATIVES · 150 SEATS", source="Source: Australian Electoral Commission"),
        E.card(a("And Albanese became the first") + 0.2, a.e, "FACT", "RE-ELECTED",
               "John Howard 2004 → Anthony Albanese 2025: the first prime minister re-elected since John Howard",
               pos="bl", width=860, size=42),
    ])
    c.seg("S07", [
        V("F18", until="Under Labor’s own rules", ss=2.0, treat="dark"),
        C(until="And in August", bg=PH_C),
        C(bg=PH_C),
    ], els=lambda a: [
        E.big_number(a("Labor still holds") - 0.1, a("Under Labor’s own rules") - 0.15, "94",
                     "Labor still holds ninety-four seats · next federal election due 2028",
                     kicker="THE MAJORITY HASN’T GONE ANYWHERE", colour=GOLD, kind="FACT"),
        E.lock75(a("Under Labor’s own rules") - 0.05, a("And in August") - 0.15),
        E.pm_ladder(a("And in August") - 0.05, a.e,
                    [a("passed Paul Keating") - 0.1, a("making him the longest") - 0.1, a("making him the longest") + 0.9]),
    ])
    c.seg("S08", [
        I(ALB, until="But power and popularity", kb=("in", 1.05, 1.16, (0.5, 0.25))),
        V("F18", ss=8.0, treat="dark"),
    ], gap=1.0, els=lambda a: [
        E.card(a.s + 0.3, a("But power and popularity") - 0.15, None, "ON PAPER",
               "More power than any Australian leader in years", pos="bl", width=760, accent=GOLD, size=46),
        E.headline(a("But power and popularity") - 0.05, a.e, ["POWER AND POPULARITY", "ARE NOT THE SAME THING"],
                   size=120),
    ])
    c.seg("S09", [
        I("IMG-treasury-canberra", until="At the twenty twenty-five", kb=("left", 1.04, 1.12)),
        V("F27", until="The ABC reported", ss=3.0, treat="dark"),
        P("IMG-chalmers-official", bg="IMG-treasury-canberra", colour=GOLD, side="right", ph=640),
    ], els=lambda a: [
        E.card(a.s + 0.3, a("At the twenty twenty-five") - 0.2, "FACT", "MAY 2026 · THE BUDGET",
               "Negative gearing restricted to newly built homes. The capital gains tax discount changed.",
               pos="bl", width=980, size=44),
        E.card(a("At the twenty twenty-five") + 0.1, a("The ABC reported") - 0.2, "FACT", "THE 2025 ELECTION",
               "Labor had ruled out both changes", pos="bl", width=900, size=52),
        E.lower_third(a("The ABC reported") + 0.1, a("conceded") - 0.1, "Jim Chalmers", "Treasurer", GOLD),
        E.card(a("conceded") - 0.1, a.e, "FACT · REPORTED", "ABC",
               "Treasurer Jim Chalmers conceded the government had broken its promise", pos="bl", width=880,
               size=44, source="Source: ABC"),
    ])
    c.seg("S10", [
        V("B06", until="A war involving", ss=0.5),
        V("F05", until="The Reserve Bank raised", ss=6.0, treat="dark"),
        C(bg="IMG-treasury-canberra"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("A war involving") - 0.15, ["THE COST-OF-LIVING PRESSURE"], size=110),
        E.card(a("A war involving") + 0.1, a("The Reserve Bank raised") - 0.2, "FACT", "FUEL",
               "A war involving the United States and Iran pushed up global oil prices, and Australian fuel prices "
               "with them", pos="bl", width=1000, size=44),
        E.staircase(a("The Reserve Bank raised") - 0.05, a.e,
                    [a("raised interest rates") + 0.2 + 0.35 * i for i in range(4)], a("to four point six") - 0.05),
    ])
    c.seg("S11", [
        C(until="Albanese’s net approval", bg=PH_D),
        C(bg=PH_C),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("In Newspoll’s September") - 0.1, ["THE POLLS FOLLOWED"], size=120),
        E.polaroid(a("In Newspoll’s September") - 0.05, a("Albanese’s net approval") - 0.15, "NEWSPOLL",
                   "Fieldwork 14–17 Sep 2026 · n = 1,244",
                   [("Labor now", 27, "27%", GOLD), ("A year earlier", 37, "37%", D.DIM)], x=200, y=140, rot=-2.5,
                   note="Labor’s lowest in Newspoll since 2012"),
        E.card(a("its lowest in Newspoll") - 0.1, a("Albanese’s net approval") - 0.15, "FACT", "LABOR PRIMARY VOTE",
               "Fell to 27%, its lowest in Newspoll since 2012, down from 37% a year earlier", x=1040, y=420,
               width=780, size=42),
        E.dial(a("Albanese’s net approval") - 0.05, a.e, a("fell to minus") - 0.2,
               sub="The worst of his prime ministership · Newspoll, Sep 2026"),
    ])
    c.seg("S12", [
        C(bg=PH_C),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("In the same month") - 0.15, ["A SINGLE POLL IS A SNAPSHOT,", "NOT A VERDICT"],
                   size=110),
        E.polaroid(a("In the same month") - 0.05, a.e, "DEMOSAU", "Capital Brief · fieldwork 10–14 Sep 2026",
                   [("Labor", 28, "28%", GOLD)], x=150, y=170, rot=-3.0, note="Labor up two points"),
        E.polaroid(a("And Roy Morgan") - 0.05, a.e, "ROY MORGAN", "Fieldwork 14–20 Sep 2026 · after preferences",
                   [("Labor", 54, "54", GOLD), ("One Nation", 46, "46", ORANGE)], x=980, y=200, rot=2.5,
                   note="Two-party preferred estimate"),
    ])
    c.seg("S13", [
        P(ALB, until="Which raises", bg=PH_C, colour=GOLD, side="left"),
        V("F28", ss=3.0, treat="dark"),
    ], gap=1.5, els=lambda a: [
        E.headline(a.s + 0.2, a("Which raises") - 0.15, ["HOLDS THE POWER"], colour=GOLD, size=110, align="l",
                   x=1010, y=380, sub="but he is losing popularity", maxw=820),
        E.headline(a("if voters are leaving") - 0.15, a.e, ["IF VOTERS ARE LEAVING LABOR,", "WHERE ARE THEY GOING?"],
                   size=110),
    ])
    c.midroll("M1", 1, "S13", [V("F28", ss=14.0, treat="dark")])

    # ================================================================ PART TWO
    c.hold("H2", HOLD, [
        V("F02", d=1.7, ss=2.0),
        P(HAN, bg=PH_C, colour=ORANGE, side="right", blur=10, bright=0.45),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 115),
        E.chapter_card(a.r(0.3), a.e, "PART TWO", ["THE RISE OF", "PAULINE HANSON"], (ORANGE,), cx=640),
    ], label="PART TWO · THE RISE OF PAULINE HANSON")
    c.sfx += [("whoosh.wav", c.blk("H2")["t0"] + 0.3, -12), ("camera_shutter.wav", c.blk("H2")["t0"] + 2.0, -14)]

    c.seg("S14", [
        P(HAN, until="Pauline Hanson entered", bg=HOR, colour=ORANGE, side="right"),
        I(HOR, until="She founded One Nation", kb=("in", 1.02, 1.10), treat="dark"),
        V("F29", until="Then it fell apart", ss=2.0, treat="dark"),
        C(until="She spent more than", bg="IMG-qeii-courts-brisbane"),
        POL(["IMG-hanson-2006", "IMG-hanson-2007-book-launch"], SEN, until="before returning"),
        I(SEN, kb=("in", 1.02, 1.10)),
    ], els=lambda a: [
        E.headline(a.s + 0.3, a("Pauline Hanson entered") - 0.15, ["A STORY OF", "RISES AND FALLS"], size=110,
                   align="l", x=150),
        E.card(a("Pauline Hanson entered") + 0.1, a("She founded One Nation") - 0.15, "FACT",
               "HANSARD · HOUSE OF REPRESENTATIVES", "1996 · Pauline Hanson enters Federal Parliament",
               source="First speech, 10 September 1996", pos="c", width=1100, size=56, accent=ORANGE),
        E.big_number(a("She founded One Nation") - 0.05, a("Then it fell apart") - 0.15, "11 SEATS",
                     "1998 Queensland state election · almost 23% of the vote",
                     kicker="ONE NATION · FOUNDED 1997", colour=ORANGE, kind="FACT", size=200),
        E.headline(a("Then it fell apart") - 0.05, a("was jailed") - 0.25, ["THEN IT FELL APART"],
                   sub="Hanson lost her federal seat", size=120),
        E.stamp_quashed(a("was jailed") - 0.2, a("She spent more than") - 0.1),
        E.card(a("She spent more than") + 0.1, a("before returning") - 0.15, "FACT", "THE WILDERNESS YEARS",
               "More than a decade losing elections", pos="bl", width=760, size=46, accent=ORANGE),
        E.card(a("before returning") - 0.05, a.e, "FACT", "2016", "Returned to the Senate", pos="bl", width=640,
               size=56, accent=ORANGE),
    ])
    c.seg("S15", [
        I(SEN, kb=("out", 1.12, 1.02), treat="dark"),
    ], els=lambda a: [
        E.big_number(a.s + 0.3, a.e, "2 → 4", "One Nation senators after the 2025 election, while Labor won its landslide",
                     kicker="QUIETLY GROWING", colour=ORANGE, kind="FACT"),
    ])
    c.seg("S16", [
        V("F34", until="In late twenty twenty-five", ss=10.0, treat="dark"),
        P("IMG-joyce-official", until="In early twenty twenty-six", bg=HOR, colour=ORANGE, side="right", ph=700),
        C(until="In March", bg=PH_D),
        I("IMG-adelaide-skyline", until="In May", kb=("right", 1.04, 1.12)),
        V("F06", until="the party’s first ever", ss=3.0),
        I("IMG-albury-nsw", until="And by September", kb=("in", 1.02, 1.12)),
        C(bg=PH_C),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("In late twenty twenty-five") - 0.15, ["MUCH FASTER"], size=130),
        E.lower_third(a("In late twenty twenty-five") + 0.2, a("In early twenty twenty-six") - 0.15, "Barnaby Joyce",
                      "Former deputy prime minister · left the Nationals, joined One Nation · late 2025", ORANGE),
        E.ev_label(a("In late twenty twenty-five") + 0.2, a("In early twenty twenty-six") - 0.15, "FACT"),
        E.headline(a("In early twenty twenty-six") - 0.05, a("In March") - 0.15, ["AHEAD OF THE COALITION"],
                   kicker="EARLY 2026 · NEWSPOLL", sub="For the first time", size=120, kind="FACT"),
        E.card(a("In March") + 0.1, a("In May") - 0.15, "FACT", "MARCH 2026 · SOUTH AUSTRALIAN STATE ELECTION",
               "One Nation won four lower-house seats", pos="bl", width=900, size=48, accent=ORANGE),
        E.card(a("In May") + 0.1, a("And by September") - 0.15, "FACT", "MAY 2026 · FEDERAL SEAT OF FARRER",
               "One Nation’s David Farley won Farrer, the party’s first ever win in the federal lower house",
               source="Source: ABC", pos="bl", width=980, size=46, accent=ORANGE),
        E.polaroid(a("And by September") - 0.05, a.e, "NEWSPOLL", "Fieldwork 14–17 Sep 2026 · primary vote",
                   [("One Nation", 30, "30%", ORANGE)], x=580, y=200, rot=2.0, note="First place"),
    ])
    c.seg("S17", [
        C(until="And Newspoll’s own figures", bg=PH_D),
        P(HAN, bg=PH_C, colour=ORANGE, side="left"),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("Newspoll has One Nation") - 0.15, ["NOT EVERY POLLSTER AGREES"], size=110),
        E.polaroid(a("Newspoll has One Nation") - 0.05, a("And Newspoll’s own figures") - 0.15, "NEWSPOLL",
                   "14–17 Sep 2026", [("One Nation", 30, "30%", ORANGE)], x=60, y=210, rot=-3, width=500),
        E.polaroid(a("DemosAU, in September") - 0.05, a("And Newspoll’s own figures") - 0.15, "DEMOSAU",
                   "10–14 Sep 2026", [("One Nation", 26, "26%", ORANGE)], x=680, y=250, rot=1.5, width=500),
        E.polaroid(a("A Roy Morgan survey") - 0.05, a("And Newspoll’s own figures") - 0.15, "ROY MORGAN",
                   "14–20 Sep 2026", [("One Nation", 25.5, "25.5%", ORANGE)], x=1290, y=200, rot=-1.5, width=500),
        E.card(a("And Newspoll’s own figures") + 0.2, a.e, "FACT", "NEWSPOLL · SEP 2026",
               "51% of voters disapprove of Pauline Hanson herself", pos="br", width=820, size=56, accent=ORANGE),
    ])
    c.seg("S18", [
        C(until="It has four senators", bg=HOR),
        I(SEN, kb=("in", 1.02, 1.10), treat="dark"),
    ], els=lambda a: [
        E.chamber(a.s + 0.1, a("It has four senators") - 0.1,
                  [(a.s + 0.2, dict(gold=94, cap="A gap between polling and power")),
                   (a("One Nation holds two seats"),
                    dict(gold=94, orange=2, big="2", big_col=ORANGE, cap="One Nation seats: Farrer and New England"))],
                  title="HOUSE OF REPRESENTATIVES · 150 SEATS"),
        E.big_number(a("It has four senators") - 0.05, a.e, "4", "One Nation senators", colour=ORANGE, kind="FACT",
                     kicker="THE SENATE"),
    ])
    c.seg("S19", [
        C(until="But is One Nation rising", bg=PH_C),
        V("F03", ss=6.0, treat="dark"),
    ], gap=1.0, els=lambda a: [
        E.three_stamps(a.s + 0.1, a("But is One Nation rising") - 0.15,
                       [a("it’s a fact") - 0.1, a("It’s a claim") - 0.1, a("And the ABC has") - 0.1]),
        E.headline(a("But is One Nation rising") - 0.05, a.e, ["RISING EVERYWHERE,", "OR ONLY IN SOME PLACES?"],
                   size=110),
    ])

    # ================================================================ PART THREE
    c.hold("H3", HOLD, [
        V("F46", d=1.8, ss=2.0),
        I("IMG-ipswich", kb=("in", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 105),
        E.chapter_card(a.r(0.3), a.e, "PART THREE", ["WHAT HAS ACTUALLY", "CHANGED?"], BOTH),
    ], label="PART THREE · WHAT HAS ACTUALLY CHANGED?")
    c.sfx += [("typewriter_key.wav", c.blk("H3")["t0"] + 0.4 + 0.11 * i, -14) for i in range(4)]

    c.seg("S20", [
        C(until="In Queensland", bg="IMG-ipswich"),
        I("IMG-ipswich", until="In New South Wales", kb=("in", 1.02, 1.10)),
        V("F40", until="In Western Australia", ss=5.0),
        V("F32", until="But in Victoria", ss=4.0),
        V("F33", until="Queensland voters even", ss=3.0),
        V("F46", ss=8.0, treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("shows One Nation’s support") - 0.15, ["LOOK BEYOND", "THE NATIONAL NUMBER"],
                   size=110),
        E.big_number(a("shows One Nation’s support") - 0.05, a("In Queensland") - 0.15, "4,967",
                     "voters surveyed between July and September · One Nation’s support varies sharply by state",
                     kicker="NEWSPOLL QUARTERLY BREAKDOWN", kind="FACT", size=200),
        E.card(a("In Queensland") + 0.1, a("In New South Wales") - 0.15, "FACT", "QUEENSLAND · HANSON’S HOME STATE",
               "One Nation 36% · Labor 25% · eleven points ahead", pos="bl", width=980, size=52, accent=ORANGE,
               source="Newspoll quarterly, Jul–Sep 2026"),
        E.card(a("In New South Wales") + 0.1, a("In Western Australia") - 0.15, "FACT", "NEW SOUTH WALES",
               "One Nation 31 · Labor 30", pos="bl", width=760, size=56, accent=ORANGE,
               source="Newspoll quarterly, Jul–Sep 2026"),
        E.card(a("In Western Australia") + 0.1, a("But in Victoria") - 0.15, "FACT", "WESTERN AUSTRALIA",
               "Labor led One Nation by a single point", pos="bl", width=860, size=52, accent=GOLD,
               source="Newspoll quarterly, Jul–Sep 2026"),
        E.card(a("But in Victoria") + 0.1, a("Queensland voters even") - 0.15, "FACT", "VICTORIA",
               "Labor 29 · One Nation 25", pos="bl", width=760, size=56, accent=GOLD,
               source="Newspoll quarterly, Jul–Sep 2026"),
        E.big_number(a("Queensland voters even") - 0.05, a.e, "52–48",
                     "Queensland voters preferred Hanson to Albanese as prime minister",
                     kicker="QUEENSLAND · PREFERRED PRIME MINISTER", colour=ORANGE, kind="FACT",
                     source="Newspoll quarterly, Jul–Sep 2026"),
    ])
    c.seg("S21", [
        V("F03", until="But it also shows", ss=14.0, treat="dark"),
        I("IMG-adelaide-skyline", until="Roy Morgan’s South Australian sample", kb=("left", 1.04, 1.12)),
        C(bg="IMG-adelaide-skyline"),
    ], els=lambda a: [
        E.polaroid(a.s + 0.2, a("But it also shows") - 0.15, "ROY MORGAN", "Fieldwork 14–27 Sep 2026 · by state",
                   [("Queensland", 32.5, "32.5%", ORANGE)], x=620, y=200, rot=-2, note="One Nation strongest"),
        E.card(a("But it also shows") + 0.1, a("Roy Morgan’s South Australian sample") - 0.15, "FACT",
               "ROY MORGAN · SOUTH AUSTRALIA",
               "One Nation weakest, at 18.5% · the same state where One Nation won four seats in March",
               pos="bl", width=980, size=46, accent=ORANGE, source="Roy Morgan, 14–27 Sep 2026"),
        E.big_number(a("Roy Morgan’s South Australian sample") - 0.05, a.e, "228",
                     "people in Roy Morgan’s South Australian sample · small samples can swing",
                     kicker="SAMPLE-SIZE CAUTION", kind="FACT"),
    ])

    c.hold("H4", 2.8, [
        V("F45", d=1.3, ss=3.0),
        I(PH_D, kb=("right", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 105),
        E.chapter_card(a.r(0.2), a.e, "PART THREE", ["THE COALITION"], (STEEL,)),
    ], label="The Coalition")
    c.sfx += [("whoosh.wav", c.blk("H4")["t0"] + 0.15, -13)]

    c.seg("S22", [
        I(PH_D, until="After the twenty twenty-five", kb=("in", 1.04, 1.12)),
        C(until="The Liberals replaced", bg=PH_D),
        P("IMG-ley-official", until="with Angus Taylor", bg=PH_D, colour=STEEL, side="left", ph=720),
        P("IMG-taylor-official", until="And in Newspoll’s latest", bg=PH_D, colour=STEEL, side="right", ph=720),
        C(bg=PH_C),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("After the twenty twenty-five") - 0.15, ["IT’S ABOUT THE COALITION"],
                   kicker="THE SECOND BIG CHANGE", size=110),
        E.card(a("After the twenty twenty-five") + 0.1, a("The Nationals walked out") - 0.15, "FACT",
               "AFTER THE 2025 DEFEAT", "The Liberal Party recorded its worst federal vote share since its founding",
               pos="c", width=1100, size=52, accent=STEEL),
        E.timeline(a("The Nationals walked out") - 0.05, a("The Liberals replaced") - 0.15,
                   [(a("in May twenty twenty-five") - 0.1, "MAY 2025", "The Nationals walk out of the Coalition"),
                    (a("and again in January") - 0.1, "JAN 2026", "They walk out again"),
                    (a("before reuniting") - 0.1, "THEN", "The Coalition reunites")],
                   title="THE NATIONALS WALKED OUT TWICE", colour=STEEL),
        E.lower_third(a("The Liberals replaced") + 0.1, a("with Angus Taylor") - 0.15, "Sussan Ley",
                      "Liberal leader, replaced February 2026", STEEL),
        E.lower_third(a("with Angus Taylor") + 0.05, a("And in Newspoll’s latest") - 0.15, "Angus Taylor",
                      "Liberal leader from February 2026", STEEL),
        E.ev_label(a("The Liberals replaced") + 0.1, a("And in Newspoll’s latest") - 0.15, "FACT"),
        E.state_tiles(a("And in Newspoll’s latest") - 0.05, a.e,
                      [(a("ahead of the Coalition in all") - 0.2 + 0.18 * i, st, "One Nation ahead of the Coalition",
                        0.8, "AHEAD") for i, st in enumerate(["QLD", "NSW", "WA", "VIC", "SA"])],
                      "ALL FIVE MAINLAND STATES", "Source: Newspoll quarterly breakdown, Jul–Sep 2026"),
    ])
    c.seg("S23", [
        C(bg=PH_C),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("Labor is ten points") - 0.15, ["BOTH MAJOR PARTIES", "HAVE LOST GROUND"], size=120),
        E.big_number(a("Labor is ten points") - 0.05, a("The Coalition is polling") - 0.15, "−10",
                     "Labor, points down on a year ago", colour=GOLD, kind="FACT", kicker="LABOR"),
        E.big_number(a("The Coalition is polling") - 0.05, a("In September’s Newspoll") - 0.15, "~19%",
                     "The Coalition is polling around nineteen per cent", colour=STEEL, kind="FACT",
                     kicker="THE COALITION"),
        E.share_bar(a("In September’s Newspoll") - 0.05, a.e, 46, "46%",
                    "Labor and the Coalition together, primary vote · September Newspoll", colour=WHITE,
                    split=[(27, GOLD, "Labor 27"), (19, STEEL, "Coalition 19")],
                    source="Newspoll, fieldwork 14–17 Sep 2026"),
    ])
    c.seg("S24", [
        V("F36", until="fuel prices", ss=2.0, treat="dark"),
        V("B05", until="A Roy Morgan survey", ss=0.0),
        C(until="And the ABC has", bg="IMG-suburb-sale-signs-wa"),
        V("F41", ss=3.0, treat="dark"),
    ], els=lambda a: [
        *E.stack(a("The evidence points") - 0.1,
                 [a("cost of living") - 0.1, a("fuel prices") - 0.1, a("and interest rates") - 0.1],
                 a("A Roy Morgan survey") - 0.15, ["Cost of living", "Fuel prices", "Interest rates"],
                 title="What’s driving the movement?", kind="FACT", x=180, y=420, size=52, width=760,
                 numbered=False, colours=[ORANGE, ORANGE, ORANGE]),
        E.share_bar(a("A Roy Morgan survey") - 0.05, a("And the ABC has") - 0.15, 95, "95%",
                    "of One Nation supporters believe Australia is heading in the wrong direction",
                    source="Source: Roy Morgan survey"),
        E.card(a("And the ABC has") + 0.1, a.e, "ANALYSIS", "ABC REPORTING",
               "Immigration dominates One Nation’s message", pos="bl", width=860, size=56, source="Source: ABC"),
    ])
    c.seg("S25", [
        C(until="and polls don’t elect", bg=HOR),
        V("B01", until="So what is Anthony", ss=0.5),
        P(ALB, bg=PH_C, colour=GOLD, side="right"),
    ], gap=1.5, els=lambda a: [
        E.chamber(a.s + 0.1, a("and polls don’t elect") - 0.1,
                  [(a("Labor still has"), dict(gold=94, big="94", cap="Labor seats · next election due 2028"))],
                  title="WHAT HASN’T CHANGED"),
        E.headline(a("and polls don’t elect") - 0.05, a("So what is Anthony") - 0.15, ["POLLS DON’T", "ELECT ANYONE"],
                   size=140),
        E.headline(a("So what is Anthony") - 0.05, a.e, ["SO WHAT IS ALBANESE", "DOING ABOUT IT?"], size=100,
                   align="l", x=140, maxw=900),
    ])
    c.midroll("M2", 2, "S25", [P(ALB, bg=PH_C, colour=GOLD, side="right")])

    # ================================================================ PART FOUR
    c.hold("H5", HOLD, [
        V("F16", d=1.7, ss=1.0),
        V("B07", ss=0.5),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 115),
        E.chapter_card(a.r(0.3), a.e, "PART FOUR", ["ALBANESE’S MOVES"], (GOLD,)),
    ], label="PART FOUR · ALBANESE'S MOVES")
    c.sfx += [("paper_tear.mp3", c.blk("H5")["t0"] + 0.3, -16), ("whoosh.wav", c.blk("H5")["t0"] + 1.8, -14)]

    c.seg("S26", [
        V("F15", until="By August", ss=1.0, treat="dark"),
        C(until="One series of ads", bg=PH_C),
        V("F37", until="Another targeted", ss=0.5, treat="dark"),
        V("F16", ss=5.0, treat="dark"),
    ], els=lambda a: [
        E.big_number(a("In June twenty twenty-six") - 0.05, a("By August") - 0.15, "$27",
                     "Labor’s online requests to supporters, to help stop One Nation",
                     kicker="JUNE 2026 · LABOR DONATION ASKS", colour=GOLD, kind="FACT"),
        E.headline(a("By August") - 0.05, a("One series of ads") - 0.15, ["ONE NATION + THE COALITION"],
                   kicker="ABC ANALYSIS · LABOR’S AD STRATEGY, AUGUST 2026", kind="ANALYSIS", size=110,
                   sub="Rather than simply attacking Pauline Hanson, Labor’s ads tied One Nation and the Coalition "
                       "together, and warned the Coalition couldn’t govern without One Nation."),
        E.card(a("One series of ads") + 0.1, a("Another targeted") - 0.15, "FACT", "LABOR AD SERIES",
               "Targeted Hanson’s suggestion that people be allowed to access their superannuation when struggling "
               "with the cost of living", pos="bl", width=1000, size=44),
        E.card(a("Another targeted") + 0.1, a.e, "FACT", "ANOTHER SERIES",
               "Targeted her comments about paid parental leave", pos="bl", width=860, size=48),
    ])
    c.seg("S27", [
        P(ALB, until="He also pointed", bg=HOR, colour=GOLD, side="right"),
        V("F35", until="In his words", ss=2.0, treat="dark"),
        C(bg=HOR),
    ], els=lambda a: [
        E.card(a.s + 0.3, a("He also pointed") - 0.15, "CLAIM", "ALBANESE",
               "Questioned One Nation’s fundraising figures, and said One Nation had the same policies as the "
               "Coalition", pos="bl", width=900, size=44),
        E.big_number(a("He also pointed") - 0.05, a("In his words") - 0.15, "~$2.1m",
                     "A light plane Hanson accepted from a company linked to mining billionaire Gina Rinehart",
                     kicker="REPORTED VALUE", kind="FACT · REPORTED", y=260),
        E.lower_third(a("mining billionaire") - 0.1, a("In his words") - 0.15, "Gina Rinehart",
                      "Mining billionaire · name card only", STEEL),
        E.quote_card(a("In his words") - 0.05, a.e,
                     "“This is someone who got a plane worth more than that given to her by Australia’s richest "
                     "person.”", who="ANTHONY ALBANESE", kind="CLAIM", size=72),
    ])
    c.seg("S28", [
        I(SEN, until="and again over", kb=("in", 1.0, 1.05)),
        I(SEN, until="And on the economy", kb=("left", 1.06, 1.12), treat="dark"),
        I("IMG-treasury-canberra", kb=("in", 1.02, 1.10), treat="dark"),
    ], els=lambda a: [
        E.date_lt(a.s + 0.3, a("and again over") - 0.15, "Senate, 24 November 2025"),
        E.card(a("once over her second") - 0.1, a("and again over") - 0.15, "FACT", "SENATE CENSURE",
               "Over her second burqa protest", pos="tl", width=760, size=46, accent=WHITE),
        E.card(a("and again over") + 0.05, a("And on the economy") - 0.15, "FACT", "SENATE CENSURE · MARCH 2026",
               "Hanson censured over her comment that there are no good Muslims. Coalition votes against.",
               pos="bl", width=980, size=46, accent=WHITE, source="Source: ABC, 2 March 2026"),
        E.card(a("And on the economy") + 0.1, a.e, "CLAIM", "MINISTERS SAY",
               "The government’s focus is relieving cost-of-living pressure, rather than the polls", pos="bl",
               width=980, size=48),
    ])
    c.seg("S29", [
        C(until="So what has Pauline", bg="IMG-treasury-canberra"),
        P(HAN, bg=PH_C, colour=ORANGE, side="right"),
    ], gap=1.0, els=lambda a: [
        E.ev_board(a.s + 0.2, a("So what has Pauline") - 0.15, [
            (a("There’s no public evidence") - 0.1, "FACT",
             "No public evidence the 2026 budget was designed to beat One Nation"),
            (a("and the government says") - 0.1, "CLAIM",
             "The government says it was about housing and fairness between generations"),
            (a("But ABC analysis") - 0.1, "ANALYSIS",
             "ABC analysis: the broken promise on negative gearing and capital gains tax helped One Nation by "
             "feeding distrust"),
            (a("And Labor’s") - 0.1, "CLAIM",
             "Labor’s “stop One Nation” appeal prompted One Nation’s counter-campaign, which One Nation says "
             "went on to raise millions"),
        ], title="NOW, THE ANALYSIS", size=38, y0=330),
        E.headline(a("So what has Pauline") - 0.05, a.e, ["SO WHAT HAS HANSON", "BEEN DOING IN RETURN?"], size=100,
                   align="l", x=140, maxw=900),
    ])

    # ================================================================ PART FIVE
    c.hold("H6", HOLD, [
        V("B03", d=1.7, ss=1.0),
        V("F44", ss=5.5, treat="dark"),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 115),
        E.chapter_card(a.r(0.3), a.e, "PART FIVE", ["HANSON’S MOVES"], (ORANGE,)),
    ], label="PART FIVE · HANSON'S MOVES")
    c.sfx += [("coin.wav", c.blk("H6")["t0"] + 1.8, -14), ("whoosh.wav", c.blk("H6")["t0"] + 0.3, -14)]

    c.seg("S30", [
        V("F15", until="One Nation says it raised", ss=8.0, treat="dark"),
        C(until="Albanese questioned", bg=PH_C),
        V("F44", until="Hanson later said", ss=6.5),
        V("F31", ss=3.0, treat="dark"),
    ], els=lambda a: [
        E.card(a.s + 0.3, a("One Nation says it raised") - 0.15, "FACT", "10 JUNE 2026",
               "In direct response to Labor’s appeal, One Nation launched a fundraising campaign called “Fire the "
               "Liar”", pos="bl", width=1000, size=46, accent=ORANGE),
        E.counters(a("One Nation says it raised") - 0.05, a("Albanese questioned") - 0.15, [
            (a("four million dollars") - 0.1, 4, lambda v: f"${v:.1f}m" if v < 3.95 else "$4m", 0.0,
             "raised"),
            (a("sixty-five thousand") - 0.1, 65000, lambda v: f"{int(v):,}+", 0, "donors"),
            (a("in five days") - 0.1, 5, lambda v: f"{int(round(v))} DAYS", 1, "to raise it"),
        ], "ONE NATION SAYS", note="One Nation published what it described as an independent audit."),
        E.card(a("Albanese questioned") + 0.05, a("Hanson later said") - 0.15, "FACT", "ALBANESE",
               "Questioned those figures", pos="bl", width=700, size=56, accent=GOLD),
        E.card(a("Hanson later said") + 0.1, a.e, "CLAIM", "HANSON",
               "The money would be kept until the next election", pos="bl", width=860, size=50),
    ])
    c.seg("S31", [
        P(HAN, until="After the Farrer win", bg="IMG-albury-nsw", colour=ORANGE, side="right"),
        V("B03", until="On policy", ss=2.0),
        V("F41", until="She has floated", ss=0.5),
        V("F37", until="And One Nation has relaunched", ss=3.0, treat="dark"),
        V("B09", until="released on its", ss=0.0),
        V("F43", ss=2.0, treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("After the Farrer win") - 0.15, ["A NEW TARGET"], size=120, align="l", x=150,
                   maxw=800),
        E.card(a("After the Farrer win") + 0.1, a("On policy") - 0.15, "CLAIM", "HANSON’S POST · AFTER FARRER",
               "One Nation had proven it could win lower-house seats. Time to target Labor-held seats.",
               pos="bl", width=980, size=46),
        E.card(a("On policy") + 0.05, a("She has floated") - 0.15, "CLAIM", "ONE NATION MIGRATION POLICY",
               "Net migration: net-negative 3 yrs → 130,000 ceiling", pos="bl", width=980, size=54,
               source="Source: ABC, 14 Sep 2026; onenation.org.au"),
        E.card(a("She has floated") + 0.05, a("And One Nation has relaunched") - 0.15, "CLAIM", "FLOATED BY HANSON",
               "Letting people access their superannuation during cost-of-living pressure", pos="bl", width=980,
               size=48),
        E.headline(a("And One Nation has relaunched") - 0.05, a("released on its") - 0.15, ["“PLEASE EXPLAIN”"],
                   kicker="ONE NATION’S ANIMATED SERIES · RELAUNCHED", size=150, kind="FACT"),
        E.card(a("released on its") + 0.05, a.e, "FACT", "“PLEASE EXPLAIN”",
               "Released on One Nation’s YouTube channel · rebroadcast on Sky News", pos="bl", width=980, size=46,
               accent=ORANGE),
    ])
    c.seg("S32", [
        V("F07", until="Opposition Leader Angus", ss=3.0, treat="dark"),
        P("IMG-taylor-official", until="The Coalition voted against", bg=PH_D, colour=STEEL, side="right", ph=720),
        I(SEN, until="And former Liberal", kb=("right", 1.04, 1.10), treat="dark"),
        P("IMG-abbott-official", bg=PH_D, colour=STEEL, side="right", ph=720),
    ], els=lambda a: [
        E.headline(a.s + 0.1, a("Opposition Leader Angus") - 0.15, ["ONE NATION AND", "THE COALITION"], size=120),
        E.lower_third(a("Opposition Leader Angus") + 0.1, a("telling the ABC") - 0.15, "Angus Taylor",
                      "Opposition Leader", STEEL),
        E.card(a("telling the ABC") - 0.05, a("But Taylor has not") - 0.15, "FACT · REPORTED", "ABC 7.30 · TAYLOR",
               "Ruled out forming a coalition with One Nation: a One Nation government would bring “an eternity of "
               "pain”", pos="bl", width=980, size=44),
        E.card(a("But Taylor has not") + 0.05, a("The Coalition voted against") - 0.15, "FACT", "NOT RULED OUT",
               "Preference deals", pos="bl", width=700, size=64, accent=STEEL),
        E.card(a("The Coalition voted against") + 0.1, a("And former Liberal") - 0.15, "FACT", "MARCH 2026",
               "The Coalition voted against censuring Hanson", pos="bl", width=900, size=54, accent=STEEL),
        E.lower_third(a("And former Liberal") + 0.1, a("now says") - 0.2, "Tony Abbott",
                      "Former Liberal prime minister · once funded legal action against One Nation", STEEL),
        E.card(a("now says") - 0.1, a.e, "FACT · REPORTED", "ABBOTT NOW SAYS",
               "As a general rule, parties on the right should preference each other", pos="bl", width=900,
               size=48),
    ])
    c.seg("S33", [
        V("F11", until="In July twenty twenty-six", ss=11.0),
        P("IMG-faruqi-official", until="Hanson has applied", bg="IMG-law-courts-sydney", colour=STEEL, side="right",
          ph=700),
        I("IMG-qeii-courts-brisbane", until="Why is Hanson", kb=("up", 1.04, 1.14)),
        C(until="So, with both sides", bg=PH_C),
        V("F17", ss=6.0, treat="dark"),
    ], gap=1.5, els=lambda a: [
        E.headline(a.s + 0.1, a("In July twenty twenty-six") - 0.15, ["SETBACKS"], size=140),
        E.lower_third(a("In July twenty twenty-six") + 0.1, a("breached the Racial") - 0.3, "Mehreen Faruqi",
                      "Greens senator", STEEL),
        E.card(a("breached the Racial") - 0.2, a("Hanson has applied") - 0.15, "FACT",
               "JULY 2026 · FULL FEDERAL COURT",
               "Upheld a finding that Hanson’s post telling Senator Faruqi to go back to Pakistan breached the "
               "Racial Discrimination Act", pos="bl", width=900, size=42),
        E.card(a("Hanson has applied") + 0.05, a("Why is Hanson") - 0.15, "FACT", "HIGH COURT",
               "Special leave application lodged, 21 Aug 2026 — not yet decided", pos="bl", width=960, size=50,
               accent=WHITE, source="Source: news.com.au; AFR, 22 Aug 2026"),
        E.headline(a("Why is Hanson") - 0.05, a("One Nation says its goal") - 0.15, ["MOTIVE?"], size=180),
        E.card(a("One Nation says its goal") + 0.05, a("So, with both sides") - 0.15, "CLAIM", "ONE NATION SAYS",
               "Its goal is to remove the Labor government", pos="tl", width=900, size=50),
        E.card(a("Beyond what Hanson") + 0.1, a("So, with both sides") - 0.15, None, "ANY DEEPER MOTIVE",
               "Interpretation, not fact", pos="bl", width=900, size=64, accent=GREY),
        E.headline(a("So, with both sides") - 0.05, a.e, ["WHAT DO THE NUMBERS", "ACTUALLY MEAN?"], size=120),
    ])
    c.midroll("M3", 3, "S33", [V("F17", ss=11.0, treat="dark")])

    # ================================================================ POLLS, SEATS AND GOVERNMENT
    c.hold("H7", HOLD, [
        V("B01", d=1.8, ss=2.0),
        V("B08", ss=0.5),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 115),
        E.chapter_card(a.r(0.3), a.e, "", ["POLLS, SEATS", "AND GOVERNMENT"], BOTH),
    ], label="POLLS, SEATS AND GOVERNMENT")
    c.sfx += [("typewriter_key.wav", c.blk("H7")["t0"] + 0.4 + 0.11 * i, -14) for i in range(3)]
    c.sfx += [("bell.wav", c.blk("H7")["t0"] + 2.2, -20)]

    c.seg("S34", [
        DUO(until="Popularity, polling"),
        C(until="A party’s primary vote", bg=PH_C),
        V("B08", until="The House of Representatives has", ss=1.0),
        C(bg=HOR),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("Popularity, polling") - 0.15, ["HOW AUSTRALIAN ELECTIONS", "ACTUALLY WORK"], size=96,
                   y=860),
        *E.flow(a("Popularity, polling") - 0.1,
                [a("Popularity, polling") - 0.1, a("polling, seats") - 0.05, a("seats and government") - 0.05,
                 a("and government") + 0.05], a("A party’s primary vote") - 0.15,
                ["Popularity", "Polling", "Seats", "Government"], y=440, size=52,
                kicker="FOUR DIFFERENT THINGS", colours=[ORANGE, ORANGE, WHITE, GOLD]),
        E.headline(a("A party’s primary vote") - 0.05, a("The House of Representatives has") - 0.15, ["PRIMARY VOTE"],
                   sub="Just the first number on the ballot", size=140, kind="FACT"),
        E.chamber(a("The House of Representatives has") - 0.05, a.e,
                  [(a("The House of Representatives has"),
                    dict(cap="150 seats · each won with more than half the vote after preferences")),
                   (a("To form government"), dict(gold=76, line=76, big="76",
                                                   cap="A party needs 76 of 150 seats to form government"))],
                  title="HOUSE OF REPRESENTATIVES"),
    ])
    c.seg("S35", [
        C(until="In nineteen ninety-eight", bg=PH_C),
        V("F29", until="In the federal election", ss=10.0, treat="dark"),
        I(HOR, kb=("in", 1.02, 1.10), treat="dark"),
    ], els=lambda a: [
        E.spread_vs_conc(a.s + 0.1, a("In nineteen ninety-eight") - 0.15, a("if its votes are spread") - 0.2,
                         a("or many seats") - 0.1),
        E.big_number(a("In nineteen ninety-eight") - 0.05, a("In the federal election") - 0.15, "11 OF 89",
                     "1998 Queensland state election · almost 23% of the vote", colour=ORANGE, kind="FACT",
                     kicker="CONCENTRATED", size=200),
        E.big_number(a("In the federal election") - 0.05, a.e, "0",
                     "House seats · federal election four months later · around 8–9% nationally",
                     colour=ORANGE, kind="FACT", kicker="SPREAD OUT"),
    ])
    c.seg("S36", [
        V("B02", until="a party needs about", ss=0.5),
        C(until="That’s why minor parties", bg=SEN),
        I(SEN, until="And preferences decide", kb=("in", 1.02, 1.10), treat="dark"),
        C(bg=PH_C),
    ], els=lambda a: [
        E.card(a.s + 0.2, a("a party needs about") - 0.15, "FACT", "THE SENATE WORKS DIFFERENTLY",
               "Each state elects senators by proportional representation", pos="bl", width=980, size=48,
               accent=WHITE),
        E.quota(a("a party needs about") - 0.05, a("That’s why minor parties") - 0.15, a("one-seventh") - 0.1),
        E.card(a("That’s why minor parties") + 0.05, a("And preferences decide") - 0.15, "FACT", "THE SENATE",
               "Minor parties like One Nation have usually done far better in the Senate", pos="bl", width=980,
               size=48, accent=ORANGE),
        *E.stack(a("And preferences decide") - 0.05,
                 [a("If Coalition voters") - 0.1, a("If they don’t") - 0.1], a.e,
                 ["If Coalition voters preference One Nation above Labor, One Nation’s chances rise",
                  "If they don’t, they fall"],
                 title="The preference question", kind="FACT", x=180, y=420, size=48, width=1500, numbered=False,
                 colours=[ORANGE, D.DIM]),
    ])

    # ================================================================ THE BIG COMPARISON
    c.hold("H8", HOLD, [
        DUO(d=1.5, bg=PH_C),
        V("F18", ss=10.0),
    ], els=lambda a: [
        E.scrim(a.r(1.3), a.e, 120),
        E.chapter_card(a.r(1.35), a.e, "", ["THE BIG", "COMPARISON"], BOTH, sub="POWER · PRESSURE"),
    ], label="THE BIG COMPARISON")
    c.sfx += [("whoosh.wav", c.blk("H8")["t0"] + 0.3, -13)]

    def s37(a):
        L = [(a("Anthony Albanese and Labor hold") - 0.1, "§HOLD"),
             (a("hold government") - 0.1, "Government"),
             (a("ninety-four seats") - 0.1, "94 seats"),
             (a("control of the budget") - 0.1, "Control of the budget and Parliament’s agenda"),
             (a("a strong party organisation") - 0.1, "A strong party organisation"),
             (a("and Labor’s seventy-five") - 0.1, "Labor’s 75% rule: the leader is hard to remove"),
             (a("Their pressures are") - 0.1, "§PRESSURES"),
             (a("falling polls") - 0.1, "Falling polls"),
             (a("a record-low approval") - 0.1, "A record-low approval rating"),
             (a("rising interest rates") - 0.1, "Rising interest rates"),
             (a("and a broken tax promise") - 0.1, "A broken tax promise")]
        R = [(a("Pauline Hanson and One Nation hold momentum") - 0.1, "§MOMENTUM"),
             (a("first place in Newspoll") - 0.1, "First place in Newspoll"),
             (a("a commanding lead") - 0.1, "A commanding lead in Queensland"),
             (a("a first federal lower-house") - 0.1, "A first federal lower-house seat"),
             (a("four lower-house seats in South") - 0.1, "Four lower-house seats in South Australia"),
             (a("four senators") - 0.1, "Four senators"),
             (a("a fundraising campaign") - 0.1, "A fundraising campaign One Nation says raised millions"),
             (a("and growing influence") - 0.1, "Growing influence over the Coalition’s choices"),
             (a("Their limits are") - 0.1, "§LIMITS"),
             (a("two House seats") - 0.1, "Two House seats"),
             (a("majority disapproval") - 0.1, "Majority disapproval of their leader"),
             (a("weaker support in Victoria") - 0.1, "Weaker support in Victoria and South Australia"),
             (a("and a history of collapsing") - 0.1, "A history of collapsing after past peaks")]
        return [
            E.headline(a.s + 0.1, a("Anthony Albanese and Labor hold") - 0.15, ["SIDE BY SIDE"],
                       sub="Without declaring a winner", size=130),
            E.columns(a("Anthony Albanese and Labor hold") - 0.1, a.e, L, R,
                      ("ALBANESE · LABOR", "HANSON · ONE NATION"), size=30, kinds=("FACT", "FACT"),
                      row_kinds={(1, 6): "CLAIM"}, title="NO WINNER DECLARED"),
        ]
    c.seg("S37", [
        DUO(until="Anthony Albanese and Labor hold", bg=PH_C),
        C(bg=PH_C),
    ], els=s37)
    c.seg("S38", [
        DUO(until="Those are different", bg=PH_C),
        V("F20", ss=0.0, treat="dark"),
    ], gap=1.5, els=lambda a: [
        E.headline(a("has power") - 0.4, a("Those are different") - 0.15, ["POWER"], colour=GOLD, size=110,
                   align="l", x=260, y=905),
        E.headline(a("has pressure") - 0.4, a("Those are different") - 0.15, ["PRESSURE"], colour=ORANGE, size=110,
                   align="l", x=1050, y=905),
        E.headline(a("Those are different") - 0.05, a.e, ["DIFFERENT KINDS OF", "POLITICAL INFLUENCE"],
                   sub="The next election will test how much each one is worth", size=110),
    ])

    # ================================================================ ENDING
    c.hold("H9", HOLD, [
        V("F18", d=1.8, ss=4.0),
        V("F17", ss=8.0),
    ], els=lambda a: [
        E.scrim(a.s, a.e, 105),
        E.chapter_card(a.r(0.3), a.e, "ENDING", ["CAN ALBANESE STOP", "PAULINE HANSON?"], BOTH, sub="2028"),
    ], label="ENDING · CAN ALBANESE STOP PAULINE HANSON?")
    c.sfx += [("door.wav", c.blk("H9")["t0"] + 0.2, -22)]

    def s39(a):
        L = [(a("Labor holds government") - 0.1, "Labor holds government with a record majority, until an election "
                                                 "due by 2028"),
             (a("One Nation is polling") - 0.1, "One Nation polls between about 25 and 30%, depending on the "
                                                "pollster"),
             (a("with its strongest") - 0.1, "Its strongest support is in Queensland"),
             (a("One Nation holds two") - 0.1, "One Nation holds 2 of 150 House seats"),
             (a("And both major parties") - 0.1, "Both major parties have lost support at the same time")]
        R = [(a("whether One Nation’s polling") - 0.1, "Whether One Nation’s polling turns into seats"),
             (a("how Coalition voters") - 0.1, "How Coalition voters direct their preferences"),
             (a("whether interest rates") - 0.1, "Whether interest rates and fuel prices ease"),
             (a("and whether the Coalition") - 0.1, "Whether the Coalition recovers")]
        return [
            E.columns(a("Here’s what the evidence establishes") - 0.1, a.e, L, R,
                      ("ESTABLISHED", "UNKNOWN"), cols=(WHITE, GREY), kinds=("FACT", "SPECULATION"),
                      size=34, dashed_right=True),
        ]
    c.seg("S39", [
        DUO(until="Here’s what the evidence establishes", bg=PH_C),
        C(bg=PH_C),
    ], els=s39)
    c.seg("S40", [
        V("F38", until="And behind all of this", ss=2.0, treat="dark"),
        V("F39", until="Anthony Albanese is sixty-three", ss=0.0, treat="dark"),
        C(until="and has said in her own words", bg=PH_C),
        P(HAN, bg=PH_C, colour=ORANGE, side="left"),
    ], els=lambda a: [
        E.card(a.s + 0.3, a("And behind all of this") - 0.15, "SPECULATION", "THE FIRST REAL TEST",
               "Victorian state election · November 2026, in the state where One Nation polls weakest",
               source="Weakest: Newspoll quarterly, Jul–Sep 2026", pos="bl", width=980, size=48, accent=GREY),
        E.section_label(a.s + 0.3, a("And behind all of this") - 0.15, "SPECULATION"),
        E.headline(a("And behind all of this") - 0.05, a("Anthony Albanese is sixty-three") - 0.15,
                   ["TWO LEADERS,", "VERY DIFFERENT TIMELINES"], size=110),
        E.ages(a("Anthony Albanese is sixty-three") - 0.1, a("and has said in her own words") - 0.15,
               [a("Anthony Albanese is sixty-three") - 0.1, a("Pauline Hanson is seventy-two") - 0.1]),
        E.quote_card(a("and has said in her own words") - 0.05, a.e, "“I’m at the end of my life.”",
                     who="PAULINE HANSON · IN HER OWN WORDS", kind="FACT", size=88, cx=1270, maxw=1050),
    ])
    c.seg("S41", [
        V("F19", until="Is One Nation’s rise", ss=8.0, treat="dark"),
        C(until="Tell us in the comments", bg=PH_C),
        V("F20", until="And if you want", ss=0.0, treat="dark"),
        I(PH_C, kb=("out", 1.14, 1.02), treat="dark"),
    ], tail=0.6, els=lambda a: [
        E.headline(a.s + 0.2, a("Is One Nation’s rise") - 0.15, ["THREE QUESTIONS"],
                   sub="We’d genuinely like to hear from people on every side", size=130),
        *E.stack(a("Is One Nation’s rise") - 0.1,
                 [a("Is One Nation’s rise") - 0.1, a("If a party can poll") - 0.1, a("And what would actually") - 0.1],
                 a("Tell us in the comments") - 0.15,
                 ["Is One Nation’s rise mainly about Pauline Hanson, or about voters’ frustration with both major "
                  "parties?",
                  "If a party can poll 30% and still win only a handful of seats, is that our electoral system "
                  "working as designed, or a problem?",
                  "What would actually change your vote between now and the next election?"],
                 x=150, y=260, size=42, width=1620, colours=[ORANGE, WHITE, GOLD]),
        E.headline(a("Tell us in the comments") - 0.05, a("And if you want") - 0.15, ["TELL US IN THE COMMENTS"],
                   sub="Every source is in the description, so check them for yourself.", size=120),
        E.end_card(a("And if you want") - 0.05, a.e + 12.0, "MORE EVIDENCE-BASED DEEP DIVES INTO AUSTRALIAN POLITICS"),
    ])
    c.hold("END", 12.0, [I(PH_C, kb=("out", 1.02, 1.0), treat="dark")], label="End screen")

    # ================================================================ global furniture
    def tagspan(b0, b1, k, t, cols):
        t0, t1 = c.span(b0, b1)
        c.els.append(E.chapter_tag(t0, t1, k, t, cols))
        c.els.append(E.thread_bar(t0, t1, cols))

    tagspan("S06", "S13", "PART ONE", "HOW STRONG IS ANTHONY ALBANESE?", (GOLD,))
    tagspan("S14", "S19", "PART TWO", "THE RISE OF PAULINE HANSON", (ORANGE,))
    tagspan("S20", "S25", "PART THREE", "WHAT HAS ACTUALLY CHANGED?", BOTH)
    tagspan("S26", "S29", "PART FOUR", "ALBANESE’S MOVES", (GOLD,))
    tagspan("S30", "S33", "PART FIVE", "HANSON’S MOVES", (ORANGE,))
    tagspan("S34", "S36", "POLLS, SEATS AND GOVERNMENT", "HOW ELECTIONS WORK", BOTH)
    tagspan("S37", "S38", "THE BIG COMPARISON", "POWER · PRESSURE", BOTH)
    tagspan("S39", "S41", "ENDING", "CAN ALBANESE STOP PAULINE HANSON?", BOTH)
    for b0, b1 in [("S19", "S19"), ("S29", "S29")]:
        t0, t1 = c.span(b0, b1)
        c.els.append(E.section_label(t0 + 0.2, t1, "ANALYSIS"))
    s24 = c.blk("S24")
    c.els.append(E.section_label(s24["t1"] - 5.2, s24["t1"], "ANALYSIS"))

    # ================================================================ music cues (1x abs times)
    def b(n, k="t0"):
        return c.blk(n)[k]

    c.music = [
        # file, start, end, offset_in_track, fade_in, fade_out, gain_db
        (M_TENSE, b("H0") + 3.0, b("S05", "t1") + 0.8, 4.0, 2.0, 1.6, 0),
        (M_INV, b("H1") - 0.2, b("S09", "t1") + 1.0, 6.0, 0.5, 1.6, 0),
        (M_TENSE, b("S10") - 0.3, b("M1", "t1") + 0.6, 100.0, 1.2, 1.2, 0),
        (M_SURGE, b("H2") - 0.2, b("S16", "t1") + 1.0, 0.0, 0.4, 1.6, 0),
        (M_INV, b("S17") - 0.3, b("S19", "t1") + 1.0, 70.0, 1.2, 1.6, 0),
        (M_INV, b("H3") - 0.2, b("S21", "t1") + 1.0, 30.0, 0.5, 1.4, 0),
        (M_TENSE, b("H4") - 0.2, b("M2", "t1") + 0.6, 60.0, 0.4, 1.2, 0),
        (M_INV, b("H5") - 0.2, b("S29", "t1") + 1.0, 4.0, 0.5, 1.6, -3),
        (M_TENSE, b("H6") - 0.2, b("M3", "t1") + 0.6, 20.0, 0.5, 1.2, -3),
        (M_INV, b("H7") - 0.2, b("S36", "t1") + 1.0, 40.0, 0.5, 1.6, -4),
        (M_INV, b("H8") - 0.2, b("S38", "t1") + 1.0, 72.0, 0.5, 1.6, 0),
        (M_PIANO, b("H9") - 0.2, b("END", "t1"), 0.0, 0.6, 5.0, 0),
    ]
    c.sfx += [("whoosh.wav", b("H9") + 0.25, -16)]
    return c


if __name__ == "__main__":
    c = build()
    print(f"blocks {len(c.blocks)} shots {len(c.shots)} els {len(c.els)} total {c.T:.2f}s -> {c.T / 1.28:.2f}s")
    for b in c.blocks:
        print(f"{b['name']:5s} {b['t0']:8.2f} {b['t1']:8.2f} {b['t1'] - b['t0']:6.2f}")
