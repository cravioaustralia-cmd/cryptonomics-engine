"""lf04 edit decision list — Who Killed the Aussie Dream?

All times here are on the 1x timeline. The delivered master is the whole film at 1.28x.
Card wording follows audio/vo-text exactly; numbers on screen are only the spoken numbers.
"""
import design as D
from design import FPS
from timing import Anchor, load

LEAD, TAIL = 0.15, 0.40
HOLD = 3.6

M_TENSE = "tense-vertigo-597.mp3"
M_INV = "investigative-feedback-dreams-588.mp3"
M_PIANO = "sombre-piano-classical-7-714.mp3"
M_SURGE = "poll-surge-dreaming-big-31.mp3"


def fr(t):
    return int(round(t * FPS))


class A:
    """Anchor helper for one block: A('phrase') -> absolute seconds."""

    def __init__(self, cut, start, end, vo_start=None, anchor=None):
        self.s, self.e, self.vo, self.anc = start, end, vo_start, anchor

    def __call__(self, phrase, nth=0, lead=0.0):
        return self.vo + self.anc.at(phrase, nth) - lead

    def end_of(self, phrase):
        return self.vo + self.anc.end_of(phrase)

    def r(self, x):
        return (self.vo if self.vo is not None else self.s) + x


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

    # ------------------------------------------------------------ builders
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

    def hold(self, name, dur, shots, els=None, label=None):
        start, end = self.T, self.T + dur
        a = A(self, start, end)
        self._place_shots(name, start, end, shots, a)
        if els:
            self.els += els(a)
        self.blocks.append(dict(name=name, kind="hold", t0=start, t1=end, label=label or name))
        self.T = end
        return a

    def seg(self, seg, shots, els=None, tail=TAIL):
        info = self.info[seg]
        start = self.T
        vo0 = start + LEAD
        end = vo0 + info["dur"] + tail
        anc = Anchor(info, seg)
        a = A(self, start, end, vo0, anc)
        self._place_shots(seg, start, end, shots, a)
        if els:
            self.els += els(a)
        self.vo.append((seg, vo0))
        self.blocks.append(dict(name=seg, kind="vo", t0=start, t1=end, vo0=vo0, label=seg))
        self.T = end
        return a

    def span(self, b0, b1):
        t0 = next(b["t0"] for b in self.blocks if b["name"] == b0)
        t1 = next(b["t1"] for b in self.blocks if b["name"] == b1)
        return t0, t1

    def blk(self, name):
        return next(b for b in self.blocks if b["name"] == name)


def V(src, until=None, d=None, ss=0.0, treat=None, **kw):
    s = dict(kind="v", src=src, ss=ss, treat=treat, **kw)
    if until is not None:
        s["until"] = until
    if d is not None:
        s["d"] = d
    return s


def I(src, until=None, d=None, kb=None, treat=None, box=None, **kw):
    s = dict(kind="i", src=src, kb=kb or ("in",), treat=treat, box=box, **kw)
    if until is not None:
        s["until"] = until
    if d is not None:
        s["d"] = d
    return s


def P(src, until=None, d=None, **kw):
    """Framed portrait inset over a blurred copy of itself."""
    s = dict(kind="p", src=src, **kw)
    if until is not None:
        s["until"] = until
    if d is not None:
        s["d"] = d
    return s


def C(until=None, d=None, bg=None, **kw):
    """Plain graphic background (ink paper) for charts; bg optional faint photo."""
    s = dict(kind="c", src=bg, **kw)
    if until is not None:
        s["until"] = until
    if d is not None:
        s["d"] = d
    return s


# Crop boxes (normalised l,t,r,b) for photos with unwanted detail.
WESTPAC_BOX = (0.40, 0.05, 1.0, 0.80)   # excludes the in-store rate poster on the left
CBA_BOX = (0.0, 0.0, 0.52, 0.62)         # bank sign + doors, away from the window rate display
F01_Y = 0.42                              # vertical clip: 16:9 band position


