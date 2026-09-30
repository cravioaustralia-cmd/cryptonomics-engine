"""faster-whisper word timings on the held Atlas VO → transcript.json.
Words are then snapped to the script spelling (Australian English) — timing comes only from Whisper."""
import json, re, sys
from faster_whisper import WhisperModel
VO = 'audio/vo.mp3'
m = WhisperModel('medium.en', device='cpu', compute_type='int8')
segs, info = m.transcribe(VO, word_timestamps=True, language='en', beam_size=5, vad_filter=False,
    initial_prompt='In 1983, a 61-year-old potato farmer. Cliff Young. Sydney to Melbourne, 875 kilometres. gumboots. $10,000.')
words = []
for s in segs:
    for w in s.words:
        words.append({'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 3)})
json.dump({'duration': info.duration, 'raw': words}, open('render/whisper-raw.json', 'w'), indent=1)
print(len(words), 'words'); print(' '.join(w['word'] for w in words))
