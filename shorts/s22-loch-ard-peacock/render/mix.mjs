#!/usr/bin/env node
/**
 * s22 mix — held Atlas VO (never loudnorm'd before the mix):
 *   1. VO measured at −23.0 LUFS integrated (ebur128) → static +5 dB gain + apad (float)
 *   2. Music: Fallen (Asper) / Eugenio Mininni (Mixkit) — static −23 dB bed
 *      (4 dB quieter than s18's −19 dB Silent Descent bed) + gentle +3.5 dB lift
 *      only in VO gaps ≥ 0.45 s (from transcript.json); 0.25 s tail fade for the loop
 *   3. SFX: timed cues (beat-synced to scenes.js), static gains
 *   → float amix (normalize=0) → peak safety limiter → TWO-PASS loudnorm on the MASTER only
 *     (−14 LUFS, −1.5 dBTP, linear)
 * Usage: node mix.mjs  → out/premix.wav, out/final-mix.wav, prints loudness + stem levels
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const tr = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8'));
const DUR = tr.duration; // 40.2
const VO = path.join(EP, 'audio', 'vo.mp3');
const MUSIC = path.join(EP, 'music', 'music.mp3');
const VO_GAIN_DB = 5.0;
const MUSIC_OFFSET = 0;
const MUSIC_DB = -23; // s18 bed was −19 dB → 4 dB quieter
const GAP_LIFT_DB = 3.5;

// step 1 — measure the VO (reported; gain is static, never loudnorm'd pre-mix)
const voMeas = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${VO}" -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep "I:"`]).toString().trim();
console.log('VO measured:', voMeas.replace(/\s+/g, ' '), `→ static gain +${VO_GAIN_DB} dB`);

const words = tr.words;
const gaps = [[-1, words[0].start - 0.05]];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
gaps.push([words[words.length - 1].end + 0.05, DUR + 1]);
const lift = gaps.map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`).join('+');
const musicExpr = `pow(10,(${MUSIC_DB}+${GAP_LIFT_DB}*min(1,${lift}))/20)`;

// [file, at (s), gain dB] — synced to scenes.js beats / Whisper words
const CUES = [
  ['impact_hit', 0.0, -9], // frame-1 hook slam
  ['whoosh_2', 1.85, -10], // hook exit whip
  ['text_pop', 2.42, -5], ['text_pop', 2.62, -5], ['text_pop', 2.82, -5], // three slots
  ['text_pop', 4.3, -4], ['text_pop', 4.62, -4], // two teenagers
  ['riser', 3.0, -15],
  ['impact_hit', 5.56, -13], // peacock fills slot 3
  ['whoosh_1', 6.3, -10],
  ['impact_hit', 6.86, -9], ['typewriter_tick', 7.0, -12], // 1878 slam
  ['paper_rustle', 8.04, -8], // LOCH ARD plate
  ['whoosh_2', 8.82, -9],
  ['impact_hit', 8.98, -5], // hits rocks
  ['typewriter_tick', 10.66, -9], // 54 count-up
  ['text_pop', 11.95, -6],
  ['whoosh_1', 12.35, -9], // zoom into survivors
  ['text_pop', 12.6, -5], // TOM PEARCE
  ['whoosh_2', 14.72, -12], // washed in
  ['text_pop', 15.7, -4], ['impact_hit', 15.85, -18], // gorge pin
  ['whoosh_1', 16.2, -13],
  ['text_pop', 18.32, -5], // EVA CARMICHAEL
  ['whoosh_2', 21.85, -10],
  ['riser', 21.95, -12], ['impact_hit', 24.2, -10], // rescue → shore
  ['whoosh_1', 24.6, -13],
  ['text_pop', 26.36, -5], // rings interlock
  ['impact_hit', 26.98, -8], // "didn't" snap
  ['whoosh_2', 27.32, -11],
  ['riser', 26.8, -14], ['impact_hit', 29.28, -9], // iris reveal
  ['text_pop', 30.25, -5], // MINTON
  ['whoosh_2', 30.98, -10],
  ['impact_hit', 32.1, -15], // crate lands
  ['paper_rustle', 32.8, -9], ['typewriter_tick', 33.08, -13], // lid + scan
  ['whoosh_1', 34.22, -11],
  ['text_pop', 34.36, -5], ['paper_rustle', 34.85, -9], ['text_pop', 35.45, -3], // plaque / value
  ['whoosh_2', 36.18, -10],
  ['text_pop', 36.58, -5], ['text_pop', 36.78, -5], ['text_pop', 36.98, -5],
  ['text_pop', 38.3, -4], ['text_pop', 38.6, -4],
  ['impact_hit', 39.56, -12],
  ['whoosh_1', 39.62, -10], // loop whip back into frame 1
];

const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
function buildArgs(only) {
  // only: undefined (full mix) | 'vo' | 'music' — stems for level checks
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  args.push('-i', VO);
  args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', MUSIC);
  CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
  const fl = [];
  fl.push(`[0:a]${F},volume=${only === 'music' ? -120 : VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
  fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,volume=${only === 'vo' ? -120 : 0}dB,afade=t=in:st=0:d=0.08,afade=t=out:st=${(DUR - 0.25).toFixed(3)}:d=0.25[mus]`);
  const labels = ['[vo]', '[mus]'];
  CUES.forEach(([, at, db], i) => {
    const ms = Math.round(at * 1000);
    fl.push(`[${i + 2}:a]${F},volume=${only ? -120 : db}dB,adelay=${ms}|${ms}[s${i}]`);
    labels.push(`[s${i}]`);
  });
  fl.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.5:attack=4:release=60:level=false,atrim=0:${DUR}[pre]`);
  return [...args, '-filter_complex', fl.join(';'), '-map', '[pre]', '-c:a', 'pcm_f32le'];
}

// steps 2–3 — float premix
const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...buildArgs(), premix], { stdio: 'inherit' });

// step 4 — two-pass loudnorm on the master only
const LN = 'I=-14:TP=-1.5:LRA=11';
const p1 = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:print_format=json -f null - 2>&1`]).toString();
const meas = JSON.parse(p1.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
console.log('master pass 1:', meas.input_i, 'LUFS', meas.input_tp, 'dBTP', 'LRA', meas.input_lra);
const final = path.join(OUT, 'final-mix.wav');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', premix, '-af',
  `loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', final], { stdio: 'inherit' });
const chk = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${final}" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary`]).toString();
console.log('master pass 2:\n' + chk);

// stem check: VO vs music bed level inside the premix (same gains)
const lufs = (f) => execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${f}" -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep "I:" | awk '{print $2}'`]).toString().trim();
for (const st of ['vo', 'music']) {
  const f = path.join(OUT, `stem-${st}.wav`);
  execFileSync('ffmpeg', [...buildArgs(st), f], { stdio: 'inherit' });
  console.log(`premix stem ${st}: ${lufs(f)} LUFS`);
  fs.rmSync(f);
}
