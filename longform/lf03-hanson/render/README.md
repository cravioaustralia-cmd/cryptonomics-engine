# lf03 render pipeline

Long-form 16:9, 1920×1080, 30 fps. Python, OpenCV, Pillow and ffmpeg. No Remotion, no browser, no map.

## Steps

```bash
cd longform/lf03-hanson/render
pip install faster-whisper numpy scipy pillow pyloudnorm opencv-python-headless
python3 whisper_vo.py          # word times for every take -> whisper-raw.json (voice files are read only)
python3 build_timeline.py      # the 1x cut: 37 takes with designed gaps -> timeline.json
python3 scenes.py              # sanity check of the plan: shots, cards, chapters, mid-rolls
python3 mix.py                 # 1x mix: voice + bleep + music beds + effects -> ../build/mix.wav
python3 speed_master.py        # 1.28x, pitch held, two-pass loudnorm on that file only -> ../build/master_speed.wav
NF=$(python3 render.py nf); Q=$(( (NF + 3) / 4 ))
for i in 0 1 2 3; do python3 render.py frames $((i*Q)) $(((i+1)*Q)) ../build/parts/p$i.mp4 & done; wait
python3 finalize.py            # final/lf03-hanson.mp4, contact sheet, chapters, loudnorm report, ../CUE_SHEET.md
python3 render.py stills ../build/stills 101.5 513.5   # PNG stills at any 1x time, for review
```

`whisper-raw.json` is committed. S09, S20, S34, S35 and S36 were transcribed a second time without the script prompt, because the prompted pass dropped words.

## Files

- `scenes.py` holds the whole edit. Every shot, card, pin, label, music cue and effect is keyed to a spoken word, for example `A('S10', 'hansard')`. Card text follows the voice files.
- `gfx.py` draws the cards, data, timeline strip, Abbott pin, chapter tags and the "Dramatised reconstruction" label.
- `render.py` draws frames. Output frame `f` shows 1× time `f × 1.28 / 30`, so the picture is the 1× cut played at 1.28×. B-roll plays at 0.78× on the 1× clock, which is close to real speed on the master.
- `mix.py` places the voice untouched, bleeps one word in S22, and builds the beds from `scenes.MUSIC` and the effects from `scenes.SFX`.
- `speed_master.py` and `finalize.py` follow the lf01 master chain.

## Guards in the code

- `scenes.py` refuses B06 and refuses any B-roll shot that would run past the clip's end or, for B04, into the pinned page.
- `scenes.py` checks that the Abbott pin starts inside S14 and ends with S29.
- `mix.py` checks that the gavel is used exactly once.
- `gfx.bars` only prints a bar's final figure, so no in-between number appears while a bar grows.
