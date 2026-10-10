"""CHAPTER 1: The Fire (S08-S12)"""
import math
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Flat, flat_map, pin, P, dashed, curve_pts
from lib.thread import draw_thread, CAM
from lib.board import board_bg, board_card, board_pos, cast_board
from scenes.common import Q, CASTW, CAST_LIT
from scenes.s_cold import flame, fact_card

PH24 = "PH24_asio_hq_2400.jpg"


def chapter_hold(c, t, seg, label, title, sub, bg, fi):
    t0, t1 = seg.chapter_hold
    bg(c, t)
    rect(c, 0, 0, W, H, NAVY, 0.55)
    vignette(c, 0.5)
    chapter_card(c, label, title, sub, t, t0 + 0.25, t1 - 0.45)


@scene("S08")
class S08(Scene):
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "chapter_card", t0, "")
        self.tag("caption", "Ben Chifley Building (ASIO headquarters), Canberra, 2014", S.vo_start + 0.4, self.w("described") - 0.2)
        self.t_asio = self.cue("asio_label", "ASIO", 1)
        self.sfx(self.t_asio, "SFX_pop", 0, "ASIO")
        self.t_inv = self.cue("dotted", "kept investigating")
        self.sfx(self.t_inv, "SFX06_tick", -2, "kept investigating")
        self.t_q12 = self.cue("qt12", "described")
        self.t_cake = self.cue("cake", "layer cake")
        self.sfx(self.t_cake, "SFX21_thunk", -2, "layer cake")
        self.sfx(S.vo_start, "SFX12_shutter", -2, name="drop PH24")

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            chapter_hold(c, t, S, "CHAPTER 1", "THE FIRE", "BONDI −420 DAYS",
                         lambda c, t: flame(c, t, S.start, fi, 0.75), fi)
            return
        desk(c, fi)
        k_out = smooth(t, self.t_q12 - 0.3, self.t_q12 + 0.4)
        # PH24 print, DROP + PAN
        print_photo(c, photo(PH24), mix(W / 2, 520, k_out), mix(520, 470, k_out), mix(1180, 700, k_out), t, S.vo_start,
                    tilt=-1.5, zoom=mix(1.0, 1.12, smooth(t, S.vo_start, self.t_q12)), fx=0.5, fy=0.6, grade=gpaint("modern"))
        if self.t_asio <= t < self.t_q12:
            a = eo(t, self.t_asio, 0.25) * (1 - smooth(t, self.t_q12 - 0.4, self.t_q12))
            bx, by = W / 2 + 40, 560
            circle(c, bx, by, 9, AMBER, a)
            line(c, bx, by, bx + 140, by - 150, AMBER, a, 2)
            rect(c, bx + 140, by - 196, 300, 56, NAVY, 0.9 * a, r=3)
            rect(c, bx + 140, by - 196, 300, 56, AMBER, a, r=3, stroke=1.5)
            draw_text(c, "ASIO", bx + 160, by - 158, SANS, 30, 700, OFFW, a, 300, tracking=4, anchor="baseline")
            draw_text(c, "domestic spy agency", bx + 255, by - 160, SANS, 17, 500, "#C2C8D0", a, 300, anchor="baseline")
        if t >= self.t_inv:
            pts = curve_pts((180, 900), (1760, 850), -0.06, 80)
            dashed(c, pts, smooth(t, self.t_inv, self.t_inv + 2.6), AMBER, 3, 0.8 * (1 - k_out * 0.7))
        if t >= self.t_q12:
            quote_card(c, "QT12", 1000, 300, t, self.t_q12, w=800, qsize=46)
            cake(c, t, 1400, 760, 0.0, self.t_cake, scale=0.5, empty=True)
        grain(c, fi, 0.025)


LAYERS = [("OVERSEAS MIDDLEMEN", 2), ("COORDINATORS", 3), ("PEOPLE IN AUSTRALIA · ALLEGEDLY PAID", 4)]


