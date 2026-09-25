# Shared Shorts renderer (no Remotion)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**.

## Layout
- `frame.html` — 1080×1920 page; loads episode `scenes.js`
- `engine.js` — easing, captions (~70% (lower-middle)), still underlay helpers
- `capture.mjs` — Playwright seeks `renderFrame(t)` and pipes JPEGs to ffmpeg
- `mix-audio.mjs` — VO + ducked music + timed SFX → `final-mix.mp3`
- `render-episode.mjs` — mix → capture → mux helper

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
