#!/usr/bin/env python3
"""Write final/DESCRIPTION.md: disclaimer, chapters for both cuts, sources, credits actually used."""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(EP))
tl = json.load(open(os.path.join(REPO, "src", "lf10", "timeline.json")))
plan = json.load(open(os.path.join(HERE, "out", "plan.json")))
used_audio = json.load(open(os.path.join(HERE, "out", "audio_used.json")))


def table_rows(path):
    rows = {}
    for line in open(path, encoding="utf-8"):
        if not line.startswith("| ") or line.startswith("| ID") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        rows[cells[0]] = cells
    return rows


assets = table_rows(os.path.join(EP, "assets-list", "ASSET_LIST.md"))
audio = table_rows(os.path.join(EP, "audio", "MUSIC_CREDITS.md"))


def ts(t):
    t = int(t)
    return f"{t // 60}:{t % 60:02d}"


# ---------------------------------------------------------------- chapters
chap = [(c["t"], c["title"]) for c in plan["chapters"]]
s45 = next(v for v in plan["vo"] if v["seg"] == "S45")
outro_t = next(h["t"] for h in plan["holds"] if h["name"] == "beat after pencil")
chap.append((outro_t, "Outro: who holds the power?"))
chap.sort()
chap[0] = (0.0, chap[0][1])

# ---------------------------------------------------------------- credits actually used
srcs = []
for s in tl["shots"]:
    if s.get("src"):
        sid = re.sub(r"(_tall)?\.(png|jpg)$", "", s["src"])
        if sid not in srcs:
            srcs.append(sid)
for o in tl["overlays"]:
    for pm in (o.get("props") or {}).get("pms", []):
        sid = re.sub(r"\.(png|jpg)$", "", pm["src"])
        if sid not in srcs:
            srcs.append(sid)

photos, footage, docs, ai = [], [], [], []
for sid in srcs:
    r = assets.get(sid)
    if not r:
        raise SystemExit(f"no asset row for {sid}")
    _, file, _, url, lic, credit, _, _ = r[:8]
    line = f"- {credit} · {lic} · {url}"
    if sid.startswith("BR_AI_"):
        ai.append(sid)
    elif sid.startswith("DOC_"):
        docs.append(f"- {credit} · {lic} · {url}")
    elif sid.startswith("IMG_") or file.endswith(".jpg"):
        photos.append(line)
    else:
        footage.append(line)

music = []
for m in used_audio["music"]:
    r = audio[m]
    note = r[7]
    title = re.search(r"\(([^;]+?), ([^;]+?)(;|\))", note)
    if r[5] != "Mixkit":
        music.append(f"- \"{r[5].split(' (')[0]}\" by {r[5].split(' - ')[-1]} · {r[4].split(' (')[0]} · {r[3]}")
    elif title:
        music.append(f"- \"{title.group(1)}\" by {title.group(2)} · Mixkit · Mixkit Stock Music Free License")
SFX_CRED = {  # reused effects, traced through lf09 ASSET_LIST / SFX_CREDITS and lf07/lf08 MUSIC_CREDITS
    "SFX_bass_impact": "\"Drum deep impact\" · Mixkit · Mixkit Sound Effects Free License",
    "SFX_clock_ticks": "Tick built from \"Human single heart beat\" · Mixkit · Mixkit Sound Effects Free License",
    "SFX_crowd_murmur": "\"City downtown crowd ambience\" · Mixkit · Mixkit Sound Effects Free License",
    "SFX_drone_low": "\"Deep haunting drone\" by Dragon Studio · Pixabay Content License",
    "SFX_gavel": "\"Gavel of Justice\" by IntrepidMedia · Pixabay Content License",
    "SFX_heartbeat": "\"Heartbeat sound\" by Dragon Studio · Pixabay Content License",
    "SFX_shutter": "\"Camera shutter click\" · Mixkit · Mixkit Sound Effects Free License",
    "SFX_stamp": "\"traditional stamp.wav\" by I.fekry (Freesound #470710) · CC0",
    "SFX_typewriter": "\"Data input on typewriter\" · Mixkit · Mixkit Sound Effects Free License",
    "SFX_whoosh_set": "\"Air woosh\" · Mixkit · Mixkit Sound Effects Free License",
}
sfx = []
for s_ in used_audio["sfx"]:
    r = audio.get(s_)
    if s_ in SFX_CRED:
        sfx.append(f"- {SFX_CRED[s_]}")
    elif r:
        name, _, who = r[5].partition(" - ")
        sfx.append(f"- \"{name}\" · {who} · {r[4]}")
    else:
        raise SystemExit(f"no credit for {s_}")

dur1 = tl["duration"]
dur128 = dur1 / 1.28

