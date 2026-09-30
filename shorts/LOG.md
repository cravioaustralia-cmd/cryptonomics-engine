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

## s16-nullarbor-845
- 2026-09-28T02:37:31+10:00 — staged on main with held Atlas VO 37.080s; issue opened for Claude premium build.

## 2026-09-28T13:05:53+10:00 — s17 New Australia Paraguay (scaffold)
- Episode: `shorts/s17-new-australia-paraguay/`
- Held Atlas en-AU VO `audio/vo.mp3` (**44.856 s**) from `/workspace/deliverables/s17-new-australia-paraguay/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE beat table, SOURCES, fact-check, The Journey bed (Ahjay Stelino / Mixkit), Mixkit SFX (+ paper_rustle), render README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 15 Commons/NASA free-licence (shearers 1891, Lane Worker 1893, Sydney Cove c.1890, Royal Tar, QLD MODIS + world topo ref, Paraguay sat 2003, Nueva Londres, Atlantic Forest ref, Mary Gilmore 1891 + Dame, AU–PY locator ref, New Australia colony); no AI stills
- **Maps rule locked:** parchment overlays on real satellite/topo; thick white outer glow; bold 3D labels — Australia (Sydney) ↔ Paraguay / New Australia / Cosme **only**
- Soft facts: over 200 / ~220 Royal Tar; Triple Alliance devastation without invented %; Lane rules without sole-cause overclaim; split → Cosme within a year; about 2,000 descendants; Gilmore on polymer $10 — paper $10 not used
- Hook: NEW AUSTRALIA (alts $10 NOTE · PARAGUAY · ROYAL TAR); loop intentionally incomplete on `Because`
- Note: s06 reserved Somerton Man; s16 Nullarbor; this is s17
- Asset gaps for Claude: polymer $10 Gilmore still; optional Cosme historical / higher-res Vandyck Lane

## 2026-09-28T14:58+10:00 — s18 Darwin Closer (scaffold)
- Episode: `shorts/s18-darwin-closer/`
- Held Atlas en-AU VO `audio/vo.mp3` (**45.336 s**) from `/workspace/deliverables/s18-darwin-closer/vo-raw/vo-atlas.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE-heavy **MAP EXPLAINER** beat table, MAP_EXPLAINER_MODE.md, SOURCES, fact-check, Silent Descent bed (Eugenio Mininni / Mixkit), Mixkit SFX (+ paper_rustle), render README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 17 Commons/NASA free-licence (Timor Sea + Van Diemen MODIS, Darwin waterfront/aerial, NT locator refs, Canberra, Dili, Port Moresby, Jakarta Monas, Darwin raid PD stills, Pearl Harbor Arizona compare, ISS Van Diemen); no AI stills
- **MAP EXPLAINER MODE locked:** kinetic cartography primary; continuous self-drawing routes + always-moving camera; numeric km callouts (beat Rankora ref); photos brief inserts only; parchment overlays on real satellite/topo; thick white outer glow; bold 3D labels — Darwin · Canberra · Dili · Port Moresby · Jakarta only (Pearl Harbor labelled compare only)
- Soft facts: Darwin↔Canberra ~3,127 / over 3,100; Dili ~720 / about 700; Port Moresby ~1,817 / about 1,800; Jakarta ~2,729 closer than Canberra; 19 Feb 1942; ~188 aircraft; Fuchida dual command soft; “by many accounts” more bombs; largest foreign air attack soft
- Hook: CLOSER THAN CANBERRA (alts DARWIN 1942 · 3100 KM · SAME COMMANDER); loop intentionally incomplete on `Because remember:`
- Note: s06 reserved Somerton Man; s17 New Australia Paraguay; this is s18
- Asset gaps for Claude: optional Fuchida portrait; higher-res Darwin 1942 harbour-fire stills if free-licence


## 2026-09-29T04:53+10:00 — s19 Emu War (scaffold)
- Episode: `shorts/s19-emu-war/`
- Atlas VO **pending** — scaffold only (Checkpoint C): script, vo_script (~104 spoken words), plan with ANIMATE beat table (standard Skylab, **not** map-explainer), SOURCES, fact-check (all PASS / PASS-SOFT; no FAIL), Curiosity bed (Diego Nava / Mixkit; ~4 dB quieter than s18 bed instruction), Mixkit SFX (+ paper_rustle), render README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 12 Commons free-licence (5× 1932 Emu War PD period stills; Merredin wheatbelt + aerial; WA running/flock/portrait emus; arid NSW flock scatter ref); no AI stills; no carcass hero frames
- Soft facts: about 20,000; >40 km/h (~48 sprint); weeks Nov–Dec 1932; thousands of bullets; soldiers pulled out; Meredith quote “reportedly”
- Hook: THE EMU WAR (alts THEY LOST TO BIRDS · 1932 · MACHINE GUNS VS EMUS); loop echoes open
- Note: s06 reserved Somerton Man; s18 Darwin Closer; this is s19
- Asset gaps for Claude: optional Trove 1932 newspaper prop; Sir George Pearce PD portrait; higher-res Lewis detail if needed

