# History Shorts production log

## 2026-09-25 — Switched repo
- Production home moved from cravioaustralia-cmd/shorts-channel to cravioaustralia-cmd/cryptonomics-engine per user.
- Shared Mixkit SFX kit copied into public/sfx/ and shorts/shared/sfx/.

## 2026-09-25 — Non-Remotion rebuild (s01)
- Remotion waived override **revoked**. History Shorts use SVG + renderFrame(t) + Playwright + ffmpeg only.
- Scaffolded reusable renderer at `shorts/shared/render/`.
- Rebuilding `s01-skylab-esperance` without Remotion CLI / `src/episodes` compositions.

## 2026-09-25 — s01 non-Remotion render complete
- Renderer: shorts/shared/render (SVG + renderFrame + Playwright + ffmpeg)
- Output: shorts/s01-skylab-esperance/out/s01-skylab-esperance.mp4 → deliverables/s01-skylab-esperance/
- Animations: hook slam, orbit/satellite, map pin, debris rain, debris card, museum plaque, council pop, ticket+ISSUED, UNPAID+year count, radio EQ + Scott Barley, cash pop, loop punchline

## 2026-09-25 — Incoming VO batch (02–06 held)
Unpacked 6 Grok VOs into shorts/incoming-vo/. #01 matches finished Skylab Short; #02–06 held until scripts arrive. Use matching file as VO (skip Grok re-record).

## 2026-09-25 — s02 man who named Australia (non-Remotion)
- Episode: `shorts/s02-man-who-named-australia/`
- VO: held file `incoming-vo/02-man-who-named-australia.mp3` (~64.968s) — not re-recorded
- Renderer: shorts/shared/render (SVG + renderFrame + Playwright + ffmpeg)
- Output: `shorts/s02-man-who-named-australia/out/s02-man-who-named-australia.mp4` → `deliverables/s02-man-who-named-australia/`
- Animations: hook station-gulp slam, circumnavigate ship+Flinders, Trim friendship, prison bars+Trim fade, AUSTRALIA name+book July 1814, candle die, London grow/station gulp, dig+lead plate, village rest+loop punchline
- Music: Mixkit Vastness (Andrew Ev) — pack “epic_cinematic_adventure” skipped (likely CC BY-NC-ND)
- Mix: VO + ducked music + timed SFX (shared + thematic), loudnorm on VO
- Licence note: image SOURCES.md is best-effort from pack; prefer cartoon motion over stills

## 2026-09-25 — s02 animation-primary rebuild (review fail fix)
- Prior cut FAILED review: photo slideshow + rudimentary SVG overlays; alpine mountain still used for Donington/Lincolnshire home village.
- Rewrote `shorts/s02-man-who-named-australia/render/scenes.js` to **ANIMATE-primary / STILL-as-card-only**.
- Deleted `images/s02_10_donington_st_mary.jpg` (alpine/Dolomite — geographically wrong). Village beat is pure English parish illustration.
- No full-bleed photo underlays (Euston, Mauritius coast, dig, portrait removed as backgrounds).
- Credibility cards only (brief): Flinders portrait, HMS Investigator, dig-site inset.
- Animated scenes: hook cemetery+station gulp, circumnavigate ship+Flinders, Trim deck friendship, prison bars+Mauritius island+Trim fade, AUSTRALIA slam+book, candle extinguish, London skyline grow+station gulp, dig particles+lead plate, English village rest+loop punchline.
- Re-rendered via `node shorts/shared/render/render-episode.mjs shorts/s02-man-who-named-australia`.
- Output: `out/s02-man-who-named-australia.mp4` (1080×1920 30fps ~64.9s) → `deliverables/s02-man-who-named-australia/`.
- Audio: held VO + Vastness + same SFX cues (re-mixed, not redesigned). No YouTube upload.

## 2026-09-25 — s02 MG rebuild (VO-echo killed)
- User rejected prior cut: VO-echo titles + weak design.
- Rewrote `s02…/render/scenes.js`: kill-list applied; short labels only; motion-graphics upgrades (wake/orbit, Trim blink, bars slam, ink stamp, page flip, candle smoke, skyline build, dig particles, plate rotate-in, cloud drift, crossfades).
- Updated MASTER_PROMPT.md, workflows/shorts-pipeline/SKILL.md, shorts/CLAUDE.md with on-screen text rule + MG quality bar.
- Re-rendered via `node shorts/shared/render/render-episode.mjs shorts/s02-man-who-named-australia`.
- Deliverable: `out/s02-man-who-named-australia.mp4` → `deliverables/s02-man-who-named-australia/`.

## 2026-09-26 — s09 wombat cube poop (scaffold)
- Episode: `shorts/s09-wombat-cube-poop/`
- VO: held Atlas en-AU `audio/vo.mp3` (33.792 s) from Downloads / deliverables vo-raw — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Mixkit Fun and Games bed, shared SFX copy, render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 8 Commons free-licence (cube scat, common wombats, digestive PD schematic, burrow, science-medal abstract); no AI stills

## 2026-09-27T09:42:41+10:00 — s10 Shark Arm Case (fast rebuild)
- Atlas VO 37.488s held; staging assets from s05 still pack; Claude owns scenes/mix/render.
- Hook: Thrown up by a shark

