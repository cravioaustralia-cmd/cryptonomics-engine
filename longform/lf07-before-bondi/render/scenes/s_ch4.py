"""CHAPTER 4: Australian Lives (S24-S28). Zomi Frankcom: no photo, ever - a designed name card."""
import math
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Flat, flat_map, pin, P, dashed, curve_pts
from lib.thread import draw_thread
from scenes.common import CASTW, CAST_LIT
from scenes.s_ch1 import chapter_hold
from scenes.s_ch3 import candles

ZOMI_ROLE = "Aid worker, World Central Kitchen  ·  grew up in Sydney"


def flowers(c, tl, alpha=1.0):
    """ST13b: flowers and a card for Zomi Frankcom (memorial scene, not a portrait)."""
    video(c, "ST13b", tl, "warm", 0.4, 0.5, alpha=alpha, zoom=1.0, z1=1.06, dur=12)
    vignette(c, 0.6)


@scene("S24")
class S24(Scene):
    """QUIET: slow, minimal motion, no ticks, no stamps."""
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "chapter_card", t0, "")
        self.t_name = self.cue("name_card", "Zomi Frankcom")
        CAST_LIT["FRANKCOM"] = self.t_name
        CASTW.append((self.t_name + 1.5, self.t_name + 5.0, "FRANKCOM"))
        self.t_apr = self.cue("ticker_622", "first of April")
        self.tick(self.t_apr, "1 APR 2024 · BONDI −622 DAYS", "first of April", sound=False, flip=0.9)
        self.tag("ticker", "", self.t_apr, self.w("convoy") - 0.2)
        self.tag("caption", "Flowers and a card for Zomi Frankcom, International Humanitarian Memorial, Canberra, 2024",
                 self.t_name + 2.5, self.w("convoy") - 0.3)
        self.tag("source", "“clearly marked”: World Central Kitchen", self.w("what the charity called"), S.end - 0.1)
        self.t_conv = self.cue("route", "convoy")
        self.tag("label", "Convoy route schematic · Base: Natural Earth", self.t_conv + 0.2, S.end - 0.1)

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            def bg(c, t):
                candles(c, t - S.start, warm=True, start=0.0)
            t0, t1 = S.chapter_hold
            bg(c, t)
            rect(c, 0, 0, W, H, NAVY, 0.5)
            chapter_card(c, "CHAPTER 4", "AUSTRALIAN LIVES", "BONDI −622 DAYS", t, t0 + 0.5, t1 - 0.7)
            return
        if t < self.t_conv - 0.4:
            flowers(c, t - S.vo_start)
            name_card(c, "Zomi Frankcom", ZOMI_ROLE, W / 2, 470, t, self.t_name)
        else:
            k = smooth(t, self.t_conv - 0.4, self.t_conv + 0.6)
            flowers(c, t - S.vo_start, 1 - k)
            layer(c, k)
            convoy_map(c, t, self.t_conv)
            c.restore()
        grain(c, fi, 0.03)


def convoy_map(c, t, t0):
    """MAP07: the Gaza Strip, one marker; the dotted route draws (schematic)."""
    m = Flat(34.05, 34.85, 31.18, 31.66)
    flat_map(c, m, "50m", highlight={"PSX": ("#33496B", 1.0)})
    pts = [m.xy(31.52, 34.44), m.xy(31.47, 34.39), m.xy(31.42, 34.355)]
    dashed(c, curve_pts(pts[0], pts[2], 0.08, 40), smooth(t, t0, t0 + 2.2), AMBER, 3, 0.9)
    dx, dy = m.xy(*P["Deir al-Balah"])
    pin(c, dx, dy, t, t0 + 2.0, "Deir al-Balah", size=24, label_side="right", sub="1 Apr 2024")
    gx, gy = m.xy(31.36, 34.38)
    draw_text(c, "GAZA STRIP", gx - 200, gy, SANS, 24, 700, "#AEB8C8", eo(t, t0, 0.3), 400, "right", tracking=5, anchor="baseline")
    vignette(c, 0.45)


