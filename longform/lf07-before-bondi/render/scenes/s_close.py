"""CLOSING (S43-S46)"""
import math
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.thread import draw_thread
from lib.board import board_bg, board_pos
from scenes.common import Q
from scenes.s_ch6 import two_candles, AHMED_ROLE
from scenes.s_ch4 import ZOMI_ROLE

ALL_LIT = {"THE FIRE": -10, "TWO MEMORIES": -10, "CANBERRA": -10, "LIVES": -10, "BONDI": -10}


@scene("S43")
class S43(Scene):
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "closing_card", t0, "")
        self.sfx(t0, "SFX13_waves_gulls", -2, name="waves (dawn callback)", dur=10.0, fin=0.4, fout=2.5)
        self.tag("caption", "Sydney’s eastern beaches (file footage)", t0 + 0.4, self.w("It didn't") - 0.1)
        self.tag("corner", "ANALYSIS", S.vo_start, S.vo_end, "It didn't pull the trigger")
        self.t_dpt = self.cue("thread_dims", "didn't pull the trigger")
        self.tn = [self.cue("node_vote", "A vote"), self.cue("node_jet", "jet"), self.cue("node_fires", "Fires")]
        for tt, tr in zip(self.tn, ("A vote", "jet", "Fires")):
            self.sfx(tt, "SFX06_tick", -1, tr)

    def draw(self, c, t, fi):
        S = self.S
        t0, t1 = S.chapter_hold
        if t < self.t_dpt:
            video(c, "ST02", t - t0, "modern", 1.0, 0.98, zoom=1.0, z1=1.06, dur=14)
            vignette(c, 0.35)
            if t < S.vo_start:
                a = fade(t, t0 + 0.5, t1 - 0.3, 0.8, 0.5)
                rect(c, 0, 0, W, H, NAVY, 0.35 * a)
                draw_text(c, "CLOSING", 0, 540, SERIF, 96, 600, OFFW, a, W, "center", tracking=8, anchor="baseline")
        else:
            dim = smooth(t, self.t_dpt, self.t_dpt + 0.4) * (1 - smooth(t, self.t_dpt + 1.2, self.t_dpt + 1.8))
            draw_thread(c, t, None, 1.0, 0.0, 0.0, ALL_LIT, thread_dim=dim, labels=True)
            # each phrase relights a thread running into Bondi
            for i, (tt, lab) in enumerate(zip(self.tn, ("A VOTE AUSTRALIA CAST FIRST", "PARTS IN A FIGHTER JET",
                                                         "FIRES, ASIO SAYS, DIRECTED FROM ABROAD"))):
                a = eo(t, tt, 0.3)
                if a > 0:
                    draw_text(c, lab, 120, 200 + i * 56, SANS, 26, 700, AMBER, a, 900, tracking=3, anchor="baseline")
            vignette(c, 0.4)
        grain(c, fi, 0.02)


