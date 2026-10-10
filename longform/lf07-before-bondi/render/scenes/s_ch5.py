"""CHAPTER 5: A Country Under Strain (S29-S35)"""
import math, random
import skia
from lib.core import *
from lib.scene import scene, Scene
from lib import events as EV
from lib.media import photo, draw_cover, gpaint, grain, vignette
from lib.comps import *
from lib.geo import Flat, flat_map, pin, P, dashed, curve_pts, arrow_head
from lib.thread import draw_thread
from lib.board import board_bg, still_of
from scenes.s_ch1 import chapter_hold
from scenes.s_ch2 import m4_frame
from scenes.s_cold import flame

PH18 = "PH18_oct7_kibbutz_damage_2400.jpg"
PH19 = "PH19_gaza_destruction_2400.jpg"


def border_map(c, t, t_in, t_cross, alpha=1.0):
    """MAP07 wide: Gaza and southern Israel; an arrow crosses the boundary (no casualty imagery)."""
    m = Flat(33.9, 35.3, 30.95, 31.85)
    flat_map(c, m, "50m", highlight={"PSX": ("#33496B", 1.0)}, alpha=alpha)
    if t_cross is not None and t >= t_cross:
        p0, p1 = m.xy(31.45, 34.40), m.xy(31.43, 34.62)
        pts = curve_pts(p0, p1, -0.1, 30)
        glow_line(c, pts, smooth(t, t_cross, t_cross + 0.8), OFFW, 5, 0.9, 6)
        if t >= t_cross + 0.75:
            arrow_head(c, pts, OFFW, 0.9, 24)
    for name, side in (("Kfar Aza", "right"), ("Be'eri", "right")):
        x, y = m.xy(*P[name])
        pin(c, x, y, t, t_in + 0.4, name, r=5, size=19, label_side=side, color="#B8C2D2")
    gx, gy = m.xy(31.40, 34.30)
    draw_text(c, "GAZA", gx - 260, gy + 10, SANS, 24, 700, "#AEB8C8", alpha, 240, "right", tracking=5, anchor="baseline")
    draw_text(c, "SOUTHERN ISRAEL", m.xy(31.2, 34.75)[0], m.xy(31.2, 34.75)[1], SANS, 24, 700, "#AEB8C8", alpha, 400,
              tracking=5, anchor="baseline")
    vignette(c, 0.45)


@scene("S29")
class S29(Scene):
    def plan(self):
        S = self.S
        t0, t1 = S.chapter_hold
        EV.cue(self.sid, "chapter_card", t0, "")
        self.tick(t0 + 0.2, "OCT 2023 · BONDI −799 DAYS", "", sound=False, flip=0.01)
        self.tag("ticker", "", t0 + 0.2, S.vo_start + 1.5)
        self.t_7 = self.cue("date_types", "seventh of October")
        self.sfx(self.t_7, "SFX04_typewriter", 0, "seventh of October", dur=1.4, fout=0.2)
        self.t_cr = self.cue("arrow", "crossed")
        self.t_1200 = self.cue("n1200", "twelve hundred")
        self.t_250 = self.cue("n250", "two hundred and fifty")
        self.tag("source", "Source: Israeli authorities, via UN OCHA", self.t_1200, S.end - 0.05, "twelve hundred")
        self.t_ph = self.w("Around twelve hundred")
        self.tag("caption", "Damaged house, Gaza envelope, Israel, 11 Oct 2023 (GPO)", self.t_ph + 0.3, S.end + 3.0)

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            t0, t1 = S.chapter_hold
            def bg(c, t):
                full_photo(c, photo(PH18), t, t0, t1 + 20, 1.05, 1.08, 0.5, 0.5, grade="modern", bright=0.45)
            bg(c, t)
            rect(c, 0, 0, W, H, "#000000", 0.55)
            chapter_card(c, "CHAPTER 5", "A COUNTRY UNDER STRAIN", "BONDI −799 DAYS", t, t0 + 0.4, t1 - 0.5)
            return
        if t < self.t_ph:
            border_map(c, t, S.vo_start, self.t_cr)
            n = int(len("7 OCTOBER 2023") * lin(t, self.t_7, self.t_7 + 1.2))
            if n:
                draw_text(c, "7 OCTOBER 2023"[:n], 0, 200, MONO, 64, 600, OFFW, 1, W, "center", tracking=4, anchor="baseline")
        else:
            full_photo(c, photo(PH18), t, self.t_ph, self.t_ph + 30, 1.04, 1.1, 0.5, 0.5, grade="modern", bright=0.8)
            vignette(c, 0.5)
            for tt, big, small, y in ((self.t_1200, "≈1,200 killed", "most of them civilians", 380),
                                      (self.t_250, "≈250 taken hostage", "", 560)):
                a = smooth(t, tt, tt + 0.6)       # fade only (no rolls)
                if a > 0:
                    rect(c, 110, y - 82, 760, 150, NAVY, 0.82 * a, r=4)
                    rect(c, 110, y - 82, 3, 150, AMBER, a)
                    draw_text(c, big, 150, y, SANS, 60, 700, OFFW, a, 700, anchor="baseline")
                    if small:
                        draw_text(c, small, 150, y + 44, SANS, 26, 500, "#C3C9D1", a, 700, anchor="baseline")
        grain(c, fi, 0.02)