md = []
md.append("# Who Really Runs Australia? The Hunt for the Kingmaker\n")
md.append("Paste-ready YouTube description. Two cuts share one description; use the chapter list that matches the upload.\n")
md.append("---\n")
md.append("**Who really decides who runs Australia?** Media barons, mining billionaires, the faceless men of the factions, preference whisperers, the new teal kingmakers… and the rulebook that changes again from 1 July 2026. We line up six suspects, one by one, and look at the evidence for each. Then we reveal the kingmaker almost nobody talks about.\n")
md.append("## Chapters (1× cut, " + ts(dur1) + ")\n")
md += [f"{ts(t)} {name}" for t, name in chap]
md.append("\n## Chapters (1.28× cut, " + ts(dur128) + ")\n")
md += [f"{ts(t / 1.28)} {name}" for t, name in chap]
md.append("""
## Disclaimer

This is an independent, educational documentary. It is not affiliated with, endorsed by or paid for by any political party, candidate, media company, union, lobby group or government body.

- Claims about Malcolm Turnbull's 2018 downfall are presented as his view. News Corp has always rejected claims like these.
- Short clips labelled "Dramatised reconstruction · AI-generated" are illustrative reconstructions made with Grok Imagine. They contain no real people. No real person in this film was generated or altered by AI; every real person is shown only in a real, freely licensed photo.
- Footage labelled "Illustrative" or "Stand-in" is generic or from another place or time and is used to illustrate, not to show the actual event (for example an overseas street crowd, a South African ore train, a gold mine standing in for iron ore, and a 2016 Senate ballot rendering standing in for 2013).
- Where no free-licence photo exists (Kerry Packer, Glenn Druery, Lachlan Murdoch), a name card is used instead.
- Paraphrased statements are labelled as paraphrase. Figures are rounded as spoken and sourced on screen.
- Electoral law: changes began on 1 July 2026, and national caps on donations and election spending apply from 1 January 2027 (Australian Electoral Commission). Check the AEC for any later changes.
- Information is accurate to the best of our knowledge as of October 2026.

## Sources

- Patricia Edgar, "The press and the Dismissal – Part II"; Macquarie University; AustLit (75 journalists' letter; strike voted 8 December 1975; first strike over editorial coverage)
- Murdoch on A Current Affair, 1977, quoted by Patricia Edgar (journalists as the biased ones)
- Al Jazeera / AFP, 2020; The New Daily, 9 November 2020 (501,876 signatures; largest e-petition)
- Parliament of Australia, e-petition EN1938: https://www.aph.gov.au/e-petitions/petition/EN1938
- SBS News, 2020 (Turnbull backed the petition)
- News Corp announcement via AdNews, 9 September 2025; Axios, 8 September 2025 (Lachlan Murdoch in control; trust to 2050)
- Nieman Lab / WSJ, 21 September 2023 (Rupert Murdoch stepped down as chairman)
- AEC figures reported by the Sydney Morning Herald, February 2011; The Conversation ($22 million mining campaign; MCA $17.2m; BHP Billiton $4.2m)
- PM Transcripts, 2 May 2010 media release "Stronger, fairer, simpler: a tax plan for our future": https://pmtranscripts.pmc.gov.au/release/transcript-17260 (licensed from the Commonwealth of Australia under CC BY 4.0)
- Minerals Resource Rent Tax: introduced 2012, repealed 2014
- Grattan Institute, "Election 2025: where the money came from" (Palmer: about $89m in 2019, $123m in 2022; Trumpet of Patriots about $53m in 2025)
- InDaily / AAP, December 2022 (one Senate seat in 2022)
- The New Daily / AAP, February 2026 (One Nation about $3m, three Senate seats in 2025)
- AEC Tally Room, 2025 federal election, Dickson: https://results.aec.gov.au/31496/Website/HouseDivisionPage-31496-252.htm
- Australian Electoral Commission, funding and disclosure reform: https://www.aec.gov.au/FADReform/ and AEC fact sheet, February 2026 (changes from 1 July 2026; national caps from 1 January 2027)
- AAP via ACM newspapers; The Daily Aus ($90m party cap; $11m third-party cap)
- AAP / CityNews ("major-party stitch-up" criticism)
- AEC / International IDEA (compulsory voting since 1924; turnout around nine in ten)
""")
md.append("## Credits\n")
md.append("Narration: Grok voice \"Atlas\".\n")
md.append("### Photos\n")
md += photos
md.append("\n### Footage\n")
md += footage
md.append("\n### Documents and web pages (shown as real sources)\n")
md += docs
md.append("\n### AI-generated clips\n")
md.append(f"- {len(ai)} short dramatised reconstruction clips generated with Grok Imagine (no real people), labelled on screen.")
md.append("\n### Music\n")
md += music
md.append("\n### Sound effects\n")
md += sfx
md.append("""
Typefaces: Playfair Display and Inter (SIL Open Font License, via Google Fonts). Maps: Natural Earth via world-atlas (public domain).

## Contact

Business and corrections: [your email]
""")
out = os.path.join(EP, "final", "DESCRIPTION.md")
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, "w", encoding="utf-8").write("\n".join(md))
print(out, len(photos), "photos,", len(footage), "footage,", len(docs), "docs,", len(ai), "AI,", len(music), "music,", len(sfx), "sfx")
