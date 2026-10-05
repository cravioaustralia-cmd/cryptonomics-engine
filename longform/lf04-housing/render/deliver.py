"""lf04 delivery docs: chapter list + cue sheet, contact sheets, and the YouTube description draft."""
import os
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont

from design import EP, FPS

FINAL = os.path.join(EP, "final")
BUILD = os.path.join(EP, "build")
SPEED = 1.28
MASTER = os.path.join(FINAL, "lf04-housing.mp4")

CHAPTERS = [
    ("H0", "Cold open: the fourth rate rise"),
    ("S05", "Meet Sam and the three locks"),
    ("H1", "Suspect 1: The Reserve Bank"),
    ("H2", "Suspect 2: The tax rules for investors"),
    ("H3", "Suspect 3: The shortage of homes"),
    ("H4", "Analysis: Zoning"),
    ("H5", "Suspect 4: Population growth"),
    ("H6", "Suspect 5: The five per cent Deposit Scheme"),
    ("M3", "The board: none acted alone"),
    ("H7", "Analysis: Squeezed from every direction"),
    ("H8", "Analysis: The hardest suspect to talk about"),
    ("H9", "What could happen"),
    ("H10", "The verdict: you’ll be the jury"),
]

HOLD_NOTES = {
    "H0": "Open titles: series sting, F35 hyperlapse, IMG-25 Sydney skyline + title card",
    "H1": "F25 coins + IMG-02 RBA building + SUSPECT 1 card",
    "H2": "IMG-09 Treasury + IMG-16 sale signs + SUSPECT 2 card",
    "H3": "F14 crane + IMG-15 cranes + SUSPECT 3 card",
    "H4": "F03 suburb aerial + IMG-20 Box Hill + ANALYSIS / ZONING",
    "H5": "F24 airport aerial + NOM bar sting + SUSPECT 4 card",
    "H6": "F26 door + IMG-22 lender still + SUSPECT 5 card",
    "M3": "Mid-roll breath: F01 suburbs, no VO",
    "H7": "F06 / F02 aerials + three locks all cracked + ANALYSIS label",
    "H8": "IMG-23 Queenslander, soft piano",
    "H9": "F23 Parliament House exterior + IMG-02 + WHAT COULD HAPPEN label",
    "H10": "F35 hyperlapse + IMG-25 + THE VERDICT card",
    "END": "End card tail over IMG-25, music out",
}


