# lf02 IF AUSTRALIA… Episode 2 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`
Episode folder: `longform/lf02-gallipoli/`
Branch: `scaffold/lf02-gallipoli` (cut from `main` at `d9aa880`; do not merge)
Film: **What If Australia Had WON at Gallipoli?**
This is a **long-form documentary**, 16:9. It is **not** a vertical Short, and it is **not** an Impossible Journeys episode.

**Australian English** in every label, caption, chapter, and the YouTube description.

## Read this before you touch a frame

The shot list and the narration source of truth is:

`longform/lf02-gallipoli/script/script.md`

Read the whole file. Follow it beat for beat.

- Part 1 and Part 2 are the layer rules. Part 3 is the shot-by-shot timeline (B-roll, map, image, sound, gaps). Part 3b is the image list. Part 4 is the paste-ready voice, and it matches `audio/vo/`.
- Do **not** rewrite spoken words. Do **not** add facts, places, numbers, shots, or beats that are not in that file.
- Part 3 voice lines are shortened with ellipses. They are picture cues. If a cue disagrees with Part 4 or the voice file, **the voice file wins for what was said**. **Part 3 wins for picture, gaps, and sound.**
- `[pause]`, `[long-pause]`, `<slow>`, and `<soft>` were delivery tags for the take, which is already recorded. Never put them on screen.

Also read, in this folder: `SOURCES.md`, `images/CREDITS.md`, `broll/PROMPTS.md`, `LOG.md`.

You do the design. The production manager does not hand you scene layouts. This brief locks the rules and points at the script. It is not a second script.

## Role split

- Claude Code does **all** design, animation, edit, mix, and assembly.
- The user pastes this brief into Claude Code. Do **not** wait for a GitHub `@claude` comment. Do **not** put `@claude` on an issue, pull request, or review. That string wakes a GitHub Action. This job is the paste, not that Action.
- Do **not** upload to YouTube. Do **not** merge.

## Format

- Long-form, **16:9, 1920×1080, 30 fps**. Not a Short.
- Runtime **about 8:30–9:20**, as the script says. Clocks in the script are approximate. The seated voice files total about 8:48 before gaps. **Whisper the seated voice files** and lock the cut to the real words. Do not force a runtime. Do not trim narration and do not pad.
- **Two mid-roll holds only**, where the script marks them: after V21 (`about 5:25`) and after V27 (`about 7:00`). Picture holds. Do **not** invent ad reads, host spiels, or extra voice.
- **No Remotion. No video framework.** Map plates are **SVG + `renderFrame(t)` + Playwright + ffmpeg**.
- Reuse `shorts/shared/render/` where it helps (`engine.js`, `capture.mjs`, `frame.html`, `render-episode.mjs`). Episode code lives under `longform/lf02-gallipoli/render/`.
- That shared renderer is vertical: `frame.html` and `engine.js` are **1080×1920**, and `capture.mjs` opens a **1080×1920** viewport. Use a **small size override** so existing Shorts stay vertical. If a shared file has to change, keep the diff small and say exactly what changed in the commit message.
- Cut B-roll and photos in with **ffmpeg**. Do not build a second timeline app.

### The 1.28× master

- The delivered master is the **whole finished film at 1.28× speed, pitch held** (picture, voice, music, and effects together; `atempo` keeps pitch, so the voice does not go higher).
- Cut, Whisper, and mix at 1×. Do **not** speed the voice files themselves before the picture is cut.
- The script's 8:30–9:20 and every script clock describe the 1× cut. The 1.28× master runs about 1.28 times shorter. That is expected. Do not pad or trim to chase either number.
- Chapters, mid-roll positions, and the cue sheet in the delivered files use **master (1.28×) timecodes**. Keep the 1× times beside them in the cue sheet.

## THREE LAYERS, not an 80% map film

This is **not** lf01. lf01 was about 80% map. This film is three layers, as Part 1 of the script says:

