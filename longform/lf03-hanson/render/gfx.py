"""lf03 graphics: evidence cards, data, timeline, pins and labels, drawn with Pillow at 1920x1080.
Every overlay returns an RGBA image plus its top-left position. Nothing here invents wording: scenes.py passes the text."""
import os
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
W, H = 1920, 1080

# palette (no party colours as identity; One Nation is highlighted with the film's own accent only)
INK = (24, 24, 26)
PAPER = (241, 236, 226)
NIGHT = (13, 17, 23)
WHITE = (244, 242, 236)
MUTED = (150, 156, 165)
GOLD = (214, 172, 82)
RED = (186, 52, 48)
GREY_BARS = [(120, 128, 140), (96, 104, 116), (78, 86, 98)]


@lru_cache(None)
def F(name, size):
    files = {'title': 'playfair-display-latin-900-normal', 'title7': 'playfair-display-latin-700-normal',
             'label': 'oswald-latin-700-normal', 'label5': 'oswald-latin-500-normal',
             'body': 'libre-baskerville-latin-400-normal', 'bodyb': 'libre-baskerville-latin-700-normal',
             'type': 'special-elite-latin-400-normal', 'italic': 'im-fell-english-latin-400-italic'}
    return ImageFont.truetype(os.path.join(HERE, 'fonts', files[name] + '.ttf'), size)


def tw(font, s):
    b = font.getbbox(s)
    return b[2] - b[0]


def wrap(font, text, width):
    out = []
    for para in text.split('\n'):
        line = ''
        for word in para.split(' '):
            cand = (line + ' ' + word).strip()
            if tw(font, cand) <= width or not line:
                line = cand
            else:
                out.append(line)
                line = word
        out.append(line)
    return out


def spaced(draw, xy, s, font, fill, track=2):
    x, y = xy
    for ch in s:
        draw.text((x, y), ch, font=font, fill=fill)
        x += tw(font, ch) + track
    return x


def spaced_w(font, s, track=2):
    return sum(tw(font, c) + track for c in s) - track


def shadowed(img, radius=18, alpha=150, off=(0, 10)):
    pad = radius * 3
    sh = Image.new('RGBA', (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    a = img.split()[3].point(lambda v: v * alpha // 255)
    blk = Image.new('RGBA', img.size, (0, 0, 0, 255))
    blk.putalpha(a)
    sh.paste(blk, (pad + off[0], pad + off[1]), blk)
    sh = sh.filter(ImageFilter.GaussianBlur(radius))
    sh.alpha_composite(img, (pad, pad))
    return sh, pad


# ---------------------------------------------------------------- cards
def card(kicker, body, source=None, width=900, style='glass', accent=GOLD, body_size=46, kicker_size=30, sub=None, quote=False, typed=None, show_sub=True):
    """style 'glass' (dark translucent, on pictures) or 'paper' (a document: Hansard, court, headline)."""
    pad = 48
    inner = width - pad * 2 - 14
    bf = F('title7', body_size + 6) if quote else F('body', body_size)
    lines = wrap(bf, body, inner)
    lh = int(bf.size * 1.42)
    kf = F('label', kicker_size)
    sf = F('label5', 22)
    subf = F('body', 30)
    sub_lines = wrap(subf, sub, inner) if sub else []
    h = pad + (kf.size + 22 if kicker else 0) + lh * len(lines) + (14 + int(subf.size * 1.45) * len(sub_lines) if sub else 0) + (50 if source else 6) + pad - 10
    img = Image.new('RGBA', (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if style == 'paper':
        d.rectangle([0, 0, width, h], fill=PAPER + (255,))
        fg, sc = INK, (98, 94, 88)
    else:
        d.rectangle([0, 0, width, h], fill=NIGHT + (222,))
        fg, sc = WHITE, MUTED
    d.rectangle([0, 0, 10, h], fill=accent + (255,))
    x, y = pad + 14, pad
    if kicker:
        spaced(d, (x, y - 6), kicker.upper(), kf, accent if style == 'glass' else (accent if accent != GOLD else (150, 108, 30)), track=3)
        y += kf.size + 22
    left = None if typed is None else int(round(typed * sum(len(l) + 1 for l in lines)))
    for ln in lines:
        if left is not None:
            ln, left = ln[:max(0, left)], left - len(ln) - 1
        d.text((x, y), ln, font=bf, fill=fg)
        y += lh
    if sub:
        y += 14
        for ln in sub_lines:
            if show_sub:
                d.text((x, y), ln, font=subf, fill=sc if style == 'paper' else (205, 205, 200))
            y += int(subf.size * 1.45)
    if source:
        y += 18
        spaced(d, (x, y), 'SOURCE  ' + source.upper(), sf, sc, track=1)
    out, p = shadowed(img)
    return out, p


def stamp(word, color=RED, size=92):
    f = F('label', size)
    w = spaced_w(f, word, 6) + 70
    h = size + 56
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, w - 5, h - 5], outline=color + (255,), width=8)
    spaced(d, (35, 14), word, f, color + (255,), track=6)
    return img.rotate(-4, resample=Image.BICUBIC, expand=True)


def lower_third(name, sub=None):
    nf, sf = F('label', 56), F('label5', 30)
    w = max(spaced_w(nf, name.upper(), 3), tw(sf, sub or '')) + 90
    h = 92 + (48 if sub else 0)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h], fill=NIGHT + (225,))
    d.rectangle([0, 0, 9, h], fill=GOLD + (255,))
    spaced(d, (40, 10), name.upper(), nf, WHITE, track=3)
    if sub:
        d.text((40, 90), sub, font=sf, fill=(205, 205, 200))
    return shadowed(img)


def credit(text):
    f = F('label5', 19)
    w = tw(f, text) + 24
    img = Image.new('RGBA', (w, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 32], fill=(0, 0, 0, 120))
    d.text((12, 3), text, font=f, fill=(215, 215, 210, 235))
    return img


def tag(text, color=GOLD):
    f = F('label', 30)
    w = spaced_w(f, text, 5) + 52
    img = Image.new('RGBA', (w, 56), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 56], fill=NIGHT + (225,))
    d.rectangle([0, 52, w, 56], fill=color + (255,))
    spaced(d, (26, 5), text, f, color, track=5)
    return img