def tc(t):
    m, s = divmod(int(t), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def tcf(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:05.2f}"


def chapters(c):
    blocks = {b["name"]: b for b in c.blocks}
    lines = ["# lf04 chapters — Who Killed the Aussie Dream?", "",
             f"Times are on the delivered master `final/lf04-housing.mp4` (whole film at **{SPEED}x**). "
             "The 1x edit time sits beside each one.", "",
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
              "Set these by hand in YouTube Studio. Each one sits in silence-for-VO picture, just after the last "
              "word of the segment and before the chapter hold. There are no other mid-rolls.", "",
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
            srcs = [s["src"] for s in c.shots if s["block"] == b["name"] and s.get("src")]
            note = "Picture: " + ", ".join(dict.fromkeys(srcs))
        lines.append(f"| {b['name']} | {tcf(b['t0'] / SPEED)} | {tcf(b['t1'] / SPEED)} | {tcf(b['t0'])} | "
                     f"{tcf(b['t1'])} | {note} |")
    lines += ["", "## Music cues (1x edit)", "", "| 1x in | 1x out | Track | Track offset |", "| --- | --- | --- | --- |"]
    for f, t0, t1, off, *_ in c.music:
        lines.append(f"| {tcf(t0)} | {tcf(t1)} | `{f}` | {off:.0f}s |")
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
        S = Image.new("RGB", (cols * tw, rows * (th + 26) + 70), (12, 15, 20))
        d = ImageDraw.Draw(S)
        d.text((16, 12), title, font=fh, fill=(238, 231, 216))
        for i, (t, label) in enumerate(items):
            im = grab(t).resize((tw - 6, th - 6))
            x, y = (i % cols) * tw, 70 + (i // cols) * (th + 26)
            S.paste(im, (x + 3, y + 3))
            d.text((x + 6, y + th), f"{label}  {tcf(t)}", font=f, fill=(232, 170, 62))
        S.save(out, quality=86)

    items = []
    for b in c.blocks:
        mid = (b["t0"] + b["t1"]) / 2 / SPEED
        items.append((mid, b["name"]))
    sheet(items, 6, 320, 180, os.path.join(FINAL, "contact-sheet.jpg"),
          "lf04 · WHO KILLED THE AUSSIE DREAM? · one frame per block (master 1.28x timecode)")
    items = []
    for i, s in enumerate(c.shots):
        mid = (s["t0"] + s["t1"]) / 2 / SPEED
        items.append((mid, f"{s['block']} {s.get('src') or 'graphic'}"))
    sheet(items, 8, 240, 135, os.path.join(FINAL, "contact-sheet-shots.jpg"),
          "lf04 · every shot (master 1.28x timecode)")


def description(c):
    used = set()
    for s in c.shots:
        if s.get("src"):
            used.add("F24" if s["src"] == "F24frame" else s["src"])
    used |= {"IMG-02", "IMG-16", "IMG-15", "F24", "IMG-10"}  # board thumbnails
    sfx_used = sorted({f for f, _, _ in c.sfx})
    music_used = sorted({m[0] for m in c.music})

    fc = open(os.path.join(EP, "footage", "CREDITS.md"), encoding="utf-8").read()
    foot = []
    for line in fc.splitlines():
        m = re.match(r"\| (F\d\d) \| ([^|]+) \| ([^|]+) \| (\S+) \|", line)
        if m and m.group(1) in used:
            foot.append(f"- {m.group(1)}: {m.group(2).strip()}, {m.group(3).strip()}, {m.group(4)}")
    ic = open(os.path.join(EP, "images", "CREDITS.md"), encoding="utf-8").read()
    imgs = []
    for line in ic.splitlines():
        m = re.match(r"- (IMG-\d\d): (.*)", line)
        if m and m.group(1) in used:
            imgs.append(f"- {m.group(1)}: {m.group(2)}")
    mc = open(os.path.join(EP, "audio", "MUSIC_CREDITS.md"), encoding="utf-8").read()
    mus = []
    for line in mc.splitlines():
        m = re.match(r"\| `audio/(music|sfx)/([^`]+)` \| [^|]+ \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (\S+) \|", line)
        if m and (m.group(2) in music_used or m.group(2) in sfx_used):
            mus.append(f"- {m.group(3).strip()} — {m.group(4).strip()}, {m.group(5).strip()}, {m.group(6)}")
    pc = open(os.path.join(EP, "script", "PUBLISH_CHECKS.md"), encoding="utf-8").read()
    srcs = [x.strip() for x in re.findall(r"^\d+\. (.+)$", pc[pc.index("## Primary sources"):], re.M)]
    blocks = {b["name"]: b for b in c.blocks}
    chap = [f"{tc(blocks[n]['t0'] / SPEED if n != 'H0' else 0)} {t}" for n, t in CHAPTERS]
    broll_used = sorted(x for x in used if x.startswith("B"))
    md = ["# lf04 YouTube description draft", "",
          "Draft only. Nothing has been uploaded. Check wording before publishing.", "", "```",
          "Who Killed the Aussie Dream? Five Suspects Behind Australia’s Housing Crisis", "",
          "Five suspects, the evidence for and against each one, and you’re the jury. "
          "Sam is a fictional example built from official numbers.", "",
          "CHAPTERS", *chap, "",
          "SOURCES (checked 5 October 2026, Australia/Sydney)", *[f"- {s}" for s in srcs], "",
          "DRAMATISED RECONSTRUCTION",
          f"- AI-generated B-roll ({', '.join(broll_used)}) is labelled on screen as a dramatised reconstruction. "
          "It shows no real people, faces, logos or readable text.", "",
          "FOOTAGE", *foot, "",
          "PHOTOS (Wikimedia Commons)", *imgs, "",
          "MUSIC AND SOUND", *mus, "- Series sting: original, made for this series.", "",
          "No ParlView, news-network, AAP or Getty material is used.", "```", ""]
    open(os.path.join(FINAL, "DESCRIPTION.md"), "w").write("\n".join(md))


if __name__ == "__main__":
    import sys

    import cut as C
    c = C.build()
    steps = sys.argv[1:] or ["chapters", "contact", "description"]
    for s in steps:
        globals()[s](c)
