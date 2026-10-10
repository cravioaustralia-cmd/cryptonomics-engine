"""CHAPTER 2: Two Memories (S13-S17)"""
import math
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, cover_map, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Flat, flat_map, pin, P, dashed, curve_pts, arrow_head, geojson
from lib.thread import draw_thread
from lib.board import board_bg, board_card, still_of
from scenes.s_ch1 import chapter_hold

VS = "DOC02b_voting_sheet_29nov1947.jpg"
# M4 frame: the typed roll call (autographs cropped out), AFGHANISTAN / ARGENTINA / AUSTRALIA rows
M4 = dict(zoom=3.1, fx=0.27, fy=0.185)
AUS_ROW = (222, 298, 470, 332)    # image px box of the AUSTRALIA row incl. its Yes tick


def m4_frame(c, t, t_circle, alpha=1.0, scroll_from=None, t_scroll=None, rect_=(0, 0, W, H)):
    """THE ballot frame (S13, S20, S34): identical framing and circle every time."""
    img = photo(VS)
    x, y, w, h = rect_
    fy = M4["fy"]
    if scroll_from is not None and t_scroll is not None:
        fy = mix(scroll_from, M4["fy"], smooth(t, t_scroll, t_scroll + 1.4))
    p = gpaint("archival", 0.7, 1.05, alpha)
    rect(c, x, y, w, h, "#2A241B", alpha)
    # identical framing: same scale as the full frame (x0.75 inside a split panel), same centre
    k_full = max(W / img.width(), H / img.height()) * M4["zoom"] * (1.0 if w >= W - 1 else 0.75)
    z = k_full / max(w / img.width(), h / img.height())
    draw_cover(c, img, x, y, w, h, z, M4["fx"], fy, p)
    f, k = cover_map(img, x, y, w, h, z, M4["fx"], fy)
    if t_circle is not None and t >= t_circle:
        x0, y0 = f(AUS_ROW[0], AUS_ROW[1])
        x1, y1 = f(AUS_ROW[2], AUS_ROW[3])
        cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 26 * w / W, (y1 - y0) / 2 + 22 * w / W
        prog = smooth(t, t_circle, t_circle + 0.55)
        pts = []
        n = 90
        for i in range(int(n * 1.08 * prog) + 1):
            a = -2.6 + i / n * 2 * math.pi
            wob = 1 + 0.04 * math.sin(i * 0.31)
            pts.append((cx + rx * wob * math.cos(a), cy + ry * wob * math.sin(a)))
        if len(pts) > 1:
            glow_line(c, pts, 1.0, AMBER, 5 * w / W + 1, alpha, 6)
    vignette(c, 0.45)


def doc01_zoom(c, t, t0, t1, alpha=1.0):
    img = photo("DOC01_res181_title_page-01.png")
    k = smooth(t, t0, t1)
    rect(c, 0, 0, W, H, "#2A241B", alpha)
    draw_cover(c, img, 0, 0, W, H, mix(1.15, 2.6, k), 0.29, mix(0.24, 0.198, k), gpaint("archival", 0.65, 1.04, alpha))
    # highlight swipe on the title line
    f, kk = cover_map(img, 0, 0, W, H, mix(1.15, 2.6, k), 0.29, mix(0.24, 0.198, k))
    sc = img.height() / 3674.0      # coordinates measured on the 2143x3674 page
    hx0, hy0 = f(170 * sc, 698 * sc)
    hx1, hy1 = f(1060 * sc, 756 * sc)
    sw = smooth(t, t0 + 0.8, t0 + 1.5)
    if sw > 0:
        rect(c, hx0, hy0, (hx1 - hx0) * sw, hy1 - hy0, AMBER, 0.32 * alpha)
    vignette(c, 0.5)


