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
cd shorts/shared/render && npm i
node contact-sheet.mjs ../../s02-man-who-named-australia contact_claude [t1 t2 …]   # PNGs + sheet.jpg
node render-episode.mjs ../../s02-man-who-named-australia [--reuse-mix] [--workers 4]
```
- `--reuse-mix` keeps the held `audio/final-mix.mp3` instead of re-mixing.
- `--workers N` renders frame ranges in parallel pages, then concatenates losslessly.
- `CHROMIUM_PATH=/path/to/chrome` uses a pre-installed Chromium instead of Playwright's download.

## Optional episode fields
- `images` — preloaded before frame 0.
- `transition: 'crossfade'` (+ `xfade` seconds) — true crossfade; default is the original dip.
- `captionStyle: { font, highlight, box, stroke }` — `highlight` tints the spoken word.
- `captionY(t)` — nudge the caption centre per beat.
- `overlay(t, HS)` — finishing layer drawn above scenes, below captions (defs, vignette, grain).

## Fonts
`shorts/shared/fonts/` (OFL, served at `/fonts/`): Bebas Neue, Cormorant Garamond, Cinzel, Montserrat, IBM Plex Mono.

## Captions
Captions must never overlap animations, badges, stamps, cards, or other on-screen text. Default lower-middle (~70% from top); nudge per beat when a graphic occupies that band.
