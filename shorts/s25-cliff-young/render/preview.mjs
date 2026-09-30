#!/usr/bin/env node
/**
 * Render chosen timestamps to JPEGs (same page/render path as the final capture)
 * and optionally tile them into a contact sheet.
 *   node preview.mjs out_dir t1 t2 ...        (times in seconds)
 *   node preview.mjs --sheet out.jpg N        (N evenly spaced frames + labelled sheet)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openEpisodePage } from '../../shared/render/capture.mjs';

const EP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
let outDir;
let times;
let sheet = null;
if (args[0] === '--sheet') {
  sheet = path.resolve(args[1]);
  const n = Number(args[2] || 24);
  const dur = JSON.parse(fs.readFileSync(path.join(EP, 'transcript.json'), 'utf8')).duration;
  outDir = fs.mkdtempSync(path.join(path.dirname(sheet), '.sheet-'));
  times = Array.from({ length: n }, (_, i) => +((i + 0.5) * (dur / n)).toFixed(2));
} else {
  outDir = path.resolve(args[0]);
  times = args.slice(1).map(Number);
}
fs.mkdirSync(outDir, { recursive: true });
const { page, close } = await openEpisodePage(EP);
const files = [];
for (const t of times) {
  await page.evaluate((x) => window.renderFrame(x), t);
  const f = path.join(outDir, `f_${t.toFixed(2).padStart(6, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 88 });
  files.push([f, t]);
}
await close();
if (sheet) {
  const cols = 6;
  const inputs = files.flatMap(([f]) => ['-i', f]);
  const lab = files
    .map(([, t], i) => `[${i}:v]scale=270:480,drawtext=text='${t.toFixed(2)}s':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`)
    .join(';');
  const layout = files.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex',
    `${lab};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, '-q:v', '3', sheet]);
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log('sheet →', sheet);
} else console.log(files.map(([f]) => f).join('\n'));
