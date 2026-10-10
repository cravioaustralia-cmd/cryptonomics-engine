# lf06 Ch1: delivery notes

Deliverables in `final/`: `lf06-gaza-ch1-1x.mp4` (review cut, 2:12.3), `lf06-gaza-ch1.mp4` (1.28x pitch-held master, 1:43.4), `loudnorm-report.md`, `chapters.md`, `DESCRIPTION.md`, `contact-sheet.jpg` (one frame per second of the 1x cut), `contact-sheet-shots.jpg` (31 key shots).
Build: `render/` (timeline from the real voice files, canvas + d3-geo renderer driven by Playwright, numpy mix, ffmpeg master). The voice files in `audio/vo/` and `audio/vo-raw/` were read only.

**Nobody has listened to this cut, including me.** I cannot play audio. Every audio judgement below comes from measurement, word timings and the waveform, not from listening. The by-ear list near the end is the first thing to do.

## S10 balance check (measured on the rendered 1x frames)

| Check | Left half (PH03) | Right half (PH04) |
|---|---|---|
| Width on screen | 956 px | 956 px |
| Height | 1080 px | 1080 px |
| On screen | 64.85 s to 87.36 s (22.51 s) | 64.85 s to 87.36 s (22.51 s) |
| Entrance | slides in from the left, 1.3 s | slides in from the right, 1.3 s (same curve, same frames) |
| Ken Burns | zoom 1.04 + 0.0042 per second | identical (one function draws both halves) |
| Grade, grain, vignette | archival sepia | identical |
| Caption and credit | "Tel Aviv, 14 May 1948" · Hans Pinn / GPO Israel, CC BY-SA 3.0 | "Galilee, October 1948" · David Eldan / GPO Israel, CC BY-SA 3.0 |
| Caption timing | fades in at 66.15 s | fades in at 66.15 s |
| Label | "1948 — INDEPENDENCE" | "1948 — THE NAKBA" |
| Label timing | drawn from frame 2276 (75.86 s, the word "Nakba") | drawn from frame 2276 |
| Music under the half | MUS06, median −34.4 LUFS-M | MUS06, median −34.1 LUFS-M |
| Sound effects | none | none |

- The labels are drawn on the same frame by the same code. The pixel detector first sees the left label change on frame 2277 and the right on frame 2279, because the right label's thin first fade frames sit on a brighter sky and cross the detection threshold two frames later. The underlying fade is identical.
- **Label trigger:** the brief asks for the left label on "rescue" and the right on "Nakba", and also for both labels on the same frame. Those cannot both hold, so both labels appear together on "Nakba" (75.86 s). By then the voice has named both memories. Before that frame neither half carries a label; both carry their place-and-year caption.
- The music level is constant by design: one fixed bed target across both memories with no ducking changes inside S10. The 0.3 dB difference above is the piano's own phrasing.
- The divider glows amber on "The same event" and holds 2.0 s with no narration. That hold sits in the voice's own pause after "…two opposite ways."; S10 is cut inside that silence in the edit and the gap widened by 1.57 s. No word was moved or touched, and the file is unchanged.
- **One asymmetry by script:** the "700,000+ displaced" number rolls only on the right half, because the voice says it. Its source tag reads "UN Conciliation Commission for Palestine, 1950: ~711,000".

## Shots replaced or held back

