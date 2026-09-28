#!/usr/bin/env node
/**
 * s19 mix — held Atlas VO (never loudnorm'd before the mix):
 *   VO: static gain + apad → float
 *   Music (Curiosity, Diego Nava / Mixkit, from 0 s): static gain + deterministic envelope
 *     (small lifts in VO gaps from transcript.json). Bed seated ~4 dB under s18's bed:
 *       s18 Silent Descent segment −13.0 LUFS at −19 dB → ≈ −32.0 LUFS in its premix
 *       s19 Curiosity segment    −13.2 LUFS at −23 dB → ≈ −36.2 LUFS in this premix
 *     (VO ≈ −17.6 LUFS in the premix, so the bed sits ~18.5 dB under fast VO; gap lifts +3.5 dB vs s18's +4.5)
 *   SFX: timed cues, static gains
 *   → float amix (normalize=0) → master peak limiter (−6 dBFS, keeps pass 2 linear)
 *   → two-pass loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const DUR = 40.92;
const VO_GAIN_DB = 5.5; // VO measures −23.1 LUFS → ~−17.6 in the premix
const MUSIC_OFFSET = 0;
const MUSIC_DB = -23;
const GAP_LIFT_DB = 3.5;

const words = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).words;
// VO gaps ≥ 0.45 s get a gentle music lift
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
const lift = gaps
  .map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`)
  .join('+');
const musicExpr = `pow(10,(${MUSIC_DB}+${GAP_LIFT_DB}*min(1,${lift || '0'}))/20)`;

// [file, at (s), gain dB] — tied to the scene beats in scenes.js
const CUES = [
  ['impact_hit', 0.0, -9],
  ['typewriter_tick', 1.78, -11], ['typewriter_tick', 2.1, -13],
  ['whoosh_2', 2.9, -12], ['text_pop', 2.95, -5],
  ['impact_hit', 4.62, -8],
  ['text_pop', 5.95, -7],
  ['riser', 6.4, -15], ['typewriter_tick', 6.5, -12],
  ['paper_rustle', 8.3, -4], ['text_pop', 8.55, -7],
  ['whoosh_1', 9.45, -10], ['text_pop', 9.58, -5], ['text_pop', 9.95, -7],
  ['whoosh_2', 10.85, -10], ['text_pop', 11.5, -6],
  ['whoosh_1', 12.6, -12], ['text_pop', 12.95, -5], ['typewriter_tick', 13.15, -9],
  ['whoosh_2', 14.02, -8], ['text_pop', 14.1, -4], ['whoosh_1', 15.4, -9],
  ['whoosh_2', 17.12, -8], ['text_pop', 17.2, -4], ['riser', 18.1, -13], ['impact_hit', 18.76, -12],
  ['whoosh_2', 20.72, -8], ['text_pop', 20.8, -4],
  ['text_pop', 23.1, -9], ['text_pop', 23.35, -10], ['text_pop', 23.62, -9],
  ['paper_rustle', 24.5, -8], ['paper_rustle', 25.0, -9],
  ['typewriter_tick', 25.5, -8], ['typewriter_tick', 25.9, -10],
  ['paper_rustle', 26.84, -2], ['paper_rustle', 27.12, -4], ['paper_rustle', 27.42, -4],
  ['whoosh_1', 29.22, -9], ['text_pop', 29.3, -6], ['impact_hit', 29.6, -9],
  ['whoosh_2', 30.4, -12], ['text_pop', 31.3, -8],
  ['text_pop', 33.3, -8], ['text_pop', 33.44, -9], ['text_pop', 33.58, -9],
  ['riser', 34.9, -13],
  ['whoosh_1', 37.05, -10],
  ['text_pop', 39.3, -5],
  ['whoosh_2', 40.42, -10], ['impact_hit', 40.6, -9],
];

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
args.push('-i', path.join(EP, 'audio', 'vo.mp3'));
args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', path.join(EP, 'audio', 'music.mp3'));
CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.3,afade=t=out:st=${(DUR - 0.3).toFixed(3)}:d=0.3[mus]`);
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
