"""lf03 choreography on the 1x clock. Every beat is keyed to a Whisper word in the voice take (A('S10', 'hansard')).
Card wording follows the voice files. Shared by render.py (picture) and mix.py (music + picture-sync effects)."""
import json, os, re
import gfx as G

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
T = TL['takes']
DUR = TL['duration']


def _n(x):
    return re.sub(r'[^a-z0-9%]', '', x.lower().replace('’', "'"))


def A(k, w, occ=0, off=0.0):
    n = 0
    for x in T[k]['words']:
        if _n(x['w']) == _n(w):
            if n == occ:
                return x['s'] + off
            n += 1
    raise KeyError((k, w, occ))


def Ae(k, w, occ=0, off=0.0):
    n = 0
    for x in T[k]['words']:
        if _n(x['w']) == _n(w):
            if n == occ:
                return x['e'] + off
            n += 1
    raise KeyError((k, w, occ))


S = lambda k: T[k]['start']
E = lambda k: T[k]['words'][-1]['e']          # end of the last spoken word
END = lambda k: T[k]['end']                    # end of the file

# ------------------------------------------------------------------ photos (only files in images/, faces untouched)
CR = {
    'hanson-2016': 'Photo: jfish92 · CC0',
    'hanson-2006': 'Photo: Dragons Abreast Australia · CC BY 3.0',
    'hanson-2007-book-launch': 'Photo: Velovotee · CC BY-SA 2.0',
    'abbott-official': 'Photo: Commonwealth of Australia · CC BY 3.0 AU',
    'faruqi-official': 'Photo: Australian Greens · CC BY-SA 2.5 AU',
    'joyce-official': 'Photo: David Foote, Australian Government · CC BY 3.0 AU',
    'parliament-house-canberra': 'Photo: Thennicke · CC BY-SA 4.0',
    'house-of-reps-chamber': 'Photo: JJ Harrison · CC BY-SA 3.0',
    'senate-chamber': 'Photo: JJ Harrison · CC BY-SA 3.0',
    'ipswich': 'Photo: Kgbo · CC BY-SA 4.0',
    'law-courts-sydney': 'Photo: Chris Olszewski (Kgbo) · CC BY-SA 4.0',
    'adelaide-skyline': 'Photo: Ardash Muradian · CC BY-SA 2.0',
    'albury-nsw': 'Photo: Thennicke · CC BY-SA 4.0',
}

SHOTS = []      # {'t0', 'kind', ...}; t1 = next shot's t0
OVR = []        # {'t0', 't1', 'make', 'pos', 'anim', 'dyn'}
SFX = []        # (time, name, gain_db, label)  -- hits land on picture events, never on a word
B_USED = set()


def shot(t0, kind, **kw):
    SHOTS.append(dict(t0=t0, kind=kind, **kw))


def photo(t0, img, kb=(1.0, .5, .5, 1.08, .5, .5), scrim='left', dim=1.0, xf=0.35):
    shot(t0, 'photo', img=img, kb=kb, scrim=scrim, dim=dim, xf=xf)


def portrait(t0, img, caption, side='right', xf=0.35):
    shot(t0, 'portrait', img=img, caption=caption, side=side, xf=xf)


def broll(t0, bid, src=0.0, rate=0.78, scrim='left', xf=0.3, srcmax=None):
    assert bid != 'B06', 'B06 shows figures on its monitors: not used'
    B_USED.add(bid)
    shot(t0, 'broll', bid=bid, src=src, rate=rate, scrim=scrim, xf=xf, srcmax=srcmax)


def bg(t0, xf=0.3, img=None, dim=0.3, kb=(1.0, .5, .5, 1.05, .5, .5)):
    if img:
        shot(t0, 'photo', img=img, kb=kb, scrim='none', dim=dim, xf=xf)
    else:
        shot(t0, 'bg', xf=xf)


def ov(t0, t1, make, pos=('l', 540), anim='rise', dyn=False, fin=0.35, fout=0.3):
    OVR.append(dict(t0=t0, t1=t1, make=make, pos=pos, anim=anim, dyn=dyn, fin=fin, fout=fout))


def C(t0, t1, kicker, body, pos=('l', 540), **kw):
    """Static card. kw goes to gfx.card."""
    ov(t0, t1, lambda lt, kw=kw: G.card(kicker, body, **kw), pos)


def C2(t0, tmid, t1, kicker, body, sub, pos=('l', 540), **kw):
    """Two-stage card: the sub line arrives when the voice says it (same card size both stages)."""
    ov(t0, tmid, lambda lt: G.card(kicker, body, sub=sub, show_sub=False, **kw), pos, fout=0.0)
    ov(tmid, t1, lambda lt: G.card(kicker, body, sub=sub, **kw), pos, anim='none', fin=0.0)


def LT(t0, t1, name, sub=None):
    ov(t0, t1, lambda lt: G.lower_third(name, sub), ('bl', 110, 960))


TLN_STARTS = []


def TLN(t0, t1, y0, y1, label, chapter, move=1.6):
    TLN_STARTS.append(t0)
    ov(t0, t1, lambda lt: (G.timeline(y0, y1, label, chapter, p=lt / move), 0), ('abs', 0, 0), anim='fade', dyn=True)
    SFX.append((t0 + 0.02, 'whoosh', -6, f'Whoosh as the timeline slides to {y1}'))


# ================================================================== COLD OPEN
photo(0.0, 'parliament-house-canberra', kb=(1.0, .5, .55, 1.10, .5, .5), scrim='left', dim=0.55, xf=0)
ov(0.5, S('S01') - 0.45, lambda lt: (G.title_card(p=lt / 2.6), 0), ('abs', 0, 0), anim='fade', dyn=True)
SFX.append((0.0, 'series_sting', -2, 'Series sting opens the film'))

# S01: the three-part hook. Jail is never on screen without "overturned on appeal".
broll(S('S01') - 0.45, 'B08', src=0.5, xf=0.5)
ov(S('S01') - 0.4, S('S01') + 4.2, lambda lt: G.recon_label(), ('br', 1896, 1056), anim='fade')   # first B-roll in the film
C(A('S01', 'two') + 0.1, A('S01', 'in', 2) - 0.3, '2003', 'An Australian politician was sentenced to three years in jail.',
  sub='The conviction was later overturned on appeal.', pos=('l', 560), accent=G.RED)
