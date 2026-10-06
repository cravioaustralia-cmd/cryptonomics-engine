"""lf05 delivery docs: chapter list + cue sheet, contact sheets, and the YouTube description draft."""
import os
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont

from design import EP

FINAL = os.path.join(EP, "final")
BUILD = os.path.join(EP, "build")
SPEED = 1.28
MASTER = os.path.join(FINAL, "lf05-albanese-hanson.mp4")
TITLE = "94 Seats vs 30%: Can Albanese Stop Pauline Hanson?"

CHAPTERS = [
    ("H0", "Opening: the question"),
    ("H1", "Part One · How strong is Anthony Albanese?"),
    ("H2", "Part Two · The rise of Pauline Hanson"),
    ("H3", "Part Three · What has actually changed?"),
    ("H4", "The Coalition"),
    ("H5", "Part Four · Albanese’s moves"),
    ("H6", "Part Five · Hanson’s moves"),
    ("H7", "Polls, seats and government"),
    ("H8", "The big comparison"),
    ("H9", "Ending · Can Albanese stop Pauline Hanson?"),
]

HOLD_NOTES = {
    "H0": "Open titles: series sting, F01 Parliament timelapse, Albanese + Hanson portraits (Hanson slides in), "
          "title card over Parliament House at dusk",
    "H1": "F19 Canberra aerial + Albanese portrait, gold thread, PART ONE card",
    "M1": "Mid-roll 1 beat: F28 Sydney aerial, no VO",
    "H2": "F02 Brisbane + Hanson portrait, orange-red thread, PART TWO card",
    "H3": "F46 Brisbane river + Ipswich photo, both threads, PART THREE card",
    "H4": "F45 Sydney CBD + Parliament House by day, THE COALITION card",
    "M2": "Mid-roll 2 beat: Albanese portrait, no VO",
    "H5": "F16 paperwork + B07 folder (AI, labelled), gold thread, PART FOUR card",
    "H6": "B03 phone (AI, labelled) + F44 AUD notes, orange-red thread, PART FIVE card",
    "M3": "Mid-roll 3 beat: F17 Canberra dusk, no VO",
    "H7": "B01 ballot + B08 count hall (AI, labelled), POLLS, SEATS AND GOVERNMENT card",
    "H8": "Albanese + Hanson portraits, F18 Canberra dusk, THE BIG COMPARISON card",
    "H9": "F18 / F17 Canberra dusk, both threads, ENDING card",
    "END": "End screen: Parliament House at dusk, FOLLOW card, sombre piano out",
}


