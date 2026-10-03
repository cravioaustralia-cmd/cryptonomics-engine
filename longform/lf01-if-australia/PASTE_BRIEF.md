# lf01 IF AUSTRALIA… Episode 1 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`
Episode folder: `longform/lf01-if-australia/`
Branch: `scaffold/lf01-if-australia` (cut from `main` at `d9aa880`; do not merge)
Film: **What If Japan Had Invaded Australia in 1942?**
This is a **long-form documentary**, 16:9. It is **not** a vertical Short, and it is **not** an Impossible Journeys episode.

**Australian English** in every label, chapter, and the YouTube description.

## Read this before you touch a frame

The shot list and the narration source of truth is:

`longform/lf01-if-australia/script/script.md`

That file is the user's production script v2, copied unchanged (page-break characters and all). Read the whole file. Follow it beat for beat.

- Do **not** rewrite spoken words.
- Do **not** add facts, places, numbers, or beats that are not in that file.
- Do **not** "repair" the script. Where Part 2 and Part 3 disagree, or where a line is cut off, leave the words alone and follow **Do not fix the script** at the bottom of this brief.
- Part 2 "Voice" lines are often shortened with ellipses. They are cues, not a licence to write new narration.
- Part 3 is the paste-ready Grok text, but in this copy most chunks are sliced mid-word. **Do not complete them.**
- "Should sound" notes are for the voice take. Never speak them. Never put them on screen as titles.

You do the design. The production manager does not hand you scene layouts. This brief locks the rules and points at the script. It is not a second script.

## Role split

- Claude Code does **all** design, animation, edit, mix, and assembly.
- The user pastes this brief into Claude Code. Do **not** wait for a GitHub `@claude` comment. Do **not** put `@claude` on an issue, pull request, or review. That string wakes a GitHub Action. This job is the paste, not that Action.
- Do **not** upload to YouTube. Do **not** merge.

## Format

- Long-form, **16:9, 1920×1080, 30 fps**. Not a vertical Short.
- Runtime target **about 9:00**, as the script says: narration about 8:20 plus about 35 seconds of edit gaps. Clocks in the script are approximate. Do not invent word timings to force 9:00.
- **Two mid-roll breaks**, only where the script marks them: after Act 1 (`about 2:40`) and after Act 3 (`about 6:25`). Picture can hold on the map. Do **not** invent ad reads, host spiels, or extra voice.
- **No Remotion. No video framework.** Map plates are **SVG + `renderFrame(t)` + Playwright + ffmpeg**.
- Reuse `shorts/shared/render/` where it helps (`engine.js`, `capture.mjs`, `frame.html`, `render-episode.mjs`). Episode code lives under `longform/lf01-if-australia/render/`.
- That shared renderer is built for Shorts: `frame.html` and `engine.js` are **1080×1920**, and `capture.mjs` opens a **1080×1920** viewport. This film is the other way around. Prefer a **small** size override so existing Shorts stay vertical. If `capture.mjs` (or `frame.html` / `engine.js`) has to change, keep the diff small and say exactly what changed in the commit message.
- Cut the **12** B-roll clips in with **ffmpeg** at the script's zoom-throughs. Do not build a second timeline app to do it.

## This episode's look

The map is about **80%** of the film. One continuous terrain map. The camera flies, zooms, and pans the whole time. Information is motion graphics **on the map**: arrows, routes, counters, unit icons, date labels, document and newspaper icons, archive photos as framed cards.

The script says "parchment-style terrain map, in the same style as your Shorts." Read that as: the **same kinetic-map discipline** as the Shorts (camera always moving, routes that draw themselves, labels that earn the line). The **written look of this film** is the script's parchment / terrain war map. **Do not** restyle it into a GeoGlobeTales satellite Short. No satellite basemap.

Lighting lock, still on: **no blown-out white relief highlights**. Terrain stays readable. Soft mid-contrast. A little edge haze is fine. Parchment must not turn into a white glare plate.

Colours, from the script:

