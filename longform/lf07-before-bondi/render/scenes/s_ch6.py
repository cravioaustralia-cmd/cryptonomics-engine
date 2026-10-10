"""CHAPTER 6: Bondi (S36-S42). Quiet. Never name or show either gunman; no attack imagery."""
import math
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Flat, geojson, pin, P
from lib.thread import draw_thread
from lib.board import board_bg, board_card
from scenes.common import Q, CASTW, CAST_LIT
from scenes.s_cold import flame, st01, draw_s01_memorial, question_build
from scenes.s_ch3 import candles

PH22 = "PH22_bondi_memorial_2400.jpg"
AHMED_ROLE = "A Syrian-born Muslim  ·  a father of two"


def candle_crop(c, tl, fx, fy, bright, rect_=(0, 0, W, H), zoom=3.4, alpha=1.0):
    video(c, "ST13", tl, "warm", 0.45, bright, alpha=alpha, start=3.0, zoom=zoom, fx=fx, fy=fy, rect_=rect_, key=f"c{fx}")


def candle_panel(c, x, y, w, h, which, t, bright):
    """One cream candle from a held ST13 frame, with a gentle flicker (same framing every time)."""
    from lib.board import still_of
    img, fx, fy = (still_of("ST13", 3.0), 0.474, 0.47) if which == 0 else (still_of("ST13", 6.0), 0.41, 0.53)
    fl = 1.0 + 0.035 * math.sin(t * 9.1 + which * 2) * math.sin(t * 3.7 + which)
    draw_cover(c, img, x, y, w, h, 2.1, fx, fy, gpaint("warm", 0.35, bright * fl))


def candle_panel_full(c, t):
    from lib.board import still_of
    fl = 1.0 + 0.035 * math.sin(t * 9.1) * math.sin(t * 3.7)
    draw_cover(c, still_of("ST13", 3.0), 0, 0, W, H, 2.6, 0.474, 0.42, gpaint("warm", 0.35, 0.9 * fl))


def two_candles(c, t, tl, t_second, alpha=1.0, gap=0.0):
    """M2 + M3: two candles side by side joined by the amber Seam (rejoined). Same framing in S40, S41, S44, S45."""
    rect(c, 0, 0, W, H, "#000000", alpha)
    b2 = 0.12 + 0.78 * smooth(t, t_second, t_second + 1.2) if t_second is not None else 0.9
    panel(c, lambda c, x, y, w, h: candle_panel(c, x, y, w, h, 0, t, 0.9), 0, 0, W / 2 - 2, H, alpha)
    panel(c, lambda c, x, y, w, h: candle_panel(c, x, y, w, h, 1, t, b2), W / 2 + 2, 0, W / 2 - 2, H, alpha)
    seam(c, W / 2, 0, H, alpha * 0.9, glow=0.4)
    vignette(c, 0.5)


def bondi_locator(c, t, t_pulse, alpha=1.0):
    """MAP10: Bondi locator from OpenStreetMap, one soft suburb marker only (no site detail)."""
    m = Flat(151.245, 151.300, -33.915, -33.870)
    layer(c, alpha)
    rect(c, 0, 0, W, H, LAND, 1)
    for props, rings in geojson("osm_bondi.geojson"):
        kind = props.get("kind")
        for r in rings:
            if kind == "park":
                c.drawPath(m.path(r), paint("#2A3D58", 1))
    for props, rings in geojson("osm_bondi.geojson"):
        kind = props.get("kind")
        for r in rings:
            if kind == "road":
                hw = props.get("highway")
                wdt = 2.2 if hw in ("primary", "secondary", "trunk") else 1.0
                c.drawPath(m.path(r, False), paint("#4A5E7C", 0.8, stroke=wdt))
            elif kind == "coastline":
                c.drawPath(m.path(r, False), paint("#9FB2CC", 0.9, stroke=2.4))
    x, y = m.xy(*P["Bondi"])
    k = lin(t, t_pulse, t_pulse + 2.2)
    if 0 < k < 1:
        circle(c, x, y, 18 + 120 * k, AMBER, 0.55 * (1 - k), stroke=2.5)
    circle(c, x, y, 36, AMBER, 0.22, blur=14)
    circle(c, x, y, 11, AMBER, 0.95)
    draw_text(c, "Bondi Beach, Sydney", x + 30, y - 24, SANS, 30, 600, OFFW, 1, 600, anchor="baseline")
    draw_text(c, "© OpenStreetMap contributors", W - 420, H - 30, SANS, 16, 500, "#9AA6B8", 1, 380, "right", anchor="baseline")
    vignette(c, 0.45)
    c.restore()