photo(A('S01', 'in', 2) - 0.3, 'senate-chamber', kb=(1.05, .5, .55, 1.15, .52, .5))
C(A('S01', 'in', 2) - 0.1, A('S01', 'in', 3) - 0.3, '2025', 'The Australian Senate censured that same politician and suspended her.')
broll(A('S01', 'in', 3) - 0.3, 'B07', src=0.0)
C(A('S01', 'in', 3) - 0.1, A('S01', 'and', 2) - 0.4, '2026', 'A court confirmed she had breached the Racial Discrimination Act.')
bg(A('S01', 'and', 2) - 0.4)
C(A('S01', 'and', 2) - 0.3, END('S01') + 0.2, 'Right now', 'Her party is in first place in Australia’s best-known opinion poll.', body_size=52, width=1100, pos=('c',))

# S02
photo(END('S01') + 0.35, 'hanson-2016', kb=(1.0, .5, .5, 1.22, .55, .38), scrim='bottom')
SFX.append((END('S01') + 0.35, 'camera_shutter', -10, 'Shutter as the first photo of Pauline Hanson lands'))
LT(A('S02', 'pauline') - 0.1, A('S02', 'to') - 0.3, 'Pauline Hanson', 'Photographed in 2016')
C(A('S02', 'to') - 0.15, A('S02', 'but') - 0.4, 'To be clear', 'Pauline Hanson’s jail conviction was overturned on appeal.', pos=('lb', 960), accent=G.GOLD, width=720)
photo(A('S02', 'but') - 0.4, 'parliament-house-canberra', kb=(1.15, .45, .5, 1.25, .5, .5))
C(A('S02', 'but') - 0.2, A('S02', 'so') - 0.4, 'On the public record', 'Every other event you just heard about is on the public record.')
bg(A('S02', 'so') - 0.4)
C(A('S02', 'so') - 0.3, END('S02') + 0.3, 'The question', 'How did Pauline Hanson, a politician who has been written off again and again, end up leading One Nation to thirty per cent in Newspoll?',
  pos=('tl', 110, 170), width=1000, body_size=48)
ov(A('S02', 'thirty') - 0.05, END('S02') + 0.3, lambda lt: G.stat('30%', 'One Nation', source='Newspoll'), ('tl', 1220, 230), anim='rise')

# S03: courts, Parliament, newspapers, numbers
photo(S('S03') - 0.3, 'law-courts-sydney', kb=(1.0, .5, .42, 1.08, .5, .38))
LT(A('S03', 'courts') - 0.1, A('S03', 'what', 1) - 0.1, 'What the courts found', 'Law Courts Building, Sydney')
photo(A('S03', 'what', 1) - 0.1, 'house-of-reps-chamber', kb=(1.05, .5, .5, 1.12, .5, .5), xf=0.25)
LT(A('S03', 'what', 1), A('S03', 'what', 2) - 0.1, 'What Parliament recorded', 'House of Representatives, Canberra')
broll(A('S03', 'what', 2) - 0.1, 'B04', src=0.0, rate=0.45, xf=0.25, srcmax=3.0)
LT(A('S03', 'what', 2), A('S03', 'and', 0) - 0.1, 'What the newspapers reported')
bg(A('S03', 'and', 0) - 0.1, xf=0.25)
ov(A('S03', 'and', 0), A('S03', 'and', 1) - 0.3, lambda lt: (G.grid4([('Courts', 'What the courts found'), ('Parliament', 'What Parliament recorded'),
                                                                      ('Newspapers', 'What the newspapers reported'), ('Numbers', 'What the numbers show')], 4), 0), ('abs', 0, 0), anim='fade')
photo(A('S03', 'and', 1) - 0.3, 'parliament-house-canberra', kb=(1.0, .5, .5, 1.12, .52, .45), scrim='left', dim=0.8)
C(A('S03', 'pattern') - 0.2, END('S03') + 0.3, 'By the end of this video', 'A pattern in Pauline Hanson’s career that both her supporters and her critics may find uncomfortable.')

# S04: independence note
bg(S('S04') - 0.4)
_s4 = [A('S04', 'this'), A('S04', "we're"), A('S04', 'every'), A('S04', 'wherever')]
_i4 = ['This video is an independent documentary.', 'We’re not affiliated with Pauline Hanson, One Nation, or any political party.',
       'Every source is shown on screen and listed in the description.', 'Wherever we give our own analysis, we’ll label it as analysis.']
ov(S('S04') - 0.2, END('S04') + 0.6, lambda lt: G.checklist('A quick note before we start', _i4, sum(min(1, max(0, (S('S04') - 0.2 + lt - t) / 0.35)) for t in _s4)),
   ('c',), dyn=True)

# ================================================================== CHAPTER 1: EARLY LIFE (sombre)
CH = []   # (t, title)
CH.append((0.0, 'Introduction'))
t = END('S04') + 0.35
CH.append((t, 'Early life in Ipswich'))
bg(t)
TLN(t, A('S05', 'she') - 0.2, 1954, 1954, 'Born in Brisbane', 'Chapter 1 · Early life')
bg(A('S05', 'she') - 0.2)
C(A('S05', 'she') - 0.1, A('S05', 'and', 0) - 0.3, 'Born', 'Pauline Lee Seccombe, into a working-class family.', pos=('l', 540))
broll(A('S05', 'and', 0) - 0.3, 'B01', src=0.0)
C(A('S05', 'grew'), A('S05', 'at') - 0.3, 'Growing up', 'Working in her parents’ fish-and-chip shop in Ipswich.', pos=('lb', 960))
bg(A('S05', 'at') - 0.3)
C(A('S05', 'at') - 0.2, END('S05') + 0.4, 'At seventeen', 'Pauline married for the first time, and had two sons.')
broll(END('S05') + 0.4, 'B02', src=0.0)
C(S('S06') + 0.1, A('S06', 'in', 1) - 0.6, '1980', 'Pauline married again, to a tradesman named Mark Hanson.',
  sub='Together they ran a roof-plumbing business and had two more children.')
broll(A('S06', 'in', 1) - 0.8, 'B03', src=0.5, rate=0.6, xf=0.8)
C(A('S06', 'in', 1) - 0.1, END('S06') + 0.6, 'In her own writing', 'Pauline Hanson has described her second marriage as marked by alcohol and domestic violence.', body_size=42)
photo(END('S06') + 0.6, 'ipswich', kb=(1.0, .5, .55, 1.12, .55, .5))
LT(S('S07') + 2.0, A('S07', 'in', 0) - 0.3, 'Ipswich, Queensland', 'Photographed in 2022')
C2(A('S07', 'in', 0) - 0.1, A('S07', 'lost') - 0.1, END('S07') + 0.3, '1994', 'She won a seat on the Ipswich City Council.',
   'She lost the seat less than a year later, when the council was restructured.')
