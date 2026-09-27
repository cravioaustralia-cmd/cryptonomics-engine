# Render — s12 Koala Fingerprints

Claude-owned `scenes.js` + `config.json` (SFX cues, mix levels). SVG + `renderFrame(t)` + Playwright + ffmpeg via `shorts/shared/render/`; no Remotion.

```bash
cd shorts/shared/render && npm install        # once
# from repo root (set CHROMIUM_PATH if the Playwright browser build differs, e.g. /opt/pw-browsers/chromium-*/chrome-linux/chrome)
node shorts/shared/render/snapshot.mjs shorts/s12-koala-fingerprints /tmp/s12-check 0 5.3 12.6 17.7 25.8 31.9 37.04
node shorts/shared/render/render-episode.mjs shorts/s12-koala-fingerprints
# deliverable mux (AAC 320k keeps true peak under −1.5 dBTP)
ffmpeg -i out/s12-koala-fingerprints-silent.mp4 -i audio/final-mix.mp3 -map 0:v -map 1:a -c:v copy \
  -af apad -t 37.08 -c:a aac -b:a 320k -movflags +faststart deliverables/s12-koala-fingerprints.mp4
```

- Word timings: `../transcript.json` (faster-whisper small.en on `audio/vo.mp3`), with punctuation corrected to the script. Word ends were checked against silencedetect: "leaves." ends 28.62, "Different" starts 29.0, and the final "yours." runs to 36.92.
- Beats: 1. hook + ridge whorl draws around the Cape Otway koala, then flies in on "yours". 2. Koala-pad lens vs human-print lens: `∼` is struck out, then `≈` appears as both lenses scan in sync, followed by the loop/whorl/ridge tiles. 3. Microscope proxy: eyepiece iris + focus pull, then a two-print shell game ending in `?` `?`. 4. `IN THEORY` print card: a dusting brush reveals print B, a magnifier sweeps A→B, then `≈`, the koala lens and a tent marker. 5. Warm twist: marsupial/primate fork, fingerprints glow on each branch separately, `CONVERGENT EVOLUTION`. 6. Claws on the branch (`GRIP` / `BRANCHES`) + eucalyptus lens (`LEAVES`). 7. Koala and human cards crack apart, then the same whorl draws on both and an `=` links them. 8. Loop back to the frame-1 framing; the hook re-forms on "yours".
- Mix: PR #21/#23 path. The VO measures −22.86 LUFS and gets a static +6.86 dB with `apad`. It is then `amix`ed with the music and SFX in a 32-bit float premix, and a measured two-pass `loudnorm` runs on the master only. Final: −14.7 LUFS / −1.7 dBTP.
