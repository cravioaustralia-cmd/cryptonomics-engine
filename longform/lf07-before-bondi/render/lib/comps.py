"""comps.py - the film's recurring designed elements (one design each, used everywhere)."""
import math, random
import skia
from .core import *
from .media import photo, draw_cover, gpaint, reader, SAMP, grain, vignette

# ======================================================================== word layout
def layout_words(text, fam, size, weight=400, width=1000, lh=1.3, italic=False, tracking=0.0):
    """Greedy wrap. Returns (items, height) with items = [dict(w, x, y, wid, line)] (y = baseline)."""
    words = text.split(" ")
    sp = text_w("a a", fam, size, weight, tracking, italic) - text_w("aa", fam, size, weight, tracking, italic)
    items, x, line = [], 0.0, 0
    asc = size * 0.95
    for w in words:
        ww = text_w(w, fam, size, weight, tracking, italic)
        if x > 0 and x + ww > width:
            x, line = 0.0, line + 1
        items.append(dict(w=w, x=x, y=asc + line * size * lh, wid=ww, line=line))
        x += ww + sp
    nlines = line + 1
    return items, asc + (nlines - 1) * size * lh + size * 0.3


def draw_words(c, items, ox, oy, fam, size, weight=400, color=OFFW, alphas=None, italic=False, tracking=0.0,
               align_w=None, center=False):
    if center and align_w:
        # centre each line
        lines = {}
        for it in items:
            lines.setdefault(it["line"], []).append(it)
        shift = {k: (align_w - (v[-1]["x"] + v[-1]["wid"])) / 2 for k, v in lines.items()}
    for k, it in enumerate(items):
        a = 1.0 if alphas is None else alphas[k]
        if a <= 0.003:
            continue
        dx = shift[it["line"]] if (center and align_w) else 0
        draw_text(c, it["w"], ox + it["x"] + dx, oy + it["y"], fam, size, weight, color, a, 4000, "left", tracking,
                  italic, anchor="baseline")


def find_span(items, phrase):
    import re
    nz = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    p = [nz(x) for x in phrase.split()]
    ws = [nz(it["w"]) for it in items]
    for i in range(len(ws) - len(p) + 1):
        if ws[i:i + len(p)] == p:
            return i, i + len(p) - 1
    return None


def highlight(c, items, span, ox, oy, size, prog, color=AMBER, alpha=0.38):
    """Highlighter swipe behind words span (i0,i1), drawn left->right with progress prog."""
    if not span or prog <= 0:
        return
    i0, i1 = span
    segs = []
    for line in sorted(set(items[k]["line"] for k in range(i0, i1 + 1))):
        ks = [k for k in range(i0, i1 + 1) if items[k]["line"] == line]
        x0 = items[ks[0]]["x"] - size * 0.12
        x1 = items[ks[-1]]["x"] + items[ks[-1]]["wid"] + size * 0.12
        y = items[ks[0]]["y"]
        segs.append((x0, x1, y))
    total = sum(s[1] - s[0] for s in segs)
    left = total * clamp(prog)
    for x0, x1, y in segs:
        L = min(left, x1 - x0)
        if L <= 0:
            break
        rect(c, ox + x0, oy + y - size * 0.78, L, size * 0.98, color, alpha, r=3)
        left -= L

