"""Word timings for every voice take (read-only on the VO files) -> render/whisper-raw.json."""
import json, os, re
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.abspath(os.path.join(HERE, '..'))
m = WhisperModel('small.en', device='cpu', compute_type='int8')
out = {}
for i in range(1, 38):
    k = f'S{i:02d}'
    txt = open(os.path.join(EP, 'audio', 'vo-text', k + '.txt')).read()
    txt = re.sub(r'\[[^\]]*\]|<[^>]*>', '', txt)  # delivery tags are not spoken
    segs, info = m.transcribe(os.path.join(EP, 'audio', 'vo', k + '.mp3'), word_timestamps=True, initial_prompt=txt[:400], beam_size=5, vad_filter=False)
    words = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
    out[k] = {'duration': info.duration, 'words': words}
    print(k, len(words), ' '.join(x['w'] for x in words)[:110])
json.dump(out, open(os.path.join(HERE, 'whisper-raw.json'), 'w'), indent=0)
