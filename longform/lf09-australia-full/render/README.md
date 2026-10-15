# lf09 render pipeline (HTML/SVG + Playwright + ffmpeg)

Same family as `shorts/shared/render`, adapted for 16:9 long-form with moving B-roll.
Every frame is a pure function of film time `t`, so frames can render in parallel.

## Steps (run from this folder)

| Step | Command | Output |
|---|---|---|
| 1. B-roll frames | `python3 prep_media.py` | `cache/clips/<ID>/%05d.jpg` (1080p, 30 fps, graded) |
| 2. Photos | `python3 prep_photos.py` | `cache/photos/*.jpg` (resized, slight warmth only) |
| 3. Narration edit | `python3 vo_process.py` | `cache/vo/Sxx.wav`, `data/timeline.json` |
| 4. SFX cue list | `node capture.mjs collect data/cues.json` | cues + counter windows |
| 5. SFX library | `python3 sfx_lib.py` | `cache/sfx/*.wav` |
| 6. Mix | `python3 mix.py && python3 master_audio.py` | `cache/mix/mix_1x.wav`, `mix_master.wav`, `narration_1x.wav` |
| 7. Picture | `node capture.mjs video out/video_1x.mp4 --workers 4` and `... out/video_master.mp4 --master` | silent picture |
| 8. Mux | see `deliver.sh` | `out/lf09_1x.mp4`, `out/lf09_master_1.28x.mp4` |
| 9. QC | `python3 qc_video.py out/*.mp4`, `python3 qc_audio.py`, `python3 qc_audio.py silence`, `python3 qc_text.py` | `data/qc_*.json` |

Review stills: `node capture.mjs stills <dir> t1,t2,...`

## Decisions recorded here

- **AI clips**: cropped to the top-left 1128×634 of the 1280×720 source before scaling, which removes the Grok
  watermark (bottom-right) from every frame. A "Dramatised reconstruction · AI-generated scene" label shows on
  each AI shot, including the first one in S01.
- **Passport clip**: soft-blurred so no crest or boarding-pass text is readable. Classroom whiteboard is blurred.
- **Narration**: one uniform tempo for all 44 segments (`atempo=0.92`, pitch held). Pauses are reshaped only
  inside true silences, so breaths before numbers and quotes are never cut. Script pause markers are set
  explicitly in `vo_process.py`.
- **800/DAY counter**: ticks every 108 s of *viewer* time. The 1.28× master is rendered natively with the counter
  on its own clock, so the "+1 every 1m 48s" label and the S42 payoff stay true in both versions.
- **Missing ParlView (FT01–FT05)**: free swaps (real free photo, date card, quote/paraphrase card, animation).
  No news, agency or press-club footage. David Farley uses the script's name card (the only free file is a
  low-resolution group photo).
- **Missing stock**: orchard, lectern, graduation caps, pub, motel are filled from held assets (regional map with
  icons, the AI empty hall's stage microphone, campus still and classroom clip).