@scene("S25")
class S25(Scene):
    """Three identical quote cards (same size, same design, same position logic)."""
    def plan(self):
        S = self.S
        self.t3 = self.cue("qt03", "completely unacceptable")
        self.t4 = self.cue("qt04", "unintentionally")
        self.t5 = self.cue("qt05", "compassion, bravery and love")
        self.tc = [self.w("Prime Minister Albanese"), self.w("Israel's prime minister"), self.w("Her family")]
        self.qw = {}
        for qid, a, b in (("QT03", "completely", "unacceptable"), ("QT04", "unintentionally", "combatants"),
                          ("QT05", "a legacy", "love")):
            n = len(QUOTES[qid]["q"].split())
            t0, t1 = self.w(a), self.we(b)
            self.qw[qid] = [mix(t0 - 0.3, t1 - 0.15, k / (n - 1)) for k in range(n)]

    def draw(self, c, t, fi):
        S = self.S
        candles(c, t - S.start + 3.0, warm=True, alpha=1.0)
        flick = 1.0 + 0.08 * math.sin((t - self.t5) * 9) * smooth(t, self.t5, self.t5 + 0.3) * (1 - smooth(t, self.t5 + 2, self.t5 + 3))
        rect(c, 0, 0, W, H, "#000000", 0.45 / flick)
        cw = 570
        hh = max(quote_card_size(q, cw, 30)[1] for q in ("QT03", "QT04", "QT05"))
        y = (H - hh) / 2 + 10
        for i, qid in enumerate(("QT03", "QT04", "QT05")):
            x = 60 + i * (cw + 45)
            quote_card(c, qid, x, y, t, self.tc[i], w=cw, qsize=30, word_times=self.qw[qid], min_h=hh)
        grain(c, fi, 0.03)


@scene("S26")
class S26(Scene):
    def plan(self):
        S = self.S
        self.t_card = S.vo_start + 0.05
        self.sfx(self.t_card, "SFX18_paper", 2, "", name="DOC06 card")
        self.t_sf = self.cue("hl1", "serious failures")
        self.t_kt = self.cue("hl2", "knowingly targeted")
        self.tag("source", "Source: Binskin report, DFAT, Aug 2024", S.vo_start + 0.3, self.w("In twenty twenty-six") - 0.1)
        self.t_26 = self.cue("doc21", "twenty twenty-six")
        self.sfx(self.t_26, "SFX18_paper", 2, "twenty twenty-six")
        self.tag("source", "Source: DFAT / PM statement, Aug 2026", self.t_26 + 0.2, S.end - 0.05)
        self.t_fam = self.w("Her family called")

    def draw(self, c, t, fi):
        S = self.S
        desk(c, fi)
        k = smooth(t, self.t_26 - 0.2, self.t_26 + 0.4)
        layer(c, 1 - 0.7 * k)
        body = ("The IDF strike on the WCK aid workers was not knowingly or deliberately directed against the WCK. "
                "The strikes were the result of serious failures to follow IDF procedures, mistaken identification "
                "and errors in decision-making.")
        evidence_card(c, mix(380, 90, k), 190, 1100, t, self.t_card, "Special Adviser public report · DFAT", "Aug 2024",
                      "Review of Israel’s response to the strike on World Central Kitchen",
                      body, "Binskin report, DFAT, Aug 2024 (as quoted by DFAT and the Foreign Minister)",
                      highlights=[("serious failures", self.t_sf, 0.5), ("not knowingly or deliberately directed", self.t_kt, 0.7)],
                      body_size=30, label="Air Chief Marshal Mark Binskin AC (ret.)")
        c.restore()
        if t >= self.t_26 - 0.3:
            # split-flap year
            a = eo(t, self.t_26 - 0.3, 0.3)
            for i, ch in enumerate("2026"):
                x = 1280 + i * 70
                rect(c, x, 150, 62, 90, "#111C2E", a, r=4)
                rect(c, x, 194, 62, 2, "#000000", a)
                draw_text(c, ch, x, 220, MONO, 62, 600, AMBER, a * eo(t, self.t_26 + i * 0.06, 0.2), 62, "center", anchor="baseline")
            body2 = ("Israel’s military found “serious failures” but said the commanders’ decisions did not raise reasonable "
                     "suspicion of criminal misconduct: no criminal charges. Zomi Frankcom’s family called the decision "
                     "“an insult to my sister’s memory”.")
            evidence_card(c, 1000, 290, 830, t, self.t_26, "Australian Government response", "Aug 2026",
                          "2026: no criminal charges", body2, "DFAT / PM statement, Aug 2026; family statement",
                          highlights=[("“an insult to my sister’s memory”.", self.t_fam, 0.8)], body_size=28, title_size=36)
        grain(c, fi, 0.02)