bg(END('S07') + 0.4)
ov(S('S08') + 0.1, A('S08', 'critics') - 0.1, lambda lt: G.split(('Her supporters', 'A small-business mum who has felt the squeeze herself', G.GOLD),
                                                             ('Her critics', 'Her life story has been used to sell a politics of grievance', (170, 176, 186)), reveal=1), ('c',), fout=0.0)
ov(A('S08', 'critics') - 0.1, END('S08') + 0.8, lambda lt: G.split(('Her supporters', 'A small-business mum who has felt the squeeze herself', G.GOLD),
                                                                  ('Her critics', 'Her life story has been used to sell a politics of grievance', (170, 176, 186))), ('c',), anim='none', fin=0.15)

# ================================================================== CHAPTER 2: 1996
t = END('S08') + 0.5
CH.append((t, 'The 1996 breakthrough'))
bg(t)
TLN(t, A('S09', 'that') - 0.3, 1954, 1996, 'Political breakthrough', 'Chapter 2 · The breakthrough', move=2.4)
bg(A('S09', 'that') - 0.3, img='house-of-reps-chamber', dim=0.35)
C2(A('S09', 'that') - 0.2, A('S09', 'which') - 0.1, A('S09', 'before') - 0.3, '1996 · Oxley', 'The Liberal Party chose her to run in the federal seat of Oxley.',
   'One political record describes it as a traditionally safe Labor electorate.')
broll(A('S09', 'before') - 0.3, 'B04', src=0.0, rate=0.4, srcmax=3.0)
C(A('S09', 'before') - 0.2, Ae('S09', 'australians') + 0.2, 'Before election day', 'She wrote to a local newspaper attacking government assistance for Aboriginal Australians.')
bg(Ae('S09', 'australians') + 0.2)
C(Ae('S09', 'australians') + 0.3, A('S09', 'but') - 0.3, 'Disendorsed', 'The Liberal Party disendorsed her as its candidate.', pos=('tl', 110, 200))
ov(Ae('S09', 'australians') + 0.3, A('S09', 'but') - 0.3, lambda lt: G.stamp('DISENDORSED'), ('tl', 560, 560), anim='stamp')
SFX.append((Ae('S09', 'australians') + 0.3, 'paper_tear', -8, 'Paper tear as the DISENDORSED stamp lands (in the pause)'))
broll(A('S09', 'but') - 0.3, 'B05', src=0.0)
C(A('S09', 'but') - 0.2, A('S09', 'she', 0) - 0.3, 'Already printed', 'The ballot papers had already been printed, so her name still appeared beside the word Liberal.')
bg(A('S09', 'she', 0) - 0.3)
ov(A('S09', 'she', 0) - 0.2, END('S09') + 0.4, lambda lt: G.stat('19%', 'She won the seat of Oxley', sub='With a swing of more than nineteen per cent.'), ('c',))

photo(END('S09') + 0.4, 'house-of-reps-chamber', kb=(1.0, .5, .5, 1.15, .5, .45))
C(S('S10') + 0.1, Ae('S10', 'parliament') + 0.3, '10 September 1996', 'Pauline Hanson gave her first speech to Federal Parliament.')
bg(Ae('S10', 'parliament') + 0.3, img='house-of-reps-chamber', dim=0.25)
SFX.append((Ae('S10', 'parliament') + 0.35, 'typewriter_key', -9, 'Typewriter key as the Hansard page lands (in the pause)'))
_q10a, _q10b = A('S10', 'i') - 0.05, Ae('S10', 'asians')
ov(Ae('S10', 'parliament') + 0.35, END('S10') + 0.5,
   lambda lt: G.card('Hansard · the official record of Parliament', '“I believe we are in danger of being swamped by Asians.”', source='Hansard, House of Representatives, 10 September 1996',
                     style='paper', quote=True, width=1300, body_size=60, accent=G.RED,
                     typed=min(1, max(0, (Ae('S10', 'parliament') + 0.35 + lt - _q10a) / (_q10b - _q10a)))), ('c',), dyn=True)

bg(END('S10') + 0.5, img='parliament-house-canberra', dim=0.4)
C(S('S11') + 0.1, A('S11', 'her') - 0.3, 'Condemned', 'Pauline Hanson’s first speech was condemned across politics as racist.')
C(A('S11', 'her') - 0.2, A('S11', 'a', 0) - 0.4, 'Her supporters', 'Pauline Hanson was finally saying what they themselves were thinking.')
portrait(A('S11', 'a', 0) - 0.4, 'hanson-2006', 'Pauline Hanson, 2006')
C(A('S11', 'a', 0) - 0.3, A('S11', 'she', 1) - 0.3, 'A few weeks later', 'A television interviewer asked Pauline Hanson whether she was xenophobic.', width=820)
C(A('S11', 'she', 1) - 0.2, END('S11') + 0.4, 'Her reply', '“Please explain?”', quote=True, body_size=80, sub='Her reply became a national catchphrase.', width=820)

# ================================================================== CHAPTER 3: ONE NATION
t = END('S11') + 0.5
CH.append((t, 'One Nation is founded'))
bg(t)
TLN(t, A('S12', 'in') - 0.3, 1996, 1997, 'One Nation launched', 'Chapter 3 · One Nation')
broll(A('S12', 'in') - 0.3, 'B09', src=0.0)
C(A('S12', 'in') - 0.2, A('S12', 'one', 1) - 0.3, 'April 1997', 'She launched Pauline Hanson’s One Nation.')
bg(A('S12', 'one', 1) - 0.3)
C(A('S12', 'one', 1) - 0.2, A('S12', 'tony') - 0.3, 'One Nation co-founder', 'David Oldfield', body_size=64,
  sub='Had previously worked as an adviser to a young Liberal MP named Tony Abbott.')
portrait(A('S12', 'tony') - 0.3, 'abbott-official', 'Tony Abbott, official portrait')
C(A('S12', 'keep') - 0.2, END('S12') + 0.4, 'Keep this name in mind', 'Tony Abbott', body_size=64, sub='He comes back into Pauline Hanson’s story more than once.', width=820)

