# lf09 Is Australia Full? Delivery report

Built 15 Oct 2026 on branch `claude/model-opus-0cvyrr`. The pipeline lives in `render/` (see `render/README.md`).
The video files are not in git (over 100 MB). They sit at `render/out/` in the build session.

## Outputs

| File | Runtime | Frames | Size |
|---|---|---|---|
| `lf09_1x.mp4` (natural speed) | 13:23.4 | 24,103 | 823 MB |
| `lf09_master_1.28x.mp4` (pitch held) | 10:27.7 | 18,830 | 682 MB |

Both files are 1920×1080, 30 fps, H.264 High (CRF 18), AAC 320 kbps at 48 kHz.
The master is rendered natively at 1.28×, not frame-dropped. Its 800/DAY counter runs on viewer time, so "+1 every 1m 48s" stays true.
The S42 payoff reads +6 in the 1× cut and +5 in the master, which matches the ticks each viewer actually sees.

## Checks (full runtime, both files)

| Check | 1× | 1.28× master |
|---|---|---|
| Segments / VO present in order | 44 / 44 | 44 / 44 |
| blackdetect (d 0.1 s, pix_th 0.10) | 0 hits | 0 hits |
| freezedetect (n 0.001, d 1.5 s) | 0 hits | 0 hits |
| Empty frames (no content on screen) | 0 of 24,103 | 0 of 18,830 |
| A/V stream difference | 0.74 frame | 0.91 frame |
| Integrated loudness | −14.0 LUFS | −14.0 LUFS |
| True peak | −2.5 dBTP | −2.5 dBTP |
| Loudness range | 4.6 LU | 3.8 LU |

- **Narration stem:** −14.0 LUFS integrated. No digital silence anywhere, because a room-tone bed runs under the whole film.
- **Silence scan:** every pause of 0.9 s or more inside a segment falls on a script pause marker (S02, S05, S11, S12, S15, S32, S36, S40, S43 ×3, S44).
- **Music:** sits about 20 dB under speech, with 150 ms attack and 600 ms release ducking. It drops fully out for the three mid-roll beats after S15, S27 and S36.
- **Watermark:** the Grok mark is cropped out of every AI B-roll frame before scaling. Corner crops from all AI shots in the final file show no mark.
- **Text check:** every on-screen quote matches Part 7. Every on-screen number comes from Parts 7 and 9.

## Narration (ASR, Whisper medium.en and large-v3)

The final narration matches the Part 6 text word for word, apart from number formatting and spelling variants such as Labor/Labour.

**Retake needed: S14, the word "capped".** Atlas says "caped" (rhymes with "taped"). Both Whisper models agree, in context and on the isolated word. The raw take is used in this cut and has not been patched.

Every name on the watch-list is recognised: Albanese, Canberra, Specsavers, DemosAU, Farrer, Sheehy, plus Ipswich, Burke, Haines and Gorman. "Hanson" sometimes transcribes as "Hansen", but the two are homophones and the models swap them on the same audio.

## Pacing

- **Tempo:** one uniform pitch-held tempo of 0.92× on all segments. There are no per-segment stretches.
- **Overall pace:** 145 wpm, counting words in digit form as Part 5 is written.
- **Target fit:** 18 of 44 segments sit within ±6% of their Part 3.11 target, and 25 within ±10%.
- **Fast segments:** eight read more than 15% fast because Atlas delivered them quickly: S05, S11, S19, S21, S27, S29, S32 and S39. Reaching target there would need an extra per-segment stretch, which conflicts with the one-steady-tempo rule. A slower retake of those lines is the clean fix.

## Chapters (1× · master)

0:00 · 0:00 The question
1:12 · 0:56 Chapter 1: The numbers
2:44 · 2:08 Chapter 2: Hanson's thirty-year argument
3:56 · 3:04 Chapter 3: The rise
5:06 · 3:59 Chapter 4: The pattern
7:07 · 5:33 Chapter 5: The case against "copying"
8:47 · 6:52 Chapter 6: Who pays?
10:18 · 8:03 Chapter 7: The twist
11:45 · 9:11 Is Albanese copying Hanson?

Mid-rolls fall at 3:56, 7:06 and 10:17 in the 1× cut, and at 3:04, 5:33 and 8:02 in the master. The end screen starts at 13:08 in the 1× cut and 10:15 in the master.

## Fallbacks and stand-ins used

- **FT01–FT05 (ParlView):** all free swaps using a real free photo with a date, quote or paraphrase card. No news, agency or press-club footage is used.
- **S12 and S43:** the 2016 CC0 Hanson portrait stands in for 1996 footage. It is captioned "pictured in 2016".
- **David Farley:** shown as the script's name card. The only free file is a 322 px group photo with other people in frame.
- **Missing stock:**
  - Lectern: replaced by the empty-hall AI clip's stage microphone, labelled as AI.
  - Orchard, pub and motel: replaced by a regional map with icons over the outback AI clip.
  - Graduation caps: replaced by the campus still and the classroom clip.
- **Passport clip:** soft-blurred, because it showed a US crest and readable boarding passes.
- **Classroom clip:** the handwritten whiteboard is blurred.
- **Motorway clip:** captioned "illustrative, not Australian".
- **Dramatised reconstruction label:** shown on every AI shot, including the first one in S01.
- **Unverified facts kept off screen:** the Coalition's 130,000 year is labelled "then" rather than "2030–31", which the script doesn't state. "Of 150" seats and "includes Albury" were also removed.

## Still open before publishing (script Part 10)

- Confirm the June Newspoll fieldwork dates. The card shows "Published 16 Jun 2026 · n ≈ 1,240".
- Confirm the Joyce accusation in S26 in a major outlet. The card says "reported 7 Oct 2026".
- Change "this week" in S39 to "in October" if publishing after about 22 Oct.
- Get the ParlView confirmation, a final lawyer review and the description credits.
