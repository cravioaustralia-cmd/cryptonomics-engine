# s34 Pheasant Island — render

Stack: SVG + `renderFrame(t)` + Playwright + ffmpeg, on `shorts/shared/render/` (no Remotion).

```bash
cd shorts/shared/render && npm ci            # once
cd ../../s34-pheasant-island/render
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node render.mjs   # → final/s34-pheasant-island.mp4
node stills.mjs /tmp/sheet 0 5.4 9.9 ...                      # review frames
```

- `scenes.js` — all design: 12 beats, own frame compositor and karaoke captions (lower-middle band, y≈1344; no graphic enters y 1234–1460).
- `transcript.json` (episode root) — script-spelling words with faster-whisper `small.en` word timings (`whisper_words.json`), built by `build-transcript.mjs`.
- `render.mjs` — prep images → transcript → audio mix → capture → AAC mux. Mix: VO (light compression) + Sneaky Snitch bed sidechain-ducked under VO + 11 peak-matched SFX cues; two-pass loudnorm to −14 LUFS / −2 dBTP; final AAC is re-measured and trimmed if true peak > −1.5 dBTP.
- `prep-images.sh` — render copies (≤2400 px) in `images/_render/` (git-ignored).

## Beat map
| t (s) | beat | still | motion |
|---|---|---|---|
| 0–4.15 | hook | island from international bridge (Spain left, France right) | frame-1 hook text, flag disc flips FR→ES→FR, pin ripple |
| 4.15–5.3 | name | island from Irun | serif plate (FR/ES/Basque names), leader line |
| 5.3–10.45 | where | schematic map from brief coordinates | camera zoom to island, pin drop, Bidasoa label, border draws, France/Spain fills + chips, Hendaye/Irun |
| 10.45–12.65 | no pheasants | island from Behobia | viewfinder scan, "PHEASANTS SPOTTED 0" HUD |
| 12.65–18.25 | 1659 meeting | Rijksmuseum print of the conference on the island | year slam, crossed sabres, banners converge on the pavilion |
| 18.25–20.45 | treaty | Treaty of the Pyrenees, Archives nationales | plaque, quill signs |
| 20.45–23.55 | marriage | Louis XIV (Mignard), Maria Theresa (Velázquez) over Beaulieu 1660 meeting | frames slide in, cord + wax seal stamp |
| 23.55–26.75 | who got it | 17th-c. plan "half France, half Spain" | flag pins knock each other off, "?" |
| 26.75–33.7 | shared | island wide | split disc → 12-month dial; Spain fills Feb–Jul, France Aug–Jan, hand sweeps |
| 33.7–38.85 | nobody / no visits / area | island at low tide | POPULATION 0, perimeter + padlock, grid fill ≈ 7,000 m² |
| 38.85–40.6 | monument | treaty memorial on the island | bracket snap, plaque |
| 40.6–43.56 | loop | same bridge shot as frame 1 | six-month ring fills, disc flips ES→FR, hook text returns = frame 1 |