@scene("S44")
class S44(Scene):
    def plan(self):
        S = self.S
        self.tn = [self.cue("node_amb", "ambassador"), self.cue("node_rec", "recognition"), self.cue("node_both", "both sides")]
        self.sfx(self.tn[0], "SFX06_tick", -1, "ambassador")
        self.sfx(self.tn[1], "SFX06_tick", -1, "recognition")
        self.sfx(self.tn[2], "SFX21_thunk", -2, "both sides")
        self.t_asio = self.w("ASIO says")
        self.tag("source", "ASIO assessment, announced 26 Aug 2025", self.t_asio, self.w("turn neighbour") - 0.1)
        self.t_qt = self.cue("qt02_returns", "neighbour against neighbour")
        self.sfx(self.t_qt, "SFX21_thunk", -8, "neighbour against neighbour")
        self.tag("source", "Source: Hansard, 26 Aug 2025 (then Opposition Leader)", self.t_qt, self.w("ran toward") - 0.1,
                 "neighbour against neighbour")
        self.t_ran = self.cue("two_candles", "ran toward the danger")
        self.t_board = self.t_asio - 0.3

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_board:
            draw_thread(c, t, None, 1.0, 0.0, 0.0, ALL_LIT, glow_warm=smooth(t, self.tn[2], self.tn[2] + 0.8))
            for i, (tt, lab) in enumerate(zip(self.tn, ("AN AMBASSADOR EXPELLED", "A RECOGNITION", "AUSTRALIANS GRIEVING ON BOTH SIDES"))):
                a = eo(t, tt, 0.3)
                if a > 0:
                    draw_text(c, lab, 120, 200 + i * 56, SANS, 26, 700, AMBER, a, 900, tracking=3, anchor="baseline")
            vignette(c, 0.4)
        elif t < self.t_ran:
            # M8 payoff: Ley's card slides out of the evidence board, bright pin glowing; original source line kept
            board_bg(c)
            k = ease_io(lin(t, self.t_qt - 0.2, self.t_qt + 0.5))
            bx, by = board_pos("ley")
            cw, ch = quote_card_size("QT02", 1100)
            s = mix(0.36, 1.0, k)
            c.save()
            c.translate(mix(bx - cw * 0.36 / 2, (W - cw) / 2, k), mix(by - ch * 0.36 / 2, (H - ch) / 2, k))
            c.scale(s, s)
            quote_card(c, "QT02", 0, 0, t, -10, w=1100, glow=1.0)
            circle(c, cw / 2, 4, 14, AMBER, 1)
            circle(c, cw / 2, 4, 34, AMBER, 0.45, blur=12)
            c.restore()
        else:
            two_candles(c, t, t - self.t_ran + 14, None, alpha=smooth(t, self.t_ran, self.t_ran + 0.6))
        grain(c, fi, 0.02)


@scene("S45")
class S45(Scene):
    """QUIET. MONTAGE (5.0 s, no VO), then the last image: dawn sunlight (M2 last)."""
    def plan(self):
        S = self.S
        t0 = S.start
        self.mt = [t0, t0 + 1.25, t0 + 2.5, t0 + 3.75]
        EV.cue(self.sid, "montage", t0, "")
        self.tag("caption", "Migrants, 1949  ·  Tel Aviv and Palestinian refugees, 1948  ·  Bondi Pavilion, Dec 2025", t0 + 0.2, S.vo_start - 0.1)
        self.tag("corner", "ANALYSIS", S.vo_start, S.vo_end, "Maybe the real question")
        self.t_rq = self.cue("q_fades", "real question")
        Q["show"].append((S.vo_start - 0.4, self.t_rq + 0.6))
        self.t_ai = S.vo_start
        self.t_grief = self.cue("split_returns", "two communities' grief")
        self.tag("ai", "Dramatised reconstruction", self.t_ai, self.t_grief)
        self.t_next = self.w("What Australia does next")
        self.t_us = self.cue("sun_flare", "more about us")

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            i = max(k for k in range(4) if self.mt[k] <= t + 1e-6)
            if i == 0:
                full_photo(c, photo("PH05_station_pier_migrants.jpg"), t, self.mt[0], self.mt[1], 1.05, 1.1, grade="archival", amount=0.85)
            elif i == 1:
                for side, img in ((0, "PH03_israel_1948_celebration_2400.jpg"), (1, "PH04_palestinian_refugees_1948_2400.jpg")):
                    panel(c, lambda c, x, y, w, h, img=img: draw_cover(c, photo(img), x, y, w, h, 1.08, 0.5, 0.5,
                                                                       gpaint("archival", 0.85, 0.95)), 0 if side == 0 else W / 2 + 2, 0, W / 2 - 2, H)
                seam(c, W / 2, 0, H, 1.0)
            elif i == 2:
                rect(c, 0, 0, W, H, "#05080D")
                two_candles(c, t, t - S.start + 20, None, alpha=0.35)
                for side, (nm, role) in enumerate((("Zomi Frankcom", ZOMI_ROLE), ("Ahmed al Ahmed", AHMED_ROLE))):
                    name_card(c, nm, role, W / 4 + side * W / 2, 520, t, self.mt[2] - 1.6, size=58, width=840)
                seam(c, W / 2, 120, 960, 0.8)
            else:
                full_photo(c, photo("PH22_bondi_memorial_2400.jpg"), t, self.mt[3], self.mt[3] + 3, 1.06, 1.1, 0.5, 0.62,
                           grade="modern", bright=0.8)
            vignette(c, 0.45)
            grain(c, fi, 0.03)
            return
        if t < self.t_grief:
            video(c, "AI11", t - self.t_ai, "warm", 0.4, 0.95, zoom=1.0, z1=1.05, dur=6)
            vignette(c, 0.45)
        elif t < self.t_next:
            two_candles(c, t, t - self.t_grief + 4, None, alpha=smooth(t, self.t_grief, self.t_grief + 0.8))
        else:
            k = smooth(t, self.t_next, self.t_next + 1.0)
            fl = smooth(t, self.t_us, self.t_us + 1.4)
            video(c, "ST17", t - self.t_next, "warm", 0.3, 0.9 + 0.25 * fl, alpha=k, zoom=1.0, z1=1.05, dur=6)
            if fl > 0:
                p = skia.Paint(AntiAlias=True)
                p.setShader(skia.GradientShader.MakeRadial(skia.Point(W * 0.52, H * 0.38), W * 0.55,
                                                           [rgb("#FFD9A0", 0.45 * fl), rgb("#FFD9A0", 0)], [0, 1]))
                p.setBlendMode(skia.BlendMode.kScreen)
                c.drawRect(skia.Rect.MakeWH(W, H), p)
            vignette(c, 0.35)
        grain(c, fi, 0.02)