@scene("S30")
class S30(Scene):
    def plan(self):
        S = self.S
        self.tag("source", "Source: US Holocaust Memorial Museum statement, Oct 2023", self.w("deadliest day"),
                 self.w("Israel's military") - 0.1, "deadliest day")
        self.t_mil = self.cue("ph19", "Israel's military")
        self.tag("caption", "Destroyed buildings, Gaza, Feb 2025", self.t_mil + 0.3, self.w("Gaza's Health Ministry") - 0.1)
        self.t_2y = self.cue("band", "two years")
        self.sfx(self.t_2y, "SFX05_whoosh", -10, "two years")
        self.t_hm = self.cue("attribution", "Health Ministry")
        self.sfx(self.t_hm, "SFX04_typewriter", -2, "Health Ministry", dur=1.6, fout=0.2)
        self.t_dis = self.cue("grey_tag", "disputed")
        self.t_fam = self.cue("ipc", "famine")
        self.sfx(self.t_fam, "SFX18_paper", 2, "famine")
        self.tag("source", "Source: IPC, Aug 2025", self.t_fam, S.end - 0.05, "famine")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_mil:
            full_photo(c, photo(PH18), t, S.start, S.start + 1, 1.1, 1.1, 0.5, 0.5, grade="modern", bright=0.7)  # still
            vignette(c, 0.5)
        elif t < self.t_hm:
            full_photo(c, photo(PH19), t, self.t_mil, self.t_mil + 12, 1.04, 1.1, 0.55, 0.5, grade="modern", bright=0.8)
            vignette(c, 0.45)
            k = smooth(t, self.t_2y, self.t_2y + 1.0)
            if k > 0:
                y = 900
                rect(c, 360, y - 4, 1200 * k, 8, AMBER, 0.95)
                draw_text(c, "OCT 2023", 260, y + 50, MONO, 26, 600, OFFW, 1, 200, "center", anchor="baseline")
                draw_text(c, "OCT 2025", 1460, y + 50, MONO, 26, 600, OFFW, k, 200, "center", anchor="baseline")
        else:
            desk(c, fi)
            k_ipc = smooth(t, self.t_fam - 0.2, self.t_fam + 0.3)
            # DOC12 casualty card (full attribution and as-of date)
            a = eo(t, self.t_hm, 0.3) * (1 - 0.45 * k_ipc)
            x, y, w, h = mix(W / 2 - 560, 90, k_ipc), 230, 1120, 470
            layer(c, a)
            shadow(c, x, y, w, h, 0.6, 26, 14, 4)
            rect(c, x, y, w, h, PAPER, 1, r=4)
            rect(c, x, y, w, 6, AMBER, 1)
            smallcaps(c, "Gaza casualty figures · reported", x + 54, y + 62, 20, "#5B6372", 1, 600)
            draw_text(c, "74,032", x + 54, y + 190, SANS, 110, 700, INK, 1, 800, anchor="baseline")
            draw_text(c, "Palestinians reported killed", x + 54, y + 240, SERIF, 34, 400, INK, 1, 800, anchor="baseline")
            l1 = "Gaza Health Ministry (Hamas-run), via UN OCHA ·"
            l2a, l2b = "not independently verified by the UN", " · as of 30 Sep 2026"
            full = l1 + l2a + l2b
            n = int(len(full) * lin(t, self.t_hm, self.t_hm + 1.8))
            xs = x + 54
            w1 = text_w(l2a, SANS, 23, 600)
            if t >= self.t_dis:
                ga = eo(t, self.t_dis, 0.3)
                rect(c, xs - 6, y + 362, w1 + 12, 38, GREY, ga, r=3)
            draw_text(c, l1[:n], xs, y + 340, SANS, 23, 600, "#2A3242", 1, 2000, anchor="baseline")
            if n > len(l1):
                draw_text(c, (l2a + l2b)[: n - len(l1)], xs, y + 388, SANS, 23, 600, "#2A3242", 1, 2000, anchor="baseline")
            draw_text(c, "Figure: 74,032 (OCHA snapshot, 30 Sep 2026)", x + 54, y + 432, SANS, 19, 500, "#5B6372", 1, w - 100,
                      anchor="baseline")
            c.restore()
            if k_ipc > 0:
                body = ("The Famine Review Committee (FRC) has determined that Famine (IPC Phase 5) is currently occurring in "
                        "Gaza Governorate.")
                evidence_card(c, 1000, 300, 830, t, self.t_fam, "IPC Famine Review Committee", "22 Aug 2025",
                              "Famine confirmed in Gaza Governorate", body, "IPC, Aug 2025",
                              highlights=[("Famine (IPC Phase 5) is currently occurring", self.t_fam + 0.3, 0.8)], body_size=30)
        grain(c, fi, 0.02)