def partition_map(c, t, t_in, alpha=1.0):
    """MAP03: both proposed states animate in together, same speed and opacity. No modern borders."""
    m = Flat(32.9, 37.0, 29.4, 33.45, 60, 0, 1080, H)
    rect(c, 0, 0, W, H, NAVY, alpha)
    flat_map(c, m, "50m", borders=False, alpha=alpha)
    k = smooth(t, t_in, t_in + 1.0)
    cols = {"jewish_state": "#8C96A5", "arab_state": "#D6BE96", "jaffa_enclave": "#D6BE96",
            "jerusalem_corpus_separatum": "#EFEDE6"}
    layer(c, alpha)
    for props, rings in geojson("partition_plan_1947.geojson"):
        col = cols[props["id"]]
        for r in rings:
            path = m.path(r)
            c.drawPath(path, paint(col, 0.92 * k))
            c.drawPath(path, paint("#3A3A3A" if props["id"] != "jerusalem_corpus_separatum" else "#5A5A5A", 0.9 * k, stroke=1.3))
    from lib.geo import lakes
    for r in lakes("50m"):
        p = m.path(r)
        if p.getBounds().intersects(skia.Rect.MakeWH(W, H)):
            c.drawPath(p, paint(SEA, 1))
    # legend (same font, size, colour for both labels)
    lx, ly = 1180, 420
    for i, (lab, col) in enumerate([("Proposed Jewish state", "#8C96A5"), ("Proposed Arab state", "#D6BE96"),
                                     ("Jerusalem (international zone)", "#EFEDE6")]):
        a = k
        rect(c, lx, ly + i * 64 - 22, 34, 34, col, a, r=3)
        draw_text(c, lab, lx + 52, ly + i * 64 + 4, SANS, 28, 600, OFFW, a, 600, anchor="baseline")
    draw_text(c, "UN Partition Plan, 29 November 1947", lx, 300, SERIF, 38, 600, OFFW, k, 700, anchor="baseline")
    draw_text(c, "General Assembly resolution 181 (II)", lx, 342, SANS, 22, 500, "#C2C8D0", k, 700, anchor="baseline")
    for name, side in (("Gaza", "left"), ("Jaffa", "left"), ("Jerusalem", "right"), ("Beersheba", "right")):
        x, y = m.xy(*P[name])
        pin(c, x, y, t, t_in + 0.8, name, r=5, size=19, label_side=side)
    c.restore()


