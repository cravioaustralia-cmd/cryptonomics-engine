#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3 (−14 LUFS target).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration }) {
  const audioDir = path.join(episodeDir, 'audio');
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  const music = path.join(audioDir, 'music.mp3');
  const out = path.join(audioDir, 'final-mix.mp3');
  if (!vo) throw new Error('Missing VO in ' + audioDir);

  const inputs = ['-i', vo];
  let inputIdx = 1;
  let musicIdx = -1;
  if (fs.existsSync(music)) {
    inputs.push('-i', music);
    musicIdx = inputIdx++;
  }
  const sfxInputs = [];
  for (const cue of sfxCues) {
    const p = path.join(sfxDir, cue.file);
    if (!fs.existsSync(p)) continue;
    inputs.push('-i', p);
    sfxInputs.push({ idx: inputIdx++, delayMs: Math.round(cue.at * 1000), vol: cue.vol ?? 0.55 });
  }

  // Build filter: duck music under VO, overlay SFX with adelay
  const filters = [];
  filters.push(`[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.0[vo]`);
  let mixInputs = ['[vo]'];
  if (musicIdx >= 0) {
    filters.push(
      `[${musicIdx}:a]volume=0.11,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 2)}:d=2[mus]`
    );
    mixInputs.push('[mus]');
  }
  for (const s of sfxInputs) {
    const lab = `sfx${s.idx}`;
    filters.push(`[${s.idx}:a]volume=${s.vol},adelay=${s.delayMs}|${s.delayMs}[${lab}]`);
    mixInputs.push(`[${lab}]`);
  }
  const n = mixInputs.length;
  filters.push(
    `${mixInputs.join('')}amix=inputs=${n}:duration=first:dropout_transition=0:normalize=0[aout]`
  );

  const args = [
    '-y',
    ...inputs,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[aout]',
    '-t',
    String(duration),
    '-ar',
    '48000',
    '-ac',
    '2',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    out,
  ];

  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error('ffmpeg mix failed ' + code))));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI: node mix-audio.mjs <episodeDir>
  const episodeDir = path.resolve(process.argv[2]);
  const meta = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
  mixAudio({
    episodeDir,
    sfxDir: meta.sfxDir,
    sfxCues: meta.sfxCues || [],
    duration: meta.duration,
  }).then((o) => console.log('Wrote', o));
}
