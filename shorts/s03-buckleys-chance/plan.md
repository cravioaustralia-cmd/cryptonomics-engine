# Shot plan — s03-buckleys-chance (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder deliberately does not contain a finished `scenes.js`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline; no Remotion.
- Every beat is a full-bleed, factually tied photo/scan underlay with MG Skylab-style overlays: parallax/crop, masked wipes, pins, route lines, type, particles and practical texture. Do not make a historical still look like a contemporary photograph.
- Do not create AI historical stills. The Woodhouse image is a later historical painting; the portrait is a later likeness, not a 1803 photograph.
- Captions remain in the lower-middle safe band. Extra MG text should be sparse: the frame-1 hook, William Buckley, Wadawurrung, Port Phillip Bay, 1803, 1835, 32 YEARS and the phrase itself only where useful. Do not echo whole VO sentences as titles.
- Crossfade at seams; keep the loop punch on “basically none” and land back into the opening visual language.

## Beat table

| # | Time (s) | Mode | Photo/scan underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–6.2 | ANIMATE | `s03_01_william_buckley_portrait.jpg` — State Library of Victoria portrait of Buckley, c.1890–1910; use only as a labelled later likeness | Hook card “Buckley’s chance” frame 1; portrait push-in, paper grain, tall-figure measuring ticks, restrained impact hit |
| 2 | 6.2–13.8 | ANIMATE | `s03_02_port_phillip_1803_chart.jpg` — Port Phillip crop from the 1803 Admiralty/Bass Strait chart | Ink route trace from Sullivan Bay/Port Phillip; failed-settlement pin; starving-week counter implied by moving route, not a VO-echo title |
| 3 | 13.8–22.8 | STILL → ANIMATE | `s03_03_kulin_wadawurrung_map.png` — Kulin language-group map, with Wadawurrung territory clearly identified | Map hold with clean Wadawurrung locator, then warm paper-to-land transition; no invented depiction of Wadawurrung people or ceremony |
| 4 | 22.8–29.6 | ANIMATE | `s03_04_you_yangs_panorama.jpg` — present-day You Yangs/Wurdi Youang landscape in Wadawurrung Country | Slow horizon drift, native-grass/route texture, 32 YEARS ring counter and language/law/country marks; avoid claiming this exact view is Buckley’s camp |
| 5 | 29.6–37.9 | ANIMATE | `s03_05_first_settlers_discover_buckley.jpg` — Frederick William Woodhouse’s 1861 painting of the first settlers discovering Buckley | Painting-frame crop/parallax, sunburnt silhouette reveal, Tasmania-to-Port-Phillip route line; label as 1835 contact reconstruction/artwork |
| 6 | 37.9–46.8 | STILL → ANIMATE | `s03_06_indented_head_huts_1835.png` — John Helder Wedge’s 1835 sketch of Batman’s expedition huts at Indented Head | Sketch registration lines, hut-window glow, camp markers and a restrained “1835” stamp; do not add generic colonial buildings |
| 7 | 46.8–54.4 | ANIMATE | Reuse the 1861 discovery painting as the only available historically tied contact image; crop to Buckley/settlers | Phrase assembles as a hand-lettered MG lock-up; type-on “Buckley’s chance” with whoosh, no unrelated portrait or generic bush filler |
| 8 | 54.4–57.456 | ANIMATE | Return to the 1803 Port Phillip chart | Route snaps back, “NONE” punch and loop wipe to beat 1; end on the hook visual language, not a new scene |

## Still inventory / factual guardrails

1. William Buckley later likeness — Commons `William Buckley portrait.jpg`, State Library of Victoria, c.1890–1910, public domain.
2. Port Phillip / Sullivan Bay context — Commons crop of the Admiralty chart surveyed 1801–02 and published 1803, public domain.
3. Wadawurrung context — Commons `Kulin Map.PNG`; use only for geographic/language-group context.
4. Wadawurrung Country landscape — You Yangs/Wurdi Youang panorama; present-day landscape, not a claimed 1803 photograph.
5. 1835 contact — Woodhouse’s `The first settlers discover Buckley` (1861), public-domain historical painting.
6. 1835 settler camp — Wedge’s Indented Head huts sketch (1835), public domain historical sketch.

No random stock bush, fake spear, fake cave, AI historical person, or unverified “Buckley cave” image is included. A cave still is not required unless Claude sources a real, separately licensed Point Lonsdale/Buckley’s Cave image during the build.

## Audio hand-off

- Held VO: `audio/vo.mp3`; do not re-record.
- Bed: `music/music.mp3` (Vastness — Andrew Ev, Mixkit Free Music Licence); duplicate in `audio/music.mp3` for the shared mixer.
- SFX: `sfx/` contains selected Mixkit shared-kit cues. Claude owns timing, ducking, loudness and final mix.
