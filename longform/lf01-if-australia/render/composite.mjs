#!/usr/bin/env node
/**
 * lf01 assembly (ffmpeg only): map plates + 12 B-roll zoom-throughs + badge + B01 label + final mix.
 *
 * Each clip: trimmed to its Part 2 length (never longer), scaled to COVER 1920×1080 (no pillarbox),
 * then alpha-merged with its iris mask so it opens out of the pin (0.3 s) and shrinks back into it
 * while the map camera pulls out underneath. Times come from out/score.json (Whisper-locked).
 *
 *   node composite.mjs            → out/master.mp4 (x264 CRF 16, archive) + final/lf01-if-australia.mp4 (< 95 MB)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const R = path.dirname(new URL(import.meta.url).pathname);
const EP = path.resolve(R, '..');
const OUT = path.join(EP, 'out');
const SC = JSON.parse(fs.readFileSync(path.join(OUT, 'score.json'), 'utf8'));
const tArg = process.argv.indexOf('--t');
const D = tArg > 0 ? +process.argv[tArg + 1] : SC.duration;
const probe = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

const inputs = ['-i', path.join(OUT, 'map.mp4'), '-i', path.join(OUT, 'final-mix.wav'),
  '-loop', '1', '-framerate', '30', '-t', String(D), '-i', path.join(OUT, 'overlay', 'badge.png'),
  '-loop', '1', '-framerate', '30', '-t', String(D), '-i', path.join(OUT, 'overlay', 'dramatised.png')];
let idx = 4;
const fl = [];
let base = '[0:v]';
const report = [];
for (const b of SC.broll.filter((x) => x.t < D)) {
  const src = path.join(EP, 'broll', `${b.id}.mp4`);
  const srcDur = probe(src);
  const ss = Math.max(0, Math.min(0.5, srcDur - b.dur)); // skip the generation's first frames when there is room
  inputs.push('-i', src, '-i', path.join(OUT, 'overlay', `iris_${b.id}.mkv`));
  const ci = idx++, mi = idx++;
  const T0 = b.t.toFixed(3);
  fl.push(`[${ci}:v]trim=start=${ss.toFixed(3)}:duration=${b.dur},setpts=PTS-STARTPTS,fps=30,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1,format=yuva420p[c${ci}]`);
  fl.push(`[${mi}:v]format=gray,trim=duration=${b.dur},setpts=PTS-STARTPTS[m${ci}]`);
  fl.push(`[c${ci}][m${ci}]alphamerge,setpts=PTS+${T0}/TB[k${ci}]`);
  fl.push(`${base}[k${ci}]overlay=eof_action=pass:enable='between(t,${T0},${(b.t + b.dur).toFixed(3)})'[v${ci}]`);
  base = `[v${ci}]`;
  report.push({ id: b.id, at: b.t, dur: b.dur, srcIn: ss, srcDur });
}
const b01 = SC.broll.find((b) => b.id === 'B01');
fl.push(`${base}[3:v]overlay=0:0:enable='between(t,${(b01.t + 0.3).toFixed(3)},${(b01.t + b01.dur - 0.35).toFixed(3)})'[vl]`);
fl.push(`[vl][2:v]overlay=0:0,format=yuv420p[vout]`);

fs.mkdirSync(path.join(EP, 'final'), { recursive: true });
const master = path.join(OUT, 'master.mp4');
const args = ['-y', '-hide_banner', '-loglevel', 'warning', '-stats', ...inputs, '-filter_complex', fl.join(';'), '-map', '[vout]', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(D), '-movflags', '+faststart', master];
if (!process.argv.includes('--skip-master')) {
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
if (process.argv.includes('--master-only')) process.exit(0);
// deliverable: HEVC, two-pass to fit under GitHub's 100 MB file limit
const final = path.join(EP, 'final', 'lf01-if-australia.mp4');
const targetMB = 94, aK = 160;
const vK = Math.floor((targetMB * 8 * 1024) / D - aK);
const x265 = (pass) => ['-y', '-hide_banner', '-loglevel', 'warning', '-stats', '-i', master, '-c:v', 'libx265', '-preset', 'medium', '-b:v', `${vK}k`,
  '-x265-params', `pass=${pass}:stats=${path.join(OUT, 'x265.log')}:aq-mode=3:log-level=error`, '-tag:v', 'hvc1', '-pix_fmt', 'yuv420p',
  ...(pass === 1 ? ['-an', '-f', 'null', '/dev/null'] : ['-c:a', 'aac', '-b:a', `${aK}k`, '-movflags', '+faststart', final])];
for (const pass of [1, 2]) { const r = spawnSync('ffmpeg', x265(pass), { stdio: 'inherit' }); if (r.status) process.exit(r.status); }
fs.writeFileSync(path.join(OUT, 'broll-placement.json'), JSON.stringify(report, null, 1));
console.log('master →', master, '\nfinal  →', final, `(${(fs.statSync(final).size / 1048576).toFixed(1)} MB, video ${vK} kb/s HEVC)`);
