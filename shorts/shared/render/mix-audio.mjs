#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3 (−14 LUFS target).
 *
 * Optional `mix` block (from render/config.json):
 *   { duck, musicVol, musicStart, lufs, fadeOut }
 * When present, music is sidechain-ducked under the VO and the whole mix is
 * loudness-normalised to `lufs`. Without it the legacy fixed-level mix is used.
 * SFX cues may carry `dur` (seconds) to trim long tails with a short fade.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration, mix }) {
  const audioDir = path.join(episodeDir, 'audio');
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  const music = path.join(audioDir, 'music.mp3');
  const out = path.join(audioDir, 'final-mix.mp3');
  if (!vo) throw new Error('Missing VO in ' + audioDir);
  const sfxRoot = path.resolve(episodeDir, sfxDir || 'sfx');

  const inputs = ['-i', vo];
  let inputIdx = 1;
  let musicIdx = -1;
  if (fs.existsSync(music)) {
    inputs.push('-i', music);
    musicIdx = inputIdx++;
  }
  const sfxInputs = [];
  for (const cue of sfxCues) {
    const p = path.join(sfxRoot, cue.file);
    if (!fs.existsSync(p)) {
      console.warn('SFX missing, skipped:', p);
      continue;
    }
    inputs.push('-i', p);
    sfxInputs.push({
      idx: inputIdx++,
      delayMs: Math.round(cue.at * 1000),
      vol: cue.vol ?? 0.55,
      dur: cue.dur,
    });
  }

  const filters = [];
  let mixInputs;
  if (mix) {
    const lufs = mix.lufs ?? -14;
    const musicVol = mix.musicVol ?? 0.14;
    const fadeOut = mix.fadeOut ?? 1.0;
    const musicStart = mix.musicStart ?? 0;
    filters.push(`[0:a]aresample=48000,loudnorm=I=${lufs}:TP=-1.5:LRA=11,asplit=2[vo][vosc]`);
    mixInputs = ['[vo]'];
    if (musicIdx >= 0) {
      filters.push(
        `[${musicIdx}:a]aresample=48000,atrim=start=${musicStart},asetpts=PTS-STARTPTS,volume=${musicVol},` +
          `afade=t=in:st=0:d=0.3,afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}[musraw]`
      );
      if (mix.duck) {
        filters.push(
          `[musraw][vosc]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=280:makeup=1[mus]`
        );
      } else {
        filters.push(`[musraw]anull[mus]`);
        filters.push(`[vosc]anullsink`);
      }
      mixInputs.push('[mus]');
    } else {
      filters.push(`[vosc]anullsink`);
    }
  } else {
    filters.push(`[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.0[vo]`);
    mixInputs = ['[vo]'];
    if (musicIdx >= 0) {
      filters.push(
        `[${musicIdx}:a]volume=0.11,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 2)}:d=2[mus]`
      );
      mixInputs.push('[mus]');
    }
  }
  for (const s of sfxInputs) {
    const lab = `sfx${s.idx}`;
    const trim =
      s.dur != null
        ? `atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.15)}:d=0.15,`
        : '';
    filters.push(`[${s.idx}:a]aresample=48000,${trim}volume=${s.vol},adelay=${s.delayMs}|${s.delayMs}[${lab}]`);
    mixInputs.push(`[${lab}]`);
  }
  const n = mixInputs.length;
  const master = mix
    ? `,alimiter=limit=0.84:level=false,loudnorm=I=${mix.lufs ?? -14}:TP=-1.5:LRA=11`
    : '';
  // duration=first ends as soon as the VO branch hits EOF, which truncates the
  // mix when the ducked-music branch lags behind loudnorm's lookahead; in mix
  // mode run to the longest input and let `-t duration` set the length.
  const amixDur = mix ? 'longest' : 'first';
  filters.push(
    `${mixInputs.join('')}amix=inputs=${n}:duration=${amixDur}:dropout_transition=0:normalize=0${master},apad[aout]`
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
    mix: meta.mix,
  }).then((o) => console.log('Wrote', o));
}