| Layer | Job | Share |
|---|---|---|
| B-roll (AI clips) | Emotion | about 45% |
| Map (motion graphics) | Explanation | about 40% |
| Real photos | Proof and texture | about 15% full-screen, plus overlays on about half the map shots |

The rhythm from the script: B-roll (feel), then map with an image card (understand plus proof), then back to B-roll or a full-screen photo (impact). The percentages are the script's targets. Do not add shots to hit them.

### Map

- The series **parchment terrain map**. Same kinetic discipline as lf01: camera always moving, routes that draw themselves, labels that earn the line.
- **No satellite basemap.** Lighting lock still on: **no blown-out white relief highlights**. Soft mid-contrast. Parchment must not turn into a white glare plate.
- **"IF AUSTRALIA" badge** in the corner the **whole film**, including B-roll, full-screen photos, and the end screen.
- Colours, locked:
  - **Blue** = Allied.
  - **Red** = Ottoman and Central Powers.
  - **Gold dotted lines** = what-if only, always. Never use gold dotted for anything real.
- Act 3: the map border turns gold (M22) and the gold what-if map leads.
- **Pin-drop sounds** on pins.

### Zoom-through (map ↔ B-roll)

1. Camera zooms into the pin where the moment happens.
2. Pin dissolves into the clip.
3. Clip plays for the duration written on that shot in Part 3.
4. Clip shrinks back into the pin. Camera pulls out. The viewer never loses the map.

Use it on every map → B-roll and B-roll → map cut. B01 is frame 1 of the film; it pulls back into M01 through the cove pin. Where Part 3 puts a clip straight next to a full-screen photo or another clip, use a soft dissolve. Do not insert extra map shots to force a pin.

## B-roll

Exactly **33** clips: **B01–B32 plus B12b**. They are already in the tree:

`longform/lf02-gallipoli/broll/B01.mp4` … `B32.mp4`, plus `B12b.mp4`

- **Do not regenerate. Do not add clips. Do not swap in a different picture.** No AI stills standing in for a clip.
- Every file is **1280×720, about 10 seconds**. Scale up to the 1920×1080 frame inside the zoom-through. Do not pillarbox a raw file in the middle of the map.
- **Trim to the duration written on that shot in Part 3.** Do not lengthen past it.
- **Mute every clip.** Every source file carries an audio track. Drop it. No speech from clips.
- **B01** gets a small **"Dramatised reconstruction"** label in the edit, not baked into the picture. Not on any other clip.
- B27, B30, B31, B32 are the warm present-day clips. B28 and B29 stay sepia (they were generated that way).
- `broll/PROMPTS.md` is the record of what each clip is. Use it to know the picture. Do not treat it as a reason to change durations.

| ID | Length (Part 3) | Where it sits |
|---|---|---|
| B01 | 7s | V01, frame 1. Boats to the cliffs before dawn |
| B02 | 7s | V02. Lone soldier on a clifftop, from behind |
| B03 | 8s | V04. Battleships through the strait |
| B04 | 7s | V05. Muddy Western Front trench in rain |
| B05 | 8s | V07. Aerial glide along the strait, forts |
| B06 | 8s | V09. Fleet steaming into the strait |
| B07 | 8s | V10. Minelayer at night |
| B08 | 5s | V11. Battleship heeling over, no people |
| B09 | 7s | V12. Fort gun, few shells |
| B10 | 9s | V13. Rowing boats and pinnaces before dawn |
| B11 | 6s | V14. Cliffs and beach, boats grinding ashore |
| B12 | 7s | V16. Ottoman soldiers up the ridge, from behind |
| B12b | 8s | V16b. Submarine low in the strait at dawn |
| B13 | 8s | V17. Hillside trench, midday heat |
| B14 | 6s | V17. Same trenches, night snowstorm |
| B15 | 8s | V18. Summit at dawn, strait in the distance |
| B16 | 6s | V19. Night sea, ships offshore |
| B17 | 6s | V20. Drip tins and rifle by candlelight |
| B18 | 6s | V20. Soldiers filing down to the beach at night |
| B19 | 6s | V21. White grave markers above the sea |
| B20 | 7s | V22. Warships through the strait, bright sun (what-if) |
| B21 | 8s | V23. Domes and minarets, warships offshore (what-if) |
| B22 | 7s | V25. Russian soldiers in a snowy trench |
| B23 | 4s | V26. Empty freight wagons, snowy yard |
| B24 | 7s | V27. Desert railway and telegraph poles |
| B25 | 6s | V28. Slouch hat and water bottle, candlelight |
| B26 | 8s | V29. Country-town crowd at a newspaper office |
| B27 | 8s, warm | V30. Dawn crowd with candles, lone bugler |
| B28 | 5s | V31. Old textbook pages turning |
| B29 | 6s | V32. Anatolian hills at sunrise |
| B30 | 8s, warm | V33. Dawn crowd on a beach |
| B31 | 6s, warm | V34. Red wildflowers on a clifftop |
| B32 | 8s, warm | V35. Waves on a pebbly beach at sunrise |