@scene("S36")
class S36(Scene):
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "chapter6", t0, "")
        self.sfx(t0, "SFX13_waves_gulls", -2, name="waves", dur=16.0, fin=0.3, fout=3.0)
        self.tick(t0 + 0.3, "14 DEC 2025 · BONDI", "", sound=False, flip=0.01)
        self.tag("ticker", "", t0 + 0.3, S.vo_start + 3.0)
        self.tag("caption", "Sydney Harbour at dusk (file footage)", t0 + 0.4, self.w("festival") - 0.2)
        self.t_rem = self.cue("ghost_flame", "Remember the fire")
        self.t_fest = self.cue("flame_to_candle", "festival of lights")
        self.tag("source", "As reported", self.w("around a thousand people"), S.vo_end, "around a thousand people")

    def draw(self, c, t, fi):
        S = self.S
        t0, t1 = S.chapter_hold
        if t < self.t_fest:
            st01(c, t - t0)
            if t < S.vo_start:
                a = fade(t, t0 + 0.5, t1 - 0.3, 0.8, 0.5)
                draw_text(c, "CHAPTER 6", 0, 470, SANS, 22, 600, AMBER, a, W, "center", tracking=7, anchor="baseline")
                draw_text(c, "BONDI", 0, 560, SERIF, 96, 600, OFFW, a, W, "center", tracking=4, anchor="baseline")
            g = smooth(t, self.t_rem, self.t_rem + 1.5) * 0.22
            if g > 0:
                p = skia.Paint(); p.setAlphaf(g); p.setBlendMode(skia.BlendMode.kScreen)
                c.saveLayer(None, p)
                flame(c, t, self.t_rem, fi)
                c.restore()
        else:
            k = smooth(t, self.t_fest, self.t_fest + 1.6)   # the S03 flame, same framing, dissolves into one candle
            flame(c, t, self.t_fest - 2, fi, 1 - k)
            layer(c, k)
            rect(c, 0, 0, W, H, "#000000")
            candle_panel_full(c, t)
            vignette(c, 0.5)
            c.restore()
        grain(c, fi, 0.03)


@scene("S37")
class S37(Scene):
    """QUIET. No attack footage, ever. Say only what police have stated."""
    def plan(self):
        S = self.S
        self.t_of = self.cue("marker_pulse", "opened fire")
        self.t_15 = self.cue("lives", "Fifteen")
        self.tag("source", "Source: NSW Police\nThe surviving accused has not been convicted", S.vo_start, S.end - 0.1)
        self.tag("caption", "Flowers at Bondi Pavilion, Sydney, 18 Dec 2025", self.t_15 + 0.6, S.end - 0.1)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_15:
            bondi_locator(c, t, self.t_of)
        else:
            draw_s01_memorial(c, t, self.t_15)
            kinetic(c, "15 LIVES", W / 2, 600, t, self.t_15 + 0.15, 96, SERIF, 400, OFFW, 1.0, tracking=6)
        grain(c, fi, 0.03)


@scene("S38")
class S38(Scene):
    def plan(self):
        S = self.S
        self.t_card = S.start + 0.05
        EV.cue(self.sid, "qt10_silent", self.t_card, "")
        self.t_ev = self.cue("quote_complete", "every Australian")
        n = len(QUOTES["QT10"]["q"].split())
        t0, t1 = self.w("an attack"), self.we("every Australian")
        self.qwt = [mix(t0, t1 - 0.2, k / (n - 1)) for k in range(n)]

    def draw(self, c, t, fi):
        S = self.S
        draw_s01_memorial(c, t, S.start - 20, 0.5)
        quote_card(c, "QT10", (W - 1200) / 2, 360, t, self.t_card, w=1200, word_times=self.qwt, dim_unread=0.85)
        grain(c, fi, 0.03)


@scene("S39")
class S39(Scene):
    def plan(self):
        S = self.S
        self.t_om = self.cue("q3_centre", "one man")
        self.sfx(self.t_om, "SFX05_whoosh", -10, "one man")
        Q.setdefault("show", []).append((S.start, 760.0))
        Q["fly"][2] = (self.t_om, 10 ** 6)
        self.t_ai = S.start
        self.tag("ai", "Dramatised reconstruction", self.t_ai, S.end + 0.05)
        self.t_ran = self.cue("light_rises", "ran at")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_ai:
            rect(c, 0, 0, W, H, "#05080D")
        else:
            lr = smooth(t, self.t_ran, self.t_ran + 3.0)
            video(c, "AI10", t - self.t_ai, "warm", 0.4, 0.6 + 0.3 * lr, zoom=1.0, z1=1.05, dur=6)
            vignette(c, 0.55)
        # the third pinned question flies to centre (M7c) and stays there quietly
        x1, y1, w1, h1 = q_slot(2)
        k = ease_io(lin(t, self.t_om, self.t_om + 0.8))
        s = mix(1.0, 1.9, k)
        cx, cy = mix(x1 + w1 / 2, W / 2, k), mix(y1 + h1 / 2, 230, k)
        q_card(c, 2, cx - w1 * s / 2, cy - h1 * s / 2, w1, h1, 1.0 - 0.0 * k, scale=s)
        grain(c, fi, 0.03)