- **Red** = Imperial Japanese movement.
- **Blue** = Allied.
- **Desaturate** the map in grim moments (prisoners, Darwin after the raid, the blacked-out city, Australia cut off).
- The palette **turns warm in Act 5**.

Keep an **"IF AUSTRALIA"** badge in the corner the whole way through, including the end screen.

### Zoom-through (every B-roll, no exceptions)

Exactly as the script:

1. Camera zooms fast into the pin where the moment happens.
2. Pin flares and dissolves into the clip (about **0.3 s**).
3. Clip plays **3–5 s** (use the duration written on that clip in Part 2).
4. Clip shrinks back into the pin. Camera pulls out. The viewer never loses the map.

Part 2 calls B07 "a quick cut". The zoom-through rule at the top of the script still wins: B07 enters and leaves through the pin, same as the others. Do not hard-cut away from the map. Do not add B-roll the script does not list.

## Voice and edit gaps

- Narration is **Atlas**, same voice as the Shorts, generated by Video Production in the script's chunks **V01–V34**, **one file each** under `longform/lf01-if-australia/audio/vo/` (`V01.mp3` … `V34.mp3`). Not one wall of talk.
- `[pause]` and `[long-pause]` live **inside** the VO. `<slow>` and `<soft>` are speech tags in the Grok text, not words and not on-screen titles.
- Edit gaps marked in Part 2 are **silence in the picture**: B-roll, map reveals, music swells, sound effects. **No narration** in those gaps.
- **VO files are pending.** Do not invent timings. Do not synthesise a scratch track. Do not overwrite VO files when they land.
- You may build the map rig, plates, and cue sheet now. Treat the script clocks as **provisional**. When the files land, **Whisper-retune** every seam to the real words. Until then, do not lock a word-level timeline.
- Delivery: documentary, **a touch slower than the Shorts**.
- Numbers in the Grok text are already spelled out ("nineteen forty-two", "fifteen thousand"). Do **not** "correct" them back to digits in the spoken track. "Anzus" is written that way so it is said as a word. On-screen counters stay as the script prints them (digits, tildes, "4 MARCH 1942", "ANZUS 1951", "SCENARIO 1: STUCK", route numbers). Those are labels, not a second narration.
- Names to respect if a take is wrong: Ulungura, Birdum, Kokoda, Milne Bay, Moresby. Do not respell them on screen.

`shorts/shared/render/mix-audio.mjs` expects a single `audio/vo.mp3` and runs **one-pass loudnorm on the voice**. Do not copy that onto this film. Measure the VO, **don't squash it**, and run **two-pass loudnorm on the master only**.

## B-roll

Exactly **12** clips, **B01–B12**. No extra B-roll. No AI stills standing in for a clip. No emoji.

Video Production generates them with Grok Imagine from the prompts in the script and drops them at:

`longform/lf01-if-australia/broll/B01.mp4` … `broll/B12.mp4`

You time them and composite them. You do not regenerate them and you do not swap in a different picture.

| ID | Script length | Where it sits |
|---|---|---|
| B01 | 4s | Cold open, Tokyo pin, on "admirals" |
| B02 | 4s | Singapore pin, prisoners |
| B03 | 5s | Darwin pin, harbour smoke |
| B04 | 4s | Darwin coast, landings |
| B05 | 4s | The railway gap |
| B06 | 4s | Open ocean, invasion fleet |
| B07 | 3s | East-coast supply line, periscope |
| B08 | 4s | Midway pin, distant burning carrier |
| B09 | 5s | City pin, empty blackout street |
| B10 | 4s | Sydney Harbour pin, midget submarine |
| B11 | 5s | New Guinea / Kokoda, muddy track |
| B12 | 5s | Act 5 harbour, migrant ship, **warm colour** |

Style anchor (already in the script; respect it, do not loosen it):

> Cinematic WWII-era documentary reconstruction, 16:9, 1080p or higher, muted desaturated colour palette, subtle 35mm film grain, natural light, shallow depth of field, slow camera movement, realistic, no text, no logos, no modern objects.

