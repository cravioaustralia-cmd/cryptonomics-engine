#!/usr/bin/env node
/**
 * s22 mix — held Atlas VO (never loudnorm'd before the mix):
 *   1. VO measured at −23.0 LUFS integrated (ebur128) → static +5 dB gain + apad (float)
 *   2. Music: Fallen (Asper) / Eugenio Mininni (Mixkit) — static −23 dB bed
 *      (4 dB quieter than s18's −19 dB Silent Descent bed) + gentle +3.5 dB lift
 *      only in VO gaps ≥ 0.45 s (from transcript.json); 0.25 s tail fade for the loop
 *   3. SFX: 8 sparse beat cues (remaster), impact tails trimmed, static gains 10–14+ dB under VO peak
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

// Remaster (Checkpoint C redo): sparse SFX bed. 8 cues only, each earning a beat.
// No text pops, typewriter ticks, rustles or stacked whooshes; VO-only stretches stay clean.
// [file, at (s), gain dB, max length s] — impact tails trimmed so booms never smear under VO
const CUES = [
  ['impact_hit', 0.0, -20, 2.2], // frame-1 hook slam (THREE SURVIVORS)
  ['impact_hit', 6.86, -27, 1.6], // 1878 slam — sits in the VO gap before "1878"
  ['impact_hit', 8.98, -18, 2.2], // the Loch Ard hits rocks
  ['riser', 21.6, -30, 2.6], // rescue swell → lands on "shore"
  ['impact_hit', 24.2, -26, 1.6], // dragged ashore
  ['riser', 26.75, -30, 2.6], // "the third survivor?" build
  ['impact_hit', 29.28, -21, 2.2], // peacock iris reveal
  ['whoosh_1', 39.5, -27, 1.2], // loop whip back into frame 1 (hook slam then re-fires at 0.0)
];

const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
function buildArgs(only) {
  // only: undefined (full mix) | 'vo' | 'music' | 'sfx' — stems for level checks
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  args.push('-i', VO);
  args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', MUSIC);
  CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f + '.mp3')));
  const fl = [];
  fl.push(`[0:a]${F},volume=${only === 'music' || only === 'sfx' ? -120 : VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
  fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,volume=${only === 'vo' || only === 'sfx' ? -120 : 0}dB,afade=t=in:st=0:d=0.08,afade=t=out:st=${(DUR - 0.25).toFixed(3)}:d=0.25[mus]`);
  const labels = ['[vo]', '[mus]'];
  CUES.forEach(([, at, db, len], i) => {
    const ms = Math.round(at * 1000);
    const g = only && only !== 'sfx' ? -120 : db;
    fl.push(`[${i + 2}:a]${F},atrim=0:${len},afade=t=out:st=${(len * 0.55).toFixed(2)}:d=${(len * 0.45).toFixed(2)},volume=${g}dB,adelay=${ms}|${ms}[s${i}]`);
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

// stem check (same gains, inside the premix): loudness, sample peak, max short-term loudness
const stat = (f) => {
  const r = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${f}" -af ebur128=peak=sample -f null - 2>&1`]).toString();
  const I = r.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0];
  const pk = r.match(/Peak:\s+(-?[\d.inf]+) dBFS/g).pop().match(/-?[\d.]+|-inf/)[0];
  const sMax = Math.max(...[...r.matchAll(/ S:\s*(-?[\d.]+)/g)].map((m) => +m[1]).filter((v) => v > -70));
  return { I: +I, peak: +pk, sMax };
};
const res = {};
for (const st of ['vo', 'music', 'sfx']) {
  const f = path.join(OUT, `stem-${st}.wav`);
  execFileSync('ffmpeg', [...buildArgs(st), f], { stdio: 'inherit' });
  res[st] = stat(f);
  console.log(`premix stem ${st}: I ${res[st].I} LUFS · sample peak ${res[st].peak} dBFS · max short-term ${res[st].sMax.toFixed(1)} LUFS`);
  fs.rmSync(f);
}
console.log(`SFX peak under VO peak: ${(res.vo.peak - res.sfx.peak).toFixed(1)} dB · SFX max short-term under VO max short-term: ${(res.vo.sMax - res.sfx.sMax).toFixed(1)} LU`);
