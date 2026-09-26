#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3 (−14 LUFS target).
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration, mix }) {
  const audioDir = path.join(episodeDir, 'audio');
  // sfxDir may be absolute, relative to the episode, or stale — fall back to <episode>/sfx
  sfxDir = resolveSfxDir(episodeDir, sfxDir);
  if (mix) return mixDucked({ episodeDir, audioDir, sfxDir, sfxCues, duration, mix });
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

function resolveSfxDir(episodeDir, sfxDir) {
  const candidates = [];
  if (sfxDir) candidates.push(path.isAbsolute(sfxDir) ? sfxDir : path.join(episodeDir, sfxDir));
  candidates.push(path.join(episodeDir, 'sfx'));
  return candidates.find((d) => fs.existsSync(d)) || candidates[0];
}

/**
 * Config-driven mix (used when render/config.json has a `mix` block):
 *   VO clean-up + compression, music bed at `musicVol` sidechain-ducked under the VO,
 *   SFX cues with optional `dur` (trimmed + faded tail), final loudnorm to `lufs`.
 */
function mixDucked({ episodeDir, audioDir, sfxDir, sfxCues, duration, mix }) {
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  if (!vo) throw new Error('Missing VO in ' + audioDir);
  const music = [path.join(audioDir, 'music.mp3'), path.join(episodeDir, 'music', 'music.mp3')].find((p) =>
    fs.existsSync(p)
  );
  const out = path.join(audioDir, 'final-mix.wav'); // lossless: exact duration, no mp3 padding
  const lufs = mix.lufs ?? -14;
  const fadeOut = mix.fadeOut ?? 1.5;
  const inputs = ['-i', vo];
  const filters = [];
  let idx = 1;
  // static VO gain to ~-16 LUFS before gentle compression (no look-ahead: keeps VO sample-aligned with captions)
  const voGain = -17 - measureLufs(vo);
  filters.push(
    `[0:a]aresample=48000,highpass=f=70,volume=${voGain.toFixed(2)}dB,` +
      `acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=1,apad=whole_dur=${duration}[vofull]`
  );
  const mixIn = [];
  if (music) {
    inputs.push('-i', music);
    const m = idx++;
    const st = mix.musicStart ?? 0;
    filters.push(
      `[${m}:a]aresample=48000,atrim=start=${st}:duration=${duration + 0.5},asetpts=PTS-STARTPTS,` +
        `volume=${mix.musicVol ?? 0.2},afade=t=in:st=0:d=${mix.fadeIn ?? 0.6},` +
        `afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}[musraw]`
    );
    if (mix.duck !== false) {
      filters.push(`[vofull]asplit=2[vo][vokey]`);
      filters.push(
        `[musraw][vokey]sidechaincompress=threshold=${mix.duckThreshold ?? 0.03}:ratio=${mix.duckRatio ?? 6}:` +
          `attack=${mix.duckAttack ?? 40}:release=${mix.duckRelease ?? 450}:makeup=1[mus]`
      );
      mixIn.push('[vo]', '[mus]');
    } else {
      mixIn.push('[vofull]', '[musraw]');
    }
  } else {
    mixIn.push('[vofull]');
  }
  for (const cue of sfxCues) {
    const p = path.join(sfxDir, cue.file);
    if (!fs.existsSync(p)) {
      console.warn('SFX missing, skipped:', p);
      continue;
    }
    inputs.push('-i', p);
    const i = idx++;
    const ms = Math.max(0, Math.round(cue.at * 1000));
    let chain = `[${i}:a]aresample=48000`;
    if (cue.trimStart) chain += `,atrim=start=${cue.trimStart},asetpts=PTS-STARTPTS`;
    if (cue.dur) {
      const tail = Math.min(0.35, cue.dur / 3);
      chain += `,atrim=duration=${cue.dur},afade=t=out:st=${Math.max(0, cue.dur - tail)}:d=${tail}`;
    }
    if (cue.rate) chain += `,asetrate=48000*${cue.rate},aresample=48000`;
    chain += `,volume=${cue.vol ?? 0.5},adelay=${ms}|${ms}[s${i}]`;
    filters.push(chain);
    mixIn.push(`[s${i}]`);
  }
  // pass 1: sample-exact premix (no look-ahead processors, so nothing shifts or truncates)
  filters.push(
    `${mixIn.join('')}amix=inputs=${mixIn.length}:duration=first:dropout_transition=0:normalize=0,` +
      `apad,atrim=duration=${duration}[aout]`
  );
  const premix = path.join(audioDir, '.premix.wav');
  run(['-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[aout]', '-ar', '48000', '-ac', '2',
    '-c:a', 'pcm_f32le', '-map_metadata', '-1', '-map_chapters', '-1', premix]);
  // pass 2: one static gain to the LUFS target + latency-compensated true-peak limiter
  const measured = measureLufs(premix);
  const gain = lufs - measured;
  console.log(`premix ${measured.toFixed(1)} LUFS → gain ${gain.toFixed(2)} dB → target ${lufs}`);
  run(['-y', '-i', premix, '-af',
    `volume=${gain.toFixed(2)}dB,alimiter=limit=${mix.ceiling ?? 0.79}:attack=3:release=60:level=false:latency=1,` +
      `apad,atrim=duration=${duration}`,
    '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', out]);
  fs.rmSync(premix, { force: true });
  return Promise.resolve(out);
}

function run(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg mix failed ' + r.status);
}

function measureLufs(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...r.stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  if (!m) throw new Error('could not measure loudness');
  return parseFloat(m[1]);
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
    mix: meta.mix,
  }).then((o) => console.log('Wrote', o));
}
