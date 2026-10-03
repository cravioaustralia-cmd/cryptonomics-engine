#!/usr/bin/env node
/** Render chosen timestamps through the exact capture page and tile them into a labelled sheet.
 *   node preview.mjs out.jpg t1 t2 ...      |   node preview.mjs out.jpg --n 24 (evenly spaced) */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openEpisodePage } from '../../shared/render/capture.mjs';
const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2]);
let times = process.argv.slice(3).map(Number);
if (process.argv[3] === '--n') {
  const n = +process.argv[4];
  const dur = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'))).duration;
  times = Array.from({ length: n }, (_, i) => +((i + 0.5) * (dur / n)).toFixed(2));
}
const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.pv-'));
const { page, close } = await openEpisodePage(EP);
page.on('pageerror', (e) => console.log('ERR', e.message));
const files = [];
for (const t of times) {
  await page.evaluate((x) => window.renderFrame(x), t);
  const f = path.join(tmp, `f${files.length}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
  files.push([f, t]);
}
await close();
const cols = Math.min(6, files.length);
const lab = files.map(([, t], i) => `[${i}:v]scale=360:640,drawtext=text='${t.toFixed(2)}s':x=8:y=8:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`).join(';');
const layout = files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...files.flatMap(([f]) => ['-i', f]), '-filter_complex',
  files.length > 1 ? `${lab};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black` : lab.replace(/\[v0\]$/, ''), '-q:v', '3', out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('sheet →', out);
