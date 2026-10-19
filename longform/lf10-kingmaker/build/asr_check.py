#!/usr/bin/env python3
"""Compare Whisper transcripts with the vo-paste narration, word by word.

usage: asr_check.py <asr_dir> [--prefix S]   (asr_dir holds Snn.json from Whisper)
Numbers are spelled out on both sides so "1975" and "nineteen seventy-five" compare equal.
"""
import difflib, json, os, re, sys

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
ORD = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth", "nine": "ninth", "twelve": "twelfth", "twenty": "twentieth", "thirty": "thirtieth", "forty": "fortieth"}


def say(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " and " + say(n % 100))
    if n < 1_000_000:
        return say(n // 1000) + " thousand" + ("" if n % 1000 == 0 else (" and " if n % 1000 < 100 else " ") + say(n % 1000))
    return say(n // 1_000_000) + " million" + ("" if n % 1_000_000 == 0 else " " + say(n % 1_000_000))


def year(n):
    hi, lo = divmod(n, 100)
    if lo == 0:
        return say(hi) + " hundred"
    if lo < 10:
        return say(hi) + " oh " + say(lo)
    return say(hi) + " " + say(lo)


def ordinal(words):
    parts = words.split()
    last = parts[-1]
    parts[-1] = ORD.get(last, last + "th")
    return " ".join(parts)


def spell(text):
    t = text.replace("’", "'").replace("–", " ").replace("—", " ")
    t = re.sub(r"\$(\d[\d,.]*)\s*(million|billion)?", lambda m: m.group(1) + (" " + m.group(2) if m.group(2) else "") + " dollars", t)
    t = re.sub(r"(\d+)(st|nd|rd|th)\b", lambda m: ordinal(say(int(m.group(1)))), t)
    t = re.sub(r"(\d+(\.\d+)?)%", lambda m: m.group(1) + " percent", t)

    def num(m):
        s = m.group(0).replace(",", "")
        n = int(s)
        if 1900 <= n <= 2099 and "," not in m.group(0):
            return year(n)
        return say(n)

    t = re.sub(r"\d+(?:,\d{3})*", num, t)
    t = t.replace("-", " ")
    return t


def toks(text):
    out = []
    for w in spell(text).lower().split():
        w = re.sub(r"[^a-z0-9àé']", "", w).replace("'", "")
        if w:
            out.append(w)
    return out


def script_text(sid):
    raw = open(os.path.join(EP, "vo-paste", f"{sid}_ATLAS.txt"), encoding="utf-8").read()
    return raw.split("Speak only the narration below:", 1)[1]


def main():
    asr_dir = sys.argv[1]
    total_ref = total_err = 0
    report = []
    for i in range(1, 46):
        sid = f"S{i:02d}"
        hyp = json.load(open(os.path.join(asr_dir, f"{sid}.json")))["text"]
        a, b = toks(script_text(sid)), toks(hyp)
        sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
        diffs = []
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op != "equal":
                diffs.append(f"{op}: script '{' '.join(a[i1:i2])}' -> asr '{' '.join(b[j1:j2])}'")
                total_err += max(i2 - i1, j2 - j1)
        total_ref += len(a)
        report.append((sid, len(a), diffs))
    for sid, n, diffs in report:
        print(f"{sid} ({n} words): {'OK' if not diffs else ''}")
        for d in diffs:
            print("   ", d)
    print(f"TOTAL words {total_ref}, word differences {total_err} ({100 * total_err / total_ref:.2f}%)")


if __name__ == "__main__":
    main()