@scene("S13")
class S13(Scene):
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "chapter_card", t0, "")
        self.sfx(t0 + 0.2, "SFX07_projector", -3, name="projector flicker", dur=12.0, fin=0.8, fout=2.0)
        self.t_nov = self.cue("ticker_1947", "November")
        self.tick(self.t_nov, "29 NOV 1947 · BONDI −78 YEARS", "November")
        self.tag("ticker", "", self.t_nov, self.w("The committee") - 0.2)
        self.tag("caption", "UN General Assembly, New York, September 1947", S.vo_start + 0.2, self.w("The new United Nations") - 0.1)
        self.t_un = self.cue("doc01", "The new United Nations")
        self.sfx(self.t_un, "SFX18_paper", 2, "The new United Nations", name="ZOOM page turn")
        self.tag("caption", "UN General Assembly resolution 181 (II), 29 Nov 1947", self.t_un + 0.2, self.w("divide") - 0.1)
        self.t_div = self.cue("map03", "divide")
        self.sfx(self.t_div, "SFX05_whoosh", -3, "divide")
        self.tag("label", "Boundaries: UN map, A/516 Annex A, 1947 (public domain)\nBase: Natural Earth",
                 self.t_div + 0.6, self.w("The committee") - 0.1)
        self.t_com = self.cue("evatt", "The committee")
        self.t_fm = self.cue("evatt_label", "foreign minister")
        self.sfx(self.t_fm, "SFX_pop", 0, "foreign minister")
        self.tag("caption", "H.V. Evatt at a press conference, Australia, 3 May 1945", self.t_com + 0.3, self.w("And the first") - 0.1)
        self.t_first = self.cue("rollcall", "And the first country")
        self.sfx(self.t_first, "SFX18_paper", 2, "And the first country", name="ZOOM")
        self.tag("source", "Source: UN General Assembly records, 29 Nov 1947", self.w("first country to vote yes"), S.end - 0.1,
                 "first country to vote yes")
        self.t_aus = self.w("Australia")
        EV.cue(self.sid, "circle_draws", self.t_aus, "Australia")
        self.sfx(self.t_aus, "SFX20_marker", 0, "Australia", name="CIRCLE")
        self.tag("caption", "UN voting sheet, 29 Nov 1947: Afghanistan No · Argentina Abstain · Australia Yes",
                 self.t_first + 0.3, S.end - 0.1)

    def draw(self, c, t, fi):
        S = self.S

        def bg(c, t):
            full_photo(c, photo("PH26_un_1947_2400.jpg"), t, S.start, S.start + 10, 1.05, 1.1, 0.5, 0.45, 0.5, 0.5,
                       "archival", 0.9, flicker(fi))
            grain(c, fi, 0.07)
        if t < S.vo_start:
            chapter_hold(c, t, S, "CHAPTER 2", "TWO MEMORIES", "BONDI −78 YEARS", bg, fi)
            return
        if t < self.t_un:
            bg(c, t)
            vignette(c, 0.55)
        elif t < self.t_div:
            doc01_zoom(c, t, self.t_un, self.t_div)
        elif t < self.t_com:
            partition_map(c, t, self.t_div)
        elif t < self.t_first:
            desk(c, fi)
            print_photo(c, photo("PH01b_evatt_press_conference_1945_2400.jpg"), W / 2 - 160, H / 2, 960, t, self.t_com,
                        tilt=-1.2, grade=gpaint("archival", 0.85), fy=0.3)
            if t >= self.t_fm:
                a = eo(t, self.t_fm, 0.25)
                rect(c, 1260, 420, 560, 150, NAVY, 0.92 * a, r=4)
                rect(c, 1260, 420, 3, 150, AMBER, a)
                draw_text(c, "H.V. Evatt", 1290, 478, SERIF, 44, 600, OFFW, a, 520, anchor="baseline")
                draw_text(c, "Australia’s Foreign Minister", 1290, 516, SANS, 23, 500, "#C9CED6", a, 520, anchor="baseline")
                draw_text(c, "Chaired the UN committee on Palestine", 1290, 550, SANS, 20, 400, GREY, a, 520, anchor="baseline")
        else:
            m4_frame(c, t, self.t_aus, scroll_from=0.5, t_scroll=self.t_first)
        grain(c, fi, 0.05)


def flicker(fi):
    return 0.92 + 0.06 * math.sin(fi * 1.7) * math.sin(fi * 0.53)