broll(END('S12') + 0.4, 'B05', src=4.0)
C(S('S13') + 0.1, A('S13', 'the', 0) - 0.3, 'June 1998', 'One Nation contested its first Queensland state election.')
bg(A('S13', 'the', 0) - 0.3)
ov(A('S13', 'the', 0) - 0.2, A('S13', 'four') - 0.3, lambda lt: G.stat('23%', 'Queensland, 1998', sub='The new party won almost twenty-three per cent of the vote, and eleven seats.', width=900), ('c',))
C(A('S13', 'four') - 0.2, END('S13') + 0.4, 'Four months later · federal election', 'One Nation ran 139 candidates.', pos=('tl', 110, 150), width=1000)
ov(A('S13', 'did') - 0.2, END('S13') + 0.4, lambda lt: G.stat('0', 'Lower-house seats won', width=700), ('tl', 110, 440))
ov(A('S13', 'pauline') - 0.2, END('S13') + 0.4, lambda lt: G.card('Oxley', 'Pauline Hanson lost her own seat as well.', width=820), ('tl', 950, 440))

# S14: Tony Abbott pin goes up on "working against One Nation" and stays to the end of S29
bg(END('S13') + 0.4, img='parliament-house-canberra', dim=0.35)
C(A('S14', 'tony') - 0.1, A('S14', 'in') - 0.3, 'At the same time', 'Tony Abbott was working against One Nation behind the scenes.', width=1000)
PIN = (A('S14', 'working'), END('S29') + 0.05)
ov(PIN[0], PIN[1], lambda lt: G.abbott_pin(), ('tl', 1460, 50), anim='slide', fout=0.3)
broll(A('S14', 'in') - 0.3, 'B07', src=2.5)
C(A('S14', 'in') - 0.2, A('S14', 'which') - 0.25, 'Confirmed in 2003', 'In 1998, Tony Abbott had set up a trust fund.')
bg(A('S14', 'which') - 0.25, img='parliament-house-canberra', dim=0.3)
ov(A('S14', 'which') - 0.2, A('S14', 'asked') - 0.3, lambda lt: G.stat('$100,000', 'Nearly, raised by the trust fund', sub='To support legal action against One Nation.', width=1000), ('c',))
SFX.append((A('S14', 'which') - 0.2, 'coin', -12, 'Coins as the trust-fund figure lands (in the pause before "which")'))
broll(A('S14', 'asked') - 0.3, 'B07', src=0.5)
C(A('S14', 'asked') - 0.2, A('S14', 'tony', 2) - 0.3, 'Asked on national television', 'Whether anyone else had been involved in the trust fund.')
C(A('S14', 'tony', 2) - 0.2, END('S14') + 0.5, 'His answer', 'He had been acting entirely on his own.', body_size=52)

# ================================================================== CHAPTER 4: COURT AND JAIL (tense)
t = END('S14') + 0.5
CH.append((t, 'Court, jail and appeal'))
bg(t)
TLN(t, A('S15', 'a') - 0.3, 1997, 1999, 'A court ruling', 'Chapter 4 · Court, jail and appeal')
broll(A('S15', 'a') - 0.3, 'B07', src=1.0)
C2(A('S15', 'a') - 0.2, A('S15', 'and') - 0.1, A('S15', 'by') - 0.3, '1999 · Queensland', 'A court found One Nation had been improperly registered as a party in Queensland.',
   'Pauline Hanson was ordered to repay the public election funding.')
bg(A('S15', 'by') - 0.3)
C(A('S15', 'by') - 0.2, END('S15') + 0.3, '2002', 'Pauline Hanson was out of the party she had founded.', body_size=52)
broll(END('S15') + 0.35, 'B08', src=0.3, rate=0.55)
SFX.append((END('S15') + 0.35, 'door', -10, 'Cell door shuts as B08 cuts in (in the gap before S16)'))
C(S('S16') + 0.1, A('S16', 'both') - 0.3, 'August 2003', 'A jury convicted Pauline Hanson and One Nation co-founder David Ettridge of electoral fraud.',
  sub='The convictions were later quashed on appeal.', accent=G.RED)
C(A('S16', 'both') - 0.2, A('S16', 'pauline', 1) - 0.3, 'Sentenced', 'Both were sentenced to three years in jail.',
  sub='The Queensland Court of Appeal later quashed their convictions.', accent=G.RED, body_size=50)
bg(A('S16', 'pauline', 1) - 0.3)
ov(A('S16', 'pauline', 1) - 0.2, A('S16', 'then') - 0.3, lambda lt: G.stat('11 weeks', 'In prison', sub='Pauline Hanson and David Ettridge each spent eleven weeks in prison. Then their convictions were quashed.', width=1000), ('c',))
broll(A('S16', 'then') - 0.3, 'B07', src=5.0)
C(A('S16', 'then') - 0.2, END('S16') + 1.4, 'Queensland Court of Appeal', 'The convictions of Pauline Hanson and David Ettridge were quashed.', pos=('tl', 110, 170))
QUASH = END('S16') + 0.12
ov(QUASH, END('S16') + 1.4, lambda lt: G.stamp('QUASHED', color=G.GOLD, size=110), ('tl', 640, 560), anim='stamp')
SFX.append((QUASH, 'gavel', -6, 'Gavel (used once in the film) as QUASHED lands, in the gap after S16'))
bg(END('S16') + 1.4)
C(S('S17') + 0.05, A('S17', 'and') - 0.3, 'Prime Minister', 'John Howard', body_size=64, sub='Called Pauline Hanson’s sentence excessive.')
ov(A('S17', 'and') - 0.2, END('S17') + 1.6, lambda lt: G.card('Tony Abbott wrote', 'He was sorry Pauline Hanson was in jail, but not sorry for trying to show that One Nation was never a “fair dinkum political party”.',
                                                          style='paper', width=1200, body_size=46), ('c',))
MIDROLL = [END('S17') + 1.4]