@scene("S31")
class S31(Scene):
    def plan(self):
        S = self.S
        self.t_oh = self.cue("ticker_797", "Opera House")
        self.tick(self.t_oh, "9 OCT 2023 · BONDI −797 DAYS", "Opera House")
        self.tag("ticker", "", self.t_oh, self.w("That night") + 0.5)
        self.tag("caption", "Sydney Opera House (file footage)", S.start + 0.3, self.w("police review") - 0.2)
        self.t_rally = self.cue("crowd", "rally gathered")
        self.sfx(self.t_rally, "SFX08_crowd", -2, "rally gathered", dur=6.0, fin=2.0, fout=2.0)
        self.t_pr = self.cue("doc17", "police review")
        self.sfx(self.t_pr, "SFX18_paper", 2, "police review")
        self.tag("source", "Source: NSW Police statement, Feb 2024", self.t_pr, S.end - 0.05, "police review")

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_pr:
            video(c, "ST04", t - S.start, "modern", 0.7, 0.8, zoom=1.0, z1=1.08, dur=14)
            vignette(c, 0.5)
            kinetic(c, "9 OCTOBER 2023", W / 2, 800, t, self.w("Opera House") + 0.2, 34, SANS, 700, AMBER, tracking=6)
            kinetic(c, "The Opera House sails were lit in Israel’s colours", W / 2, 860, t, self.w("sails"), 38, SERIF, 600, OFFW)
            kinetic(c, "A pro-Palestinian rally gathered below", W / 2, 920, t, self.t_rally, 38, SERIF, 600, OFFW)
        else:
            desk(c, fi)
            body = ("A forensic review of the video found the chant was “where’s the Jews”, not “gas the Jews” as widely "
                    "reported. The review also found other offensive and antisemitic phrases.")
            evidence_card(c, (W - 1150) / 2, 240, 1150, t, self.t_pr, "NSW Police Force · Statement", "2 Feb 2024",
                          "Opera House protest: video analysis", body, "NSW Police statement, Feb 2024 (as reported by ABC News)",
                          highlights=[("“where’s the Jews”, not “gas the Jews”", self.w("disputed"), 0.8)], body_size=33)
        grain(c, fi, 0.02)


def phones(c, t, t0, n=7):
    """Built phone-notification graphic (FREE SWAP for AI09): faceless phones light up one by one."""
    desk(c, 0, "#070D17")
    for i in range(n):
        x = 220 + i * 230
        y = 300 + (i % 2) * 70
        tt = t0 + i * 0.22
        a = eo(t, tt, 0.25)
        rect(c, x, y, 170, 330, "#0B1220", 1, r=22)
        rect(c, x, y, 170, 330, "#2C3B55", 1, r=22, stroke=3)
        if a > 0:
            rect(c, x + 10, y + 16, 150, 298, "#22324A", a, r=14)
            rect(c, x + 18, y + 40, 134, 56, "#E8E4DA", a, r=8)
            rect(c, x + 28, y + 54, 70, 8, "#7A8090", a, r=3)
            rect(c, x + 28, y + 72, 100, 8, "#A0A6B2", a, r=3)
            circle(c, x + 85, y + 200, 50, AMBER, 0.12 * a, blur=20)


