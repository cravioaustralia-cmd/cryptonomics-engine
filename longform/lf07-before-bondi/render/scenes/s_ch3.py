"""CHAPTER 3: Canberra's Choices (S18-S23)"""
import math
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Flat, flat_map, pin, P, dashed, curve_pts
from lib.thread import draw_thread
from lib.board import still_of
from scenes.common import CASTW, CAST_LIT
from scenes.s_ch1 import chapter_hold
from scenes.s_ch2 import m4_frame


def label_chip(c, text, t, t_in, x=56, y=120, alpha=1.0):
    a = alpha * eo(t, t_in, 0.3)
    if a <= 0:
        return
    tw = text_w(text, SANS, 22, 700, 4)
    rect(c, x, y, tw + 36, 46, AMBER, a, r=3)
    draw_text(c, text, x + 18, y + 31, SANS, 22, 700, NAVY, a, 600, tracking=4, anchor="baseline")


@scene("S18")
class S18(Scene):
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "chapter_card", t0, "")
        self.sfx(t0, "SFX10_machining", -4, name="machining rises", dur=13.5, fin=5.0, fout=1.5)
        self.t_c1 = self.cue("choice1", "almost nobody noticed")
        self.t_doz = self.cue("parts", "Dozens of Australian companies")
        self.tag("source", "Source: Department of Defence, F-35 program", self.t_doz, self.w("shared global pool") - 0.2,
                 "Dozens of Australian companies")
        self.tag("caption", "CNC milling of an aluminium part (file footage, not an F-35 part)", S.vo_start + 0.3, self.w("shared global pool") - 0.2)
        self.t_stamp = self.w("make parts")
        self.sfx(self.t_stamp, "SFX19_stamp", -3, "make parts", name="MADE IN AUSTRALIA stamp")
        self.t_pool = self.cue("pool", "shared global pool")
        self.sfx(self.t_pool, "SFX05_whoosh", -4, "shared global pool")
        self.t_af = self.cue("ft01", "Australia's air force")
        self.sfx(self.t_af - 0.3, "SFX09_jet", -2, "Australia's air force", dur=4.5, fin=0.4, fout=1.5)
        self.tag("caption", "F-35A take-off, Luke Air Force Base, Arizona, 2025 (US DoD / DVIDS)", self.t_af + 0.2, self.w("So does") - 0.1)
        self.t_so = self.cue("two_lines", "So does Israel's")
        self.sfx(self.t_so, "SFX06_tick", -1, "So does Israel's")

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            def bg(c, t):
                if t < S.start + 2.0:
                    video(c, "ST07", t - S.start, "modern", 1.0, 0.85, zoom=1.05)
                else:
                    video(c, "FT01", t - S.start - 2.0 + 4.0, "modern", 0.8, 0.85, zoom=1.0)
            chapter_hold(c, t, S, "CHAPTER 3", "CANBERRA’S CHOICES", None, bg, fi)
            return
        if t < self.t_pool:
            video(c, "ST07", t - S.start + 2.0, "modern", 1.0, 0.9, zoom=1.05, z1=1.12, dur=7)
            vignette(c, 0.45)
            stamp_text(c, "MADE IN AUSTRALIA", W * 0.68, H * 0.62, t, self.t_stamp, 54, AMBER, -6)
        elif t < self.t_af:
            parts_pool(c, t, self.t_pool, None)
        elif t < self.t_so:
            video(c, "FT01", t - self.t_af, "modern", 0.8, 0.95, zoom=1.0, z1=1.05, dur=3)
            vignette(c, 0.35)
        else:
            parts_pool(c, t, self.t_pool - 10, self.t_so)
        label_chip(c, "CHOICE 1", t, self.t_c1)
        grain(c, fi, 0.02)


