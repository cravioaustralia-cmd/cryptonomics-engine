"""Write CUE_SHEET.md from the exact cue list mix.py used (build/cuesheet.json) + the locked timeline."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
CUES = json.load(open(os.path.join(EP, 'build', 'cuesheet.json')))
LN = json.load(open(os.path.join(EP, 'build', 'loudnorm.json')))


def mmss(x):
    return f'{int(x // 60)}:{x % 60:05.2f}'


out = ['# Cue sheet — lf01 IF AUSTRALIA… Episode 1', '',
       'Generated from the cue list that `render/mix.py` actually used, so this sheet and the mix match.',
       'Times are the final cut (Whisper-locked). Sparse by design: grim beats run nearly dry; no Shorts whoosh/pop chatter.', '',
       '## Music beds (free licence, see SOURCES.md)', '',
       '| In | Out | Cue | Picture / script beat | Source, fades |', '|---|---|---|---|---|']
for kind, t0, t1, src, label, beat in sorted([c for c in CUES if c[0] == 'music'], key=lambda c: c[1]):
    out.append(f'| {mmss(t0)} | {mmss(t1)} | {label} | {beat} | {src} |')
WS = json.load(open(os.path.join(EP, 'build', 'word_safety.json')))
out += ['', 'One cue per emotional section, with a short stop at section changes: darker, heavier beds (Dark Drama, Between Two Evils) for war and invasion; a sad, low bed (Echoes) and the scripted strings for loss; Fallen (Asper) for plans and argument; Curiosity for geography; Vastness for relief; The Journey for the warm Act 5.', '',
        'While Atlas speaks the bed sits about 23 LU under the narration, with a 1.5–4 kHz presence dip of about 7 dB. In pauses, the cold open and atmosphere beats it rises to about 11 LU under the narration: heard, never full. Speech detection runs 150 ms ahead, so beds are already down before a word starts.',
        f"Word safety (speech band 200 Hz–5 kHz, every 20 ms frame where the voice sounds, {WS['voiced_frames']} frames): the voice is above music + SFX + ambience by **at least {WS['min_db']:.1f} dB**, median {WS['median_db']:.1f} dB. A sidechain on the beds (never on the voice) enforces the 12 dB floor.", '',
        '## Sound effects (synthesised in-house by `render/make_sfx.py`)', '',
        'Effects sit in the pauses; anything that overlaps narration is ducked about 16 dB and kept under the 12 dB floor above.', '',
        '| At | Ends | Cue | Script beat | File (level vs VO peak) |', '|---|---|---|---|---|']
for kind, t0, t1, src, label, beat in sorted([c for c in CUES if c[0] == 'sfx'], key=lambda c: c[1]):
    out.append(f'| {mmss(t0)} | {mmss(t1)} | {label} | {beat} | {src} |')
out += ['', '## Picture-sync accents on hard words', '',
        'A pause before a hard word gets a short rise (0.85 s, stops dead) and a tight low hit right on the word, instead of a long sting. Hits sit mostly below the speech band and stay under the 12 dB voice floor. Labels landing get a soft click, number changes get typewriter ticks (a short run for climbing or falling counters), and lines drawing on the map get a quiet pencil scratch; these are listed in the effects table above.', '',
        '| At | Ends | Cue | Script beat | File (level vs VO peak) |', '|---|---|---|---|---|']
for kind, t0, t1, src, label, beat in sorted([c for c in CUES if c[0] == 'sync'], key=lambda c: c[1]):
    out.append(f'| {mmss(t0)} | {mmss(t1)} | {label} | {beat} | {src} |')
out += ['', '## Shot environment (B-roll)', '',
        'Every B-roll clip is muted: the clips\' own generated audio is never mapped into the film (`compose.py` takes audio only from the master). Environment comes from in-house synthesised beds and one Mixkit file already in this repo. Ducked about 12 dB under narration. B01 (the drone carries it) and B09 (script: strings only) get none.', '',
        '| At | Ends | Environment | Shot | File (level vs VO peak) |', '|---|---|---|---|---|']
for kind, t0, t1, src, label, beat in sorted([c for c in CUES if c[0] == 'amb'], key=lambda c: c[1]):
    out.append(f'| {mmss(t0)} | {mmss(t1)} | {label} | {beat} | {src} |')
m = TL['marks']
out += ['', '## Structure markers', '',
        '| Marker | Time |', '|---|---|',
        f"| Mid-roll 1 (hold on the map, no ad read) | {mmss(m['midroll1'])} |",
        f"| Mid-roll 2 (hold on the map, no ad read) | {mmss(m['midroll2'])} |",
        f"| Big \"1\" / \"2\" / \"3\" | {mmss(m['slam1'])} / {mmss(m['slam2'])} / {mmss(m['slam3'])} |",
        f"| End screen (10 s) | {mmss(m['endScreen'])} – {mmss(TL['duration'])} |", '',
        '## B-roll zoom-throughs', '',
        '| Clip | In | Out | Length (Part 2) | Pin |', '|---|---|---|---|---|']
for b in TL['broll']:
    out.append(f"| {b['id']} | {mmss(b['tIn'])} | {mmss(b['tOut'])} | {b['dur']} s | {b['note']} |")
v = LN['verify_master']
out += ['', '## Master', '',
        f"- Voice as recorded, assembled: {LN['vo_lufs_untouched']:.1f} LUFS integrated (no voice loudnorm, no compression).",
        f"- Master chain: `{LN['master_chain']}`.",
        f"- Two-pass loudnorm on the master only, pass 2 normalisation type: **{LN['pass2']['normalization_type']}**.",
        f"- Result: **{v['input_i']} LUFS integrated, {v['input_tp']} dBTP true peak**, LRA {v['input_lra']} LU (target −14 LUFS, ≤ −1.5 dBTP).",
        '', '## Series sting ("IF AUSTRALIA…")', '',
        'Invented for this series in episode 1 and reused unchanged in every episode (`audio/sfx/series_sting.flac`).',
        'Regenerate the identical file with `python3 render/make_sfx.py series_sting` (seeded).',
        'Construction: one low taiko-style hit (pitch drop ~100 → 42 Hz), a rising open-fifth brass-like swell on D',
        '(D2–A2–D3–A3 sawtooth stack, low-pass opening 300 Hz → 2.9 kHz over 1.4 s), and a soft high shimmer',
        '(D5–A5–D6 sines) that rings out through a 2.8 s synthetic hall. About 4.5 s with tail; it lands under the',
        'title build in the 2.5 s gap after V04. It is not the Impossible Journeys sting.', '']
open(os.path.join(EP, 'CUE_SHEET.md'), 'w').write('\n'.join(out))
print('CUE_SHEET.md', len(CUES), 'cues')