@scene("S40")
class S40(Scene):
    def plan(self):
        S = self.S
        self.t_name = self.cue("name_card", "Ahmed al Ahmed")
        CAST_LIT["AHMED AL AHMED"] = self.t_name
        CASTW.append((self.t_name + 1.5, self.t_name + 5.0, "AHMED AL AHMED"))
        Q["answer"][2] = (self.t_name, "WHO RAN?  AHMED AL AHMED")
        Q["fly"][2] = (EV.CUES["S39.q3_centre"], self.t_name)
        self.tag("source", "Source: NSW Police / PM statement, Dec 2025", self.w("A Syrian-born"), self.w("The attack") - 0.1)
        self.t_mu = self.cue("second_candle", "Muslim Australian")
        self.t_two = self.w("The attack")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_two:
            candles(c, t - S.start + 5.0, warm=True)
            rect(c, 0, 0, W, H, "#000000", 0.25)
            name_card(c, "Ahmed al Ahmed", AHMED_ROLE, W / 2, 470, t, self.t_name)
        else:
            two_candles(c, t, t - self.t_two, self.t_mu, alpha=smooth(t, self.t_two, self.t_two + 1.0))
        grain(c, fi, 0.03)


@scene("S41")
class S41(Scene):
    def plan(self):
        S = self.S
        self.t_card = S.start + 0.05
        self.t_insp = self.cue("qt11", "inspiration")
        self.t_is = self.cue("master_q", "Islamic State")
        Q["fly"][0] = (self.t_is, S.end)
        Q["show"] = [(a, (S.end if b > 700 else b)) for a, b in Q["show"]]
        self.sfx(self.t_is, "SFX05_whoosh", -8, "Islamic State")
        self.tag("source", "Source: NSW Police", self.w("Police say"), self.w("And some warn") - 0.1, "inspired by Islamic State")
        self.t_warn = self.w("And some warn")
        self.tag("corner", "ANALYSIS", self.t_warn, S.end - 0.05, "And some warn")
        self.t_rm = self.cue("dim_branches", "risks missing")
        self.t_tm = self.cue("relight", "two men")
        n = len(QUOTES["QT11"]["q"].split())
        t0, t1 = self.w("his bravery"), self.we("Australians")
        self.qwt = [mix(t0, t1 - 0.2, k / (n - 1)) for k in range(n)]
        self.qwt[0] = self.w("his bravery")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_is:
            two_candles(c, t, t - S.start + 12, None, alpha=1.0)
            rect(c, 0, 0, W, H, "#000000", 0.5)
            quote_card(c, "QT11", (W - 1100) / 2, 380, t, self.t_card, w=1100, word_times=self.qwt)
        elif t < self.t_warn:
            draw_thread(c, t, None, 1.0, 1.0, 0.0, None)
            vignette(c, 0.4)
            # master question returns from the corner
            x1, y1, w1, h1 = q_slot(0)
            k = ease_io(lin(t, self.t_is, self.t_is + 0.7))
            s = mix(1.0, 1.9, k)
            cx, cy = mix(x1 + w1 / 2, W / 2, k), mix(y1 + h1 / 2, 200, k)
            q_card(c, 0, cx - w1 * s / 2, cy - h1 * s / 2, w1, h1, 1.0, scale=s)
        else:
            dim = smooth(t, self.t_rm, self.t_rm + 0.6) * (1 - smooth(t, self.t_tm, self.t_tm + 0.6))
            draw_thread(c, t, None, 1.0, 1.0, dim, None, thread_dim=dim, extremism=smooth(t, self.t_rm, self.t_rm + 0.8))
            vignette(c, 0.4)
            q_card(c, 0, W / 2 - 470 * 1.9 / 2, 200 - 48 * 1.9 / 2, 470, 48, 1.0, scale=1.9)
        grain(c, fi, 0.02)