def cake(c, t, cx, cy, fill_times, t_in, scale=1.0, empty=False, alpha=1.0):
    """The layer cake: dark cross-section, three layers that fill top-down (faceless figure icons)."""
    a = alpha * eo(t, t_in, 0.35)
    if a <= 0.003:
        return
    c.save()
    c.translate(cx, cy)
    c.scale(scale, scale)
    layer(c, a)
    lw, lh, gap = 760, 150, 16
    y0 = -(3 * lh + 2 * gap) / 2
    for k, (lab, n) in enumerate(LAYERS):
        y = y0 + k * (lh + gap)
        inset = (2 - k) * 60
        path = skia.Path()
        path.moveTo(-lw / 2 + inset, y)
        path.lineTo(lw / 2 - inset, y)
        path.lineTo(lw / 2 - inset + 30, y + lh)
        path.lineTo(-lw / 2 + inset - 30, y + lh)
        path.close()
        c.drawPath(path, paint("#0F1B2D", 0.96))
        c.drawPath(path, paint("#3C5070", 0.9, stroke=1.5))
        if empty or fill_times is None:
            continue
        ft = fill_times[k]
        f = eo(t, ft, 0.35)
        if f <= 0:
            continue
        c.save()
        c.clipPath(path, doAntiAlias=True)
        rect(c, -lw / 2 - 40, y + lh * (1 - f), lw + 80, lh * f + 2, "#2A3E5C", 1)
        rect(c, -lw / 2 - 40, y, lw + 80, 3, AMBER, f)
        c.restore()
        for i in range(n):
            fx = -(n - 1) * 46 / 2 + i * 46
            figure_icon(c, fx - 150, y + lh * 0.62, 0.95, OFFW if k < 2 else AMBER, f)
        draw_text(c, lab, -40, y + lh * 0.5 + 10, SANS, 26 if k < 2 else 23, 700, OFFW, f, 430, tracking=2.2, anchor="baseline")
    c.restore()
    c.restore()


@scene("S09")
class S09(Scene):
    def plan(self):
        S = self.S
        self.ft = [self.cue("layer1", "Middlemen overseas"), self.cue("layer2", "Coordinators"),
                   self.cue("layer3", "people in Australia")]
        for k, ft in enumerate(self.ft):
            self.sfx(ft, "SFX06_tick", -1, ["Middlemen overseas", "Coordinators", "people in Australia"][k])
        self.sfx(self.ft[2] + 0.05, "SFX05_whoosh", -5, "people in Australia", name="line reaches Sydney")
        self.t_caas = self.cue("caas", "crime as a service")
        self.t_den = self.cue("deniable", "deniable")
        self.t_hard = self.cue("hard", "hard to detect")
        self.sfx(self.t_den, "SFX06_tick", -1, "deniable")
        self.sfx(self.t_hard, "SFX06_tick", -1, "hard to detect")
        self.tag("source", "“a layer cake of cut-outs”: Mike Burgess, ASIO Director-General, 26 Aug 2025\nLayer labels are this film’s summary",
                 S.start + 0.3, self.t_caas - 0.3)
        self.t_black = S.end + 0.0   # S10 silence follows

    def draw(self, c, t, fi):
        S = self.S
        m = Flat(38, 162, -46, 46)
        flat_map(c, m, "110m", alpha=0.55)
        rect(c, 0, 0, W, H, NAVY, 0.35)
        tx, ty = m.xy(*P["Tehran"])
        sx, sy = m.xy(*P["Sydney"])
        mx, my = m.xy(*P["Melbourne"])
        pin(c, tx, ty, t, S.start, "Tehran", size=22)
        cx, cy = 860, 540
        # alleged trail through the layers
        p1 = curve_pts((tx, ty), (cx, cy - 250), 0.15, 40)
        dashed(c, p1, smooth(t, self.ft[0], self.ft[0] + 1.2), GREY, 3, 0.9)
        if t >= self.ft[2]:
            p2 = curve_pts((cx, cy + 250), (sx, sy), 0.12, 40)
            p3 = curve_pts((cx, cy + 250), (mx, my), -0.05, 40)
            k = smooth(t, self.ft[2], self.ft[2] + 1.2)
            dashed(c, p2, k, AMBER, 3, 0.95)
            dashed(c, p3, k, AMBER, 3, 0.95)
            if k >= 1:
                pin(c, sx, sy, t, self.ft[2] + 1.2, "Sydney", size=20, label_side="left")
                pin(c, mx, my, t, self.ft[2] + 1.25, "Melbourne", size=20, label_side="left")
            # ALLEGED tag
            a = eo(t, self.ft[2] + 0.6, 0.3)
            rect(c, 1260, 820, 170, 44, NAVY, 0.9 * a, r=3)
            rect(c, 1260, 820, 170, 44, GREY, a, r=3, stroke=1.5)
            draw_text(c, "ALLEGED", 1260, 850, SANS, 22, 700, "#C9CDD3", a, 170, "center", tracking=4, anchor="baseline")
        draw_text(c, "THE LAYER CAKE", cx - 400, 250, SANS, 20, 700, AMBER, eo(t, S.start, 0.3), 800, "center", tracking=6,
                  anchor="baseline")
        cake(c, t, cx, cy, self.ft, S.start - 1, scale=1.0)
        kinetic(c, "CRIME AS A SERVICE", 1560, 420, t, self.t_caas, 40, SANS, 700, OFFW, tracking=4)
        draw_text(c, "analysts’ term", 1260, 458, SANS, 20, 500, GREY, eo(t, self.t_caas + 0.2, 0.3), 600, "center", anchor="baseline")
        kinetic(c, "DENIABLE", 1560, 560, t, self.t_den, 54, SERIF, 600, AMBER)
        kinetic(c, "HARD TO DETECT", 1560, 650, t, self.t_hard, 54, SERIF, 600, AMBER)
        grain(c, fi, 0.02)
        rect(c, 0, 0, W, H, "#000000", smooth(t, S.vo_end - 0.15, S.end))


