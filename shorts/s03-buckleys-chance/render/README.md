# Render — s03 Buckley’s Chance

- `scenes.js` — 8 beats, photo underlay + SVG motion graphics on each (see `../LOG.md` beat table).
- `config.json` — duration, ducked-mix settings, SFX cue sheet.
- Timing comes from `../transcript.json`.

```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s03-buckleys-chance --every 2.5   # review first
node shorts/shared/render/render-episode.mjs shorts/s03-buckleys-chance              # → out/s03-buckleys-chance.mp4
```

Generated MP4s and frame dumps in `out/` stay out of Git; the reviewed cut is copied to `../deliverables/`.
