#!/usr/bin/env python3
"""Narration edit: trim, pause shaping inside true silences, one uniform pitch-held tempo, level.
Writes cache/vo/Sxx.wav and data/timeline.json (film-time word timings + block layout)."""
import json, os, re, subprocess, numpy as np
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.join(EP, 'render')
SR = 48000
TEMPO = 0.92            # one steady tempo for every segment (atempo = WSOLA, pitch held)
SENT_GAP = 0.45         # sentence gap target (output seconds)
THR_DB = -55.0
asr = json.load(open(os.path.join(R, 'data', 'asr_raw_medium_en.json')))

# Explicit pause targets (total silence, output seconds) after a word: (segment, word-key, occurrence) -> seconds
P = {
 'S01': [('bomb', 1, 0.8)], 'S02': [('said', 1, 0.95), ('coincidence', 1, 0.55)],
 'S04': [('hanson', 1, 0.8)], 'S05': [('over', 1, 0.95)], 'S11': [('differently', 1, 0.9)],
 'S12': [('parliament', 1, 1.0)], 'S15': [('past', 1, 1.0)],
 'S18': [('poll', 1, 0.55), ('31', 1, 0.45)], 'S19': [('fringe', 1, 0.75), ('front', 1, 0.8)],
 'S20': [('timeline', 1, 0.5), ('dates', 1, 0.65)],
 'S24': [('speech', 1, 0.5), ('visas', 1, 0.42), ('visas', 2, 0.42)],
 'S27': [('after', 1, 0.9), ('proof', 1, 0.6)], 'S30': [('000', 3, 0.6), ('000', 4, 0.6)],
 'S32': [('watching', 1, 0.95)], 'S36': [('is', 3, 1.0)], 'S37': [('about', 1, 0.5), ('is', 1, 0.7)],
 'S40': [('hanson', 1, 0.8)], 'S42': [('all', 1, 0.6), ('full', 1, 0.7), ('no', 1, 0.6), ('is', 3, 0.6)],
 'S43': [('politics', 1, 0.8), ('fall', 1, 1.0), ('hanson', 2, 1.0), ('voters', 1, 1.0)],
 'S44': [('decide', 1, 0.9)],
}
TAIL = {'S05': 1.2, 'S12': 1.4, 'S19': 1.3, 'S39': 0.9, 'S43': 1.6, 'S44': 0.6}
DEFAULT_TAIL = 0.7
CHAPTERS = {'S06': ('CHAPTER 1', 'The numbers'), 'S12': ('CHAPTER 2', 'Hanson’s thirty-year argument'),
            'S16': ('CHAPTER 3', 'The rise'), 'S20': ('CHAPTER 4', 'The pattern'),
            'S28': ('CHAPTER 5', 'The case against “copying”'), 'S33': ('CHAPTER 6', 'Who pays?'),
            'S37': ('CHAPTER 7', 'The twist'), 'S41': ('CLOSING', 'Is Albanese copying Hanson?')}
MIDROLL_AFTER = {'S15', 'S27', 'S36'}
BUMPER = 2.0; MIDROLL = 0.5; OPEN_LEAD = 0.6; END_SCREEN = 15.0

