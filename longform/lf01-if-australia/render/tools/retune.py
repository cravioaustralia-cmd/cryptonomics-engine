#!/usr/bin/env python3
"""Whisper every VO chunk → transcripts/Vxx.json (word timings, seconds from file start).

faster-whisper, English, word timestamps. The chunk's own Part 3 text (audio/vo-text/Vxx.txt)
is passed as the initial prompt so names are spelled as the script spells them; the words
and their times still come from the audio. Delivery tags ([pause], <slow>…) are stripped
from the prompt. Nothing is written back to the VO.

Usage: python3 retune.py <episode_dir> [model]   (default model: small.en)
"""
import json, os, re, sys
from faster_whisper import WhisperModel

EP = sys.argv[1]
MODEL = sys.argv[2] if len(sys.argv) > 2 else 'small.en'
out_dir = os.path.join(EP, 'transcripts')
os.makedirs(out_dir, exist_ok=True)
model = WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=int(os.environ.get('THREADS', '3')))
for i in range(1, 35):
    vid = f'V{i:02d}'
    out = os.path.join(out_dir, f'{vid}.json')
    if os.path.exists(out):
        continue
    txt_p = os.path.join(EP, 'audio', 'vo-text', f'{vid}.txt')
    prompt = None
    if os.path.exists(txt_p):
        prompt = re.sub(r'\[[^\]]*\]|<[^>]*>', ' ', open(txt_p).read())
        prompt = re.sub(r'\s+', ' ', prompt).strip()
    segs, info = model.transcribe(os.path.join(EP, 'audio', 'vo', f'{vid}.mp3'), language='en', word_timestamps=True,
                                  initial_prompt=prompt, beam_size=5, vad_filter=False, condition_on_previous_text=False)
    words, text = [], []
    for s in segs:
        text.append(s.text)
        for w in s.words:
            words.append({'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 3)})
    json.dump({'id': vid, 'model': MODEL, 'text': ''.join(text).strip(), 'words': words}, open(out, 'w'), indent=1)
    print(vid, len(words), 'words |', ''.join(text).strip()[:110], flush=True)
