# Shared Shorts renderer (no Remotion)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**.

## Layout
- `frame.html` — 1080×1920 page; loads episode `scenes.js`
- `engine.js` — easing, captions (~70% (lower-middle)), still underlay helpers
- `capture.mjs` — Playwright seeks `renderFrame(t)` and pipes JPEGs to ffmpeg
- `mix-audio.mjs` — VO + ducked music + timed SFX → `final-mix.mp3`
- `render-episode.mjs` — mix → capture → mux helper
- `contact-sheet.mjs` — tile `renderFrame(t)` stills for review (`--every 2.5`, `--at 0,5.2`, `--full`, `--out`)
- `fonts/` — bundled Bebas Neue / Oswald (OFL) and Special Elite (Apache 2.0), served at `/fonts/` and preloaded by `frame.html`

## Mix (`render/config.json` → `mix`)
`musicVol`, `musicStart`, `duck` (sidechain under VO), `lufs` (measured two-pass static gain + −1.5 dBTP limiter), `fadeOut`.
SFX cues take `{ file, at, vol, dur? }`; `sfxDir` resolves relative to the episode folder.
The VO is levelled in its own pass — in-graph `loudnorm` + `amix` drops the last ~3 s.

## Browser
If the npm Playwright build's Chromium isn't installed, point at a local one:
`CHROMIUM_PATH=/opt/pw-browsers/chromium node shorts/shared/render/render-episode.mjs …`
Episodes may set `EPISODE.ready` (a promise, e.g. decoded image preloads); `frame.html` awaits it.

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
