#!/usr/bin/env node
// Canonical caption words (script spelling) + Whisper word timings (faster-whisper small.en on audio/vo.mp3).
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const raw = JSON.parse(fs.readFileSync(path.join(here, 'whisper_words.json'), 'utf8'));
const script = fs.readFileSync(path.join(here, '..', 'vo', 'atlas_read.txt'), 'utf8')
  .replace(/\s+/g, ' ').trim().split(' ');
if (script.length !== raw.length) throw new Error(`count mismatch script=${script.length} whisper=${raw.length}`);
const words = script.map((w, i) => ({ word: w, start: raw[i].start, end: raw[i].end }));
// Whisper stretched "One" back into the pause after "peace." — pin to onset.
const one = words.findIndex((w) => w.word === 'One');
words[one].start = 24.08;
fs.writeFileSync(path.join(here, '..', 'transcript.json'), JSON.stringify({ duration: 43.56, words }, null, 1));
console.log(words.length, 'words');
