# PASTE BRIEF — s35 Bir Tawil ("The Land No Country Wants")

Paste this whole brief into Claude Code (no @claude needed).

**Repo:** cravioaustralia-cmd/cryptonomics-engine · **Branch:** scaffold/s35-bir-tawil · **Folder:** shorts/s35-bir-tawil/
First: `git fetch origin && git checkout scaffold/s35-bir-tawil && git pull`

You own all design, edit, captions, cards, pacing and audio mix. Below are the script, raw assets and house constraints only.

## Spoken script (cues in brackets are NEVER spoken)
(fast, intrigued) There's a piece of land almost the size of the ACT… and no country on Earth will claim it.
(storytelling) It's called Bir Tawil. A patch of desert between Egypt and Sudan.
(building) In 1899, Britain and Egypt drew the border dead straight, along the twenty-second parallel.
(puzzled) Three years later, the British drew a second line, based on which tribes used the land.
(twist) Here's the catch. Egypt goes by the first line. That gives it the Halaib Triangle, ten times bigger, right on the Red Sea.
(sly) Sudan goes by the second line. That gives it Halaib too.
(deadpan) And each country's line hands Bir Tawil to the other. Claim it… and you give up Halaib.
(amused) In 2014, an American dad planted a flag there so his daughter could be a real princess.
(serious) No government recognised it.
(loop, sly) And that's why, to this day…

## Frame-1 on-screen hook (NOT spoken)
Preferred: `NO COUNTRY WILL CLAIM THIS LAND`
Alternates: `THE LAND NOBODY WANTS` · `ALMOST THE SIZE OF THE ACT. NO OWNER.`

## Loop note
Last line is intentionally unresolved; loops back to "There's a piece of land almost the size of the ACT…".

## VO
PLACEHOLDER: Atlas VO will be seated at `audio/vo.mp3` (Abhishek records separately from `vo/atlas_read.txt`). Do not render final until it lands. Do not re-record.

## 2014 flag beat
There is NO free-licence photo of the 2014 flag-planting (Jeremiah Heaton). Build an animated flag-on-map graphic for that beat (generic flag planted on the Bir Tawil outline). Do not use any photo of the person.

## Map coordinates
- Bir Tawil centre ≈ 21.87 N, 33.74 E (~2,060 km²), just south of the 22nd parallel.
- Halaib Triangle centre ≈ 22.6 N, 35.6 E (~20,580 km², on the Red Sea); Halaib town 22.22 N, 36.64 E; Jebel Elba 22.18 N, 36.37 E.
- 1899 line = the 22° N parallel (straight). 1902 administrative line: trace from images/map_egypt_sudan_claims_with_bir_tawil.png.
- ACT ≈ 2,358 km² (Bir Tawil ≈ 87% of it); Canberra -35.28, 149.13.

## Assets (credits in SOURCES.md, images/SOURCES.md; facts in script.md)
- images/ — 22 Commons files:
  - claim maps: map_egypt_sudan_claims_with_bir_tawil.png, map_egypt_sudan_claims.png, map_halaib_triangle_en.png, map_halaib_triangle_ru_relief.png, map_bir_tawil_on_egypt.png
  - period maps: map_halaib_bir_tawil_1912.png, war_office_wadi_halfa_sheet.jpg, us_army_250k_sheet_bir_tawil.jpg
  - Bir Tawil terrain: satellite_bir_tawil.jpg, satmap_bir_tawil.png, topographic_bir_tawil.png
  - desert: nubian_desert_nasa.jpg, nubian_desert_01/02/03.jpg, nubian_desert_wadi_halfa.jpg, iss_view_egypt_sudan.jpg
  - Halaib / Red Sea: jebel_elba_halaib.jpg, gabal_elba_protectorate.jpg, gebel_elba_landscape_01.jpg, halaib_red_sea_coast_01/02.jpg
- music/desert_city_kevin_macleod.mp3 — Kevin MacLeod, CC BY 4.0 (credit in description)
- sfx/ — desert_ambience_mixkit2632.mp3, wind_blowing_mixkit1474.mp3, pen_writing_mixkit2536.mp3, paper_rustle.mp3, whoosh_1.mp3, impact_hit.mp3, riser.mp3, text_pop.mp3 (Mixkit licence)
- shorts/shared/render/ — existing engine; reuse it.

## House constraints
- 1080x1920, 30 fps. SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion. Reuse shorts/shared/render/.
- Real free-licence photos with motion graphics; no AI historical stills; no emoji.
- Captions never overlap graphics. No title cards that echo the VO.
- Music under VO; SFX sparse.
- Loudness ~-14 LUFS; AAC true peak ≤ -1.5 dBTP.
- Australian English.
- Final MP4: shorts/s35-bir-tawil/final/s35-bir-tawil.mp4 — commit and push to this branch.
- No PR, no merge, no YouTube upload.
