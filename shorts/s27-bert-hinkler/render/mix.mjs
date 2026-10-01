#!/usr/bin/env node
/**
 * s27 mix — locked path. The held Atlas VO is never loudnorm'd before the mix.
 *   1. measure VO (ebur128)            → static gain to ~−18 LUFS in the premix + apad to full length
 *   2. Music (Skyline, Mixkit 601)     → static gain seated ~4 dB lower than the s18 bed recipe,
 *                                        deterministic envelope (lift in VO gaps, dip on the death/funeral
 *                                        beats, gentle swell on the series line), short tail fade on the loop cut
 *   3. ~10 intentional SFX cues        → static gains + adelay (the passport-stamp run is one composite cue:
 *                                        eight thunks that accelerate with the stamps)
 *   → float amix (normalize=0) → peak safety limiter → two-pass loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP)
 * Writes out/final-mix.wav and out/loudnorm-report.txt (copied to final/).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const DUR = 91.248;
const VO = path.join(EP, 'audio', 'vo.mp3');
const MUSIC = path.join(EP, 'audio', 'music.mp3');

const sh = (cmd) => execFileSync('bash', ['-c', cmd]).toString();
const lufs = (f) => parseFloat(sh(`ffmpeg -hide_banner -i "${f}" -af ebur128 -f null - 2>&1 | grep -E '^\\s+I:' | tail -1`).trim().split(/\s+/)[1]);

// 1. measure VO → static gain
const voI = lufs(VO);
const VO_GAIN_DB = +(-18 - voI).toFixed(2);
// 2. music: s18 seated Silent Descent at −19 dB under a VO lifted to ~−17.6; this bed sits ~4 dB lower
const MUSIC_DB = -23;
const words = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).words;
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end, b = words[i + 1].start;
  if (b - a >= 0.4) gaps.push([a + 0.05, b - 0.05]);
}
const lift = gaps.map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`).join('+');
const win = (a, b, r) => `clip((t-${a})/${r},0,1)*clip((${b}-t)/${r},0,1)`;
const musicExpr = `pow(10,(${MUSIC_DB}+3.5*min(1,${lift})-4.5*${win(64.3, 82.9, 0.9)}+2*${win(83.0, 89.9, 1.0)})/20)`;

// 3. sparse SFX — [file, at (s), gain dB, why]
const STAMP_T = [35.64, 36.56, 37.66, 39.62, 40.52, 41.44, 42.2, 44.28];
const CUES = [
  ['impact_hit', 0.0, -10, 'frame-1 hook slam 15 DAYS'],
  ['whoosh_1', 0.95, -9, 'space dive onto London'],
  ['thud', 18.86, -6, 'Gag 1 — cardboard wings, plop into the sand dune'],
  ['text_pop', 31.05, -12, 'Gag 2 — the sandwich floats out of the cockpit'],
  ['riser', 33.9, -13, 'take-off from London into the stamp run'],
  ['stamps', 35.64, -4, 'Gag 3 — eight passport-stamp thunks, faster and faster (one composite cue)'],
  ['paper_rustle', 54.3, -8, 'Gag 4 — 1920s newspaper spins in over Darwin'],
  ['impact_hit', 57.92, -13, 'Gag 5 — vintage thumbs-up stamp lands on Darwin'],
  ['whoosh_2', 64.36, -15, 'Gag 6 — plane vanishes; soft grey settle (low-passed)'],
  ['whoosh_1', 89.95, -8, 'incomplete-loop whip back to the space dive / 15 DAYS'],
];

// composite stamp-run cue: eight thuds placed on the stamp times, slightly brighter each time
const stampsWav = path.join(OUT, 'sfx-stamps.wav');
{
  const ins = [], fl = [], labs = [];
  STAMP_T.forEach((t, i) => {
    ins.push('-i', path.join(EP, 'sfx', 'thud.mp3'));
    const ms = Math.round((t - STAMP_T[0]) * 1000);
    fl.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=${(-2 + i * 0.6).toFixed(1)}dB,asetrate=48000*${(1 + i * 0.025).toFixed(3)},aresample=48000,adelay=${ms}|${ms}[t${i}]`);
    labs.push(`[t${i}]`);
  });
  fl.push(`${labs.join('')}amix=inputs=${labs.length}:duration=longest:dropout_transition=0:normalize=0[o]`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...ins, '-filter_complex', fl.join(';'), '-map', '[o]', '-c:a', 'pcm_f32le', stampsWav], { stdio: 'inherit' });
}

const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', VO, '-t', String(DUR + 1), '-i', MUSIC];
CUES.forEach(([f]) => args.push('-i', f === 'stamps' ? stampsWav : path.join(EP, 'sfx', f + '.mp3')));
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.08,afade=t=out:st=${(DUR - 0.35).toFixed(3)}:d=0.35[mus]`);
const labels = ['[vo]', '[mus]'];
CUES.forEach(([f, at, db], i) => {
  const ms = Math.round(at * 1000);
  const lp = f === 'whoosh_2' ? ',lowpass=f=1800' : '';
  fl.push(`[${i + 2}:a]${F}${lp},volume=${db}dB,adelay=${ms}|${ms}[s${i}]`);
  labels.push(`[s${i}]`);
});
fl.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.5:attack=4:release=60:level=false,atrim=0:${DUR}[pre]`);
const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...args, '-filter_complex', fl.join(';'), '-map', '[pre]', '-c:a', 'pcm_f32le', premix], { stdio: 'inherit' });

// two-pass loudnorm on the master only
const LN = 'I=-14:TP=-1.5:LRA=11';
const p1 = sh(`ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:print_format=json -f null - 2>&1`);
const meas = JSON.parse(p1.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
const final = path.join(OUT, 'final-mix.wav');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', premix, '-af',
  `loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', final], { stdio: 'inherit' });
const chk = sh(`ffmpeg -hide_banner -i "${final}" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary`);
const report = [
  `s27 Bert Hinkler — master loudness report (${new Date().toISOString()})`,
  `VO (held Atlas en-AU, ${DUR} s) measured ${voI} LUFS → static gain ${VO_GAIN_DB} dB (no pre-amix loudnorm)`,
  `Music: Skyline (Mixkit 601) static ${MUSIC_DB} dB + envelope (gap lift +3.5, disappearance→funeral dip −4.5, home/series swell +2)`,
  `SFX cues (${CUES.length}):`,
  ...CUES.map(([f, at, db, why]) => `  ${at.toFixed(2).padStart(6)} s  ${f.padEnd(15)} ${String(db).padStart(4)} dB  ${why}`),
  `Pass 1 (premix): I=${meas.input_i} LUFS  TP=${meas.input_tp} dBTP  LRA=${meas.input_lra}  thresh=${meas.input_thresh}`,
  `Pass 2 (master, linear=true) ebur128:`,
  chk.trim(),
].join('\n');
fs.writeFileSync(path.join(OUT, 'loudnorm-report.txt'), report + '\n');
console.log(report);