@scene("S27")
class S27(Scene):
    def plan(self):
        S = self.S
        self.t_isr = self.cue("left_brightens", "in Israel")
        self.t_gaza = self.cue("right_brightens", "Gaza")
        self.tag("caption", "Damaged house, Gaza envelope, 11 Oct 2023 (GPO)  ·  Destroyed buildings, Gaza, Feb 2025",
                 S.start + 0.4, self.w("Australia granted") - 0.1)
        self.t_ag = self.w("Australia granted")
        self.tag("ai", "Dramatised reconstruction", self.t_ag, self.w("visitor visas"))
        self.t_vv = self.cue("doors_open", "visitor visas")
        self.sfx(self.t_vv + 0.1, "SFX19_stamp", -3, "visitor visas")
        self.tag("source", "Source: Department of Home Affairs", self.w("thousands of visitor visas"), self.w("Supporters") - 0.1,
                 "thousands of visitor visas")
        self.tag("caption", "Landing at Sydney Airport (file footage)", self.t_vv + 0.3, S.end - 0.1)
        self.tl = [self.cue("line1", "Supporters"), self.cue("line2", "opposition"), self.cue("line3", "government")]
        for tt, tr in zip(self.tl, ("Supporters", "opposition", "government")):
            self.sfx(tt, "SFX06_tick", -1, tr)
        self.tag("label", "Summary of public positions", self.tl[0], S.end - 0.05)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_ag:
            rect(c, 0, 0, W, H, "#000000")
            z = mix(1.04, 1.12, smooth(t, S.start, self.t_ag))
            lb = 0.62 + 0.38 * smooth(t, self.t_isr, self.t_isr + 0.5)
            rb = 0.62 + 0.38 * smooth(t, self.t_gaza, self.t_gaza + 0.5)
            panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH18_oct7_kibbutz_damage_2400.jpg"), x, y, w, h, z, 0.5, 0.5,
                                                      gpaint("modern", 1.0, lb)), 0, 0, W / 2 - 2, H)
            panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH19_gaza_destruction_2400.jpg"), x, y, w, h, z, 0.6, 0.5,
                                                      gpaint("modern", 1.0, rb)), W / 2 + 2, 0, W / 2 - 2, H)
            seam(c, W / 2, 0, H, 1.0)
        elif t < self.t_vv:
            video(c, "AI05", t - self.t_ag + 4.0, "warm", 0.4, 0.95, zoom=1.06, z1=1.1, dur=2)
            vignette(c, 0.45)
        else:
            video(c, "ST09", t - self.t_vv, "modern", 0.8, 0.75, zoom=1.0, z1=1.05, dur=10)
            # M5 doors slide OPEN (mirror of S11)
            k = ease_out(lin(t, self.t_vv, self.t_vv + 0.9))
            dw = W / 2 * (1 - k)
            if dw > 1:
                rect(c, 0, 0, dw, H, "#2C3D57", 1)
                rect(c, W - dw, 0, dw, H, "#2C3D57", 1)
            vignette(c, 0.45)
            stamp_text(c, "VISITOR VISAS GRANTED", W / 2, 260, t, self.t_vv + 0.1, 44, AMBER, -4,
                       alpha=1 - smooth(t, self.tl[0] - 0.4, self.tl[0]))
            for i, (who, what) in enumerate((("SUPPORTERS", "Called it basic humanity."),
                                             ("OPPOSITION", "Said vetting was rushed."),
                                             ("GOVERNMENT", "Said every applicant was checked."))):
                a = eo(t, self.tl[i], 0.3)
                y = 380 + i * 150
                rect(c, 420, y, 1080, 120, NAVY, 0.9 * a, r=4)
                rect(c, 420, y, 3, 120, AMBER, a)
                draw_text(c, who, 460, y + 50, SANS, 24, 700, AMBER, a, 400, tracking=4, anchor="baseline")
                draw_text(c, what, 460, y + 96, SERIF, 38, 400, OFFW, a, 1000, anchor="baseline")
        grain(c, fi, 0.02)


@scene("S28")
class S28(Scene):
    def plan(self):
        S = self.S
        self.t_nf = self.cue("node_lives", "never far away")
        self.sfx(self.t_nf, "SFX21_thunk", -2, "never far away")
        self.t_home = self.w("And at home")
        self.t_two = self.cue("seam_gap", "in two")
        self.tick(self.t_two, "OCT 2023 · BONDI −799 DAYS", "in two", flip=0.7)
        self.tag("ticker", "", self.t_two - 0.2, S.end)
        self.tag("caption", "Sydney Harbour (file footage)", self.t_home + 0.2, S.end - 0.1)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_home:
            draw_thread(c, t, None, 1.0, 0.0, 0.0, {"THE FIRE": -10, "TWO MEMORIES": -10, "CANBERRA": -10, "LIVES": self.t_nf})
            vignette(c, 0.4)
        else:
            gap = 140 * smooth(t, self.t_two, self.t_two + 1.6) + 4 * smooth(t, self.t_home, self.t_two)
            rect(c, 0, 0, W, H, "#000000")
            for side in (0, 1):
                c.save()
                c.clipRect(skia.Rect.MakeXYWH(0 if side == 0 else W / 2 + gap / 2, 0, W / 2 - gap / 2, H))
                c.translate(-gap / 2 if side == 0 else gap / 2, 0)   # the two halves pull apart
                video(c, "ST22", t - self.t_home + 3.0, "modern", 0.8, 0.8, zoom=1.04)
                c.restore()
            seam(c, W / 2, 0, H, 1.0, gap=gap)
            rect(c, 0, 0, W, H, "#000000", smooth(t, S.vo_end - 0.2, S.end))
        grain(c, fi, 0.02)
