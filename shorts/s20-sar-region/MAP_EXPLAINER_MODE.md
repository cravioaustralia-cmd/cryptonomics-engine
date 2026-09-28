# Map explainer mode (locked when user says "map explainer")

Primary visual language: **animated map explainer** (kinetic cartography) — closer to high-end geography Shorts than Skylab photo-underlay slideshow.

## Stack (non-negotiable)
- SVG + `renderFrame(t)` + Playwright + ffmpeg only — **no Remotion**
- Captions lower-middle (~70%); no VO-echo titles; labels for places / distances / dates / names only
- Locked map style still applies: real **satellite/topo** basemap (terrain visible); parchment/weathered fills where useful; thick white outer glow on borders; bold 3D/extruded labels + drop shadows; soft shadows; **correct locations only**
- Photos only as brief credibility inserts if needed — maps carry the story
- Claude may **exceed** the reference quality

## When NOT "map explainer"
Use the normal Skylab photo-underlay + motion-graphics pipeline.

## Style reference
- Short: https://youtube.com/shorts/5IaLp97pUQA — Rankora "Can You Walk From Austria to China?"
- Local file: `/workspace/deliverables/style-refs/map-explainer-ref.mp4` (~19s)
- Visual review (2026-09-28): copy or beat the techniques below

## Techniques to copy or beat (from reference)

### Map look
- Clean, label-light **satellite** base with natural earth tones for contrast
- Country/region highlights: crisp white borders; optional fill (flags in ref — for History Shorts prefer parchment/colour fill + 3D labels, not flag spam unless the beat needs flags)
- Bright contrasting route line (ref uses thick yellow with rounded caps) that **draws itself continuously**

### Motion / camera
- Macro ↔ micro zoom: wide establishing shot of the whole compare, then dive in for step-by-step
- Camera **always moving** — pan/track so the leading edge of the route stays near centre
- Relentless momentum: route line never stops; no dead air on a static map frame
- Optional playful props (walker cutout / star pop in ref) — History Shorts: prefer elegant pin/arc/badge choreography over meme cutouts unless asked

### Distance / compare callouts (beat the ref)
- Ref has **zero** numeric distances — **we should beat this**: dynamic km callouts, ticking counters, arc labels (e.g. Darwin↔Dili ~700 km vs Darwin↔Canberra ~3,100 km)
- Simultaneous compare pins for capitals; highlight which is closer

### Text
- Captions: bold sans, white + heavy dark stroke, ~1–2 words at a time synced to VO (channel caption engine handles this)
- Place labels over the geographic feature as it activates (not VO-echo sentences)

### What makes it map-explainer vs slideshow
- Continuous spatial context — viewer never loses place; relations shown by line/pan, not hard cuts between unrelated photos
- Geographic shapes + symbolic overlays as primary imagery

## Episode note (s18 Darwin)
Distance compares (Canberra / Dili / Port Moresby / Jakarta) + 1942 raid beat = natural map-explainer. Historical raid stills only as brief inserts; maps dominate.

## Episode note (s20 SAR region)
Australian Search and Rescue Region scale + Antarctica foreign bases = natural map-explainer. Self-drawing SRR outline/fill, halfway extent arcs, South Pole dive, neighbour SRR sweep, Vostok/Concordia pins. Station stills only as brief inserts; maps dominate. Soft facts: about 53M km²; one-tenth; AMSA halfway wording; aviation SRR to Pole; Vostok/Concordia inside AU SRR longitude band.
