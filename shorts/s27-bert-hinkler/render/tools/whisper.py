#!/usr/bin/env python3
"""faster-whisper medium.en word timestamps on audio/vo.mp3 -> render/whisper.raw.json"""
import json, os
from faster_whisper import WhisperModel
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
m = WhisperModel('medium.en', device='cpu', compute_type='int8')
prompt = ('One man. One tiny open plane. Bert Hinkler. Bundaberg. Hustling Hinkler. '
          'Mussolini. Florence. Darwin. Burma. Singapore. Indonesia. 18,000 kilometres.')
segs, info = m.transcribe(os.path.join(EP, 'audio', 'vo.mp3'), language='en', word_timestamps=True,
                          initial_prompt=prompt, vad_filter=False, beam_size=5)
words, text = [], []
for s in segs:
    text.append(s.text)
    for w in s.words:
        words.append(dict(word=w.word.strip(), start=round(w.start, 3), end=round(w.end, 3)))
json.dump(dict(duration=round(info.duration, 3), text=''.join(text).strip(), words=words),
          open(os.path.join(EP, 'render', 'whisper.raw.json'), 'w'), indent=1)
print(''.join(text))
