# Shot plan — s02-man-who-named-australia (Issue #6 premium rebuild)

**Look:** full-bleed photo underlay on every beat (graded, focal-point Ken Burns; low-res landscape stills use a blurred full-bleed fill + sharp feathered band) with designed SVG motion graphics on top.
**Stack:** SVG + renderFrame(t) + Playwright + ffmpeg (**no Remotion**). Shared renderer `shorts/shared/render/`.
**Captions:** engine, lower-middle ~70% (y≈1344), Montserrat 900, active word tinted gold. All MG lives in y 150–1200 — caption band and YouTube UI zones stay clear.
**Type system:** Bebas Neue (labels/numerals), Cormorant Garamond (names), Cinzel (artifacts: book, plate, Trim tag), IBM Plex Mono (kickers). OFL fonts bundled in `shorts/shared/fonts/`.
**Finishing:** true crossfade seams (0.32 s), warm light-leak kiss on each cut, vignette, animated film grain.
**Audio:** held `audio/final-mix.mp3` (VO not re-recorded) — `render-episode.mjs --reuse-mix`. Duration **64.968 s**.

## On-screen text (strict — no VO-echo)
names: Matthew Flinders (+ CAPTAIN kicker), Trim · places: London, Australia, Mauritius, England, Euston Station, Donington (Lincolnshire · England) · key facts: 200 YEARS (hook), 6½ YEARS, JULY 1814 / 1814, 2019, 40,000 BURIALS, 2024 · artifacts: HMS Investigator, *A Voyage to Terra Australis* title page, lead plate “CAPTAIN MATTHEW FLINDERS”, AUSTRALIA ink stamp on Flinders’ chart.

| # | Time (s) | Underlay still | Motion graphics |
|---|----------|----------------|-----------------|
| 1 | 0–7.10 | London Euston platform (cool grade, push-out) | **200 YEARS** on frame 1 (slam settle); LONDON pin tag; ground-radar cutaway opens under the platform — strata, scan line sweeps, GPR hyperbolas reveal a coffin that pulses gold on “200 years” |
| 2 | 7.10–9.40 | Flinders portrait (PD), push-in on face | museum frame line draws around portrait; nameplate CAPTAIN / *Matthew Flinders* (rule + mask reveals) |
| 3 | 9.40–12.25 | HMS Investigator model (blur fill + sharp band) | chart-grid map card: Australia coastline draws, dashed route + ship sail anticlockwise from Cape Leeuwin all the way round; AUSTRALIA reveal; completion ping; HMS INVESTIGATOR tag |
| 4 | 12.25–16.25 | Flinders + Trim statue — push from full statue to the bronze cat | paw-print trail; focus reticle locks on Trim on “black cat”; brass TRIM collar tag swings in on “Trim” |
| 5 | 16.25–24.15 | Port Louis harbour, Mauritius | Indian-Ocean map card: route Sydney → Torres Strait → Timor → Mauritius with ship; iron bars slam (camera shake) on “imprisoned”; MAURITIUS pin; 6 tally marks + a half → **6½ YEARS**; Trim silhouette (white paws + breast star) dissolves into gold specks on “disappeared” |
| 6 | 24.15–29.45 | Flinders’ own *Chart of Terra Australis* (1802-3), zoom into the title | ENGLAND tag; highlight box on “TERRA AUSTRALIS”; red strike-through; **AUSTRALIA** rubber ink stamp slams with splatter + shake on “Australia” |
| 7 | 29.45–33.20 | *A Voyage to Terra Australis* binding — spine label pan | title-page card rises (Cinzel typeset); JULY 1814 typewriter readout + 1814 stamp |
| 8 | 33.20–35.85 | Flinders portrait drained to mono, darkening | designed candle (wax drips, brass holder, flicker glow) gutters out on “next day”; smoke curls. **No text** |
| 9 | 35.85–46.50 | Euston — sepia (past) → full colour when the station “swallows” | burial-ground headstone rows rise in perspective; LONDON tag; Georgian terraces grow with lit windows on “city grew”; Flinders’ gold-edged headstone lifts away on “removed”; station girders + converging rails slam in, headstones sink; EUSTON STATION tag; search reticle hunts and fades on “grave was lost” |
| 10 | 46.50–56.80 | Urban excavation trench | white flash + **2019** slam; dirt bursts on “digging”; 40,000 counter + 400-dot matrix (1 dot = 100 burials) → **40,000 BURIALS**; lead plate flips in, engraving scribes CAPTAIN / MATTHEW FLINDERS word-synced; glint sweep; dust motes |
| 11 | 56.80–64.97 | Flat Lincolnshire fields/parish (golden grade) | **2024** slam; DONINGTON pin (LINCOLNSHIRE · ENGLAND); birds + drifting motes + sun flare; loop: gold Australia outline draws + AUSTRALIA reveal, fade toward frame-1 darkness |

## Render
```bash
cd shorts/shared/render && npm i
export CHROMIUM_PATH=/opt/pw-browsers/chromium   # only if Playwright's own browser isn't installed
node contact-sheet.mjs ../../s02-man-who-named-australia contact_claude   # review first
node render-episode.mjs ../../s02-man-who-named-australia --reuse-mix --workers 4
```
