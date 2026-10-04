#!/usr/bin/env node
/**
 * s30 mix — held Atlas VO (never loudnorm'd before the mix, never re-recorded):
 *   1. VO measured (ebur128) → static gain + apad (float)
 *   2. Music: Skyline / Eugenio Mininni (Mixkit 601), the Impossible Journeys bed — static gain computed so
 *      the bed measures 4 LU under s18's original Silent Descent bed (−32.2 LUFS → −36.2 LUFS);
 *      +3 dB lift only in VO gaps ≥ 0.45 s (from transcript.json); a gentle −2 dB on the two darkest
 *      lines (policy; the daughter left behind). No drop-outs, no stingers. Short tail fade for the loop.
 *   3. SFX: sparse beat cues (see CUES), tails trimmed, static gains well under the VO; long VO-only stretches
 *   → float amix (normalize=0) → peak safety limiter → TWO-PASS loudnorm on the MASTER only
 *     (−14 LUFS, −1.5 dBTP, linear)
 * Usage: node mix.mjs  → out/premix.wav, out/final-mix.wav, out/loudnorm-report.txt
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(EP, 'out');
fs.mkdirSync(OUT, { recursive: true });
const tr = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8'));
const DUR = tr.duration; // 94.392
const VO = path.join(EP, 'audio', 'vo.mp3');
const MUSIC = path.join(EP, 'music', 'music.mp3');
const VO_TARGET = -18.0;
const S18_BED_LUFS = -32.2; // s18 Silent Descent original bed (measured in the s23 build, ebur128)
const BED_TARGET = S18_BED_LUFS - 4;
const GAP_LIFT_DB = 3.0;

const lufs = (f, extra = '') => {
  const r = execFileSync('bash', ['-c', `ffmpeg -hide_banner ${extra} -i "${f}" -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep "I:"`]).toString();
  return +r.match(/-?[\d.]+/)[0];
};
const report = [];
const log = (s) => {
  console.log(s);
  report.push(s);
};

const VO_RAW = lufs(VO);
const VO_GAIN_DB = +(VO_TARGET - VO_RAW).toFixed(1);
log(`VO measured ${VO_RAW} LUFS → static gain ${VO_GAIN_DB >= 0 ? '+' : ''}${VO_GAIN_DB} dB (no loudnorm pre-mix)`);
const MUSIC_RAW = lufs(MUSIC, `-t ${DUR}`);
const MUSIC_DB = +(BED_TARGET - MUSIC_RAW).toFixed(1);
log(`Music (Skyline, Mixkit 601) window measured ${MUSIC_RAW} LUFS → static ${MUSIC_DB} dB (bed target ${BED_TARGET} LUFS = s18 bed −4 LU)`);

const words = tr.words;
const gaps = [[-1, words[0].start - 0.05]];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end;
  const b = words[i + 1].start;
  if (b - a >= 0.45) gaps.push([a + 0.05, b - 0.05]);
}
gaps.push([words[words.length - 1].end + 0.05, DUR + 1]);
const lift = gaps.map(([a, b]) => `clip((t-${a.toFixed(2)})/0.12,0,1)*clip((${b.toFixed(2)}-t)/0.12,0,1)`).join('+');
const dip = (a, b) => `clip((t-${a})/0.8,0,1)*clip((${b}-t)/0.8,0,1)`;
const musicExpr = `pow(10,(${MUSIC_DB}+${GAP_LIFT_DB}*min(1,${lift})-2*(${dip(19.4, 25.3)}+${dip(76.6, 82.0)}))/20)`;

// [file, at (s), gain dB, max length s] — sparse, intentional, under the voice
const CUES = [
  ['impact_hit.mp3', 0.0, -19, 2.0], // frame-1 hook (1,600 km. NO MAP)
  ['whoosh_2.mp3', 4.3, -29, 0.9], // camera lifts to show the way home
  ['thud.mp3', 29.55, -25, 0.6], // the camp pin lands
  ['typewriter_tick.mp3', 32.7, -29, 0.3], // day 1
  ['riser.mp3', 35.3, -31, 3.2], // the fence draws itself across the state
  ['thud.mp3', 60.92, -28, 0.6], // Gracie's trail stops (no capture shown)
  ['impact_hit.mp3', 66.24, -28, 1.8], // Home.
  ['whoosh_1.mp3', 86.9, -28, 1.0], // pull back to the master map
  ['whoosh_2.mp3', 92.96, -26, 0.9], // loop swoop back to frame 1
];

const F = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
function buildArgs(only) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  args.push('-i', VO);
  args.push('-t', String(DUR + 1), '-i', MUSIC);
  CUES.forEach(([f]) => args.push('-i', path.join(EP, 'sfx', f)));
  const fl = [];
  fl.push(`[0:a]${F},volume=${only === 'music' || only === 'sfx' ? -120 : VO_GAIN_DB}dB,apad=whole_dur=${DUR}[vo]`);
  fl.push(`[1:a]${F},volume='${musicExpr}':eval=frame,volume=${only === 'vo' || only === 'sfx' ? -120 : 0}dB,afade=t=in:st=0:d=0.05,afade=t=out:st=${(DUR - 0.3).toFixed(3)}:d=0.3[mus]`);
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

const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...buildArgs(), premix], { stdio: 'inherit' });

const LN = 'I=-14:TP=-1.5:LRA=11';
const p1 = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${premix}" -af loudnorm=${LN}:print_format=json -f null - 2>&1`]).toString();
const meas = JSON.parse(p1.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
log(`master pass 1: ${meas.input_i} LUFS · ${meas.input_tp} dBTP · LRA ${meas.input_lra} · thresh ${meas.input_thresh} · offset ${meas.target_offset}`);
const final = path.join(OUT, 'final-mix.wav');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', premix, '-af',
  `loudnorm=${LN}:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s16le', final], { stdio: 'inherit' });
const chk = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${final}" -af ebur128=peak=true -f null - 2>&1 | grep -A15 Summary`]).toString();
log('master pass 2 (ebur128 on final-mix.wav):\n' + chk.trim());

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
  log(`premix stem ${st}: I ${res[st].I} LUFS · sample peak ${res[st].peak} dBFS · max short-term ${res[st].sMax.toFixed(1)} LUFS`);
  fs.rmSync(f);
}
log(`SFX peak under VO peak: ${(res.vo.peak - res.sfx.peak).toFixed(1)} dB · SFX max short-term under VO max short-term: ${(res.vo.sMax - res.sfx.sMax).toFixed(1)} LU`);
log(`SFX: ${new Set(CUES.map(([f]) => f)).size} cue types, ${CUES.length} events; no music drop-outs, no stingers`);
fs.writeFileSync(path.join(OUT, 'loudnorm-report.txt'), report.join('\n') + '\n');
