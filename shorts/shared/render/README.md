# Shared Shorts renderer (no Remotion)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**.

## Layout
- `frame.html` — 1080×1920 page; loads episode `scenes.js`
- `engine.js` — easing, captions (~70% (lower-middle)), still underlay helpers
- `capture.mjs` — Playwright seeks `renderFrame(t)` and pipes JPEGs to ffmpeg
- `mix-audio.mjs` — VO (static measured gain, padded) + music + timed SFX → amix → measured two-pass master `loudnorm` → `final-mix.mp3`. Never loudnorm the VO alone before amix (it cost s09 ~3 s of VO tail).
- `snapshot.mjs` — grab single frames for checks / contact sheets
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

Optional:
- `EPISODE.ready` is a promise that `frame.html` awaits before the first frame (for example to load WebGL assets).
- Extra episode scripts in `render/` are served at `/ep/<file>` (e.g. `/ep/map3d.js`).
- `renderFrame(t)` may return a promise. `capture.mjs` / `snapshot.mjs` await it before each screenshot (for example until a per-frame data-URL image has loaded).

## Usage
```bash
node shorts/shared/render/render-episode.mjs shorts/s01-skylab-esperance
```

## Captions
Captions must never overlap animations, badges, stamps, cards, or other on-screen text. Default lower-middle (~70% from top); nudge per beat when a graphic occupies that band.
