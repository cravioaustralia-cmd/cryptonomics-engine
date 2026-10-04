# Sources — lf02 IF AUSTRALIA… Episode 2

What If Australia Had WON at Gallipoli? Long-form documentary, 16:9.

## Narration

- Voice takes are **not seated yet**. Paste-ready Atlas chunks live in `audio/vo-text/V01.txt` … `V36.txt` (including `V16b.txt`). Recorded files will go in `audio/vo/` when ready.

## Music (free licence)

All eight beds are Mixkit tracks under the **Mixkit Stock Music Free Licence**. They were **copied byte-identical** from `longform/lf01-if-australia/audio/music/` at approved commit `b3973eb` (branch `claude/model-opus-bdipl6`). Every one was already licensed and documented in this repo for an earlier Short, then reused in lf01; nothing new was downloaded, and no copyrighted score is used. Same licences as lf01.

| File | Track — artist | Page | Asset | Repo origin | Used for (lf01 cue; re-cue for lf02 at mix) |
|---|---|---|---|---|---|
| `audio/music/silent-descent-614.mp3` | Silent Descent — Eugenio Mininni | https://mixkit.co/free-stock-music/silent-descent/ | https://assets.mixkit.co/music/614/614.mp3 | s18 → lf01 → lf02 | Cold open / tension (re-cue) |
| `audio/music/dark-drama-605.mp3` | Dark Drama — Eugenio Mininni (see note) | https://mixkit.co/free-stock-music/dark-drama/ | https://assets.mixkit.co/music/605/605.mp3 | s24 → lf01 → lf02 | War / campaign (re-cue) |
| `audio/music/between-two-evils-1020.mp3` | Between Two Evils — Michael Ramir C. | https://mixkit.co/free-stock-music/between-two-evils/ | https://assets.mixkit.co/music/1020/1020.mp3 | s23 → lf01 → lf02 | War beats (re-cue) |
| `audio/music/echoes-188.mp3` | Echoes — Andrew Ev | https://mixkit.co/free-stock-music/echoes/ | https://assets.mixkit.co/music/188/188.mp3 | s21 → lf01 → lf02 | Loss (re-cue) |
| `audio/music/fallen-asper-565.mp3` | Fallen (Asper) — Eugenio Mininni | https://mixkit.co/free-stock-music/fallen-asper/ | https://assets.mixkit.co/music/565/565.mp3 | s22 → lf01 → lf02 | Plans and argument (re-cue) |
| `audio/music/curiosity-480.mp3` | Curiosity — Diego Nava | https://mixkit.co/free-stock-music/curiosity/ | https://assets.mixkit.co/music/480/480.mp3 | s19 → lf01 → lf02 | Geography / map (re-cue) |
| `audio/music/vastness-184.mp3` | Vastness — Andrew Ev | https://mixkit.co/free-stock-music/vastness/ | https://assets.mixkit.co/music/184/184.mp3 | s20 → lf01 → lf02 | Relief / resolve (re-cue) |
| `audio/music/the-journey-79.mp3` | The Journey — Ahjay Stelino | https://mixkit.co/free-stock-music/the-journey/ | https://assets.mixkit.co/music/79/79.mp3 | s17 → lf01 → lf02 | Warm act / outro (re-cue) |

**Note on asset 605:** the same file (identical bytes, same asset URL) is titled "Dark Drama" in `shorts/s24-burke-wills` and "Delirium" in `shorts/s15-irukandji`. Mixkit could not be reached from the lf01 session to settle the title. The licence and asset URL are the same either way. Confirm the title before publishing credits.

The Shorts Skyline bed and the Impossible Journeys sting are not used.

## Sound effects and shot environment

Copied byte-identical from `longform/lf01-if-australia/audio/sfx/` at `b3973eb`. Same licences and authorship as lf01:

- **Spot effects:** synthesised in-house for lf01 by `render/make_sfx.py` (numpy, seeded per cue; no third-party samples). They are drone, boom, stamp thud, three drum hits, whoosh, low note, air-raid siren, distant explosions, desert wind gust, sonar ping, snapping cable, low wind, pin thunk, strings pad, cliffhanger sting, and the **IF AUSTRALIA… series sting** (`series_sting.flac`).
- **Environment beds:** synthesised in-house by the same script (rain, sea, distant war rumble, fire crackle, underwater rumble, low engine). Original works; no third-party source.
- **Picture-sync accents:** synthesised in-house by the same script (`tick`, `click`, `pen_draw`, `riser_short`, `word_hit`). Short original sounds; no third-party source and no copyrighted effects.
- Files are lossless 24-bit FLAC in `audio/sfx/`.
- No commercial sound effects and no audio from any YouTube video are used.
- The lf01 jungle-birds Mixkit file is **not** copied into this episode (Gallipoli has no jungle beat).

## B-roll

**Not seated yet.** Dramatised AI reconstruction clips will go in `broll/` later. No Imagine clips are present in this scaffold.

## Real historical images

**Not seated yet.** Real photos (AWM, IWM, Commons, Trove, etc.) will go in `images/` later, with per-item licence checks. No archive stills are claimed or committed here. Do not invent faces for named people (Churchill, Mustafa Kemal / Atatürk); real photos only when seated.

## Map / fonts / render pipeline

Not built in this scaffold. Claude builds the picture later. No `render/` or `final/` tree is committed for lf02 yet.
