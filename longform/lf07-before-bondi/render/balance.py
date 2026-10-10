#!/usr/bin/env python3
"""balance.py - measured equal-treatment table for BUILD_NOTES (durations from the plan, music level from the stem)."""
import sys, math, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import film, whisper_vo as WV
import numpy as np
film.ensure()
T = film.T
C = film.EV.CUES
s = T.seg
stem = film.EP / "build/stem_music.wav"


def lvl(t0, t1):
    a = WV.load(stem, t0, t1)
    return 20 * math.log10(math.sqrt(np.mean(a ** 2)) + 1e-9)


rows = []
def pair(moment, side_a, a0, a1, side_b, b0, b1, size, move, label, sfx):
    rows.append((moment, side_a, round(a1 - a0, 2), side_b, round(b1 - b0, 2), size, move, label, round(lvl(a0, a1), 1),
                 round(lvl(b0, b1), 1), sfx))

S = s("S15"); pair("S15 1948 memories", "PH03 Independence", S.start, S.end, "PH04 Nakba", S.start, S.end,
                   "958x1080 each", "same push 1.04→1.12", "same label chip", "none (quiet)")
S = s("S15"); pair("S15 labels", "1948 — INDEPENDENCE", C["S15.left_label"], S.end, "1948 — THE NAKBA", C["S15.left_label"], S.end,
                   "same chip", "fade 0.6 s, together", "same", "none")
S = s("S16"); pair("S16 migrant beats", "PH05 Melbourne", C["S16.melbourne"], C["S16.numbers"], "PH06c Sydney", C["S16.melbourne"],
                   C["S16.numbers"], "958x1080 each", "same push", "same city chip", "SFX05 −5 dB each flow line")
pair("S16 number rolls", "99,956 Jewish Australians", C["S16.numbers"], s("S16").end, "813,392 Muslim Australians",
     C["S16.numbers"], s("S16").end, "same type size", "same 1.1 s roll", "same", "8 × SFX06 −6 dB each")
S = s("S19"); pair("S19 two cases", "Critics' case", C["S19.left_card"], S.end, "Government's case", C["S19.left_card"], S.end,
                   "760x600 each", "same 0.32 s entrance", "Summary of public positions", "SFX18 +2 dB each")
S = s("S21"); pair("S21 scale cards", "Coalition / Israel's govt / Jewish groups", S.w("And it was attacked"), S.end, "APAN",
                   S.w("And it was attacked"), S.end, "760x560 each", "same 0.45 s drop", "Summary of public positions", "SFX21 −2 dB each")
S = s("S22"); pair("S22 portraits", "PH10 Netanyahu", C["S22.split"], S.end, "PH07 Albanese", C["S22.split"], S.end,
                   "958x1080 each", "same", "caption", "SPLIT whoosh")
pair("S22 quote cards", "QT08", C["S22.qt08"], s("S22").end, "QT09", C["S22.qt08"], s("S22").end, "840 wide, equal height",
     "same", "QT08 labelled recreation", "SFX17 on QT08 only (the post)")
S = s("S25"); pair("S25 quote cards", "QT03 Albanese", S.start + 0.1, S.end, "QT04 Netanyahu", S.start + 0.1, S.end,
                   "570 wide, equal height", "same 0.32 s entrance", "same card", "none")
pair("S25 quote cards", "QT05 Frankcom family", S.start + 0.1, S.end, "(third card, same)", S.start + 0.1, S.end,
     "570 wide, equal height", "same", "same card", "none")
S = s("S27"); pair("S27 loss on both sides", "PH18 (Israel)", S.start, S.w("Australia granted"), "PH19 (Gaza)", S.start,
                   S.w("Australia granted"), "958x1080 each", "same push", "caption", "none")
S = s("S32"); pair("S32 two cases", "Published names (recreation)", C["S32.split"], S.end, "DOC07 judgment", C["S32.split"] + 0.5,
                   S.end, "800 wide each", "same", "Recreation label", "SFX05 on lock")
S = s("S33"); pair("S33 charts", "ECAJ", S.w("Jewish groups") + 0.2, S.w("The government appointed"), "Islamophobia Register",
                   S.w("Jewish groups") + 0.2, S.w("The government appointed"), "800x760 each", "same 1.2 s rise", "source line each",
                   "SFX06 −1 dB each")
pair("S33 exteriors + envoys", "ST20 + Segal card", S.w("The government appointed"), S.end, "ST21 + Malik card",
     S.w("The government appointed"), S.end, "958x1080 each; 640x260 cards", "same", "same card", "SFX18 once")
S = s("S40"); pair("S40 two candles", "candle 1", S.w("The attack"), S.end, "candle 2", S.w("The attack"), S.end, "958x1080 each",
                   "same flicker", "-", "none")
S = s("S45"); pair("S45 montage split", "PH03", S.start + 1.25, S.start + 2.5, "PH04", S.start + 1.25, S.start + 2.5, "958x1080 each",
                   "same", "-", "none")
pair("S45 name cards", "Zomi Frankcom", S.start + 2.5, S.start + 3.75, "Ahmed al Ahmed", S.start + 2.5, S.start + 3.75,
     "same 58 px serif, same width", "same write-on", "same", "none")
S = s("S44"); pair("S44 grieving on both sides", "candle 1", C["S44.two_candles"], S.end, "candle 2", C["S44.two_candles"], S.end,
                   "958x1080 each", "same", "-", "none")
out = ["| Moment | Side A | A on screen (s) | Side B | B on screen (s) | Size | Move | Label frame | Music A (dBFS RMS) | Music B (dBFS RMS) | SFX |",
       "|---|---|---|---|---|---|---|---|---|---|---|"]
for r in rows:
    out.append("| " + " | ".join(str(x) for x in r) + " |")
Path(film.EP / "build/balance.md").write_text("\n".join(out) + "\n")
print("\n".join(out))
