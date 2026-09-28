#!/usr/bin/env node
/**
 * s20 mix — held Atlas VO (never loudnorm'd before the mix):
 *   VO: static gain + apad → float
 *   Music (Vastness, from 20 s): static gain ~4 dB under the s18 bed + deterministic envelope
 *     (small lifts in VO gaps from transcript.json)
 *   SFX: timed cues, static gains
 *   → float amix (normalize=0) → master peak limiter (−6 dBFS, keeps pass 2 linear)
 *   → two-pass loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP)
 * Output: out/final-mix.wav
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const DUR = 40.536;
const VO_GAIN_DB = 5.5; // VO measures −23.3 LUFS → ~−17.8 in the premix (s18 sat at ~−17.6)
const MUSIC_OFFSET = 20;
// s18: Silent Descent (−14.5 LUFS) at −19 dB → ~−33.5 LUFS bed. Vastness measures −13.6 LUFS,
// so −24 dB lands it at ~−37.6 LUFS: ~4 dB quieter than the s18 original bed.
const MUSIC_DB = -24;

const words = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).words;
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
const lift = gaps
  .map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`)
  .join('+');
const musicExpr = `pow(10,(${MUSIC_DB}+3.5*min(1,${lift}))/20)`;

// [file, at (s), gain dB]
const CUES = [
  ['impact_hit', 0.0, -10], ['text_pop', 0.55, -5], ['impact_hit', 2.4, -15],
  ['whoosh_1', 4.15, -9], ['riser', 5.0, -14],
  ['paper_rustle', 7.9, -1], ['typewriter_tick', 8.05, -11], ['text_pop', 8.4, -4],
  ['whoosh_2', 10.3, -13], ['text_pop', 12.85, -5],
  ['typewriter_tick', 15.3, -8], ['impact_hit', 16.4, -9], ['text_pop', 16.9, -5],
  ['whoosh_1', 18.15, -9], ['text_pop', 18.9, -4],
  ['whoosh_2', 19.95, -11], ['text_pop', 20.65, -4],
  ['whoosh_2', 21.4, -11], ['text_pop', 22.05, -4],
  ['riser', 22.8, -10], ['whoosh_1', 23.2, -8], ['impact_hit', 24.35, -8], ['text_pop', 24.55, -5],
  ['whoosh_2', 25.35, -11], ['text_pop', 27.4, -4], ['text_pop', 28.5, -4], ['text_pop', 29.46, -4],
  ['impact_hit', 30.0, -15], ['paper_rustle', 30.9, -5], ['whoosh_1', 31.9, -10],
  ['impact_hit', 35.65, -13], ['text_pop', 35.5, -4],
  ['text_pop', 37.1, -4], ['impact_hit', 37.25, -14],
  ['riser', 38.95, -9], ['whoosh_2', 40.08, -6],
];

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
args.push('-i', path.join(EP, 'audio', 'vo.mp3'));
args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', path.join(EP, 'audio', 'music.mp3'));
CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.04,afade=t=out:st=${(DUR - 0.2).toFixed(3)}:d=0.2[mus]`);
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
