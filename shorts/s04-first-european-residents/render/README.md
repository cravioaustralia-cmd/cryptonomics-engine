# Render — s04 Australia’s First European Residents

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg through `shorts/shared/render/` (no Remotion).
Timing: `../transcript.json` (faster-whisper word times on the held VO).

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s04-first-european-residents --every 2.5
node shorts/shared/render/render-episode.mjs shorts/s04-first-european-residents
# sandbox without Playwright's bundled browser: prefix with CHROMIUM_PATH=/opt/pw-browsers/chromium
```

Output: `out/s04-first-european-residents.mp4` (1080×1920, 30 fps, H.264 CRF 17, 9 Mbps cap + AAC), copied to
`deliverables/s04-first-european-residents/` for review.

## Beats (`scenes.js`)

| # | Time (s) | Underlay | Motion graphics |
|---|---:|---|---|
| 1 | 0–9.0 | Batavia replica (labelled present-day) | Frame-1 hook `159 / YEARS BEFORE THE / FIRST FLEET` docks up; 1629→1788 timeline fills with a year counter; VOC wax seal slams on “punishment” |
| 2 | 9.0–15.55 | Morning Reef aerial | `1629` slam; WA locator draws in, Batavia sails the route, strikes the Abrolhos (pin, cracks, shake); map clears to a gold trace of the real surf line |
| 3 | 15.55–26.2 | 1647 *Ongeluckige voyagie* plate (sepia) | Commander’s longboat ringed + route off-frame; `JERONIMUS CORNELISZ · VOC MERCHANT` lock-up; red wash; 110 lights extinguish → `100+` (no violent imagery) |
| 4 | 26.2–38.3 | Wiebbe Hayes fort remains, West Wallabi (present day) | Gold flash; `SOLDIER · WIEBBE HAYES`; `WEST WALLABI ISLAND`; perimeter holds against pressure arrows; gold line-draw along the real stone wall; compact fact tag |
| 5 | 38.3–42.35 | Beacon Island aerial | Rescue ship sails in with wake; mutineer markers ringed and locked on “caught” |
| 6 | 42.35–44.95 | Batavia timbers, WA Shipwrecks Museum | `CORNELISZ` struck through in red, greys out |
| 7 | 44.95–51.0 | Kalbarri coast (mainland WA) | Abrolhos → mainland map: two figures, longboat crossing, ashore inside an approximate dashed zone |
| 8 | 51.0–56.9 | Kalbarri cliffs | `WOUTER LOOS` / `JAN PELGROM` type in; two trails of footprints head inland, then fade with the names |
| 9 | 56.9–61.56 | Batavia wreck site (marked photo) | Pulse on the real marker; `BATAVIA WRECK SITE`; `1629 → ?` timeline; crossfades into frame 1 for the loop |

Captions: Oswald uppercase, active word in gold, centred at ~70% (y≈1366); all graphics sit above y≈1200.

## Audio (`config.json` → `mix`)

Held VO (compressed, loudnorm) + *Vastness* bed sidechain-ducked under the VO + 39 timed SFX cues
(named in `config.json`), two-pass static gain to −14 LUFS with a latency-compensated limiter (≈ −1.8 dBTP); duration exactly 61.560 s.