# ================================================================== CHAPTER 5: THE SENATE
t = END('S17') + 1.6
CH.append((t, 'Into the Senate'))
bg(t)
TLN(t, A('S18', 'she') - 0.3, 2003, 2016, 'More than a decade losing elections', 'Chapter 5 · Into the Senate', move=S('S18') + 6.0 - t)
photo(A('S18', 'she') - 0.3, 'hanson-2007-book-launch', kb=(1.0, .5, .5, 1.15, .5, .35), scrim='bottom')
LT(A('S18', 'she') - 0.1, A('S18', 'she', 1) - 0.3, 'Pauline Hanson, 2007', 'Launching her book')
C(A('S18', 'she', 1) - 0.2, A('S18', 'but') - 0.3, 'She even appeared on', 'Dancing with the Stars', pos=('lb', 960), body_size=52)
photo(A('S18', 'but') - 0.3, 'senate-chamber', kb=(1.0, .5, .5, 1.12, .5, .55))
C(A('S18', 'but') - 0.2, END('S18') + 0.4, '2016', 'Pauline Hanson was finally elected to the Senate.', sub='With three other One Nation senators elected alongside her.')

bg(END('S18') + 0.4)
_l19, _r19 = ('1996 · First speech', '“swamped by Asians”', G.GOLD), ('2016 · Senate first speech', '“swamped by Muslims”', G.RED)
ov(A('S19', 'in') - 0.2, A('S19', 'in', 1) - 0.2, lambda lt: G.split(_l19, _r19, reveal=1, source='Hansard'), ('c',), fout=0.0)
ov(A('S19', 'in', 1) - 0.2, A('S19', 'one') - 0.3, lambda lt: G.split(_l19, _r19, source='Hansard'), ('c',), anim='none', fin=0.15)
C(A('S19', 'one') - 0.2, END('S19') + 0.4, 'One academic article’s headline', '“Same refrain, new target”', style='paper', quote=True, body_size=70, width=1200,
  source='Academic article, listed in the description', pos=('c',))

photo(END('S19') + 0.4, 'senate-chamber', kb=(1.15, .5, .45, 1.25, .5, .5))
C(A('S20', 'in', 1) - 0.2, A('S20', 'in', 2) - 0.3, '2017', 'She wore a burqa into the Senate chamber to demand a national burqa ban.')
bg(A('S20', 'in', 2) - 0.3, img='senate-chamber', dim=0.25)
C(A('S20', 'in', 2) - 0.2, A('S20', 'the', 2) - 0.3, '2018 · Senate motion', '“It is OK to be white”', style='paper', quote=True, body_size=72, width=1100, pos=('c',))
_v20 = [('For the motion', 28, False), ('Against', 31, True)]
_n20 = 'Government senators voted for it, then said their votes were an administrative error.'
ov(A('S20', 'the', 2) - 0.2, A('S20', 'after') - 0.2, lambda lt: G.bars('Motion narrowly defeated, 28 votes to 31', _v20, 'Senate vote, 2018', p=lt / 1.4, unit='', maxv=36, note=_n20, show_note=False),
   ('tl', 110, 170), dyn=True, fout=0.0)
ov(A('S20', 'after') - 0.2, END('S20') + 0.4, lambda lt: G.bars('Motion narrowly defeated, 28 votes to 31', _v20, 'Senate vote, 2018', unit='', maxv=36, note=_n20), ('tl', 110, 170), anim='none', fin=0.0)
broll(END('S20') + 0.4, 'B10', src=0.0)
C(S('S21') + 0.1, A('S21', 'senator') - 0.2, 'Meanwhile', 'One Nation kept losing its own members of Parliament.')
C(A('S21', 'senator') - 0.1, END('S21') + 0.5, 'Senator after senator', 'Elected under Pauline Hanson’s name, quit the party or was expelled from it.')

# ================================================================== CHAPTER 6: THE FARUQI CASE (tense)
t = END('S21') + 0.5
CH.append((t, 'The Faruqi case'))
bg(t)
TLN(t, A('S22', 'began') - 0.2, 2016, 2022, 'A single social media post', 'Chapter 6 · The Faruqi case')
broll(A('S22', 'began') - 0.2, 'B11', src=0.0)
C(A('S22', 'began') - 0.1, Ae('S22', 'post') + 0.4, 'Her biggest legal fight in the Senate', 'Began with a single social media post.')
portrait(Ae('S22', 'post') + 0.45, 'faruqi-official', 'Mehreen Faruqi, official portrait')
SFX.append((Ae('S22', 'post') + 0.45, 'camera_shutter', -12, 'Shutter as the Faruqi portrait lands (in the pause)'))
C(A('S22', 'september') - 0.3, A('S22', 'greens') - 0.3, 'September 2022', 'On the day Queen Elizabeth the Second died.', width=820)
C(A('S22', 'greens') - 0.2, A('S22', 'pauline', 1) - 0.4, 'Greens senator Mehreen Faruqi', 'Born in Pakistan, she posted criticism of the monarchy’s colonial legacy.', width=820)
broll(A('S22', 'pauline', 1) - 0.4, 'B11', src=4.0, rate=0.6)
C(A('S22', 'pauline', 1) - 0.3, A('S22', 'telling') - 0.2, 'Pauline Hanson replied', 'To Mehreen Faruqi’s post.', pos=('tl', 110, 200))
C(A('S22', 'telling') - 0.15, END('S22') + 0.5, 'Pauline Hanson’s reply', '“pack your bags and p*ss off back to Pakistan”', style='paper', quote=True, body_size=62, width=1250,
  accent=G.RED, pos=('c',))
broll(END('S22') + 0.5, 'B07', src=2.0)
C(S('S23') + 0.05, A('S23', 'in') - 0.3, 'The lawsuit', 'Mehreen Faruqi sued Pauline Hanson over the post.')
bg(A('S23', 'in') - 0.3, img='law-courts-sydney', dim=0.3, kb=(1.0, .5, .55, 1.06, .5, .55))
C(A('S23', 'in') - 0.2, A('S23', 'in', 1) - 0.4, 'Federal Court · 2024', 'Pauline Hanson’s post had breached section 18C of the Racial Discrimination Act.',
  style='paper', width=1000, accent=G.RED)
photo(A('S23', 'in', 1) - 0.4, 'law-courts-sydney', kb=(1.0, .5, .3, 1.1, .5, .35))
C(A('S23', 'in', 1) - 0.3, A('S23', 'pauline', 2) - 0.4, 'July 2026', 'Three judges unanimously upheld the Federal Court’s decision.')
bg(A('S23', 'pauline', 2) - 0.4)
C2(A('S23', 'pauline', 2) - 0.3, A('S23', 'and') - 0.1, END('S23') + 1.6, 'The High Court', 'Pauline Hanson has applied to the High Court for special leave.',
   'That application has not yet been decided.', pos=('c',), width=1150, body_size=50)
