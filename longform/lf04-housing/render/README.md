# lf04 render pipeline

Python + ffmpeg. Builds the documentary at 1x, then delivers the whole film at 1.28x with pitch held.

| File | Job |
| --- | --- |
| `design.py` | Palette, fonts, overlay elements and every card builder (evidence tags, number cards, charts, board, locks). |
| `timing.py` | VO durations, speech intervals (silencedetect) and phrase anchors inside each VO file. |
| `cut.py` | The edit decision list: holds, segments, shots, cards, chapter furniture, music cues, SFX. |
| `media.py` | Photo loading/crops, sub-pixel Ken Burns, portrait insets, chart backgrounds, board thumbnails. |
| `render.py` | Renders each shot to an H.264 intermediate (ffmpeg backgrounds + piped RGBA overlays), then concats. |
| `mix.py` | 1x mix: VO at one fixed gain, ducked music beds that rise in holds, SFX in holds only. |
| `master.py` | 1.28x rubberband (pitch held), bus dynamics, two-pass loudnorm, two-pass HEVC encode, loudnorm report. |
| `deliver.py` | Chapter list + cue sheet, contact sheets, YouTube description draft with credits. |
| `fonts/` | Big Shoulders, Instrument Sans, IBM Plex Mono / Serif (SIL OFL, licence files alongside). |

Run from this folder:

```
python3 render.py shots --jobs 3
python3 render.py concat
python3 mix.py
python3 master.py            # audio, video, report
python3 deliver.py           # chapters, contact sheets, description
python3 render.py preview 37.8 230   # composite stills at 1x times for design QA
```

Intermediates go to `../build/` (git-ignored). Deliverables go to `../final/`.

Card wording follows `audio/vo-text/` exactly, and on-screen numbers are only the spoken numbers.
The VO files in `audio/vo/` are read, never modified.
