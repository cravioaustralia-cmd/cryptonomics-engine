# Shared Shorts renderer (no Remotion)

Stack: **SVG + `renderFrame(t)` + Playwright + ffmpeg**.

## Layout
- `frame.html` — 1080×1920 page; loads episode `scenes.js`
- `engine.js` — easing, captions (~70% (lower-middle)), still underlay helpers
- `capture.mjs` — Playwright seeks `renderFrame(t)` and pipes JPEGs to ffmpeg
- `mix-audio.mjs` — VO + ducked music + timed SFX → `final-mix.mp3`
- `render-episode.mjs` — mix → capture → mux helper
- `contact-sheet.mjs` — renders review frames (timestamp burned in) and tiles them into `out/contact-sheet.jpg`
- `../fonts/` — vendored OFL fonts, served to the frame page at `/fonts/*`

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

Optional: `EPISODE.ready` (a Promise) — capture waits for it (and `document.fonts.ready`) before
the first frame, so episodes can preload stills and fonts.

## Usage
```bash
cd shorts/shared/render && npm install        # once
node shorts/shared/render/contact-sheet.mjs shorts/s07-wider-than-the-moon --every 2.5   # review first
node shorts/shared/render/contact-sheet.mjs shorts/s07-wider-than-the-moon --at 3.9,10.3,38.0
node shorts/shared/render/render-episode.mjs shorts/s01-skylab-esperance
```

If Playwright's pinned browser is not installed but a Chromium is, point at it with
`CHROMIUM_PATH=/path/to/chrome` instead of running `playwright install`.

## Audio mix (`render/config.json`)
- `sfxDir` is absolute or relative to the episode folder; each cue is `{ file, at, vol, from?, dur? }`
  (`from` = in-point inside the file, `dur` = trim length with a short fade).
- Without a `mix` block the legacy mix is used (per-VO loudnorm, flat music at 0.11, written to `audio/`).
- With `mix: { musicVol, musicStart, fadeIn, fadeOut, duck: { threshold, ratio, attack, release }, lufs, tp, outDir }`:
  VO clean-up (HPF, de-mud, light compression) → music sidechain-ducked by the VO → SFX → master measured,
  gained to `lufs` and peak-limited under `tp`. Music comes from `music/music.mp3` (fallback `audio/music.mp3`).
  The VO file itself is only read, never rewritten.

## Captions
Captions must never overlap animations, badges, stamps, cards, or other on-screen text. Default lower-middle (~70% from top); nudge per beat when a graphic occupies that band.