def parts_pool(c, t, t_in, t_pulse):
    """MAP05 (simplified): partner suppliers -> shared global pool -> operators. Australia and Israel same colour."""
    desk(c, 0)
    draw_text(c, "F-35 GLOBAL PARTS POOL", 0, 140, SANS, 26, 700, AMBER, eo(t, t_in, 0.3), W, "center", tracking=6, anchor="baseline")
    draw_text(c, "simplified", 0, 176, SANS, 20, 500, GREY, eo(t, t_in, 0.3), W, "center", anchor="baseline")
    px, py = W / 2, H / 2 + 20
    sup = [(380, 330 + i * 95, "AUSTRALIA" if i == 2 else "") for i in range(6)]
    ops = [(1540, 300 + i * 85, ["", "AUSTRALIA", "", "ISRAEL", "", "", ""][i]) for i in range(7)]
    k = smooth(t, t_in, t_in + 1.2)
    for i, (x, y, lab) in enumerate(sup):
        pts = curve_pts((x + 20, y), (px - 110, py), 0.05 * (i - 2.5), 40)
        glow_line(c, pts, k, AMBER if lab else "#5D7090", 2.5 if lab else 1.6, 0.9, 4 if lab else 0)
        circle(c, x, y, 10 if lab else 7, AMBER if lab else "#7D8BA0", eo(t, t_in, 0.3))
        if lab:
            draw_text(c, lab, x - 330, y + 9, SANS, 24, 700, OFFW, eo(t, t_in, 0.3), 300, "right", tracking=2, anchor="baseline")
    draw_text(c, "PARTNER SUPPLIERS", 230, 270, SANS, 18, 600, GREY, eo(t, t_in, 0.3), 300, "center", tracking=3, anchor="baseline")
    draw_text(c, "F-35 OPERATORS", 1390, 240, SANS, 18, 600, GREY, eo(t, t_in, 0.3), 300, "center", tracking=3, anchor="baseline")
    circle(c, px, py, 120, NAVY, 1)
    circle(c, px, py, 120, AMBER, k, stroke=3)
    circle(c, px, py, 140, AMBER, 0.25 * k, blur=14)
    draw_text(c, "SHARED", px - 120, py - 4, SANS, 26, 700, OFFW, k, 240, "center", tracking=3, anchor="baseline")
    draw_text(c, "GLOBAL POOL", px - 120, py + 30, SANS, 26, 700, OFFW, k, 240, "center", tracking=3, anchor="baseline")
    k2 = smooth(t, t_in + 0.6, t_in + 1.8)
    for i, (x, y, lab) in enumerate(ops):
        pts = curve_pts((px + 110, py), (x - 20, y), 0.04 * (i - 3), 40)
        pul = 0.0
        if t_pulse is not None and lab:
            pul = 0.5 + 0.5 * math.sin((t - t_pulse) * 7.0) if t >= t_pulse else 0
            pul *= 1 - smooth(t, t_pulse + 1.6, t_pulse + 2.2) * 0.4
        glow_line(c, pts, k2, AMBER if lab else "#5D7090", 2.5 + 2 * pul if lab else 1.6, 0.9, 4 + 10 * pul if lab else 0)
        circle(c, x, y, 10 if lab else 7, AMBER if lab else "#7D8BA0", k2)
        if lab:
            draw_text(c, lab, x + 26, y + 9, SANS, 24, 700, OFFW, k2, 300, tracking=2, anchor="baseline")
    vignette(c, 0.35)


@scene("S19")
class S19(Scene):
    """Two cases, identical cards, same voice, same tone (M3)."""
    def plan(self):
        S = self.S
        self.t_cr = self.cue("left_card", "Critics")
        self.t_gov = self.cue("right_card", "The government says")
        self.sfx(self.t_cr, "SFX18_paper", 2, "Critics")
        self.sfx(self.t_gov, "SFX18_paper", 2, "The government says")
        self.tag("label", "Summary of public positions", self.t_cr, S.end - 0.05)

    def draw(self, c, t, fi):
        S = self.S
        desk(c, fi)
        seam(c, W / 2, 150, 930, eo(t, S.start, 0.3))
        common = dict(body_size=31, title_size=36, min_h=600)
        # both cards on screen for the same time; each brightens on its own words
        evidence_card(c, 110, 210, 760, t, self.t_cr, "Summary of public positions", "", "THE CRITICS’ CASE",
                      "Critics, including human rights groups and the Greens, say supplying F-35 parts makes Australia part of the war.",
                      "Greens / aid groups statements", alpha=mix(0.55, 1.0, eo(t, self.t_cr, 0.3)),
                      highlights=[("human rights groups and the Greens,", self.w("human rights"), 0.6),
                                  ("makes Australia part of the war.", self.w("makes Australia"), 0.7)], **common)
        evidence_card(c, W - 110 - 760, 210, 760, t, self.t_cr, "Summary of public positions", "", "THE GOVERNMENT’S CASE",
                      "The government says Australia has not supplied weapons to Israel since the war began, and that the parts are a separate matter that would not change what Israel can do.",
                      "DFAT / Hansard", highlights=[("has not supplied weapons to Israel", self.w("not supplied"), 0.7),
                                  ("the parts are a separate matter", self.w("the parts are"), 0.6),
                                  ("would not change what Israel can do.", self.w("would not change"), 0.7)],
                      alpha=mix(0.55, 1.0, eo(t, self.t_gov, 0.3)), **common)


