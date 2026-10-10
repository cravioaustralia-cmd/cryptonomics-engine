#!/usr/bin/env python3
"""Write final/chapters.md: the cue sheet on the real film clock (1x review cut and 1.28x master)."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
TL = json.load(open(os.path.join(HERE, "timeline.json")))
C = TL["cue"]
S = TL["segments"]
SPEED = 1.28


def ts(t, frac=True):
    m, s = divmod(max(t, 0), 60)
    return f"{int(m)}:{s:05.2f}" if frac else f"{int(m)}:{int(s):02d}"


def row(label, t, note=""):
    return f"| {label} | {ts(t)} | {ts(t / SPEED)} | {note} |"


L = ["# lf06 Ch1: cue sheet and chapter markers", "",
     "All times are measured on the rendered cut (voice placed from the real files; cues on the real word starts).",
     f"1x review cut runs **{ts(TL['total'])}**; the 1.28x master runs **{ts(TL['total'] / SPEED)}**.", "",
     "## YouTube chapter markers (1.28x master, standalone pilot)", "",
     "Paste into the description. YouTube needs the first marker at 0:00 and each chapter at least 10 s long.", "", "```"]
yt = [(0.0, "Chapter 1: The Vote Australia Cast First"), (C["s08_pic"], "Beersheba, 1917"),
      (C["s10_pic"], "Two memories of 1948"), (C["s11_pic"], "Both memories sailed to Australia")]
for t, name in yt:
    L.append(f"{ts(t / SPEED, False)} {name}")
L += ["```", "",
      "In the full film this chapter starts at about 1:17 (script). When the chapters are joined, the marker becomes `1:17 Chapter 1: The Vote Australia Cast First` (re-time after the full assembly).", "",
      "## Segments", "", "| Segment | Speaker | Voice file | 1x speech | 1.28x speech |", "|---|---|---|---|---|"]
for s, v in S.items():
    L.append(f"| {s} | {v['speaker']} | {v['file']} ({v['dur']:.2f} s) | {ts(v['speech_on'])} to {ts(v['speech_off'])} | {ts(v['speech_on'] / SPEED)} to {ts(v['speech_off'] / SPEED)} |")
L += ["", f"S10 is split in its own silence after \"...two opposite ways.\" and widened by {TL['s10_insert']:.2f} s for the scripted 2.0 s hold (no word touched; file untouched).",
      "Handover air (speech end to speech start): S05 to S06 1.00 s (the S05 hold), S11 to S12 0.40 s, S12 to S13 0.40 s.", "",
      "## Cue sheet", "", "| Cue | 1x | 1.28x | Picture / sound |", "|---|---|---|---|"]
cues = [
    ("Disclaimer card", 0.0, "MUS12 motif starts"), ("Chapter card", C["card_in"], "SFX07 projector starts; MUS02 fades in under the motif tail at 0:06"),
    ("S05 PH26 PAN", C["s05_pic"], "flicker overlay; caption UN General Assembly, 1947"), ("\"November\"", C["november"], "split-flap NOV 1947 (SFX06 ticks)"),
    ("\"The United Nations\"", C["un"], "FT05b cutaway, captioned Lake Success, New York, 1946"), ("\"General Assembly\"", C["general_assembly"], "world inset in"),
    ("\"New York\"", C["new_york"], "locator dot (SFX05)"), ("S05 hold", C["s05_hold"], "DOC01 page lands (SFX18)"),
    ("S06 UN plan map (A/516 Annex A, cropped)", C["s06_pic"], "PAN; amber underline on \"Palestine\""), ("\"And chairing\"", C["chairing"], "DROP PH01b (SFX12)"),
    ("\"an Australian\"", C["an_australian"], "DROP PH01 (SFX12); kinetic AUSTRALIAN (SFX06)"), ("\"Foreign Minister\"", C["foreign_minister"], "lower third H.V. \"Doc\" Evatt, Australian Foreign Minister"),
    ("\"Doc\"", C["doc"], "callout Chair, UN Ad Hoc Committee on Palestine (pop)"), ("S07 ZOOM DOC01", C["s07_pic"], "dive to 181 (II); highlighter; DOC01 card"),
    ("\"divide the land\"", C["divide"], "MAP03 splits, Jerusalem ring (SFX05)"), ("\"Jewish state\"", C["jewish_state"], "both state labels, same frame"),
    ("beat 1", C["beat1"], "map holds and pushes in"), ("\"the first country\"", C["the_first"], "roll call: Afghanistan No, Argentina Abstain, Australia Yes (SFX06)"),
    ("beat 2", C["beat2"], "creep in on the Australia row"), ("\"Australia\"", C["australia"], "amber CIRCLE (SFX20 stretched); DOC02 card; A/PV.128 excerpt"),
    ("S07 hold", C["s07_hold"], "MUS02 swells about +3 dB"), ("S08 ST06 desert", C["s08_pic"], "blowing-sand layer"),
    ("\"Thirty years earlier\"", C["thirty_years"], "AI03 with Dramatised reconstruction label"), ("\"Australian Light Horsemen\"", C["light_horsemen"], "FT02 Beersheba, 1917"),
    ("\"charged\"", C["charged"], "MAP02 dotted arrow (SFX16 hooves)"), ("\"Beersheba\"", C["beersheba"], "split-flap OCT 1917; pin (SFX21)"),
    ("\"in one of the last\"", C["one_of_last"], "PH02 PAN + STACK PH02b, PH02c (SFX12 per photo)"), ("\"road to Jerusalem\"", C["road"], "line to Jerusalem (SFX05)"),
    ("\"and to the British rule\"", C["british"], "FT02c Jerusalem, December 1917"), ("S08 hold", C["s08_hold"], "back on MAP02"),
    ("S09 SPLIT", C["s09_pic"], "PH02 | voting sheet slide in and lock (SFX05 + tick)"), ("\"horseback\"", C["horseback"], "left brightens"),
    ("\"ballot\"", C["ballot"], "right brightens (SFX19, low)"), ("S10 SPLIT (quiet moment)", C["s10_pic"], "MUS02 to MUS06, 3 s equal-power"),
    ("\"Nakba\"", C["nakba"], "BOTH labels, same frame"), ("\"seven hundred thousand\"", C["seven_hundred"], "700,000+ roll with UNCCP source tag (SFX06 soft)"),
    ("\"The same event\"", C["same_event"], "split line glows amber"), ("S10 hold (2.0 s)", C["same_hold_start"], "bed rises"),
    ("\"Remember that idea\"", C["remember_idea"], "split becomes card 1 TWO MEMORIES; pin (SFX21)"), ("S11 AI05", C["s11_pic"], "MUS06 to MUS02 warm, 3 s; Dramatised reconstruction label"),
    ("\"sailed\"", C["sailed"], "flow line 1 Europe to Melbourne (SFX05)"), ("\"Melbourne\"", C["melbourne"], "DROP PH05 (SFX12)"),
    ("\"Holocaust survivors\"", C["holocaust"], "Melbourne pin glows"), ("\"per person\"", C["per_person"], "DROP PH05 inset (Port Melbourne, 1954)"),
    ("\"Palestinian, Lebanese\"", C["palestinian"], "DROP PH06 Lakemba (SFX12)"), ("\"south-west\"", C["south_west"], "flow line 2 Middle East to Sydney (SFX05, same gain); Sydney pin glows on arrival"),
    ("\"one hundred thousand\"", C["one_hundred"], "left roll to About 100,000 (SFX06 x10)"), ("\"eight hundred thousand\"", C["eight_hundred"], "right roll to 800,000+ (identical ticks)"),
    ("S13 globe", C["s13_pic"], "Thread draws Sydney to Gaza; 14,000 km"), ("\"Australia didn't just watch\"", C["australia_didnt"], "node 1 1947 VOTE lights"),
    ("\"start the clock\"", C["start_clock"], "clock hand ticks once (SFX06)"), ("\"wired into the war\"", C["wired"], "MUS02 out 2 s, MUS03 in; SFX10 hum starts rising; pulse runs along the Thread"),
    ("\"never heard of\"", C["never_heard"], "board: card 2 1947 VOTE pins, string to TWO MEMORIES (SFX21)"), ("End hold", C["s13_end"], "globe, Thread glowing, MUS03 + SFX10; fade to navy"),
    ("End", C["total"], ""),
]
for a, t, n in cues:
    L.append(row(a, t, n))
open(os.path.join(EP, "final", "chapters.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L[:16]))