@scene("S10")
class S10(Scene):
    def plan(self):
        S = self.S
        self.t_aug = self.cue("ticker_110", "August")
        self.tick(self.t_aug, "AUG 2025 · BONDI −110 DAYS", "August")
        self.tag("ticker", "", self.t_aug, self.w("The Bondi restaurant fire") - 0.2)
        self.sfx(self.t_aug + 0.15, "SFX18_paper", 2, "August", name="DOC03 card")
        self.t_rg = self.cue("highlight", "Revolutionary Guard")
        self.sfx(self.t_rg, "SFX11_boom", -6, "Revolutionary Guard")
        self.t_rf = self.cue("pin_sydney", "restaurant fire")
        self.t_syn = self.cue("pin_melb", "synagogue")
        self.sfx(self.t_rf, "SFX21_thunk", -2, "restaurant fire")
        self.sfx(self.t_syn, "SFX21_thunk", -2, "synagogue")
        self.t_he = self.w("He called them")
        self.sfx(self.t_he, "SFX12_shutter", 0, "He called them", name="drop PH07")
        self.t_ext = self.cue("qt01", "extraordinary")
        self.t_soil = self.cue("answer_stamp", "Australian soil")
        self.sfx(self.t_soil + 0.6, "SFX19_stamp", -1, "Australian soil")
        CAST_LIT["ALBANESE"] = self.t_he
        CASTW.append((self.t_he, self.t_soil - 0.3, "ALBANESE"))
        n = len(QUOTES["QT01"]["q"].split())
        t0 = self.w("extraordinary")
        t1 = self.we("soil")
        # card shows the full sentence; words read by the narrator light in time ("These were" lit with the first)
        self.qwt = [t0] * 2 + [mix(t0, t1 - 0.2, k / (n - 3)) for k in range(n - 2)]
        Q["fly"][1] = (self.t_soil, self.S.end + 0.8)
        Q.setdefault("show", []).append((self.t_soil - 1.2, self.S.end + 2.5))
        Q["answer"][1] = (self.t_soil + 0.6, "WHO PAID?  ALLEGED: IRGC (ASIO)")
        self.tag("caption", "Anthony Albanese, official portrait, 2022", self.t_he + 0.3, self.t_soil - 0.2)

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            rect(c, 0, 0, W, H, "#000000")
            return
        desk(c, fi)
        rect(c, 0, 0, W, H, "#000000", 1 - smooth(t, S.vo_start, S.vo_start + 0.5))
        k1 = smooth(t, self.t_he - 0.3, self.t_he + 0.2)
        if k1 < 1:
            layer(c, 1 - k1)
            body = ("Enough credible intelligence has now been gathered to reach the deeply disturbing conclusion that "
                    "the Iranian Government has directed at least two of these attacks. ASIO assesses it was behind "
                    "the attacks on Lewis’ Continental Kitchen in Sydney on October 20 last year; and the Adass Israel "
                    "Synagogue in Melbourne on December 6 last year.")
            evidence_card(c, 110, 150, 1000, t, self.t_aug + 0.1, "Prime Minister of Australia · Media statement",
                          "26 Aug 2025", "Response to Iranian attacks", body, "pm.gov.au, 26 Aug 2025",
                          highlights=[("the Iranian Government has directed at least two of these attacks", self.t_rg, 0.8)],
                          body_size=29, label="IRGC named by ASIO Director-General Mike Burgess, same day")
            # right: small map with the two fires
            if t >= self.t_rf - 0.6:
                m = Flat(140, 155, -40.5, -31.5, 1180, 170, 640, 700)
                a = eo(t, self.t_rf - 0.6, 0.3)
                layer(c, a)
                shadow(c, 1180, 170, 640, 700, 0.5, 20, 10)
                flat_map(c, m, "50m")
                sx, sy = m.xy(*P["Sydney"])
                mx, my = m.xy(*P["Melbourne"])
                pin(c, sx, sy, t, self.t_rf, "Bondi · Oct 2024", size=21, label_side="left")
                pin(c, mx, my, t, self.t_syn, "Melbourne · Dec 2024", size=21)
                c.restore()
            c.restore()
        if t >= self.t_he - 0.3:
            quote_card(c, "QT01", 110, 300, t, self.t_he - 0.1, w=1100, word_times=self.qwt)
            print_photo(c, photo("PH07_albanese_2400.jpg"), 1530, 520, 420, t, self.t_he, tilt=2.0,
                        h=560, fx=0.5, fy=0.32, grade=gpaint("modern", 0.5))
        # question 2 flies to centre and is stamped (payoff of M7b)
        if t >= self.t_soil:
            x1, y1, w1, h1 = q_slot(1)
            k = ease_io(lin(t, self.t_soil, self.t_soil + 0.55))
            s = mix(1.0, 2.2, k)
            cx, cy = mix(x1 + w1 / 2, W / 2, k), mix(y1 + h1 / 2, H / 2 - 40, k)
            rect(c, 0, 0, W, H, "#000000", 0.5 * k)
            q_card(c, 1, cx - w1 * s / 2, cy - h1 * s / 2, w1, h1, 1.0, scale=s)
            stamp_text(c, "ALLEGED: IRAN’S REVOLUTIONARY GUARD", W / 2, H / 2 + 110, t, self.t_soil + 0.6, 40, AMBER, -3)
            draw_text(c, "(ASIO ASSESSMENT)", 0, H / 2 + 200, SANS, 26, 600, AMBER, eo(t, self.t_soil + 0.8, 0.3), W,
                      "center", tracking=4, anchor="baseline")
        grain(c, fi, 0.02)