def names_list(c, t, t_in, t_stamp, alpha=1.0, rect_=(360, 160, 1200, 760)):
    """Recreated, blurred list of names (no real names shown) with a PUBLISHED stamp."""
    x, y, w, h = rect_
    a = alpha * eo(t, t_in, 0.3)
    if a <= 0:
        return
    layer(c, a)
    shadow(c, x, y, w, h, 0.5, 20, 10, 4)
    rect(c, x, y, w, h, "#EFEBE3", 1, r=4)
    rng = random.Random(4)
    for i in range(14):
        yy = y + 60 + i * (h - 100) / 14
        for k in range(3):
            ww = rng.uniform(0.18, 0.28) * w
            rect(c, x + 60 + k * w * 0.31, yy, ww, 16, "#8A8F99", 0.85, r=8, blur=3.5)
    c.restore()
    if t_stamp is not None:
        stamp_text(c, "PUBLISHED", x + w * 0.62, y + h * 0.45, t, t_stamp, 70 * w / 1200, "#B4552E", -8)


@scene("S32")
class S32(Scene):
    def plan(self):
        S = self.S
        self.t_ph = self.cue("phones", "phones")
        for k in range(4):
            self.sfx(self.t_ph + k * 0.22, "SFX17_ping", -6 - 2 * (k % 2), "phones" if k == 0 else "", name="ping cascade")
        self.t_pd = self.w("The private details")
        self.tag("label", "Recreation", self.t_pd, self.w("Parliament made") - 0.1)
        self.t_pub = self.cue("published", "published online")
        self.sfx(self.t_pub, "SFX19_stamp", -2, "published online")
        self.t_parl = self.cue("doc08", "Parliament made")
        self.sfx(self.t_parl, "SFX18_paper", 2, "Parliament made")
        self.t_abc = self.w("An ABC presenter")
        self.tag("ai", "Dramatised reconstruction", self.t_abc, self.w("unlawfully") - 0.6)
        self.t_off = self.cue("light_off", "taken off air")
        self.sfx(self.t_off + 0.2, "SFX06_tick", 2, "taken off air", name="studio light click")
        self.t_court = self.w("Federal Court")
        self.t_uns = self.cue("doc07", "unlawfully sacked")
        self.sfx(self.t_uns, "SFX15_gavel", -10, "unlawfully sacked")
        self.tag("source", "Source: Lattouf v ABC (No 2) [2025] FCA 669", self.t_uns - 0.6, self.w("Two cases") - 0.1)
        self.t_two = self.cue("split", "Two cases")
        self.t_opp = self.cue("split_locks", "Opposite sides")
        self.sfx(self.t_opp, "SFX05_whoosh", -4, "Opposite sides")
        self.tag("label", "Recreation (left)", self.t_two, S.end - 0.05)

    def draw(self, c, t, fi):
        S = self.S
        doc07 = lambda c, x, y, w, t: evidence_card(
            c, x, y, w, t, self.t_uns - 0.6, "Federal Court of Australia", "25 Jun 2025", "Lattouf v ABC (No 2) [2025] FCA 669",
            "The ABC contravened s 772(1) of the Fair Work Act by terminating Antoinette Lattouf’s employment for reasons "
            "including that she held a political opinion opposing the Israeli military campaign in Gaza. Compensation: $70,000.",
            "[2025] FCA 669, orders", highlights=[("contravened s 772(1) of the Fair Work Act", self.t_uns, 0.6)],
            body_size=28 if w > 900 else 22, title_size=34 if w > 900 else 28)
        if t < self.t_pd:
            phones(c, t, self.t_ph)
        elif t < self.t_parl:
            desk(c, fi)
            names_list(c, t, self.t_pd, self.t_pub)
        elif t < self.t_abc:
            desk(c, fi)
            body = ("A person commits an offence if the person uses a carriage service to make available, publish or "
                    "otherwise distribute personal data of one or more individuals in a way that reasonable persons would "
                    "regard as menacing or harassing. Penalty: imprisonment for 6 years.")
            evidence_card(c, (W - 1150) / 2, 220, 1150, t, self.t_parl, "Criminal Code s 474.17C · Commonwealth", "Dec 2024",
                          "Doxxing made a crime", body, "Privacy and Other Legislation Amendment Act 2024, Sch 3",
                          highlights=[("publish", self.t_parl + 0.6, 0.3)], body_size=31)
        elif t < self.t_uns - 0.6:
            off = smooth(t, self.t_off + 0.2, self.t_off + 0.35)
            video(c, "AI12", t - self.t_abc, "modern", 0.6, mix(0.9, 0.18, off), zoom=1.0, z1=1.06, dur=5)
            vignette(c, 0.5)
        elif t < self.t_two:
            desk(c, fi)
            doc07(c, (W - 1150) / 2, 220, 1150, t)
        else:
            desk(c, fi)
            k = smooth(t, self.t_two, self.t_two + 0.5)
            names_list(c, t, -10, -10, 1.0, rect_=(mix(360, 90, k), 240, mix(1200, 800, k), mix(760, 520, k)))
            if k >= 1:
                doc07(c, 1030, 240, 800, t)
            seam(c, W / 2, 180, 900, smooth(t, self.t_opp, self.t_opp + 0.3))
        grain(c, fi, 0.02)