@scene("S42")
class S42(Scene):
    def plan(self):
        S = self.S
        self.t_25 = self.cue("ticker_plus25", "Twenty-five days")
        self.tick(self.t_25, "JAN 2026 · BONDI +25 DAYS", "Twenty-five days", gain=-5)
        self.tag("ticker", "", self.t_25, S.end + 0.1)
        self.t_rc = self.cue("doc04", "Royal Commission")
        self.sfx(self.t_rc, "SFX18_paper", 2, "Royal Commission")
        self.tag("caption", "House of Representatives, Canberra (file footage)", S.start + 0.3, self.t_rc - 0.1)
        self.tag("source", "Source: Royal Commission (asc.royalcommission.gov.au)", self.t_rc, S.end - 0.05)
        self.t_feb = self.cue("ph09", "February")
        self.tick(self.t_feb, "FEB 2026 · BONDI", "February", sound=False)
        self.sfx(self.t_feb, "SFX19_stamp", -10, "February")
        self.tag("caption", "Isaac Herzog, official portrait, 2021 (GPO)", self.t_feb + 0.3, self.w("In April") - 0.1)
        self.t_apr = self.w("In April")
        self.t_gun = self.cue("ticker_plus137", "gun laws")
        self.tick(self.t_gun, "APR 2026 · BONDI +137 DAYS", "gun laws", sound=False)
        self.sfx(self.t_gun, "SFX19_stamp", -10, "gun laws")
        self.t_18 = self.cue("ticker_plus369", "eighteenth of December")
        self.tick(self.t_18, "+369 DAYS · 18 DEC 2026", "eighteenth of December", sound=False, pulse=True, flip=0.6)
        self.sfx(self.t_18, "SFX21_thunk", -2, "eighteenth of December")
        self.t_node = self.w("Four days after")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_node:
            video(c, "FT06b", t - S.start, "modern", 0.8, 0.4, zoom=1.0, z1=1.04, dur=7, speed=0.6)
            vignette(c, 0.5)
            if t >= self.t_rc - 0.2 and t < self.t_feb:
                body = ("Letters Patent issued 9 January 2026. Commissioner: the Hon Virginia Bell AC, former High Court "
                        "judge. Inquiry into antisemitism and social cohesion, including the Bondi attack of 14 December 2025.")
                evidence_card(c, 110, 210, 1060, t, self.t_rc - 0.2, "Royal Commission on Antisemitism and Social Cohesion",
                              "Jan 2026", "Royal Commission established", body, "PM release 8 Jan 2026; Letters Patent 9 Jan 2026",
                              body_size=30)
                # Virginia Bell: name card + small inset photo only (178 x 241 px original)
                a = eo(t, self.w("led by"), 0.35)
                if a > 0:
                    layer(c, a)
                    rect(c, 1260, 300, 560, 300, NAVY, 0.94, r=4)
                    rect(c, 1260, 300, 3, 300, AMBER, 1)
                    draw_cover(c, photo("PH13_virginia_bell.jpg"), 1300, 340, 134, 180, 1.0, 0.5, 0.4, gpaint("modern", 0.5))
                    draw_text(c, "Virginia Bell AC", 1460, 400, SERIF, 38, 600, OFFW, 1, 360, anchor="baseline")
                    draw_text(c, "Commissioner", 1460, 440, SANS, 22, 500, "#C3C9D1", 1, 360, anchor="baseline")
                    draw_text(c, "former High Court judge", 1460, 474, SANS, 20, 400, GREY, 1, 360, anchor="baseline")
                    c.restore()
            elif self.t_feb <= t < self.t_apr:
                print_photo(c, photo("PH09_herzog_2400.jpg"), W / 2, 520, 440, t, self.t_feb, tilt=-1.5, h=600, fy=0.3,
                            grade=gpaint("modern", 0.5))
                kinetic(c, "Israel’s President visits Australia · Feb 2026", W / 2, 920, t, self.t_feb + 0.2, 34, SANS, 600, OFFW)
            elif t >= self.t_apr:
                body = ("Recommendation 13: finalise and implement an updated and nationally consistent National Firearms "
                        "Agreement. Recommendation 14: implement the proposed National Gun Buyback Scheme.")
                evidence_card(c, 110, 210, 1000, t, self.t_apr, "Royal Commission · Interim report", "30 Apr 2026",
                              "Tougher national gun laws recommended", body, "Interim report, 30 Apr 2026, recs 13 and 14",
                              highlights=[("nationally consistent National Firearms Agreement", self.t_gun, 0.6)], body_size=29)
                body2 = ("Combatting Antisemitism, Hate and Extremism (Criminal and Migration Laws) Act 2026, in force "
                         "22 Jan 2026. Final report due 18 December 2026.")
                evidence_card(c, 1180, 300, 650, t, self.t_apr + 0.6, "Commonwealth", "2026", "Since the attack", body2,
                              "Federal Register of Legislation; Royal Commission", body_size=24, title_size=30)
        else:
            k = smooth(t, self.t_node, self.t_node + 0.5)
            draw_thread(c, t, None, 1.0, 0.0, 0.0, {"THE FIRE": -10, "TWO MEMORIES": -10, "CANBERRA": -10, "LIVES": -10,
                                                     "BONDI": self.t_node + 0.2}, alpha=k)
            vignette(c, 0.4)
        grain(c, fi, 0.02)
