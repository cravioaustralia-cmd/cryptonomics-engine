#!/usr/bin/env node
/**
 * s25 mix — held Atlas VO (never loudnorm'd before the mix):
 *   1. VO measured (ebur128) → static gain + apad (float)
 *   2. Music: Better Times Are Coming / Alejandro Magaña (Mixkit 173) from 0 s — static gain computed so the
 *      bed measures 4 LU under s18's original Silent Descent bed (−32.2 LUFS → −36.2 LUFS);
 *      +3 dB lift only in VO gaps ≥ 0.45 s (from transcript.json); short tail fade for the loop
 *   3. SFX: sparse beat cues (see CUES), tails trimmed, static gains well under the VO
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
const DUR = tr.duration; // 87.336
const VO = path.join(EP, 'audio', 'vo.mp3');
const MUSIC = path.join(EP, 'music', 'music.mp3');
const VO_TARGET = -18.0; // premix VO level; static gain derived from the measurement below
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

// step 1 — measure the VO; static gain only
const VO_RAW = lufs(VO);
const VO_GAIN_DB = +(VO_TARGET - VO_RAW).toFixed(1);
log(`VO measured ${VO_RAW} LUFS → static gain ${VO_GAIN_DB >= 0 ? '+' : ''}${VO_GAIN_DB} dB (no loudnorm pre-mix)`);
const MUSIC_RAW = lufs(MUSIC, `-t ${DUR}`);
const MUSIC_DB = +(BED_TARGET - MUSIC_RAW).toFixed(1);
log(`Music window measured ${MUSIC_RAW} LUFS → static ${MUSIC_DB} dB (bed target ${BED_TARGET} LUFS = s18 bed −4 LU)`);

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

// Sparse SFX (user lock 2026-09-30): intentional beat cues only, no text-pop / typewriter chatter.
// [file, at (s), gain dB, max length s]
const DING0 = 61.78; // shoe counter: 1 → 10, one ding per tick (matches scenes.js SHOE_T0 / SHOE_DT)
const DING_DT = 0.16;
const CUES = [
  ['impact_hit.mp3', 0.0, -19, 2.2], // frame-1 hook slam 61 · GUMBOOTS
  ['whoosh_1.mp3', 13.95, -26, 1.1], // route map flies in (Sydney → Melbourne)
  ['impact_hit.mp3', 17.06, -29, 1.3], // 875 KM lands
  ['whoosh_2.mp3', 31.78, -22, 0.9], // pros speed off
  ['zzz_soft.wav', 39.2, -27, 1.6], // Gag 2 — pros asleep
  ['text_pop.mp3', 48.0, -21, 0.5], // Gag 3 — guilty alarm clock pops up
  ...Array.from({ length: 10 }, (_, k) => ['ding.wav', +(DING0 + k * DING_DT).toFixed(2), -27 + k * 0.4, 0.5]), // Gag 4 — shoe counter 1 → 10
  ['riser.mp3', 72.3, -30, 2.1], // crossing the line
  ['impact_hit.mp3', 74.44, -22, 1.8], // First.
  ['confetti_pop.wav', 74.46, -24, 1.2], // Gag 5 — confetti burst
  ['whoosh_1.mp3', 86.95, -25, 0.9], // loop whip back to frame 1
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

// float premix
const premix = path.join(OUT, 'premix.wav');
execFileSync('ffmpeg', [...buildArgs(), premix], { stdio: 'inherit' });

// two-pass loudnorm on the master only
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
const nDing = CUES.filter(([f]) => f === 'ding.wav').length;
log(`SFX: ${CUES.length - nDing} beat cues + ${nDing} shoe-counter dings (one staged gag, 1 → 10)`);
fs.writeFileSync(path.join(OUT, 'loudnorm-report.txt'), report.join('\n') + '\n');
