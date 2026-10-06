# lf05 render pipeline

Python + ffmpeg, adapted from the lf04 pipeline (`longform/lf04-housing/render/` on `scaffold/lf04-housing`).
Builds the documentary at 1x, then delivers the whole film at 1.28x with pitch held.

| File | Job |
| --- | --- |
| `design.py` | Palette (gold = Albanese, orange-red = Hanson), fonts, evidence labels (FACT / CLAIM / ANALYSIS / SPECULATION) and every card: poll Polaroids, 150-seat chamber, rate staircase, approval dial, 75% lock, PM ladder, QUASHED stamp, state tiles, comparison columns, evidence board. |
| `timing.py` | VO durations, speech intervals (silencedetect) and phrase anchors inside each VO file. |
| `cut.py` | The edit decision list: chapter holds H0–H9, mid-rolls after S13 / S25 / S33, segments S01–S41, shots, cards, music cues, SFX. |
| `media.py` | Photo loading/crops, sub-pixel Ken Burns, framed portrait insets, the Albanese + Hanson duo, Polaroid photos, chart backgrounds. |
| `render.py` | Renders each shot to an H.264 intermediate (ffmpeg backgrounds + piped RGBA overlays), then concats. |
| `mix.py` | 1x mix: VO at one fixed gain, music levelled to a quiet bed under the voice (about 27.5 dB below holds) and a louder bed in holds, SFX in holds only. |
| `musicdip.py` | Measures the music bus under the voice vs in holds from the 1x stems. |
| `master.py` | 1.28x rubberband (pitch held), bus dynamics, two-pass loudnorm, two-pass HEVC encode, loudnorm report. |
| `deliver.py` | Chapter list + cue sheet, contact sheets, YouTube description draft with credits for media in the cut. |
| `gfx.py` | lf03 helper (kept from the asset pass; not used by this pipeline). |
| `fonts/` | Big Shoulders, Instrument Sans, IBM Plex Mono / Serif (SIL OFL, licence files alongside), copied from lf04. The lf03 fonts are kept for `gfx.py`. |

Run from this folder:

```
python3 render.py shots --jobs 4
python3 render.py concat
STEMS=1 python3 mix.py
python3 musicdip.py
python3 master.py            # audio, video, report
python3 deliver.py           # chapters, contact sheets, description
python3 render.py preview 37.8 230   # composite stills at 1x times for design QA
```

Intermediates go to `../build/` (git-ignored). Deliverables go to `../final/`.

Card wording follows `audio/vo-text/` exactly, and on-screen numbers are only the spoken numbers. The VO files in
`audio/vo/` are read, never modified.
