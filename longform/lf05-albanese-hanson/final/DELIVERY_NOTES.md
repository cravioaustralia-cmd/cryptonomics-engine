# lf05 delivery notes — 94 Seats vs 30%: Can Albanese Stop Pauline Hanson?

Cut on 6 Oct 2026 (Australia/Sydney) on branch `scaffold/lf05-albanese-hanson`. Not merged, no pull request,
nothing uploaded.

## What is in `final/`

| File | What it is |
| --- | --- |
| `lf05-albanese-hanson.mp4` | The master: whole film at 1.28x with pitch held, two-pass loudnorm on the master only. 1920x1080, 30 fps. |
| `loudnorm-report.md` | Measured integrated loudness and true peak, the chain, and the music dip under the voice. |
| `chapters.md` | YouTube chapters, chapter table, mid-roll times, a cue sheet for every block (1.28x and 1x), music cues and SFX. |
| `contact-sheet.jpg` | One frame per block (holds, segments, mid-roll beats, end screen). |
| `contact-sheet-shots.jpg` | One frame per shot. |
| `DESCRIPTION.md` | YouTube description draft: chapters, sources, the 2003 conviction note, and credits for media in the cut only. |
| `DELIVERY_NOTES.md` | This file. |

## Picture QC: seated clips held back

These clips are seated in the episode folder but stayed out of the cut after QC. Each one broke a rule in the
brief. Nothing was downloaded or generated to replace them; the beats use other seated media and cards.

| Clip | Why it is out | What covers the beat |
| --- | --- | --- |
| `broll/B04.mp4` petrol board | The price digits are readable (237, 233, 227, 222). The brief says readable text means the clip is not used. | S10 fuel line: card over F05 Albury night street. S24: B05 bills still life + F36 trolleys. |
| `footage/F09.mp4`, `F10.mp4` ballot | A large US flag fills the background. It reads as an American polling place. | B01 / B08 (AI, labelled) and the 150-seat chamber graphic. |
| `footage/F12.mp4` street | New York yellow cabs. Wrong country. | Not needed; Australian city clips cover S20–S24. |
| `footage/F13.mp4` night aerial | Tokyo skyline with Tokyo Tower. Wrong country. | F28 Sydney aerial, F03 Brisbane. |
| `footage/F30.mp4` Melbourne Airport | A close, identifiable face of a private person. | F41 Sydney landing timelapse. |
| `footage/F14.mp4` phone | Vertical clip of a private person's face. | F15 (overhead, face not the subject) and B03. |

Also not used: F04, F08, F21–F26, F42, and the photos `IMG-house-construction-qld`, `IMG-new-housing-estate-wa`,
`IMG-melbourne-box-hill-aerial`, `IMG-sydney-skyline` and `IMG-murray-river-albury`. Other seated clips covered the
same beats, with real footage preferred over stills. None of these are credited in `DESCRIPTION.md`.

## Rules applied

- **Narration**: `audio/vo/S01–S41.mp3` placed untouched at one fixed gain. No retime, pitch change or loudnorm on
  those files. `audio/vo-raw/` untouched. Delivery tags never appear on screen.
- **Cards match the voice.** Every number on screen is a spoken number. The only other figures are source dates on
  evidence cards and poll Polaroids (pollster fieldwork dates, as the brief asks).
- **Evidence labels** on every card: FACT (white), CLAIM (orange outline), ANALYSIS (blue), SPECULATION (grey,
  dashed, ending only: S39 UNKNOWN column and the S40 Victorian test card).
- **Every poll Polaroid** carries pollster, fieldwork dates, sample size where it is spoken (1,244; 4,967; 228),
  and "One poll is a snapshot, not a verdict."
- **2003 conviction**: the S14 stamp shows the struck word, QUASHED and "The conviction was overturned on appeal" in
  one image from its first frame. The word never appears alone.
- **ParlView FREE SWAP**: no chamber video. S01 / S14 / S27 use the House chamber photo; S28 uses the plain Senate
  photo with the lower-third "Senate, 24 November 2025" and a plain text FACT card, with nothing animated over the
  photo.
- **Named people** appear only in their seated free photos. Howard, Farley and Rinehart get name text only.
- **AI B-roll** (B01, B02, B03, B05, B06, B07, B08, B09) carries "DRAMATISED RECONSTRUCTION" on every AI shot, in the
  edit only. The first AI shot is B06 in S10.
- **Not a map film.** The state data in S20–S22 are tiles and cards, not a map.
- **Holds** H0–H9: music rises, picture keeps moving, no voice. **Mid-rolls** only after S13, S25 and S33.
- **Music** under the voice sits about 27.5 dB below the hold level (about 85% quieter). See the loudnorm report.

## Where the cut differs from the brief

- **S28 censure card**: the brief lists "(36–17)" for the March censure vote. The voice never says those numbers,
  so the card says "Hanson censured over her comment that there are no good Muslims. Coalition votes against."
  and cites ABC, 2 March 2026. The 36–17 figure is left off screen under the "cards match spoken words" rule.
- **First AI clip**: the brief expected B01 at S25 to be first. B06 (empty shopfront) now opens S10's
  cost-of-living line because B04 was held back. Every AI shot carries the label, so the first one is covered.
- **Rinehart lower-third** reads "Mining billionaire · name card only" so viewers know no photo is shown.

## Recheck on upload day (from `script/PUBLISH_CHECKS.md`)

Newspoll (a new release is due), RBA decision 3 Nov 2026, Victorian election 28 Nov 2026, any new Hanson censure,
the High Court special leave outcome, and One Nation's seat and senator count. If any of these move, the matching
VO line and card need an edit before upload. A media-lawyer review of the final cut is still required.
