#!/usr/bin/env python3
"""Build the lf06 Ch1 timeline from the REAL voice files.

Reads audio/vo/S05..S13.mp3 (never modified), render/words.json (faster-whisper
small.en word timestamps, prompted with the VO text) and places every segment with
the script's holds and the 0.4 s Atlas<->Ara handover air. Every visual and sound
cue is resolved from a trigger word's real start time.

Output: render/timeline.json (absolute seconds on the 1x film clock).
"""
import json, subprocess, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
SEGS = ["S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13"]
SPEAKER = {"S05": "Ara", "S12": "Ara"}


def decode(path, sr=48000):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32)


def speech_bounds(x, sr=48000, thr_db=-42.0):
    hop = sr // 100
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    on = np.where(db > thr_db)[0]
    return on[0] * hop / sr, (on[-1] + 1) * hop / sr


def dur(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", path]).decode())


words = json.load(open(os.path.join(HERE, "words.json")))
info = {}
for s in SEGS:
    p = os.path.join(EP, "audio", "vo", s + ".mp3")
    x = decode(p)
    on, off = speech_bounds(x)
    info[s] = {"file": f"audio/vo/{s}.mp3", "dur": round(dur(p), 3), "on": round(on, 3), "off": round(off, 3),
               "speaker": SPEAKER.get(s, "Atlas")}

# ---- S10 split for the scripted 2.0 s "same event" HOLD -----------------------------
# Natural pause after "...Remembered in two opposite ways." (silence ~20.09-20.52 s in the
# file). The file is cut in that silence (no word touched) and the gap is widened so the
# narration-free hold is 2.0 s. The audio file itself is untouched.
S10_CUT = 20.30
S10_GAP_ORIG = 20.52 - 20.09
S10_INSERT = round(2.0 - S10_GAP_ORIG, 3)

# ---- placement: gap = silence between speech offset of one file and onset of the next --
OPEN_DISCLAIMER = 4.0
OPEN_CARD = 3.4          # chapter card (about 3 s) incl. its dissolve
S05_START = OPEN_DISCLAIMER + OPEN_CARD   # first word of S05
GAPS = {  # speech-offset -> next speech-onset (narration-free air / holds)
    "S05": 1.0,   # S05 HOLD 1.0 s (also the Ara->Atlas handover, >= 0.4 s)
    "S06": 0.6,   # S06 HOLD 0.5 s
    "S07": 1.5,   # S07 HOLD 1.5 s after "Australia" (MUS02 swell)
    "S08": 1.0,   # HOLD 1.0 s on the map
    "S09": 1.5,   # S09 HOLD 1.5 s
    "S10": 1.2,   # breath before S11 (music crossfade MUS06 -> MUS02)
    "S11": 0.4,   # Atlas -> Ara handover air
    "S12": 0.4,   # Ara -> Atlas handover air
}
END_HOLD = 3.6   # music-led closing hold incl. the fade to navy

place = {}
t_on = S05_START
for s in SEGS:
    i = info[s]
    file_start = t_on - i["on"]          # absolute time of file sample 0
    place[s] = {"file_start": round(file_start, 3)}
    extra = S10_INSERT if s == "S10" else 0.0
    off_abs = file_start + i["off"] + extra
    place[s]["speech_on"] = round(t_on, 3)
    place[s]["speech_off"] = round(off_abs, 3)
    if s in GAPS:
        t_on = off_abs + GAPS[s]
TOTAL = round(place["S13"]["speech_off"] + END_HOLD, 3)

# VO clips on the film clock (S10 in two parts)
clips = []
for s in SEGS:
    fs = place[s]["file_start"]
    if s == "S10":
        clips.append({"seg": s, "src": info[s]["file"], "in": 0.0, "out": S10_CUT, "at": fs})
        clips.append({"seg": s, "src": info[s]["file"], "in": S10_CUT, "out": info[s]["dur"],
                      "at": round(fs + S10_CUT + S10_INSERT, 3)})
    else:
        clips.append({"seg": s, "src": info[s]["file"], "in": 0.0, "out": info[s]["dur"], "at": fs})


def W(seg, word, nth=1):
    """Absolute start of the nth occurrence of `word` (case/punct-insensitive prefix match)."""
    k = 0
    for w in words[seg]:
        t = w["w"].lower().strip(".,?!'\"")
        if (word.endswith("*") and t.startswith(word[:-1].lower())) or t == word.lower():
            k += 1
            if k == nth:
                st = w["s"]
                if seg == "S10" and st >= S10_CUT:
                    st += S10_INSERT
                return round(place[seg]["file_start"] + st, 3)
    raise KeyError((seg, word, nth))


def WE(seg, word, nth=1):
    k = 0
    for w in words[seg]:
        t = w["w"].lower().strip(".,?!'\"")
        if (word.endswith("*") and t.startswith(word[:-1].lower())) or t == word.lower():
            k += 1
            if k == nth:
                e = w["e"]
                if seg == "S10" and w["s"] >= S10_CUT:
                    e += S10_INSERT
                return round(place[seg]["file_start"] + e, 3)
    raise KeyError((seg, word, nth))


# S07 "Australia": whisper puts it late; the beat's silence ends at 12.33 s in the file.
S07_AUS = round(place["S07"]["file_start"] + 12.33, 3)

cue = {
    # open
    "disclaimer_in": 0.0, "card_in": OPEN_DISCLAIMER, "s05_pic": S05_START - 0.35,
    # S05
    "november": W("S05", "november"), "un": W("S05", "the"), "general_assembly": W("S05", "general"),
    "new_york": W("S05", "new"), "s05_hold": place["S05"]["speech_off"],
    # S06
    "s06_pic": place["S06"]["speech_on"] - 0.15, "palestine_s06": W("S06", "palestine"),
    "chairing": W("S06", "and"), "an_australian": W("S06", "an"), "australian_word": W("S06", "australian"),
    "foreign_minister": W("S06", "foreign"), "evatt": W("S06", "evatt"), "doc": W("S06", "doc"),
    # S07
    "s07_pic": place["S07"]["speech_on"] - 0.2, "divide": W("S07", "divide"), "jewish_state": W("S07", "jewish"),
    "arab_state": W("S07", "arab"), "beat1": round(place["S07"]["file_start"] + 7.93, 3),
    "first_country": W("S07", "first"), "the_first": W("S07", "the", 3), "vote_yes": W("S07", "yes"),
    "is_": W("S07", "is", 2), "beat2": round(place["S07"]["file_start"] + 11.29, 3), "australia": S07_AUS,
    "s07_hold": place["S07"]["speech_off"],
    # S08
    "s08_pic": place["S08"]["speech_on"] - 0.25, "thirty_years": W("S08", "thirty"), "october": W("S08", "october"),
    "light_horsemen": W("S08", "australian"), "charged": W("S08", "charged"), "beersheba": W("S08", "beersheba"),
    "one_of_last": W("S08", "in"), "cavalry": W("S08", "cavalry"), "it_helped": W("S08", "it", 2),
    "road": W("S08", "road"), "jerusalem": W("S08", "jerusalem"), "british": W("S08", "and", 1),
    "s08_hold": place["S08"]["speech_off"],
    # S09
    "s09_pic": place["S09"]["speech_on"] - 0.3, "twice": W("S09", "twice"), "horseback": W("S09", "horseback"),
    "ballot": W("S09", "ballot"), "s09_hold": place["S09"]["speech_off"],
    # S10
    "s10_pic": place["S10"]["speech_on"] - 1.0, "rescue": W("S10", "rescue"), "for_palestinians": W("S10", "for", 2),
    "nakba": W("S10", "nakba"), "catastrophe": W("S10", "catastrophe"), "seven_hundred": W("S10", "seven"),
    "same_event": W("S10", "same"), "remembered2": W("S10", "remembered", 3),
    "same_hold_start": round(place["S10"]["file_start"] + 20.09, 3),
    "remember_idea": W("S10", "remember", 4) if False else None,
    "explains": W("S10", "explains"),
    # S11
    "s11_pic": place["S11"]["speech_on"] - 0.4, "sailed": W("S11", "sailed"), "melbourne": W("S11", "melbourne"),
    "holocaust": W("S11", "holocaust"), "per_person": W("S11", "per"), "palestinian": W("S11", "palestinian"),
    "sydneys": W("S11", "sydney*"), "south_west": W("S11", "south*"),
    # S12
    "s12_pic": place["S12"]["speech_on"], "today": W("S12", "today"), "one_hundred": W("S12", "one"),
    "jewish_aus": W("S12", "jewish"), "eight_hundred": W("S12", "eight"), "muslim_aus": W("S12", "muslim"),
    # S13
    "s13_pic": place["S13"]["speech_on"] - 0.2, "its_family": W("S13", "it's"), "australia_didnt": W("S13", "australia"),
    "start_clock": W("S13", "start"), "and_decades": W("S13", "and"), "wired": W("S13", "wired"),
    "never_heard": W("S13", "never"), "s13_end": place["S13"]["speech_off"], "total": TOTAL,
}
# "Remember that idea": 'remember' (not 'remembered') -> find exact token
for w in words["S10"]:
    if w["w"].lower().strip(".,") == "remember":
        st = w["s"] + (S10_INSERT if w["s"] >= S10_CUT else 0)
        cue["remember_idea"] = round(place["S10"]["file_start"] + st, 3)

out = {"fps": 30, "total": TOTAL, "segments": {s: {**info[s], **place[s]} for s in SEGS},
       "vo_clips": clips, "s10_insert": S10_INSERT, "s10_cut": S10_CUT, "cue": cue,
       "words_abs": {s: [{"w": w["w"], "s": round(place[s]["file_start"] + w["s"] + (S10_INSERT if s == "S10" and w["s"] >= S10_CUT else 0), 3)} for w in words[s]] for s in SEGS}}
json.dump(out, open(os.path.join(HERE, "timeline.json"), "w"), indent=1)
for s in SEGS:
    p = out["segments"][s]
    print(f"{s} {p['speaker']:5s} file {p['dur']:6.2f}s  speech {p['speech_on']:7.2f} -> {p['speech_off']:7.2f}")
print("TOTAL", TOTAL)
for k, v in cue.items():
    print(f"  {k:18s} {v}")