@scene("S20")
class S20(Scene):
    def plan(self):
        S = self.S
        self.t_c2 = self.cue("choice2", "a choice everyone noticed")
        self.t_aug = self.cue("ticker_125", "August")
        self.tick(self.t_aug, "AUG 2025 · BONDI −125 DAYS", "August")
        self.tag("ticker", "", self.t_aug, self.w("He called") - 0.2)
        self.tag("caption", "Parliament House, Canberra (file footage)", S.start + 0.3, self.w("He called") - 0.1)
        self.tag("source", "Source: PM press conference, Parliament House, 11 Aug 2025", self.w("announced"), self.w("He called") - 0.1)
        self.t_he = self.w("He called")
        self.sfx(self.t_he, "SFX12_shutter", 0, "He called", name="drop PH07")
        self.t_hope = self.cue("qt06", "humanity's best hope")
        self.t_back = self.cue("counter", "back in")
        self.t_47 = self.cue("m4_return", "nineteen forty-seven")
        self.sfx(self.t_47, "SFX20_marker", 0, "nineteen forty-seven", name="circle redraws")
        for k in range(10):
            self.sfx(self.t_back + 0.1 + k * 0.11, "SFX06_tick", -6, "back in" if k == 0 else "", name="counter 1947-2025")
        self.tag("caption", "UN voting sheet, 29 Nov 1947", self.t_back + 0.2, S.end - 0.1)
        n = len(QUOTES["QT06"]["q"].split())
        t0, t1 = self.w("two-state"), self.we("violence")
        self.qwt = [mix(t0, t1 - 0.2, k / (n - 1)) for k in range(n)]
        CAST_LIT.setdefault("ALBANESE", 0)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_he:
            video(c, "ST05", t - S.start, "modern", 0.9, 0.85, zoom=1.0, z1=1.06, dur=8)
            vignette(c, 0.4)
            kinetic(c, "RECOGNITION OF THE STATE OF PALESTINE", W / 2, 640, t, self.w("recognise"), 44, SANS, 700, OFFW, tracking=3)
        elif t < self.t_back:
            desk(c, fi)
            quote_card(c, "QT06", 110, 330, t, self.t_he, w=1100, word_times=self.qwt)
            print_photo(c, photo("PH07_albanese_2400.jpg"), 1530, 520, 420, t, self.t_he, tilt=2.0, h=560, fx=0.5, fy=0.32,
                        grade=gpaint("modern", 0.5))
        else:
            m4_frame(c, t, self.t_47)
            k = smooth(t, self.t_47, self.t_47 + 1.2)
            yr = int(1947 + 78 * k)
            a = eo(t, self.t_back, 0.3)
            rect(c, W / 2 - 330, 830, 660, 150, NAVY, 0.9 * a, r=4)
            draw_text(c, f"1947 → {yr}", W / 2 - 330, 898, MONO, 48, 600, OFFW, a, 660, "center", anchor="baseline")
            draw_text(c, "78 YEARS", W / 2 - 330, 955, SANS, 40, 700, AMBER, a * smooth(t, self.t_47 + 1.1, self.t_47 + 1.3), 660,
                      "center", tracking=6, anchor="baseline")
        label_chip(c, "CHOICE 2", t, self.t_c2)
        grain(c, fi, 0.02)


