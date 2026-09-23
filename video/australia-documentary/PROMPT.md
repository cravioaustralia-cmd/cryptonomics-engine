# Build my documentary: "The Entire History of Australia"

Create a fully finished, cinematic, documentary-style YouTube video from the files in this project. Do NOT use Remotion or any video framework. Follow every step below, and follow the standing rules in CLAUDE.md on every run.

## What's in this project

- `audio/australia-history-final-mix.mp3`: finished audio (voiceover + music + sound effects). This is the video's main audio track.
- `audio/australia-history-vo.mp3`: raw voiceover only. Use it for transcription.
- `script/australia_voiceover_script.md`: the narration. Words in brackets are delivery notes, not spoken.
- `script/australia-shot-list.md`: which image goes where. Times follow the audio and are approximate.
- `script/sound-cue-sheet.md`: where each sound effect and music change sits in the mix.
- `images/`: 97 numbered images plus `SOURCES.md`.
- `sfx/` and `music/`: the original sound files, for opening/closing audio and any remix.

If only `australia-documentary.zip` is present, unzip it first. If the zip isn't in the repo, download it from the GitHub Release tagged `assets` using the gh CLI, then unzip.

## Step 1: Setup

- Check that Python, Node, Playwright (headless Chromium), ffmpeg and Whisper are installed. Install anything missing.
- Transcribe `audio/australia-history-vo.mp3` with Whisper using word-level timestamps. Save `transcript.json`. Time every image, animation, caption and subtitle to the exact spoken words. The times in the shot list and cue sheet are only estimates.

## Step 2: Check images, licences and credits

The images have been reviewed and mostly replaced already. Do not swap images except in these cases:

- Replace `61_anzac_dawn_service.jpg`. It shows an empty street, not a dawn service. Find an Anzac Day dawn service photo (crowd or memorial at dawn) on Wikimedia Commons. Keep the same file name.
- 44 images are listed in `SOURCES.md` only as "Wikimedia / typically PD or CC": 11, 13, 14, 17, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 39, 40, 41, 43, 48, 50, 51, 53, 54, 55, 56, 57, 58, 59, 60, 63, 64, 67, 68, 69, 70, 71, 73, 74, 75, 79, 89. For each, find the exact Wikimedia Commons file page (use the Commons API) and record its real licence and author. Check 73 (a 1975 photo), 75 and 79 (1960s–70s portraits) with extra care.
- Acceptable licences: Public Domain, CC0, CC BY, CC BY-SA, Pexels License, Pixabay License. If an image isn't clearly free to use, replace it with a similar image under one of these licences, keeping the file name. Tell me what you changed.
- Update `SOURCES.md` with the exact file page for every image.
- Write `CREDITS.txt` listing every image (file, title, author, licence, source URL), formatted to paste into a YouTube description. Every CC BY and CC BY-SA image must be credited.
- `34b_flag_raising_1788.jpg` goes on "raised the British flag at Sydney Cove", after 34.

Caption notes, if you add on-screen captions:
- 73 shows Gough Whitlam pouring soil into Vincent Lingiari's hand in 1975, not the 1966 walk-off. Caption: "1975: land handed back to the Gurindji people."
- 80 is the yacht *Australia* (KA-5), not *Australia II*, the 1983 winner. Don't caption it as the winner.
- 53 is a portrait of Ned Kelly, not his armour.
- 18 shows the Budj Bim landscape, not the eel channels.

Show me a contact sheet of the final image set before continuing.

## Step 3: Style kit (reused by every chapter)

- `style.js`: palette (red-ochre earth, eucalyptus green, sandstone, deep outback-night indigo, sunset orange), easing functions, film grain, vignette, camera helpers (push-in, pan, parallax), text-reveal helpers.
- `characters.js`: original flat-2D characters with separate head, arms and legs, including a recurring cartoon emu mascot with big expressive eyes and a slightly smug attitude.
- `maps.js`: animated maps built from real coastline data (Natural Earth, public domain). Never draw coastlines freehand.
- Two free fonts downloaded into the repo: an elegant serif for titles and opening/closing cards, and a clean sans-serif for subtitles, labels and dates.

## Step 4: The cinematic look