## Real photos

The files are already in `images/`. **Use those files. Do not fetch substitutes.** There is no IMG04 and no IMG08. Credits, licences, and sizes are in `images/CREDITS.md`. Read the whole file, including the "Added 4 October 2026" rows for IMG14 and IMG20 (they replace the earlier skip rows).

### Four treatments (from the script)

1. **Map card:** thin white border, drop shadow, pinned to its place, slight 3D tilt. Stays as the map moves.
2. **PIP:** slides in from the screen edge while the map keeps animating.
3. **Full-screen Ken Burns:** slow zoom or pan, **3–5 s**, high-impact only. The script names seven: IMG03, IMG01, IMG10, IMG18, IMG13, IMG15, IMG17. Do not add more.
4. **Photo-to-map morph:** full-screen photo shrinks into its pin (IMG01 on V14).

### Grade and captions

- Every photo: **warm sepia, a little grain, soft vignette. Do not colourise.** IMG20 is an autochrome (already colour); grade it to the same sepia.
- Slight 2.5D parallax on full-screen photos is allowed. Never stretch or crop faces awkwardly.
- A **small caption** (place, date) in the map label font, and a **tiny credit** in the corner. Where the script writes the caption, use it word for word.

### Photo caveats (from CREDITS.md — obey them exactly)

- **IMG19** is a **modern public-domain map with Spanish labels**, not a 1915 printed map. Use it only as a **faint texture**. Do **not** show the Spanish legend as if it were period text. Keep it faint enough that the legend does not read, or keep the legend out of frame. Never caption it as a 1915 map.
- **IMG07** is **AE2 at Sydney in 1914** (AWM H11559). It is the boat, **not** a photo inside the strait. The map label "AE2, first Allied sub through" belongs to the submarine icon. The photo caption says Sydney, 1914.
- **IMG14** is the **front page of *The Referee* (Sydney), 12 May 1915**, public domain. It is the newspaper card. Do **not** swap it for another paper. The script says "from Trove"; this is the file.
- **IMG10** and **IMG11** are small AWM screen files (**about 640 px**). Ken Burns is still fine. Do **not** upscale them into a fake sharp photo.
- **IMG17, IMG18, IMG22** are **CC BY 2.0 by Jorge Láscar, 30 August 2012**. Credit him on screen and in `SOURCES.md` and `YOUTUBE_DESCRIPTION.md`.
- **Named real people only as these real photos:** IMG02 Churchill, IMG06 Mustafa Kemal 1915, IMG16 Atatürk 1923. **Never AI faces of them.** IMG16 is Atatürk with his wife Latife; frame on him and caption him only. IMG21's file title names two Bulgarian soldiers; caption it "Bulgarian troops, 1915" and name no one.
- **No photos of the dead or wounded. No gore.**
- IMG01, IMG02, IMG16: attribution is required (Mitchell Library; Agence Rol / BnF). Keep the credit.
- IMG12's file page does not give a year. Do not caption it with one.