## 2026-09-27T13:00:25+10:00 — s11 Cassowary (scaffold)
- Episode: `shorts/s11-cassowary/`
- Held Atlas en-AU VO `audio/vo.mp3` (**39.408 s**) from `/workspace/deliverables/s11-cassowary/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Vastness bed, Mixkit SFX (+ jungle/forest ambience), render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 10 Commons free-licence (southern cassowary QLD, claw foot, 1920s Cook Highway PD, seed dropping, Daintree); no AI stills; no gore
- Hook: Looks like a dinosaur
- Note: s06 reserved Somerton Man; s10 Shark Arm rebuild; this is s11

## 2026-09-27T18:58+10:00 — s12 Koala Fingerprints (scaffold)
- Episode: `shorts/s12-koala-fingerprints/`
- Held Atlas en-AU VO `audio/vo.mp3` (**37.080 s**) from `/workspace/deliverables/s12-koala-fingerprints/vo-raw/vo-atlas.mp3` (also Downloads) — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Vastness bed, Mixkit SFX (+ forest birds), render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 12 Commons free-licence (Cape Otway / Mount Lofty / Sydney / Bonorong koalas, Clancy hind-foot pads, human fingerprint loops/whorls, NIST PD card, lab microscope proxy, climbing, eucalyptus leaves); no AI stills; no fake crime-scene case
- Soft fact: crime-scene beat is theoretical (Henneberg “extremely unlikely”) — not a verified forensic case
- Hook: Almost identical
- Note: s06 reserved Somerton Man; s11 Cassowary; this is s12

## 2026-09-27T19:51+10:00 — s13 The Wrong Border (scaffold)
- Episode: `shorts/s13-wrong-border/`
- Held Atlas en-AU VO `audio/vo.mp3` (**38.376 s**) from `/workspace/deliverables/s13-wrong-border/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Curiosity bed (Diego Nava / Mixkit), Mixkit SFX (+ paper_rustle), render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 9 Commons free-licence (1883 border kink, dispute diagram, 141st meridian SVG, Port Phillip 1839 SVG, Middlesex Guildhall proxy, Charles Todd portrait, anomaly map, SA handbook map, Serviceton aerial); no AI stills
- Soft facts: area ~1,300 km²; offset ~3–3.6 km west; Guildhall = modern JCPC proxy; Todd = remeasurement not Wade; NSW origin noted; longitude MG/SVG
- Hook: WRONG LINE (alt 141°E); loop intentionally incomplete
- Note: s06 reserved Somerton Man; s12 Koala Fingerprints; this is s13

## 2026-09-27T20:32+10:00 — s14 German Place Names (scaffold)
- Episode: `shorts/s14-german-place-names/`
- Held Atlas en-AU VO `audio/vo.mp3` (**45.000 s**) from `/workspace/deliverables/s14-german-place-names/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Silent Descent bed (Eugenio Mininni / Mixkit), Mixkit SFX (+ paper_rustle), render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 11 Commons free-licence (Hahndorf church/street, Lobethal, Klemzig painting, Birdwood aerial, Queen Adelaide, Gen. Birdwood Gallipoli, Adelaide skyline, Capt. Hahn, Tweedvale bush, SA relief underlay); no AI stills
- **Maps rule locked:** textured satellite basemaps + 3D extruded/tilted — not flat schematic/outline/bare relief-only; Claude builds 3D satellite map MG for wipe/rename
- Soft facts: 69 gazette / ~69 hedge; Ambleside = railway station not Gallipoli general; Queen Adelaide German-born Saxe-Meiningen; Hahn Danish-born; Hahndorf+Lobethal+Klemzig restored 1935; Birdwood stayed
- Hook: 69 NAMES (alt WIPED OFF); loop intentionally incomplete
- Note: s06 reserved Somerton Man; s13 Wrong Border; this is s14

## 2026-09-28T01:11+10:00 — s15 Irukandji (scaffold)
- Episode: `shorts/s15-irukandji/`
- Held Atlas en-AU VO `audio/vo.mp3` (**35.640 s**) from `/workspace/deliverables/s15-irukandji/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, Delirium bed (Eugenio Mininni / Mixkit), Mixkit SFX (+ paper_rustle), render/config.json + README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 11 Commons free-licence (Gershwin *C. barnesi*, vial scale, size schematic MG-ref, GBR MODIS basemap, Whitsunday MISR, GBRMP locator SVG, hazard sign, vinegar depot, Mater Townsville, 12-lead ECG, Munch doom proxy); no AI stills; no gore
- **Maps rule locked:** parchment overlays on real satellite/topo (terrain visible); thick white outer glow; bold 3D labels + drop shadows; soft shadows — northern Australia / GBR / tropical north waters **only**
- Soft facts: fingernail/~1–2 cm; *C. barnesi* namesake vs multi-species syndrome; ~20–60 min onset; doom symptom; most survive with hospital; deaths rare/recorded (often ~2002) — do not overstate; don’t conflate with *Chironex*
- Hook: IRUKANDJI (alt SMALLER THAN A NAIL); loop complete echo of fingernail open
- Note: s06 reserved Somerton Man; s13 Wrong Border; s14 German Place Names; this is s15

## 2026-09-28 — s15 Irukandji (premium build, Checkpoint C)
- `render/scenes.js`: 12 beats on photo underlays / locked-style map, with its own compositor (crossfade · whip · flash). Loop returns to the frame-1 `IRUKANDJI` macro.
- Locked map built from the MODIS pixels themselves (`render/build-map-layers.py` → `images/s15_12…15`): parchment land, white glow, shadow, coastal waters band, 3D labels.
- `transcript.json` (faster-whisper small.en, corrected to the script); 41 SFX cues; fixed mixer ported to shared (measure → static gain + apad → float amix → two-pass master loudnorm).
- Final: `deliverables/s15-irukandji.mp4` (1080×1920@30, 35.6 s, −14.4 LUFS / −1.6 dBTP); Whisper on the final recovers all 96 VO words.
