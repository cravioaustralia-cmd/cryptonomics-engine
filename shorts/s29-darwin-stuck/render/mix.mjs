#!/usr/bin/env node
/**
 * s29 mix — held Atlas VO (never loudnorm'd before the mix):
 *   VO: measured → static gain + apad → float
 *   Music (Silent Descent, Mixkit 614, from 26 s so the swell lands on "trap … said no"):
 *     static gain −23 dB (s18 bed was −19 dB → ~4 dB quieter, per brief)
 *     + deterministic envelope: +3.5 dB lifts in VO gaps (from transcript.json), −4 dB trim on the late swell
 *   SFX: 10 intentional cues, static gains, trimmed tails
 *   → float amix (normalize=0) → master peak limiter (−6 dBFS, keeps pass 2 linear)
 *   → TWO-PASS loudnorm on the MASTER only (−14 LUFS, −1.5 dBTP)
 * Writes out/premix.wav, out/final-mix.wav and final/loudnorm-report.txt
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
const FINAL = path.join(EP, 'final');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FINAL, { recursive: true });
const DUR = 51.9;
const MUSIC_OFFSET = 26;
const MUSIC_DB = -23;
const VO_TARGET_PREMIX = -17.6; // LUFS of the VO stem inside the premix (same seat as s18)

const sh = (cmd) => execFileSync('bash', ['-c', cmd]).toString();
// 1) measure the held VO (integrated loudness) → static gain
const voPath = path.join(EP, 'audio', 'vo.mp3');
const voI = parseFloat(sh(`ffmpeg -hide_banner -nostats -i "${voPath}" -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep -m1 " I:"`).match(/-?[\d.]+/)[0]);
const VO_GAIN_DB = +(VO_TARGET_PREMIX - voI).toFixed(2);
console.log(`VO measured ${voI} LUFS → static gain ${VO_GAIN_DB} dB`);

// 2) music envelope from transcript gaps
const words = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).words;
const gaps = [[-1, words[0].start - 0.05]];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end, b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
gaps.push([words[words.length - 1].end + 0.05, DUR + 1]);
const lift = gaps.map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`).join('+');
const musicExpr = `pow(10,(${MUSIC_DB}-4*clip((t-41.5)/2.0,0,1)+3.5*min(1,${lift}))/20)`;

// 3) SFX — [file, at (s), gain dB, trim (s) or 0]
const CUES = [
  ['impact_hit.mp3', 0.0, -12, 1.6],     // hook slam (frame 1, ROAD TO NOWHERE)
  ['paper_rustle.mp3', 4.85, -8, 1.4],   // gag 1: the map shrugs
  ['whoosh_1.mp3', 16.15, -10, 0],       // "But then look south" whip
  ['thud.mp3', 24.34, -3, 0],            // gag 2: DEAD END sign at Birdum
  ['sad_horn_toot.wav', 32.30, -5, 0],   // gag 3: sad horn toot (VO gap 32.28–32.72)
  ['paper_rustle.mp3', 34.8, -13, 2.3],  // gag 4: tumbleweed
  ['impact_hit.mp3', 44.42, -13, 1.5],   // NO stamp
  ['text_pop.mp3', 47.30, -7, 0],        // gag 5: envelope 2
  ['text_pop.mp3', 47.48, -9, 0],        // gag 5: envelope 3
  ['whoosh_2.mp3', 50.92, -12, 0],       // "Because remember:" whip back → loop
];

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
args.push('-i', voPath);
args.push('-ss', String(MUSIC_OFFSET), '-t', String(DUR + 1), '-i', path.join(EP, 'audio', 'music.mp3'));
CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f)));
const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const fl = [];
fl.push(`[0:a]${F},volume=${VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,afade=t=in:st=0:d=0.08,afade=t=out:st=${(DUR - 0.3).toFixed(3)}:d=0.3[mus]`);
const labels = ['[vo]', '[mus]'];
CUES.forEach(([, at, db, trim], i) => {
  const ms = Math.round(at * 1000);
  const tr = trim ? `,atrim=0:${trim},afade=t=out:st=${(trim - 0.35).toFixed(2)}:d=0.35` : '';
  fl.push(`[${i + 2}:a]${F}${tr},volume=${db}dB,adelay=${ms}|${ms}[s${i}]`);
  labels.push(`[s${i}]`);
});
fl.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.5:attack=4:release=60:level=false,atrim=0:${DUR}[pre]`);
const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...args, '-filter_complex', fl.join(';'), '-map', '[pre]', '-c:a', 'pcm_f32le', premix], { stdio: 'inherit' });

// 4) two-pass loudnorm on the master only
const LN = 'I=-14:TP=-1.5:LRA=11';
const p1 = sh(`ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:print_format=json -f null - 2>&1`);
const meas = JSON.parse(p1.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
console.log('pass1', meas.input_i, 'LUFS', meas.input_tp, 'dBTP');
const final = path.join(OUT, 'final-mix.wav');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', premix, '-af',
  `loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true:print_format=json,aresample=48000`,
  '-c:a', 'pcm_s16le', final], { stdio: 'inherit' });
const p2 = sh(`ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true:print_format=json -f null - 2>&1`);
const pass2 = JSON.parse(p2.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
const chk = sh(`ffmpeg -hide_banner -nostats -i "${final}" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary`);
console.log(chk);
const report = [
  '# s29 Darwin Stuck — master loudnorm report',
  `# generated ${new Date().toISOString()} by render/mix.mjs`,
  '',
  `VO (held Atlas, untouched) integrated: ${voI} LUFS → static gain ${VO_GAIN_DB} dB (premix seat ${VO_TARGET_PREMIX} LUFS)`,
  `Music: Silent Descent (Mixkit 614) from ${MUSIC_OFFSET}s at ${MUSIC_DB} dB (s18 bed −19 dB → 4 dB quieter), +3.5 dB VO-gap lifts, −4 dB late-swell trim`,
  `SFX cues: ${CUES.length}`,
  '',
  '## Pass 1 (premix measurement)',
  JSON.stringify(meas, null, 1),
  '',
  '## Pass 2 (linear loudnorm on master)',
  JSON.stringify(pass2, null, 1),
  '',
  '## Final master check (ebur128, true peak)',
  chk.trim(),
].join('\n');
fs.writeFileSync(path.join(FINAL, 'loudnorm-report.txt'), report + '\n');
console.log('wrote', final);
