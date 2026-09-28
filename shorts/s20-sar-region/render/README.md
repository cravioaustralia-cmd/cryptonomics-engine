# Render — s20-sar-region (MAP EXPLAINER)

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg (no Remotion). Reuses `shorts/shared/render/`
(`frame.html`, `engine.js` helpers, `capture.mjs`, `snapshot.mjs`).

## Files
- `scenes.js` — the whole Short. Each frame:
  1. **Globe canvas** — NASA world.topo.bathy (`images/s20_01…`) reprojected onto an orthographic globe in a
     WebGL fragment shader (inverse orthographic, soft sun, limb darkening, atmosphere halo). The camera is
     a keyframed Hermite spline (lon / lat / log-zoom) plus micro-drift, so the map never stops moving.
  2. **SVG cartography** — self-drawing SRR outline (thick white outer glow + parchment fill with paper stains),
     neighbour-zone tints, halfway arcs, pins, 3D extruded labels, numeric callouts, captions at ~70 %.
- `mix.mjs` — VO static gain + apad → float amix with music/SFX (normalize=0) → peak limiter → **two-pass
  loudnorm on the master only** (−14 LUFS / −1.5 dBTP). No VO loudnorm before the amix. Music (Vastness)
  sits at −24 dB (~−37.6 LUFS), about 4 dB under the s18 Silent Descent bed.
- `build.mjs` — mix → capture → mux → `final/s20-sar-region.mp4`.
- Fonts: Anton + Montserrat (SIL OFL 1.1, via @fontsource) in `images/fonts/`, loaded by `EPISODE.preload()`.

## Build
```bash
cd shorts/shared/render && npm ci && cd -
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/s20-sar-region/render/build.mjs
# single frames for checks:
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/shared/render/snapshot.mjs shorts/s20-sar-region /tmp/snaps 0 9 24.5 36
```

## Beat map (Whisper timings, `transcript.json`)
| t (s) | Beat | Motion |
|---|---|---|
| 0–4.3 | Hook `1/10 OF EARTH` (frame 1) | SRR already lit, AMSA · Canberra pin, pulse on "one-tenth" |
| 4.3–7.4 | "places you'd never guess" | camera drifts south, SRR fades, `?` pulses over Vostok / Concordia |
| 7.4–14.3 | SRR / international agreement | outline self-draws with comet head (7.9–10.0), parchment fill, `SRR`, `ICAO · IMO`, neighbour tints |
| 14.3–18.2 | about 53 million km² | `~0→53` counter, `MILLION KM²` slam, `≈ 1/10 OF EARTH` chip |
| 18.2–22.8 | halfway ×3 | Perth→Africa, Port Hedland→Indonesia, Sydney→New Zealand arcs; `HALFWAY` marker where each crosses the edge |
| 22.8–25.2 | South Pole | whip-dive onto the Pole, pin drop, aviation-SRR wedge pulse |
| 25.2–30.8 | borders | pull-back sweep: `SOUTH AFRICA` → `SRI LANKA` → `SOLOMON ISLANDS`, `10 NEIGHBOURING ZONES` |
| 30.8–38.9 | Antarctic bases | plateau descent, 75°E / 163°E band edges, `VOSTOK · RUSSIA`, `CONCORDIA · FRANCE · ITALY` pins |
| 38.9–40.5 | loop line | SOS rings on both bases, then a blurred whip back to the frame-1 globe + `1/10 OF EARTH` |

## Geography notes
SRR edges at 75°E and 163°E, aviation SRR to the Pole (AMSA / NATSAR). The northern edge is a simplified trace
of the AMSA SRR map along the Indonesian / PNG / Solomon Islands regions (AMSA site unreachable from the build
container, so it was not re-traced from the official outline). Neighbour zones are shown only as soft tints
touching our edge; no far borders are invented. Station pins: Vostok 78.47°S 106.80°E, Concordia 75.10°S 123.33°E.