| ID | Where (Part 3) | Treatment | Caption | Tiny credit |
|---|---|---|---|---|
| IMG01 | V02; V03; V14; V33 | Map card; flips to gold "?"; Ken Burns + morph; split card with IMG22 | Anzac Cove, 25 April 1915 | State Library of NSW, Mitchell Library |
| IMG02 | V06; V12 | Map card on London; pops back beside the "?" | Churchill, Portsmouth, February 1915 | Agence Rol / BnF |
| IMG03 | V11 | Full-screen Ken Burns 4s | HMS Irresistible, 18 March 1915. Real photo. | Royal Navy / Library of Congress |
| IMG05 | V10 | PIP beside the mine line, label "Nusret" | Nusret, 1912 | Turkish General Staff |
| IMG06 | V16; V32 | Map card on the ridge; beside IMG16 | Mustafa Kemal, Gallipoli, 1915 | Turkish General Staff |
| IMG07 | V16b | Map card riding beside the sub icon | AE2, Sydney, 1914 | Australian War Memorial H11559 |
| IMG09 | V17 | PIP from the left | Lone Pine, 6 August 1915 | Australian War Memorial A02022 |
| IMG10 | V20 | Full-screen Ken Burns 3s | The real "drip rifle". | Australian War Memorial G01291 |
| IMG11 | V20 | Map card at the beach | Anzac Beach, December 1915 | Australian War Memorial H03482 |
| IMG12 | V17 | PIP from the right | Ottoman trench, Gallipoli | Turkish General Staff |
| IMG13 | V25 | Full-screen Ken Burns 4s (an album sheet of four; move across it, do not fake one photo) | Petrograd, 1917. Real photo. | J. M. Pringle / Library of Congress |
| IMG14 | V29 | Map card on Australia, slight zoom into the headline | The Referee, Sydney, 12 May 1915 | The Referee (public domain) |
| IMG15 | V30; V31 | Full-screen Ken Burns 4s; fades grey and slides off | Anzac Day, 1916. | Photo attrib. George Bell |
| IMG16 | V32 | Map card on Ankara, IMG06 beside it | Atatürk, 1923 | Agence Rol / BnF |
| IMG17 | V34 | Full-screen Ken Burns 5s | Memorial at Arı Burnu, 2012 | Jorge Láscar, CC BY 2.0 |
| IMG18 | V21 | Full-screen Ken Burns 4s | Lone Pine Cemetery, Gallipoli, 2012 | Jorge Láscar, CC BY 2.0 |
| IMG19 | V07 | Faint texture only | (none, or "Dardanelles defences, 1915 (modern map)") | Map: Gsl, public domain |
| IMG20 | V05 | PIP at the corner | Le Hamel, Somme, 9 August 1915 | Stéphane Passet / Musée Albert-Kahn, CC0 |
| IMG21 | V24 | Map card on Sofia | Bulgarian troops, 1915 | Unknown author |
| IMG22 | V33 | Split card with IMG01 | Anzac Cove, 2012 | Jorge Láscar, CC BY 2.0 |

### Photo rules

- **Never the same subject twice in a row as AI and as a real photo.** The B-roll covers the feeling around a real moment, not the identical scene.
- **Never put a real photo on an imagined gold what-if event.**
- **Act 3 real images are for real context only:** IMG21 (Bulgaria) and IMG13 (Russia 1917). Keep IMG21 on the real red "Joined Germany's side" state, not on the gold "?".
- In M35, the scrapbook cards go along the **real** map only, never the gold side.

## Voice

