# Cravio AI sales video: Remotion source

Code-driven motion graphics for the hero (16:9) and social (9:16) cuts.

## Single timing source
`tools/build_timing.py` reads faster-whisper word timestamps of the recorded VO
(`tools/*_words.json`) and writes `src/timing/{hero,social}.json`: VO phrase
placements (contiguous slices, never stretched), beat-aligned scene cuts, every
word in output time, the music edit map and the SFX cue list. Every animation
in `src/` keys off those word times, and `tools/mix_audio.py` builds the
soundtrack from the same file, so picture and sound cannot drift.

## Layout
- `src/theme.ts`: brand tokens, easing (expo/quart/springs ≤6% overshoot).
- `src/brand/`: Circuit Track C (drawn by stroke-dashoffset, nodes pop, settles
  to the exact colour-on-dark geometry), icon renderer with re-weighted strokes,
  generated vector data (`tools/gen_assets.mjs`).
- `src/components/`: cards, tags, kinetic type, background grid, tracks/pulses.
- `src/hero/`: Problem (scenes 1–4), World (5–10, one camera move along the
  conveyor), Finale (11–13).
- `src/social/`: the vertical re-composition.

Assets are served straight from `../assets` (fonts load locally).

## Build
```
npm install
../tools/render_all.sh        # add --4k for the 3840x2160 hero
```
Preview: `npx remotion studio`.
