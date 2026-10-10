"""COLD OPEN: How Did This Happen Here? (S01-S07)"""
import math
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Ortho, Flat, flat_map, pin, P, dashed, curve_pts, arc_points
from lib.thread import draw_thread, cam_at, CAM
from lib.board import still_of
from scenes.common import Q

PH22 = "PH22_bondi_memorial_2400.jpg"


def lower_title(c, text, t, t_in, t_out, y=820):
    a = fade(t, t_in, t_out, 0.35, 0.5)
    if a <= 0:
        return
    k = eo(t, t_in, 0.35)
    draw_text(c, text, 120, y + (1 - k) * 12, SERIF, 72, 600, OFFW, a, 1200, anchor="baseline")
    rect(c, 122, y + 22, 220 * smooth(t, t_in + 0.1, t_in + 0.8), 3, AMBER, a)


def question_build(c, i, t, t0, t_fly, t_land, words_t=None, big=58):
    """M7 question builds in serif centre-screen, then flies to its pinned slot."""
    text = Q_TEXT[i]
    if t < t0:
        return
    x1, y1, w1, h1 = q_slot(i)
    if t < t_fly:
        a = 1.0
        items, h = layout_words(text, SERIF, big, 600, 1500, 1.2)
        tw = items[-1]["x"] + items[-1]["wid"]
        al = [eo(t, words_t[k] if words_t else t0 + k * 0.12, 0.25) for k in range(len(items))]
        rect(c, 0, 0, W, H, "#000000", 0.35 * eo(t, t0, 0.3))
        draw_words(c, items, (W - tw) / 2, H / 2 - h / 2, SERIF, big, 600, OFFW, al)
        return
    k = ease_io(lin(t, t_fly, t_land))
    if k < 1:
        cx0, cy0 = W / 2, H / 2
        cx1, cy1 = x1 + w1 / 2, y1 + h1 / 2
        s = mix(1.9, 1.0, k)
        cx, cy = mix(cx0, cx1, k), mix(cy0, cy1, k)
        q_card(c, i, cx - w1 * s / 2, cy - h1 * s / 2, w1, h1, 1.0, scale=s)


@scene("S01")
class S01(Scene):
    def plan(self):
        S = self.S
        self.t_bb = self.cue("location", "Bondi Beach")
        self.t_14 = self.cue("ticker_in", "fourteenth of December")
        self.t_15 = self.cue("lives", "Fifteen")
        self.tick(self.t_14, "14 DEC 2025 · BONDI", "fourteenth of December", gain=-5)
        self.tag("ticker", "", self.t_14, 32.0)
        self.sfx(0.0, "SFX13_waves_gulls", 0, dur=20.0, fin=0.4, fout=4.0, name="waves")
        self.tag("caption", "Sydney’s eastern beaches (file footage)", 0.6, self.t_15 - 0.2)
        self.tag("caption", "Flowers at Bondi Pavilion, Sydney, 18 Dec 2025", self.t_15 + 0.6, 20.6)

    def draw(self, c, t, fi):
        if t < self.t_15:
            video(c, "ST02", t, "modern", 1.0, 0.98, zoom=1.0, z1=1.06, dur=14)
            vignette(c, 0.35)
            lower_title(c, "Bondi Beach", t, self.t_bb, self.t_15 - 0.3)
        else:
            draw_s01_memorial(c, t, self.t_15)
            kinetic(c, "15 LIVES", W / 2, 600, t, self.t_15 + 0.15, 96, SERIF, 400, OFFW, 1.0, t_out=None, tracking=6)
        grain(c, fi, 0.03)


def draw_s01_memorial(c, t, t15, bright=0.82):
    full_photo(c, photo(PH22), t, t15, t15 + 26, 1.06, 1.16, 0.5, 0.62, 0.56, 0.66, "modern", 1.0, bright)
    vignette(c, 0.55)


