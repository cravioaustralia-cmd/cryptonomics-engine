# PASTE BRIEF — s34 Pheasant Island ("The Island That Changes Country")

Paste this whole brief into Claude Code (no @claude needed).

**Repo:** cravioaustralia-cmd/cryptonomics-engine · **Branch:** scaffold/s34-pheasant-island · **Folder:** shorts/s34-pheasant-island/
First: `git fetch origin && git checkout scaffold/s34-pheasant-island && git pull`

You own all design, edit, captions, cards, pacing and audio mix. Below are the script, raw assets and house constraints only.

## Spoken script (cues in brackets are NEVER spoken)
(intrigued) There's an island that changes country… every six months.
(storytelling) Pheasant Island. A tiny scrap of land in the Bidasoa River, wedged between France and Spain.
(amused) And there aren't even any pheasants on it.
(building) In 1659, after decades of war, the two kingdoms met here to end the fighting.
(serious) They signed the Treaty of the Pyrenees. Louis the Fourteenth married a Spanish princess to seal the peace.
(deadpan) One leftover problem: who got the island?
(twist) So they shared it. Still do. Spain runs it from February to July. France takes over from August to January.
(matter-of-fact) Nobody lives there. You're not allowed to visit. About seven thousand square metres of grass… and a stone monument.
(loop, sly) And in six months' time, without a single shot fired…

## Frame-1 on-screen hook (NOT spoken)
Preferred: `IT CHANGES COUNTRY. EVERY SIX MONTHS.`
Alternates: `FRANCE… THEN SPAIN` · `THE WORLD'S SMALLEST SHARED ISLAND`

## Loop note
Last line is intentionally unresolved; loops back to "There's an island that changes country…".

## VO
Seated at `audio/vo.mp3` (Atlas, raw, 43.56 s). Read from `vo/atlas_read.txt`. Do not re-record. Claude owns pacing and mix.

## Assets (credits in SOURCES.md, images/SOURCES.md; facts in script.md)
- images/ — 24 Commons files:
  - island today: island_from_bridge_es_left_fr_right.jpg, island_wide.jpg, island_from_irun_01/02.jpg, island_upstream_view.jpg, konpantzia_bidasoa_1.jpg, konpantzia_behobia_2025.jpg
  - monument: monument_treaty_memorial.jpg, monument_on_island.jpg
  - Hendaye / Irun / Bidasoa: hendaye_irun_from_guadalupe.jpg, irun_bidasoa_river.jpg
  - historic plans/prints: plan_isle_des_faisans_beaulieu.jpg, plan_half_france_half_spain.jpg, ile_conference_1660_engraving.jpg
  - 1660 meeting: meeting_louis_philip_1660_beaulieu.jpg, meeting_louis_philip_painting.jpg, meeting_rijksmuseum_print.jpg
  - treaty: treaty_document_archives_nationales.jpg, treaty_1659_europe_map.jpg
  - portraits: portrait_louis_xiv_mignard.jpg, portrait_maria_theresa_velazquez.jpg, portrait_philip_iv_velazquez.jpg, portrait_mazarin_mignard.jpg, portrait_luis_de_haro.jpg
- Map points: island 43.3425, -1.7653; Hendaye 43.3586, -1.7744; Irun 43.3390, -1.7894.
- music/sneaky_snitch_kevin_macleod.mp3 — Kevin MacLeod, CC BY 4.0 (credit in description)
- sfx/ — river_flow_mixkit2459.mp3, pen_writing_mixkit2536.mp3, writing_scribble_mixkit2366.mp3, paper_rustle.mp3, whoosh_1.mp3, impact_hit.mp3, riser.mp3, text_pop.mp3 (Mixkit licence)
- shorts/shared/render/ — existing engine; reuse it.

## House constraints
- 1080x1920, 30 fps. SVG + renderFrame(t) + Playwright + ffmpeg. No Remotion. Reuse shorts/shared/render/.
- Real free-licence photos with motion graphics; no AI historical stills; no emoji.
- Captions never overlap graphics. No title cards that echo the VO.
- Music under VO; SFX sparse.
- Loudness ~-14 LUFS; AAC true peak ≤ -1.5 dBTP.
- Australian English.
- Final MP4: shorts/s34-pheasant-island/final/s34-pheasant-island.mp4 — commit and push to this branch.
- No PR, no merge, no YouTube upload.
