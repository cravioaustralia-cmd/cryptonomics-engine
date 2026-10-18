# PASTE BRIEF: s36 Harold Holt ("The Prime Minister Who Went for a Swim")

Paste this whole brief into Claude Code (no @claude needed).

**Repo:** cravioaustralia-cmd/cryptonomics-engine · **Branch:** scaffold/s36-harold-holt · **Folder:** shorts/s36-harold-holt/
First: `git fetch origin && git checkout scaffold/s36-harold-holt && git pull`

You own all design, edit, captions, cards, pacing and audio mix. Below are the script, raw assets and house constraints only.

## Spoken script (cues in brackets are NEVER spoken)
(fast, intrigued) In 1967, Australia's Prime Minister went for a swim… and was never seen again.
(storytelling) Harold Holt loved the ocean. On the seventeenth of December, he waded into rough surf at Cheviot Beach, near Portsea in Victoria.
(tense) The only other swimmer felt the undertow and stayed close to shore. Holt kept swimming out.
(quiet) Then he slipped under the waves… and was gone.
(building) Divers, helicopters, police, soldiers and sailors combed the coast. One of the biggest searches in Australian history.
(serious) His body was never found.
(sceptical) Rumours ran wild. One book even claimed a Chinese submarine picked him up.
(firm) In 2005, a coroner ruled he simply drowned.
(amused) His name even became slang. To "do a Harold Holt" means to bolt.
(twist, wry) And in 1969, a Melbourne council opened a brand-new pool: the Harold Holt Memorial Swimming Centre.
(loop, sly) A swimming pool… named after the man who…

## Frame-1 on-screen hook (NOT spoken)
Preferred: `OUR PM WENT FOR A SWIM. HE NEVER CAME BACK.`
Alternates: `THEY NAMED A POOL AFTER HIM` · `THE PRIME MINISTER WHO VANISHED`

## Loop note
Last line is intentionally unresolved; loops back to "In 1967, Australia's Prime Minister went for a swim…".

## Tone note
This is a real death. The slang and pool beats stay wry, not mocking. The music bed is respectful-curious, not comedic.

## VO
Seated at `audio/vo.mp3` (Atlas, raw, 53.16 s). Read from `vo/atlas_read.txt`. Do not re-record. Claude owns pacing and mix.
Captions use the script's spelling (Harold Holt, Cheviot Beach, Portsea, waded, coroner, Rumours, Harold Holt Memorial Swimming Centre), not any auto-transcript spelling.

## Map coordinates (approximate)
- Cheviot Beach -38.312, 144.683 · Point Nepean (tip) -38.302, 144.648 · Portsea -38.320, 144.711 · Melbourne CBD -37.814, 144.963
- Harold Holt Memorial Swimming Centre (Glen Iris, former City of Malvern) ≈ -37.858, 145.045

## Assets (credits and description attribution lines in SOURCES.md, images/SOURCES.md; facts in script.md)
- images/: 24 Commons files:
  - Holt: holt_at_portsea_spearfishing_1966.jpg, holt_portrait_1967.jpg, holt_1966_portrait_cropped.jpg, holt_swearing_in_1966.jpg, holt_and_lyndon_johnson.jpg, holt_and_menzies.jpg
  - search / aftermath: searching_cheviot_beach_1967.jpg, memorial_service_1967_archives_nz.jpg
  - Cheviot Beach / Point Nepean / Portsea: cheviot_beach.png, cheviot_beach_cropped.png, cheviot_beach_from_defence_road_2/4.jpg, waves_near_cheviot_hill.jpg, crashing_waves_point_nepean.jpg, point_nepean_facing_bass_strait.jpg, storm_approaching_portsea.jpg, sunset_harold_holt_memorial_cheviot_bay.jpg, iss_view_victoria_port_phillip.jpg
  - plaque: cheviot_beach_plaque.jpg, cheviot_beach_plaque_b.jpg
  - pool: holt_pool_swim_centre.jpg, holt_pool_memorial_centre_1/2.jpg, holt_pool_entry.jpg
- No free images for the submarine-book, coroner or slang beats.
- music/lightless_dawn_kevin_macleod.mp3: Kevin MacLeod, CC BY 4.0 (credit in description)
- sfx/: rough_sea_waves_mixkit1194.mp3, windy_sea_mixkit1200.mp3, sea_coast_breaking_waves_mixkit1206.mp3, helicopter_far_away_mixkit2696.mp3, paper_rustle.mp3, whoosh_1.mp3, riser.mp3, impact_hit.mp3, text_pop.mp3 (Mixkit licence)
- shorts/shared/render/: existing engine; reuse it.

## House constraints
- 1080x1920, 30 fps. SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion. Reuse shorts/shared/render/.
- Real free-licence photos with motion graphics; no AI historical stills; no emoji.
- Captions never overlap graphics. No title cards that echo the VO.
- Music under VO; SFX sparse.
- Loudness ~-14 LUFS; AAC true peak ≤ -1.5 dBTP.
- Australian English.
- Final MP4: shorts/s36-harold-holt/final/s36-harold-holt.mp4. Commit and push to this branch.
- No PR, no merge, no YouTube upload.
