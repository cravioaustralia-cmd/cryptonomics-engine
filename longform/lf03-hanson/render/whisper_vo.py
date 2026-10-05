"""Word timings for every voice take (read-only on the VO files) -> render/whisper-raw.json.
The cut uses audio/vo-even/ (even-pace takes). Set VO_DIR=vo to time the original takes."""
import json, os, re
VO_DIR = os.environ.get('VO_DIR', 'vo-even')
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
m = WhisperModel('small.en', device='cpu', compute_type='int8')
out = {}
for i in range(1, 38):
    k = f'S{i:02d}'
    txt = open(os.path.join(EP, 'audio', 'vo-text', k + '.txt')).read()
    txt = re.sub(r'\[[^\]]*\]|<[^>]*>', '', txt)  # delivery tags are not spoken
    nexp = len(txt.replace('-', ' ').split())
    path = os.path.join(EP, 'audio', VO_DIR, k + '.mp3')
    # prompted pass keeps numbers as spoken words; if it drops or invents words, fall back to an unprompted pass
    segs, info = m.transcribe(path, word_timestamps=True, initial_prompt=txt[:400], beam_size=5, vad_filter=False)
    words = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
    if not (0.85 * nexp <= len(words) <= 1.15 * nexp):
        segs, info = m.transcribe(path, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
        words = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
        print(k, 'unprompted fallback')
    out[k] = {'duration': info.duration, 'words': words}
    print(k, len(words), nexp, ' '.join(x['w'] for x in words)[:90])
json.dump(out, open(os.path.join(HERE, 'whisper-raw.json'), 'w'), indent=0)
