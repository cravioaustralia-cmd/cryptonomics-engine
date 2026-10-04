# Map explainer mode (locked when user says "map explainer")

Primary visual language: **animated map explainer** (kinetic cartography) — closer to high-end geography Shorts than Skylab photo-underlay slideshow.

When Abhishek designates a Short as **map explainer** / map-animation, Claude must match or beat the **standing quality bar** below. Video Production dictates that bar in every Claude brief; Claude owns design/animation/mix.

## Stack (non-negotiable — pipeline unchanged)
- SVG + `renderFrame(t)` + Playwright + ffmpeg only — **no Remotion**
- History Shorts still use channel captions lower-middle (~70%); no VO-echo titles; labels for places / distances / dates / names only
- Locked map look: real **satellite/topo** basemap (terrain visible); parchment/weathered fills where useful; thick white outer glow on borders; bold 3D/extruded labels + drop shadows; soft shadows; **soft mid-contrast relief (no blown white highlights)**; **correct locations only**
- Photos only as brief credibility inserts — maps carry the story
- Sparse intentional SFX (~6–10 cues); locked mix path (measure VO → static gain + apad → float amix → two-pass loudnorm master only ~−14 LUFS)
- Claude may **exceed** the reference quality

## When NOT "map explainer"
Use the normal Skylab photo-underlay + motion-graphics pipeline.

---

## Standing quality bar (locked 2026-09-30)

**Primary reference — GeoArchivez #1 by views**  
“27 Years to Walk Around the World” (~19.6M views)  
- YouTube: https://www.youtube.com/shorts/r4HjlnwYCI4  
- Local (share): `/workspace/geoarchivez-scripts/top_short_share.mp4`  
- Local (higher-res): `/workspace/geoarchivez-scripts/top_short_r4HjlnwYCI4.mp4`  
- Script pack: `/workspace/geoarchivez-scripts/geoarchivez_shorts_scripts.md`

**Secondary example (same channel style)**  
Pan American Highway Short: `/workspace/geoarchivez-scripts/raw/vZHLIqiC_Jc.mp4`

**Prior reference (kept, secondary)**  
Rankora Austria→China: https://youtube.com/shorts/5IaLp97pUQA · `/workspace/deliverables/style-refs/map-explainer-ref.mp4`

Dictate to Claude: **match GeoArchivez pacing, storytelling, map-line animation, country/region beats, obstacle cutaways, and script tone.** Pipeline stack and History Shorts caption rule still apply.

---

## Techniques to copy or beat (GeoArchivez primary)

### Map look
- High-res **satellite + topo relief** canvas; strip default political labels/roads clutter
- **Basemap texture + lighting (locked 2026-10-01):** match **GeoGlobeTales** satellite look (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich natural land colour (greens/browns), deep navy ocean with subtle bathymetry, soft balanced lighting, slight atmospheric edge haze OK. **Never** blown-out / extensive white relief on peaks and ridges (s24 failure). Soft shadows OK; thick white borders and bold white labels + drop shadow still fine; yellow km/mi callouts on distance lines
- Country/region activates only when the beat needs it: glowing border + subtle translucent fill (not flag spam unless the beat needs flags)
- **Anchor route:** thick solid yellow/orange line + soft drop shadow that **draws itself continuously**; camera tracks the leading edge
- **Intent / alternate routes:** bold white dashed lines + arrowheads (distinct from completed solid path)

### Motion / camera
- Macro ↔ micro: pull out for continents, push in for obstacles (Darién-style “no road” beats, straits, borders)
- Camera **never static** — continuous eased pans/zooms; new visual stimulus ~every 1.5–2 s
- Relentless momentum: line drawing, region highlight, or spatial text always progressing

### Storytelling / cutaways
- Rapid obstacle → resolution rhythm on the map (not photo slideshow)
- Vector punchlines on the map: forbidden-mode icons (car/boat/plane with slash), danger markers, state changes (bars, weather icons) — History Shorts: keep dignified; no gore; soft historical stills only as brief credibility inserts
- Environmental state changes when the story needs them (ice texture, weather overlays) — factually tied

### Text / numbers
- **Spatial typography** on the map: large bold white callouts for years, durations, km, temperatures — beat Rankora by always showing numeric distance where it helps
- Place/region labels on activation only
- History Shorts: keep karaoke captions at ~70% (pipeline lock). GeoArchivez itself often skips bottom captions — we do **not** drop History Shorts captions unless Abhishek asks

### Loop
- Incomplete/seamless loop preferred: final line + final frame bridge into open

### What makes it map-explainer vs slideshow
- Continuous spatial context — viewer never loses place
- Geographic shapes + kinetic line/region overlays as primary imagery
- Photos are brief inserts, not the spine

## Claude brief boilerplate (paste into every map-explainer handoff)

> **MAP EXPLAINER — standing quality bar (locked):** Match GeoArchivez “27 Years to Walk Around the World” (`/workspace/geoarchivez-scripts/top_short_share.mp4` · https://www.youtube.com/shorts/r4HjlnwYCI4): continuous self-drawing route, always-moving eased camera, dynamic region highlights, spatial km/year callouts, obstacle cutaways on the map (Darién-style). **Basemap look:** GeoGlobeTales-style satellite (`/workspace/deliverables/style-refs/map-quality-geoglobetales-france-guiana.png`) — rich land colour, deep navy ocean, soft balanced lighting, **no blown white relief**. Secondary motion: Pan American Highway in `geoarchivez-scripts/raw/`. Stack unchanged (SVG+renderFrame+Playwright+ffmpeg; captions ~70%; sparse SFX; locked mix). Exceed the refs if you can.