@scene("S14")
class S14(Scene):
    def plan(self):
        S = self.S
        self.t_ai = S.vo_start + 0.8
        self.t_ch = self.cue("arrow", "charged")
        self.tag("ai", "Dramatised reconstruction", self.t_ai, self.t_ch - 0.1)
        self.sfx(self.t_ch, "SFX16_hooves", -2, "charged", dur=3.0, fin=0.3, fout=1.0)
        self.t_bs = self.cue("pin", "Beersheba")
        self.sfx(self.t_bs, "SFX24_countdown_tick", 0, "Beersheba", name="tick:-108")
        self.tick(self.t_bs, "1917 · BONDI −108 YEARS", "Beersheba", sound=False)
        self.sfx(self.t_bs + 0.15, "SFX21_thunk", -2, "Beersheba", name="pin drops")
        self.tag("ticker", "", self.t_bs, self.w("Once on horseback") - 0.2)
        self.t_jer = self.w("road to Jerusalem")
        self.tag("caption", "Charge at Beersheba, 31 Oct 1917 (date: AWM)", self.t_bs + 0.2, self.w("So Australians") - 0.1)
        self.t_so = self.cue("lighthorse", "So Australians")
        self.tag("caption", "Australian Light Horse in the desert, 1918 (AWM film)", self.t_so + 0.2, self.w("Once on") - 0.1)
        self.t_once = self.cue("split", "Once on horseback")
        self.sfx(self.t_once, "SFX05_whoosh", -5, "Once on horseback", name="SPLIT")
        self.sfx(self.t_once + 0.3, "SFX06_tick", -4, name="SPLIT lock")
        self.t_hb = self.cue("left_brightens", "horseback")
        self.t_bal = self.cue("right_brightens", "ballot")
        self.sfx(self.t_bal, "SFX19_stamp", -9, "ballot")
        self.tag("caption", "Light Horse, Beersheba, 1917 (AWM A02788)  ·  UN voting sheet, 29 Nov 1947",
                 self.t_once + 0.3, S.end - 0.1)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_ai:
            video(c, "ST06", t - S.start, "warm", 0.6, 0.95, zoom=1.0, z1=1.04, dur=3)
        elif t < self.t_ch:
            video(c, "AI03", t - self.t_ai, "warm", 0.5, 1.0, zoom=1.0, z1=1.06, dur=3)
            vignette(c, 0.45)
        elif t < self.t_so:
            beersheba_map(c, t, self.t_ch, self.t_bs, self.t_jer)
        elif t < self.t_once:
            video(c, "FT02b", t - self.t_so, "archival", 0.85, 1.0, zoom=1.04, z1=1.1, dur=3)
            grain(c, fi, 0.07)
            vignette(c, 0.5)
        else:
            k = smooth(t, self.t_once, self.t_once + 0.35)
            hb = smooth(t, self.t_hb, self.t_hb + 0.4)
            bl = smooth(t, self.t_bal, self.t_bal + 0.4)
            rect(c, 0, 0, W, H, "#000000")
            panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH02_beersheba_light_horse.jpg"), x, y, w, h, 1.15, 0.55, 0.45,
                                                      gpaint("archival", 0.9, mix(0.6, 1.0, hb))), 0, 0, W / 2 - 2, H, k)
            panel(c, lambda c, x, y, w, h: m4_frame(c, t, self.t_bal, 1.0, rect_=(x, y, w, h)) or None, W / 2 + 2, 0, W / 2 - 2, H, k)
            if bl < 1:
                rect(c, W / 2 + 2, 0, W / 2, H, "#000000", 0.4 * (1 - bl) * k)
            seam(c, W / 2, 0, H, k)
            kinetic(c, "ON HORSEBACK · 1917", W / 4, 150, t, self.t_hb, 30, SANS, 700, OFFW, tracking=4)
            kinetic(c, "AT A BALLOT · 1947", 3 * W / 4, 150, t, self.t_bal, 30, SANS, 700, OFFW, tracking=4)
            grain(c, fi, 0.06)


def beersheba_map(c, t, t_ch, t_bs, t_jer):
    """MAP02: Beersheba 1917 locator + charge arrow + line to Jerusalem (no modern borders)."""
    m = Flat(33.4, 36.4, 30.55, 32.45)
    flat_map(c, m, "50m", borders=False)
    bx, by = m.xy(*P["Beersheba"])
    # charge from the south-east into Beersheba
    sx, sy = m.xy(31.13, 35.05)
    pts = curve_pts((sx, sy), (bx + 8, by + 6), -0.25, 50)
    k = smooth(t, t_ch, t_ch + 1.2)
    glow_line(c, pts, k, AMBER, 7, 1.0, 10)
    if k > 0.95:
        arrow_head(c, pts, AMBER, 1.0, 30)
    pin(c, bx, by, t, t_bs, "Beersheba", size=28, sub="31 Oct 1917", label_side="left")
    gx, gy = m.xy(*P["Gaza"])
    pin(c, gx, gy, t, t_bs + 0.3, "Gaza", size=22, r=5, label_side="left", color="#9AA6B8")
    jx, jy = m.xy(*P["Jerusalem"])
    if t >= t_jer:
        dashed(c, curve_pts((bx, by), (jx, jy), -0.1, 40), smooth(t, t_jer, t_jer + 1.2), AMBER, 3, 0.9)
        pin(c, jx, jy, t, t_jer + 1.2, "Jerusalem", size=24)
    draw_text(c, "Southern Palestine, 1917", 80, 110, SERIF, 40, 600, OFFW, 1, 900, anchor="baseline")
    draw_text(c, "Base: Natural Earth", 80, 146, SANS, 18, 500, GREY, 1, 600, anchor="baseline")
    vignette(c, 0.4)


