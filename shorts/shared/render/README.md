# Shared Shorts renderer (no Remotion)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**.

## Layout
- `frame.html` — 1080×1920 page; loads episode `scenes.js`
- `engine.js` — easing, captions (~70% (lower-middle)), still underlay helpers
- `capture.mjs` — Playwright seeks `renderFrame(t)` and pipes JPEGs to ffmpeg
- `mix-audio.mjs` — VO + ducked music + timed SFX → `final-mix.mp3`
- `render-episode.mjs` — mix → capture → mux helper
- `contact-sheet.mjs` — review sheet before every final render (`--every 2.5` or `--at 1,4.2,9`)
- `fonts/` — OFL fonts (Oswald, Playfair Display) served at `/fonts/*` for episode `@font-face` / `FontFace`

## Episode contract
Each Short provides `render/scenes.js` that sets:

```js
window.EPISODE = {
  duration: 53.088,
  fps: 30,
  images: { /* id → relative URL */ },
  words: [ /* {word,start,end} from transcript */ ],
  scenes: [ /* {id, start, end, draw(t, localT, ctx)} */ ],
};
window.renderFrame = function (t) { /* engine calls scenes + captions */ };
```

## Usage
```bash
node shorts/shared/render/render-episode.mjs shorts/s01-skylab-esperance
```

## Captions
Captions must never overlap animations, badges, stamps, cards, or other on-screen text. Default lower-middle (~70% from top); nudge per beat when a graphic occupies that band.

## Optional config (render/config.json)
- `video`: `{ crf, preset, jpegQuality }` encoder overrides (defaults 18 / veryfast / 88).
- `mix`: enables the ducked mix — `{ musicVol, musicStart, duck, duckThreshold, duckRatio, duckAttack, duckRelease, fadeIn, fadeOut, lufs }`.
  Two-pass: sample-exact premix, then one static gain to `lufs` + latency-compensated limiter (no look-ahead drift), written as `audio/final-mix.wav`.
  Without `mix`, the original flat mix is used unchanged. SFX cues accept `dur` (trim + faded tail).
- `sfxDir` may be relative to the episode; a stale absolute path falls back to `<episode>/sfx`.

## Episode hooks
- `EPISODE.preload()` (async, optional) runs once before capture — load fonts, decode images.
- `renderFrame(t)` may return a promise; capture awaits it.

## Sandboxes
If Playwright's bundled browser is missing, point at a pre-installed Chromium instead of downloading:
`CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/shared/render/render-episode.mjs <episode>`