Avoid list (every clip):

> gore, blood, visible wounds, dead bodies, identifiable real people, caricatured faces, rising sun flag, modern vehicles, modern clothing, text, watermarks.

- **B12** uses a **warm natural colour palette**, not the muted grade.
- The **first** B-roll (B01) gets a small **"Dramatised reconstruction"** label. Not on every clip.
- Generate notes in the script (5–8 s source, trim to the length above) are for Video Production, not a reason for you to lengthen a clip past the Part 2 duration.

## People

- **Real people only as archive photos on the map.**
- **John Curtin:** one framed card, pinned to Australia on the V09 beat, with the newspaper icon the script describes. There is **no Curtin photo in this repo**. Do not invent a face and do not generate one. Use this free-licence file if you fetch an archive still: [File:John Curtin austerity speech SLNSW 1942.jpg](https://commons.wikimedia.org/wiki/File:John_Curtin_austerity_speech_SLNSW_1942.jpg) (public domain; acknowledge Mitchell Library, State Library of New South Wales). It is a 30 October 1942 picture, later than the "weeks earlier" line. That is acceptable as an archive card of the prime minister. Do not use a grave photo, and do not use the c.1908 youth portrait as the wartime card. Write the credit in a `SOURCES.md` in this episode folder.
- **Matthias Ulungura** is a **map label only**: "Captured by Matthias Ulungura, Tiwi man", on Melville Island, with the small plane the script describes. **No AI person. Do not generate him.** No photo unless a free-licence image is documented **and** Tiwi protocols are noted in `SOURCES.md`. Default for this pass: **label only, no photo.**

## Audio

Voice sits clearly on top. Master about **−14 LUFS**, true peak **at or under −1.5 dBTP**.

Music and sound effects are designed, not constant chatter. Build a cue sheet. Sparse and intentional. Grim beats can go nearly dry. Do not import the Shorts whoosh/pop chatter.

Scripted calls (do not add a parallel score that fights these):

- Frame 1: low drone. Deep **boom** on "invade Australia" (V01). The 1 s gap lets the boom ring as the camera pulls back.
- V02: music **cuts out completely** on "rejected", with a **stamp thud**. Then 1 s of silence.
- V03 gap (1.5 s): music swells back in as the arrow re-extends.
- V04 gap (2.5 s): the **"IF AUSTRALIA…"** title builds on the map with the **series sting**. This episode invents that sting and documents it for later episodes. It is **not** the Impossible Journeys sting.
- V06: music drops to a **single low note** under the prisoner line and B02.
- V08: **air-raid siren** fades in and peaks, **distant explosions, no screams**, over B03. Siren fades on the pull-back. Map desaturates briefly.
- V11: **cliffhanger sting**, then 1.5 s. Then the first mid-roll hold.
- Act 2 open (1 s gap before V12): a big **"1"** slams onto the map, **whoosh and a drum hit**.
- V13: music shifts lighter and curious on "geography".
- V15: a **single gust of desert wind** (the comic beat) over B05.
- Act 3 open: a big **"2"**, **heavier** drum hit.
- V20: **two sonar pings** with B07 and the submarine icons.
- V23: **strings only** under B09. Map heavily desaturated.
- V24: cliffhanger sting again, then 1.5 s. Then the second mid-roll hold.
- Act 4 open: a big **"3"**, the **heaviest** hit of the three.
- V26: a **snapping cable**, then near silence with a low wind tone. 2 s gap.
- V29: music **lifts** as the four pins light (Coral Sea, Midway, Kokoda, Milne Bay) and the lifeline redraws.
- V30: music **resolves and holds**. 2 s gap.
- End screen after V34 (**10 s** in the script): music outro under the badge, with space for a subscribe button and one suggested video. Do not upload, and do not fake YouTube UI chrome beyond a clean empty area.

**Music:** pick a **free-licence** bed (Mixkit or Pixabay) and document the **URL** in `SOURCES.md`. Do **not** use the Shorts Skyline bed unless it actually fits. This is a war counterfactual, not Impossible Journeys. No copyrighted score.

## On-screen text

Allowed, because the script specifies them: labels, dates, counters, verdict cards, route numbers, place names, the series badge, the scenario numerals, "REJECTED", "SCENARIO 1: STUCK", "Dramatised reconstruction" on B01 only.

Not allowed: **VO-echo title cards** that restate a sentence the narrator just said. The title build on the V04 gap is the series title **"IF AUSTRALIA…"**, not a recap of the opening line.

Australian English. Place names as the script spells them (Birdum, Alice Springs, Kokoda, Milne Bay, Port Moresby, New Caledonia).

## Dignity

Prisoners, the Darwin bombing, and combat beats stay **non-graphic**. No gore, blood, wounds, or dead bodies, on the map or in the grade. No sacred imagery. No caricature of Japanese or Australian people. No rising-sun flag. Soldiers in B02 and B11 are seen from behind, as the prompts say. B08 and B09 show no people. Do not add faces the prompts forbid.

## Beat index

Follow Part 2. This index is only so nothing gets dropped. If it ever disagrees with `script/script.md`, the script wins. Clocks are the script's approximate clocks, not Whisper times.

| Chunk | Script clock | Picture (from Part 2) | Sound | Gap after |
|---|---|---|---|---|
| Cold open | 0:00–0:45 | | | |
| V01 | 0:00 | Night map, dive from space onto Japan, Tokyo pin, zoom-through **B01** | Drone from frame 1; boom on "invade Australia" | 1 s |
| V02 | 0:07 | Red arrow Tokyo → northern Australia; on "rejected", red **REJECTED** stamp, arrow retracts | Music out; stamp thud | 1 s silence |
| V03 | 0:17 | Arrow re-extends; ship icons fill the sea | Music swells back in the gap | 1.5 s |
| V04 | 0:25 | Arrow splits into dotted **1, 2, 3**; arrow 3 glows on the phrase the script names (see inconsistencies — do not write new words) | Series sting in the gap as the title builds | 2.5 s |
| Act 1 | 0:45–2:40 | How close it got | | |
| V05 | 0:45 | Pull back, Asia/Pacific; red tide south with date labels; Pearl Harbor pin and smoke icon; pins thunk onto Hong Kong, Malaya, Singapore | | none marked |
| V06 | 1:02 | Zoom-through Singapore pin, **B02** | Single low note | 2 s |
| V07 | 1:11 | Red tide at the islands north of Australia; Australia pale; counters "Population: ~7 million", "Coastline: 30,000+ km"; blue soldier icons in the Middle East | | none marked |
| V08 | 1:28 | Plane icons onto Darwin; zoom-through **B03**; map desaturates briefly on the pull-back | Siren, distant explosions, no screams | 2.5 s |
| V09 | 1:41 | Curtin archive card + newspaper icon; on "look to America", blue line to the United States | | 1 s |
| V10 | 1:55 | Tokyo; anchor (Navy) vs helmet (Army); counters "Divisions needed: 10–12", "Shipping needed: up to 2,000,000 tons"; "Tied down in China"; small handful left near Australia | | none marked |
| V11 | 2:25 | Date stamp **4 MARCH 1942**; on "No invasion" the arrow vanishes; dotted arrows return; arrow 1 pulses | Cliffhanger sting | 1.5 s |
| Mid-roll | about 2:40 | Hold the map. No ad read | | |
| Act 2 | 2:40–4:30 | Scenario 1, grab the north | | |
| — | before V12 | Big **1** slams on | Whoosh + drum hit | 1 s (this gap is *before* V12) |
| V12 | 2:42 | Top End; red landing arrows; zoom-through **B04**; then airfield icons, bombing-range circles, ship-block icons | | none marked |
| V13 | 3:00 | Darwin damage icons; civilian arrows stream south | Lighter, curious on "geography" | 1 s |
| V14 | 3:14 | Camera south across orange interior; rail Darwin→**Birdum** and south→**Alice Springs**; gap glows; "~1,000 km of NO railway" | | none marked |
| V15 | 3:36 | Zoom-through into the gap, **B05** | One desert-wind gust | 1.5 s |
| V16 | 3:45 | Road draws through the gap, truck icons, label "→ Stuart Highway"; red force stuck at Darwin; blue counterattack arrows; red supply line back to Japan, flickering and fraying | | none marked |
| V17 | 4:12 | Melville Island; plane spirals onto the beach; label only, no person | | none marked |
| V18 | 4:30 | Verdict card **SCENARIO 1: STUCK** | | 1.5 s |
| Act 3 | 4:40–6:15 | Scenario 2, full invasion | | |
| — | before V19 | Big **2** | Heavier drum hit | 1 s before V19 |
| V19 | 4:42 | Zoom-through into open ocean, **B06** | | none marked |
| V20 | 4:50 | Red arrows to Brisbane, Sydney, Melbourne; shipping counter climbs; **B07**; then blue submarines pick off red ships | Two sonar pings | 1 s |
| V21 | 5:12 | Coral Sea icons; red arrow toward Port Moresby turned back; pull out to Midway; zoom-through **B08** | | 1.5 s |
| V22 | 5:30 | Outcome arrows flicker: "Early wins?" / "Faster collapse?"; blue troop arrows from the Middle East and from the USA; planes and soldiers onto Australian cities | | none marked |
| V23 | 5:58 | Map desaturates heavily; zoom-through city pin, **B09** | Strings only | 1.5 s |
| V24 | 6:12 | Mainland United States outline slides over Australia; arrow 3 pulses red | Cliffhanger sting | 1.5 s |
| Mid-roll | about 6:25 | Hold the map. No ad read | | |
| Act 4 | 6:25–8:10 | Scenario 3, cut Australia off | | |
| — | before V25 | Big **3** | Heaviest hit of the three | 1 s before V25 |
| V25 | 6:27 | Whole Pacific; thick blue lifeline USA→Australia past Fiji, Samoa, New Caledonia; red arrows reach for each island; red arrow to Port Moresby; bomber-range circle over Queensland | | none marked |
| V26 | 6:55 | Lifeline frays and snaps; Australia dims and isolates | Snapping cable, then near silence, low wind | 2 s |
| V27 | 7:06 | Hold on isolated Australia; zoom-through Sydney Harbour, **B10** | | none marked |
| V28 | 7:20 | Shell-burst icons at Sydney and Newcastle; zoom to New Guinea; **B11**; then red line over the mountains toward Port Moresby; distance counter stops at "~40 km" | | 1 s |
| V29 | 7:38 | Four pins thunk on in turn: Coral Sea, Midway, Kokoda, Milne Bay; on "The lifeline held" the blue line redraws solid and Australia brightens | Music lifts | 1.5 s |
| V30 | 7:58 | Slow pull-out, whole Pacific, lifeline intact | Music resolves and holds | 2 s |
| Act 5 | 8:12–9:05 | The twist. Palette turns warm | | |
| V31 | 8:12 | Years tick 1942, 1945, 1951; war map fades to a modern map, colour warms; treaty icon, animated pen; blue triangle Australia–New Zealand–USA, label **ANZUS 1951** | | none marked |
| V32 | 8:30 | Zoom-through harbour pin, **B12** (warm) | | 1 s |
| V33 | 8:40 | Migration arrows from Britain and Europe, then from the rest of the world; cities glow; population counter climbs | | 1.5 s |
| V34 | 8:58 | Split: alternate 1942 map (red arrows, cut lifeline) beside the real modern map | | then end screen |
| End | after V34 | **10 s.** "IF AUSTRALIA…" badge on the map. Empty space for subscribe and one suggested video. Music outro | | |

The script's own shot count: map for the whole runtime (about 80%); 12 AI B-roll clips; 1 archive card (Curtin); 34 voice chunks; edit gaps about 35 seconds. Do not add a thirteenth clip to "cover" a hole.

## Deliver

On this branch, not merged:

- `longform/lf01-if-australia/final/lf01-if-australia.mp4`
- A contact sheet
- A loudnorm report (show integrated loudness and true peak)
- Chapter stills if you make them
- `longform/lf01-if-australia/YOUTUBE_DESCRIPTION.md` drafted only. Australian English. Include a line that the B-roll is dramatised / synthetic, because the script says to tick YouTube's "altered or synthetic content" option **when uploading**. You are not uploading, so the line lives in the draft and nowhere else.
- `SOURCES.md` for the music URL, the Curtin file and credit, and any SFX sources
- A cue sheet (in the episode folder) listing music and SFX against the script beats
- Open a PR **or** ship on the branch. **Do not merge.** PR title and body must not contain `@claude`.

Do not commit unrelated dirty files outside `longform/lf01-if-australia/` (incoming VO, other shorts' images, and anything else already in the tree).

## Do not fix the script

`script/script.md` is internally inconsistent. Quote the problems in your notes if you need to. **Do not rewrite narration to paper over them.** Do not fill cut-off Part 3 lines from memory or from the ellipsis lines in Part 2.

Counted in this copy: **34** voice labels (V01–V34, none missing) and **12** B-roll clips (B01–B12, none missing). What is broken is the **text inside** most Part 3 chunks, plus a few clocks.

Part 3 lines are cut at about 93 characters, mid-word or mid-tag. Examples, verbatim:

- V01 ends: `February, nineteen forty-two. [pause] In Tokyo, Japanese admirals put a proposal on the table`
- V02 ends: `This isn't a myth. The idea was real, and Japan's top commanders argued about it for weeks. [`
- V30 ends: `<slow>So maybe the real answer is this: [pause] Japan didn't need to invade Australia. The bi`

Only V06, V12, and V19 read as if they might be finished, and even V12 does not contain the Part 2 phrase "Bases to block American ships."

Other mismatches to leave alone:

- V04 "Should sound" says a slight smile on "Stay for that last one". That phrase is **not** in the Part 2 Voice line (`Today, we’re playing it out… It changes how you see Australia today.`) and it is **not** in the cut-off Part 3 line. Do not write it.
- V04 map says arrow 3 glows red on "most dangerous of all". That phrase is not in the visible Voice line. When VO arrives, glow arrow 3 only if Whisper actually hears that phrase. If it never appears, pulse arrow 3 on the title gap without inventing the words and without a title card.
- V05 "Should sound" speeds up through "Hong Kong falls. Malaya falls." The Part 2 Voice line only says Singapore falls. Part 3 starts `First, the scene. December, nineteen forty-one. Japan attacks Pearl Harbor, and almost at the` and then stops. Stage the Hong Kong, Malaya, and Singapore pins because the **map** line asks for them. Do not invent the missing sentence.
- The edit-gap intro says they are "marked" and then the mark name is blank: `Edit gaps (marked        in Part 2)`. In the body they are just the lines that start with "Edit gap:".
- Act 1 header ends `2:40`, V11 is at `2:25` plus a 1.5 s gap, and the mid-roll is `about 2:40`.
- Act 2 header ends `4:30`, V18 is at `4:30`, Act 3 header starts `4:40`.
- Act 3 header ends `6:15`, the second mid-roll is `about 6:25`, and Act 4 starts `6:25`.
- Act 4 header ends `8:10`. Act 5 starts `8:12`.
- Runtime is `about 9:00`, Act 5 is `8:12 – 9:05`, and V34 at `8:58` is followed by an **end screen (10 s)**, which runs past both 9:00 and 9:05 if you add it on top. Keep the end screen. Do not trim narration to hide the arithmetic. Let the Whisper timings decide the real length, and say so in the loudnorm / timing note.
- Page-break characters and a missing blank line between V12 and V13, and between V24 and V25, are extract damage. Do not "clean up" the script file.

Video Production owns the full Grok chunks. Your job is to cut the picture to the files they deliver, against this shot list, without writing new speech.