@scene("S11")
class S11(Scene):
    def plan(self):
        S = self.S
        self.t_exp = self.cue("door", "expelled")
        self.sfx(self.t_exp + 0.42, "SFX22_door", 0, "expelled")
        self.tag("source", "Source: PM, Foreign Minister and Home Affairs statements, 26 Aug 2025", self.t_exp, self.w("In Parliament") - 0.2)
        self.t_ww = self.cue("timeline", "Second World War")
        for k in range(10):
            self.sfx(self.t_ww + k * 0.07, "SFX06_tick", -5, name="timeline race")
        self.sfx(self.t_ww + 0.85, "SFX19_stamp", -2, "Second World War", name="2025 marker")
        self.t_den = self.cue("iran_denies", "Iran denied")
        self.t_parl = self.cue("parliament", "In Parliament")
        self.tag("caption", "House of Representatives, Canberra (file footage)", self.t_parl + 0.2, self.w("Remember") - 0.2)
        self.t_ley = self.w("then Opposition Leader")
        self.sfx(self.t_ley, "SFX12_shutter", 0, "then Opposition Leader", name="drop PH29")
        CAST_LIT["LEY"] = self.w("Sussan Ley")
        CASTW.append((self.w("Sussan Ley") - 0.2, self.w("turn") + 0.8, "LEY"))
        self.t_turn = self.cue("qt02", "turn neighbour against neighbour")
        self.t_rem = self.cue("pin_ley", "Remember those words")
        self.tag("source", "Source: Hansard, 26 Aug 2025", self.t_turn, self.t_rem, "turn neighbour against neighbour")
        self.sfx(self.t_rem + 0.45, "SFX21_thunk", 0, "Remember those words", name="bright pin")
        t0, t1 = self.w("turn"), self.we("Australian", 2)
        n = len(QUOTES["QT02"]["q"].split())
        self.qwt = [t0 - 0.15] + [mix(t0, t1 - 0.2, k / (n - 2)) for k in range(n - 1)]
        self.tag("caption", "Sussan Ley, official portrait", self.t_ley + 0.3, self.t_turn - 0.1)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_parl:
            desk(c, fi)
            # answered question card lingers briefly from S10
            # M5 doors: two flat panels close
            k = ease_in(lin(t, self.t_exp, self.t_exp + 0.42))
            dw = W / 2 * k
            if t < self.t_ww:
                rect(c, 0, 0, dw, H, "#2C3D57", 1)
                rect(c, W - dw, 0, dw, H, "#2C3D57", 1)
                for x in (dw, W - dw):
                    rect(c, x - 2, 0, 4, H, "#0A111C", 1)
                if k > 0:
                    for side in (0, 1):
                        x0 = 0 if side == 0 else W - dw
                        rect(c, x0 + 60, 120, dw - 120, H - 240, "#1C2A40", 0.9 * k, r=4, stroke=3)
                        rect(c, x0 + 100, 160, dw - 200, H - 320, "#23344F", 0.8 * k, r=3, stroke=2)
                    circle(c, W / 2 - 40, H / 2, 10, "#8A93A3", k)
                    circle(c, W / 2 + 40, H / 2, 10, "#8A93A3", k)
                kinetic(c, "IRAN’S AMBASSADOR EXPELLED", W / 2, H / 2 + 230, t, self.t_exp + 0.5, 46, SANS, 700, OFFW, tracking=4)
                draw_text(c, "and three other Iranian officials · 26 Aug 2025", 0, H / 2 + 285, SANS, 24, 500, "#C3C9D1",
                          eo(t, self.t_exp + 0.8, 0.3), W, "center", anchor="baseline")
            else:
                timeline_wwii(c, t, self.t_ww, self.t_den)
        else:
            kb = smooth(t, self.t_rem + 0.1, self.t_rem + 0.6)
            video(c, "FT07b", t - self.t_parl, "modern", 0.8, 0.55 * (1 - kb), zoom=1.05, z1=1.1, dur=8)
            if kb > 0:
                layer(c, kb)
                board_bg(c)
                c.restore()
            vignette(c, 0.5)
            # QT02 builds; then pins onto the evidence board (M8 planted)
            k = ease_io(lin(t, self.t_rem + 0.05, self.t_rem + 0.5))
            if k < 1:
                c.save()
                bx, by = board_pos("ley")
                x0, y0 = 120, 330
                cw, ch = quote_card_size("QT02", 1100)
                s = mix(1.0, 0.36, k)
                c.translate(mix(x0, bx - cw * 0.36 / 2, k), mix(y0, by - ch * 0.36 / 2, k))
                c.scale(s, s)
                quote_card(c, "QT02", 0, 0, t, self.t_ley - 0.2, w=1100, word_times=self.qwt)
                c.restore()
                print_photo(c, photo("PH29_ley_2400.jpg"), 1530, 520, 420, t, self.t_ley, tilt=2.0, h=560, fx=0.5,
                            fy=0.3, grade=gpaint("modern", 0.5), alpha=1 - k)
            else:
                board_card(c, "ley", t, self.t_rem + 0.45, bright=1.0, glow=1.0 - 0.5 * smooth(t, self.t_rem + 0.5, S.end))
        grain(c, fi, 0.02)