# ======================================================================== quote card
QUOTES = {
    "QT01": dict(q="These were extraordinary and dangerous acts of aggression orchestrated by a foreign nation on Australian soil.",
                 who="Anthony Albanese", role="Prime Minister", date="26 Aug 2025", src="Media statement, pm.gov.au"),
    "QT02": dict(q="…to turn neighbour against neighbour and Australian against Australian.",
                 who="Sussan Ley", role="then Opposition Leader", date="26 Aug 2025", src="Hansard, House of Representatives"),
    "QT03": dict(q="And this is just completely unacceptable.",
                 who="Anthony Albanese", role="Prime Minister", date="2 Apr 2024", src="Doorstop, Redbank, pm.gov.au"),
    "QT04": dict(q="…our forces unintentionally harmed non-combatants in the Gaza Strip.",
                 who="Benjamin Netanyahu", role="Prime Minister of Israel", date="2 Apr 2024", src="Statement, @IsraeliPM on X"),
    "QT05": dict(q="She will leave behind a legacy of compassion, bravery, and love…",
                 who="Frankcom family", role="Family statement", date="2 Apr 2024", src="Published by World Central Kitchen"),
    "QT06": dict(q="A two-state solution is humanity’s best hope to break the cycle of violence…",
                 who="Anthony Albanese", role="Prime Minister", date="11 Aug 2025", src="Press conference, Parliament House, pm.gov.au"),
    "QT07": dict(q="Recognition is completely meaningless while Australia continues to arms, trade with, diplomatically protect and encourage other states to normalise relations with the very state perpetrating these atrocities…",
                 who="Australia Palestine Advocacy Network (APAN)", role="Advocacy group", date="11 Aug 2025", src="APAN statement",
                 note="APAN president Nasser Mashni used the words “completely meaningless” the same day (The Guardian, 11 Aug 2025)"),
    "QT08": dict(q="History will remember Albanese for what he is: A weak politician who betrayed Israel and abandoned Australia's Jews.",
                 who="Benjamin Netanyahu", role="Prime Minister of Israel (@IsraeliPM)", date="19 Aug 2025", src="Post on X",
                 label="Recreation of public post · X, 19 Aug 2025"),
    "QT09": dict(q="I don't take these things personally.",
                 who="Anthony Albanese", role="Prime Minister", date="20 Aug 2025", src="Press conference, Adelaide, pm.gov.au"),
    "QT10": dict(q="An attack on Jewish Australians is an attack on every Australian…",
                 who="Anthony Albanese", role="Prime Minister", date="14 Dec 2025", src="Press conference, Canberra, pm.gov.au"),
    "QT11": dict(q="…his bravery is an inspiration for all Australians.",
                 who="Anthony Albanese", role="Prime Minister", date="16 Dec 2025", src="Doorstop, Sydney, pm.gov.au"),
    "QT12": dict(q="…a layer cake of cut-outs…",
                 who="Mike Burgess", role="ASIO Director-General", date="26 Aug 2025", src="Press conference, Parliament House, pm.gov.au"),
}
Q_SIZE = 44
Q_PAD = 58


def quote_card_size(qid, w=1240, qsize=Q_SIZE):
    d = QUOTES[qid]
    items, h = layout_words("“" + d["q"] + "”", SERIF, qsize, 400, w - Q_PAD * 2 - 6, 1.32)
    hh = Q_PAD + h + 30 + 34 + 34 + Q_PAD - 10
    if d.get("note"):
        hh += 34
    return w, hh


def quote_card(c, qid, x, y, t, t_in, w=1240, word_times=None, alpha=1.0, qsize=Q_SIZE, min_h=0, glow=0.0,
               dim_unread=0.22):
    """THE quote card (one design for every speaker): navy, off-white Source Serif 4 quote, speaker in Inter,
    date and source in small caps, 3 px amber left rule. word_times: reveal time per quote word (synced to VO);
    words not yet read show at dim_unread. Returns (w, h)."""
    a = alpha * eo(t, t_in, 0.32)
    if a <= 0.003:
        return quote_card_size(qid, w, qsize)
    d = QUOTES[qid]
    qtext = "“" + d["q"] + "”"
    items, qh = layout_words(qtext, SERIF, qsize, 400, w - Q_PAD * 2 - 6, 1.32)
    _, hh = quote_card_size(qid, w, qsize)
    hh = max(hh, min_h)
    dy = (1 - eo(t, t_in, 0.32)) * 18
    yy = y + dy
    layer(c, a)
    shadow(c, x, yy, w, hh, 0.55, 28, 14, r=6)
    rect(c, x, yy, w, hh, NAVY, 0.97, r=6)
    rect(c, x, yy, w, hh, "#FFFFFF", 0.06, r=6, stroke=1.0)
    rect(c, x, yy, 3, hh, AMBER, 1.0)
    if glow:
        rect(c, x - 2, yy, 7, hh, AMBER, 0.5 * glow, blur=10)
    if d.get("label"):
        draw_text(c, d["label"].upper(), x + Q_PAD, yy + 22, SANS, 15, 600, GREY, 1, w, tracking=2.2)
    qy = yy + Q_PAD + (8 if d.get("label") else 0)
    if word_times:
        alphas = []
        for k in range(len(items)):
            tt = word_times[min(k, len(word_times) - 1)]
            alphas.append(mix(dim_unread, 1.0, eo(t, tt, 0.22)))
    else:
        alphas = None
    draw_words(c, items, x + Q_PAD, qy, SERIF, qsize, 400, OFFW, alphas)
    sy = yy + hh - Q_PAD - 52 - (34 if d.get("note") else 0)
    p, _ = draw_text(c, d["who"], x + Q_PAD, sy, SANS, 25, 600, OFFW, 1)
    ww = text_w(d["who"], SANS, 25, 600)
    draw_text(c, "  ·  " + d["role"], x + Q_PAD + ww, sy + 2, SANS, 22, 400, "#C4C8CF", 1)
    smallcaps(c, d["date"] + "  ·  " + d["src"], x + Q_PAD, sy + 62, 19, GREY, 1, 500, 1.4)
    if d.get("note"):
        draw_text(c, d["note"], x + Q_PAD, sy + 76, SANS, 17, 400, GREY, 1, w - Q_PAD * 2)
    c.restore()
    return w, hh


