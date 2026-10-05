"""faster-whisper word timings on the held Atlas VO (audio/vo.mp3, never modified) -> render/whisper-raw.json.
Run from the episode folder. Spelling is snapped to script.md afterwards by snap_transcript.py."""
import json
from faster_whisper import WhisperModel
VO = 'audio/vo.mp3'
m = WhisperModel('medium.en', device='cpu', compute_type='int8')
segs, info = m.transcribe(VO, word_timestamps=True, language='en', beam_size=5, vad_filter=False,
    initial_prompt="Australia's greatest racehorse. 1926. Timaru, New Zealand. Phar Lap. Thai. Thirty-seven races out of fifty-one. "
                   "1930 Melbourne Cup. 1932. Mexico. California. Arsenic. Melbourne, Wellington, Canberra. Impossible Journeys.")
words = []
for s in segs:
    for w in s.words:
        words.append({'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 3)})
json.dump({'duration': info.duration, 'raw': words}, open('render/whisper-raw.json', 'w'), indent=1)
print(len(words), 'words'); print(' '.join(w['word'] for w in words))
