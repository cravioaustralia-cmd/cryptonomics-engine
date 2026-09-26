#!/usr/bin/env node
/**
 * Mix VO + ducked music + timed SFX → final-mix (−14 LUFS target).
 *
 * config.json fields used:
 *   sfxDir            absolute, or relative to the episode folder
 *   sfxCues[]         { file, at, vol, from?, dur? } — from = in-point (s) inside the file,
 *                     dur trims the cue with a short fade-out
 *   mix (optional)    { musicVol, musicStart, fadeIn, fadeOut, duck, lufs, tp, outDir }
 *
 * Without `mix`, the legacy behaviour is kept (per-VO loudnorm, flat music at 0.11, output in audio/).
 * With `mix`, the chain is: VO clean-up → music sidechain-ducked by the VO → SFX → master:
 * measure integrated loudness, apply static gain to `lufs`, limit peaks under `tp`.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', capture ? 'ignore' : 'inherit', capture ? 'pipe' : 'inherit'] });
    let err = '';
    if (capture) p.stderr.on('data', (d) => (err += d));
    p.on('exit', (code) => (code === 0 ? resolve(err) : reject(new Error('ffmpeg failed ' + code + '\n' + err.slice(-2000)))));
  });
}

export async function mixAudio({ episodeDir, sfxDir, sfxCues = [], duration, mix }) {
  const audioDir = path.join(episodeDir, 'audio');
  const vo = ['vo.wav', 'vo.mp3'].map((f) => path.join(audioDir, f)).find((p) => fs.existsSync(p));
  const musicCandidates = mix
    ? [path.join(episodeDir, 'music', 'music.mp3'), path.join(audioDir, 'music.mp3')]
    : [path.join(audioDir, 'music.mp3')];
  const music = musicCandidates.find((p) => fs.existsSync(p));
  if (!vo) throw new Error('Missing VO in ' + audioDir);
  const sfxRoot = sfxDir ? path.resolve(episodeDir, sfxDir) : path.join(episodeDir, 'sfx');
  const outDir = mix && mix.outDir ? path.resolve(episodeDir, mix.outDir) : audioDir;
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'final-mix.mp3');

  const inputs = ['-i', vo];
  let inputIdx = 1;
  let musicIdx = -1;
  if (music) {
    if (mix && mix.musicStart) inputs.push('-ss', String(mix.musicStart));
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
    sfxInputs.push({ idx: inputIdx++, delayMs: Math.round(cue.at * 1000), vol: cue.vol ?? 0.55, from: cue.from, dur: cue.dur });
  }

  const filters = [];
  const mixInputs = [];
  if (!mix) {
    filters.push(`[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.0[vo]`);
    mixInputs.push('[vo]');
    if (musicIdx >= 0) {
      filters.push(
        `[${musicIdx}:a]volume=0.11,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 2)}:d=2[mus]`
      );
      mixInputs.push('[mus]');
    }
  } else {
    // VO: resample, gentle high-pass + de-mud, light glue compression. Split for the duck key.
    filters.push(
      `[0:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=80,` +
        `equalizer=f=250:t=q:w=1.2:g=-2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2dB,` +
        `volume=${mix.voVol ?? 1}[vox];[vox]asplit=2[vo][key]`
    );
    mixInputs.push('[vo]');
    if (musicIdx >= 0) {
      const fi = mix.fadeIn ?? 1.0;
      const fo = mix.fadeOut ?? 1.5;
      filters.push(
        `[${musicIdx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${mix.musicVol ?? 0.18},` +
          `afade=t=in:st=0:d=${fi},afade=t=out:st=${Math.max(0, duration - fo)}:d=${fo}[mbed]`
      );
      if (mix.duck !== false) {
        const d = typeof mix.duck === 'object' ? mix.duck : {};
        filters.push(
          `[mbed][key]sidechaincompress=threshold=${d.threshold ?? 0.03}:ratio=${d.ratio ?? 6}:` +
            `attack=${d.attack ?? 40}:release=${d.release ?? 450}:makeup=1[mus]`
        );
      } else {
        filters.push(`[key]anullsink;[mbed]anull[mus]`);
      }
      mixInputs.push('[mus]');
    } else {
      filters.push(`[key]anullsink`);
    }
  }
  for (const s of sfxInputs) {
    const lab = `sfx${s.idx}`;
    let chain = `[${s.idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.vol}`;
    if (s.from) chain += `,atrim=start=${s.from},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.02`;
    if (s.dur) chain += `,atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.25)}:d=0.25`;
    chain += `,adelay=${s.delayMs}|${s.delayMs}[${lab}]`;
    filters.push(chain);
    mixInputs.push(`[${lab}]`);
  }
  filters.push(
    `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0[pre]`
  );

  if (!mix) {
    await run([
      '-y', ...inputs, '-filter_complex', filters.join(';').replace('[pre]', '[aout]'), '-map', '[aout]',
      '-t', String(duration), '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', out,
    ]);
    return out;
  }

  // Pass 1: render the pre-master to WAV and measure it.
  const pre = path.join(outDir, 'premaster.wav');
  await run(['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[pre]', '-t', String(duration), '-ar', '48000', '-ac', '2', pre]);
  const I = mix.lufs ?? -14;
  const TP = mix.tp ?? -1.5;
  const LRA = mix.lra ?? 9;
  const log = await run(
    ['-hide_banner', '-i', pre, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-'],
    { capture: true }
  );
  const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
  // Pass 2: static gain to the target, then a look-ahead limiter holding the true-peak ceiling
  // (loudnorm alone would drop to dynamic mode whenever the gain pushes peaks over TP).
  const ceiling = Math.pow(10, (TP - 0.5) / 20);
  const master = (g) =>
    run([
      '-y', '-loglevel', 'error', '-i', pre, '-af',
      `volume=${g.toFixed(2)}dB,alimiter=limit=${ceiling.toFixed(4)}:attack=4:release=60:level=disabled,aresample=48000`,
      '-t', String(duration), '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '256k', out,
    ]);
  const measureOut = async () => {
    const log = await run(['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { capture: true });
    const sum = log.slice(log.lastIndexOf('Summary:'));
    const got = (re) => parseFloat((sum.match(re) || [])[1]);
    return { i: got(/I:\s+(-?[\d.]+) LUFS/), lra: got(/LRA:\s+(-?[\d.]+) LU/), tp: got(/Peak:\s+(-?[\d.]+) dBFS/) };
  };
  let gain = I - parseFloat(m.input_i);
  await master(gain);
  let fin = await measureOut();
  if (Math.abs(fin.i - I) > 0.15) {
    // the limiter shaves a little loudness; correct once
    gain += I - fin.i;
    await master(gain);
    fin = await measureOut();
  }
  console.log(
    `Master: premaster ${m.input_i} LUFS, gain ${gain.toFixed(2)} dB → final ${fin.i} LUFS, LRA ${fin.lra} LU, true peak ${fin.tp} dBFS`
  );
  fs.rmSync(pre, { force: true });
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
