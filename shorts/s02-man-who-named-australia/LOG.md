# s02 LOG — The man who named Australia

## 2026-09-25 14:05 AEST — MG rebuild (VO-echo titles killed)
User rejected prior cut for:
1. VO-echo on-screen titles repeating narrator while captions already show speech
2. Weak design (text dumped over simple cartoons)

### Changes
- Rewrote `render/scenes.js` (~818 lines): animation-primary illustrated worlds
- **Killed** all VO-echo titles: LOST UNDER A TRAIN STATION, FIRST TO SAIL…, HIS BEST FRIEND…, FRENCH PRISON sentence, DIED THE VERY NEXT DAY, HIS GRAVE WAS LOST, UNTIL 2019 title, 40,000 BURIALS title, HOME VILLAGE / finally laid, NOT BAD punchline card, etc.
- **Kept** short labels only: Matthew Flinders, Trim, Australia, Mauritius, London, Donington, July 1814, 6½ years, 2019, 2024, HMS Investigator, plate engraving “Captain Matthew Flinders”; frame-1 hook `200 YEARS`
- MG upgrades: ship wake + orbit trail, Trim blink/tail, prison bars slam + camera punch, AUSTRALIA ink stamp + book page-flip, candle multi-strand smoke, skyline individual building rise + window twinkle, station gulp with perspective, dig dirt particles + plate rotate-in, village drifting clouds, scene fade wrappers + engine ~0.28s crossfade
- Credibility photos: kinetic framed cards (portrait, Investigator, dig) — not flat dumps
- Docs: plan.md, MASTER_PROMPT.md, shorts-pipeline/SKILL.md, shorts/CLAUDE.md updated with on-screen text rule + MG quality bar
- Audio: held VO + Vastness + same SFX cues (re-mixed via render-episode.mjs)

### Output
- `out/s02-man-who-named-australia.mp4`
- `/workspace/deliverables/s02-man-who-named-australia/`

## 2026-09-25 14:10 AEST — final deliverable
- Post self-check tweaks: Mauritius label above bars; July 1814 clear of caption band; Trim deck layout.
- Final MP4: `out/s02-man-who-named-australia.mp4` (~8.3 MB, ~64.9s) → `deliverables/s02-man-who-named-australia/`
- Contact sheet: `out/contact_v3/`

## 2026-09-26 ~01:55 AEST — Checkpoint C: s01 photo-underlay restyle
User asked to rebuild so every beat matches s01 Skylab (full-bleed `stillLayer` + SVG MG on top), keep held VO / 64.968s / no VO-echo titles.

### Still accuracy pass (locked rule)
- Replaced wrong Investigator file (NZ Auckland chart) with HMS Investigator museum model (CC BY-SA Flickr)
- Replaced St Pancras underground with real London Euston Virgin train platform (CC BY-SA Flickr)
- Replaced Mediterranean classical ruins with urban archaeological trench dig (CC BY-SA Flickr)
- Added flat Lincolnshire parish still `s02_10_english_village.jpg` (Creeton St Peter, geograph CC BY-SA) — not alpine
- Kept Flinders PD portraits, Mauritius coast, Voyage book, black cat

### Code / docs
- Rewrote `render/scenes.js` (~350 lines) s01-style: stillLayer first, SVG orbit/bars/stamp/candle/plate/etc.
- Updated plan.md, images/SOURCES.md, shorts/CLAUDE.md (photo-underlay preferred + still-accuracy rule)
- Audio unchanged (held VO + Vastness + same SFX cues)

### Output
- Full render via `node shorts/shared/render/render-episode.mjs`
- Contact sheet: `out/contact_v4/`
- Deliverables: `/workspace/deliverables/s02-man-who-named-australia/`

### Final deliverable (Checkpoint C)
- MP4: `out/s02-man-who-named-australia.mp4` → `/workspace/deliverables/s02-man-who-named-australia/s02-man-who-named-australia.mp4`
- Size ~25 MB; duration ~64.94s (held VO mix); 1080×1920 @ 30fps
- Contact sheet reviewed: `out/contact_v4/` — photo underlays confirmed on hook/orbit/trim/prison/name/london/dig/village; short labels only; no VO-echo titles

## 2026-09-26 02:04 AEST — Quiet quality pass (post Checkpoint C video review)
User: improve cut after review; overwrite deliverables. Do **not** message user.

### Fixes
1. **Trim still:** Replaced AI black-cat underlay (`s02_05` heterochromic glowing eyes) with Trim commemorative statue `s02_04_trim_cat_statue.jpg` as full-bleed underlay (12.3–16.3), zoomed toward bronze cat. Removed fake eye-glint overlays.
2. **Mauritius still:** Replaced lonely tropical-tree filler with **Port Louis Harbour** photo (CC BY 2.0, Tips For Travellers / Flickr 4592717513). Old tree archived as `s02_06_mauritius_coast_REJECTED_lonely_tree.jpg`.
3. **MG quality:** Upgraded prison bars (layered metal + rivets + slam + radial vignette), candle (wax drips, holder, flame bloom, smoke), London gulp (cemetery headstone silhouettes with perspective — not flat grey rects).

### Held
- Captions ~70%; duration 64.968; reuse existing audio mix (re-mux only if silent video changes)
- Allowed labels kept: 200 YEARS, 6½ years, AUSTRALIA stamp, July 1814, 2019, 2024, place/name badges

### Final deliverable (quiet quality pass)
- MP4: `out/s02-man-who-named-australia.mp4` → `/workspace/deliverables/s02-man-who-named-australia/s02-man-who-named-australia.mp4`
- Size ~31MB; duration ~64.936000s; 1080×1920 @ 30fps
- Audio: remuxed held `audio/final-mix.mp3` (no remix)
- Contact sheet: `out/contact_v5/` — Trim statue confirmed (no AI cat); Port Louis harbour confirmed; MG bars/candle/headstones upgraded