MIDROLL.append(END('S23') + 1.4)

# ================================================================== CHAPTER 7: THE CLIMB
t = END('S23') + 1.6
CH.append((t, 'The climb to first place'))
bg(t)
TLN(t, A('S24', 'at') - 0.3, 2022, 2025, 'Popularity climbing', 'Chapter 7 · The climb')
broll(A('S24', 'at') - 0.3, 'B05', src=4.0)
C(A('S24', 'at') - 0.2, A('S24', 'in') - 0.3, '2025 federal election', 'One Nation grew to four senators.', body_size=52)
photo(A('S24', 'in') - 0.3, 'senate-chamber', kb=(1.2, .5, .6, 1.08, .5, .5))
C(A('S24', 'in') - 0.2, A('S24', 'this') - 0.3, 'November 2025', 'Pauline Hanson wore a burqa into the Senate chamber for a second time.')
bg(A('S24', 'this') - 0.3, img='senate-chamber', dim=0.22)
ov(A('S24', 'this') - 0.2, END('S24') + 0.5, lambda lt: G.bars('The Senate censured Pauline Hanson', [('For', 55, True), ('Against', 5, False)], 'Senate vote, November 2025',
                                                         p=lt / 1.6, unit='', maxv=60, note='Fifty-five votes to five.'), ('tl', 110, 120), dyn=True)
C(A('S24', 'and', 0) - 0.2, END('S24') + 0.5, 'Suspended', 'For seven sitting days.', pos=('tl', 110, 640), body_size=52, accent=G.RED)
portrait(END('S24') + 0.5, 'joyce-official', 'Barnaby Joyce, official portrait')
SFX.append((END('S24') + 0.5, 'camera_shutter', -12, 'Shutter as the Joyce portrait lands (in the gap)'))
C(S('S25') + 0.05, END('S25') + 0.5, 'Two weeks after the suspension', 'Former deputy prime minister Barnaby Joyce left the Nationals and joined One Nation.', width=820)

bg(END('S25') + 0.5)
C(A('S26', 'an') - 0.2, A('S26', 'the', 0) - 0.2, 'ABC report · February 2026', '“More people say they’ll vote One Nation”', style='paper', quote=True, body_size=64, width=1200,
  source='ABC', pos=('c',))
_t26 = A('S26', 'the', 0) - 0.2
_c26, _o26 = A('S26', 'coalition') - 0.1, A('S26', 'one', 2) - 0.1
ov(_t26, A('S26', 'in', 1) - 0.3, lambda lt: G.bars('Poll numbers in the ABC report', [('Coalition', 18, False), ('One Nation', 27, True)], 'ABC, February 2026',
                                                  ps=[(_t26 + lt - _c26) / 0.8, (_t26 + lt - _o26) / 0.8], maxv=32), ('c',), dyn=True)
bg(A('S26', 'in', 1) - 0.3, img='parliament-house-canberra', dim=0.3)
C(A('S26', 'in', 1) - 0.2, A('S26', 'senate') - 0.3, 'In the same month', 'Pauline Hanson said in an interview that there are no good Muslims, then partly walked the comment back.')
photo(A('S26', 'senate') - 0.3, 'senate-chamber', kb=(1.1, .45, .5, 1.2, .5, .5))
C2(A('S26', 'senate') - 0.2, A('S26', 'and', 1) - 0.1, END('S26') + 0.5, 'Censured again', 'The Senate censured Pauline Hanson again.',
   'This time, the Coalition voted against the censure.')

photo(END('S26') + 0.5, 'adelaide-skyline', kb=(1.0, .5, .5, 1.1, .45, .5), scrim='bottom')
LT(S('S27') + 0.1, A('S27', 'in', 2) - 0.3, 'Adelaide, South Australia', 'Photographed in 2022')
C(A('S27', 'one') - 0.2, A('S27', 'in', 2) - 0.3, 'March 2026 · South Australia', 'One Nation won four lower-house seats in the state election.', pos=('tl', 110, 140))
photo(A('S27', 'in', 2) - 0.3, 'albury-nsw', kb=(1.0, .5, .5, 1.12, .5, .45))
LT(A('S27', 'in', 2) - 0.2, A('S27', 'one', 1) - 0.2, 'Albury, NSW', 'Photographed in 2017')
C2(A('S27', 'one', 1) - 0.2, A('S27', 'a', 0) - 0.1, A('S27', 'abc') - 0.3, 'May 2026 · Farrer', 'One Nation won the federal seat of Farrer.',
   'A seat the Coalition had held for nearly eighty years.')
bg(A('S27', 'abc') - 0.3, img='albury-nsw', dim=0.3, kb=(1.12, .5, .45, 1.2, .5, .45))
C2(A('S27', 'abc') - 0.2, A('S27', 'because') - 0.1, END('S27') + 0.5, 'ABC', 'The ABC called the Farrer result historic.',
   'It was One Nation’s first ever win in the federal lower house.', style='paper', width=1100, pos=('c',))

bg(END('S27') + 0.5)
C(S('S28') + 0.1, END('S28') + 1.0, 'September 2026', 'Newspoll put One Nation in first place.', pos=('tl', 110, 90), width=1180, body_size=52)
_t28 = A('S28', 'one', 1) - 0.25
ov(_t28, END('S28') + 1.0, lambda lt: G.bars('Newspoll · primary vote', [('One Nation', 30, True), ('Labor', 27, False), ('Coalition', 19, False)], 'Newspoll, fieldwork 14–17 September 2026',
                                           ps=[(_t28 + lt - A('S28', 'one', 1)) / 0.9, (_t28 + lt - A('S28', 'labor')) / 0.9, (_t28 + lt - A('S28', 'coalition')) / 0.9], maxv=34),
   ('tl', 110, 380), dyn=True)

bg(END('S28') + 1.0, img='parliament-house-canberra', dim=0.3)
C(S('S29') + 0.05, A('S29', 'in') - 0.3, 'Tony Abbott', 'The Liberal MP who once funded legal action against One Nation has now changed his tune.')
C(A('S29', 'in') - 0.2, END('S29') + 0.05, 'ABC · June 2026', 'Tony Abbott now says that, as a general rule, parties of the right should preference each other.', style='paper', width=1150,
  pos=('tl', 110, 300))
bg(END('S29') + 0.1)
MIDROLL.append(END('S29') + 1.4)