def build():
    c = Cut()
    E = D  # shorthand

    # ================================================================ H0 open titles
    c.hold("H0", 7.6, [
        V("F35", d=2.5, ss=1.0),
        I("IMG-25", kb=("in", 1.0, 1.10)),
    ], els=lambda a: [
        E.vignette(a.s, a.e),
        E.scrim(a.r(2.5), a.e, 90),
        E.title_card(a.r(2.8), a.e - 0.05),
    ])
    c.sfx.append(("series_sting.flac", 0.0, -3.0))

    # ================================================================ cold open S01–S04
    c.seg("S01", [
        I("IMG-02", until="The Reserve Bank’s cash rate", kb=("up", 1.04, 1.14)),
        V("F25", until="And within days", ss=2.0, treat="dark"),
        I("IMG-21", until="passed the full increase", box=CBA_BOX, kb=("in", 1.0, 1.08)),
        I("IMG-22", box=WESTPAC_BOX, kb=("left", 1.04, 1.10)),
    ], els=lambda a: [
        E.tag(a("On the twenty-ninth") + 0.3, a("The Reserve Bank’s cash rate") - 0.2, "RESERVE BANK OF AUSTRALIA",
              "29 September 2026 · interest rates raised for the fourth time this year"),
        E.big_number(a("The Reserve Bank’s cash rate"), a("And within days") - 0.15, "4.6%",
                     "The Reserve Bank’s cash rate · the highest since 2011", kicker="CASH RATE NOW"),
        E.tag(a("And within days") + 0.4, a.e, "WITHIN DAYS",
              "All four of Australia’s big banks passed the full increase on to people with home loans"),
    ])
    c.seg("S02", [
        I("IMG-01", until="I guess possibly", kb=("in", 1.0, 1.08, (0.5, 0.36))),
        I("IMG-01", kb=("in", 1.12, 1.18, (0.5, 0.36)), treat="blur"),
    ], els=lambda a: [
        E.lower_third(a.s + 0.4, a("Her answer was") - 0.3, "Michele Bullock", "Governor, Reserve Bank of Australia"),
        E.quote_card(a("I guess possibly") - 0.25, a.e, "“I guess possibly.”",
                     intro="Asked whether Australia might need a recession to bring inflation back down",
                     who="MICHELE BULLOCK · RBA GOVERNOR"),
    ])
    c.seg("S03", [
        V("F07", until="Rents have kept rising", ss=3.0, treat="dark"),
        V("B01", until="And for a lot of younger", ss=0.3),
        I("IMG-23", until="a house, a backyard", kb=("in", 1.02, 1.12)),
        V("B02", ss=0.0),
    ], els=lambda a: [
        E.big_number(a.s + 0.2, a("Rents have kept rising") - 0.15, "$600,000+",
                     "The average first home buyer is now borrowing more than six hundred thousand dollars · a record",
                     kicker="FIRST HOME BUYERS", size=200),
        E.ai_label(a("Rents have kept rising") - 0.12, a("And for a lot of younger") - 0.12),
        E.tag(a("Rents have kept rising") + 0.2, a("And for a lot of younger") - 0.2, "MEANWHILE",
              "Rents have kept rising", pos="tl", width=700),
        E.tag(a("a house, a backyard") - 0.3, a.e, "THE DREAM THEIR PARENTS HAD",
              "A house, a backyard and a mortgage they could actually pay off"),
        E.ai_label(a("a house, a backyard") - 0.12, a.e),
    ])
    c.seg("S04", [
        V("F03", until="We have five suspects", ss=2.0, treat="dark"),
        C(until="and by the end", bg="IMG-20"),
        I("IMG-25", kb=("out", 1.14, 1.02)),
    ], els=lambda a: [
        E.headline(a("who killed") - 0.2, a("We have five suspects") - 0.15,
                   ["WHO KILLED THE AUSTRALIAN DREAM", "OF OWNING A HOME?"], kicker="ONE QUESTION", size=104),
        E.board(a("We have five suspects") - 0.1, a("and by the end") - 0.15,
                ["?", "?", "?", "?", "?"],
                [a("We have five suspects") + 0.1 + 0.25 * i for i in range(5)], 1e9, 1e9,
                thumbs=None or __import__("media").thumbs_unknown()),
        E.headline(a("you’ll be the jury") - 0.4, a.e, ["YOU’LL BE THE JURY"], size=120, y=760),
    ])

    # ================================================================ Sam + locks S05–S07
    c.seg("S05", [
        I("IMG-18", until="Sam is twenty-nine", kb=("in", 1.02, 1.12)),
        V("F09", ss=1.0),
    ], els=lambda a: [
        E.tag(a("meet Sam") - 0.1, a("Sam is twenty-nine") - 0.2, "MEET SAM",
              "Sam isn’t a real person. Sam is an example, built from the official numbers.", width=1100),
        *E.stack(a("Sam is twenty-nine") - 0.1,
                 [a("Sam is twenty-nine") - 0.1, a("works full time") - 0.1, a("rents a unit") - 0.1,
                  a("trying to buy") - 0.1], a.e,
                 ["Twenty-nine", "Works full time", "Rents a unit", "Trying to buy a first home"],
                 title="Sam · fictional example", x=150, y=300, size=52, numbered=False, width=900),
    ])
    c.seg("S06", [
        V("F29", until="Part two is the loan", ss=0.5, treat="dark"),
        V("F11", until="And part three", ss=2.0, treat="dark"),
        I("IMG-10", until="Each of our five suspects", treat="dark", kb=("in", 1.0, 1.08)),
        V("F06", ss=2.0, treat="dark"),
    ], els=lambda a: [
        E.locks_big(a.s + 0.2, a.e,
                    [a("Part one is the deposit") - 0.1, a("Part two is the loan") - 0.1, a("And part three") - 0.1],
                    ["Money you pay upfront, from your own savings",
                     "The mortgage, paid back every month, with interest",
                     "Finding a home Sam can afford at all"],
                    end_hot=a("Each of our five suspects")),
    ])
    c.seg("S07", [
        V("F05", until="In just three months", ss=1.0, treat="dark"),
        V("F31", until="So Sam isn’t just saving", ss=2.0, treat="dark"),
        V("F01", ss=3.0, crop_y=F01_Y),
    ], els=lambda a: [
        E.big_number(a("At the end of twenty") - 0.1, a("In just three months") - 0.15, "$607,624",
                     "Average first home buyer loan in Australia · end of 2025", kicker="THE AVERAGE LOAN",
                     count=(400000, 607624, lambda v: f"${int(v):,}"), build=1.6),
        E.big_number(a("In just three months") - 0.05, a("So Sam isn’t just saving") - 0.15, "+8.5%",
                     "In just three months · the biggest rise the ABS had ever recorded", kicker="THE JUMP",
                     source="SOURCE: ABS", colour=D.RED),
        E.tag(a("Sam is preparing") - 0.2, a.e, "SAM’S DEBT",
              "More than six hundred thousand dollars, for the next thirty years"),
    ])

    # ================================================================ Suspect 1 — RBA
    c.hold("H1", HOLD, [
        V("F25", d=1.5, ss=8.0),
        I("IMG-02", kb=("up", 1.06, 1.14), treat="dark"),
    ], els=lambda a: [E.suspect_card(a.r(0.35), a.e, 1, ["THE RESERVE BANK"], sub="RESERVE BANK OF AUSTRALIA")])
    c.sfx += [("coin.wav", c.blk("H1")["t0"] + 0.05, -10), ("whoosh.wav", c.blk("H1")["t0"] + 0.25, -12)]

    c.seg("S08", [
        I("IMG-03", until="The R B A’s main job", kb=("left", 1.05, 1.12)),
        V("F19", until="Inflation simply means", ss=1.0, treat="dark"),
        V("F32", ss=1.0, treat="dark"),
    ], els=lambda a: [
        E.tag(a("Our first suspect") + 0.3, a("The R B A’s main job") - 0.2, "SUSPECT 1",
              "The Reserve Bank of Australia · the RBA · Australia’s central bank"),
        E.big_number(a("The R B A’s main job"), a("Inflation simply means") - 0.15, "2–3%",
                     "The RBA’s main job: keep inflation between two and three per cent a year",
                     kicker="THE TARGET"),
        E.definition(a("Inflation simply means") - 0.1, a.e, "Inflation", "How fast prices are rising."),
    ])
    c.seg("S09", [
        I("IMG-02", until="When the R B A raises", treat="dark", kb=("up", 1.02, 1.1)),
        I("IMG-21", box=CBA_BOX, treat="dark", kb=("in", 1.02, 1.1)),
    ], els=lambda a: [
        E.definition(a("The R B A’s main tool") + 0.2, a("When the R B A raises") - 0.15, "The cash rate",
                     "The interest rate banks pay when they borrow money from each other overnight.",
                     kicker="THE RBA’S MAIN TOOL"),
        *E.flow(a("When the R B A raises") - 0.1,
                [a("When the R B A raises") - 0.1, a("borrowing gets more expensive") - 0.1,
                 a("pass that cost on") - 0.2],
                a.e, ["The RBA raises the cash rate", "Borrowing gets more expensive for the banks",
                      "Banks pass it on: higher mortgage rates for people like Sam"], y=400),
    ])
    c.seg("S10", [
        V("F21", until="The R B A is deliberately", ss=8.0, treat="dark"),
        V("F20", ss=1.0, treat="dark"),
    ], els=lambda a: [
        *E.flow(a("Because when loans") - 0.1,
                [a("Because when loans") - 0.1, a("people spend less") - 0.1, a("prices stop rising") - 0.1],
                a("The R B A is deliberately") - 0.15,
                ["Loans cost more", "People spend less", "Prices stop rising as fast"],
                kicker="WHY MAKE BORROWING MORE EXPENSIVE?"),
        E.tag(a("The R B A is deliberately"), a.e, "ON PURPOSE",
              "The RBA is deliberately slowing the economy down to cool inflation"),
    ])
    c.seg("S11", [
        C(until="The Australian Council", bg="IMG-02"),
        V("F25", ss=10.0, treat="dark"),
    ], els=lambda a: [
        E.rate_timeline(a.s + 0.1, a("The Australian Council") - 0.15,
                        dict(cuts=a("cut the cash rate three times"), feb=a("In February"), mar=a("Then again in March"),
                             may=a("Again in May"), sep=a("And again in September"))),
        E.big_number(a("The Australian Council") - 0.05, a.e, "+$110",
                     "About $110 a month on the repayments on an average mortgage · the September rise alone",
                     kicker="AUSTRALIAN COUNCIL OF TRADE UNIONS ESTIMATE", size=190),
    ])
    c.seg("S12", [
        V("F07", until="But the R B A’s defence", ss=6.0, treat="dark"),
        I("IMG-03", until="And there’s a twist", treat="dark", kb=("right", 1.05, 1.12)),
        I("IMG-17", kb=("up", 1.02, 1.1)),
    ], els=lambda a: [
        E.headline(a.s + 0.15, a("But the R B A’s defence") - 0.15, ["THE CASE AGAINST THE RBA"],
                   sub="Sam’s repayments keep going up, and the RBA is the one raising them.", size=100),
        E.headline(a("But the R B A’s defence") - 0.05, a("And there’s a twist") - 0.15, ["THE RBA’S DEFENCE"],
                   sub="If the RBA lets inflation run, everything gets more expensive: groceries, petrol and rent.",
                   size=100),
        E.tag(a("For years before") - 0.3, a.e, "THE TWIST · BEFORE 2022",
              "Very low interest rates made borrowing cheap, and helped push house prices up"),
    ])
    c.seg("S13", [
        I("IMG-01", until="But the R B A controls", kb=("in", 1.02, 1.08, (0.5, 0.4)), treat="dark"),
        V("F25", until="Keep the R B A in mind", ss=4.0, treat="dark"),
        I("IMG-02", kb=("out", 1.15, 1.02)),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("But the R B A controls") - 0.15, ["THE RBA DIDN’T CREATE", "SAM’S HOUSING PROBLEM"],
                   size=100),
        E.headline(a("But the R B A controls") - 0.05, a("Keep the R B A in mind") - 0.15,
                   ["BUT IT CONTROLS THE PRICE", "OF THE MONEY SAM BORROWS"], size=100, colour=D.AMBER),
        E.tag(a("Keep the R B A in mind"), a.e, "KEEP THE RBA IN MIND",
              "Its decisions connect to every other suspect"),
    ])
    c.markers.append(("midroll", "Mid-roll 1 (after S13)", c.T + 0.05))

    # ================================================================ Suspect 2 — tax rules
    c.hold("H2", HOLD, [
        I("IMG-09", d=1.6, kb=("in", 1.02, 1.08)),
        I("IMG-16", kb=("left", 1.06, 1.12), treat="dark"),
    ], els=lambda a: [E.suspect_card(a.r(1.6), a.e, 2, ["THE TAX RULES", "FOR INVESTORS"],
                                     sub="NEGATIVE GEARING · CAPITAL GAINS TAX DISCOUNT")])
    h = c.blk("H2")["t0"]
    c.sfx += [("camera_shutter.wav", h + 0.02, -12), ("whoosh.wav", h + 1.55, -12)]

    c.seg("S14", [
        I("IMG-09", until="Both rules sound", kb=("up", 1.04, 1.12), treat="dark"),
        V("F05", ss=6.0, treat="dark"),
    ], els=lambda a: [
        *E.stack(a("negative gearing") - 0.1, [a("negative gearing") - 0.1, a("and the capital gains") - 0.1], a.e,
                 ["Negative gearing", "The capital gains tax discount"], title="Two tax rules", y=360, size=60,
                 width=1100),
    ])
    c.seg("S15", [
        V("B03", until="The rent comes in", ss=0.0),
        I("IMG-16", until="Negative gearing means", treat="dark", kb=("in", 1.02, 1.1)),
        V("F02", ss=0.5, treat="dark"),
    ], els=lambda a: [
        E.ai_label(a.s, a("The rent comes in") - 0.12),
        E.tag(a("Imagine an investor") - 0.1, a("The rent comes in") - 0.2, "NEGATIVE GEARING",
              "Imagine an investor buys a rental property"),
        *E.flow(a("The rent comes in") - 0.1,
                [a("The rent comes in") - 0.1, a("but the costs") - 0.1, a("So the property loses") - 0.1],
                a("Negative gearing means") - 0.15,
                ["The rent comes in", "Costs, mostly loan interest, are higher than the rent",
                 "The property loses money every year"], kicker="NEGATIVE GEARING"),
        *E.flow(a("Negative gearing means") - 0.05,
                [a("Negative gearing means") - 0.05, a("subtract it") - 0.1, a("pays less income tax") - 0.1],
                a.e, ["Take the loss", "Subtract it from wage income", "Pay less income tax"],
                kicker="WHAT NEGATIVE GEARING MEANS"),
    ])
    c.seg("S16", [
        I("IMG-09", until="Since nineteen", treat="dark", kb=("left", 1.04, 1.1)),
        C(until="That rule is called", bg="IMG-16"),
        V("F31", ss=8.0, treat="dark"),
    ], els=lambda a: [
        E.definition(a("A capital gain") - 0.1, a("Since nineteen") - 0.15, "A capital gain",
                     "The profit you make when you sell something for more than you paid for it.",
                     kicker="NOW THE CAPITAL GAINS TAX DISCOUNT"),
        E.bars(a("Since nineteen") - 0.1, a("That rule is called") - 0.15,
               [("The profit", 100, "", D.AMBER, a("Since nineteen")),
                ("Taxed: only half", 50, "HALF", D.RED, a("half of that profit") - 0.2)],
               "SINCE 1999", kicker="HELD FOR MORE THAN A YEAR", unit_max=118, bar_h=110),
        E.big_number(a("That rule is called") - 0.05, a.e, "50%", "The capital gains tax discount",
                     kicker="THE RULE", size=260),
    ])
    c.seg("S17", [
        V("F02", until="Critics say", ss=4.0, treat="dark"),
        I("IMG-16", until="In March twenty", kb=("right", 1.05, 1.12)),
        I("IMG-07", kb=("in", 1.02, 1.12), treat="dark"),
    ], els=lambda a: [
        *E.stack(a.s + 0.2, [a("lose a bit") - 0.1, a("pay less tax while") - 0.1, a("then sell later") - 0.1],
                 a("Critics say") - 0.15,
                 ["Lose a bit of money every year", "Pay less tax while you do it",
                  "Sell later, pay tax on only half the profit"], title="Put them together: a strategy", y=330,
                 size=52, width=1300),
        E.tag(a("Critics say") - 0.05, a("In March twenty") - 0.2, "CRITICS SAY",
              "The two tax rules turned houses into investment products, and put investors up against first home "
              "buyers like Sam at the same auctions", width=1250, size=38),
        E.headline(a("In March twenty") - 0.05, a.e, ["A SENATE COMMITTEE", "MARCH 2026"],
                   sub="Evidence that the two rules shifted home ownership away from people who live in their homes, "
                       "and towards investors", size=96, kicker="THE EVIDENCE"),
    ])
    c.seg("S18", [
        V("F23", until="Treasurer Jim Chalmers", ss=0.0),
        P("IMG-04", until="from the first of July"),
        C(until="On the twenty-fifth of June", bg="IMG-09"),
        I("IMG-07", kb=("up", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [
        E.tag(a("In the federal budget") - 0.1, a("Treasurer Jim Chalmers") - 0.2, "THE FEDERAL BUDGET",
              "12 May 2026", width=700),
        E.lower_third(a("Treasurer Jim Chalmers") + 0.1, a("from the first of July") - 0.2, "Jim Chalmers",
                      "Treasurer"),
        *E.stack(a("from the first of July") - 0.1,
                 [a("from the first of July") - 0.1, a("and the fifty per cent") - 0.1, a("Properties investors") - 0.1],
                 a("On the twenty-fifth of June") - 0.15,
                 ["Negative gearing limited to newly built homes",
                  "50% capital gains tax discount replaced with a system based on inflation",
                  "Properties investors already owned on budget night are protected"],
                 title="From 1 July 2027", y=300, size=48, width=1500, numbered=False,
                 colours=[D.AMBER, D.AMBER, D.TEAL]),
        *E.calendar(a("On the twenty-fifth of June") - 0.05,
                    [a("On the twenty-fifth of June") - 0.05, a("On the twenty-fifth of June") + 0.5,
                     a("with the support") - 0.1],
                    a.e, [("12 MAY 2026", "Announced in the federal budget"),
                          ("25 JUN 2026", "The changes passed Parliament, with the support of the Greens"),
                          ("1 JUL 2027", "The changes start")], title="THE CHANGES"),
    ])
    c.seg("S19", [
        I("IMG-19", until="Critics of the new rules", kb=("left", 1.04, 1.1)),
        V("F09", until="And modelling released", ss=6.0, treat="dark"),
        V("F12", ss=3.0, treat="dark"),
    ], els=lambda a: [
        E.tag(a("The defence for negative") - 0.1, a("Critics of the new rules") - 0.2, "THE DEFENCE",
              "Investors provide many of Australia’s rental homes"),
        E.headline(a("Critics of the new rules") - 0.05, a("And modelling released") - 0.15,
                   ["IF INVESTORS STOP BUYING"], sub="Fewer rentals, and higher rents for renters like Sam?",
                   size=110, kicker="CRITICS OF THE NEW RULES ARGUE"),
        E.headline(a("And modelling released") - 0.05, a.e, ["LESS NEW HOUSING SUPPLY", "IN EVERY SCENARIO"],
                   kicker="HOUSING INDUSTRY ASSOCIATION MODELLING · MARCH 2026",
                   sub="Cutting these tax breaks would reduce new housing supply in every scenario it tested.",
                   size=104),
    ])
    c.seg("S20", [
        V("F06", until="That question leads", ss=6.0, treat="dark"),
        V("F13", ss=2.0),
    ], els=lambda a: [
        E.big_number(a("But the changes") - 0.1, a("and nobody knows") - 0.1, "JULY 2027",
                     "The changes to the two tax rules don’t start until then", kicker="NOT YET", size=200),
        E.headline(a("and nobody knows") - 0.05, a("That question leads") - 0.15,
                   ["HELP SAM AS A BUYER?", "OR HURT SAM AS A RENTER?"], kicker="NOBODY KNOWS YET", size=104),
        E.tag(a("our third suspect") - 0.3, a.e, "NEXT",
              "The number of homes Australia actually builds"),
    ])

    # ================================================================ Suspect 3 — supply
    c.hold("H3", HOLD, [
        V("F14", d=1.6, ss=2.0),
        I("IMG-15", kb=("in", 1.04, 1.14), treat="dark"),
    ], els=lambda a: [E.suspect_card(a.r(0.4), a.e, 3, ["THE SHORTAGE", "OF HOMES"], sub="SUPPLY")])
    c.sfx += [("whoosh.wav", c.blk("H3")["t0"] + 0.3, -12)]

    c.seg("S21", [
        I("IMG-10", until="Economists who disagree", kb=("in", 1.02, 1.1)),
        V("F15", ss=1.0, treat="dark"),
    ], els=lambda a: [
        E.headline(a("Australia isn’t building") - 0.2, a("Economists who disagree") - 0.15,
                   ["AUSTRALIA ISN’T BUILDING", "ENOUGH HOMES"], size=110),
        E.definition(a("Economists who disagree") - 0.05, a.e, "Supply",
                     "How many homes actually exist. Economists tend to agree it sits at the core of Australia’s housing problem.",
                     kicker="PLAIN ENGLISH"),
    ])
    c.seg("S22", [
        I("IMG-11", until="The Housing Accord now", kb=("right", 1.04, 1.1)),
        I("IMG-24", until="To stay on track", treat="dark", kb=("in", 1.02, 1.08)),
        C(bg="IMG-12"),
    ], els=lambda a: [
        E.tag(a("In twenty twenty-two") - 0.1, a("The Housing Accord now") - 0.2, "2022",
              "Federal, state and local governments, builders and unions agreed to the National Housing Accord",
              width=1200),
        E.big_number(a("The Housing Accord now") - 0.05, a("To stay on track") - 0.15, "1.2 MILLION",
                     "New homes in the five years from July 2024 to June 2029", kicker="THE HOUSING ACCORD TARGET",
                     size=200),
        E.bars(a("To stay on track") - 0.1, a.e,
               [("Needed to stay on track", 420000, "about 420,000", D.PAPER, a("To stay on track") + 0.3),
                ("Completed", 307635, "307,635", D.RED, a("Australia completed") - 0.05)],
               "THE FIRST 21 MONTHS", kicker="HOUSING ACCORD", unit_max=560000),
    ])
    c.seg("S23", [
        I("IMG-14", until="And the reasons", kb=("in", 1.02, 1.1), treat="dark"),
        V("F17", until="The conflict in the Middle", ss=1.0, treat="dark"),
        I("IMG-12", until="And the building industry says", treat="dark", kb=("left", 1.04, 1.1)),
        I("IMG-13", treat="dark", kb=("in", 1.02, 1.1)),
    ], els=lambda a: [
        E.big_number(a.s + 0.15, a("And the reasons") - 0.15, "END OF 2030",
                     "When the government’s own housing advisers now expect the 1.2 million target to be reached",
                     kicker="TARGET SLIPS", size=200),
        *E.stack(a("And the reasons") - 0.05,
                 [a("Higher interest rates") - 0.1, a("The conflict in the Middle") - 0.1,
                  a("And the building industry says") - 0.1], a.e,
                 ["Higher interest rates (suspect number one): dearer for developers to borrow and build",
                  "The conflict in the Middle East: building materials and diesel cost more",
                  "Still not enough workers to do the building"],
                 title="Why Australia builds so slowly", y=320, size=46, width=1560),
    ])

    # ================================================================ ANALYSIS — zoning
    c.hold("H4", HOLD, [
        V("F03", d=1.7, ss=9.0),
        I("IMG-20", kb=("pan", 1.25, 1.25, (0.25, 0.6), (0.4, 0.6)), treat="dark"),
    ], els=lambda a: [E.suspect_card(a.r(0.4), a.e, "ANALYSIS", ["ZONING"])])
    c.sfx += [("typewriter_key.wav", c.blk("H4")["t0"] + 0.4 + 0.11 * i, -14) for i in range(4)]

    c.seg("S24", [
        V("B04", until="Large parts", ss=0.0),
        I("IMG-20", until="Building apartments", kb=("pan", 1.25, 1.25, (0.35, 0.6), (0.65, 0.6))),
        I("IMG-19", until="and objections", kb=("in", 1.02, 1.1)),
        I("IMG-17", kb=("up", 1.02, 1.1)),
    ], els=lambda a: [
        E.ai_label(a.s, a("Large parts") - 0.12),
        E.definition(a("it’s called zoning") - 0.1, a("Large parts") - 0.15, "Zoning",
                     "The set of local rules that decides what can be built, and where."),
        E.tag(a("Large parts") - 0.05, a("Building apartments") - 0.2, "BIG CITIES",
              "Large parts, many close to jobs and train lines, are zoned mostly for single houses", width=1150),
        E.tag(a("Building apartments") - 0.05, a("and objections") - 0.2, "APARTMENTS OR TOWNHOUSES",
              "Can mean long approval processes", width=900),
        E.tag(a("and objections") - 0.05, a.e, "AND", "Objections from local residents", width=900),
    ])
    c.seg("S25", [
        V("F05", until="And the building industry’s", ss=10.0, treat="dark"),
        I("IMG-15", until="According to the O E C D", treat="dark", kb=("in", 1.04, 1.12)),
        C(until="So who built too little", bg="IMG-20"),
        V("F13", ss=8.0, treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("And the building industry’s") - 0.15, ["RESIDENTS’ DEFENCE"],
                   sub="Schools, roads and hospitals haven’t kept up with the people already living there.",
                   size=110),
        E.headline(a("And the building industry’s") - 0.05, a("According to the O E C D") - 0.15,
                   ["THE BUILDING INDUSTRY’S DEFENCE"],
                   sub="Builders can only build what gets approved, financed and staffed.", size=100),
        E.big_number(a("According to the O E C D") - 0.05, a("So who built too little") - 0.15, "ABOUT 400",
                     "homes for every 1,000 people going into the COVID pandemic · one of the lowest numbers in the "
                     "developed world", kicker="AUSTRALIA · OECD", source="SOURCE: OECD", size=220),
        E.headline(a("So who built too little") - 0.05, a.e, ["SO WHO BUILT TOO LITTLE?"],
                   sub="The evidence points at almost everyone involved.", size=110),
    ])
    c.markers.append(("midroll", "Mid-roll 2 (after S25)", c.T + 0.05))

    # ================================================================ Suspect 4 — population
    c.hold("H5", HOLD, [
        V("F24", d=1.8, ss=14.2),
        C(bg="F24frame"),
    ], els=lambda a: [
        E.bars(a.r(1.8), a.e, [("", 556000, "", D.RED, a.r(1.85)), ("", 306000, "", D.PAPER, a.r(2.0)),
                               ("", 292100, "", D.PAPER, a.r(2.15)), ("", 245000, "", D.MUTED, a.r(2.3))],
               "", unit_max=650000, bar_h=24, y0=700, label_w=420),
        E.suspect_card(a.r(0.3), a.e, 4, ["POPULATION GROWTH"], sub="AND ESPECIALLY MIGRATION"),
    ])
    c.sfx += [("whoosh.wav", c.blk("H5")["t0"] + 0.25, -12)]

    c.seg("S26", [
        V("F24", until="Migration is one of", ss=5.0),
        V("F35", ss=1.5),
    ], els=lambda a: [
        E.tag(a("Migration is one of") - 0.05, a.e, "FOR THIS SUSPECT", "We’re going to stick closely to the "
                                                                         "official numbers", width=1000),
    ])
    c.seg("S27", [
        C(until="After COVID", bg="F24frame"),
        C(bg="F24frame"),
    ], els=lambda a: [
        E.definition(a("The key number") + 0.3, a("After COVID") - 0.15, "Net overseas migration",
                     "People who moved to Australia, minus people who left Australia, over a year."),
        E.bars(a("After COVID") - 0.05, a.e,
               [("Peak · year to September 2023", 556000, "556,000", D.RED, a("peaked at") - 0.1)],
               "NET OVERSEAS MIGRATION", kicker="AFTER COVID, WHEN BORDERS REOPENED", unit_max=650000,
               label_w=560, bar_h=90),
    ])
    nom_items = None

    def s28(a):
        items = [("Peak · year to September 2023", 556000, "556,000", D.RED, a.s - 1.0),
                 ("2024–25 financial year", 306000, "306,000", D.PAPER, a("to three hundred and six") - 0.1),
                 ("Year to March 2026", 292100, "292,100", D.PAPER, a("and to two hundred and ninety") - 0.1),
                 ("This financial year · government expects", 245000, "about 245,000", D.AMBER,
                  a("The government expects") + 0.4)]
        return [
            E.bars(a.s, a("Even so") - 0.15, items, "NET OVERSEAS MIGRATION", kicker="SINCE THAT PEAK",
                   unit_max=650000, label_w=560, bar_h=90),
            E.headline(a("Even so") - 0.05, a("And more people") - 0.15,
                       ["STILL THE BIGGEST DRIVER", "OF POPULATION GROWTH"], size=110),
            *E.flow(a("And more people") - 0.05, [a("And more people") - 0.05, a("more demand") - 0.1,
                                                   a("more competition") - 0.1], a.e,
                    ["More people", "More demand for homes", "More competition for rentals"]),
        ]
    c.seg("S28", [
        C(until="Even so", bg="F24frame"),
        I("IMG-18", until="And more people", treat="dark", kb=("in", 1.02, 1.1)),
        V("F08", ss=4.0, treat="dark"),
    ], els=s28)
    c.seg("S29", [
        I("IMG-13", until="Australia’s building industry", kb=("in", 1.02, 1.1)),
        I("IMG-12", until="Master Builders", treat="dark", kb=("right", 1.04, 1.1)),
        V("F16", ss=4.0, treat="dark"),
    ], els=lambda a: [
        E.tag(a.s + 0.2, a("Australia’s building industry") - 0.2, "THE OTHER SIDE",
              "Migrants also help build homes"),
        E.headline(a("Australia’s building industry") - 0.05, a("Master Builders") - 0.15,
                   ["PRIORITY FOR BUILDING SKILLS"],
                   sub="The building industry is short of workers. The government has already changed migration "
                       "settings.", size=104, kicker="MIGRATION SETTINGS"),
        E.headline(a("Master Builders") - 0.05, a.e, ["LET INTERNATIONAL STUDENTS", "TRAIN AS APPRENTICES"],
                   kicker="MASTER BUILDERS AUSTRALIA HAS ASKED", size=104),
    ])
    c.seg("S30", [
        I("IMG-06", until="The honest question is", kb=("in", 1.02, 1.08)),
        V("F23", until="And that question", ss=3.0, treat="dark"),
        I("IMG-24", kb=("left", 1.04, 1.1)),
    ], els=lambda a: [
        E.tag(a.s + 0.2, a("The honest question is") - 0.2, "THE HONEST QUESTION",
              "Isn’t whether migrants are good or bad", width=900),
        E.headline(a("The honest question is") - 0.05, a("And that question") - 0.15,
                   ["DID GOVERNMENTS LET THE POPULATION", "GROW FASTER THAN THEY PLANNED",
                    "TO BUILD HOMES FOR IT?"], kicker="GOVERNMENTS FROM BOTH MAJOR PARTIES", size=92),
        E.tag(a("And that question") - 0.05, a.e, "CONNECTS STRAIGHT BACK TO", "Suspect number three",
              width=800),
    ])

    # ================================================================ Suspect 5 — Deposit Scheme
    c.hold("H6", HOLD, [
        V("F26", d=1.8, ss=1.0),
        I("IMG-22", box=WESTPAC_BOX, kb=("in", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [E.suspect_card(a.r(0.4), a.e, 5, ["THE FIVE PER CENT", "DEPOSIT SCHEME"])])
    c.sfx += [("door.wav", c.blk("H6")["t0"] + 0.9, -12), ("whoosh.wav", c.blk("H6")["t0"] + 0.3, -14)]

    c.seg("S31", [
        V("F11", until="The fifth suspect is", ss=6.0, treat="dark"),
        I("IMG-10", kb=("in", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("The fifth suspect is") - 0.15, ["IT LOOKS INNOCENT"],
                   sub="Because it’s trying to help Sam.", size=120),
        E.headline(a("The fifth suspect is") - 0.05, a.e, ["THE FIVE PER CENT", "DEPOSIT SCHEME"],
                   kicker="THE FEDERAL GOVERNMENT · FOR FIRST HOME BUYERS", size=120),
    ])
    c.seg("S32", [
        I("IMG-22", until="Lenders mortgage insurance protects", box=WESTPAC_BOX, treat="dark",
          kb=("left", 1.04, 1.1)),
        V("F10", until="Under the five per cent", ss=1.0, treat="dark"),
        C(until="On the first of October", bg="IMG-10"),
        V("F31", ss=12.0, treat="dark"),
    ], els=lambda a: [
        *E.flow(a("Normally") - 0.1, [a("Normally") - 0.1, a("the bank makes you pay") - 0.1], a("Lenders mortgage insurance protects") - 0.15,
                ["Deposit smaller than 20% of the price", "The bank makes you pay lenders mortgage insurance"],
                kicker="NORMALLY", box_w=640),
        E.headline(a("Lenders mortgage insurance protects") - 0.05, a("Under the five per cent") - 0.15,
                   ["IT PROTECTS THE BANK,", "NOT YOU"], kicker="LENDERS MORTGAGE INSURANCE",
                   sub="It can cost thousands of dollars.", size=120),
        E.bars(a("Under the five per cent") - 0.05, a("On the first of October") - 0.15,
               [("Normally, to avoid the insurance", 20, "20%", D.PAPER, a("Under the five per cent") + 0.2),
                ("Under the scheme", 5, "5%", D.AMBER, a("buy with just") - 0.1)],
               "THE DEPOSIT", kicker="THE GOVERNMENT GUARANTEES PART OF THE LOAN · NO INSURANCE",
               unit_max=26, label_w=560),
        E.big_number(a("On the first of October") - 0.05, a.e, "1 OCTOBER 2025",
                     "The scheme was expanded to first home buyers of all incomes", kicker="EXPANDED", size=180),
    ])
    c.seg("S33", [
        V("F07", until="In the three months after", ss=9.0, treat="dark"),
        V("F03", until="And property data firm", ss=4.0, treat="dark"),
        I("IMG-16", kb=("in", 1.02, 1.1), treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("In the three months after") - 0.15, ["THE CASE AGAINST"],
                   sub="It gives buyers more money to spend, while the number of homes stays the same.", size=120),
        E.big_number(a("In the three months after") - 0.05, a("And property data firm") - 0.15, "+8.5%",
                     "Average first home buyer loan, in the three months after the scheme was expanded · a record",
                     kicker="THE JUMP", colour=D.RED),
        E.headline(a("And property data firm") - 0.05, a.e, ["PUSHING UP PRICES AT THE", "CHEAPER END OF THE MARKET"],
                   kicker="PROPERTY DATA FIRM COTALITY", sub="Exactly the homes first home buyers like Sam are "
                                                             "trying to buy.", size=100),
    ])
    c.seg("S34", [
        V("F31", until="A spokesperson", ss=2.0, treat="dark"),
        P("IMG-05", until="But there’s a risk"),
        C(until="So if prices fall", bg="IMG-10"),
        V("F29", ss=6.0, treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("A spokesperson") - 0.15, ["THE GOVERNMENT’S DEFENCE"],
                   sub="Without the scheme, many first home buyers would struggle to get into the market at all.",
                   size=110),
        E.lower_third(a("A spokesperson") + 0.2, a("said the government") - 0.1, "Clare O’Neil", "Housing Minister"),
        E.tag(a("said the government") - 0.1, a("But there’s a risk") - 0.2,
              "A SPOKESPERSON FOR HOUSING MINISTER CLARE O’NEIL",
              "No apologies for helping hundreds of thousands of first home buyers while it fixes a supply problem "
              "generations in the making", width=1000, size=38),
        E.bars(a("A five per cent deposit") - 0.1, a("So if prices fall") - 0.15,
               [("Deposit", 5, "5%", D.AMBER, a("A five per cent deposit")),
                ("Loan", 95, "95%", D.RED, a("means a ninety-five") - 0.1)],
               "THE RISK", kicker="A FIVE PER CENT DEPOSIT MEANS", unit_max=118, label_w=360),
        E.headline(a("So if prices fall") - 0.05, a.e, ["OWING MORE THAN THEIR", "HOME IS WORTH"],
                   kicker="IF PRICES FALL, OR INTEREST RATES RISE", sub="Recent buyers can end up there.", size=110),
    ])
    c.markers.append(("midroll", "Mid-roll 3 (after S34)", c.T + 0.05))
    c.hold("M3", 1.8, [V("F01", ss=12.0, crop_y=0.5)], els=lambda a: [E.scrim(a.s, a.e, 60)])

    # ================================================================ The board S35
    c.seg("S35", [
        C(bg="IMG-25"),
    ], els=lambda a: [
        E.board(a.s, a.e, ["The Reserve Bank", "The tax rules for investors", "The shortage of homes",
                           "Population growth", "The 5% Deposit Scheme"],
                [a("the Reserve Bank") - 0.1, a("the tax rules") - 0.1, a("the shortage") - 0.1,
                 a("population growth") - 0.1, a("and the five per cent") - 0.1],
                a("when you put all five") - 0.1, a("none of the five") - 0.05,
                thumbs=__import__("media").thumbs_board()),
    ])

    # ================================================================ ANALYSIS S36–S38
    c.hold("H7", HOLD, [
        V("F06", d=1.8, ss=9.0, treat="dark"),
        V("F02", ss=6.0, treat="dark"),
    ], els=lambda a: [E.locks_big(a.s, a.e, [a.s + 0.1, a.s + 0.3, a.s + 0.5],
                                  ["", "", ""], end_hot=a.r(1.4))])
    c.sfx += [("typewriter_key.wav", c.blk("H7")["t0"] + 0.2 + 0.11 * i, -14) for i in range(4)]

    c.seg("S36", [
        I("IMG-17", until="Tax rules made", kb=("in", 1.02, 1.08), treat="dark"),
        I("IMG-16", until="Population grew", kb=("left", 1.04, 1.1), treat="dark"),
        I("IMG-20", until="And schemes like", kb=("pan", 1.25, 1.25, (0.6, 0.6), (0.4, 0.6)), treat="dark"),
        V("F03", until="Then inflation came back", ss=12.0, treat="dark"),
        I("IMG-02", kb=("out", 1.14, 1.02), treat="dark"),
    ], els=lambda a: [
        *E.stack(a.s + 0.1, [a.s + 0.1, a("Tax rules made") - 0.1, a("Population grew") - 0.1,
                             a("And schemes like") - 0.1, a("Then inflation came back") - 0.1], a.e,
                 ["Years of low interest rates made borrowing cheap",
                  "Tax rules made property one of the most attractive investments in the country",
                  "Population grew quickly while building fell behind",
                  "Schemes like the 5% Deposit Scheme added even more buyers chasing the same small supply",
                  "Then inflation came back, and the Reserve Bank raised interest rates"],
                 y=200, size=42, width=1500),
        E.tag(a("and Sam got squeezed") - 0.1, a.e, "AND SAM", "Got squeezed from every direction at once",
              pos="br", width=900),
    ])
    c.hold("H8", 2.2, [I("IMG-23", kb=("in", 1.04, 1.1))])
    c.seg("S37", [
        V("B05", until="About two in three", ss=0.0),
        I("IMG-17", until="For those households", kb=("up", 1.02, 1.1), treat="dark"),
        V("F04", ss=1.0, treat="dark"),
    ], els=lambda a: [
        E.ai_label(a.s, a("About two in three") - 0.12),
        E.tag(a("But there’s one more") + 0.2, a("About two in three") - 0.2, "ONE MORE SUSPECT",
              "The hardest one to talk about", width=800),
        E.big_number(a("About two in three") - 0.05, a("For those households") - 0.15, "ABOUT 2 IN 3",
                     "Australian households own the home they live in", kicker="HOME OWNERSHIP", size=200),
        E.headline(a("For those households") - 0.05, a.e, ["RISING HOUSE PRICES"],
                   sub="For those households, mostly good news.", size=120),
    ])
    c.seg("S38", [
        V("F23", until="In twenty nineteen", ss=5.0, treat="dark"),
        I("IMG-08", until="So the uncomfortable", kb=("in", 1.02, 1.1), treat="dark"),
        V("F01", ss=14.0, crop_y=0.35, treat="dark"),
    ], els=lambda a: [
        E.headline(a.s + 0.2, a("In twenty nineteen") - 0.15, ["EVERY POLITICIAN KNOWS", "THOSE NUMBERS"],
                   size=110),
        *E.calendar(a("In twenty nineteen") - 0.05,
                    [a("In twenty nineteen") - 0.05, a("By the twenty twenty-two") - 0.1, a("It took until") - 0.1],
                    a("So the uncomfortable") - 0.15,
                    [("2019", "Labor took a plan to change negative gearing to a federal election, and lost"),
                     ("2022", "By this election, Labor had dropped the plan"),
                     ("2026", "It took until 2026 for negative gearing to change at all")], title="NEGATIVE GEARING"),
        E.headline(a("did the Australian dream die") - 0.2, a("Or did the Australian") - 0.1,
                   ["DID THE AUSTRALIAN DREAM DIE?"], size=110, kicker="THE UNCOMFORTABLE QUESTION"),
        E.headline(a("Or did the Australian") - 0.05, a.e,
                   ["OR DID IT GET SLOWLY TRADED AWAY,", "BY THE PEOPLE WHO ALREADY HAD IT?"], size=96,
                   colour=D.AMBER),
    ])

    # ================================================================ WHAT COULD HAPPEN S39
    c.hold("H9", HOLD, [
        V("F23", d=1.8, ss=0.5),
        I("IMG-02", kb=("up", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [E.headline(a.r(1.0), a.e, ["WHAT HAPPENS NEXT FOR SAM?"], size=110)])
    c.sfx += [("typewriter_key.wav", c.blk("H9")["t0"] + 0.3 + 0.11 * i, -14) for i in range(4)]

    c.seg("S39", [
        V("F21", until="The Reserve Bank meets", ss=12.0, treat="dark"),
        I("IMG-01", until="The changes to negative", kb=("in", 1.02, 1.08, (0.5, 0.4)), treat="dark"),
        I("IMG-09", until="And the Housing Accord", kb=("left", 1.04, 1.1), treat="dark"),
        I("IMG-14", kb=("in", 1.02, 1.1), treat="dark"),
    ], els=lambda a: [
        *E.calendar(a.s + 0.2, [a("In late October") - 0.1, a("The Reserve Bank meets") - 0.1,
                                a("The changes to negative") - 0.1, a("And the Housing Accord") - 0.1], a.e,
                    [("LATE OCT", "New inflation figures come out"),
                     ("3 NOV", "The Reserve Bank meets. Some economists expect another rise"),
                     ("1 JUL 2027", "Negative gearing and capital gains tax discount changes start"),
                     ("END OF 2030", "Around when the Accord’s 1.2 million homes are now expected")],
                    title="WHAT HAPPENS NEXT"),
    ])

    # ================================================================ Verdict S40
    c.hold("H10", 3.4, [
        V("F35", d=1.7, ss=6.0),
        I("IMG-25", kb=("in", 1.04, 1.12), treat="dark"),
    ], els=lambda a: [E.suspect_card(a.r(0.3), a.e, "THE VERDICT", ["YOU’LL BE THE JURY"])])
    c.sfx += [("whoosh.wav", c.blk("H10")["t0"] + 0.2, -13)]

    c.seg("S40", [
        V("F22", until="Tell us in the comments", ss=0.0, treat="dark"),
        V("F02", until="Every source used", ss=2.0, treat="dark"),
        V("F31", until="And if you want", ss=4.0, treat="dark"),
        I("IMG-25", kb=("out", 1.14, 1.02), treat="dark"),
    ], tail=0.6, els=lambda a: [
        *E.ballot(a.s + 0.1, [a("Was it the Reserve Bank") - 0.05, a("the tax rules") - 0.1,
                              a("the shortage") - 0.1, a("population growth") - 0.1,
                              a("the five per cent") - 0.1, a("or all of them together") - 0.1],
                  a("Tell us in the comments") - 0.15,
                  ["The Reserve Bank", "The tax rules for investors", "The shortage of homes",
                   "Population growth", "The 5% Deposit Scheme", "All of them together"],
                  "WHO KILLED THE AUSTRALIAN DREAM?"),
        E.headline(a("Tell us in the comments") - 0.05, a("Every source used") - 0.15,
                   ["WHICH ONE SUSPECT", "WOULD YOU ARREST?"], sub="And why? Tell us in the comments.", size=120),
        E.headline(a("Every source used") - 0.05, a("And if you want") - 0.15, ["EVERY SOURCE IS", "IN THE DESCRIPTION"],
                   sub="So you can check every number yourself.", size=120),
        E.end_card(a("And if you want") - 0.05, a.e + 5.0,
                   "MORE EVIDENCE-BASED DEEP DIVES INTO AUSTRALIAN POLITICS"),
    ])
    c.hold("END", 5.0, [I("IMG-25", kb=("out", 1.02, 1.0), treat="dark")])

    # ================================================================ global furniture
    def tagspan(b0, b1, k, t, skip_first=0.0):
        t0, t1 = c.span(b0, b1)
        c.els.append(E.chapter_tag(t0 + skip_first, t1, k, t))

    tagspan("S05", "S07", "MEET SAM", "A FICTIONAL EXAMPLE")
    tagspan("S08", "S13", "SUSPECT 1", "THE RESERVE BANK")
    tagspan("S14", "S20", "SUSPECT 2", "THE TAX RULES FOR INVESTORS")
    tagspan("S21", "S23", "SUSPECT 3", "THE SHORTAGE OF HOMES")
    tagspan("S25", "S25", "SUSPECT 3", "THE SHORTAGE OF HOMES")
    tagspan("S26", "S30", "SUSPECT 4", "POPULATION GROWTH")
    tagspan("S31", "S34", "SUSPECT 5", "THE FIVE PER CENT DEPOSIT SCHEME")
    tagspan("S40", "S40", "THE VERDICT", "YOU’LL BE THE JURY")
    for b0, b1, lab in [("S24", "S24", "ANALYSIS"), ("H7", "S38", "ANALYSIS"), ("H9", "S39", "WHAT COULD HAPPEN")]:
        t0, t1 = c.span(b0, b1)
        c.els.append(E.section_label(t0 + 0.2, t1, lab))
    t0, _ = c.span("H4", "H4")
    c.els.append(E.section_label(t0 + 0.2, c.blk("H4")["t1"], "ANALYSIS"))

    def hud(b0, b1, hot, past=()):
        t0, t1 = c.span(b0, b1)
        c.els.append(E.lock_hud(t0, t1, hot=hot, past=past, build=0.8))
    hud("S08", "S13", ("LOAN",))
    hud("S14", "S20", ("HOME",), ("LOAN",))
    hud("S21", "S23", ("HOME",), ("LOAN",))
    hud("S25", "S25", ("HOME",), ("LOAN",))
    hud("S26", "S30", ("HOME",), ("LOAN",))
    hud("S31", "S34", ("DEPOSIT", "LOAN"), ("HOME",))
    hud("S36", "S36", ("DEPOSIT", "LOAN", "HOME"))

    # ================================================================ music cues (1x abs times)
    def b(n, k="t0"):
        return c.blk(n)[k]

    c.music = [
        # file, start, end, offset_in_track, fade_in, fade_out, gain_db
        # (offsets chosen from a short-term loudness profile so holds land on a musical passage)
        (M_TENSE, b("H0") + 4.2, b("S07", "t1") + 1.2, 9.0, 2.0, 1.6, 0),
        (M_INV, b("H1") - 0.2, b("S13", "t1") + 1.0, 6.0, 0.5, 1.6, 0),
        (M_INV, b("H2") - 0.3, b("S17", "t1") + 0.6, 44.0, 0.5, 1.4, 0),
        (M_TENSE, b("S18") - 0.2, b("S20", "t1") + 1.0, 40.0, 1.2, 1.6, 0),
        (M_TENSE, b("H3") - 0.2, b("S23", "t1") + 1.0, 100.0, 0.5, 1.6, 0),
        (M_PIANO, b("H4") - 0.2, b("S25", "t1") + 1.0, 38.0, 0.6, 1.6, 0),
        (M_INV, b("H5") - 0.2, b("S30", "t1") + 1.0, 18.0, 0.5, 1.6, 2),
        (M_PIANO, b("H6") - 0.2, b("M3", "t1") + 0.4, 40.0, 0.6, 1.2, 0),
        (M_SURGE, b("S35") - 0.3, b("S35", "t1") + 1.2, 0.0, 0.8, 1.6, -1),
        (M_PIANO, b("H7") - 0.2, b("S38", "t1") + 1.0, 78.0, 0.6, 2.0, 0),
        (M_TENSE, b("H9") - 0.2, b("H9", "t1") + 1.2, 60.0, 0.3, 1.4, 0),
        (M_INV, b("S39") - 0.3, b("S39", "t1") + 1.0, 60.0, 1.2, 1.4, 0),
        (M_SURGE, b("H10") - 0.2, b("END", "t1"), 40.0, 0.5, 4.0, -1),
    ]
    return c


if __name__ == "__main__":
    c = build()
    print(f"blocks {len(c.blocks)} shots {len(c.shots)} els {len(c.els)} total {c.T:.2f}s -> {c.T / 1.28:.2f}s")
    for b in c.blocks:
        print(f"{b['name']:5s} {b['t0']:8.2f} {b['t1']:8.2f} {b['t1'] - b['t0']:6.2f}")
