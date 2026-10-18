# PASTE BRIEF: s37 Thylacine ("Protected 59 Days Too Late")

Paste this whole brief into Claude Code (no @claude needed).

**Repo:** cravioaustralia-cmd/cryptonomics-engine · **Branch:** scaffold/s37-thylacine · **Folder:** shorts/s37-thylacine/
First: `git fetch origin && git checkout scaffold/s37-thylacine && git pull`

You own all design, edit, captions, cards, pacing and audio mix. Below are the script, raw assets and house constraints only.

## Spoken script (cues in brackets are NEVER spoken)
(fast, intrigued) In 1936, Tasmania finally made it illegal to kill the Tasmanian tiger… fifty-nine days too late.
(storytelling) The thylacine looked like a striped wolf. But it was a marsupial, with a pouch.
(indignant) Farmers blamed it for killing sheep. From 1888, the government paid a pound for every adult killed. Over two thousand bounties were paid.
(sombre) The last known wild one was shot in 1930.
(quiet) The last known thylacine ended up in Hobart's Beaumaris Zoo.
(tense) On the tenth of July, 1936, the species was finally protected.
(heavy) On the night of the seventh of September… that last tiger died.
(serious) None has been confirmed since. Today, that date is Australia's National Threatened Species Day.
(twist) And in 2022, researchers worked out that her skin had been sitting in a Hobart museum cupboard for decades… used as a teaching exhibit. Nobody knew she was the last one.
(loop, sly) All because one law was only passed…

## Frame-1 on-screen hook (NOT spoken)
Preferred: `PROTECTED. 59 DAYS LATER, THE LAST ONE DIED.`
Alternates: `AUSTRALIA SAVED IT 59 DAYS TOO LATE` · `THE LAST TASMANIAN TIGER`

## Loop note
Last line is intentionally unresolved; loops back to "In 1936, Tasmania finally made it illegal…".

## Tone and naming rules
- This is an extinction story: sombre and reflective, not comedic.
- Do NOT use the name "Benjamin" anywhere in captions or on-screen text. The last thylacine was an old female, and "Benjamin" is a 1968 myth.
- Do not caption 1930s zoo footage as "her" or "the last one". Caption it generically, e.g. "Hobart Zoo's thylacine, 1933" or "Beaumaris Zoo, 1936".
- No AI thylacine renders.

## VO
PLACEHOLDER: Atlas VO will be seated at `audio/vo.mp3` (Abhishek records separately from `vo/atlas_read.txt`). Do not render final until it lands. Do not re-record. Captions use the script's spelling.

## Map coordinates (approximate)
- Hobart CBD -42.882, 147.327 · Beaumaris Zoo site (Queens Domain) -42.871, 147.337 · TMAG (Hobart museum) -42.882, 147.333
- Tasmania centre ≈ -42.0, 146.6 · Mawbanna (last wild one, 1930) ≈ -40.96, 145.37

## Assets (credits and description attribution lines in SOURCES.md, images/SOURCES.md; facts in script.md)
- images/: 27 files:
  - zoo photos: thylacine_hobart_zoo_1933.jpg, thylacine_beaumaris_zoo_1936_tas_archives.jpg, thylacine_hobart_zoo_1928.jpg, thylacines_pair_hobart_zoo.jpg, thylacine_cubs_with_mother.jpg, thylacine_colour_crop.jpg
  - film stills: still_1935_nfsa_t6s/t12s/t18s.jpg, still_hobart_zoo_compilation_t30s/t48s/t126s.jpg (t126s = the 1933 jaw gape)
  - illustration: thylacine_harris_illustration.jpg
  - bounty era: bounty_alb_quarrell_1921.jpg, bounty_bagged_thylacine.jpg
  - last wild one (1930): last_wild_wilf_batty_1930.jpg, last_wild_wilf_batty_1930_b.jpg
  - museum twist: thylacine_skeleton_black.jpg, thylacine_pelt_nma.jpg, thylacine_skull.jpg (generic specimens, NOT the endling's skin)
  - Hobart / zoo site / law: beaumaris_zoo_entrance.jpg, beaumaris_zoo_site.jpg, hobart_elizabeth_street_1930s.jpg, hobart_liberty_theatre_1935.jpg, tasmanian_house_of_assembly.jpg
  - maps: map_tasmania_relief_location.png, map_tasmania_location.png
- footage/: last_known_footage_1935_nfsa.webm (22 s, 1080p), thylacine_footage_compilation_hobart_zoo.ogv (2:50). Both public domain; both carry watermarks.
- Kinetic text suggestion from the script: `10 JULY 1936: PROTECTED` → `7 SEPTEMBER 1936: GONE` → `59 DAYS`
- music/heartbreaking_kevin_macleod.mp3: Kevin MacLeod, CC BY 4.0 (credit in description)
- sfx/: old_clock_pendulum_ticking_mixkit1072.mp3, wind_blowing_ambience_mixkit2658.mp3, gate_latch_click_mixkit1924.mp3, clinking_coins_mixkit1993.mp3, paper_rustle.mp3, whoosh_1.mp3, impact_hit.mp3, text_pop.mp3 (Mixkit licence)
- shorts/shared/render/: existing engine; reuse it.

## House constraints
- 1080x1920, 30 fps. SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion. Reuse shorts/shared/render/.
- Real free-licence photos with motion graphics; no AI historical stills; no emoji.
- Captions never overlap graphics. No title cards that echo the VO.
- Music under VO; SFX sparse.
- Loudness ~-14 LUFS; AAC true peak ≤ -1.5 dBTP.
- Australian English.
- Final MP4: shorts/s37-thylacine/final/s37-thylacine.mp4. Commit and push to this branch.
- No PR, no merge, no YouTube upload.
