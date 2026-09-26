#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3.
 *
 * config.json `mix` (all optional; omitted → legacy flat mix):
 *   musicVol   music gain before ducking (default 0.11)
 *   musicStart seconds into music.mp3 to start from (default 0)
 *   duck       sidechain-duck music under the VO (default false)
 *   lufs       two-pass loudnorm of the final mix to this integrated target, TP −1.5
 *   fadeOut    music fade-out length at the end (default 2)
 * Cues: { file, at, vol, dur? } — `dur` trims the cue with a short fade.
 * `sfxDir` is resolved relative to the episode folder (absolute paths pass through).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function ffmpeg(args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', capture ? 'pipe' : 'inherit'] });
    let err = '';
    if (capture) p.stderr.on('data', (d) => (err += d));
    p.on('exit', (code) => (code === 0 ? resolve(err) : reject(new Error('ffmpeg mix failed ' + code))));
  });
}

export async function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration, mix = {} }) {
  const audioDir = path.join(episodeDir, 'audio');
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  const music = path.join(audioDir, 'music.mp3');
  const out = path.join(audioDir, 'final-mix.mp3');
  if (!vo) throw new Error('Missing VO in ' + audioDir);
  const sfxRoot = path.resolve(episodeDir, sfxDir || 'sfx');

  const musicVol = mix.musicVol ?? 0.11;
  const musicStart = mix.musicStart ?? 0;
  const fadeOut = mix.fadeOut ?? 2;

  // Level the VO in its own pass: loudnorm inside the mix graph flushes its lookahead after
  // amix has already seen EOF, which silently drops the last ~3 s (the punchline).
  const voLevelled = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vo-')), 'vo.wav');
  await ffmpeg(['-y', '-v', 'error', '-i', vo, '-af', 'aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', voLevelled]);

  const inputs = ['-i', voLevelled];
  let inputIdx = 1;
  let musicIdx = -1;
  if (fs.existsSync(music)) {
    inputs.push('-ss', String(musicStart), '-i', music);
    musicIdx = inputIdx++;
  }
  const sfxInputs = [];
  for (const cue of sfxCues) {
    const p = path.join(sfxRoot, cue.file);
    if (!fs.existsSync(p)) {
      console.warn('Missing SFX', p);
      continue;
    }
    inputs.push('-i', p);
    sfxInputs.push({ idx: inputIdx++, delayMs: Math.round(cue.at * 1000), vol: cue.vol ?? 0.55, dur: cue.dur });
  }

  // VO is levelled on its own; music is optionally sidechain-ducked by it; SFX delayed in.
  const filters = [];
  filters.push(`[0:a]apad=whole_dur=${duration},asplit=2[vo][vokey]`);
  let mixInputs = ['[vo]'];
  if (musicIdx >= 0) {
    filters.push(
      `[${musicIdx}:a]aresample=48000,volume=${musicVol},afade=t=in:st=0:d=1,` +
        `afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}[mus0]`
    );
    if (mix.duck) {
      filters.push(`[mus0][vokey]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450:makeup=1[mus]`);
    } else {
      filters.push(`[vokey]anullsink`);
      filters.push(`[mus0]anull[mus]`);
    }
    mixInputs.push('[mus]');
  } else {
    filters.push(`[vokey]anullsink`);
  }
  for (const s of sfxInputs) {
    const lab = `sfx${s.idx}`;
    const trim = s.dur ? `atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.25)}:d=0.25,` : '';
    filters.push(`[${s.idx}:a]aresample=48000,${trim}volume=${s.vol},adelay=${s.delayMs}|${s.delayMs}[${lab}]`);
    mixInputs.push(`[${lab}]`);
  }
  const n = mixInputs.length;
  filters.push(`${mixInputs.join('')}amix=inputs=${n}:duration=first:dropout_transition=0:normalize=0[pre]`);

  const encode = ['-map_metadata', '-1', '-map_chapters', '-1', '-t', String(duration), '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k'];
  if (mix.lufs == null) {
    await ffmpeg(['-y', '-v', 'error', ...inputs, '-filter_complex', filters.join(';').replace('[pre]', '[aout]'), '-map', '[aout]', ...encode, out]);
    return out;
  }

  // Two-pass: render the raw mix, measure it, then apply one static gain to hit the
  // integrated target (keeps balance/dynamics) with a limiter at −1.5 dBTP.
  const raw = path.join(path.dirname(voLevelled), 'raw.wav');
  await ffmpeg(['-y', '-v', 'error', ...inputs, '-filter_complex', filters.join(';').replace('[pre]', '[aout]'), '-map', '[aout]',
    '-t', String(duration), '-ar', '48000', '-ac', '2', raw]);
  const log = await ffmpeg(['-hide_banner', '-i', raw, '-af', 'ebur128', '-f', 'null', '-'], { capture: true });
  const measured = parseFloat(log.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0]);
  const gain = (mix.lufs - measured).toFixed(2);
  console.log(`Mix measured ${measured} LUFS → gain ${gain} dB`);
  await ffmpeg(['-y', '-v', 'error', '-i', raw, '-af', `volume=${gain}dB,alimiter=limit=0.84:attack=2:release=60:level=false`, ...encode, out]);
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
    mix: meta.mix,
  }).then((o) => console.log('Wrote', o));
}
