# lf03 delivery notes

Branch `scaffold/lf03-hanson`, not merged. Not uploaded. No pull request.

## Delivered

- `lf03-hanson.mp4`: the whole film at 1.28×, pitch held, 1920×1080, 30 fps.
- `contact-sheet.jpg`: one frame every 12 seconds of the master.
- `CHAPTERS.md`: chapter list and suggested mid-rolls, in master time.
- `loudnorm-report.md`: measured numbers.
- `../CUE_SHEET.md`: every music cue and effect the mix used.

## Decisions to check

- **B06 tally room is not used.** Its monitors show blurred head-and-shoulders figures, which counts as people. The poll beats use data cards instead.
- **B04 printing press** is used only for its first 3 seconds of source. A pinned newspaper page appears later in the clip.
- **Greens 13 is not on screen.** The S28 voice gives One Nation 30, Labor 27 and Coalition 19 only. The card shows those three. The source line reads "Newspoll, fieldwork 14–17 September 2026".
- **S20 wording.** The voice says government senators "said their votes were an administrative error". The text file says "had been". The card follows the voice.
- **Source lines** name only the sources the voice names: Hansard, the courts, ABC, Newspoll, Roy Morgan. The S19 academic article has no title in the repo, so its card says it is listed in the description. The full source list for the description is not in this repo.
- **The 2003 conviction** never appears without "overturned" or "quashed" on the same card: S01, S02 and S16.
- **The Abbott pin** goes up on "working" in S14 and comes down at the end of S29.
- **Chapter tags.** S30–S34 carry an ANALYSIS tag. S35 carries WHAT COULD HAPPEN.
- **"Dramatised reconstruction"** is a small label on the first B-roll shot (B08, S01). It is an overlay in the edit, not baked into any B-roll file.
- **No photo or AI face** for John Howard, David Oldfield or David Ettridge. Each is a name card. S20 and S24 burqa beats are Senate chamber photos and cards only.
- **Photos not used.** Penny Wong is never mentioned in the narration. The QEII Courts photo would have implied a 2003 courtroom that did not exist then. The Murray River photo was not needed. Every photo that is used carries its author and licence on screen.
- **Place cards** are a photo or real footage with a caption only: Ipswich (S07, photo), Adelaide (S27, photo) and Albury (S27, real timelapse, for Farrer). There is no map.
- **Effects.** The gavel is used once, on QUASHED after S16. It needs the credit in `audio/MUSIC_CREDITS.md` in the description. The service bell is not used.
- **Image credits.** Several photos in `images/` are standard Wikimedia thumbnails, not full originals. `images/CREDITS.md` gives both sizes. Every credit still applies to the description.

## Fix pass (5 Oct 2026)

The existing edit was patched, not rebuilt. Cards, photos, chapters, the Abbott pin, the ANALYSIS and WHAT COULD HAPPEN tags, and the first-B-roll "Dramatised reconstruction" label are unchanged.

- **Voice.** The narration is now `audio/vo-even/` (S01–S37). `audio/vo/` is untouched and no longer used. Every picture beat is keyed to a spoken word, so the takes were re-timed with Whisper and each beat moved only as far as its word moved. Every anchor was re-checked against its surrounding words.
- **Bleep.** Re-measured on the new S22 take: 25.95–26.235 s inside the take, from the "p" release to the end of the "ss", stopping before "off". A Whisper pass over the bleeped mix no longer hears the word.
- **Real footage used.** Ten clips replace AI B-roll or static photos where they match the line: Parliament House (F01), Brisbane (F03), Albury for Farrer (F04, F05), a real press (F07, replacing B04), a road at sunset (F16, replacing B12 in S32), a landscape for the outro (F19, replacing B12), and Canberra with Parliament House in view (F30, F31, F33). All are muted, scaled to 1920×1080, and credited on screen and in `footage/CREDITS.md`. F01 stops before its watermark at 8.4 s.
- **Real footage not used, and why.** F09 has readable Spanish headlines. F10, F11, F26 and F27 show strangers, and on S22 a stranger on a phone would read as Hanson typing her reply. F12 and F13 show a US flag. F14 is a staged judge with a gavel, which would read as the real trial. F22 is New York and F23 is Tokyo Tower. F25 is a modern kitchen, wrong for the 1980s beat. F28's suited man would read as a lawyer in the case. F29 is welding, not roof plumbing. F32 is a carnival. F02, F06, F08, F15, F17, F18, F20, F21, F24, F34 and F35 fitted no line better than what is there.
- **AI B-roll kept** where no real clip fits: B01 shop, B02 roof, B03 kitchen, B05 ballot, B07 court papers, B08 cell door, B09 ballroom, B10 Senate seats and B11 phone. B04 and B12 are no longer used.
- **No real clip sits on S35 (WHAT COULD HAPPEN).** No ParlView.
