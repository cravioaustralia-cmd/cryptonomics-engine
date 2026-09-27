#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3 (−14 LUFS target).
 *
 * The VO is NEVER loudnorm'd on its own before amix: single-pass loudnorm on the
 * VO input dropped ~3 s of VO tail on s09. Instead:
 *   1. analyse the VO's integrated loudness (measurement only),
 *   2. apply a static gain to the VO (+ apad so it can't end early) and amix,
 *   3. run a measured two-pass loudnorm on the master premix only.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function ffmpeg(args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', ...args], {
      stdio: ['ignore', 'inherit', capture ? 'pipe' : 'inherit'],
    });
    let err = '';
    if (capture) p.stderr.on('data', (d) => (err += d));
    p.on('exit', (code) => (code === 0 ? resolve(err) : reject(new Error('ffmpeg failed ' + code + '\n' + err.slice(-2000)))));
  });
}

async function measureLoudness(file, preFilter = '') {
  const af = (preFilter ? preFilter + ',' : '') + 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json';
  const log = await ffmpeg(['-i', file, '-af', af, '-f', 'null', '-'], { capture: true });
  const json = log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1);
  return JSON.parse(json);
}

export async function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration, mix = {} }) {
  const audioDir = path.join(episodeDir, 'audio');
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  const music = path.join(audioDir, 'music.mp3');
  const premix = path.join(audioDir, 'premix.wav');
  const out = path.join(audioDir, 'final-mix.mp3');
  if (!vo) throw new Error('Missing VO in ' + audioDir);

  const lufs = mix.lufs ?? -14;
  const voTarget = mix.voLufs ?? -16; // VO level inside the premix (static gain only)
  const musicVol = mix.musicVol ?? 0.11;
  const musicStart = mix.musicStart ?? 0;
  const fadeOut = mix.fadeOut ?? 2;
  const voOffset = mix.voOffset ?? 0;

  // 1. VO analysis (measurement only — output discarded)
  const voStats = await measureLoudness(vo);
  const voGainDb = (voTarget - Number(voStats.input_i)).toFixed(2);
  console.log(`VO measured ${voStats.input_i} LUFS → static gain ${voGainDb} dB`);

  const inputs = ['-i', vo];
  let inputIdx = 1;
  let musicIdx = -1;
  if (fs.existsSync(music)) {
    inputs.push('-ss', String(musicStart), '-i', music);
    musicIdx = inputIdx++;
  }
  const sfxInputs = [];
  for (const cue of sfxCues) {
    const p = path.join(path.resolve(episodeDir, sfxDir || 'sfx'), cue.file);
    if (!fs.existsSync(p)) continue;
    inputs.push('-i', p);
    sfxInputs.push({ idx: inputIdx++, delayMs: Math.round(cue.at * 1000), vol: cue.vol ?? 0.55, dur: cue.dur });
  }

  // 2. Premix: static-gain VO (padded), music bed, SFX
  const fmt = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo';
  const voDelay = Math.round(voOffset * 1000);
  const filters = [`[0:a]${fmt},volume=${voGainDb}dB,adelay=${voDelay}|${voDelay},apad[vo]`];
  const mixInputs = ['[vo]'];
  if (musicIdx >= 0) {
    filters.push(
      `[${musicIdx}:a]${fmt},volume=${musicVol},afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}[mus]`
    );
    mixInputs.push('[mus]');
  }
  for (const s of sfxInputs) {
    const lab = `sfx${s.idx}`;
    const trim = s.dur ? `,atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.3)}:d=0.3` : '';
    filters.push(`[${s.idx}:a]${fmt}${trim},volume=${s.vol},adelay=${s.delayMs}|${s.delayMs}[${lab}]`);
    mixInputs.push(`[${lab}]`);
  }
  filters.push(
    `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0,atrim=0:${duration}[aout]`
  );
  await ffmpeg(['-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[aout]', '-t', String(duration), '-c:a', 'pcm_f32le', premix]);

  // 3. Master loudnorm, measured two-pass, after amix only
  const m = await measureLoudness(premix);
  console.log(`Premix measured ${m.input_i} LUFS / ${m.input_tp} dBTP`);
  const ln =
    `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
    `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  await ffmpeg(['-y', '-i', premix, '-af', `${ln},aresample=48000`, '-t', String(duration), '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
  fs.rmSync(premix, { force: true });
  return out;
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
    mix: meta.mix || {},
  }).then((o) => console.log('Wrote', o));
}