@scene("S15")
class S15(Scene):
    """QUIET: the same event remembered in two opposite ways. Equal size, time, motion, label design."""
    def plan(self):
        S = self.S
        self.t_res = self.cue("left_label", "rescue")
        self.t_nak = self.cue("right_label", "Nakba")
        self.t_same = self.cue("seam_glows", "The same event")
        self.t_opp = self.cue("two_memories_pin", "opposite ways")
        self.sfx(self.t_opp + 0.45, "SFX21_thunk", -8, "opposite ways", name="TWO MEMORIES pins (soft)")
        self.tag("caption", "Tel Aviv, 14 May 1948 (GPO)   ·   Palestinian refugees, 30 Oct 1948 (GPO)", S.start + 0.6, self.t_opp)
        self.tag("source", "Source: UN Conciliation Commission for Palestine estimate, 1951", self.w("more than seven hundred thousand"),
                 self.w("The same event") - 0.1, "more than seven hundred thousand")

    def draw(self, c, t, fi):
        S = self.S
        k = smooth(t, S.start, S.start + 0.8)
        rect(c, 0, 0, W, H, "#000000")
        z = mix(1.04, 1.12, smooth(t, S.start, S.end))   # identical slow PAN on both halves
        out = smooth(t, self.t_opp, self.t_opp + 1.2)
        for side, img, fx, fy in ((0, "PH03_israel_1948_celebration_2400.jpg", 0.42, 0.5), (1, "PH04_palestinian_refugees_1948_2400.jpg", 0.5, 0.45)):
            x = 0 if side == 0 else W / 2 + 2
            panel(c, lambda c, xx, yy, ww, hh, img=img, fx=fx, fy=fy: draw_cover(c, photo(img), xx, yy, ww, hh, z, fx, fy,
                                                                                 gpaint("archival", 0.85, 0.95)),
                  x, 0, W / 2 - 2, H, k * (1 - 0.55 * out))
        seam(c, W / 2, 0, H, k, glow=smooth(t, self.t_same, self.t_same + 0.6))
        for side, txt, tt in ((0, "1948 — INDEPENDENCE", self.t_res), (1, "1948 — THE NAKBA", self.t_nak)):
            cx = W / 4 if side == 0 else 3 * W / 4
            a = eo(t, tt, 0.6)
            tw = text_w(txt, SANS, 30, 700, 4)
            rect(c, cx - tw / 2 - 22, 116, tw + 44, 58, NAVY, 0.82 * a, r=3)
            draw_text(c, txt, cx - 400, 155, SANS, 30, 700, OFFW, a, 800, "center", tracking=4, anchor="baseline")
        if t >= self.t_opp:
            a = eo(t, self.t_opp, 0.5)
            s = mix(1.2, 1.0, ease_out(lin(t, self.t_opp, self.t_opp + 0.45)))
            c.save(); c.translate(W / 2, H / 2); c.scale(s, s)
            rect(c, -300, -70, 600, 140, PAPER, a, r=3)
            draw_text(c, "TWO MEMORIES", -300, 22, SERIF, 64, 600, INK, a, 600, "center", tracking=3, anchor="baseline")
            circle(c, 0, -66, 11, AMBER, a)
            c.restore()
        grain(c, fi, 0.05)
        vignette(c, 0.4)


