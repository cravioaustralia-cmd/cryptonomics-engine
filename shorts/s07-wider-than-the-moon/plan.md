# Shot plan — s07-wider-than-the-moon (Checkpoint C hand-off)

## Direction

- **Claude owns the design, animation, mix and render.** This folder intentionally contains no `scenes.js`; Claude should create and own it in `render/`.
- Use the established **SVG + `renderFrame(t)` + Playwright + ffmpeg** pipeline in `shorts/shared/render/` (no Remotion).
- Every beat uses a full-bleed, factually tied photo/map underlay with MG Skylab-style overlays: restrained parallax/crop, size-comparison MG, plate arrows, pins, type, particles and practical texture. Do not invent AI “historical” stills or fake NASA composites.
- No AI stills. Map schematics and US Gov GPS graphics are labelled as schematics; Apollo/Galileo Moon and Blue Marble Australia stay photographic.
- Captions remain in the lower-middle safe band. Keep extra MG text sparse: the frame-1 hook, `3,500 KM`, `4,000 KM`, `7 CM / YEAR`, `FINGERNAILS`, `+1.5 M`, `2017`, `GDA2020`, `NORTH → ASIA`, and the loop closer only where useful. Do not echo whole VO sentences as titles.
- Crossfade at seams. The final Moon frame should loop back to the opening “wider than the Moon” language.

## Beat table

| # | Time (s) | Mode | Photo/scan underlay (factually tied) | Named motion / MG treatment |
|---|---:|---|---|---|
| 1 | 0–5.0 | ANIMATE | `s07_01_full_moon.jpg` — Apollo 13 near-full Moon (NASA PD); diameter hero for the unspoken hook | Frame-1 hook `WIDER THAN THE MOON`; Moon disk slam + soft parallax; impact on “Literally.” |
| 2 | 5.0–14.0 | ANIMATE | `s07_02_australia_satellite.jpg` — NASA Blue Marble Australia orthographic; continent for the 3,500 / 4,000 km compare | East–west width measure; `3,500 KM` / `4,000 KM` stamps; optional Moon-disk inset using still 1 |
| 3 | 14.0–18.5 | ANIMATE | `s07_03_australia_blank.png` — blank Australia outline (CC0); clean silhouette for fingernail / drift setup before plates | Outline reveal; `DRIFTING` tease; wipe into plate map |
| 4 | 18.5–28.0 | ANIMATE | `s07_04_tectonic_plates.png` — USGS tectonic plates (PD); Australian Plate / continental drift | Australian Plate pin; `7 CM / YEAR` + `FINGERNAILS` compact tags; northward arrow; slow plate drift parallax |
| 5 | 28.0–34.5 | ANIMATE | `s07_05_gps_constellation.jpg` — GPS.gov 24-slot constellation (US Gov PD); GPS maps-off beat | Orbit cage rotate; `GPS` lock-up; `+1.5 M` error tag on “metre and a half” |
| 6 | 34.5–42.0 | ANIMATE | `s07_06_utm_zones.jpg` — UTM zone grid (NASA Visible Earth base); Map Grid / GDA2020 coordinate-update context — **crop to Australia zones ~49–56**; ignore the US “17T” callout | Grid push-in on Australia; `2017` / `GDA2020` stamps; “coordinates corrected” wipe |
| 7 | 42.0–46.5 | ANIMATE | `s07_07_indo_australian_plate.png` — Indo-Australian plate with ~68–69 mm/yr north vectors (CC BY-SA 4.0); heading north toward Asia | North arrows emphasised; `NORTH → ASIA` path; deep-time tease on “tens of millions of years” |
| 8 | 46.5–49.560 | ANIMATE | `s07_08_moon_galileo.jpg` — Galileo enhanced full Moon (NASA/JPL/USGS PD); loop punchline | `NOT BAD…` assembles then resolves with Moon + Australia silhouette callback to opening hook; land the last word cleanly |

Approximate seam times are VO-relative starting points; Claude should retune against Whisper word timings.

## Still inventory / factual guardrails

1. Apollo 13 near-full Moon — real NASA spacecraft photograph; public domain.
2. Australia satellite orthographic — NASA Blue Marble–based; public domain; continent hero for width.
3. Blank Australia states map — CC0 outline for clean east–west / MG compare; not a photograph.
4. USGS tectonic plates — public domain; Australian Plate labelled; continental-drift context.
5. GPS constellation — US Government GPS.gov schematic; public domain; navigation constellation, not Australian CORS.
6. UTM zones — NASA Visible Earth base with UTM markup; crop to Australia for GDA/MGA 2017 update beat; do not feature the US “17T” callout.
7. Indo-Australian plate — CC BY-SA 4.0 labelled schematic with northward mm/yr vectors matching ~7 cm/year VO claim.
8. Galileo full Moon — NASA/JPL/USGS public domain; enhanced colour; loop callback.

No AI “Moon vs Australia” fake photos, random stock continents, or geographically wrong filler. Claude may composite outline + Moon disk in MG for the size compare.

## Audio hand-off

- Held Atlas VO: `audio/vo.mp3` (49.560 s); **do not re-record**.
- Bed: `music/music.mp3` and `audio/music.mp3` — **Vastness** by Andrew Ev, Mixkit Free Music Licence. Claude owns ducking, timing, loudness and final mix.
- SFX: `sfx/` contains selected reviewed Mixkit shared-kit cues; source URLs are in `sfx/sources.tsv`.