- **FT05 (UN film of the vote):** not licensed. The script fallback is used: PH26 with a flicker pan, a 1.7 s FT05b cutaway captioned "United Nations, Lake Success, New York, 1946", and the DOC01 page.
- **PH26** is captioned "UN General Assembly, 1947" only. The man at the rostrum is not labelled.
- **S06 opening:** the voice says "The new United Nations is deciding the future of Palestine". Over that line I used the UN partition-plan map (A/516 Annex A). It is cropped to the title block "Palestine Plan of Partition… proposed by the Ad Hoc Committee on the Palestinian Question" and the northern map, with the UN name and map number cropped out. It is captioned "Plan of partition proposed by the Ad Hoc Committee, November 1947". It ties straight into "chairing the committee". Swap it for PH26b if you prefer a room shot.
- **PH01b** (press conference, May 1945) is used for 1.9 s under "And chairing the committee", with its own date caption. Nothing places Evatt in the 1947 hall.
- **Not used:** FT02b (1918 Light Horse columns; under "one of the last great cavalry charges" it could read as the charge itself), PH02d, PH26b, and PH06b (skipped by default: no balancing image of the same weight). FT02 and FT02c are used, each with its own year.
- **AI03 and AI05** are both used, each with a "Dramatised reconstruction" label (the label appears on AI05 too, for consistency). In the sampled frames I saw no glitch. I could not watch them in motion at full speed, though, and the manifest notes a small latch wobble on AI05's left case. Watch 1:31–1:35 (1x). If it shows, the planned fallback is a PH05 pan.
- **MAP03:** both zones, both labels and the legend appear at the same moment and the same speed. Proposed Jewish state is slate and proposed Arab state is sand; the Jerusalem zone is off-white with a grey ring. No modern lines or names appear. A neutral light sheen crosses both zones together on "Arab state", for motion during the beat.
- **MAP02:** the charge arrow is schematic, coming from the east, and is not a traced route. The road line runs Beersheba to Hebron to Jerusalem, also schematically. No borders are drawn.
- **MAP01:** the globe uses Natural Earth's present-day country outlines at very low contrast; this is the modern "Thread" map, not a 1947 map. Node 1 "1947 VOTE" is the first of nine evenly spaced nodes from Sydney. The other eight are dim and unlabelled.
- **Lower third:** "Australian Foreign Minister" follows the brief. His formal 1947 title was Minister for External Affairs.

## Check by ear (in this order)

1. **Beds:** nobody has heard any of the four tracks.
   - MUS12 into MUS02 under the opening cards.
   - MUS02 through S05–S09, with the hand-ridden +3 dB swell after "Australia" at 0:36.5.
   - MUS02 into MUS06 (S09 hold, 1:04.6–1:07.6).
   - MUS06 back into the "warm" MUS02 at 1:31.3, entering at 1:06.5 in the file so its A-major lift lands as the crossfade completes.
   - MUS02 out and MUS03 in on "wired into the war" (2:05.0).
   - Swap any bed that fights the voice or sounds wrong for the mood.
2. **MUS06 start point:** MUS06 has a near-silent stretch at 20–24 s in the file, which would have fallen exactly on the S10 "same event" hold. It now starts 14.85 s into the file. Check that the phrase under the hold works musically.
3. **Names:** "Evatt" (S06, 0:21.5) and "Beersheba" (S08, 0:48.7, 1x). Whisper heard "Evatt", but it was prompted with the script, so that proves nothing. If a name sounds wrong, it needs a voice fix; the audio was not re-timed.
4. **SFX19** "stamp" on "ballot" is a softened punch stand-in, kept low. **SFX20** marker is slowed to 0.68 s with atempo to match the circle draw, so check for smearing. **SFX16** hooves run for 2 s under the arrow.
5. **Handovers:** S05 to S06 has 1.0 s of air (that is the S05 hold). S11 to S12 and S12 to S13 each have 0.4 s. Listen to whether Ara's two lines sit naturally between Atlas's.
6. **1.28x:** the pitch-held rubberband pass handles speech well in general. S07's one-second beats become about 0.8 s, and the S10 hold becomes 1.6 s. Judge whether the 1.28x master still feels like a documentary pace.

## Levels (summary; full figures in `loudnorm-report.md`)

- Voice clip gain is one static gain per file, bringing every file to the same loudness, with S10 1 dB softer for its "soft" delivery.
- Bed under speech sits about 17–19 dB below the narration in S06–S13. S05 is 15 dB, because the projector rattle and the flap ticks run under it.
- In the music-only holds the bed rises to about 6–12 dB under narration level.