# ================================================================== CHAPTER 8: ANALYSIS (labelled)
t = END('S29') + 1.6
CH.append((t, 'ANALYSIS: why One Nation rose'))
ov(t, END('S34') + 0.5, lambda lt: G.tag('ANALYSIS'), ('tl', 60, 46), anim='fade')
bg(t)
C2(S('S30') + 0.05, A('S30', "here's") - 0.1, END('S30') + 0.4, 'Analysis', 'How did Pauline Hanson and One Nation rise to the top of the polls?',
   'Our analysis, in three parts, based on the evidence.', pos=('c',), width=1150, body_size=52)
SFX.append((t + 0.05, 'whoosh', -8, 'Whoosh into the ANALYSIS chapter (in the gap)'))
photo(END('S30') + 0.4, 'parliament-house-canberra', kb=(1.1, .5, .5, 1.2, .5, .5))
C(S('S31') + 0.05, A('S31', 'according') - 0.3, 'Analysis · reason 1', 'Australia’s two major parties have shrunk.', body_size=56)
bg(A('S31', 'according') - 0.3)
ov(A('S31', 'according') - 0.2, END('S31') + 0.4, lambda lt: G.stat('46%', 'Labor and the Coalition together', sub='Their share of the primary vote, according to Newspoll.', source='Newspoll', width=1000),
   ('tl', 110, 120))
C(A('S31', 'and', 1) - 0.2, END('S31') + 0.4, 'And', 'The Coalition itself has split up and changed leaders.', pos=('tl', 1120, 330), width=700)
broll(END('S31') + 0.4, 'B12', src=0.0, rate=0.7)
C(S('S32') + 0.05, A('S32', 'coverage') - 0.3, 'Analysis · reason 2', 'Anger about the cost of living.', body_size=56)
C(A('S32', 'coverage') - 0.2, A('S32', 'and', 1) - 0.3, 'Coverage of the September Newspoll pointed to', 'Petrol prices\nInflation\nFears over interest rates')
bg(A('S32', 'and', 1) - 0.3)
ov(A('S32', 'and', 1) - 0.2, END('S32') + 0.4, lambda lt: G.stat('95%', 'of One Nation supporters', sub='believe Australia is heading in the wrong direction.', source='Roy Morgan', width=1000), ('c',))
portrait(END('S32') + 0.4, 'joyce-official', 'Barnaby Joyce, official portrait')
C(S('S33') + 0.05, A('S33', 'the', 1) - 0.3, 'Analysis · reason 3', 'Familiar political faces moved toward Pauline Hanson.', width=820)
bg(A('S33', 'the', 1) - 0.3)
C2(A('S33', 'the', 1) - 0.2, A('S33', 'and', 0) - 0.1, A('S33', 'and', 1) - 0.3, 'ABC', 'One Nation’s rise in the polls coincided with high-profile defections to the party.',
   'The ABC has called it the fastest polling rise in modern Australian politics.', style='paper', width=1150, pos=('c',))
photo(A('S33', 'and', 1) - 0.3, 'parliament-house-canberra', kb=(1.0, .5, .5, 1.1, .45, .55))
C(A('S33', 'and', 1) - 0.2, END('S33') + 0.4, 'Immigration', 'Pauline Hanson’s central issue is right at the top of the national debate.')
bg(END('S33') + 0.4)
C2(S('S34') + 0.05, A('S34', 'the', 0) - 0.1, A('S34', 'roy') - 0.3, 'But', 'Is One Nation’s rise really that simple?',
   'The same polls also show the limits of Pauline Hanson’s support.', pos=('c',), width=1100, body_size=56)
_t34 = A('S34', 'roy') - 0.2
ov(_t34, A('S34', 'news') - 0.3, lambda lt: G.bars('Roy Morgan estimate · after preferences', [('Labor', 54, False), ('One Nation', 46, True)], 'Roy Morgan', p=lt / 1.6, unit='', maxv=60,
                                                   note='Labor would still beat One Nation 54 to 46.'), ('c',), dyn=True)
ov(A('S34', 'news') - 0.2, A('S34', 'and', 0) - 0.3, lambda lt: G.stat('51%', 'of voters disapprove', sub='of Pauline Hanson herself.', source='Newspoll', width=900), ('c',))
bg(A('S34', 'and', 0) - 0.3, img='parliament-house-canberra', dim=0.25)
C2(A('S34', 'and', 0) - 0.2, A('S34', 'then') - 0.1, END('S34') + 0.5, 'Back in 1998 · Queensland', 'One Nation also reached 23 per cent of the vote.',
   'Then it fell apart within a few years.', pos=('c',), width=1050, body_size=52)

# ================================================================== CHAPTER 9: WHAT COULD HAPPEN (labelled)
t = END('S34') + 0.5
CH.append((t, 'WHAT COULD HAPPEN'))
ov(t, END('S35') + 0.4, lambda lt: G.tag('WHAT COULD HAPPEN'), ('tl', 60, 46), anim='fade')
bg(t)
TLN(t, A('S35', 'pauline', 1) - 0.3, 2025, 2026, 'What happens next?', 'Chapter 9 · What could happen')
photo(A('S35', 'pauline', 1) - 0.3, 'hanson-2016', kb=(1.0, .5, .5, 1.08, .53, .45), scrim='left')
C(A('S35', 'pauline', 1) - 0.2, A('S35', 'her') - 0.3, 'Age', 'Pauline Hanson is 72 years old.', body_size=56, pos=('lb', 960), width=700)
C(A('S35', 'her') - 0.2, A('S35', 'under') - 0.3, 'Her Senate term', 'Runs until mid-2028, around when the next federal election is due.', pos=('lb', 960), width=700)
C(A('S35', 'under') - 0.2, A('S35', 'and') - 0.3, 'Under One Nation’s rules', 'Pauline Hanson leads the party until she chooses to step down.', pos=('lb', 960), width=700)
bg(A('S35', 'and') - 0.3)
C(A('S35', 'and') - 0.2, A('S35', 'her', 2) - 0.3, 'In her own words', '“I’m at the end of my life.”', style='paper', quote=True, body_size=72, width=1100, pos=('c',))
C(A('S35', 'her', 2) - 0.2, END('S35') + 0.5, 'The High Court', 'Her application to the High Court for special leave has not yet been decided.', pos=('c',), width=1150, body_size=50)