- Narration is **Atlas**, Australian English, already recorded. **37 files**: `audio/vo/V01.mp3` … `V36.mp3`, **including `V16b.mp3`**. One chunk each.
- **Do not overwrite, time-stretch, or regenerate them.** Do not synthesise a scratch track. **Do not loudnorm the voice files.**
- Edit gaps marked in Part 3 are **no narration**: B-roll, map reveals, music up, effects. The gaps are in addition to the pauses already inside the takes.
- Numbers in the takes are spelled out. On-screen counters stay as the script prints them ("8 months", "8,700+ Australians killed", "~16,000", "+35°", "−10°", "Nation since 1901, 14 years old", "1923: Republic of Turkey founded", "25 APRIL").
- On-screen spelling stays as the script, even if Whisper slips: **Gallipoli, Dardanelles, Nusret, Mustafa Kemal, Chunuk Bair, The Nek, Lone Pine, AE2, Arı Burnu, Anzac Cove, Atatürk, Constantinople, Türkiye.** Keep the dotless ı and the ü.

`shorts/shared/render/mix-audio.mjs` expects a single `audio/vo.mp3` and runs one-pass loudnorm on the voice. Do not copy that onto this film. **Two-pass loudnorm on the 1.28× master only**, about **−14 LUFS**, true peak **at or under −1.5 dBTP**.

## Audio

Locked from the Japan 1942 film, plus this script's own hits.

- While the voice is talking, music is a **quiet bed**. The voice is always clearer.
- In pauses, openings, and edit gaps, bring the bed **up to a normal level, not full**.
- **Change the music with the emotion.** War heavier. Loss sadder. The what-if can lift. One pad under the whole film is not enough.
- **Mute every B-roll clip.** Environment (sea, wind, rain, distant war) only from files already in `audio/sfx/` or made in the project. No YouTube audio. No commercial tracks. No downloaded samples.
- Small picture-sync hits (`pin_thunk`, `boom`, `click`, `tick`) sit **in the gap or on the cut, never over a word**.
- Not every file in `audio/sfx/` belongs here. No air-raid siren. No sonar pings. Neither is in this script.

### Music

Eight Mixkit tracks are already seated in `audio/music/` (copied from lf01, **Mixkit Stock Music Free Licence**, documented in `SOURCES.md`). **Use those. Do not download a new score.** Map different tracks to different emotions, and write which file played where in `SOURCES.md` and the cue sheet.

Files: `silent-descent-614.mp3`, `dark-drama-605.mp3`, `between-two-evils-1020.mp3`, `echoes-188.mp3`, `fallen-asper-565.mp3`, `curiosity-480.mp3`, `vastness-184.mp3`, `the-journey-79.mp3`.

`SOURCES.md` lists each track's lf01 role (tension, war, loss, plans and argument, geography, relief, warm outro). Use that as a starting point and choose by ear. Keep the asset-605 title note in `SOURCES.md`.

### Sound calls from the script

- **V01, frame 1:** oars and a low drone (`drone.flac`), and one deep note on "lost" (`low_note.flac`). There is no oars file in `audio/sfx/`. Make one in the project (synthesised, documented in `SOURCES.md`) or build it from `sea.flac`. Do not download one.
- **V04 gap (2.5 s):** the **"IF AUSTRALIA…"** title builds on the map with **`series_sting.flac`**. Reuse that file. Do **not** invent a second series sting.
- **V11:** a muffled **underwater boom** (`underwater.flac`, `boom.flac`), **then silence**. 1.5 s gap.
- **V12:** **cliffhanger sting** (`cliff_sting.flac`).
- **V18:** pins light up **with thunks** (`pin_thunk.flac`).
- **V21:** **strings only** (`strings_pad.flac`) under B19, IMG18, and the memorial counters. The beds drop out. 2 s gap, then the first mid-roll hold.
- **V27:** **cliffhanger sting**, 1.5 s, then the second mid-roll hold.
- **V36 / end screen:** music outro under the badge.
- Environment only where the picture shows it: rain under B04, wind under the B14 snowstorm, sea under the night-sea and beach clips.

## On-screen text