def chart(c, x, y, w, h, title, bars, src, t, t_in, ymax, t_note=None):
    """One incident chart (same design both sides): bars rise together over 1.2 s."""
    a = eo(t, t_in - 0.3, 0.3)
    layer(c, a)
    rect(c, x, y, w, h, NAVY, 0.92, r=4)
    rect(c, x, y, w, h, "#3A4E6C", 1, r=4, stroke=1.2)
    draw_text(c, title, x + 40, y + 56, SERIF, 32, 600, OFFW, 1, w - 80, anchor="baseline")
    base = y + h - 150
    bw = (w - 80) / len(bars) - 30
    k = smooth(t, t_in, t_in + 1.2)
    for i, (lab, val, note) in enumerate(bars):
        bx = x + 40 + i * (bw + 30)
        bh = (h - 290) * val / ymax * k
        rect(c, bx, base - bh, bw, bh, AMBER if note else "#6C7E9C", 1, r=2)
        draw_text(c, f"{int(val * k):,}", bx, base - bh - 14, SANS, 30, 700, OFFW, 1, bw, "center", anchor="baseline")
        draw_text(c, lab, bx - 10, base + 34, SANS, 18, 500, "#C3C9D1", 1, bw + 20, "center")
        if note:
            draw_text(c, note, bx - 10, base - bh - 52, SANS, 16, 700, AMBER, k * eo(t, t_note or t_in, 0.3), bw + 20, "center",
                      tracking=1.5, anchor="baseline")
    smallcaps(c, src, x + 40, y + h - 26, 16, GREY, 1)
    c.restore()


