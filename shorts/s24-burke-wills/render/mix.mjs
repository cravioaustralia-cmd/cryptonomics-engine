#!/usr/bin/env node
/**
 * s24 mix — locked path (PR #21 / #23 / #25):
 *   VO (held Atlas, never loudnorm'd pre-mix): measured −22.8 LUFS → static +5.2 dB + apad
 *   Music (Dark Drama, Mixkit 605, −9.1 LUFS track): static −26 dB (≈4 dB under s18's Silent Descent
 *     seat: −13.3 LUFS track at −19 dB) + gentle +3.5 dB lifts in VO gaps from transcript.json
 *   SFX: 9 intentional cues anchored to transcript phrases
 *   → float amix (normalize=0) → peak limiter → two-pass loudnorm on the MASTER only (−14 LUFS / −1.5 dBTP)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const tx = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8'));
const DUR = tx.duration;
const words = tx.words;
const VO_GAIN_DB = 5.2;
const MUSIC_OFFSET = 8; // skip the silent intro; the build lands in the back half
const MUSIC_DB = -26;

const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
const NW = words.map((w) => norm(w.word));
function at(phrase, fb) {
  const k = phrase.split(' ').map(norm);
  for (let i = 0; i + k.length <= NW.length; i++) if (k.every((x, j) => NW[i + j] === x)) return words[i].start;
  return fb;
}

// VO gaps ≥ 0.45 s get a gentle music lift
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
const lift = gaps.map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`).join('+') || '0';
const musicExpr = `pow(10,(${MUSIC_DB}+3.5*min(1,${lift}))/20)`;

const nine = at('nine hours', 22.5);
const CUES = [
  ['impact_hit', 0.0, -9], // frame-1 NINE HOURS slam
  ['whoosh_1', 1.05, -9], // recap lands on the Gulf, return begins
  ['paper_rustle', at('carve a message', 14.9), -6], // DIG Tree card
  ['impact_hit', at('dig', 16.2) - 0.02, -8], // DIG blaze
  ['riser', nine - 2.45, -12], // build into the miss
  ['impact_hit', nine, -7], // NINE HOURS
  ['whoosh_2', at('only king', 28.8) - 0.05, -10], // King card
  ['whoosh_1', at("and it's why", 35.5), -11], // pull out to the continent
  ['whoosh_2', DUR - 0.5, -7], // whip back to frame 1
];
console.log('cues', CUES.map(([f, t]) => `${f}@${t.toFixed(2)}`).join(' '));

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
args.push('-i', path.join(EP, 'audio', 'vo.mp3'));
args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', path.join(EP, 'audio', 'music.mp3'));
CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.4,afade=t=out:st=${(DUR - 0.3).toFixed(3)}:d=0.3[mus]`);
const labels = ['[vo]', '[mus]'];
CUES.forEach(([, t, db], i) => {
  const ms = Math.max(0, Math.round(t * 1000));
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
