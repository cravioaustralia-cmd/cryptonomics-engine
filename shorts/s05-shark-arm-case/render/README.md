# Render — s05 The Shark Arm Case

- `scenes.js` (Claude-owned) — one compositor scene drives eight photo-underlay beats with real crossfades / masked wipes (tide wipe, diagonal slide), case-file MG kit (evidence markers, rubber stamps, typewriter tags, ink rings, pins, AF brackets), per-beat colour grades, grain, and word-highlight captions at ~70 %.
- `config.json` — duration, mix (ducked Vastness bed, −14 LUFS) and the SFX cue sheet, tuned to `../transcript.json` (faster-whisper word timings on the held `audio/vo.mp3`).
- Deliverable: `../final/s05-shark-arm-case.mp4` + `../final/s05-shark-arm-case-contact-sheet.jpg`.

```bash
cd shorts/shared/render && npm install        # once
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/shared/render/contact-sheet.mjs shorts/s05-shark-arm-case --every 2.5
CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/shared/render/render-episode.mjs shorts/s05-shark-arm-case
```

`out/` (frames, silent MP4, working MP4) and `audio/final-mix.mp3` stay out of Git.

| Beat | Time (s) | Underlay | Motion |
|---|---|---|---|
| 1 | 0–5.0 | Coogee pier c.1929 | frame-1 hook slab, `1935` stroke draw-on, pin + `COOGEE` lock-up, push-in |
| 2 | 5.0–9.95 | tiger shark (present-day) | tide wipe, shake + shock rings on “threw up”, `TIGER SHARK` species lock-up, crowd print slides in on “in front of everyone” |
| 3 | 9.95–20.2 | two boxers (PD) | evidence markers 1/2, ink rings, `TATTOO: TWO BOXERS`, `BITTEN OFF` struck, `CUT OFF` stamp, forensic cut line + `KNIFE` tag |
| 4 | 20.2–24.8 | Water Police Courts (present-day) | `WATER POLICE COURTS` lock-up, NSW police file card, `JAMES SMITH` / `BOXER` typed on cue, `MISSING` stamp |
| 5 | 24.8–30.4 | Circular Quay c.1930 | `SHARK ATTACK` struck, `MURDER` stamp, fin + dashed wake across the harbour, vignette on “delivery service” |
| 6 | 30.4–37.7 | 1934–35 Buick (present-day) | night grade, rain, headlights on → cut out on “shot dead”, `SUSPECT` / `KEY WITNESS` tags (witness struck), plate masked |
| 7 | 37.7–43.05 | Darlinghurst Court House (present-day) | `DARLINGHURST` lock-up, `ACQUITTED` stamp, `BODY: NEVER FOUND` typed, pull-back |
| 8 | 43.05–47.208 | tiger shark (present-day) | AF brackets hunt → lock red on the eye, `WITNESS 01` tag, dissolve back into the frame-1 hook for the loop |