@scene("S33")
class S33(Scene):
    def plan(self):
        S = self.S
        self.t_hb = self.cue("ticker_133", "Harbour Bridge")
        self.tick(self.t_hb, "3 AUG 2025 · BONDI −133 DAYS", "Harbour Bridge")
        self.sfx(self.t_hb, "SFX05_whoosh", -5, "Harbour Bridge")
        self.sfx(self.t_hb, "SFX23_rain", -2, "Harbour Bridge", dur=11.0, fin=1.5, fout=2.5)
        self.tag("ticker", "", self.t_hb, self.w("Jewish groups") - 0.2)
        self.tag("caption", "Sydney Harbour (file footage)", S.start + 0.3, self.w("Jewish groups") - 0.2)
        self.t_jg = self.w("Jewish groups")
        self.t_l = self.cue("left_chart", "antisemitic incidents")
        self.t_r = self.cue("right_chart", "record abuse")
        self.sfx(self.t_l, "SFX06_tick", -1, "antisemitic incidents")
        self.sfx(self.t_r, "SFX06_tick", -1, "record abuse")
        self.t_env = self.cue("envoys", "two special envoys")
        self.sfx(self.t_env, "SFX18_paper", 2, "two special envoys")
        self.tag("source", "Sources: PM media releases, 9 Jul 2024 and 30 Sep 2024", self.t_env, S.end - 0.05)
        self.tag("caption", "Great Synagogue, Sydney  ·  Auburn Gallipoli Mosque, Sydney", self.w("The government appointed") + 0.3,
                 S.end - 0.1)

    def draw(self, c, t, fi):
        S = self.S
        if t < self.t_jg:
            video(c, "ST15b", t - S.start, "modern", 0.9, 0.75, zoom=1.0, z1=1.05, dur=4)
            # route line across the bridge (no crowd shown)
            pts = curve_pts((240, 470), (1060, 400), -0.08, 40)
            dashed(c, pts, smooth(t, self.t_hb, self.t_hb + 1.6), AMBER, 4, 0.95)
            vignette(c, 0.45)
            kinetic(c, "MARCH ACROSS THE HARBOUR BRIDGE · 3 AUG 2025", W / 2, 840, t, self.t_hb + 0.3, 30, SANS, 700, OFFW, tracking=4)
        elif t < self.w("The government appointed"):
            desk(c, fi)
            seam(c, W / 2, 140, 960, 1.0)
            chart(c, 90, 160, 800, 760, "Anti-Jewish incidents logged", [
                ("10-yr avg before Oct 2023", 342, ""), ("Oct 2023–Sep 2024", 2062, "RECORD"), ("Oct 2024–Sep 2025", 1654, "")],
                "ECAJ report, 2025 · periods Oct–Sep", t, self.t_jg + 0.2, 2200, self.t_l)
            chart(c, W - 890, 160, 800, 760, "Islamophobic incidents reported", [
                ("In person, Jan 2023–Nov 2024", 309, "HIGHEST SINCE IT BEGAN"), ("Online, Jan 2023–Nov 2024", 366, "")],
                "Islamophobia Register, Report 5, 2025 · Jan 2023–Nov 2024", t, self.t_jg + 0.2, 420, self.t_r)
            draw_text(c, "Different organisations and methods: the two charts are not directly comparable", 0, 1000, SANS, 20, 500,
                      GREY, eo(t, self.t_jg, 0.3), W, "center", anchor="baseline")
        else:
            te = self.w("The government appointed")
            rect(c, 0, 0, W, H, "#000000")
            for side, cid in ((0, "ST20"), (1, "ST21")):
                x = 0 if side == 0 else W / 2 + 2
                panel(c, lambda c, xx, yy, ww, hh, cid=cid: video(c, cid, t - te, "modern", 0.8, 0.45, zoom=1.0, rect_=(xx, yy, ww, hh), key="h"),
                      x, 0, W / 2 - 2, H)
            seam(c, W / 2, 0, H, 1.0)
            for side, (who, role, date, tt) in enumerate((("Jillian Segal AO", "Special Envoy to Combat Antisemitism", "Appointed 9 Jul 2024", self.t_env),
                                                          ("Aftab Malik", "Special Envoy to Combat Islamophobia", "Appointed 30 Sep 2024", self.t_env))):
                x = 160 if side == 0 else W / 2 + 160
                a = eo(t, tt, 0.35)
                rect(c, x, 380, 640, 260, PAPER, a, r=4)
                rect(c, x, 380, 640, 6, AMBER, a)
                draw_text(c, who, x + 44, 470, SERIF, 46, 600, INK, a, 560, anchor="baseline")
                draw_text(c, role, x + 44, 520, SANS, 24, 600, "#3A4252", a, 560, anchor="baseline")
                draw_text(c, date, x + 44, 590, MONO, 22, 500, "#5B6372", a, 560, anchor="baseline")
        grain(c, fi, 0.02)


S34_VALUES = [("The fires", "−420"), ("jet parts", "−300"), ("ambassador", "−110"), ("recognition", "−84"),
              ("court cases", "−78"), ("visas", "−72")]
S34_CARDS = [("THE FIRES", "Oct–Dec 2024", 330, 300), ("THE JET PARTS", "F-35 parts pool", 800, 230),
             ("THE EXPELLED AMBASSADOR", "26 Aug 2025", 1280, 300), ("THE RECOGNITION", "21 Sep 2025", 360, 760),
             ("THE COURT CASES", "2025", 960, 820), ("THE VISAS", "2023–2025", 1560, 760)]


