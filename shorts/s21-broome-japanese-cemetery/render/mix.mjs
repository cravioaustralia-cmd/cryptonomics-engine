#!/usr/bin/env node
/**
 * s21 mix — held Atlas VO (never loudnorm'd before the mix):
 *   VO: measured −22.4 LUFS → static gain + apad → float
 *   Music (Echoes / Andrew Ev, from 15 s so the track's swell lands on "Over 900 people"):
 *     static gain seats the bed ≈ −36 LUFS in the premix — ~4 dB under s18's Silent Descent
 *     bed (≈ −32 LUFS at its −19 dB setting) — + deterministic envelope (small lifts in VO
 *     gaps from transcript.json, trims the 28–33 s swell so it never crowds the VO)
 *   SFX: timed cues, static gains, long tails trimmed
 *   → float amix (normalize=0) → master peak limiter (−6 dBFS, keeps pass 2 linear)
 *   → two-pass loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const DUR = 39.816;
const VO_GAIN_DB = 5.0; // VO measures −22.4 LUFS → ~−17.4 in the premix
const MUSIC_OFFSET = 15;
const MUSIC_DB = -15.4; // Echoes 15–55 s measures −20.6 LUFS raw → ≈ −36 LUFS bed

const words = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).words;
// VO gaps ≥ 0.45 s get a gentle music lift (smaller than s18's +4.5 dB — this bed stays low)
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
const lift = gaps
  .map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`)
  .join('+');
// dB envelope: base, −3 dB across the track's 28–33 s swell, +3 dB in VO gaps
const musicExpr = `pow(10,(${MUSIC_DB}-3*clip((t-27.5)/1.0,0,1)*clip((33.5-t)/1.0,0,1)+3*min(1,${lift}))/20)`;

// [file, at (s), gain dB, max length (s) | undefined]
const CUES = [
  ['impact_hit', 0.0, -9],
  ['whoosh_2', 3.0, -13],
  ['whoosh_1', 5.3, -18],
  ['whoosh_2', 8.2, -13],
  ['text_pop', 8.5, -6], ['text_pop', 9.3, -8],
  ['paper_rustle', 10.25, -6, 1.1],
  ['impact_hit', 10.58, -14],
  ['whoosh_1', 11.8, -15],
  ['text_pop', 12.2, -13], ['text_pop', 12.5, -13], ['text_pop', 12.8, -13],
  ['text_pop', 13.2, -7],
  ['whoosh_2', 14.1, -11],
  ['text_pop', 14.8, -8], ['text_pop', 15.55, -7], ['text_pop', 17.16, -5],
  ['whoosh_1', 18.05, -15],
  ['riser', 18.3, -19],
  ['impact_hit', 19.6, -16], ['impact_hit', 20.65, -13],
  ['impact_hit', 21.5, -13],
  ['text_pop', 21.8, -8], ['text_pop', 22.6, -8], ['text_pop', 23.3, -8],
  ['whoosh_2', 23.25, -15],
  ['whoosh_1', 24.2, -17],
  ['typewriter_tick', 25.0, -12, 1.2],
  ['impact_hit', 25.85, -12],
  ['riser', 26.4, -12],
  ['impact_hit', 28.92, -8],
  ['typewriter_tick', 29.0, -11, 0.7],
  ['text_pop', 30.9, -7],
  ['whoosh_2', 32.5, -12],
  ['text_pop', 32.95, -14], ['text_pop', 33.3, -14], ['text_pop', 33.6, -14], ['text_pop', 33.85, -14],
  ['whoosh_1', 34.3, -11],
  ['paper_rustle', 34.4, -2, 1.3],
  ['typewriter_tick', 35.4, -9, 0.8],
  ['text_pop', 36.45, -7],
  ['impact_hit', 37.5, -7],
  ['riser', 37.9, -11],
  ['whoosh_2', 38.85, -8],
];

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
args.push('-i', path.join(EP, 'audio', 'vo.mp3'));
args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', path.join(EP, 'audio', 'music.mp3'));
CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(
  `[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.06,afade=t=out:st=${(DUR - 0.3).toFixed(3)}:d=0.3[mus]`
);
const labels = ['[vo]', '[mus]'];
CUES.forEach(([, at, db, maxLen], i) => {
  const ms = Math.round(at * 1000);
  const trim = maxLen ? `,atrim=0:${maxLen},afade=t=out:st=${(maxLen - 0.25).toFixed(2)}:d=0.25` : '';
  fl.push(`[${i + 2}:a]${F}${trim},volume=${db}dB,adelay=${ms}|${ms}[s${i}]`);
  labels.push(`[s${i}]`);
});
fl.push(
  `${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.5:attack=4:release=60:level=false,atrim=0:${DUR}[pre]`
);
const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...args, '-filter_complex', fl.join(';'), '-map', '[pre]', '-c:a', 'pcm_f32le', premix], {
  stdio: 'inherit',
});

// two-pass loudnorm on master only
const LN = 'I=-14:TP=-1.5:LRA=11';
const p1 = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:print_format=json -f null - 2>&1`]).toString();
const meas = JSON.parse(p1.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
console.log('pass1', meas.input_i, 'LUFS', meas.input_tp, 'dBTP');
const final = path.join(OUT, 'final-mix.wav');
execFileSync(
  'ffmpeg',
  [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', premix, '-af',
    `loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true,aresample=48000`,
    '-c:a', 'pcm_s16le', final,
  ],
  { stdio: 'inherit' }
);
const chk = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${final}" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary`]).toString();
console.log(chk);