def recon_label():
    f = F('label5', 24)
    s = 'Dramatised reconstruction'
    w = tw(f, s) + 36
    img = Image.new('RGBA', (w, 42), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 42], fill=(0, 0, 0, 150))
    d.text((18, 6), s, font=f, fill=(235, 235, 230))
    return img


@lru_cache(None)
def abbott_pin():
    ph = Image.open(os.path.join(EP, 'images', 'IMG-abbott-official.jpg')).convert('RGB')
    # head-and-shoulders: whole width of the official portrait, top 78 per cent (no face edits, nothing added)
    ph = ph.crop((0, 0, ph.width, int(ph.width * 1.0)))
    ph = ph.resize((132, 132), Image.LANCZOS)
    w, h = 400, 164
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h], fill=NIGHT + (232,))
    d.rectangle([0, h - 5, w, h], fill=GOLD + (255,))
    img.paste(ph, (14, 14))
    spaced(d, (164, 26), 'TONY ABBOTT', F('label', 34), WHITE, track=2)
    d.text((164, 80), 'Liberal MP', font=F('label5', 24), fill=(205, 205, 200))
    return img


# ---------------------------------------------------------------- data
def bars(title, items, source, p=1.0, width=1180, maxv=None, unit='%', note=None, ps=None, show_note=True):
    """items: [(label, value, highlight)]. p in 0..1 grows the bars, staggered."""
    pad = 56
    rowh = 104
    h = pad + 70 + rowh * len(items) + (44 if note else 0) + 70
    img = Image.new('RGBA', (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, width, h], fill=NIGHT + (230,))
    d.rectangle([0, 0, width, 6], fill=GOLD + (255,))
    spaced(d, (pad, pad - 18), title.upper(), F('label', 40), WHITE, track=3)
    maxv = maxv or max(v for _, v, _ in items) * 1.1
    lf, vf = F('label5', 36), F('label', 48)
    x0 = pad + 300
    span = width - x0 - pad - 130
    y = pad + 70
    for i, (lab, v, hi) in enumerate(items):
        q = ps[i] if ps is not None else min(1, max(0, (p * (1 + 0.35 * len(items)) - 0.35 * i)))
        q = 1 - (1 - min(1, max(0, q))) ** 3
        d.text((pad, y + 18), lab, font=lf, fill=WHITE if hi else (205, 205, 200))
        col = GOLD if hi else GREY_BARS[i % 3]
        d.rectangle([x0, y + 14, x0 + int(span * v / maxv * q), y + 76], fill=col + (255,))
        if q > 0.97:   # only the final figure, never an in-between number the voice did not say
            d.text((x0 + int(span * v / maxv * q) + 18, y + 14), f'{v:g}{unit}', font=vf, fill=GOLD if hi else WHITE)
        y += rowh
    if note:
        if show_note:
            d.text((pad, y + 2), note, font=F('label5', 26), fill=(205, 205, 200))
        y += 44
    spaced(d, (pad, y + 18), 'SOURCE  ' + source.upper(), F('label5', 22), MUTED, track=1)
    return shadowed(img)


