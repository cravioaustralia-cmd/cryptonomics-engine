#!/usr/bin/env python3
"""Audio QC: ASR of the final narration vs Part 6 text (per segment), silence scan, loudness."""
import json, os, re, subprocess, sys, difflib, numpy as np
R = os.path.dirname(os.path.abspath(__file__)); EP = os.path.dirname(R)
TL = json.load(open(os.path.join(R, 'data', 'timeline.json')))
NUM = {'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90}
def words_to_num(tokens):
    # convert spoken number word runs to digits (handles hundred/thousand/million, 'twenty twenty-six' years)
    out = []; i = 0
    while i < len(tokens):
        t = tokens[i]
        if t in NUM or t in ('hundred', 'thousand', 'million') and out and out[-1].isdigit():
            run = []
            while i < len(tokens) and (tokens[i] in NUM or tokens[i] in ('hundred', 'thousand', 'million', 'and') ):
                if tokens[i] == 'and' and not (i + 1 < len(tokens) and tokens[i + 1] in NUM): break
                run.append(tokens[i]); i += 1
            # years like twenty twenty six / nineteen ninety six
            if len(run) >= 2 and run[0] in ('twenty', 'nineteen') and 'hundred' not in run and 'thousand' not in run:
                first = NUM[run[0]]; rest = sum(NUM[x] for x in run[1:] if x in NUM); out.append(str(first * 100 + rest)); continue
            total = 0; cur = 0
            for x in run:
                if x == 'and': continue
                if x == 'hundred': cur *= 100
                elif x == 'thousand': total += cur * 1000; cur = 0
                elif x == 'million': total += cur * 1000000; cur = 0
                else: cur += NUM[x]
            out.append(str(total + cur)); continue
        out.append(t); i += 1
    return out
def norm_text(s):
    s = s.lower().replace('’', "'").replace('-', ' ').replace('%', ' percent')
    s = re.sub(r'(\d),(\d)', r'\1\2', s)
    toks = re.findall(r"[a-z0-9']+", s)
    toks = [t.replace("'", '') for t in toks]
    toks = words_to_num(toks)
    rep = {'labour': 'labor', 'newspoll': 'news poll', 'm1': 'm 1', 'demosau': 'demos a u', 'specsavers': 'spec savers', 'kilometer': 'kilometre', 'defense': 'defence', 'modeling': 'modelling', 'criticized': 'criticised', 'outmaneuvering': 'out manoeuvring', 'counterpattern': 'counter pattern', 'byelection': 'by election', 'abc': 'a b c', 'redbridge': 'red bridge', '20s': 'twenties'}
    out = []
    for t in toks: out += rep.get(t, t).split()
    return out
def script_text(sid):
    t = open(os.path.join(EP, 'vo-paste', f'{sid}_ATLAS.txt')).read().split('Speak only the narration below:')[1]
    return re.sub(r'\[[^\]]*\]|<[^>]*>', ' ', t)
def main():
    stem = os.path.join(R, 'cache', 'mix', 'narration_1x.wav'); tmpd = os.path.join(R, 'cache', 'qc'); os.makedirs(tmpd, exist_ok=True)
    files = {}
    for sid, s in TL['segments'].items():
        b = next(x for x in TL['blocks'] if x['id'] == sid)
        p = os.path.join(tmpd, sid + '.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(b['vo_start'] - 0.05), '-to', str(b['vo_end'] + 0.05), '-i', stem, '-ac', '1', '-ar', '16000', p], check=True); files[sid] = p
    json.dump(files, open(os.path.join(tmpd, 'files.json'), 'w'))
    if not os.path.exists(os.path.join(tmpd, 'asr.json')):
        subprocess.run([sys.executable, os.path.join(R, 'asr.py'), 'medium.en', os.path.join(tmpd, 'files.json')], stdout=open(os.path.join(tmpd, 'asr.json'), 'w'), stderr=subprocess.DEVNULL, check=True)
    asr = json.load(open(os.path.join(tmpd, 'asr.json')))
    rep = {}; tot_err = 0; tot = 0
    for sid in TL['segments']:
        ref = norm_text(script_text(sid)); hyp = norm_text(' '.join(w['w'] for w in asr[sid]))
        sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False); diffs = []
        for op, a0, a1, b0, b1 in sm.get_opcodes():
            if op != 'equal': diffs.append((op, ' '.join(ref[a0:a1]), ' '.join(hyp[b0:b1])))
        err = sum(max(a1 - a0, b1 - b0) for op, a0, a1, b0, b1 in sm.get_opcodes() if op != 'equal')
        tot_err += err; tot += len(ref); rep[sid] = {'ref_words': len(ref), 'mismatch': diffs}
    json.dump(rep, open(os.path.join(R, 'data', 'qc_asr.json'), 'w'), indent=1)
    print('WER-ish', round(tot_err / tot * 100, 2), '%', tot, 'words')
    for sid, r in rep.items():
        if r['mismatch']: print(sid, r['mismatch'])
if __name__ == '__main__' and len(sys.argv) == 1: main()

def silence_report():
    M = os.path.join(R, 'cache', 'mix')
    res = {}
    # 1) digital silence check on the delivered narration stem (with room tone): threshold -70 dBFS, 0.2 s
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', os.path.join(M, 'narration_1x.wav'), '-af', 'silencedetect=n=-70dB:d=0.2', '-f', 'null', '-'], capture_output=True, text=True).stderr
    res['digital_silence_runs'] = len(re.findall(r'silence_start', e))
    # 2) narration gaps (speech only) at -45 dB, >= 0.9 s, classified against the timeline
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', os.path.join(M, '_narr_raw.wav'), '-af', 'silencedetect=n=-45dB:d=0.9', '-f', 'null', '-'], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', e)]; ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', e)]
    gaps = []
    for a, b in zip(starts, ends):
        inside = [x['id'] for x in TL['blocks'] if x['type'] == 'seg' and x['vo_start'] + 0.05 < a and b < x['vo_end'] - 0.05]
        kind = 'inside ' + inside[0] if inside else 'between segments / bumper / mid-roll / end'
        gaps.append({'start': round(a, 2), 'end': round(b, 2), 'dur': round(b - a, 2), 'where': kind})
    res['gaps_ge_0.9s'] = gaps
    res['inside_segment_gaps'] = [g for g in gaps if g['where'].startswith('inside')]
    json.dump(res, open(os.path.join(R, 'data', 'qc_silence.json'), 'w'), indent=1)
    print('digital silence runs:', res['digital_silence_runs'], '| gaps>=0.9s:', len(gaps), '| inside segments:', res['inside_segment_gaps'])
if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'silence': silence_report()