def timeline_wwii(c, t, t0, t_den):
    """1945 -> 2025: empty years race past; one amber marker stamps at 2025 (DOC19)."""
    rect(c, 0, 0, W, H, NAVY, 1)
    y = 560
    x0, x1 = 160, 1760
    line(c, x0, y, x1, y, "#3C5070", 1, 3)
    race = smooth(t, t0, t0 + 0.85)
    yr = int(1945 + 80 * race)
    for k in range(0, 81, 5):
        x = mix(x0, x1, k / 80)
        if k / 80 <= race + 1e-6:
            line(c, x, y - 12, x, y + 12, "#6A7C98", 1, 2)
            if k % 10 == 5 or k == 0:
                draw_text(c, str(1945 + k), x - 60, y + 50, MONO, 20, 500, "#7D8BA0", 1, 120, "center", anchor="baseline")
    hx = mix(x0, x1, race)
    circle(c, hx, y, 8, OFFW, 1)
    draw_text(c, str(yr), hx - 80, y - 40, MONO, 34, 600, OFFW, 1 - smooth(t, t0 + 0.8, t0 + 1.0), 160, "center", anchor="baseline")
    if t >= t0 + 0.85:
        k = eo(t, t0 + 0.85, 0.25)
        rect(c, x1 - 3, y - 120 * k, 6, 120 * k, AMBER, 1)
        circle(c, x1, y, 14, AMBER, k)
        draw_text(c, "2025", x1 - 80, y + 52, MONO, 26, 700, AMBER, k, 160, "center", anchor="baseline")
        draw_text(c, "Government: first expulsion of an ambassador since WWII", 0, 380, SERIF, 46, 600, OFFW, k, W,
                  "center", anchor="baseline")
        draw_text(c, "1945", x0 - 60, y + 52, MONO, 26, 700, "#9AA6B8", k, 120, "center", anchor="baseline")
        draw_text(c, "No expulsion of an ambassador in between, the government said", 0, 440, SANS, 24, 500, "#AEB6C2", k, W,
                  "center", anchor="baseline")
    if t >= t_den:
        k = eo(t, t_den, 0.3)
        rect(c, W / 2 - 150, 720, 300, 60, NAVY, 0.9 * k, r=3)
        rect(c, W / 2 - 150, 720, 300, 60, GREY, k, r=3, stroke=2)
        draw_text(c, "IRAN DENIES", W / 2 - 150, 761, SANS, 28, 700, "#C9CDD3", k, 300, "center", tracking=4, anchor="baseline")
    vignette(c, 0.4)


