# Render — s11 Cassowary

Claude-owned `scenes.js` + `config.json` (SFX cues, mix levels). SVG + `renderFrame(t)` + Playwright + ffmpeg via `shorts/shared/render/`; no Remotion.

```bash
cd shorts/shared/render && npm install        # once
# from repo root (set CHROMIUM_PATH if the Playwright browser build differs, e.g. /opt/pw-browsers/chromium)
node shorts/shared/render/snapshot.mjs shorts/s11-cassowary /tmp/s11-check 0 3.2 7.3 13.6 22.4 32.6 39.4
node shorts/shared/render/render-episode.mjs shorts/s11-cassowary
```

- Word timings: `../transcript.json` (faster-whisper small.en on `audio/vo.mp3`). Whisper's US spellings and mishears were corrected to the script: "metres", "kilometres", "centimetres", "two", "ten", "dagger-like", "rainforest".
- Beats: hook + casque scan + claw slashes · specimen card + height ruler (`CASSOWARY`, `~2 m`) · wide frame + speed streaks (`~50 km/h`) + jump/swim icons · claw lens + dagger + `>10 cm` measure · period print + `1926` stamp + tracks + `QUEENSLAND` + Cairns→Mossman map pin · warm twist + foliage (`SHY`) · seed lens → seed arcs → sprouts (`SEED DISPERSAL`) · loop back to the frame-1 framing + hook.
- Mix: PR #21 path. The VO's loudness is measured, then it gets a static gain (+7.2 dB) and `apad`, then it is `amix`ed with music + SFX, then a measured two-pass `loudnorm` runs on the master only. The premix is written as 32-bit float so the gained VO peaks don't clip before the master pass.
- Deliverable mux uses AAC 320k (`-af apad -t 39.408`). At 192k/256k, ffmpeg's AAC encoder overshoots to +0.5 dBTP on the VO onset at t=0; at 320k the result is −1.7 dBTP.

Final MP4 + contact sheet: `../deliverables/`.