## Stillness check (golden rule)

`render/qa.py` compares each frame with the one 0.5 s earlier at low resolution (grain filtered out) and flags any run over 2 s with no visible change. On the final render it flags:

| 1x time | Length | What is on screen | Assessment |
|---|---|---|---|
| 0:01.7–0:03.7 | 2.0 s | disclaimer card (paragraphs fade in, slow push) | no narration; reads as a held card, as intended |
| 0:52.7–0:55.0 | 2.3 s | MAP02: road line draws to Jerusalem, Jerusalem pin drops | moving but thin, too small for the detector; acceptable |
| 1:29.7–1:32.0 | 2.2 s | TWO MEMORIES card pinned (end of S10's quiet moment, slow drift) | S10 exception; the run overlaps the first 0.1 s of S11's dissolve |
| 1:56.2–1:59.6 | 3.4 s | globe: Gaza label, node row, "14,000 km", node 1 lights, "1947 VOTE" label | something happens about every second, but every element is small; the globe turns slowly |
| 2:03.0–2:07.7 | 4.7 s | globe zooms in; clock fades; pulses start running along the Thread on "wired" | **weakest stretch:** about 1.7 s (2:03.3–2:05.0) of slow zoom only |

Everything else, including all of S05–S09 and S11–S12, passes.

## Pilot review questions (honest answers)

**Does S05–S07 make you want to know what comes next?**
Mostly yes, on picture. S07 is the strongest minute: the UN document zoom, the map splitting, then the roll call ticking down to Afghanistan No, Argentina Abstain, Australia Yes, with the circle landing on "Australia". The payoff is real and sourced on screen. The weak point is the start. A standalone viewer sits through 7.4 s of disclaimer and chapter card before the first word, and S05 is only 4.3 s of voice over a 1947 still and a soft 1946 newsreel. In the full film, where S04 already carries the disclaimer, this problem largely disappears.

**Do Atlas and Ara sound like they belong in the same film?**
I can't answer this; I have not heard them. What I can say: both voices are levelled to the same loudness and were paced to one median target. Ara has only two short lines, a 4.9 s and a 7.5 s file, which makes timbre the open question for an editor's ear.

**Are the free archival photos rich enough, or thin?**
Rich in places, thin in others.
- **Strong:** the UN documents (resolution, verbatim record, voting sheet, partition map), PH03 and PH04, PH05, and the Evatt portrait.
- **Thin:** the 1917 material. The AWM stills are about 640 px wide, so they sit on the desk at no more than 70% of the frame. FT02, FT02c and FT05b are SD film upscaled to 1080p and visibly soft. There is no real footage of the 1947 vote. PH06 is a 2007 street scene standing in for a migration story.
- The desk, maps and evidence cards carry the chapter visually; the photos alone would not.

**Does anything stay still for more than 2 seconds outside S10?**
See the table above. Nothing is frozen. The globe in S13 is the one stretch where the reactions are too small and slow to fully meet the golden rule; consider a faster spin or an extra beat there in the full build.

**Would a viewer from either community feel S10 treated their history fairly?**
The construction is symmetric, and the measurements above show it. Four points an editorial reviewer should weigh, not assume away:
- Both photos come from the Israeli Government Press Office archive. PH04's original archive caption reads "Arab People fleeing from their galilee villages as israeli troops approach". The film shows only the neutral caption "Galilee, October 1948".
- The left label says "INDEPENDENCE" while the voice says "rescue, after the Holocaust". The label is the script's wording, but a viewer may notice the label and the voice differ on the left and match on the right.
- The 700,000+ figure appears only on the right, because only that half's narration has a number.
- One photo shows celebration and the other shows displacement. That is the point of the segment, and it is also what each side may react to most strongly.
My judgement: it is as balanced as the script and the seated photos allow. It should still go before one reviewer from each community before the full film is built.
