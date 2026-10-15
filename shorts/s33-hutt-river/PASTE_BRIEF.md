# PASTE BRIEF — s33 Hutt River ("The Farmer Who Quit Australia")

Paste this whole brief into Claude Code (no @claude needed).

**Repo:** cravioaustralia-cmd/cryptonomics-engine · **Branch:** scaffold/s33-hutt-river · **Folder:** shorts/s33-hutt-river/
First: `git fetch origin && git checkout scaffold/s33-hutt-river && git pull`

You own all design, edit, captions, cards, pacing and audio mix. Below are the script, raw assets and house constraints only.

## Spoken script (cues in brackets are NEVER spoken)
(fast, intrigued) In 1970, a West Australian farmer quit Australia… without leaving his farm.
(storytelling) Leonard Casley had about four thousand hectares of wheat ready to harvest.
(indignant) Then new government quotas let him sell the crop from roughly forty.
(defiant) So on the twenty-first of April, he declared his farm an independent country.
(amused) The Hutt River Province. Seventy-five square kilometres, about five hundred kilometres north of Perth.
(building) He started calling himself Prince Leonard. Printed his own stamps. Minted his own coins. Issued his own passports.
(deadpan) In 1977, he even declared war on Australia… then called it off a few days later.
(serious) But no country ever recognised it. And the tax office never stopped counting.
(twist) Millions in unpaid tax later, in 2020, his son quietly handed it back.
(loop, sly) Fifty years earlier, it all started because…

## Frame-1 on-screen hook (NOT spoken)
Preferred: `HE LEFT AUSTRALIA. WITHOUT MOVING.`
Alternates: `A COUNTRY INSIDE WA` · `PRINCE OF A WHEAT FARM`

## Loop note
The last line is intentionally unresolved; it should loop back to "In 1970, a West Australian farmer quit Australia…".

## VO
Seated at `audio/vo.mp3` (Atlas, raw). Do not re-record. You decide all pacing and mix.

## Assets (credits in SOURCES.md, images/SOURCES.md; facts in FACT_NOTES.md)
- images/ — 21 Commons files (PD/CC0/CC BY/CC BY-SA): leonard_casley_at_hutt_river_province(_cropped_).jpg, prince_leonard_bust_14389745770_.jpg, oic_hutt_river_prince_leonard_statue.jpg, border_of_hutt_river_province.jpg, passport_control_at_hutt_river_province.jpg, oic_hutt_river_buildings.jpg, oic_hutt_river_views.jpg, hrp3.jpg, hutt_banner.jpg, hutt_river_flag.svg, hutt_river_seal.svg, hutt_river_province_coin_1991.jpg, hutt_river_province_five_dollars_coin_1/2.jpg, hutt_river_province_twenty_dollars_coin_1/2.jpg, huttriverprovince_brx11_30dollars_1979.jpg, uk_passport_with_stamps_from_hutt_river_province.jpg, visa_stamp_for_principality_of_hutt_river.jpg, locationphr.svg
- map/ — Natural Earth (PD) AUS states + populated places GeoJSON. Farm: -28.07444, 114.47069; Northampton ≈ -28.35, 114.63; Perth -31.95, 115.86.
- music/monkeys_spinning_monkeys_kevin_macleod.mp3 — Kevin MacLeod, CC BY 4.0 (credit in description)
- sfx/ — coin_clink_mixkit1993.mp3, horn_a_mixkit2289.mp3, horn_b_mixkit1654.mp3, cash_money_mixkit1936.mp3 (Mixkit licence); shared kit at shorts/shared/sfx/
- shorts/shared/render/ — existing engine

## House constraints
- 1080x1920, 30 fps. SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion.
- Real free-licence photos only; no AI historical stills; no emoji.
- Captions must not overlap graphics.
- Loudness ~-14 LUFS; AAC true peak ≤ -1.5 dBTP.
- Australian English.
- Final MP4: shorts/s33-hutt-river/final/s33-hutt-river.mp4
- Do not upload to YouTube. Do not merge.