def key(w): return re.sub(r"[^a-z0-9]", '', w.lower().split(',')[-1] if w.startswith(',') else w.lower())
def load(path):
    raw = subprocess.run(['ffmpeg','-v','error','-i',path,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def env_db(x, hop=480):
    n = len(x)//hop; fr = x[:n*hop].reshape(n, hop)
    return 20*np.log10(np.sqrt((fr**2).mean(1))+1e-9)

def process(seg):
    x = load(os.path.join(EP, 'audio', 'vo-raw', seg+'.mp3'))
    words = asr[seg]; db = env_db(x); hop = 480/SR
    loud = db > THR_DB
    targets = {}
    occ = {}
    for i, w in enumerate(words):
        k = key(w['w']); occ[k] = occ.get(k, 0)+1
        for (kk, n, sec) in P.get(seg, []):
            if kk == k and n == occ[k]: targets[i] = sec
        if i not in targets and re.search(r'[.?!]["”’]?$', w['w']) and i < len(words)-1: targets[i] = SENT_GAP
    # speech bounds
    idx = np.where(loud)[0]
    s0 = max(0, idx[0]*hop - 0.05); s1 = min(len(x)/SR, (idx[-1]+1)*hop + 0.15)
    edits = []  # (raw_time, delta_seconds_raw)  positive insert, negative remove
    gaps_report = []
    for i, T in sorted(targets.items()):
        a = words[i]['e'] - 0.1; b = max(words[i+1]['s'] + 0.08, min(words[i+1]['s'] + 0.35, words[i+1]['e'] - 0.1))
        fa, fb = int(max(a, 0)/hop), int(b/hop)
        best = (0, 0, 0)
        j = fa
        while j < fb:
            if not loud[j]:
                k2 = j
                while k2 < fb and not loud[k2]: k2 += 1
                if k2-j > best[0]: best = (k2-j, j, k2)
                j = k2
            else: j += 1
        L, j0, j1 = best
        G = L*hop
        if G < 0.08:
            # no true silence: insert only (never remove) at the quietest point between the words
            seg_db = db[fa:fb]
            if len(seg_db) == 0 or seg_db.min() > -38 or T*TEMPO - G <= 0.05:
                gaps_report.append((words[i]['w'], round(G,2), T, 'no-silence')); continue
            jm = fa + int(np.argmin(seg_db)); edits.append((jm*hop + hop/2, T*TEMPO - G))
            gaps_report.append((words[i]['w'], round(G,2), T, 'inserted-at-dip')); continue
        Traw = T*TEMPO
        delta = Traw - G
        if delta < 0: delta = max(delta, -(G-0.15))
        mid = (j0+j1)/2*hop
        edits.append((mid, delta)); gaps_report.append((words[i]['w'], round(G/TEMPO,2), T))
    # apply edits (raw time) in order
    pieces = []; cur = s0; tmap = []  # list of (raw_t, edited_t) anchors
    out_t = 0.0
    def sl(a, b): return x[int(a*SR):int(b*SR)]
    for (m, d) in sorted(edits):
        if d >= 0:
            p = sl(cur, m); pieces.append(p); out_t += len(p)/SR; tmap.append((m, out_t))
            pieces.append(np.zeros(int(d*SR), np.float32)); out_t += int(d*SR)/SR; tmap.append((m, out_t)); cur = m
        else:
            r = -d; p = sl(cur, m - r/2); pieces.append(p); out_t += len(p)/SR
            tmap.append((m - r/2, out_t)); cur = m + r/2; tmap.append((cur, out_t))
    p = sl(cur, s1); pieces.append(p); out_t += len(p)/SR
    y = np.concatenate(pieces)
    tmap = [(s0, 0.0)] + tmap + [(s1, out_t)]
    def map_t(rt):
        rt = min(max(rt, s0), s1)
        for (r0, o0), (r1, o1) in zip(tmap, tmap[1:]):
            if r0 <= rt <= r1:
                if r1 - r0 < 1e-9: return o1
                return o0 + (rt - r0)*(o1 - o0)/(r1 - r0)
        return tmap[-1][1]
    tmp = os.path.join(R, 'cache', 'vo', seg + '_edit.wav'); os.makedirs(os.path.dirname(tmp), exist_ok=True)
    y.astype(np.float32).tofile(tmp + '.f32')
    outp = os.path.join(R, 'cache', 'vo', seg + '.wav')
    # tempo then measure loudness then linear gain to -16 LUFS
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i',tmp+'.f32','-af',f'atempo={TEMPO}', '-c:a','pcm_f32le', tmp], check=True)
    meas = subprocess.run(['ffmpeg','-hide_banner','-i',tmp,'-af','ebur128=framelog=quiet','-f','null','-'],capture_output=True,text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', meas)[-1])
    subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af',f'volume={-16-I:.2f}dB','-c:a','pcm_f32le',outp], check=True)
    os.remove(tmp + '.f32'); os.remove(tmp)
    dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',outp]))
    ws = [{'w': w['w'], 's': round(map_t(w['s'])/TEMPO, 3), 'e': round(map_t(w['e'])/TEMPO, 3)} for w in words]
    return {'id': seg, 'dur': round(dur, 3), 'words': ws, 'gain_db': round(-16-I, 2), 'gaps': gaps_report}

def main():
    segs = [f'S{i:02d}' for i in range(1, 45)]
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(4) as ex: res = list(ex.map(process, segs))
    t = 0.0; blocks = []; out = []
    for r in res:
        sid = r['id']
        if sid in CHAPTERS:
            blocks.append({'type': 'bumper', 'id': 'CH_'+sid, 'start': round(t,3), 'end': round(t+BUMPER,3), 'label': CHAPTERS[sid][0], 'title': CHAPTERS[sid][1]}); t += BUMPER
        lead = OPEN_LEAD if sid == 'S01' else 0.0
        vstart = t + lead
        tail = TAIL.get(sid, DEFAULT_TAIL)
        end = vstart + r['dur'] + tail
        for w in r['words']: w['s'] = round(w['s'] + vstart, 3); w['e'] = round(w['e'] + vstart, 3)
        blocks.append({'type': 'seg', 'id': sid, 'start': round(t,3), 'vo_start': round(vstart,3), 'vo_end': round(vstart+r['dur'],3), 'end': round(end,3)})
        out.append({**r, 'vo_start': round(vstart,3)})
        t = end
        if sid in MIDROLL_AFTER:
            blocks.append({'type': 'midroll', 'id': 'MR_'+sid, 'start': round(t,3), 'end': round(t+MIDROLL,3)}); t += MIDROLL
    blocks.append({'type': 'endscreen', 'id': 'END', 'start': round(t,3), 'end': round(t+END_SCREEN,3)}); t += END_SCREEN
    json.dump({'tempo': TEMPO, 'duration': round(t,3), 'blocks': blocks, 'segments': {r['id']: r for r in out}}, open(os.path.join(R,'data','timeline.json'),'w'), indent=1)
    print('duration', round(t,2))
    for r in res: print(r['id'], r['dur'], r['gain_db'], [g for g in r['gaps'] if len(g)>3 or abs(g[1]-g[2])>0.3][:6])
if __name__ == '__main__': main()
