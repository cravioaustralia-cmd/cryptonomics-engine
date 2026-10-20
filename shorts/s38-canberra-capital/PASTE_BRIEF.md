# PASTE BRIEF: s38 Canberra ("The Capital Nobody Would Give Up")

Paste this whole brief into Claude Code (no @claude needed).

**Repo:** cravioaustralia-cmd/cryptonomics-engine · **Branch:** scaffold/s38-canberra-capital · **Folder:** shorts/s38-canberra-capital/
First: `git fetch origin && git checkout scaffold/s38-canberra-capital && git pull`

You own all design, edit, captions, cards, pacing and audio mix. Below are the script, raw assets and house constraints only.

## Spoken script (cues in brackets are NEVER spoken)
(fast, intrigued) Sydney and Melbourne each refused to let the other be Australia's capital… so Australia built a whole new city.
(amused) The new Constitution split the difference. The capital had to be in New South Wales… but at least a hundred miles from Sydney.
(wry) Until it was built, Parliament would sit in Melbourne.
(building) Albury, Tumut and Bombala were in the running. After seven years of arguing, Parliament picked the Yass–Queanbeyan district.
(storytelling) Then, a worldwide design competition. One hundred and thirty-seven entries. The winner was Walter Burley Griffin, a Chicago architect, working with his wife, Marion Mahony Griffin.
(tense) He clashed with officials for years. By the end of 1920, he was off the job.
(sombre) He died in India in 1937… long before his lake was filled.
(twist) In 1964, there was a push to name it Lake Menzies. Robert Menzies said no, and called it Lake Burley Griffin.
(loop, sly) A whole capital city… all because…

## Frame-1 on-screen hook (NOT spoken)
Preferred: `WHY ISN'T SYDNEY THE CAPITAL?`
Alternates: `SYDNEY VS MELBOURNE. CANBERRA WON.` · `A CAPITAL BUILT OUT OF SPITE`

## Loop note
Last line is intentionally unresolved; hard cut back to "Sydney and Melbourne each refused to let the other be Australia's capital…".

## Tone and caption rules
- Curious, lightly wry, warm.
- Canberra sits on Ngunnawal and Ngambri Country. Don't caption early shots as "empty land" or "built from nothing".
- Don't claim "Canberra" means "meeting place" (disputed).
- On-screen text must not put a hard "1964" date on the Lake Menzies naming push unless you have a source for it. The VO line stays as recorded. Dating the lake filling or opening to 1964 on screen is fine (planned level reached 29 April 1964; opened 17 October 1964).

## VO
Seated at `audio/vo.mp3` (Atlas, raw, 55.42 s). Read from `vo/atlas_read.txt`. Do not re-record. Claude owns pacing and mix.
Captions use the script's spelling (Tumut, Bombala, Yass–Queanbeyan, Walter Burley Griffin, Marion Mahony Griffin, Menzies, Constitution, Parliament), not any auto-transcript spelling.

## Map coordinates (approximate) and distance from Sydney
- Sydney -33.869, 151.209 · Melbourne -37.814, 144.963 · Canberra -35.281, 149.130 (~247 km)
- Albury -36.074, 146.914 (~462 km) · Tumut -35.300, 148.224 (~316 km) · Bombala -36.912, 149.239 (~383 km)
- Yass -34.841, 148.910 (~237 km) · Queanbeyan -35.353, 149.232 (~245 km)
- 100-mile ring: radius 160.9 km centred on Sydney. Every candidate site is outside it.
- Kinetic text suggestion from the script: `NSW… BUT 100 MILES (160 KM) FROM SYDNEY` → `137 ENTRIES` → `LAKE MENZIES? NO.` (no date on that card)

## Assets (credits and description attribution lines in SOURCES.md, images/SOURCES.md; facts in script.md)
- images/: 34 Commons files:
  - Sydney c.1900: sydney_george_street_c1900.jpg, sydney_town_hall_george_st_c1900.jpg
  - Melbourne c.1900: melbourne_collins_street_c1900.jpg, melbourne_federal_coffee_palace_tram.jpg
  - Federation / Parliament in Melbourne: constitution_of_australia.jpg, opening_first_parliament_1901_tom_roberts.jpg, melbourne_parliament_house_c1900.jpg (postcard)
  - candidate sites: albury_railway_station_1881.jpg, albury_birdseye_1881.jpg, tumut_from_rotary_lookout.jpg, tumut_river.jpg, bombala_from_a_hill.jpg, bombala_maybe_street.jpg
  - Yass–Queanbeyan district: yass_csiro_landscape.jpg, queanbeyan_river.jpg, canberra_federal_camp_1910s.jpg
  - competition / plans: competition_entry_berard_birdseye_1912.jpg (a rival entry), griffin_plan_shaded.jpg (Griffin competition plan, colour), griffin_plan_view.jpg (competition elevations / section views), griffin_plan.jpg, griffin_prelim_plan_1913.jpg, griffin_plan_1918.jpg
  - people: portrait_walter_burley_griffin_1912.jpg, portrait_walter_and_marion_griffin.jpg, portrait_marion_mahony_griffin_1930.jpg, portrait_menzies_1950s.jpg
  - Canberra founding: naming_of_canberra_1913_lord_denman.jpg, naming_of_canberra_1913_crowd.jpg, old_parliament_house_opening_1927.jpg
  - the lake: lake_burley_griffin_construction_1962.png, scrivener_dam.jpg, lake_burley_griffin_from_above.jpg, lake_burley_griffin_old_and_new_parliament.jpg, canberra_from_mount_ainslie.jpg
- music/life_of_riley_kevin_macleod.mp3: Kevin MacLeod, CC BY 4.0 (credit in description)
- sfx/: signing_on_a_paper_mixkit2368.mp3, small_crowd_ovation_mixkit437.mp3, river_water_flow_mixkit2452.mp3, short_pencil_writing_mixkit2376.mp3, paper_rustle.mp3, whoosh_1.mp3, impact_hit.mp3, text_pop.mp3 (Mixkit licence)
- shorts/shared/render/: existing engine; reuse it.

## House constraints
- 1080x1920, 30 fps. SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion. Reuse shorts/shared/render/.
- Real free-licence photos with motion graphics; no AI historical stills; no emoji.
- Captions never overlap graphics. No title cards that echo the VO.
- Music under VO; SFX sparse.
- Loudness ~-14 LUFS; AAC true peak ≤ -1.5 dBTP.
- Australian English.
- Final MP4: shorts/s38-canberra-capital/final/s38-canberra-capital.mp4. Commit and push to this branch.
- No PR, no merge, no YouTube upload.