@scene("S34")
class S34(Scene):
    """MONTAGE (8.0 s, no VO): every callback, then the board pull-back and the countdown race."""
    def plan(self):
        S = self.S
        t0 = S.start
        self.mt = [t0 + x for x in (0.0, 1.5, 2.85, 4.0, 4.95, 5.7)]   # montage card changes (MIX_MAP section 5)
        EV.cue(self.sid, "montage", t0, "")
        for i, tt in enumerate(self.mt):
            self.sfx(tt, "SFX24_countdown_tick", i * 1.0 - 2.0, name="montage heartbeat")
            EV.EVENTS.append(EV.Ev("tick", self.sid, tt, text="OCT 2023 · BONDI −799 DAYS", extra=dict(flip=0.01, pulse_once=True)))
        self.tag("ticker", "", t0, S.end + 0.4)
        self.tw = []
        for trig, val in S34_VALUES:
            tt = self.cue("card:" + trig, trig)
            self.tw.append(tt)
            self.tick(tt, f"BONDI {val} DAYS", trig, gain=3.0, flip=0.25)
        self.t_bb = self.cue("pull_to_bondi", "before Bondi")
        self.sfx(self.t_bb, "SFX14_riser", -2, "before Bondi")
        self.sfx(self.t_bb + 0.5, "SFX11_boom", -2, "before Bondi")

    def draw(self, c, t, fi):
        S = self.S
        if t < S.vo_start:
            i = max(k for k in range(6) if self.mt[k] <= t + 1e-6)
            tl = t - self.mt[i]
            if i == 0:
                flame(c, t, self.mt[0], fi)
            elif i == 1:
                video(c, "ST07", tl + 6.0, "modern", 1.0, 0.85, zoom=1.15)
                stamp_text(c, "MADE IN AUSTRALIA", W * 0.68, H * 0.62, t, self.mt[1] - 1, 54, AMBER, -6)
            elif i == 2:
                desk(c, fi)
                quote_card(c, "QT01", 410, 340, t, self.mt[2] - 1, w=1100)
            elif i == 3:
                m4_frame(c, t, self.mt[3] - 1)
            elif i == 4:
                desk(c, fi)
                evidence_card(c, (W - 1100) / 2, 240, 1100, t, self.mt[4] - 1, "Federal Court of Australia", "25 Jun 2025",
                              "Lattouf v ABC (No 2) [2025] FCA 669",
                              "The ABC contravened s 772(1) of the Fair Work Act by terminating Antoinette Lattouf’s employment.",
                              "[2025] FCA 669, orders", body_size=30)
            else:
                video(c, "ST09", tl + 2.0, "modern", 0.8, 0.8, zoom=1.0)
                k = ease_out(lin(t, self.mt[5], self.mt[5] + 0.6))
                dw = W / 2 * (1 - k)
                rect(c, 0, 0, dw, H, "#2C3D57", 1)
                rect(c, W - dw, 0, dw, H, "#2C3D57", 1)
            vignette(c, 0.4)
            # the board starts to appear in the last second of the montage
            return
        # board pull-back: every card connected by amber string, each lights on its word
        z = mix(1.25, 1.0, smooth(t, S.vo_start, S.vo_start + 1.4))
        c.save()
        c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2)
        board_bg(c)
        bx, by = W / 2, 540
        pull = smooth(t, self.t_bb, self.t_bb + 0.9)
        for i, (title, sub, x, y) in enumerate(S34_CARDS):
            lit = eo(t, self.tw[i], 0.3)
            xx, yy = mix(x, bx, pull * 0.35), mix(y, by, pull * 0.35)
            glow_line(c, [(xx, yy - 50), (bx, by - 40)], 1.0, AMBER, 2.0 + 1.5 * lit, 0.35 + 0.6 * lit, 4 + 6 * lit)
            w_, h_ = 380, 118
            c.save(); c.translate(xx, yy); c.rotate(((i * 37) % 7 - 3) * 0.6)
            shadow(c, -w_ / 2, -h_ / 2, w_, h_, 0.6, 16, 8, 3)
            rect(c, -w_ / 2, -h_ / 2, w_, h_, PAPER, 0.75 + 0.25 * lit, r=3)
            if lit:
                rect(c, -w_ / 2 - 4, -h_ / 2 - 4, w_ + 8, h_ + 8, AMBER, 0.7 * lit, r=5, stroke=3, blur=3)
            draw_text(c, title, -w_ / 2 + 20, -h_ / 2 + 48, SERIF, 21 if len(title) > 16 else 30, 600, INK, 1, w_ - 40, anchor="baseline")
            draw_text(c, sub, -w_ / 2 + 20, h_ / 2 - 22, SANS, 17, 500, "#5B6372", 1, w_ - 40, anchor="baseline")
            circle(c, 0, -h_ / 2 + 4, 9, AMBER, 1)
            c.restore()
        # BONDI at the centre
        g = smooth(t, self.t_bb, self.t_bb + 0.6)
        rect(c, bx - 170, by - 60, 340, 120, NAVY, 0.95, r=4)
        rect(c, bx - 170, by - 60, 340, 120, AMBER, 0.6 + 0.4 * g, r=4, stroke=2 + 2 * g)
        if g:
            rect(c, bx - 180, by - 70, 360, 140, AMBER, 0.4 * g, r=6, blur=14)
        draw_text(c, "BONDI", bx - 170, by + 18, SERIF, 52, 600, OFFW, 1, 340, "center", tracking=4, anchor="baseline")
        c.restore()
        vignette(c, 0.4)