def quote_word_times(seg, first_phrase, n_words, last_phrase=None):
    """Reveal times for a quote card from the narrator's words: first quote word -> last, interpolated."""
    t0 = seg.w(first_phrase)
    t1 = seg.we(last_phrase) if last_phrase else t0 + 0.3 * n_words
    return [mix(t0, t1 - 0.25, k / max(1, n_words - 1)) for k in range(n_words)]

# ======================================================================== evidence card (paper)
def evidence_card(c, x, y, w, t, t_in, org, date, title, body, src, highlights=(), body_size=30, alpha=1.0,
                  tilt=0.0, label=None, title_size=40, stamp=None, min_h=0):
    """Paper document card. highlights: [(phrase, t_start, dur)]. Returns height."""
    a = alpha * eo(t, t_in, 0.32)
    pad = 54
    items, bh = layout_words(body, SERIF, body_size, 400, w - pad * 2, 1.38)
    titems, th = layout_words(title, SERIF, title_size, 600, w - pad * 2, 1.18)
    hh = max(min_h, pad + 30 + 22 + th + 26 + bh + 40 + 30 + pad - 16)
    if a <= 0.003:
        return hh
    dy = (1 - eo(t, t_in, 0.32)) * 22
    c.save()
    c.translate(x + w / 2, y + dy + hh / 2)
    c.rotate(tilt)
    c.translate(-w / 2, -hh / 2)
    layer(c, a)
    shadow(c, 0, 0, w, hh, 0.6, 30, 16, r=4)
    rect(c, 0, 0, w, hh, PAPER, 1, r=4)
    # faint paper tooth
    rect(c, 0, 0, w, 6, AMBER, 0.85)
    smallcaps(c, org, pad, pad + 6, 20, "#5B6372", 1, 600, 1.6)
    draw_text(c, date, pad, pad + 22, SANS, 19, 500, "#5B6372", 1, w - pad * 2, align="right", anchor="baseline")
    ty = pad + 30
    draw_words(c, titems, pad, ty, SERIF, title_size, 600, INK)
    by = ty + th + 22
    rect(c, pad, by - 8, 80, 2, INK, 0.25)
    for ph, ts, dur in highlights:
        sp = find_span(items, ph)
        highlight(c, items, sp, pad, by + 14, body_size, lin(t, ts, ts + dur))
    draw_words(c, items, pad, by + 14, SERIF, body_size, 400, INK)
    yb = hh - pad + 8
    rect(c, pad, yb - 34, w - pad * 2, 1, INK, 0.18)
    smallcaps(c, "Source: " + src, pad, yb, 18, "#4A5262", 1, 500, 1.2)
    if label:
        draw_text(c, label.upper(), pad, yb - 52, SANS, 15, 600, "#7A6A4A", 1, w, tracking=2)
    if stamp:
        stamp_text(c, stamp[0], w * 0.70, hh * 0.40, t, stamp[1], size=44, color="#B4552E", angle=-8)
    c.restore()
    c.restore()
    return hh