@scene("S12")
class S12(Scene):
    def plan(self):
        S = self.S
        self.t_110 = self.cue("ticker_pulse", "one hundred and ten days")
        self.tick(self.t_110, "AUG 2025 · BONDI −110 DAYS", "one hundred and ten days", flip=0.01, pulse_once=True)
        self.tag("ticker", "", self.t_110 - 0.2, self.w("But why") + 0.6)
        self.t_card = self.w("before Bondi")
        self.sfx(self.t_card, "SFX21_thunk", -3, "before Bondi", name="board card pins")
        self.t_why = self.cue("globe_node", "But why")
        self.t_weap = self.cue("flame_flicker", "as a weapon")
        self.sfx(self.t_weap, "SFX02_fire", -9, "as a weapon")
        self.t_cast = self.cue("sepia", "cast first")
        self.sfx(self.t_cast, "SFX07_projector", -2, "cast first", name="projector", dur=10.0, fin=0.8, fout=1.5)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_why:
            board_bg(c)
            board_card(c, "ley", t, -10, bright=0.6)
            board_card(c, "fire", t, self.t_card)
            vignette(c, 0.4)
        else:
            sep = smooth(t, self.t_cast, self.t_cast + 1.2)
            layer(c, 1.0)
            draw_thread(c, t, None, 1.0, 0.0, 0.0, {"THE FIRE": self.t_why + 0.3})
            fk = lin(t, self.t_weap, self.t_weap + 0.8)
            if 0 < fk < 1:
                p = skia.Paint(); p.setAlphaf(0.55 * math.sin(fk * math.pi)); p.setBlendMode(skia.BlendMode.kScreen)
                c.saveLayer(None, p)
                flame(c, t, self.t_weap, fi)
                c.restore()
            vignette(c, 0.4)
            c.restore()
            if sep > 0:
                # sepia wash toward 1947
                p = skia.Paint()
                p.setColorFilter(skia.ColorFilters.Matrix(__import__("lib.media", fromlist=["x"]).grade_matrix("archival", sep)))
                img = c.getSurface().makeImageSnapshot() if c.getSurface() else None
                if img is not None:
                    c.drawImage(img, 0, 0, skia.SamplingOptions(), p)
                grain(c, fi, 0.06 * sep)
        grain(c, fi, 0.02)