Allowed, because the script names them: labels, dates, counters, place names, the series badge, the **"IF AUSTRALIA…"** title, gold what-if marks and their "?" labels, the map cards' words ("FRONT DOOR", "BACK DOOR", "Empire collapses?", "Russia saved?", "War ends early?", "Almost out of shells?", "Send the army", "Planned?", "Landed", "Stay or evacuate?", "Dig in", "Casualties in the escape: almost none", "Surrender?", "Fight on from Asia?", "Joined Germany's side, Oct 1915", "1917 REVOLUTION", "Not enough weapons to spare", "Problems ran deeper", "Arı Burnu" → "Anzac Koyu (Anzac Cove), 1985", "AE2, first Allied sub through", "Nusret"), image captions and credits, and "Dramatised reconstruction" on B01 only.

Not allowed: **VO-echo title cards** that restate a sentence the narrator just said.

## Dignity

- **No humour anywhere.**
- Ottoman soldiers are **defenders of their homeland**. Use **Ottoman** for 1915 and **Türkiye** or **Turkey** for today, as the script does.
- **No flags as the main subject.** No caricature. **No gore.** Death only through **counters, graves, and silence**.
- M21 memorial counters: each nation side by side, **no colours**.
- Stay out of modern Turkish or Australian politics.

## Beat index

Follow Part 3. This index is only so nothing gets dropped. **If it disagrees with `script/script.md`, the script wins.** Clocks are the script's approximate 1× clocks, not Whisper times. "M" = map shot, "KB" = full-screen Ken Burns.

