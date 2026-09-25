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

## Contact sheet (required before every final render)
```bash
node shorts/shared/render/contact-sheet.mjs shorts/sNN-slug [out.jpg] [--every 2.5 | --times 0,1.5,9] [--cols 6]
```

## Fonts
`shorts/shared/fonts/` (OFL) is served at `/fonts/*`. Load with `@font-face` from `scenes.js` and expose
`window.EPISODE.ready` (a promise) so `frame.html` waits for fonts/images before frame 0.

## Ducked mix (opt-in)
In `render/config.json`:
```json
"mix": { "duck": true, "musicVol": 0.2, "musicStart": 0, "lufs": -14, "fadeOut": 1.2 }
```
Sidechain-ducks the music under the VO, supports per-cue `"dur"` trims on SFX, and runs two-pass loudnorm.
Without `mix.duck` the original mixer path is used unchanged.

## Captions
Captions must never overlap animations, badges, stamps, cards, or other on-screen text. Default lower-middle (~70% from top); nudge per beat when a graphic occupies that band.