@scene("S46")
class S46(Scene):
    def plan(self):
        S = self.S
        self.t_q = self.cue("question", "Australia's issue")
        self.sfx(self.t_q, "SFX06_tick", -8, "Australia's issue")
        self.t_na = self.cue("support_card", "not alone")
        self.t_end = S.vo_end
        EV.cue(self.sid, "end_screen", self.t_end, "")
        self.tag("card", "Full sources and corrections: see description.", self.t_end + 0.5, S.end - 0.3)
        self.tag("card", "Support: Lifeline 13 11 14 (lifeline.org.au)", self.t_end + 0.5, S.end - 0.3)

    def draw(self, c, t, fi):
        S = self.S
        rect(c, 0, 0, W, H, "#05080D")
        if t < self.t_end:
            kinetic(c, "Is this Australia’s issue?", W / 2, 420, t, self.w("Is this"), 76, SERIF, 600, OFFW)
            kinetic(c, "Tell us what you think.", W / 2, 500, t, self.w("Tell us"), 36, SANS, 500, "#C9CED6")
            a = eo(t, self.t_na, 0.6)
            if a > 0:
                rect(c, W / 2 - 430, 640, 860, 150, NAVY, 0.95 * a, r=6)
                rect(c, W / 2 - 430, 640, 3, 150, AMBER, a)
                draw_text(c, "Support: Lifeline 13 11 14", W / 2 - 430, 710, SERIF, 46, 600, OFFW, a, 860, "center", anchor="baseline")
                draw_text(c, "lifeline.org.au", W / 2 - 430, 758, SANS, 28, 500, AMBER, a, 860, "center", anchor="baseline")
        else:
            # end screen (15 s)
            a = eo(t, self.t_end, 0.8)
            draw_text(c, "BEFORE BONDI", 0, 250, SERIF, 84, 700, OFFW, a, W, "center", tracking=8, anchor="baseline")
            rect(c, W / 2 - 160, 285, 320, 2, AMBER, a)
            draw_text(c, "799 days · 14,000 kilometres", 0, 340, SANS, 28, 500, "#C9CED6", a, W, "center", anchor="baseline")
            draw_text(c, "Full sources and corrections: see description.", 0, 820, SANS, 30, 600, OFFW, a, W, "center", anchor="baseline")
            draw_text(c, "Support: Lifeline 13 11 14 (lifeline.org.au)", 0, 870, SANS, 30, 600, AMBER, a, W, "center", anchor="baseline")
            # end-screen element zones (video / subscribe), drawn as quiet outlines
            for x in (360, 1100):
                rect(c, x, 420, 460, 258, "#FFFFFF", 0.10 * a, r=8, stroke=1.5)
        grain(c, fi, 0.015)