@scene("S21")
class S21(Scene):
    def plan(self):
        S = self.S
        self.t_un = self.cue("map08", "United Nations")
        self.sfx(self.t_un, "SFX05_whoosh", -3, "United Nations")
        self.t_cond = self.cue("doc09", "with conditions")
        self.sfx(self.t_cond, "SFX18_paper", 2, "with conditions")
        self.tag("source", "Source: PM / Foreign Minister joint statement, 21 Sep 2025", self.t_un, self.t_cond - 0.1)
        self.h = [self.w("No role for Hamas"), self.w("demilitarisation"), self.w("Palestinian elections")]
        self.t_both = self.cue("arrows", "both directions")
        self.sfx(self.t_both, "SFX11_boom", -12, "both directions", name="arrow L (soft)")
        self.sfx(self.t_both + 0.18, "SFX11_boom", -12, name="arrow R (soft)")
        self.t_rw = self.cue("left_drops", "rewarded Hamas")
        self.t_cm = self.cue("right_drops", "completely meaningless")
        self.sfx(self.t_rw, "SFX21_thunk", -2, "rewarded Hamas")
        self.sfx(self.t_cm, "SFX21_thunk", -2, "completely meaningless")
        self.t_scale = self.w("And it was attacked")
        self.tag("label", "Summary of public positions", self.t_scale, S.end - 0.05)
        self.tag("source", "Source: APAN, 11 Aug 2025", self.w("A pro-Palestinian"), S.end - 0.05, "completely meaningless")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_cond:
            m = Flat(-170, 180, -58, 78)
            flat_map(c, m, "110m", highlight={a: (AMBER, 0.85 * smooth(t, self.t_un, self.t_un + 0.6)) for a in ("AUS", "GBR", "CAN")})
            draw_text(c, "21 SEPTEMBER 2025", 0, 120, SANS, 26, 700, AMBER, eo(t, self.t_un, 0.3), W, "center", tracking=6, anchor="baseline")
            draw_text(c, "Australia recognises the State of Palestine, alongside Canada and the United Kingdom", 0, 170, SERIF, 36,
                      600, OFFW, eo(t, self.t_un + 0.2, 0.3), W, "center", anchor="baseline")
            vignette(c, 0.35)
        elif t < self.t_scale:
            desk(c, fi)
            body = ("Conditions: the terrorist organisation Hamas must have no role in Palestine. The Palestinian Authority has "
                    "committed to demilitarise and to hold general elections.")
            evidence_card(c, (W - 1200) / 2, 230, 1200, t, self.t_cond, "Prime Minister of Australia · Joint statement",
                          "21 Sep 2025", "Australia recognises the State of Palestine", body,
                          "pm.gov.au joint statement, 21 Sep 2025; PM press conference, 11 Aug 2025",
                          highlights=[("Hamas must have no role in Palestine", self.h[0], 0.6), ("demilitarise", self.h[1], 0.4),
                                      ("hold general elections", self.h[2], 0.5)], body_size=34)
        else:
            balance_scale(c, t, self.t_scale, self.t_both, self.t_rw, self.t_cm)
        grain(c, fi, 0.02)