@scene("S16")
class S16(Scene):
    def plan(self):
        S = self.S
        self.tag("ai", "Dramatised reconstruction", S.start, self.w("Melbourne became"))
        self.t_sail = self.cue("flow1", "sailed")
        self.sfx(self.t_sail, "SFX05_whoosh", -5, "sailed")
        self.t_mel = self.cue("melbourne", "Melbourne became")
        self.t_sw = self.cue("flow2", "south-west")
        self.sfx(self.t_sw, "SFX05_whoosh", -5, "south-west")
        self.tag("source", "Source: Jewish Holocaust Centre, Melbourne", self.w("largest communities of Holocaust survivors"),
                 self.w("Palestinian") - 0.1, "largest communities of Holocaust survivors")
        self.tag("caption", "British migrants aboard the Georgic, 1949  ·  Migrants arrive in Sydney, 1948", self.t_mel + 0.3,
                 self.w("Today") - 0.1)
        self.t_today = self.cue("numbers", "Today")
        self.t_n1 = self.cue("left_number", "one hundred thousand")
        self.t_n2 = self.cue("right_number", "eight hundred thousand")
        for tt, tr in ((self.t_n1, "one hundred thousand"), (self.t_n2, "eight hundred thousand")):
            for k in range(8):
                self.sfx(tt + k * 0.13, "SFX06_tick", -6, tr if k == 0 else "", name="number roll")
        self.tag("source", "Source: ABS Census 2021 (religious affiliation)", self.t_n1, S.end - 0.1, "one hundred thousand")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_mel:
            video(c, "AI05", t - S.start, "warm", 0.4, 0.95, zoom=1.0, z1=1.06, dur=3)
            vignette(c, 0.45)
            flows_inset(c, t, self.t_sail, None, 1.0)
        elif t < self.t_today:
            rect(c, 0, 0, W, H, "#000000")
            k = smooth(t, self.t_mel, self.t_mel + 0.4)
            ml = 1 - 0.35 * smooth(t, self.w("Palestinian"), self.w("Palestinian") + 0.5)
            sy = mix(0.65, 1.0, smooth(t, self.w("Palestinian"), self.w("Palestinian") + 0.5))
            panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH05_station_pier_migrants.jpg"), x, y, w, h,
                                                      mix(1.02, 1.08, smooth(t, self.t_mel, self.t_today)), 0.5, 0.45,
                                                      gpaint("archival", 0.85, ml)), 0, 0, W / 2 - 2, H, k)
            panel(c, lambda c, x, y, w, h: draw_cover(c, photo("PH06c_maltese_migrants_sydney_1948.jpg"), x, y, w, h,
                                                      mix(1.02, 1.08, smooth(t, self.t_mel, self.t_today)), 0.5, 0.45,
                                                      gpaint("archival", 0.85, sy)), W / 2 + 2, 0, W / 2 - 2, H, k)
            seam(c, W / 2, 0, H, k)
            for cx, lab in ((W / 4, "MELBOURNE"), (3 * W / 4, "SYDNEY")):
                tw = text_w(lab, SANS, 30, 700, 5)
                rect(c, cx - tw / 2 - 22, 800, tw + 44, 56, NAVY, 0.85 * k, r=3)
                draw_text(c, lab, cx - 300, 838, SANS, 30, 700, OFFW, k, 600, "center", tracking=5, anchor="baseline")
            flows_inset(c, t, self.t_sail, self.t_sw, 1 - smooth(t, self.t_today - 0.4, self.t_today))
            grain(c, fi, 0.05)
        else:
            desk(c, fi)
            seam(c, W / 2, 360, 880, 1.0)
            for side, tt, val, lab, sub in ((0, self.t_n1, 99956, "Jewish Australians", "Judaism · about 100,000"),
                                            (1, self.t_n2, 813392, "Muslim Australians", "Islam · more than 800,000")):
                cx = W / 4 + 20 if side == 0 else 3 * W / 4 - 20
                k = smooth(t, tt, tt + 1.1)   # identical roll speed
                v = int(val * k)
                a = eo(t, tt - 0.4, 0.3)
                draw_text(c, f"{v:,}", cx - 400, 560, SANS, 120, 700, AMBER, a, 800, "center", anchor="baseline")
                draw_text(c, lab, cx - 400, 640, SERIF, 46, 600, OFFW, a, 800, "center", anchor="baseline")
                draw_text(c, sub, cx - 400, 690, SANS, 24, 500, "#BFC5CE", a, 800, "center", anchor="baseline")
            draw_text(c, "ABS CENSUS 2021", 0, 300, SANS, 22, 700, GREY, eo(t, self.t_today, 0.3), W, "center", tracking=6,
                      anchor="baseline")