def stamp_text(c, text, cx, cy, t, t_in, size=64, color=AMBER, angle=-6, alpha=1.0, quiet=False):
    """Rubber stamp: scales down from 1.6 and lands (no shake)."""
    k = eo(t, t_in, 0.22)
    if k <= 0:
        return
    s = mix(1.6, 1.0, k)
    a = alpha * k
    tw = text_w(text, SANS, size, 800 if False else 700, 3)
    c.save()
    c.translate(cx, cy)
    c.rotate(angle)
    c.scale(s, s)
    pw, ph = tw + size * 0.9, size * 1.55
    rect(c, -pw / 2, -ph / 2, pw, ph, color, a, r=8, stroke=size * 0.09)
    rect(c, -pw / 2 + size * 0.14, -ph / 2 + size * 0.14, pw - size * 0.28, ph - size * 0.28, color, a * 0.6, r=5, stroke=size * 0.03)
    draw_text(c, text, -tw / 2, size * 0.36, SANS, size, 700, color, a, 4000, tracking=3, anchor="baseline")
    c.restore()

# ======================================================================== name card (Zomi Frankcom, Ahmed al Ahmed)
def name_card(c, name, role, cx, cy, t, t_in, alpha=1.0, size=84, width=1100):
    """Designed name card: Source Serif 4 name, Inter role line, amber rule, slow motion. Same for both people."""
    a = alpha * smooth(t, t_in, t_in + 1.6)
    if a <= 0.003:
        return
    nw = text_w(name, SERIF, size, 400)
    rise = (1 - ease_out(lin(t, t_in, t_in + 2.4))) * 14
    # letters write on slowly
    n = len(name)
    x0 = cx - nw / 2
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(cx, cy), 760, [rgb(NAVY, 0.72 * a), rgb(NAVY, 0)], [0, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    for k, ch in enumerate(name):
        if ch == " ":
            continue
        xx = x0 + (text_w(name[:k] + "x", SERIF, size, 400) - text_w("x", SERIF, size, 400) if k > 0 else 0.0)
        ka = smooth(t, t_in + k * 0.045, t_in + k * 0.045 + 0.9)
        draw_text(c, ch, xx, cy - 10 + rise, SERIF, size, 400, OFFW, a * ka, 400, anchor="baseline")
    rl = nw * 0.62 * smooth(t, t_in + 0.6, t_in + 2.2)
    rect(c, cx - rl / 2, cy + 22 + rise, rl, 3, AMBER, a)
    draw_text(c, role, cx - width / 2, cy + 50 + rise, SANS, 28, 400, "#D5D8DD", a * smooth(t, t_in + 1.0, t_in + 2.2),
              width, "center", tracking=0.6)

# ======================================================================== chapter / title / disclaimer cards
def chapter_card(c, label, title, sub, t, t_in, t_out=None, alpha=1.0, y=470):
    a = alpha * fade(t, t_in, t_out, 0.6, 0.6)
    if a <= 0.003:
        return
    layer(c, a)
    draw_text(c, label, 0, y - 86, SANS, 22, 600, AMBER, 1, W, "center", tracking=7)
    k = eo(t, t_in + 0.1, 0.9)
    draw_text(c, title, 0, y - 6 + (1 - k) * 16, SERIF, 104, 600, OFFW, k, W, "center", tracking=2)
    rl = 340 * smooth(t, t_in + 0.3, t_in + 1.5)
    rect(c, W / 2 - rl / 2, y + 128, rl, 2, AMBER, 1)
    if sub:
        draw_text(c, sub, 0, y + 152, MONO, 28, 500, "#C9CDD4", smooth(t, t_in + 0.6, t_in + 1.4), W, "center", tracking=3)
    c.restore()


def disclaimer_card(c, t, t_in, t_out):
    a = fade(t, t_in, t_out, 0.5, 0.5)
    if a <= 0.003:
        return
    rect(c, 0, 0, W, H, NAVY, a)
    txt = ("An independent, non-partisan documentary. We don’t take sides. Facts are sourced on screen; "
           "each side’s view is attributed and given equal weight. Some scenes and the narration voices are AI-generated.")
    # 28 pt at 1080p is small; script asks 28 pt: rendered at 28 * (96/72) px
    sz = 28 * 96 / 72
    items, h = layout_words(txt, SERIF, sz, 400, 1180, 1.45)
    draw_words(c, items, (W - 1180) / 2, (H - h) / 2, SERIF, sz, 400, OFFW, [a] * len(items), align_w=1180, center=True)
    rect(c, W / 2 - 40, (H - h) / 2 - 50, 80, 2, AMBER, a)

# ======================================================================== tags and labels (global overlay)
def corner_tag(c, text, alpha):
    if alpha <= 0.003:
        return
    tw = text_w(text, SANS, 17, 600, 3.2)
    rect(c, 56, 46, tw + 30, 36, NAVY, 0.72 * alpha, r=3)
    rect(c, 56, 46, tw + 30, 36, AMBER, alpha, r=3, stroke=1.6)
    draw_text(c, text, 71, 70, SANS, 17, 600, AMBER, alpha, 600, tracking=3.2, anchor="baseline")


def source_tag(c, lines, y_base, alpha, kind="source"):
    """Bottom-right attribution. lines: list of str (first line may be a 'Label' line)."""
    if alpha <= 0.003:
        return 0
    sz = 20
    widths = [text_w(s, SANS, sz, 500) for s in lines]
    bw = max(widths) + 40
    bh = 18 + len(lines) * 30
    x = W - 56 - bw
    y = y_base - bh
    rect(c, x, y, bw, bh, NAVY, 0.78 * alpha, r=3)
    rect(c, x + bw - 3, y, 3, bh, AMBER if kind == "source" else GREY, alpha)
    for k, s in enumerate(lines):
        col = OFFW if kind == "source" else "#D9DCE1"
        draw_text(c, s, x + 16, y + 9 + 30 * k + 22, SANS, sz, 500, col, alpha, 1600, anchor="baseline")
    return bh


def ai_label(c, alpha):
    if alpha <= 0.003:
        return
    t = "Dramatised reconstruction"
    tw = text_w(t, SANS, 18, 500, 0.6)
    rect(c, 50, H - 58, tw + 26, 32, "#000000", 0.55 * alpha, r=3)
    draw_text(c, t, 63, H - 36, SANS, 18, 500, "#E6E6E6", alpha, 800, tracking=0.6, anchor="baseline")


def caption(c, text, y_base, alpha, x=56):
    """Lower-left caption describing a picture (place, date, 'file footage')."""
    if alpha <= 0.003:
        return
    tw = text_w(text, SANS, 21, 500)
    rect(c, x - 6, y_base - 31, tw + 26, 42, "#000000", 0.72 * alpha, r=3)
    rect(c, x - 6, y_base - 31, 3, 42, AMBER, alpha)
    draw_text(c, text, x + 8, y_base - 2, SANS, 21, 500, OFFW, alpha, 1600, anchor="baseline")

# ======================================================================== Bondi Countdown ticker (MG01)
FLAP_W, FLAP_H = 25, 44
TICK_X, TICK_Y = 56, 948
GLYPHS = "0123456789ABCDEFGHIJKLMNOPRSTUVWY−+·"


def ticker(c, text, prev, k_flip, alpha, pulse=0.0, frame_i=0, label="BONDI COUNTDOWN"):
    """Split-flap ticker lower-left. k_flip in 0..1 (flip progress from prev to text)."""
    if alpha <= 0.003:
        return
    n = max(len(text), len(prev or ""))
    layer(c, alpha)
    pw = len(text) * (FLAP_W + 3) + 22
    rect(c, TICK_X - 12, TICK_Y - 36, pw, FLAP_H + 50, "#050A12", 0.72, r=5)
    draw_text(c, label, TICK_X, TICK_Y - 12, SANS, 14, 600, GREY, 1, 600, tracking=3.4, anchor="baseline")
    amber_from = text.find("BONDI") + 6 if "BONDI " in text and len(text) > text.find("BONDI") + 6 else len(text)
    rng = random.Random(hash(text) ^ (frame_i // 2))
    for i in range(len(text)):
        x = TICK_X + i * (FLAP_W + 3)
        ch = text[i]
        pc = prev[i] if prev and i < len(prev) else " "
        stagger = i / max(1, n) * 0.55
        kk = clamp((k_flip - stagger) / 0.45) if k_flip < 1 else 1.0
        show = ch
        if kk < 1 and ch != pc:
            show = rng.choice(GLYPHS) if kk > 0 else pc
        if ch == " " and (kk >= 1 or pc == " "):
            continue
        rect(c, x, TICK_Y, FLAP_W, FLAP_H, "#111C2E", 0.95, r=3)
        rect(c, x, TICK_Y, FLAP_W, FLAP_H, "#3A4A63", 0.9, r=3, stroke=1.0)
        rect(c, x, TICK_Y + FLAP_H / 2 - 0.5, FLAP_W, 1.2, "#000000", 0.85)
        rect(c, x, TICK_Y, FLAP_W, FLAP_H / 2, "#FFFFFF", 0.035, r=3)
        col = AMBER if i >= amber_from else OFFW
        if show.strip():
            draw_text(c, show, x, TICK_Y + 32, MONO, 28, 600, col, 1, FLAP_W, "center", anchor="baseline")
    if pulse > 0:
        x0 = TICK_X + amber_from * (FLAP_W + 3)
        x1 = TICK_X + len(text) * (FLAP_W + 3)
        rect(c, x0 - 4, TICK_Y - 4, x1 - x0 + 5, FLAP_H + 8, AMBER, 0.55 * pulse, r=5, blur=10)
        rect(c, x0 - 4, TICK_Y - 4, x1 - x0 + 5, FLAP_H + 8, AMBER, pulse, r=5, stroke=2)
    c.restore()

# ======================================================================== M7 pinned questions
Q_TEXT = ["HOW DID THIS HAPPEN HERE?", "WHO PAID FOR THE FIRE?", "WHO RAN TOWARD THE GUNFIRE?"]


def q_slot(i):
    w = 430 if i else 470
    return W - 56 - w, 46 + i * 60, w, 48


def q_card(c, i, x, y, w, h, alpha, scale=1.0, bright=0.0, text=None):
    if alpha <= 0.003:
        return
    text = text or Q_TEXT[i]
    c.save()
    c.translate(x, y)
    c.scale(scale, scale)
    shadow(c, 0, 0, w, h, 0.45 * alpha, 14, 6, 3)
    rect(c, 0, 0, w, h, NAVY, 0.94 * alpha, r=3)
    rect(c, 0, 0, w, h, AMBER, (0.35 + 0.65 * bright) * alpha, r=3, stroke=1.2)
    rect(c, 0, 0, 3, h, AMBER, alpha)
    sz = 17 if i else 18
    draw_text(c, text, 18, h / 2 + 6.5, SANS, sz, 600, OFFW, alpha, w - 30, tracking=1.6, anchor="baseline")
    circle(c, w - 14, 12, 4.5, AMBER, alpha)
    c.restore()

# ======================================================================== Seam (M3)
def seam(c, x, y0, y1, alpha=1.0, glow=0.0, crack=0.0, gap=0.0, frame_i=0):
    """Thin amber seam between two equal panels. crack 0..1 jagged; gap = widening in px."""
    if alpha <= 0.003:
        return
    if gap > 0.5:
        rect(c, x - gap / 2, y0, gap, y1 - y0, "#05080D", alpha)
        for sx in (x - gap / 2, x + gap / 2):
            line(c, sx, y0, sx, y1, AMBER, alpha * 0.9, 2.0, cap="butt")
        return
    if crack > 0:
        rnd = random.Random(11)
        pts = []
        n = 26
        for k in range(n + 1):
            yy = y0 + (y1 - y0) * k / n
            pts.append((x + (rnd.uniform(-1, 1) * 14 * crack if 0 < k < n else 0), yy))
        glow_line(c, pts, 1.0, AMBER, 3.0, alpha, 8 + glow * 10)
        return
    line(c, x, y0, x, y1, AMBER, alpha * (0.35 + 0.4 * glow), 10 + glow * 18, blur=8 + glow * 8, cap="butt")
    line(c, x, y0, x, y1, AMBER, alpha, 3.0, cap="butt")


def panel(c, img_fn, x, y, w, h, alpha=1.0):
    """Clip region for a split panel; img_fn(c, x, y, w, h) draws inside."""
    c.save()
    c.clipRect(skia.Rect.MakeXYWH(x, y, w, h))
    if alpha < 1:
        layer(c, alpha)
    img_fn(c, x, y, w, h)
    if alpha < 1:
        c.restore()
    c.restore()

# ======================================================================== photo moves
def print_photo(c, img, cx, cy, w, t, t_in, tilt=-2.0, border=14, drift=0.0, zoom=1.0, fx=0.5, fy=0.5,
                grade=None, alpha=1.0, h=None, drop=True):
    """DROP: white-bordered print falls onto the desk with a slight tilt; then slow drift."""
    k = eo(t, t_in, 0.35) if drop else 1.0
    a = alpha * k
    if a <= 0.003:
        return
    ih = h or w * img.height() / img.width()
    s = mix(1.18, 1.0, k)
    c.save()
    c.translate(cx + drift, cy)
    c.rotate(tilt + (1 - k) * 4)
    c.scale(s, s)
    layer(c, a)
    shadow(c, -w / 2 - border, -ih / 2 - border, w + 2 * border, ih + 2 * border, 0.6, 26 * (2 - k), 10 + 20 * (1 - k))
    rect(c, -w / 2 - border, -ih / 2 - border, w + 2 * border, ih + 2 * border, "#F4F1EA", 1)
    draw_cover(c, img, -w / 2, -ih / 2, w, ih, zoom, fx, fy, grade)
    c.restore()
    c.restore()


def desk(c, frame_i=0, tone=NAVY):
    """Dark desk / board background."""
    rect(c, 0, 0, W, H, tone, 1)
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(W * 0.5, H * 0.42), W * 0.75,
                                               [rgb("#24364F", 0.55), rgb(tone, 0.0)], [0.0, 1.0]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    vignette(c, 0.5, 0.45)


def full_photo(c, img, t, t0, t1, z0=1.04, z1=1.12, fx0=0.5, fy0=0.5, fx1=None, fy1=None, grade="modern",
               amount=1.0, bright=1.0, alpha=1.0, rect_=(0, 0, W, H)):
    """PAN: slow push / pan across a full-frame photo."""
    k = smooth(t, t0, t1) if t1 > t0 else 0
    fx1 = fx0 if fx1 is None else fx1
    fy1 = fy0 if fy1 is None else fy1
    p = gpaint(grade, amount, bright, alpha) if grade else None
    if p is None and alpha < 1:
        p = skia.Paint(); p.setAlphaf(alpha)
    draw_cover(c, img, *rect_, mix(z0, z1, k), mix(fx0, fx1, k), mix(fy0, fy1, k), p)


def video(c, cid, t_local, grade="modern", amount=1.0, bright=1.0, alpha=1.0, speed=1.0, start=0.0,
          zoom=1.0, z1=None, dur=6.0, fx=0.5, fy=0.5, rect_=(0, 0, W, H), key=""):
    """A clip filling rect_ (cover). Slow push from zoom to z1 over dur."""
    x, y, w, h = rect_
    rw, rh = (W, H) if (w >= W - 1 and h >= H - 1) else (int(w), int(h)) if (w * h < W * H * 0.5) else (W, H)
    r = reader(cid, rw, rh, key)
    img = r.at(t_local, speed, start)
    if img is None:
        return
    zz = zoom if z1 is None else mix(zoom, z1, smooth(t_local, 0, dur))
    p = gpaint(grade, amount, bright, alpha) if grade else None
    if p is None and alpha < 1:
        p = skia.Paint(); p.setAlphaf(alpha)
    draw_cover(c, img, x, y, w, h, zz, fx, fy, p)


def kinetic(c, text, cx, cy, t, t_in, size=72, fam=SERIF, weight=600, color=OFFW, alpha=1.0, t_out=None,
            tracking=0.0, rise=16):
    a = alpha * fade(t, t_in, t_out, 0.35, 0.4)
    if a <= 0.003:
        return
    k = eo(t, t_in, 0.35)
    draw_text(c, text, cx - 1500, cy + (1 - k) * rise, fam, size, weight, color, a, 3000, "center", tracking,
              anchor="baseline")


def figure_icon(c, x, y, s=1.0, color=OFFW, alpha=1.0):
    """Faceless figure icon (head circle + rounded body)."""
    circle(c, x, y - 26 * s, 11 * s, color, alpha)
    r = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 17 * s, y - 12 * s, 34 * s, 34 * s), 14 * s, 14 * s)
    c.drawRRect(r, paint(color, alpha))
