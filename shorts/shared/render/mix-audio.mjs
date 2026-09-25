#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3 (−14 LUFS target).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration, mix }) {
  if (mix && mix.duck) return mixDucked({ episodeDir, sfxDir, sfxCues, duration, mix });
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

/**
 * Opt-in (config.json "mix": { "duck": true, ... }): music bed is sidechain-ducked
 * under the VO, SFX sit on their own bus, and the master is loudness-normalised
 * (two-pass-free single loudnorm, default −14 LUFS / −1.5 dBTP).
 */
function mixDucked({ episodeDir, sfxDir, sfxCues, duration, mix }) {
  const audioDir = path.join(episodeDir, 'audio');
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  if (!vo) throw new Error('Missing VO in ' + audioDir);
  const music = path.join(audioDir, 'music.mp3');
  const out = path.join(audioDir, 'final-mix.mp3');
  const musicVol = mix.musicVol ?? 0.3;
  const musicStart = mix.musicStart ?? 0;
  const lufs = mix.lufs ?? -14;
  const tail = mix.fadeOut ?? 1.6;

  const inputs = ['-i', vo, '-ss', String(musicStart), '-i', music];
  const f = [];
  // VO: gentle clean-up + level before sidechain split
  f.push(`[0:a]aresample=48000,highpass=f=70,acompressor=threshold=0.12:ratio=2.5:attack=8:release=120:makeup=1.6,asplit=2[vo][key]`);
  f.push(
    `[1:a]aresample=48000,volume=${musicVol},afade=t=in:st=0:d=0.6,afade=t=out:st=${Math.max(0, duration - tail)}:d=${tail}[mraw]`
  );
  f.push(`[mraw][key]sidechaincompress=threshold=0.03:ratio=6:attack=25:release=450:makeup=1[mus]`);
  const sfxLabels = [];
  let idx = 2;
  for (const cue of sfxCues) {
    const p = path.join(sfxDir, cue.file);
    if (!fs.existsSync(p)) continue;
    inputs.push('-i', p);
    const d = Math.round(cue.at * 1000);
    const trim = cue.dur ? `,atrim=0:${cue.dur},afade=t=out:st=${Math.max(0, cue.dur - 0.25)}:d=0.25` : '';
    f.push(`[${idx}:a]aresample=48000${trim},volume=${cue.vol ?? 0.5},adelay=${d}|${d}[s${idx}]`);
    sfxLabels.push(`[s${idx}]`);
    idx++;
  }
  const all = ['[vo]', '[mus]', ...sfxLabels];
  f.push(`${all.join('')}amix=inputs=${all.length}:duration=first:dropout_transition=0:normalize=0[aout]`);
  const pre = path.join(audioDir, '.premix.wav');
  const ff = (args, capture) =>
    new Promise((resolve, reject) => {
      const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      p.stderr.on('data', (d) => (err += d));
      p.on('exit', (code) => (code === 0 ? resolve(err) : reject(new Error('ffmpeg mix failed ' + code + '\n' + err.slice(-2000)))));
    });
  return (async () => {
    // pass 1: premix; pass 2: measure; pass 3: linear loudnorm to target
    await ff(['-y', ...inputs, '-filter_complex', f.join(';'), '-map', '[aout]', '-t', String(duration), '-ar', '48000', '-ac', '2', pre]);
    const log = await ff(['-i', pre, '-af', `loudnorm=I=${lufs}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']);
    const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
    const ln = `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
    await ff(['-y', '-i', pre, '-af', `${ln},aresample=48000`, '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
    fs.unlinkSync(pre);
    return out;
  })();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI: node mix-audio.mjs <episodeDir>
  const episodeDir = path.resolve(process.argv[2]);
  const meta = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
  mixAudio({
    episodeDir,
    sfxDir: meta.sfxDir ? path.resolve(episodeDir, meta.sfxDir) : path.join(episodeDir, 'sfx'),
    sfxCues: meta.sfxCues || [],
    duration: meta.duration,
    mix: meta.mix,
  }).then((o) => console.log('Wrote', o));
}