@scene("S35")
class S35(Scene):
    def plan(self):
        S = self.S
        self.t_oct = self.cue("ticker_65", "October")
        self.tick(self.t_oct, "OCT 2025 · BONDI −65 DAYS", "October")
        self.tag("ticker", "", self.t_oct, self.w("it wasn't"))
        self.t_cf = self.cue("doc20", "ceasefire")
        self.sfx(self.t_cf, "SFX18_paper", 2, "ceasefire")
        self.tag("source", "Source: PM / Foreign Minister statement, 9 Oct 2025", self.t_cf, self.w("Sixty-five") - 0.1)
        self.t_65 = self.cue("race", "Sixty-five days after")
        self.t_it = self.cue("black", "it wasn't")
        # 14 ticks, accelerating like a heartbeat; last five intervals fixed (0.14 .. 0.09 s); the zero hit lands before "it"
        fixed = [0.14, 0.12, 0.11, 0.10, 0.09]
        span = (self.t_it - 0.06) - self.t_65
        rest = span - sum(fixed)
        r = 0.86
        first = rest * (1 - r) / (1 - r ** 8)
        iv = [first * r ** k for k in range(8)] + fixed
        tt = self.t_65
        times = [tt]
        for d in iv:
            tt += d
            times.append(tt)
        vals = [65, 60, 54, 48, 42, 36, 30, 25, 20, 15, 10, 6, 3, 0]
        for k, (tk, v) in enumerate(zip(times, vals)):
            g = mix(-2.0, 4.0, k / 13)
            month = "OCT" if v >= 45 else ("NOV" if v >= 14 else "DEC")
            txt = f"{month} 2025 · BONDI −{v} DAYS" if v else "14 DEC 2025 · BONDI"
            EV.EVENTS.append(EV.Ev("tick", self.sid, tk, text=txt,
                                   trig="Sixty-five days after" if k == 0 else "", extra=dict(flip=0.06)))
            self.sfx(tk, "SFX24_countdown_tick", g, "Sixty-five days after" if k == 0 else "", name="race", short=(iv[k - 1] < 0.2 if k else False))
        self.race_times = times

    def draw(self, c, t, fi):
        S = self.S
        if t >= self.t_it:
            rect(c, 0, 0, W, H, "#000000")     # hard cut to black on "it wasn't"
            return
        if t < self.t_cf:
            draw_thread(c, t, None, 1.0, 0.0, 0.0, None, glow_warm=smooth(t, S.start, S.start + 1.5))
            vignette(c, 0.4)
        else:
            draw_thread(c, t, None, 1.0, 0.0, 0.0, None, glow_warm=1.0, alpha=0.45)
            body = ("Australia welcomes President Trump’s announcement that Israel and Hamas have signed off the first phase "
                    "of the plan to bring peace to Gaza.")
            evidence_card(c, (W - 1100) / 2, 260, 1100, t, self.t_cf, "Prime Minister and Foreign Minister · Statement",
                          "9 Oct 2025", "Statement on Middle East peace plan", body, "pm.gov.au, 9 Oct 2025", body_size=32,
                          highlights=[("first phase", self.t_cf + 0.4, 0.5)],
                          alpha=1 - smooth(t, self.t_65 - 0.4, self.t_65))
        grain(c, fi, 0.02)
