#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix.mp3 (−14 LUFS target).
 *
 * Optional `mix` (from render/config.json) switches on the episode-tuned path:
 *   { musicVol, musicStart, fadeOut, duck, lufs }
 * → music is sidechain-ducked under the VO, SFX cues honour `dur` / `fadeIn`,
 *   and the whole mix is loudness-normalised. Without `mix` the legacy mix is kept.
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

  const inputs = ['-i', vo];
  let inputIdx = 1;
  let musicIdx = -1;
  if (fs.existsSync(music)) {
    inputs.push('-i', music);
    musicIdx = inputIdx++;
  }
  const sfxInputs = [];
  for (const cue of sfxCues) {
    const p = path.resolve(episodeDir, sfxDir || 'sfx', cue.file);
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
      fadeIn: cue.fadeIn,
    });
  }

  // Build filter: duck music under VO, overlay SFX with adelay
  const filters = [];
  let mixInputs;
  if (mix) {
    const lufs = mix.lufs ?? -14;
    const fadeOut = mix.fadeOut ?? 1.5;
    // apad: loudnorm swallows ~3 s of tail without trailing input; -t trims it back
    filters.push(`[0:a]apad=pad_dur=4,loudnorm=I=${lufs}:TP=-1.5:LRA=11,atrim=0:${duration},asplit=2[vo][vosc]`);
    mixInputs = ['[vo]'];
    if (musicIdx >= 0) {
      const start = mix.musicStart || 0;
      filters.push(
        `[${musicIdx}:a]atrim=start=${start},asetpts=PTS-STARTPTS,volume=${mix.musicVol ?? 0.16},` +
          `afade=t=in:st=0:d=0.6,afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}[musraw]`
      );
      if (mix.duck !== false) {
        filters.push(
          `[musraw][vosc]sidechaincompress=threshold=0.02:ratio=5:attack=40:release=450:knee=4[mus]`
        );
      } else {
        filters.push('[vosc]anullsink');
        filters.push('[musraw]anull[mus]');
      }
      mixInputs.push('[mus]');
    } else {
      filters.push('[vosc]anullsink');
    }
    for (const s of sfxInputs) {
      const lab = `sfx${s.idx}`;
      let chain = `[${s.idx}:a]`;
      if (s.dur) {
        const fo = Math.min(0.35, s.dur / 3);
        chain += `atrim=0:${s.dur},afade=t=out:st=${s.dur - fo}:d=${fo},`;
      }
      if (s.fadeIn) chain += `afade=t=in:st=0:d=${s.fadeIn},`;
      chain += `volume=${s.vol},adelay=${s.delayMs}|${s.delayMs}[${lab}]`;
      filters.push(chain);
      mixInputs.push(`[${lab}]`);
    }
    filters.push(
      `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0,` +
        `apad=pad_dur=4,loudnorm=I=${lufs}:TP=-1.5:LRA=11[aout]`
    );
  } else {
    filters.push(`[0:a]apad=pad_dur=4,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:${duration},volume=1.0[vo]`);
    mixInputs = ['[vo]'];
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
  }

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