def balance_scale(c, t, t_in, t_arrows, t_l, t_r):
    """M3 as a level scale: two identical cards (same size, same design), the beam stays level."""
    desk(c, 0)
    a = eo(t, t_in, 0.4)
    cx, beam_y = W / 2, 250
    line(c, cx, beam_y, cx, 960, "#5A6C88", a, 6)
    line(c, cx - 640, beam_y, cx + 640, beam_y, AMBER, a, 5)
    circle(c, cx, beam_y, 14, AMBER, a)
    rect(c, cx - 120, 950, 240, 16, "#5A6C88", a, r=4)
    cw, ch = 760, 560
    for side, tt in ((0, t_l), (1, t_r)):
        x = cx - 640 - cw / 2 + 100 if side == 0 else cx + 640 - cw / 2 - 100
        y = beam_y + 70
        line(c, x + cw / 2, beam_y, x + cw / 2, y, "#8796AE", a, 2)
        k = ease_out(lin(t, tt, tt + 0.45))
        yy = y - 40 * (1 - k)
        if a > 0:
            layer(c, a * mix(0.5, 1.0, k))
            shadow(c, x, yy, cw, ch, 0.5, 20, 10, 4)
            rect(c, x, yy, cw, ch, NAVY, 0.97, r=4)
            rect(c, x, yy, 3, ch, AMBER, 1)
            draw_text(c, "SUMMARY OF PUBLIC POSITIONS", x + 40, yy + 52, SANS, 16, 600, GREY, 1, cw, tracking=2.6, anchor="baseline")
            if side == 0:
                draw_text(c, "The Coalition, Israel’s government and many Jewish groups", x + 40, yy + 80, SANS, 26, 600, OFFW, 1, cw - 80)
                draw_text(c, "Said recognition rewarded Hamas.", x + 40, yy + 190, SERIF, 40, 400, OFFW, 1, cw - 80)
                smallcaps(c, "Statements, Aug–Sep 2025", x + 40, yy + ch - 40, 18, GREY, 1)
            else:
                draw_text(c, "A pro-Palestinian advocacy group (APAN)", x + 40, yy + 80, SANS, 26, 600, OFFW, 1, cw - 80)
                draw_text(c, "“Recognition is completely meaningless while Australia continues to arms, trade with, "
                             "diplomatically protect and encourage other states to normalise relations with the very state "
                             "perpetrating these atrocities…”", x + 40, yy + 150, SERIF, 29, 400, OFFW, 1, cw - 80)
                smallcaps(c, "APAN statement · 11 Aug 2025", x + 40, yy + ch - 70, 18, GREY, 1)
                draw_text(c, "APAN president Nasser Mashni used the same words (The Guardian, 11 Aug 2025)", x + 40, yy + ch - 40,
                          SANS, 16, 400, GREY, 1, cw - 80)
            c.restore()
    # arrows strike from both directions, symmetric
    for side in (0, 1):
        k = ease_out(lin(t, t_arrows + 0.18 * side, t_arrows + 0.18 * side + 0.4))
        if 0 < k:
            x0 = -100 if side == 0 else W + 100
            x1 = cx - 60 if side == 0 else cx + 60
            xx = mix(x0, x1, k)
            fade_ = 1 - smooth(t, t_arrows + 1.2, t_arrows + 1.7)
            line(c, x0, 170, xx, 170, OFFW, 0.8 * fade_, 4)
            from lib.geo import arrow_head
            arrow_head(c, [(xx - (10 if side == 0 else -10), 170), (xx, 170)], OFFW, 0.8 * fade_, 22)
    draw_text(c, "ATTACKED FROM BOTH DIRECTIONS", 0, 130, SANS, 22, 700, OFFW, eo(t, t_arrows, 0.3), W, "center", tracking=5,
              anchor="baseline")


@scene("S22")
class S22(Scene):
    def plan(self):
        S = self.S
        self.tick(S.vo_start + 0.1, "AUG 2025 · BONDI −117 DAYS", "Then it turned personal")
        EV.cue(self.sid, "ticker_117", S.vo_start + 0.1, "")
        self.tag("ticker", "", S.vo_start + 0.1, self.w("posted"))
        self.t_tp = self.cue("split", "turned personal")
        self.sfx(self.t_tp, "SFX05_whoosh", -4, "turned personal")
        self.sfx(self.t_tp + 0.35, "SFX06_tick", -4, name="SPLIT lock")
        CAST_LIT["NETANYAHU"] = self.w("Israel's prime minister")
        CASTW.append((self.w("Israel's prime minister") - 0.2, self.w("posted") + 1.6, "NETANYAHU"))
        self.t_post = self.cue("qt08", "posted")
        self.sfx(self.t_post, "SFX17_ping", -4, "posted")
        self.tag("label", "Recreation of public post · X, 19 Aug 2025", self.t_post, self.w("Albanese replied") + 0.3)
        self.t_rep = self.cue("qt09", "Albanese replied")
        self.t_pers = self.cue("qt09_complete", "personally")
        self.tag("caption", "Benjamin Netanyahu, official portrait, Feb 2023 (GPO)  ·  Anthony Albanese, official portrait, 2022",
                 self.t_tp + 0.4, self.t_post - 0.1)
        q8 = QUOTES["QT08"]["q"].split()
        n1 = 9   # "History will remember Albanese for what he is: A weak politician..." up to "is:"
        a0, a1 = self.w("history would remember"), self.we("as")
        b0, b1 = self.w("a weak"), self.we("Jews")
        self.q8 = [mix(a0, a1, k / (n1 - 1)) for k in range(n1)] + [mix(b0, b1 - 0.2, k / (len(q8) - n1 - 1)) for k in range(len(q8) - n1)]
        q9 = QUOTES["QT09"]["q"].split()
        c0, c1 = self.w("I don't"), self.we("personally")
        self.q9 = [mix(c0, c1 - 0.2, k / (len(q9) - 1)) for k in range(len(q9))]

    def draw(self, c, t, fi):
        S = self.S
        rect(c, 0, 0, W, H, "#000000")
        k = smooth(t, self.t_tp, self.t_tp + 0.35)
        if k <= 0:
            desk(c, fi)
            return
        hgt = max(quote_card_size("QT08", 840, 36)[1], quote_card_size("QT09", 840, 36)[1])
        # equal panels: Netanyahu left (flag sliver kept out of frame by the panel edge), Albanese right
        panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH10_netanyahu_2400.jpg"), x, y, w, h, 1.18, 0.62, 0.3,
                                                  gpaint("modern", 0.6, 0.8)), 0, 0, W / 2 - 2, H, k)
        panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH07_albanese_2400.jpg"), x, y, w, h, 1.18, 0.5, 0.3,
                                                  gpaint("modern", 0.6, 0.8)), W / 2 + 2, 0, W / 2 - 2, H, k)
        seam(c, W / 2, 0, H, k)
        if t >= self.t_post:
            rect(c, 0, 0, W / 2, H, "#000000", 0.35 * eo(t, self.t_post, 0.3))
            quote_card(c, "QT08", 60, H - hgt - 90, t, self.t_post, w=840, qsize=36, word_times=self.q8, min_h=hgt)
        if t >= self.t_post:
            rect(c, W / 2, 0, W / 2, H, "#000000", 0.35 * eo(t, self.t_post, 0.3))
            quote_card(c, "QT09", W / 2 + 60, H - hgt - 90, t, self.t_post, w=840, qsize=36, word_times=self.q9, min_h=hgt)


