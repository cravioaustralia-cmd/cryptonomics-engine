"""Whisper every VO take (faster-whisper, word timestamps) -> render/whisper-raw.json.
Takes are read only; nothing in audio/vo/ is modified."""
import json, os, subprocess
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(HERE, '..', 'audio', 'vo')
model = WhisperModel(os.environ.get('WMODEL', 'medium.en'), device='cpu', compute_type='int8')
out = {}
for i in range(1, 35):
    k = f'V{i:02d}'
    f = os.path.join(VO, k + '.mp3')
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
    segs, _ = model.transcribe(f, word_timestamps=True, language='en', beam_size=5, vad_filter=False)
    words = [{'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3)} for s in segs for w in s.words]
    out[k] = {'duration': round(dur, 3), 'words': words}
    print(k, round(dur, 2), ' '.join(w['word'] for w in words), flush=True)
json.dump(out, open(os.path.join(HERE, 'whisper-raw.json'), 'w'), indent=1)
