# lf03 — paste this into Claude Code

Repo: `cravioaustralia-cmd/cryptonomics-engine`
Episode folder: `longform/lf03-hanson/`
Branch: `scaffold/lf03-hanson` (do not merge)
Film: **Jailed. Censured. Now #1. How Pauline Hanson Took Over Australian Politics**

This is a long-form documentary, 16:9. It is not a vertical Short. It is **not a map film**. Do not build an animated parchment map as the body of the picture. A map appears only if a narration line is specifically about a place, and even then only as a simple place card using a photo already in `images/`. Do not invent a Gallipoli-style map sequence.

Australian English in every label, caption, chapter, and on-screen card.

## Read this before you touch a frame

Narration source of truth:

`longform/lf03-hanson/audio/vo/` (S01.mp3–S37.mp3)

Matching text:

`longform/lf03-hanson/audio/vo-text/`

- Do not rewrite spoken words. Do not add facts, places, numbers, shots, or beats that are not supported by those voice files.
- `[pause]`, `[long-pause]`, `<slow>`, and `<soft>` were delivery tags. Never put them on screen. Never bleep them. They are not in the audio.
- If a card would say something the voice does not say, change the card.
- S23 ends with: Pauline Hanson has applied to the High Court for special leave, and that application has not yet been decided.
- S35 ends with: Her application to the High Court for special leave has not yet been decided.
- Do not change those two lines back to “wants to” or “may still go”.

Also read: `script/SCRIPT_NOTE.md`, `images/CREDITS.md`, `audio/MUSIC_CREDITS.md`, `broll/PROMPTS.md`.

## Role split

You do the design, the cards, the timeline, the edit, and the mix. The production manager already recorded the voice and generated the B-roll. You only place those files. Do not generate new AI video. Do not generate a likeness of any real person. Do not download Parliament footage.

## Picture

Master: 1920×1080, 30 fps.

Five layers, in the order the narration needs them. Not a map.

1. **Parliament footage.** There is **no** ParlView file in this repo. Do not download any. Do not pretend a clip is seated. Where the narration is about the chamber, use `images/IMG-house-of-reps-chamber.jpg` or `images/IMG-senate-chamber.jpg`, or an evidence card. The burqa moments in S20 are photos or a card only. Do not generate religious dress. Do not generate a burqa.
2. **Animated free photos.** Only the files in `images/`. Ken Burns is enough. Do not alter faces. Do not crop a person in from outside the file.
3. **Evidence cards.** Short, sourced, the same wording as the voice. If a source and the voice disagree, follow the voice file, and do not invent a third version.
4. **Timeline and data.** A simple timeline from 1954 to 2026, and the poll numbers the voice actually says. Latest Newspoll in the narration is 14–17 Sep 2026: One Nation 30, Labor 27, Coalition 19, Greens 13. Do not update the numbers.
5. **B-roll.** The twelve files in `broll/`. They are 1280×720. Scale them to 1920×1080. They are mute. Keep them mute. No captions burned into the video file.

First time an Imagine clip appears, put a small label on the edit: **Dramatised reconstruction**. Do not bake that label into the mp4.

If any B-roll clip shows a person, a face, a flag as the subject, a party logo, or readable text, do not use that clip. Cut to a photo or a card instead.

### Where the clips go

- B01 fish-and-chip shop: S05, Ipswich, the shop
- B02 metal roof: S06, the roof-plumbing business
- B03 empty kitchen: the quiet domestic beats, including S06 and S16 if a still moment needs air
- B04 printing press: the speeches and the press, not a named newspaper masthead
- B05 ballot: elections
- B06 tally room: election nights and the poll chapter
- B07 court papers: the jail appeal and the Faruqi case
- B08 cell door: the 2003 jail beat only. Always pair the conviction with the line that it was overturned. Do not leave “jailed” on screen alone.
- B09 empty ballroom: the launch and the later function beats. No party branding.
- B10 empty red seats: Senate beats. No readable crest, no flag as the subject.
- B11 phone: S22, the social-media reply. The screen stays unreadable.
- B12 country road: the Queensland and later landscape beats

### Photos you may use

Only these, and only for the person or place they actually are:

- IMG-hanson-2016.jpg, IMG-hanson-2006.jpg, IMG-hanson-2007-book-launch.jpg
- IMG-abbott-official.jpg
- IMG-faruqi-official.jpg
- IMG-joyce-official.jpg
- IMG-wong-official.jpg
- IMG-parliament-house-canberra.jpg
- IMG-house-of-reps-chamber.jpg
- IMG-senate-chamber.jpg
- IMG-ipswich.jpg
- IMG-qeii-courts-brisbane.jpg
- IMG-law-courts-sydney.jpg
- IMG-adelaide-skyline.jpg
- IMG-murray-river-albury.jpg
- IMG-albury-nsw.jpg

No photo, and no AI face, for John Howard, David Oldfield, or David Farley. Those moments are a name card.

Pin a small Abbott card in the top-right from S14, when the voice first says Tony Abbott was working against One Nation, and take it down at the end of S29, when the voice says he has changed his tune. Do not leave it up after that.

### On-screen care

- S22: the voice says the reply “pack your bags and piss off back to Pakistan”. Bleep the word “piss” in the audio. On the card, show “p*ss”. Do not show the unbleeped word.
- 2003 conviction is always paired with overturned or quashed.
- S30 is analysis. Label that chapter **ANALYSIS** on screen.
- S35 is **WHAT COULD HAPPEN**. Label it.
- No humour. No gore. No ethnic or religious icons. Ottoman is not in this film.
- Not affiliated with Pauline Hanson, One Nation, or any party. S04 already says so. Do not add a party logo.

## Audio

Locked from the Japan 1942 film.

- While the voice is talking, music is a quiet bed. The voice is always clearer.
- In pauses, bring the bed up. Not full.
- Change the bed with the scene. Tense (`tense-vertigo-597.mp3`) for the opening, the jail, and the court. Investigative (`investigative-feedback-dreams-588.mp3`) for the evidence chapters. Sombre piano (`sombre-piano-classical-7-714.mp3`) for the quiet beats. Surge (`poll-surge-dreaming-big-31.mp3`) for the poll climb.
- Mute every B-roll clip. No original speech from anywhere.
- Hits land on the picture, never on a word. Shutter, typewriter, whoosh, coin, door, bell, paper tear, and the gavel are in `audio/sfx/`. The gavel’s licence does not explicitly say YouTube. Use it once, on the court beat, and credit it. There is no stamp thud. Do not add a siren.
- Open with `audio/sfx/series_sting.flac`.
- Do not speed or loudnorm the voice files themselves.
- Build the cut at 1× first. The file you deliver is the whole film at **1.28× with the pitch held**, then two-pass loudnorm on that master only. Target about **−14 LUFS**. True peak at or under **−1.5 dBTP**.
- Write `final/loudnorm-report.md` with the measured numbers.

Suggested mid-rolls, only if the cut is long enough for them: after S17, after S23, after S29. Do not put a mid-roll on a word.

## Delivery

On this branch, not merged:

- The 1.28× master mp4
- A contact sheet
- A chapter list with times on the master
- The loudnorm report

Do not upload to YouTube. Do not open a pull request. Do not @ anyone.

Credits for the description already live in `images/CREDITS.md` and `audio/MUSIC_CREDITS.md`. Do not drop a credit because a thumbnail was used instead of the full original. Say so if you mention the file size.