- Documentary feel throughout: slow, deliberate camera moves, soft crossfades, gentle film grain, subtle vignette, and a consistent warm colour grade. Black-and-white photos stay black-and-white with a slight warm tone.
- Real images carry the serious and historical moments: slow push-ins and pans, and small typewriter-style dates and place labels (for example "SYDNEY COVE · 1788"). On clean landscape photos only, you may split foreground and background for a subtle 2.5D parallax. Skip it wherever it would create visible artefacts.
- Flat 2D animation carries the funny moments: the hook, the megafauna (animated Megalania), Bligh overthrown twice ("zero for two"), the Emu War, Francis de Groot on horseback, and the Harold Holt swimming-pool joke. The emu mascot appears in the hook, the Emu War and the ending.
- Animated maps where they help the story: the Ice Age coastline and first sea crossing, Dutch voyages to the west coast, Cook's route up the east coast, the First Fleet's voyage from Portsmouth to Botany Bay, gold rush sites, the six colonies joining at Federation, Gallipoli, and Darwin in 1942.
- Chapter title cards (about 2.5 seconds, over the start of each chapter's first line): a small "CHAPTER ONE" style label above a large serif title, with a slow reveal and a thin ochre underline. Titles: The Land That Time Forgot · The First Australians · The Strangers Arrive · The Prison at the End of the World · Mutiny, Rum, and a Very Unlucky Man · Gold Fever · A Nation Is Born, and Tested · Emus, Bridges, and Bombs · The Big Transformation · Modern Australia.
- Images smaller than 1920 px wide: zoom no more than 110% so they stay sharp. Portrait images: show centred at full height over a blurred, darkened copy of themselves. Never stretch images or crop faces.
- Leave historical photos and paintings unaltered: no colourising, no animating people's faces.
- On-screen text only states facts that are in the script. Don't add new facts, numbers or dates.

## Step 5: Respect

- Show First Nations people with dignity. Do not copy or animate Aboriginal artworks, sacred symbols or specific art styles. The Kakadu rock-art photo (05) is shown only as a still photo with a slow, gentle move.
- No violent or distressing imagery for the Frontier Wars, the Stolen Generations or Port Arthur.

## Step 6: Opening cards (before the hook)

These come before the narration starts. Use a slow push-in across an animated night sky over a dark outback horizon (built from the style kit), with soft stars drifting. Serif font, white text, each line fading in gently. Audio: `music/didgeridoo_ambient.mp3`, quiet, fading in over 1.5 seconds and out as the hook begins.

Card 1, about 8 seconds:
> Long before this land had a name on any map,
> it was known, sung, and cared for.
>
> We acknowledge the Traditional Custodians of Country throughout Australia
> and their continuing connection to land, sea and sky.
> We pay our respects to Elders past and present.

Card 2, about 5 seconds:
> Aboriginal and Torres Strait Islander viewers are advised
> that this film contains images and names of people who have died.

Then cut into the hook. Shift the whole narration and final mix later by the exact length of these cards.

## Step 7: The hook (to "Let's go.")

Animated. A 1930s wheat field with two cartoon soldiers and an old mounted machine gun. On "against birds", cut to the emu mascot in close-up, blinking. On "And the birds won", emus scatter in clouds of dust. Then a quick montage, one image per idea: prison hulks (02), Bligh (03), rough surf (04), and the outback at night under stars with a small campfire. On "Today, we're covering ALL of it", a map of Australia fills with icons (giant lizard, ship, gold nugget, Opera House, emu). On the last question line, a slow push-in on Uluru (07) with a softly glowing question mark. On "Let's go", the title card: "THE ENTIRE HISTORY OF AUSTRALIA" in large serif lettering with a thin ochre underline, the emu peeking in from the edge. Whoosh-timed cut to Chapter One.

After the hook, follow `script/australia-shot-list.md` in order, matching each image to its line in `transcript.json`.

## Step 8: Closing cards (after the last spoken line)

Card 3, about 9 seconds, over a slow drift across Uluru at dusk (90), darkened. Serif font, white text, lines fading in one by one:
> A note on this story
>
> This film is drawn from historical records and the best research available to us.
> History is vast, and new evidence is still coming to light.
> If we've got anything wrong, it was never our intention.
> Tell us in the comments, and we'll keep learning together.

Then the end screen, 15 seconds, on `94_end_screen_blank.jpg`: "Thanks for watching" and "Subscribe for more", leaving the right side clear for YouTube end-screen elements, with the emu mascot blinking in a lower corner.

Audio under the closing cards: `music/dark_mysterious_ambient.mp3`, quiet, continuing smoothly from the end of the final mix and fading out over the last 4 seconds.

## Step 9: Subtitles

- Burn English subtitles at the bottom from `transcript.json`: 1–2 lines, clean sans-serif, soft dark rounded background, never covering key action. No subtitles on the opening and closing cards (their text is already on screen).
- Also export an SRT for each chapter.

## Step 10: Audio

- The video's audio is: opening-card music, then `audio/australia-history-final-mix.mp3`, then closing-card music.
- Check the sound-effect times in `script/sound-cue-sheet.md` against `transcript.json`. They were estimated. If any effect is more than about half a second off its line, rebuild the mix with corrected times using the files in `sfx/` and `music/`, keeping the same volumes and music changes. Tell me which cues you moved.
- Final loudness about -14 LUFS, true peak no higher than -1.5 dB.

## Step 11: Technical approach

- All artwork as SVG in a single HTML file per chapter, driven by `renderFrame(t)`. No CSS animations or timers, so every frame is deterministic.
- Playwright steps through t at 30 fps, 1920x1080. Render frames in parallel chunks and pipe them into ffmpeg (H.264, yuv420p, CRF 20, preset slow, +faststart).
- Easing on all motion, parallax layers for depth, light motion blur (average 3 sub-frames per frame).

## Step 12: Quality check (every chapter)

Before rendering each chapter, make a contact sheet of about 8 stills covering every shot and transition. Look at it yourself and fix anything rough, empty, blurry, off-model, or badly timed against the words. Check that the emu, fonts, grade and palette match the style kit, and that no on-screen text contains a fact that isn't in the script. Then render.

## Step 13: Work order and output

- Parts, in order: 00 opening cards + hook, the 10 chapters, then the ending + closing cards.
- Work through them one at a time: build, check, render `chapterNN.mp4` (under 100 MB), export `chapterNN.srt`, and commit before starting the next.
- If a run stops, the next run continues from the first unfinished part.
- When all parts are done, join them into `australia-full.mp4` and merge the SRTs into `australia-full.srt` with correct timing.
- The full video will be over 100 MB, so don't commit it. Publish `australia-full.mp4` and `australia-full.srt` as a GitHub Release (or workflow artifact) and give me the download link.
- Fill in `YOUTUBE_DESCRIPTION.md`: add the chapter timestamps (0:00 format, measured on the final video) and the full image credits from `CREDITS.txt`.