# ================================================================== CHAPTER 10: THE PATTERN (sombre)
t = END('S35') + 0.5
CH.append((t, 'The pattern'))
bg(t)
C(S('S36') + 0.05, A('S36', 'put') - 0.3, 'The pattern', 'Pauline Hanson’s thirty years in politics.', pos=('c',), width=1100, body_size=56)
ov(A('S36', 'put') - 0.2, A('S36', 'put', 1) - 0.3, lambda lt: G.split(('1996 speech', '“swamped by Asians”', G.GOLD), ('2016 speech', '“swamped by Muslims”', G.RED), source='Hansard'), ('tl', 140, 150))
C(A('S36', 'and', 0) - 0.2, A('S36', 'put', 1) - 0.3, 'Her message', 'Almost exactly the same.', pos=('tl', 110, 620), body_size=52)
ov(A('S36', 'put', 1) - 0.2, A('S36', 'so', 1) - 0.3, lambda lt: G.split(('One Nation polls · 1998', 'Almost 23 per cent in Queensland', (170, 176, 186)), ('One Nation polls · 2026', '30 per cent in Newspoll', G.GOLD)),
   ('tl', 140, 150))
C(A('S36', 'and', 1) - 0.2, A('S36', 'so', 1) - 0.3, 'The country around Pauline Hanson', 'Looks very different.', pos=('tl', 110, 620), body_size=52)
photo(A('S36', 'so', 1) - 0.3, 'parliament-house-canberra', kb=(1.0, .5, .5, 1.14, .5, .45), dim=0.7)
C2(A('S36', 'so', 1) - 0.2, A('S36', 'her', 2) - 0.15, END('S36') + 0.5, 'The question', 'Did Pauline Hanson change Australia, or did Australia change around Pauline Hanson?',
   'Her supporters and her critics will answer that question very differently.', width=1150, body_size=52)
bg(END('S36') + 0.5)
C(S('S37') + 0.05, A('S37', 'every') - 0.3, 'Your turn', 'Tell us in the comments which answer you think is right.', pos=('c',), width=1100, body_size=52)
C(A('S37', 'every') - 0.2, A('S37', 'and') - 0.3, 'Sources', 'Every source used in this video is listed in the description, so you can check every fact yourself.', pos=('c',), width=1150)
broll(A('S37', 'and') - 0.3, 'B12', src=2.0, rate=0.7, xf=0.6)
C(A('S37', 'and') - 0.2, DUR - 0.6, 'Follow along', 'More evidence-based deep dives into Australian politics.', pos=('l', 540), width=900)
ov(E('S37') + 0.6, DUR - 0.6, lambda lt: G.credit('Jailed. Censured. Now #1.  ·  An independent documentary'), ('br', 1896, 1056), anim='fade')

# ------------------------------------------------------------------ tidy: shot ends, credits for every photo shot
SHOTS.sort(key=lambda s: s['t0'])
for i, s in enumerate(SHOTS):
    s['t1'] = SHOTS[i + 1]['t0'] if i + 1 < len(SHOTS) else DUR
    assert s['t1'] > s['t0'] + 0.2, ('shot too short', s)
    if s['kind'] == 'broll':
        assert s['src'] + (s['t1'] - s['t0']) * s['rate'] <= 10.0, ('B-roll runs past its end', s['bid'], s['t0'], s['src'] + (s['t1'] - s['t0']) * s['rate'])
        if s.get('srcmax'):
            assert s['src'] + (s['t1'] - s['t0']) * s['rate'] <= s['srcmax'], ('B04 runs into the pinned page', s['t0'])
    if s['kind'] in ('photo', 'portrait'):
        ov(s['t0'] + 0.3, s['t1'], lambda lt, c=CR[s['img']]: G.credit(c), ('br', 1896, 1056), anim='fade')

# nothing from the previous scene bleeds into a chapter timeline (the pin and chapter tags are not cards)
for o in OVR:
    for tc in TLN_STARTS:
        if o['t0'] < tc < o['t1'] and o['pos'] != ('tl', 1460, 50):
            o['t1'] = tc

# Abbott pin must sit inside S14 .. end of S29 only
assert S('S14') < PIN[0] < END('S14') and abs(PIN[1] - END('S29')) < 0.2

# ------------------------------------------------------------------ music: the bed changes with the scene
MUSIC = [
    # (key, t0, t1, src0, fade_in, fade_out, label)
    ('tense', 2.2, END('S03') + 0.6, 0.0, 3.0, 1.0, 'Tense: cold open'),
    ('inv', END('S03') + 0.0, END('S04') + 0.6, 20.0, 1.0, 1.0, 'Investigative: the independence note'),
    ('sombre', END('S04') + 0.2, END('S08') + 0.8, 0.0, 1.5, 1.2, 'Sombre piano: early life, the quiet beats'),
    ('inv', END('S08') + 0.3, END('S14') + 0.8, 0.0, 1.2, 1.0, 'Investigative: 1996, One Nation, the trust fund'),
    ('tense', END('S14') + 0.3, END('S17') + 1.9, 70.0, 1.0, 1.4, 'Tense: court, jail, convictions quashed (bed up in the mid-roll gap)'),
    ('inv', END('S17') + 1.5, END('S21') + 0.8, 40.0, 1.2, 1.0, 'Investigative: the Senate years'),
    ('tense', END('S21') + 0.3, END('S23') + 1.9, 125.0, 1.0, 1.4, 'Tense: the Faruqi case and the court'),
    ('inv', END('S23') + 1.5, S('S26') - 0.2, 95.0, 1.2, 1.0, 'Investigative: popularity climbing, censure, Joyce'),
    ('surge', S('S26') - 0.6, END('S28') + 1.2, 0.0, 1.5, 1.2, 'Surge: the poll climb to first place'),
    ('inv', END('S28') + 0.4, END('S34') + 0.8, 0.0, 1.5, 1.0, 'Investigative: Abbott, then the labelled ANALYSIS'),
    ('sombre', END('S34') + 0.3, DUR, 30.0, 1.5, 3.5, 'Sombre piano: what could happen, the pattern, outro'),
]

# ------------------------------------------------------------------ bleep
BLEEP = ('S22', 'piss')   # the audio word is bleeped; the card shows "p*ss"

if __name__ == '__main__':
    print(len(SHOTS), 'shots;', len(OVR), 'overlays;', len(SFX), 'effects; B-roll used:', sorted(B_USED))
    for t, n in CH:
        print(f'{t:8.2f}  {n}')
    print('mid-rolls (1x):', [round(m, 2) for m in MIDROLL])
