#!/usr/bin/env node
/**
 * s18 mix — held Atlas VO (never loudnorm'd before the mix):
 *   VO: static gain + apad → float
 *   Music (Silent Descent, from 45 s so the build lands on the raid): static gain
 *     + deterministic envelope (lifts in VO gaps from transcript.json, trims the climax)
 *   SFX: timed cues, static gains
 *   → float amix (normalize=0) → master peak limiter (−6 dBFS, keeps pass 2 linear) → two-pass loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const DUR = 45.336;
const VO_GAIN_DB = 5.0; // VO measures −22.6 LUFS → ~−17.6 in the premix
const MUSIC_OFFSET = 45;
const MUSIC_DB = -15;

const words = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).words;
// VO gaps ≥ 0.45 s get a gentle music lift
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
gaps.push([words[words.length - 1].end + 0.05, DUR + 1]);
const lift = gaps
  .map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`)
  .join('+');
// dB envelope: base, −4 dB once the track's climax arrives (~30 s in), +4.5 dB in gaps
const musicExpr = `pow(10,(${MUSIC_DB}-4*clip((t-29.5)/1.5,0,1)+4.5*min(1,${lift}))/20)`;

const CUES = [
  ['impact_hit', 0.0, -10],
  ['text_pop', 2.45, -4], ['text_pop', 2.65, -5], ['text_pop', 2.85, -5], ['text_pop', 3.9, -3],
  ['riser', 5.0, -12],
  ['whoosh_1', 7.55, -6], ['impact_hit', 8.0, -15],
  ['paper_rustle', 8.8, 0],
  ['whoosh_2', 10.5, -14], ['typewriter_tick', 10.7, -8], ['text_pop', 12.4, -3],
  ['whoosh_1', 13.9, -9], ['typewriter_tick', 14.4, -9], ['text_pop', 14.1, -4], ['paper_rustle', 14.3, -4],
  ['whoosh_2', 17.5, -14], ['typewriter_tick', 17.9, -9], ['text_pop', 17.6, -4],
  ['whoosh_1', 20.6, -9], ['text_pop', 21.0, -4], ['paper_rustle', 21.0, -3], ['text_pop', 22.3, -3],
  ['riser', 20.9, -9], ['impact_hit', 23.42, -8],
  ['impact_hit', 27.06, -13], ['text_pop', 28.5, -3], ['whoosh_1', 28.9, -8], ['whoosh_2', 29.9, -12],
  ['impact_hit', 30.9, -7],
  ['whoosh_2', 31.5, -9], ['text_pop', 33.76, -3], ['whoosh_1', 34.0, -12], ['text_pop', 34.72, -4],
  ['typewriter_tick', 37.6, -9], ['impact_hit', 38.7, -16], ['impact_hit', 39.5, -19],
  ['whoosh_1', 40.4, -8], ['paper_rustle', 41.2, -3], ['impact_hit', 42.0, -11],
  ['riser', 42.9, -10], ['whoosh_2', 44.75, -8],
];

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
args.push('-i', path.join(EP, 'audio', 'vo.mp3'));
args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', path.join(EP, 'audio', 'music.mp3'));
CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=out:st=${(DUR - 0.25).toFixed(3)}:d=0.25[mus]`);
const labels = ['[vo]', '[mus]'];
CUES.forEach(([, at, db], i) => {
  const ms = Math.round(at * 1000);
  fl.push(`[${i + 2}:a]${F},volume=${db}dB,adelay=${ms}|${ms}[s${i}]`);
  labels.push(`[s${i}]`);
});
fl.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.5:attack=4:release=60:level=false,atrim=0:${DUR}[pre]`);
const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...args, '-filter_complex', fl.join(';'), '-map', '[pre]', '-c:a', 'pcm_f32le', premix], { stdio: 'inherit' });

// two-pass loudnorm on master only
const LN = 'I=-14:TP=-1.5:LRA=11';
const p1 = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:print_format=json -f null - 2>&1`]).toString();
const meas = JSON.parse(p1.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
console.log('pass1', meas.input_i, 'LUFS', meas.input_tp, 'dBTP');
const final = path.join(OUT, 'final-mix.wav');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', premix, '-af',
  `loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', final], { stdio: 'inherit' });
const chk = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${final}" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary`]).toString();
console.log(chk);