- 2026-09-29: Atlas VO locked at audio/vo.mp3 (40.920 s). Ready for Claude premium build.

- 2026-09-29: Scaffold s20-sar-region (MAP EXPLAINER) + Atlas VO 40.536s locked. Ready for Claude.

## 2026-09-30T11:15+10:00 — s22 Loch Ard Peacock (scaffold)
- Episode: `shorts/s22-loch-ard-peacock/`
- Atlas VO **pending** — scaffold only (Checkpoint C): script, vo_script (~105–110 spoken words), plan with ANIMATE beat table (standard Skylab, **not** map-explainer), SOURCES, fact-check (all PASS / PASS-SOFT; no FAIL), Fallen (Asper) bed (Eugenio Mininni / Mixkit id 565; ~4 dB quieter than s18 bed instruction), Mixkit SFX (+ paper_rustle), render README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 19 Commons free-licence (Minton peacock; Loch Ard Gorge / Island Arch / Mutton Bird Island; period Loch Ard ship SLV/SLQ; gorge cemetery; Flagstaff Hill village; soft Twelve Apostles coast colour); no AI stills; no gore
- Soft facts: ages 18–19; “third survivor” peacock metaphor; “valued at millions” = ~A$4m insurance/marketing not auction hammer; public wanted Tom & Eva to marry — they didn’t
- Hook: THREE SURVIVORS (alts THE PEACOCK · LOCH ARD · 1878); incomplete loop echoes open
- Geography lock: Victoria / Shipwreck Coast / Loch Ard Gorge / Mutton Bird Island / Flagstaff Hill Warrnambool only; never stamp Twelve Apostles as wreck site
- Note: s06 reserved Somerton Man; s21 Broome Japanese Cemetery; **this is s22**
- Asset gaps for Claude: optional 1878 Pearce/Carmichael portraits (licence-check); Carmichael watch Commons CC0; hull/rigging plans PD

## 2026-09-30T18:55+10:00 — s23 Wild Camels & The Ghan (scaffold)
- Episode: `shorts/s23-wild-camels-ghan/`
- Atlas VO **pending at scaffold** — separate hold commit expected (43.008 s source ready on box)
- Scaffold only (Checkpoint C): script, vo_script (~107 spoken words), plan with ANIMATE beat table (standard Skylab, **not** map-explainer), SOURCES, fact-check (all PASS / PASS-SOFT; no FAIL), Between Two Evils bed (Michael Ramir C. / Mixkit id 1020; ~4 dB quieter than s18 bed instruction), Mixkit SFX (+ paper_rustle), render README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 25 Commons free-licence (modern AU feral/outback camels; period cameleer trains; The Ghan; Overland Telegraph corridor; soft OT map underlay); no AI stills; no carcass heroes
- Soft facts: over a million soft/variable estimates; gradual release; Ghan “widely said”; Saudi live export PASS (2002+)
- Hook: OVER A MILLION (alts THE GHAN · WILD CAMELS · 1860s); incomplete loop on `So yes.`
- Geography lock: Australian outback / Red Centre / SA–NT Ghan corridor / OT only; never Arabia/Sahara/Gobi as Australia heroes
- SFX preference locked 2026-09-30: ~6–10 intentional cues (sparse)
- Note: s06 reserved Somerton Man; s22 Loch Ard Peacock; **this is s23**
- Asset gaps for Claude: optional Amedulah Khan camel train; higher-res Sadadeen; soft export still if free-licence

- 2026-09-30T19:00+10:00 — Atlas VO locked at audio/vo.mp3 (**43.008 s**). Ready for Claude premium build (issue opened; do not @claude until Video Production hands off).

## 2026-09-30T20:50+10:00 — s24 Burke & Wills (scaffold)
- Episode: `shorts/s24-burke-wills/`
- **Mode: MAP EXPLAINER (locked)** — GeoArchivez standing quality bar; Rankora secondary only
- Atlas VO **held** at `audio/vo.mp3` (**39.168 s**) from Downloads `s24_burke_wills_atlas_fast.mp3` — not re-recorded
- Scaffold only (Checkpoint C): script, vo_script, plan with ANIMATE map beat table, MAP_EXPLAINER_MODE.md, SOURCES, fact-check, Dark Drama bed (Mixkit 605), Mixkit SFX, render README
- **No `scenes.js`** — Claude owns design / animation / mix
- Stills: 22 Commons / NLA free-licence (Burke/Wills/King PD portraits, Dig Tree, Cooper/Menindee, NASA topo/sat basemaps, Longstaff, ST Gill departure, mangrove/Gulf coast); no AI stills
- Hook: `NINE HOURS` (alts `DIG` · `1860`)
- Soft facts: two-men open PASS-SOFT; ~20 t / oak table PASS; nine hours PASS-SOFT; DIG PASS; Gray ~4 days PASS; mangrove not ocean PASS; Yandruwandha dignity PASS
- Geography lock: Melbourne→Menindee→Cooper→Gulf→Cooper; never beach-ocean at Gulf
- Incomplete loop: `…story of how` → `In 1860…`
- Note: s06 reserved Somerton Man; s23 Wild Camels; this is s24