| Chunk | Clock | Picture (Part 3) | Sound | Gap after |
|---|---|---|---|---|
| **Cold open** | 0:00–0:55 | | | |
| V01 | 0:00 | **B01** (7s) frame 1, "Dramatised reconstruction" label | Oars, low drone; deep note on "lost" | 1s |
| V02 | 0:08 | M01 (5s) zoom onto the peninsula, counters "8 months", "8,700+ Australians killed"; IMG01 map card at the cove; **B02** (7s) | Pin | none marked |
| V03 | 0:20 | M02 (6s) gold dotted arrow across the peninsula and through the strait toward Constantinople; IMG01 flips to a gold "?" | | none marked |
| V04 | 0:26 | M03 (8s) pull out to Europe, gold arrows "Empire collapses?", "Russia saved?", "War ends early?"; **B03** (8s); M04 (5s) arrows pulse, freeze | Series sting in the gap | 2.5s: "IF AUSTRALIA…" title |
| **Act 1** | 0:55–2:40 | The back door | | |
| V05 | 0:55 | M05 (6s) Europe 1915, trench line North Sea → Swiss border; IMG20 PIP as the line finishes; **B04** (7s) | Rain under B04 | none marked |
| V06 | 1:08 | IMG02 map card on London; M06 (6s) red "FRONT DOOR", blue "BACK DOOR" arrow through the Mediterranean; card follows the arrow's start | | none marked |
| V07 | 1:18 | M07 (5s) zoom to the Dardanelles, labels Türkiye and Istanbul; IMG19 faint texture in and out; **B05** (8s) | | none marked |
| V08 | 1:32 | M08 (14s) Ottoman Empire cracks; sea route through the Black Sea to Russia with weapon crates; wheat pours out of Russia | | none marked |
| V09 | 1:48 | **B06** (8s); M09 (3s) sixteen blue ship icons enter the strait | | none marked |
| V10 | 1:59 | **B07** (8s); M10 (5s) mine line glows in the bay; IMG05 PIP "Nusret" | | none marked |
| V11 | 2:12 | **B08** (5s); IMG03 KB (4s); M11 (4s) three blue ships sink one by one, fleet arrows retract | Underwater boom, then silence | 1.5s |
| V12 | 2:26 | **B09** (7s); M12 (6s) "Almost out of shells?" card, gold arrow tries and fades, blue arrow to the peninsula "Send the army"; IMG02 pops back beside the "?" | Cliffhanger sting | none marked |
| **Act 2** | 2:40–5:25 | The landing | | |
| V13 | 2:40 | M13 (4s) landing arrow to the cove, "~16,000"; **B10** (9s) | | none marked |
| V14 | 2:53 | **B11** (6s); IMG01 KB then morph into its pin (5s); M14 (3s) "Planned?" and "Landed" with a "?" | | none marked |
| V15 | 3:05 | M15 (9s) blue arrows race up the ridges, gold dotted line to the strait as the goal | | none marked |
| V16 | 3:14 | IMG06 map card on the ridge; **B12** (7s); M16 (4s) red meets blue on the high ground, blue stops | | none marked |
| **V16b** | 3:30 | M16b (6s) blue sub icon threads the mine lines into the Sea of Marmara; IMG07 map card beside it; **B12b** (8s); M16c (4s) beach pin "Stay or evacuate?" → "Dig in" | | 1s |
| V17 | 4:05 | **B13** (8s); M17 (5s) two trench lines metres apart, "+35°" → "−10°"; IMG09 (left) + IMG12 (right) double PIP; **B14** (6s) | Wind under B14 | none marked |
| V18 | 4:27 | M18 (6s) pins "Lone Pine", "The Nek", "Chunuk Bair"; **B15** (8s); M19 (4s) blue flag on Chunuk Bair wobbles, pushed back | Pin thunks | 1s |
| V19 | 4:47 | **B16** (6s) | | none marked |
| V20 | 4:53 | **B17** (6s); IMG10 KB (3s); **B18** (6s); M20 (4s) evacuation arrows, "Casualties in the escape: almost none"; IMG11 map card at the beach | | none marked |
| V21 | 5:11 | **B19** (6s); IMG18 KB (4s); M21 (4s) memorial counters, no colours | Strings only | 2s |
| Mid-roll | about 5:25 | Hold. No ad read | | |
| **Act 3** | 5:25–7:00 | What if they'd won? Gold leads | | |
| V22 | 5:25 | M22 (7s) border turns gold, gold flags on the heights, forts grey, gold ships through the Narrows; **B20** (7s) | What-if can lift | none marked |
| V23 | 5:40 | **B21** (8s); M23 (6s) gold branches "Surrender?", "Fight on from Asia?" | | none marked |
| V24 | 5:56 | M24 (9s) Balkans, Bulgaria red "Joined Germany's side, Oct 1915" flickers grey with a gold "?"; IMG21 map card on Sofia | | none marked |
| V25 | 6:06 | M25 (5s) gold route through the Black Sea to Russia; **B22** (7s); IMG13 KB (4s); M26 (4s) "1917 REVOLUTION" fades to a gold "?" | | none marked |
| V26 | 6:30 | M27 (8s) "Not enough weapons to spare", "Problems ran deeper", gold Russia arrow thins; **B23** (4s) | | none marked |
| V27 | 6:40 | **B24** (7s); M28 (7s) post-war borders solid, then wobbling gold dotted alternatives with "?" | Cliffhanger sting | 1.5s |
| Mid-roll | about 7:00 | Hold. No ad read | | |
| **Act 4** | 7:00–end | The twist | | |
| V28 | 7:00 | **B25** (6s) | | none marked |
| V29 | 7:08 | M29 (5s) "Nation since 1901, 14 years old"; IMG14 map card on Australia, slight zoom into the headline; **B26** (8s) | | none marked |
| V30 | 7:22 | IMG15 KB (4s); **B27** (8s, warm); M30 (3s) calendar flips to "25 APRIL" | | none marked |
| V31 | 7:37 | M31 (5s) gold mode, "25 APRIL" fades into an ordinary date in a list, IMG15 fades grey and slides off; **B28** (5s) | | none marked |
| V32 | 7:49 | IMG16 map card on Ankara with IMG06 beside it; M32 (6s) "1923: Republic of Turkey founded"; **B29** (6s) | | none marked |
| V33 | 8:08 | M33 (5s) "Arı Burnu" → "Anzac Koyu (Anzac Cove), 1985"; IMG01 + IMG22 split card on the cove pin; **B30** (8s, warm) | | none marked |
| V34 | 8:27 | IMG17 KB (5s); **B31** (6s, warm); M34 (4s) pins on Australia and Türkiye joined by a soft gold line | | 1.5s |
| V35 | 8:45 | M35 (8s) split: gold what-if map beside the real map, real photos as scrapbook cards along the real map; **B32** (8s, warm) | | 2s |
| V36 | 9:07 | M36 (10s) series end card: "IF AUSTRALIA…" badge, Episode 1 and Episode 2 maps side by side | Music outro | then end screen |
| End | after V36 | **10 s.** Badge stays. Clean empty space for a subscribe element and the Episode 1 video. No fake YouTube chrome | | |