@scene("S02")
class S02(Scene):
    def plan(self):
        self.t_q = self.cue("q1_build", "How did this happen here")
        self.q_fly = self.we("here") + 0.05
        self.q_land = self.q_fly + 0.42
        Q["pin"][0] = self.q_land
        Q.setdefault("show", []).append((self.q_land - 0.05, 83.4))
        self.sfx(self.q_land, "SFX21_thunk", -2, "How did this happen here", name="q1 pin")
        self.tag("source", "Source: NSW Police", self.w("Police say"), self.we("Islamic State") + 0.8)
        self.t_wall = self.cue("wall", "under strain")
        self.sfx(self.t_wall, "SFX05_whoosh", -6, "under strain")
        self.t_roll = self.cue("ticker_roll", "October twenty twenty-three")
        for k in range(8):
            self.sfx(self.t_roll + k * 0.08, "SFX06_tick", -4 - k * 0.3, name="flutter")
        # visual roll starts on the trigger word; the heartbeat tick lands with the final value 0.7 s later
        self.tick(self.t_roll, "OCT 2023 · BONDI −799 DAYS", "October twenty twenty-three", flip=0.7, sound=False)
        self.sfx(self.t_roll + 0.7, "SFX24_countdown_tick", 0, "October twenty twenty-three", name="tick:-799")
        self.t15 = EV.CUES["S01.lives"]
        self.q_words = [self.w("How"), self.w("did"), self.w("this"), self.w("happen"), self.w("here")]

    def draw(self, c, t, fi):
        draw_s01_memorial(c, t, self.t15, mix(0.82, 0.55, smooth(t, self.S.start, self.t_q)))
        kinetic(c, "15 LIVES", W / 2, 600, t, self.t15 + 0.15, 96, SERIF, 400, OFFW, 1.0 - smooth(t, self.S.start, self.t_q - 0.2), tracking=6)
        question_build(c, 0, t, self.t_q, self.q_fly, self.q_land, self.q_words)
        # nine-image WALL (0.4 s each), a quiet promise of what's coming
        if t >= self.t_wall:
            tiles = [("ST04", 6.0), ("ST22", 5.0), ("PH24", None), ("MAP08", None), ("ST05", 3.0), ("ST09", 2.0),
                     ("ST12", 6.0), ("DOC02", None), ("ST13", 5.0)]
            gw, gh, gap = 560, 300, 22
            x0 = (W - (3 * gw + 2 * gap)) / 2
            y0 = (H - (3 * gh + 2 * gap)) / 2 + 20
            dim = 1 - 0.45 * smooth(t, self.t_wall + 3.8, self.t_wall + 4.6)
            rect(c, 0, 0, W, H, "#000000", 0.55 * eo(t, self.t_wall, 0.3))
            for k, (cid, ts) in enumerate(tiles):
                tk = self.t_wall + k * 0.4
                if t < tk:
                    continue
                kk = eo(t, tk, 0.25)
                x = x0 + (k % 3) * (gw + gap)
                y = y0 + (k // 3) * (gh + gap)
                c.save()
                s = mix(1.06, 1.0, kk)
                c.translate(x + gw / 2, y + gh / 2); c.scale(s, s); c.translate(-gw / 2, -gh / 2)
                layer(c, kk * dim)
                shadow(c, 0, 0, gw, gh, 0.5, 16, 8)
                wall_tile(c, cid, ts, gw, gh, t)
                c.restore(); c.restore()


def wall_tile(c, cid, ts, gw, gh, t):
    if cid == "PH24":
        draw_cover(c, photo("PH24_asio_hq_2400.jpg"), 0, 0, gw, gh, 1.0, 0.5, 0.55, gpaint("modern"))
    elif cid == "DOC02":
        img = photo("DOC02_A-PV-128_rollcall-15.png")
        draw_cover(c, img, 0, 0, gw, gh, 2.6, 0.27, 0.74, gpaint("archival", 0.6))
    elif cid == "MAP08":
        m = Flat(-140, 170, -50, 72, 0, 0, gw, gh)
        flat_map(c, m, "110m", highlight={"AUS": (AMBER, 0.85), "GBR": (AMBER, 0.85), "CAN": (AMBER, 0.85)}, borders=False)
    else:
        draw_cover(c, still_of(cid, ts), 0, 0, gw, gh, 1.0, 0.5, 0.5, gpaint("modern"))


@scene("S03")
class S03(Scene):
    def plan(self):
        self.t_th = self.cue("thread", "threads")
        self.sfx(self.t_th, "SFX05_whoosh", -3, "threads")
        self.sfx(self.t_th - 0.2, "SFX14_riser", -2, "threads", name="riser")
        self.t_78 = self.cue("ticker_78", "seventy-eight years")
        self.tick(self.t_78, "1947 · BONDI −78 YEARS", "seventy-eight years", flip=0.4, pulse_once=True)
        self.tag("ticker", "", self.t_78, 55.6)
        self.tag("corner", "ANALYSIS", self.w("Some go back"), self.w("a fire") - 0.1, "Some go back seventy-eight years")
        self.t_fire = self.cue("flame", "a fire")
        self.sfx(self.t_fire, "SFX02_fire", -2, "a fire")

    def draw(self, c, t, fi):
        if t < self.t_fire:
            prog = smooth(t, self.t_th, self.t_th + 1.8)
            km = int(14000 * prog / 100) * 100
            counter = f"{km:,} KM" if prog > 0 else None
            if prog >= 1:
                counter = "14,000 KM"
            draw_thread(c, t, None, prog, smooth(t, self.t_th + 1.4, self.t_th + 3.2), 0.0, None, counter=counter)
            vignette(c, 0.35)
        else:
            flame(c, t, self.t_fire, fi)


def flame(c, t, t0, fi, alpha=1.0, start=0.0):
    """M2: the arson flame, always the same framing."""
    video(c, "ST16", t - t0, None, 1.0, 1.0, alpha=alpha, start=start, zoom=1.15, fx=0.5, fy=0.55)


@scene("S04")
class S04(Scene):
    def plan(self):
        self.tick(self.w("October"), "OCT 2024 · BONDI −420 DAYS", "October")
        self.cue("ticker_420", "October")
        self.t_ai = self.cue("ai01", "a small kosher restaurant")
        self.tag("ai", "Dramatised reconstruction", self.t_ai, self.w("Nobody"))
        self.tag("caption", "Sydney Harbour at night (file footage)", self.S.start + 0.3, self.t_ai - 0.1)
        self.t_glow = self.cue("glow", "goes up in flames")
        self.sfx(self.t_glow, "SFX02_fire", -3, "goes up in flames")
        self.t_card1 = self.cue("card_bondi", "Nobody")
        self.sfx(self.t_card1, "SFX12_shutter", 0, "Nobody", name="drop")
        self.t_lc = self.cue("local_crime", "local crime")
        self.sfx(self.t_lc, "SFX05_whoosh", -9, "local crime", name="band slide (no siren)")
        self.t_7w = self.cue("map11", "Seven weeks later")
        self.tick(self.t_7w, "DEC 2024 · BONDI −373 DAYS", "Seven weeks later")
        self.sfx(self.t_7w + 0.05, "SFX05_whoosh", -4, "Seven weeks later")
        self.tag("source", "Source: NSW Police / Victoria Police, Oct–Dec 2024", self.t_7w, self.S.end - 0.1)
        self.t_fb = self.cue("torn", "firebombed")
        self.sfx(self.t_fb, "SFX_paper_rip", 0, "firebombed")
        self.sfx(self.t_fb + 0.05, "SFX11_boom", -10, "firebombed", name="boom soft")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_ai:
            video(c, "ST03", t - S.start, "modern", 0.9, 0.9, zoom=1.0, z1=1.05, dur=4)
        elif t < self.t_card1:
            bloom = smooth(t, self.t_glow, self.t_glow + 0.8)
            video(c, "AI01", t - self.t_ai, "modern", 0.6, 0.9 + 0.25 * bloom, zoom=1.02, z1=1.08, dur=4)
            p = skia.Paint(AntiAlias=True)
            p.setShader(skia.GradientShader.MakeRadial(skia.Point(W * 0.32, H * 0.36), W * 0.5,
                                                       [rgb("#FF8A2A", 0.38 * bloom), rgb("#FF8A2A", 0)], [0, 1]))
            p.setBlendMode(skia.BlendMode.kScreen)
            c.drawRect(skia.Rect.MakeWH(W, H), p)
            vignette(c, 0.45)
        elif t < self.t_7w:
            desk(c, fi)
            fact_card(c, "BONDI", "20 OCT 2024", ["Kosher restaurant fire, early hours", "Nobody hurt"], W / 2, H / 2 - 20,
                      t, self.t_card1)
            # band: treated as a local crime (no police tape)
            k = ease_out(lin(t, self.t_lc, self.t_lc + 0.5))
            if k > 0:
                bx = mix(-W, 0, k)
                rect(c, bx, 700, W, 72, NAVY, 0.92)
                rect(c, bx, 700, W, 3, GREY, 1)
                rect(c, bx, 769, W, 3, GREY, 1)
                draw_text(c, "POLICE TREAT IT AS A LOCAL CRIME", bx, 748, SANS, 30, 600, OFFW, 1, W, "center",
                          tracking=4, anchor="baseline")
        else:
            draw_map11(c, t, self.t_7w)
            if t >= self.t_fb:
                torn_card(c, t, self.t_fb)
        grain(c, fi, 0.025)


def fact_card(c, place, date, lines, cx, cy, t, t_in, w=760, tilt=-1.5, alpha=1.0):
    """Paper text card (used where no free photo exists)."""
    k = eo(t, t_in, 0.32)
    if k <= 0:
        return
    h = 150 + 52 * len(lines)
    c.save()
    c.translate(cx, cy)
    c.rotate(tilt + (1 - k) * 3)
    s = mix(1.15, 1.0, k)
    c.scale(s, s)
    layer(c, k * alpha)
    shadow(c, -w / 2, -h / 2, w, h, 0.6, 26, 14, 4)
    rect(c, -w / 2, -h / 2, w, h, PAPER, 1, r=4)
    rect(c, -w / 2, -h / 2, w, 6, AMBER, 1)
    draw_text(c, place, -w / 2 + 50, -h / 2 + 86, SERIF, 58, 600, INK, 1, w, anchor="baseline")
    draw_text(c, date, -w / 2, -h / 2 + 80, MONO, 26, 600, "#5B6372", 1, w - 50, "right", anchor="baseline")
    rect(c, -w / 2 + 50, -h / 2 + 112, 90, 2, INK, 0.3)
    for i, ln in enumerate(lines):
        draw_text(c, ln, -w / 2 + 50, -h / 2 + 162 + 52 * i, SERIF, 34, 400, INK, 1, w - 100, anchor="baseline")
    c.restore()
    c.restore()


def draw_map11(c, t, t0):
    m = Flat(139.5, 156.5, -41.0, -31.0)
    flat_map(c, m, "50m")
    sx, sy = m.xy(*P["Sydney"])
    mx, my = m.xy(*P["Melbourne"])
    pin(c, sx, sy, t, t0 - 0.2, "Sydney", size=24)
    prog = smooth(t, t0 + 0.15, t0 + 1.9)
    pts = curve_pts((sx, sy), (mx, my), 0.0, 60)
    glow_line(c, pts, prog, AMBER, 3.5, 1.0, 10)
    if prog >= 1:
        pin(c, mx, my, t, t0 + 1.9, "Melbourne", size=24, label_side="left")
    km = int(round(700 * prog / 10) * 10)
    lab = f"{km} KM" if prog < 1 else "≈700 KM"
    mxp, myp = (sx + mx) / 2, (sy + my) / 2
    if prog > 0:
        draw_text(c, lab, mxp + 30, myp - 30, SANS, 40, 700, AMBER, eo(t, t0 + 0.1, 0.3), 400, anchor="baseline")
        if prog >= 1:
            draw_text(c, "straight line", mxp + 32, myp + 2, SANS, 20, 500, "#B9C1CC", eo(t, t0 + 1.9, 0.3), 400,
                      anchor="baseline")
    vignette(c, 0.35)


def torn_card(c, t, t0):
    """TORN: the Melbourne card is revealed behind ripping paper."""
    k = ease_out(lin(t, t0, t0 + 0.45))
    fact_card(c, "MELBOURNE", "6 DEC 2024", ["Synagogue firebombed before dawn"], W / 2 + 330, H / 2 + 180, t, t0 - 0.01,
              w=700, tilt=1.5)
    # paper strip tearing away to the right
    if k < 1:
        c.save()
        x = W / 2 + 330 - 360 + 720 * k
        path = skia.Path()
        path.moveTo(x, H / 2 + 20)
        for i in range(12):
            path.lineTo(x + (12 if i % 2 else -6), H / 2 + 20 + i * 30)
        path.lineTo(x + 900, H / 2 + 360)
        path.lineTo(x + 900, H / 2 + 20)
        path.close()
        c.drawPath(path, paint("#DCD6CA", 1))
        c.restore()


@scene("S05")
class S05(Scene):
    def plan(self):
        self.tag("ai", "Dramatised reconstruction", self.S.start, self.w("paid"))
        self.t_paid = self.cue("paid_stamp", "paid")
        self.sfx(self.t_paid, "SFX19_stamp", 0, "paid")
        self.t_asio = self.w("according to ASIO")
        self.tag("source", "According to ASIO · assessment announced 26 Aug 2025", self.t_asio, self.S.end - 0.05)
        self.t_q = self.cue("q2_build", "other side of the world")
        self.q_fly = self.t_q + 0.62
        self.q_land = self.q_fly + 0.4
        Q["pin"][1] = self.q_land
        self.sfx(self.q_land, "SFX21_thunk", -2, "other side of the world", name="q2 pin")
        self.q_words = [self.t_q + k * 0.12 for k in range(5)]

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_paid:
            video(c, "AI02", t - S.start, "modern", 0.5, 0.9, zoom=1.0, z1=1.08, dur=5)
            vignette(c, 0.5)
        elif t < self.t_paid + 1.25:
            rect(c, 0, 0, W, H, "#000000")
            stamp_text(c, "ALLEGEDLY PAID", W / 2, H / 2, t, self.t_paid, 88, AMBER, -5)
        else:
            k = smooth(t, self.t_paid + 1.25, self.t_paid + 1.9)
            def trail(c2, o):
                sx, sy, _ = o.pt(*P["Sydney"])
                pts = curve_pts((sx, sy), (sx - 700, sy - 330), -0.25, 60)
                dashed(c2, pts, smooth(t, self.t_asio - 0.2, self.t_asio + 2.2), AMBER, 3, 0.95)
                circle(c2, sx, sy, 7, AMBER, 1)
            draw_thread(c, t, None, 0.0, 0.0, alpha=k, trail=trail)
            vignette(c, 0.5)
            question_build(c, 1, t, self.t_q, self.q_fly, self.q_land, self.q_words)
        grain(c, fi, 0.025)


@scene("S06")
class S06(Scene):
    def plan(self):
        self.tag("caption", "Sydney Harbour at dusk (file footage)", self.S.start + 0.4, self.S.end - 0.3)
        self.t_ran = self.cue("warm_sweep", "ran toward")
        self.t_q = self.cue("q3_build", "come back to him")
        self.q_fly = self.t_q + 0.55
        self.q_land = self.q_fly + 0.38
        Q["pin"][2] = self.q_land
        self.sfx(self.q_land, "SFX21_thunk", -2, "come back to him", name="q3 pin")
        self.q_words = [self.t_q + k * 0.1 for k in range(5)]

    def draw(self, c, t, fi):
        S = self.S
        st01(c, t - S.start)
        k = lin(t, self.t_ran, self.t_ran + 2.6)
        if 0 < k < 1:
            p = skia.Paint(AntiAlias=True)
            cx = mix(-400, W + 400, ease_io(k))
            p.setShader(skia.GradientShader.MakeLinear([skia.Point(cx - 500, 0), skia.Point(cx + 500, H)],
                                                       [rgb("#FFB560", 0), rgb("#FFB560", 0.22 * math.sin(k * math.pi)), rgb("#FFB560", 0)],
                                                       [0, 0.5, 1]))
            p.setBlendMode(skia.BlendMode.kScreen)
            c.drawRect(skia.Rect.MakeWH(W, H), p)
        question_build(c, 2, t, self.t_q, self.q_fly, self.q_land, self.q_words, big=54)
        grain(c, fi, 0.025)


def st01(c, tl, alpha=1.0):
    """The Bondi frame stand-in (identical in S06 and S36): Sydney Harbour at dusk."""
    video(c, "ST01", tl, "modern", 0.7, 0.92, alpha=alpha, zoom=1.0, z1=1.07, dur=12)
    vignette(c, 0.45)


@scene("S07")
class S07(Scene):
    def plan(self):
        S = self.S
        self.tag("corner", "ANALYSIS", S.start + 0.05, S.vo_end, "None of these threads")
        self.t_none = self.cue("dim", "None of these threads")
        self.t_tog = self.cue("relight", "together")
        self.sfx(self.t_tog, "SFX05_whoosh", -4, "together")
        self.t_title = self.cue("title", "follow the money")
        self.sfx(self.t_title, "SFX11_boom", -1, "follow the money", name="title slam")
        self.t_disc = S.vo_end + 3.0
        self.t_disc_end = self.t_disc + 4.0
        EV.cue(self.sid, "disclaimer", self.t_disc, "")

    def draw(self, c, t, fi):
        S = self.S
        kr = smooth(t, S.start, S.start + 3.4)
        o = cam_at(kr)
        dim = smooth(t, self.t_none, self.t_none + 0.6) * (1 - smooth(t, self.t_tog, self.t_tog + 0.6))
        ta = 1 - 0.6 * smooth(t, self.t_title, self.t_title + 0.4)
        draw_thread(c, t, o, 1.0, 1.0 if kr > 0.6 else 0.0, dim, None, alpha=ta, glow_warm=0.0)
        vignette(c, 0.4)
        if t >= self.t_title:
            k = eo(t, self.t_title, 0.28)
            s = mix(1.35, 1.0, k)
            rect(c, 0, 0, W, H, NAVY, 0.55 * k)
            c.save()
            c.translate(W / 2, H / 2 - 30)
            c.scale(s, s)
            draw_text(c, "BEFORE BONDI", -W, 40, SERIF, 150, 700, OFFW, k, 2 * W, "center", tracking=10, anchor="baseline")
            c.restore()
            rl = 520 * smooth(t, self.t_title + 0.2, self.t_title + 1.0)
            rect(c, W / 2 - rl / 2, H / 2 + 50, rl, 3, AMBER, k)
            draw_text(c, "799 days · 14,000 kilometres", 0, H / 2 + 110, SANS, 38, 500, "#D3D7DE",
                      smooth(t, self.t_title + 0.5, self.t_title + 1.2), W, "center", tracking=2, anchor="baseline")
        disclaimer_card(c, t, self.t_disc, self.t_disc_end)