def tc(t):
    m, s = divmod(int(t), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def tcf(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:05.2f}"


def shot_sources(s):
    out = []
    if s.get("src"):
        out.append(s["src"])
    if s.get("bg"):
        out.append(s["bg"])
    if s["kind"] == "d":
        out += list(s.get("names", []))
    if s["kind"] == "q":
        out += list(s.get("names", []))
    return out


def chapters(c):
    blocks = {b["name"]: b for b in c.blocks}
    lines = [f"# lf05 chapters — {TITLE}", "",
             f"Times are on the delivered master `final/lf05-albanese-hanson.mp4` (whole film at **{SPEED}x**, pitch "
             "held). The 1x edit time sits beside each one.", "",
             "## YouTube chapters (paste into the description)", "", "```"]
    for n, title in CHAPTERS:
        t = blocks[n]["t0"] / SPEED if n != "H0" else 0
        lines.append(f"{tc(t)} {title}")
    lines += ["```", "", "## Chapter table", "", "| Master (1.28x) | 1x edit | Starts at | Chapter |",
              "| --- | --- | --- | --- |"]
    for n, title in CHAPTERS:
        t = blocks[n]["t0"]
        lines.append(f"| {tcf(t / SPEED)} | {tcf(t)} | {n} | {title} |")
    lines += ["", "## Mid-roll ad breaks", "",
              "Set these by hand in YouTube Studio. Each one sits on a 0.6 s music-only beat (1x), just after the "
              "last word of the segment and before the next chapter hold. There are no other mid-rolls.", "",
              "| Master (1.28x) | 1x edit | After |", "| --- | --- | --- |"]
    for kind, label, t in c.markers:
        lines.append(f"| {tcf(t / SPEED)} | {tcf(t)} | {label} |")
    lines += ["", "## Cue sheet (every block)", "",
              "Holds carry no voiceover: picture keeps moving and the music bed rises. VO blocks hold one "
              "segment from `audio/vo/` at its original speed in the 1x edit.", "",
              "| Block | Master in | Master out | 1x in | 1x out | Notes |", "| --- | --- | --- | --- | --- | --- |"]
    for b in c.blocks:
        note = HOLD_NOTES.get(b["name"], "")
        if b["kind"] == "vo":
            srcs = []
            for s in c.shots:
                if s["block"] == b["name"]:
                    srcs += shot_sources(s) or ["graphic"]
            note = "Picture: " + ", ".join(dict.fromkeys(srcs))
        lines.append(f"| {b['name']} | {tcf(b['t0'] / SPEED)} | {tcf(b['t1'] / SPEED)} | {tcf(b['t0'])} | "
                     f"{tcf(b['t1'])} | {note} |")
    lines += ["", "## Music cues (1x edit)", "", "| 1x in | 1x out | Track | Track offset | Trim |",
              "| --- | --- | --- | --- | --- |"]
    for f, t0, t1, off, fi, fo, g in c.music:
        lines.append(f"| {tcf(t0)} | {tcf(t1)} | `{f}` | {off:.0f}s | {g:+d} dB |")
    lines += ["", "## Sound effects (1x edit, holds only)", "", "| 1x | File |", "| --- | --- |"]
    for f, t, g in sorted(c.sfx, key=lambda x: x[1]):
        lines.append(f"| {tcf(t)} | `{f}` |")
    open(os.path.join(FINAL, "chapters.md"), "w").write("\n".join(lines) + "\n")


def grab(t):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", MASTER, "-frames:v", "1",
                                   "-vf", "scale=480:270", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
    return Image.frombytes("RGB", (480, 270), raw[:480 * 270 * 3])


def contact(c):
    f = ImageFont.truetype(os.path.join(EP, "render", "fonts", "IBMPlexMono-Bold.ttf"), 18)
    fh = ImageFont.truetype(os.path.join(EP, "render", "fonts", "BigShoulders-Bold.ttf"), 44)

    def sheet(items, cols, tw, th, out, title):
        rows = (len(items) + cols - 1) // cols
        S = Image.new("RGB", (cols * tw, rows * (th + 26) + 70), (11, 14, 20))
        d = ImageDraw.Draw(S)
        d.text((16, 12), title, font=fh, fill=(240, 236, 226))
        for i, (t, label) in enumerate(items):
            im = grab(t).resize((tw - 6, th - 6))
            x, y = (i % cols) * tw, 70 + (i // cols) * (th + 26)
            S.paste(im, (x + 3, y + 3))
            d.text((x + 6, y + th), f"{label}  {tcf(t)}", font=f, fill=(212, 160, 23))
        S.save(out, quality=86)

    items = []
    for b in c.blocks:
        mid = (b["t0"] + (b["t1"] - b["t0"]) * 0.6) / SPEED
        items.append((mid, b["name"]))
    sheet(items, 6, 320, 180, os.path.join(FINAL, "contact-sheet.jpg"),
          "lf05 · 94 SEATS VS 30% · one frame per block (master 1.28x timecode)")
    items = []
    for s in c.shots:
        mid = (s["t0"] + s["t1"]) / 2 / SPEED
        src = s.get("src") or {"d": "duo", "q": "polaroids", "c": "graphic"}.get(s["kind"], "graphic")
        items.append((mid, f"{s['block']} {src.replace('IMG-', '')[:16]}"))
    sheet(items, 8, 240, 135, os.path.join(FINAL, "contact-sheet-shots.jpg"),
          "lf05 · every shot (master 1.28x timecode)")


def _cells(line):
    line = line.replace("\\ |", "¦").replace("\\|", "¦")
    return [x.strip().replace("¦", "|") for x in line.strip().strip("|").split("|")]


def used_media(c):
    used = set()
    for s in c.shots:
        used |= set(shot_sources(s))
    return used


def description(c):
    used = used_media(c)
    sfx_used = sorted({f for f, _, _ in c.sfx})
    music_used = sorted({m[0] for m in c.music})

    foot = []
    for line in open(os.path.join(EP, "footage", "CREDITS.md"), encoding="utf-8"):
        if re.match(r"\| F\d\d \|", line):
            k = _cells(line)
            if k[0] in used:
                foot.append(f"- {k[0]}: “{k[2]}” by {k[3]}, {k[4]}, {k[5]}")
    imgs = []
    for line in open(os.path.join(EP, "images", "CREDITS.md"), encoding="utf-8"):
        m = re.match(r"\| (IMG-[\w-]+)\.(jpg|png) \|", line)
        if m and m.group(1) in used:
            k = _cells(line)
            lic = re.sub(r"\s*\(`.*$", "", k[4]).strip()
            lic = lic.split(". ")[0].rstrip(".")
            imgs.append(f"- {k[2].split('.')[0]}: {k[3]}, {lic}, via Wikimedia Commons, {k[5]}")
    mus = []
    for line in open(os.path.join(EP, "audio", "MUSIC_CREDITS.md"), encoding="utf-8"):
        m = re.match(r"\| `audio/(music|sfx)/([^`]+)` \|", line)
        if m and (m.group(2) in music_used or m.group(2) in sfx_used) and m.group(2) != "series_sting.flac":
            k = _cells(line)
            if m.group(1) == "music":
                mus.append(f"- Music: “{k[2]}” by {k[3]}, {k[4]}, {k[5]}")
            else:
                lic = k[4].split(". ")[0].split(", as stated")[0].rstrip(".")
                mus.append(f"- Sound: “{k[2]}” by {k[3]}, {lic}, {k[5]}")
    pc = open(os.path.join(EP, "script", "PUBLISH_CHECKS.md"), encoding="utf-8").read()
    sec = pc[pc.index("## Sources"):]
    sec = sec[:sec.index("Not independently")] if "Not independently" in sec else sec
    srcs = [x.strip() for x in re.findall(r"^\d+\. (.+)$", sec, re.M)]
    blocks = {b["name"]: b for b in c.blocks}
    chap = [f"{tc(blocks[n]['t0'] / SPEED if n != 'H0' else 0)} {t}" for n, t in CHAPTERS]
    broll_used = sorted(x for x in used if x.startswith("B"))
    md = ["# lf05 YouTube description draft", "",
          "Draft only. Nothing has been uploaded. Check wording, the upload-day rechecks in "
          "`script/PUBLISH_CHECKS.md`, and the media-lawyer review before publishing.", "", "```",
          TITLE, "",
          "Anthony Albanese won the biggest election victory in Australian history. Sixteen months later, "
          "Newspoll put Pauline Hanson’s One Nation ahead of Labor. This independent documentary looks at the "
          "evidence on both sides: what is a fact, what is a claim, and what is someone’s analysis.", "",
          "We’re not affiliated with any political party. Every poll is a snapshot, not a verdict.", "",
          "CHAPTERS", *chap, "",
          "SOURCES (checked 6 October 2026, Australia/Sydney)", *[f"- {s}" for s in srcs], "",
          "NOTE ON PAULINE HANSON’S 2003 CONVICTION",
          "- Hanson was convicted of electoral fraud and jailed in 2003. The conviction was overturned on appeal.", "",
          "DRAMATISED RECONSTRUCTION",
          f"- AI-generated B-roll ({', '.join(broll_used)}) is labelled on screen as a dramatised reconstruction. "
          "It shows no real people, faces, flags, logos or readable text.", "",
          "FOOTAGE (muted)", *foot, "",
          "PHOTOS", *imgs, "",
          "MUSIC AND SOUND", *mus, "- Series sting: original, made for this series.", "",
          "No ParlView, news-network, AAP or Getty material is used. Evidence cards are recreated in our own design.",
          "```", ""]
    open(os.path.join(FINAL, "DESCRIPTION.md"), "w").write("\n".join(md))


if __name__ == "__main__":
    import sys

    import cut as C
    c = C.build()
    steps = sys.argv[1:] or ["chapters", "contact", "description"]
    for s in steps:
        globals()[s](c)