37 voice chunks. 33 B-roll clips. 20 photo files. Do not drop V16b.

## Deliver

On this branch, not merged, all inside `longform/lf02-gallipoli/`:

- `final/lf02-gallipoli.mp4` — the **1.28× pitch-held** master
- A contact sheet
- A loudnorm report (integrated loudness and true peak of the 1.28× master)
- Chapter stills
- `YOUTUBE_DESCRIPTION.md` — **draft only**, Australian English. Chapters at master timecodes (start from the script's Packaging chapters, adjusted to the edit). Include a line that the B-roll is **dramatised / synthetic**, because the script says to tick YouTube's "altered or synthetic content" option **when uploading**. Include the photo and music credits. **Do not upload.**
- `SOURCES.md` updated: the "not seated yet" sections for narration, B-roll, and images are stale; replace them. Add the photo credits already in `images/CREDITS.md` (do not soften the caveats), which music file played where, and any sound made in the project.
- A cue sheet (in the episode folder) listing music and effects against the beats, 1× and master times.
- Open a PR **or** ship on the branch. **Do not merge.** PR title and body must not contain `@claude`.

Do not commit unrelated dirty files outside `longform/lf02-gallipoli/` (`shorts/incoming-vo/`, `shorts/s19-emu-war/images/`, and anything else already in the tree).
Do not overwrite `audio/vo/`, `broll/`, `images/`, or `audio/music/`.

## Do not fix the script

Part 4 of `script/script.md` is the spoken text. The takes in `audio/vo/` match it. **Do not rewrite narration. Do not add facts.**

Part 3 voice lines are shortened cues. If a cue disagrees with Part 4 or the voice file, **the voice file wins** for what was said. Part 3 still wins for picture, gaps, and sound.

Clocks in the script are approximate and do not all add up. Leave them. Whisper timings decide the real length.

Known gaps between the script's wording and the seated files. Follow the file and the caveat, not the script's description:

- Part 3 calls IMG19 "a real 1915 map … at 40% opacity". It is a modern map with Spanish labels. Faint texture only.
- Part 3 says IMG05 may be "the replica". It is the historic 1912 photo. Caption it that way.
- Part 3 says IMG14 is "from Trove". It is *The Referee*, 12 May 1915. Use it.
- Part 3 calls IMG16 "a portrait". It is Atatürk with Latife, March 1923. Frame on him.
- M33 says "The same beach, 110 years apart." IMG22 is from 2012. Do not put "110 years apart" on screen.
- M34's "soft gold line" between Australia and Türkiye is real, not a what-if. Draw it solid and soft, never dotted.
- The script itself puts some AI clips next to a real photo of a related moment: B08 → IMG03, B11 → IMG01, IMG07 → B12b, B17 → IMG10, B19 → IMG18. Keep the script order. Do not frame, crop, or grade the clip to copy the photo; the clip is the feeling, the photo is the proof. Add no other doubling. If a pair still reads as the identical scene, flag it in the PR. Do not reorder or drop shots on your own.
- M02 flips IMG01 to its gold "?" back, M12 puts the Churchill card beside the "?" card, and M31 slides IMG15 off in gold mode. The real photo face never sits on a gold what-if arrow or event.

On-screen spelling stays Gallipoli, Dardanelles, Nusret, Mustafa Kemal, Chunuk Bair, The Nek, Lone Pine, AE2, Arı Burnu, Anzac Cove, Atatürk, Constantinople, Türkiye, even if Whisper slips.

Do not fix the script.
