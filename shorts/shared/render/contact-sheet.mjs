#!/usr/bin/env node
/**
 * Contact sheet before the final render.
 *   node contact-sheet.mjs <episodeDir> [outSubdir] [t1 t2 ...]
 * Default times: every 2 s. Writes PNG frames plus sheet.jpg (4-wide grid) to out/<outSubdir>/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { captureStills } from './capture.mjs';

const [dirArg, sub = 'contact', ...ts] = process.argv.slice(2);
const episodeDir = path.resolve(dirArg || '.');
const config = JSON.parse(fs.readFileSync(path.join(episodeDir, 'render', 'config.json'), 'utf8'));
let times = ts.map(Number).filter((x) => !Number.isNaN(x));
if (!times.length) for (let t = 0.5; t < config.duration; t += 2) times.push(Math.round(t * 100) / 100);
const outDir = path.join(episodeDir, 'out', sub);
fs.rmSync(outDir, { recursive: true, force: true });
const files = await captureStills({ episodeDir, outDir, times });
const cols = 4;
const rows = Math.ceil(files.length / cols);
const r = spawnSync(
  'ffmpeg',
  [
    '-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(outDir, 't*.png'),
    '-vf', `scale=270:480,drawtext=text='%{n}':x=8:y=8:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=4`,
    '-frames:v', '1', path.join(outDir, 'sheet.jpg'),
  ],
  { stdio: 'inherit' }
);
if (r.status !== 0) {
  // drawtext may be unavailable (no fontconfig) — retry without labels.
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(outDir, 't*.png'),
    '-vf', `scale=270:480,tile=${cols}x${rows}:padding=4`, '-frames:v', '1', path.join(outDir, 'sheet.jpg')], { stdio: 'inherit' });
}
console.log(`${files.length} frames → ${outDir}`);