def flows_inset(c, t, t1, t2, alpha):
    """MAP04 inset: two identical flow lines, Europe -> Melbourne and the Middle East -> Sydney (schematic)."""
    if alpha <= 0.003 or t < t1 - 0.3:
        return
    x, y, w, h = W / 2 - 330, 50, 660, 330
    a = alpha * eo(t, t1 - 0.3, 0.3)
    layer(c, a)
    shadow(c, x, y, w, h, 0.5, 18, 8)
    m = Flat(-12, 158, -46, 58, x, y, w, h)
    flat_map(c, m, "110m", borders=False)
    rect(c, x, y, w, h, "#3A4E6C", 1, stroke=1.2)
    for tt, a_, b_ in ((t1, P["Rome"], P["Melbourne"]), (t2, P["Beirut"], P["Sydney"])):
        if tt is None or t < tt:
            continue
        p0, p1 = m.xy(*a_), m.xy(*b_)
        pts = curve_pts(p0, p1, 0.18, 60)
        glow_line(c, pts, smooth(t, tt, tt + 1.4), AMBER, 2.5, 1.0, 5)
        circle(c, p1[0], p1[1], 5, AMBER, smooth(t, tt + 1.3, tt + 1.5))
    draw_text(c, "Post-war migration (schematic) · Base: Natural Earth", x + 14, y + h - 14, SANS, 15, 500, "#AEB6C2", 1, w,
              anchor="baseline")
    c.restore()


@scene("S17")
class S17(Scene):
    def plan(self):
        S = self.S
        self.tag("corner", "ANALYSIS", S.start + 0.05, S.vo_end, "So when war comes to the Middle East")
        self.t_node = S.vo_start + 0.15
        self.t_ds = self.cue("thread_pulse", "doesn't stay there")
        self.sfx(self.t_ds, "SFX05_whoosh", -4, "doesn't stay there")
        self.t_arr = self.w("It arrives")
        self.t_fam = self.cue("windows_glow", "as family")
        self.tag("caption", "Sydney at night (file footage)", self.t_arr + 0.3, S.end - 0.1)
        self.t_can = self.cue("ticker_roll", "Canberra")
        for k in range(8):
            self.sfx(self.t_can + k * 0.08, "SFX06_tick", -5, "Canberra" if k == 0 else "", name="roll flutter")
        self.tick(self.t_can, "OCT 2023 · BONDI −799 DAYS", "Canberra", flip=0.7, sound=False)
        self.sfx(self.t_can + 0.7, "SFX24_countdown_tick", 0, "Canberra", name="tick:-799")
        self.tag("ticker", "", self.t_can - 0.2, S.end + 4.0)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_arr:
            def pulse(c2, o):
                k = lin(t, self.t_ds, self.t_ds + 1.0)
                if 0 < k < 1:
                    from lib.geo import curve_pts as cp
                    bx, by, _ = o.pt(*P["Bondi"]); gx, gy, _ = o.pt(*P["Gaza"])
                    pts = cp((bx, by), (gx, gy), -0.22, 120)[::-1]
                    px, py = path_point(pts, k)
                    circle(c2, px, py, 22, AMBER, 0.5, blur=10)
                    circle(c2, px, py, 8, "#FFE2B0", 1)
            draw_thread(c, t, None, 1.0, 0.0, 0.0, {"THE FIRE": -10, "TWO MEMORIES": self.t_node}, trail=pulse)
            vignette(c, 0.4)
        else:
            g = smooth(t, self.t_fam, self.t_fam + 1.0)
            video(c, "ST03", t - self.t_arr + 6.0, "warm", 0.9 + 0.1 * g, 0.85 + 0.2 * g, zoom=1.12, z1=1.2, dur=6, fx=0.62, fy=0.45)
            if g > 0:
                p = skia.Paint(AntiAlias=True)
                p.setShader(skia.GradientShader.MakeRadial(skia.Point(W * 0.6, H * 0.45), W * 0.6,
                                                           [rgb("#FFB560", 0.16 * g), rgb("#FFB560", 0)], [0, 1]))
                p.setBlendMode(skia.BlendMode.kScreen)
                c.drawRect(skia.Rect.MakeWH(W, H), p)
            vignette(c, 0.5)
        grain(c, fi, 0.02)