def stat(big, label, source=None, sub=None, color=GOLD, width=None):
    bf = F('title', 210)
    lf = F('label', 44)
    lw = tw(lf, label.upper()) + 30
    sf = F('body', 30)
    width = max(width or 0, tw(bf, big) + 130, lw + 110, 620)
    sub_lines = wrap(sf, sub, width - 110) if sub else []
    h = 56 + 230 + 64 + len(sub_lines) * 44 + (52 if source else 0) + 40
    img = Image.new('RGBA', (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, width, h], fill=NIGHT + (228,))
    d.rectangle([0, 0, 10, h], fill=color + (255,))
    d.text((56, 10), big, font=bf, fill=color)
    y = 290
    spaced(d, (56, y), label.upper(), lf, WHITE, track=3)
    y += 70
    for ln in sub_lines:
        d.text((56, y), ln, font=sf, fill=(210, 210, 205))
        y += 44
    if source:
        spaced(d, (56, y + 8), 'SOURCE  ' + source.upper(), F('label5', 22), MUTED, track=1)
    return shadowed(img)


def split(left, right, source=None, width=1640, reveal=2):
    """left/right: (kicker, text, accent)."""
    colw = (width - 60) // 2
    tf = F('title7', 58)
    rows = [wrap(tf, s[1], colw - 110) for s in (left, right)]
    h = 60 + 60 + max(len(r) for r in rows) * 84 + (66 if source else 20) + 40
    img = Image.new('RGBA', (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, (s, r) in enumerate(zip((left, right), rows)):
        if i >= reveal:
            break
        x0 = i * (colw + 60)
        d.rectangle([x0, 0, x0 + colw, h], fill=NIGHT + (230,))
        d.rectangle([x0, 0, x0 + colw, 8], fill=s[2] + (255,))
        spaced(d, (x0 + 52, 44), s[0].upper(), F('label', 40), s[2], track=4)
        y = 120
        for ln in r:
            d.text((x0 + 52, y), ln, font=tf, fill=WHITE)
            y += 84
    if source:
        spaced(d, (52, h - 58), 'SOURCE  ' + source.upper(), F('label5', 22), MUTED, track=1)
    return shadowed(img)


YEARS = [1954, 1980, 1994, 1996, 1997, 1998, 1999, 2002, 2003, 2016, 2017, 2018, 2022, 2024, 2025, 2026]


def timeline(y_from, y_to, label, chapter, p=1.0):
    """Full-width strip 1954-2026. The marker travels y_from -> y_to as p goes 0 -> 1."""
    x0, x1, ay = 150, 1770, 760
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    X = lambda yr: x0 + (x1 - x0) * (yr - 1954) / (2026 - 1954)
    q = 1 - (1 - min(1, max(0, p))) ** 3
    yr = y_from + (y_to - y_from) * q
    d.line([x0, ay, x1, ay], fill=(110, 116, 126, 255), width=4)
    d.line([x0, ay, X(yr), ay], fill=GOLD + (255,), width=6)
    yf = F('label5', 24)
    for i, Y in enumerate(YEARS):
        x = X(Y)
        lit = Y <= yr + 0.01
        d.line([x, ay - 12, x, ay + 12], fill=(GOLD if lit else (120, 126, 136)) + (255,), width=3)
    for Y in (1954, 1970, 1980, 1990, 2000, 2010, 2020, 2026):
        s = str(Y)
        d.text((X(Y) - tw(yf, s) / 2, ay + 26), s, font=yf, fill=(170, 175, 182))
    mx = X(yr)
    d.ellipse([mx - 15, ay - 15, mx + 15, ay + 15], fill=GOLD + (255,), outline=WHITE + (255,), width=3)
    big = F('title', 150)
    s = str(int(round(yr)))
    bx = min(max(mx - tw(big, s) / 2, x0 - 20), x1 - tw(big, s) + 20)
    d.text((bx, ay - 300), s, font=big, fill=WHITE)
    if p >= 0.98:
        lf = F('body', 40)
        lx = min(max(mx - tw(lf, label) / 2, x0 - 20), x1 - tw(lf, label) + 20)
        d.text((lx, ay - 78), label, font=lf, fill=(225, 222, 214))
    cf = F('label', 36)
    spaced(d, (x0, 150), chapter.upper(), cf, GOLD, track=6)
    d.rectangle([x0, 206, x0 + 120, 210], fill=GOLD + (255,))
    return img


def title_card(p=1.0):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    big = F('title', 132)
    words = ['Jailed.', 'Censured.', 'Now #1.']
    x = 150
    for i, wd in enumerate(words):
        a = int(255 * min(1, max(0, p * 4 - i)))
        d.text((x, 330), wd, font=big, fill=(WHITE if i < 2 else GOLD) + (a,))
        x += tw(big, wd) + 44
    a = int(255 * min(1, max(0, p * 4 - 3)))
    sf = F('label5', 50)
    spaced(d, (156, 540), 'HOW PAULINE HANSON TOOK OVER AUSTRALIAN POLITICS', sf, (225, 222, 214, a), track=4)
    d.rectangle([156, 630, 156 + int(300 * min(1, p * 1.4)), 636], fill=GOLD + (255,))
    return img


def grid4(items, lit):
    """S03: four sources, each lights on its word. items [(label)], lit = how many are lit (float)."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = F('label', 64)
    sf = F('body', 30)
    cw, ch = 760, 250
    for i, (lab, sub) in enumerate(items):
        x = 160 + (i % 2) * (cw + 80)
        y = 230 + (i // 2) * (ch + 70)
        a = min(1, max(0, lit - i))
        d.rectangle([x, y, x + cw, y + ch], fill=NIGHT + (int(140 + 90 * a),), outline=(GOLD if a > 0.5 else (70, 76, 86)) + (255,), width=3)
        col = tuple(int(c1 * a + c0 * (1 - a)) for c1, c0 in zip(WHITE, (90, 96, 106)))
        spaced(d, (x + 50, y + 60), lab.upper(), f, col, track=5)
        d.text((x + 52, y + 160), sub, font=sf, fill=tuple(int(c * (0.4 + 0.6 * a)) for c in (210, 210, 205)))
    return img


def checklist(title, items, n, width=1200):
    """S04: a short list that builds line by line; n = how many lines are showing (float for the fade of the newest)."""
    pad = 56
    bf = F('body', 42)
    rows = [wrap(bf, it, width - pad * 2 - 60) for it in items]
    h = pad + 70 + sum(len(r) * 60 + 34 for r in rows) + pad - 20
    img = Image.new('RGBA', (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, width, h], fill=NIGHT + (230,))
    d.rectangle([0, 0, 10, h], fill=GOLD + (255,))
    spaced(d, (pad + 14, pad - 12), title.upper(), F('label', 34), GOLD, track=4)
    y = pad + 70
    for i, r in enumerate(rows):
        a = int(255 * min(1, max(0, n - i)))
        if a:
            d.rectangle([pad + 14, y + 20, pad + 30, y + 36], fill=GOLD + (a,))
            for j, ln in enumerate(r):
                d.text((pad + 60, y + j * 60), ln, font=bf, fill=WHITE[:3] + (a,))
        y += len(r) * 60 + 34
    return shadowed(img)