@scene("S23")
class S23(Scene):
    def plan(self):
        S = self.S
        self.t_v = self.cue("stamps", "Visas")
        self.sfx(self.t_v + 0.05, "SFX19_stamp", -2, "Visas", name="stamp L")
        self.sfx(self.t_v + 0.33, "SFX19_stamp", -2, name="stamp R")
        self.tag("source", "Source: Home Affairs Minister and Israeli Foreign Ministry statements, 18 Aug 2025", self.t_v,
                 self.w("Abroad") - 0.1, "Visas")
        self.t_low = self.cue("crack", "lowest point")
        self.sfx(self.t_low, "SFX11_boom", -6, "lowest point")
        self.t_ab = self.cue("node_canberra", "Abroad")
        self.t_close = self.cue("candle", "much closer")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_ab:
            desk(c, fi)
            cr = smooth(t, self.t_low, self.t_low + 0.5)
            for side in (0, 1):
                x = 260 if side == 0 else W / 2 + 180
                rect(c, x, 260, 520, 560, "#E9E3D6", 1, r=8)
                rect(c, x, 260, 520, 560, "#B9AE98", 1, r=8, stroke=2)
                for i in range(7):
                    rect(c, x + 50, 330 + i * 64, 420, 2, "#C8BFAE", 1)
                draw_text(c, "VISA", x + 50, 318, SANS, 22, 700, "#7A6E58", 1, 400, tracking=6, anchor="baseline")
                stamp_text(c, "VISA CANCELLED", x + 260, 560, t, self.t_v + 0.05 + 0.28 * side, 40, "#B4552E", -8 + 4 * side)
            draw_text(c, "Australia", 260, 880, SANS, 26, 600, OFFW, 1, 520, "center", anchor="baseline")
            draw_text(c, "Israel", W / 2 + 180, 880, SANS, 26, 600, OFFW, 1, 520, "center", anchor="baseline")
            seam(c, W / 2, 150, 930, 1.0, crack=cr)
        elif t < self.t_close:
            draw_thread(c, t, None, 1.0, 0.0, 0.0, {"THE FIRE": -10, "TWO MEMORIES": -10, "CANBERRA": self.t_ab + 0.3})
            vignette(c, 0.4)
        else:
            k = smooth(t, self.t_close, self.t_close + 1.2)
            draw_thread(c, t, None, 1.0, 0.0, 0.0, {"THE FIRE": -10, "TWO MEMORIES": -10, "CANBERRA": -10})
            layer(c, k)
            candles(c, t - self.t_close, warm=True)
            c.restore()
        grain(c, fi, 0.02)


def candles(c, tl, warm=False, alpha=1.0, start=2.0):
    video(c, "ST13", tl, "warm" if warm else "modern", 0.5, 0.75, alpha=alpha, start=start, zoom=1.05, z1=1.1, dur=10)
    vignette(c, 0.55)
