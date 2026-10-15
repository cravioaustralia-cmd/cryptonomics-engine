import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
def load(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-f','s16le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
model = WhisperModel(sys.argv[1], device='cpu', compute_type='int8', cpu_threads=4)
out = {}
prompt = sys.argv[3] if len(sys.argv)>3 else None
for p in sys.argv[4:] if len(sys.argv)>4 else []:
    pass
files = json.load(open(sys.argv[2]))
for key, p in files.items():
    segs, info = model.transcribe(load(p), language='en', word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    words = []
    for s in segs:
        for w in s.words:
            words.append({'w': w.word.strip(), 's': round(w.start,3), 'e': round(w.end,3), 'p': round(w.probability,3)})
    out[key] = words
    print(key, ' '.join(x['w'] for x in words), flush=True, file=sys.stderr)
json.dump(out, sys.stdout, indent=0)
